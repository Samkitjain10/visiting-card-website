const express = require('express');
const { prisma } = require('../lib/db');
const { authenticateToken } = require('../middleware/auth');
const { logActivity } = require('../lib/activity-logger');

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// GET /contacts - Get all contacts with pagination
router.get('/', async (req, res) => {
  try {
    const search = req.query.search || '';
    const sent = req.query.sent;
    const limit = parseInt(req.query.limit || '100');
    const offset = parseInt(req.query.offset || '0');

    const where = {
      userId: req.user.id,
    };

    if (search) {
      where.OR = [
        { companyName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone1: { contains: search } },
        { phone2: { contains: search } },
        { phone3: { contains: search } },
      ];
    }

    if (sent !== null && sent !== undefined) {
      where.sent = sent === 'true';
    }

    const [contacts, total] = await Promise.all([
      prisma.contact.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.contact.count({ where }),
    ]);

    res.json({
      contacts,
      total,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Error fetching contacts:', error);
    res.status(500).json({
      error: error.message || 'Failed to fetch contacts',
    });
  }
});

// POST /contacts - Create a new contact
router.post('/', async (req, res) => {
  try {
    const { companyName, phone1, phone2, phone3, email, website, address, note } = req.body;

    const contact = await prisma.contact.create({
      data: {
        userId: req.user.id,
        companyName: companyName || '',
        phone1: phone1 || null,
        phone2: phone2 || null,
        phone3: phone3 || null,
        email: email || null,
        website: website || null,
        address: address || null,
        note: note || null,
      },
    });

    // Log activity
    await logActivity(
      req.user.id,
      'created',
      contact.id,
      `Created contact: ${contact.companyName}`
    );

    res.json({ success: true, contact });
  } catch (error) {
    console.error('Error creating contact:', error);
    res.status(500).json({
      error: error.message || 'Failed to create contact',
    });
  }
});

// GET /contacts/:id - Get a single contact
router.get('/:id', async (req, res) => {
  try {
    const contact = await prisma.contact.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.id,
      },
    });

    if (!contact) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    res.json({ contact });
  } catch (error) {
    console.error('Error fetching contact:', error);
    res.status(500).json({
      error: error.message || 'Failed to fetch contact',
    });
  }
});

// PUT /contacts/:id - Update a contact
router.put('/:id', async (req, res) => {
  try {
    const { companyName, phone1, phone2, phone3, email, website, address, note, sent } = req.body;

    const contact = await prisma.contact.updateMany({
      where: {
        id: req.params.id,
        userId: req.user.id,
      },
      data: {
        ...(companyName !== undefined && { companyName }),
        ...(phone1 !== undefined && { phone1 }),
        ...(phone2 !== undefined && { phone2 }),
        ...(phone3 !== undefined && { phone3 }),
        ...(email !== undefined && { email }),
        ...(website !== undefined && { website }),
        ...(address !== undefined && { address }),
        ...(note !== undefined && { note }),
        ...(sent !== undefined && { sent }),
      },
    });

    if (contact.count === 0) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    const updatedContact = await prisma.contact.findUnique({
      where: { id: req.params.id },
    });

    // Log activity
    await logActivity(
      req.user.id,
      'updated',
      req.params.id,
      `Updated contact: ${updatedContact.companyName}`
    );

    res.json({ success: true, contact: updatedContact });
  } catch (error) {
    console.error('Error updating contact:', error);
    res.status(500).json({
      error: error.message || 'Failed to update contact',
    });
  }
});

// DELETE /contacts/:id - Delete a contact
router.delete('/:id', async (req, res) => {
  try {
    // Get contact info before deleting
    const contactToDelete = await prisma.contact.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.id,
      },
    });

    if (!contactToDelete) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    const contact = await prisma.contact.deleteMany({
      where: {
        id: req.params.id,
        userId: req.user.id,
      },
    });

    // Log activity
    await logActivity(
      req.user.id,
      'deleted',
      req.params.id,
      `Deleted contact: ${contactToDelete.companyName}`
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting contact:', error);
    res.status(500).json({
      error: error.message || 'Failed to delete contact',
    });
  }
});

module.exports = router;

