const express = require('express');
const prisma = require('../lib/db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// @route   GET /api/activities
// @desc    Get activity logs for user
// @access  Private
router.get('/', async (req, res) => {
  try {
    const { limit = 50, offset = 0, contactId, action } = req.query;

    const where = {
      userId: req.user.id,
    };

    if (contactId) {
      where.contactId = contactId;
    }

    if (action) {
      where.action = action;
    }

    const [activities, total] = await Promise.all([
      prisma.activityLog.findMany({
        where,
        include: {
          contact: {
            select: {
              id: true,
              companyName: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: parseInt(limit),
        skip: parseInt(offset),
      }),
      prisma.activityLog.count({ where }),
    ]);

    res.json({
      activities,
      total,
      limit: parseInt(limit),
      offset: parseInt(offset),
    });
  } catch (error) {
    console.error('Error fetching activities:', error);
    res.status(500).json({ error: 'Failed to fetch activities' });
  }
});

// @route   POST /api/activities
// @desc    Create activity log (internal use)
// @access  Private
router.post('/', async (req, res) => {
  try {
    const { contactId, action, description, metadata } = req.body;

    if (!action) {
      return res.status(400).json({ error: 'Action is required' });
    }

    const activity = await prisma.activityLog.create({
      data: {
        userId: req.user.id,
        contactId: contactId || null,
        action,
        description: description || null,
        metadata: metadata ? JSON.stringify(metadata) : null,
      },
      include: {
        contact: {
          select: {
            id: true,
            companyName: true,
          },
        },
      },
    });

    res.json({ activity });
  } catch (error) {
    console.error('Error creating activity:', error);
    res.status(500).json({ error: 'Failed to create activity' });
  }
});

module.exports = router;

