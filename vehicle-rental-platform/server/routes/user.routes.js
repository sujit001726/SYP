const express = require('express');
const router = express.Router();
const { User, Vehicle, Booking } = require('../models');
const { protect, authorize } = require('../middleware/auth.middleware');
const upload = require('../utils/upload');
const { convertHeicToJpeg } = require('../utils/heicConverter');

// Get user profile
router.get('/profile', protect, async (req, res) => {
    try {
        const user = await User.findByPk(req.user.id, {
            attributes: { exclude: ['password'] }
        });
        res.json(user);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get user by ID (public info)
router.get('/:id', protect, async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id, {
            attributes: ['id', 'username', 'profileImage', 'role']
        });
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json(user);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});


// Update user profile
router.put('/profile', protect, async (req, res) => {
    try {
        console.log("Updating profile for user:", req.user.id, "Body:", req.body);
        const { username, phoneNumber, profileImage, address } = req.body;
        const user = await User.findByPk(req.user.id);

        if (username !== undefined) user.username = username;
        if (phoneNumber !== undefined) user.phoneNumber = phoneNumber;
        if (profileImage !== undefined) {
            console.log("Setting profileImage to:", profileImage);
            user.profileImage = profileImage;
        }
        if (address !== undefined) user.address = address;

        await user.save();
        console.log("User saved successfully. New image status:", user.profileImage);

        res.json({
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
            phoneNumber: user.phoneNumber,
            profileImage: user.profileImage,
            address: user.address,
            kycStatus: user.kycStatus
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Submit KYC
router.post('/kyc', protect, upload.array('documents', 3), async (req, res) => {
    try {
        const { fullName, idNumber, idType } = req.body;
        const user = await User.findByPk(req.user.id);

        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ message: 'Documents are required' });
        }

        // Convert HEIC to JPEG if needed
        const processedFiles = await convertHeicToJpeg(req.files);
        const documentUrls = processedFiles.map(file => `/uploads/${file.filename}`);

        user.kycStatus = 'pending';
        user.kycData = {
            fullName,
            idNumber,
            idType,
            documents: documentUrls,
            submittedAt: new Date()
        };

        await user.save();

        res.json({ message: 'KYC submitted successfully', kycStatus: 'pending' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'KYC submission failed' });
    }
});

// Admin: Get all users with pending KYC
router.get('/admin/kyc-pending', protect, authorize('admin', 'agent'), async (req, res) => {
    try {
        const users = await User.findAll({
            where: { kycStatus: 'pending' },
            attributes: ['id', 'username', 'email', 'kycData', 'kycStatus']
        });
        res.json(users);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Admin: Update KYC status
router.put('/admin/kyc/:userId', protect, authorize('admin', 'agent'), async (req, res) => {
    try {
        const { status, reason } = req.body;
        const user = await User.findByPk(req.params.userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.kycStatus = status;
        if (reason) {
            user.kycData = { ...user.kycData, rejectionReason: reason };
        }

        await user.save();

        res.json({ message: `KYC status updated to ${status}` });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Admin: Dashboard stats
router.get('/admin/stats', protect, authorize('admin', 'agent'), async (req, res) => {
    try {
        const totalUsers = await User.count();
        const totalVehicles = await Vehicle.count();
        const totalBookings = await Booking.count();
        const pendingKyc = await User.count({ where: { kycStatus: 'pending' } });

        res.json({
            totalUsers,
            totalVehicles,
            totalBookings,
            pendingKyc
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
