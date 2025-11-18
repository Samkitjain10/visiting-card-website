const express = require('express');
const { prisma } = require('../lib/db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// GET /analytics - Get analytics data
router.get('/', async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(days));

    // Contact growth over time
    const contactsByDate = await prisma.contact.findMany({
      where: {
        userId: req.user.id,
        createdAt: { gte: daysAgo },
      },
      select: {
        createdAt: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Group by date
    const contactGrowth = {};
    contactsByDate.forEach((contact) => {
      const date = contact.createdAt.toISOString().split('T')[0];
      contactGrowth[date] = (contactGrowth[date] || 0) + 1;
    });

    // Upload activity (from activity logs)
    const uploadActivities = await prisma.activityLog.findMany({
      where: {
        userId: req.user.id,
        action: 'uploaded',
        createdAt: { gte: daysAgo },
      },
      select: {
        createdAt: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    const uploadGrowth = {};
    uploadActivities.forEach((activity) => {
      const date = activity.createdAt.toISOString().split('T')[0];
      uploadGrowth[date] = (uploadGrowth[date] || 0) + 1;
    });

    // Export activity
    const exportActivities = await prisma.activityLog.findMany({
      where: {
        userId: req.user.id,
        action: 'exported',
        createdAt: { gte: daysAgo },
      },
      select: {
        createdAt: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    const exportGrowth = {};
    exportActivities.forEach((activity) => {
      const date = activity.createdAt.toISOString().split('T')[0];
      exportGrowth[date] = (exportGrowth[date] || 0) + 1;
    });

    // Action distribution
    const actionDistribution = await prisma.activityLog.groupBy({
      by: ['action'],
      where: {
        userId: req.user.id,
        createdAt: { gte: daysAgo },
      },
      _count: {
        id: true,
      },
    });

    // Contacts by status
    const [totalContacts, sentContacts, unsentContacts] = await Promise.all([
      prisma.contact.count({ where: { userId: req.user.id } }),
      prisma.contact.count({ where: { userId: req.user.id, sent: true } }),
      prisma.contact.count({ where: { userId: req.user.id, sent: false } }),
    ]);

    res.json({
      contactGrowth,
      uploadGrowth,
      exportGrowth,
      actionDistribution: actionDistribution.map((item) => ({
        action: item.action,
        count: item._count.id,
      })),
      statusDistribution: {
        total: totalContacts,
        sent: sentContacts,
        unsent: unsentContacts,
      },
      period: parseInt(days),
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({
      error: error.message || 'Failed to fetch analytics',
    });
  }
});

module.exports = router;

