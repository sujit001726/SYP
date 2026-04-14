const { Notification } = require('../models');

/**
 * Creates a notification and optionally emits a socket event
 * @param {Object} io - Socket.io instance
 * @param {Object} data - Notification data
 * @param {string} data.userId - ID of the user to notify
 * @param {string} data.title - Notification title
 * @param {string} data.message - Notification message
 * @param {string} data.type - Notification type (info, success, warning, error)
 */
const createNotification = async (io, data) => {
    try {
        const notification = await Notification.create({
            userId: data.userId,
            title: data.title,
            message: data.message,
            type: data.type || 'info',
            link: data.link || null
        });

        if (io) {
            io.to(data.userId).emit('notification', notification);
        }

        return notification;
    } catch (error) {
        console.error('Error creating notification:', error);
    }
};

module.exports = { createNotification };
