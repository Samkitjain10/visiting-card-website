const express = require('express');
const { prisma } = require('../lib/db');
const { createVCF } = require('../lib/vcf');
const { authenticateToken } = require('../middleware/auth');
const { logActivity } = require('../lib/activity-logger');

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// GET /export - Export contacts as VCF
router.get('/', async (req, res) => {
  try {
    const filter = req.query.filter || 'all'; // all, unsent, sent

    const where = {
      userId: req.user.id,
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
      return res.status(400).json({
        error: 'All contacts are already sent',
      });
    }

    // Check if sent filter is selected and there are no sent contacts
    if (filter === 'sent' && contacts.length === 0) {
      return res.status(400).json({
        error: 'No sent contacts found',
      });
    }

    // Convert to VCF format
    const vcfContacts = contacts.map((c) => ({
      name: c.companyName,
      company: c.companyName,
      phones: [c.phone1, c.phone2, c.phone3].filter(Boolean),
      email: c.email || '',
      address: c.address || '',
      note: c.note || '',
    }));

    const vcfContent = createVCF(vcfContacts);

    // Mark as sent if exporting unsent
    if (filter === 'unsent' || filter === 'all') {
      await prisma.contact.updateMany({
        where: {
          userId: req.user.id,
          sent: false,
        },
        data: {
          sent: true,
        },
      });
    }

    // Log export activity
    await logActivity(
      req.user.id,
      'exported',
      null,
      `Exported ${contacts.length} contact(s) as VCF (filter: ${filter})`,
      { count: contacts.length, filter }
    );

    res.setHeader('Content-Type', 'text/vcard');
    res.setHeader('Content-Disposition', `attachment; filename="contacts_${Date.now()}.vcf"`);
    res.send(vcfContent);
  } catch (error) {
    console.error('Error exporting contacts:', error);
    res.status(500).json({
      error: error.message || 'Failed to export contacts',
    });
  }
});

module.exports = router;

