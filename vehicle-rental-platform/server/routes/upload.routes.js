const express = require('express');
const router = express.Router();
const upload = require('../utils/upload');
const { protect } = require('../middleware/auth.middleware');
const { convertHeicToJpeg } = require('../utils/heicConverter');

router.post('/upload', protect, (req, res, next) => {
    console.log("DEBUG: Incoming upload request headers:", req.headers['content-type']);
    next();
}, upload.array('images', 10), async (req, res) => {
    try {
        console.log("DEBUG: Multer processed files:", req.files?.length || 0);
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ message: 'No files uploaded' });
        }

        // Convert HEIC to JPEG if needed
        const processedFiles = await convertHeicToJpeg(req.files);

        const imageUrls = processedFiles.map(file => `/uploads/${file.filename}`);
        res.json({ imageUrls });
    } catch (error) {
        console.error("DEBUG: Upload Route Error:", error);
        res.status(500).json({ message: 'Upload failed: ' + error.message });
    }
});

module.exports = router;
