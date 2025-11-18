const express = require('express');
const multer = require('multer');
const { prisma } = require('../lib/db');
const { extractContactInfo } = require('../lib/ocr');
const { authenticateToken } = require('../middleware/auth');
const { logActivity } = require('../lib/activity-logger');
const { writeFile, unlink } = require('fs/promises');
const { join } = require('path');
const { tmpdir } = require('os');

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
});

// POST /upload - Upload and process visiting card image
router.post('/', upload.fields([
  { name: 'file', maxCount: 1 },
  { name: 'frontFile', maxCount: 1 },
  { name: 'backFile', maxCount: 1 },
]), async (req, res) => {
  try {
    const mode = req.body.mode || 'single';
    const tempDir = tmpdir();
    let contact;

    if (mode === 'both') {
      // Handle both-side mode
      const frontFile = req.files?.frontFile?.[0];
      const backFile = req.files?.backFile?.[0];

      if (!frontFile || !backFile) {
        return res.status(400).json({ error: 'Both front and back files are required' });
      }

      // Save front file to temp directory
      const frontFilename = `${Date.now()}_front_${frontFile.originalname}`;
      const frontFilepath = join(tempDir, frontFilename);
      await writeFile(frontFilepath, frontFile.buffer);

      // Save back file to temp directory
      const backFilename = `${Date.now()}_back_${backFile.originalname}`;
      const backFilepath = join(tempDir, backFilename);
      await writeFile(backFilepath, backFile.buffer);

      // Extract contact info from both sides
      let frontContactInfo;
      try {
        frontContactInfo = await extractContactInfo(frontFilepath);
      } catch (ocrError) {
        console.error('Front OCR extraction failed:', ocrError);
        await unlink(frontFilepath).catch(() => {});
        await unlink(backFilepath).catch(() => {});
        throw new Error(`Front OCR extraction failed: ${ocrError.message}`);
      }

      let backContactInfo;
      try {
        backContactInfo = await extractContactInfo(backFilepath);
      } catch (ocrError) {
        console.error('Back OCR extraction failed:', ocrError);
        await unlink(frontFilepath).catch(() => {});
        await unlink(backFilepath).catch(() => {});
        throw new Error(`Back OCR extraction failed: ${ocrError.message}`);
      }

      // Delete temporary files after OCR
      try {
        await unlink(frontFilepath);
        await unlink(backFilepath);
      } catch (error) {
        console.error('Error deleting temp files:', error);
      }

      // Combine contact info
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

      const uniquePhones = Array.from(new Set(allPhones));

      // Check for existing contact with same phone number
      const existingContact = await prisma.contact.findFirst({
        where: {
          userId: req.user.id,
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
        return res.json({
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
            address: existingContact.address,
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

      // Save to database
      contact = await prisma.contact.create({
        data: {
          userId: req.user.id,
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

      // Log upload activity
      await logActivity(
        req.user.id,
        'uploaded',
        contact.id,
        `Uploaded visiting card (both sides): ${contact.companyName}`
      );
    } else {
      // Handle single or multiple mode
      const file = req.files?.file?.[0];

      if (!file) {
        return res.status(400).json({ error: 'No file provided' });
      }

      // Save file to temp directory
      const filename = `${Date.now()}_${file.originalname}`;
      const filepath = join(tempDir, filename);
      await writeFile(filepath, file.buffer);

      // Extract contact info
      let contactInfo;
      try {
        contactInfo = await extractContactInfo(filepath);
      } catch (ocrError) {
        console.error('OCR extraction failed:', ocrError);
        await unlink(filepath).catch(() => {});
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
          userId: req.user.id,
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
        return res.json({
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
            address: existingContact.address,
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
          userId: req.user.id,
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

      // Log upload activity
      await logActivity(
        req.user.id,
        'uploaded',
        contact.id,
        `Uploaded visiting card: ${contact.companyName}`
      );
    }

    if (!contact) {
      return res.status(500).json({
        error: 'Failed to create contact',
      });
    }

    res.json({
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
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      error: error.message || 'Failed to process image',
    });
  }
});

module.exports = router;

