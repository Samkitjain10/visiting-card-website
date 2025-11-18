import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { createVCF } from '@/lib/vcf';

export async function GET(request: NextRequest) {
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

    const searchParams = request.nextUrl.searchParams;
    const filter = searchParams.get('filter') || 'all'; // all, unsent, sent

    const where: any = {
      userId: user.id,
    };

    if (filter === 'unsent') {
      where.sent = false;
    } else if (filter === 'sent') {
      where.sent = true;
    }

    const contacts = await prisma.contact.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    // Check if unsent filter is selected and there are no unsent contacts
    if (filter === 'unsent' && contacts.length === 0) {
      return NextResponse.json(
        { error: 'All contacts are already sent' },
        { status: 400 }
      );
    }

    // Check if sent filter is selected and there are no sent contacts
    if (filter === 'sent' && contacts.length === 0) {
      return NextResponse.json(
        { error: 'No sent contacts found' },
        { status: 400 }
      );
    }

    // Convert to VCF format
    const vcfContacts = contacts.map((c) => ({
      name: c.companyName,
      company: c.companyName,
      phones: [c.phone1, c.phone2, c.phone3].filter(Boolean) as string[],
      email: c.email || '',
      address: c.address || '',
      note: c.note || '',
    }));

    const vcfContent = createVCF(vcfContacts);

    // Mark as sent if exporting unsent
    if (filter === 'unsent' || filter === 'all') {
      await prisma.contact.updateMany({
        where: {
          userId: user.id,
          sent: false,
        },
        data: {
          sent: true,
        },
      });
    }

    return new NextResponse(vcfContent, {
      headers: {
        'Content-Type': 'text/vcard',
        'Content-Disposition': `attachment; filename="contacts_${Date.now()}.vcf"`,
      },
    });
  } catch (error: any) {
    console.error('Error exporting contacts:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to export contacts' },
      { status: 500 }
    );
  }
}

