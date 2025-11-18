const prisma = require('./db');

/**
 * Log an activity for a user
 * @param {string} userId - User ID
 * @param {string} action - Action type ('created', 'updated', 'deleted', 'exported', 'uploaded')
 * @param {string} [contactId] - Contact ID (optional)
 * @param {string} [description] - Description of the activity
 * @param {object} [metadata] - Additional metadata (will be JSON stringified)
 */
async function logActivity(userId, action, contactId = null, description = null, metadata = null) {
  try {
    await prisma.activityLog.create({
      data: {
        userId,
        contactId: contactId || null,
        action,
        description: description || null,
        metadata: metadata ? JSON.stringify(metadata) : null,
      },
    });
  } catch (error) {
    // Don't throw error - activity logging should not break the main flow
    console.error('Error logging activity:', error);
  }
}

module.exports = { logActivity };

