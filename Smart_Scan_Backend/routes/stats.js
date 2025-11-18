const express = require('express');
const { prisma } = require('../lib/db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// GET /stats - Get dashboard statistics
router.get('/', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [total, sent, unsent, todayCount] = await Promise.all([
      prisma.contact.count({ where: { userId: req.user.id } }),
      prisma.contact.count({ where: { userId: req.user.id, sent: true } }),
      prisma.contact.count({ where: { userId: req.user.id, sent: false } }),
      prisma.contact.count({
        where: {
          userId: req.user.id,
          createdAt: { gte: today },
        },
      }),
    ]);

    res.json({
      total,
      sent,
      unsent,
      today: todayCount,
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({
      error: error.message || 'Failed to fetch stats',
    });
  }
});

module.exports = router;

