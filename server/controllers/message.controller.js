const { Message, User } = require('../models');
const { Op } = require('sequelize');

exports.getMessages = async (req, res) => {
    try {
        const { userId } = req.params;
        const currentUserId = req.user.id;

        const messages = await Message.findAll({
            where: {
                [Op.or]: [
                    { senderId: currentUserId, receiverId: userId },
                    { senderId: userId, receiverId: currentUserId }
                ]
            },
            order: [['createdAt', 'ASC']],
            include: [
                { model: User, as: 'sender', attributes: ['id', 'username', 'profileImage'] },
                { model: User, as: 'receiver', attributes: ['id', 'username', 'profileImage'] }
            ]
        });

        res.json(messages);
    } catch (error) {
        console.error('Error fetching messages:', error);
        res.status(500).json({ message: 'Error fetching messages' });
    }
};

exports.getChatList = async (req, res) => {
    try {
        const currentUserId = req.user.id;

        // Find all unique users the current user has chatted with
        const messages = await Message.findAll({
            where: {
                [Op.or]: [{ senderId: currentUserId }, { receiverId: currentUserId }]
            },
            order: [['createdAt', 'DESC']]
        });

        const chatUserIds = new Set();
        messages.forEach(msg => {
            chatUserIds.add(msg.senderId === currentUserId ? msg.receiverId : msg.senderId);
        });

        const chatUsers = await User.findAll({
            where: { id: Array.from(chatUserIds) },
            attributes: ['id', 'username', 'profileImage', 'role']
        });

        // Get last message for each user
        const chatList = chatUsers.map(user => {
            const lastMsg = messages.find(msg => msg.senderId === user.id || msg.receiverId === user.id);
            return {
                user,
                lastMessage: lastMsg
            };
        });

        res.json(chatList);
    } catch (error) {
        console.error('Error fetching chat list:', error);
        res.status(500).json({ message: 'Error fetching chat list' });
    }
};

exports.sendMessage = async (req, res) => {
    try {
        const { receiverId, content, messageType } = req.body;
        const senderId = req.user.id;

        const message = await Message.create({
            senderId,
            receiverId,
            content,
            messageType: messageType || 'text'
        });

        const fullMessage = await Message.findByPk(message.id, {
            include: [
                { model: User, as: 'sender', attributes: ['id', 'username', 'profileImage'] },
                { model: User, as: 'receiver', attributes: ['id', 'username', 'profileImage'] }
            ]
        });

        res.status(201).json(fullMessage);
    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({ message: 'Error sending message' });
    }
};

exports.uploadFile = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const { receiverId, messageType } = req.body;
        const senderId = req.user.id;
        const fileUrl = `/uploads/${req.file.filename}`;

        const message = await Message.create({
            senderId,
            receiverId,
            content: fileUrl,
            messageType: messageType || 'image'
        });

        const fullMessage = await Message.findByPk(message.id, {
            include: [
                { model: User, as: 'sender', attributes: ['id', 'username', 'profileImage'] },
                { model: User, as: 'receiver', attributes: ['id', 'username', 'profileImage'] }
            ]
        });

        res.status(201).json(fullMessage);
    } catch (error) {
        console.error('Error uploading file:', error);
        res.status(500).json({ message: 'Error uploading file' });
    }
};


exports.markAsRead = async (req, res) => {
    try {
        const { senderId } = req.params;
        const currentUserId = req.user.id;

        await Message.update(
            { isRead: true },
            {
                where: {
                    senderId,
                    receiverId: currentUserId,
                    isRead: false
                }
            }
        );

        res.json({ message: 'Messages marked as read' });
    } catch (error) {
        console.error('Error marking messages as read:', error);
        res.status(500).json({ message: 'Error marking messages as read' });
    }
};

exports.getUnreadCount = async (req, res) => {
    try {
        const count = await Message.count({
            where: {
                receiverId: req.user.id,
                isRead: false
            }
        });
        res.json({ count });
    } catch (error) {
        console.error('Error getting unread count:', error);
        res.status(500).json({ message: 'Error getting unread count' });
    }
};
