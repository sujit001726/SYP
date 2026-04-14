const express = require('express');
const router = express.Router();
const messageController = require('../controllers/message.controller');
const { protect } = require('../middleware/auth.middleware');
const upload = require('../utils/upload');


router.get('/list', protect, messageController.getChatList);
router.get('/unread-count', protect, messageController.getUnreadCount);
router.get('/:userId', protect, messageController.getMessages);
router.post('/send', protect, messageController.sendMessage);
router.post('/upload', protect, upload.single('file'), messageController.uploadFile);
router.put('/mark-read/:senderId', protect, messageController.markAsRead);


module.exports = router;
