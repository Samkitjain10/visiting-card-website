import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { extractContactInfo } from '@/lib/ocr';
import { writeFile, unlink } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const formData = await request.formData();
    const mode = formData.get('mode') as string || 'single';

    // Use temporary directory for processing (files will be deleted after OCR)
    const tempDir = tmpdir();

    let contact;

    if (mode === 'both') {
      // Handle both-side mode
      const frontFile = formData.get('frontFile') as File;
      const backFile = formData.get('backFile') as File;

      if (!frontFile || !backFile) {
        return NextResponse.json({ error: 'Both front and back files are required' }, { status: 400 });
      }

      // Save front file to temp directory
      const frontBytes = await frontFile.arrayBuffer();
      const frontBuffer = Buffer.from(frontBytes);
      const frontFilename = `${Date.now()}_front_${frontFile.name}`;
      const frontFilepath = join(tempDir, frontFilename);
      await writeFile(frontFilepath, frontBuffer);

      // Save back file to temp directory
      const backBytes = await backFile.arrayBuffer();
      const backBuffer = Buffer.from(backBytes);
      const backFilename = `${Date.now()}_back_${backFile.name}`;
      const backFilepath = join(tempDir, backFilename);
      await writeFile(backFilepath, backBuffer);

      // Extract contact info from both sides
      const frontContactInfo = await extractContactInfo(frontFilepath);
      const backContactInfo = await extractContactInfo(backFilepath);

      // Delete temporary files after OCR
      try {
        await unlink(frontFilepath);
        await unlink(backFilepath);
      } catch (error) {
        console.error('Error deleting temp files:', error);
      }

      // Combine contact info (prefer front side, fill in missing from back)
      const combinedContactInfo = {
        company: frontContactInfo.company || backContactInfo.company || '',
        email: frontContactInfo.email || backContactInfo.email || null,
        website: frontContactInfo.website || backContactInfo.website || null,
        address: frontContactInfo.address || backContactInfo.address || null,
        phones: [...(frontContactInfo.phones || []), ...(backContactInfo.phones || [])],
        rawText: `${frontContactInfo.rawText || ''}\n\n--- Back Side ---\n${backContactInfo.rawText || ''}`.trim(),
      };

      // Clean and deduplicate phone numbers
      const allPhones = combinedContactInfo.phones.map(p => {
        if (!p) return '';
        let cleaned = p.trim().replace(/^\+91[\s-]?/i, '');
        cleaned = cleaned.replace(/[-\s]/g, '');
        return cleaned;
      }).filter(p => p.length > 0);

      // Remove duplicates
      const uniquePhones = Array.from(new Set(allPhones));

      // Check for existing contact with same phone number
      const existingContact = await prisma.contact.findFirst({
        where: {
          userId: user.id,
          OR: [
            ...(uniquePhones[0] ? [{ phone1: uniquePhones[0] }] : []),
            ...(uniquePhones[1] ? [{ phone1: uniquePhones[1] }] : []),
            ...(uniquePhones[2] ? [{ phone1: uniquePhones[2] }] : []),
            ...(uniquePhones[0] ? [{ phone2: uniquePhones[0] }] : []),
            ...(uniquePhones[1] ? [{ phone2: uniquePhones[1] }] : []),
            ...(uniquePhones[2] ? [{ phone2: uniquePhones[2] }] : []),
            ...(uniquePhones[0] ? [{ phone3: uniquePhones[0] }] : []),
            ...(uniquePhones[1] ? [{ phone3: uniquePhones[1] }] : []),
            ...(uniquePhones[2] ? [{ phone3: uniquePhones[2] }] : []),
          ],
        },
      });

      if (existingContact) {
        return NextResponse.json({
          success: false,
          duplicate: true,
          existingContact: {
            id: existingContact.id,
            companyName: existingContact.companyName,
            phone1: existingContact.phone1,
            phone2: existingContact.phone2,
            phone3: existingContact.phone3,
            email: existingContact.email,
            website: existingContact.website,
            note: existingContact.note,
          },
          newContact: {
            companyName: combinedContactInfo.company,
            phone1: uniquePhones[0] || null,
            phone2: uniquePhones[1] || null,
            phone3: uniquePhones[2] || null,
            email: combinedContactInfo.email,
            website: combinedContactInfo.website,
            address: combinedContactInfo.address,
            rawText: combinedContactInfo.rawText,
          },
        });
      }

      // Save to database (single contact for both sides)
      contact = await prisma.contact.create({
        data: {
          userId: user.id,
          companyName: combinedContactInfo.company,
          phone1: uniquePhones[0] || null,
          phone2: uniquePhones[1] || null,
          phone3: uniquePhones[2] || null,
          email: combinedContactInfo.email,
          website: combinedContactInfo.website,
          address: combinedContactInfo.address,
          rawText: combinedContactInfo.rawText,
        },
      });
    } else {
      // Handle single or multiple mode
      const file = formData.get('file') as File;

      if (!file) {
        return NextResponse.json({ error: 'No file provided' }, { status: 400 });
      }

      // Save file to temp directory
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const filename = `${Date.now()}_${file.name}`;
      const filepath = join(tempDir, filename);
      await writeFile(filepath, buffer);

      // Extract contact info
      let contactInfo;
      try {
        contactInfo = await extractContactInfo(filepath);
      } catch (ocrError: any) {
        console.error('OCR extraction failed:', ocrError);
        throw new Error(`OCR extraction failed: ${ocrError.message}`);
      }

      // Delete temporary file after OCR
      try {
        await unlink(filepath);
      } catch (error) {
        console.error('Error deleting temp file:', error);
      }

      // Clean phone numbers
      const phones = contactInfo.phones.map(p => {
        if (!p) return '';
        let cleaned = p.trim().replace(/^\+91[\s-]?/i, '');
        cleaned = cleaned.replace(/[-\s]/g, '');
        return cleaned;
      }).filter(p => p.length > 0);

      // Check for existing contact with same phone number
      const existingContact = await prisma.contact.findFirst({
        where: {
          userId: user.id,
          OR: [
            ...(phones[0] ? [{ phone1: phones[0] }] : []),
            ...(phones[1] ? [{ phone1: phones[1] }] : []),
            ...(phones[2] ? [{ phone1: phones[2] }] : []),
            ...(phones[0] ? [{ phone2: phones[0] }] : []),
            ...(phones[1] ? [{ phone2: phones[1] }] : []),
            ...(phones[2] ? [{ phone2: phones[2] }] : []),
            ...(phones[0] ? [{ phone3: phones[0] }] : []),
            ...(phones[1] ? [{ phone3: phones[1] }] : []),
            ...(phones[2] ? [{ phone3: phones[2] }] : []),
          ],
        },
      });

      if (existingContact) {
        return NextResponse.json({
          success: false,
          duplicate: true,
          existingContact: {
            id: existingContact.id,
            companyName: existingContact.companyName,
            phone1: existingContact.phone1,
            phone2: existingContact.phone2,
            phone3: existingContact.phone3,
            email: existingContact.email,
            website: existingContact.website,
            note: existingContact.note,
          },
          newContact: {
            companyName: contactInfo.company || '',
            phone1: phones[0] || null,
            phone2: phones[1] || null,
            phone3: phones[2] || null,
            email: contactInfo.email || null,
            website: contactInfo.website || null,
            address: contactInfo.address || null,
            rawText: contactInfo.rawText || null,
          },
        });
      }

      // Save to database
      contact = await prisma.contact.create({
        data: {
          userId: user.id,
          companyName: contactInfo.company || '',
          phone1: phones[0] || null,
          phone2: phones[1] || null,
          phone3: phones[2] || null,
          email: contactInfo.email || null,
          website: contactInfo.website || null,
          address: contactInfo.address || null,
          rawText: contactInfo.rawText || null,
        },
      });
    }

          if (!contact) {
            return NextResponse.json(
              { error: 'Failed to create contact' },
              { status: 500 }
            );
          }

          return NextResponse.json({
            success: true,
            contact: {
              id: contact.id,
              companyName: contact.companyName,
              phone1: contact.phone1,
              phone2: contact.phone2,
              phone3: contact.phone3,
              email: contact.email,
              website: contact.website,
              address: contact.address,
              note: contact.note,
              rawText: contact.rawText,
            },
          });
  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process image' },
      { status: 500 }
    );
  }
}

