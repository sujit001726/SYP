const express = require('express');
const router = express.Router();
const { User, Vehicle, Booking } = require('../models');
const { protect, authorize } = require('../middleware/auth.middleware');
const { Op } = require('sequelize');

// --- USER MANAGEMENT ---

// Get all seekers (customers)
router.get('/users', protect, authorize('admin', 'agent'), async (req, res) => {
    try {
        const query = { role: { [Op.in]: ['seeker', 'owner'] } };
        // If agent, maybe only see seekers that have interacted with their fleet? 
        // For now, as per request "see each and everything same", we'll just filter by role.
        const users = await User.findAll({
            where: query,
            attributes: { exclude: ['password'] },
            order: [['createdAt', 'DESC']]
        });
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch users' });
    }
});

// --- MEMBERS MANAGEMENT (Riders & Agents) ---

// Get members added by current user
router.get('/members', protect, authorize('admin', 'agent'), async (req, res) => {
    try {
        const members = await User.findAll({
            where: {
                addedBy: req.user.id,
                role: { [Op.in]: ['rider', 'agent'] }
            },
            attributes: { exclude: ['password'] },
            order: [['createdAt', 'DESC']]
        });
        res.json(members);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch members' });
    }
});

// Add a new member (Rider or Agent)
router.post('/members', protect, authorize('admin', 'agent'), async (req, res) => {
    try {
        const { username, email, password, role, phoneNumber, address } = req.body;

        // Check if user exists
        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) return res.status(400).json({ message: 'User already exists with this email' });

        const member = await User.create({
            username,
            email,
            password, // Hook in model will hash this
            role,
            phoneNumber,
            address,
            addedBy: req.user.id,
            kycStatus: 'verified' // Auto-verify members added by agents for now
        });

        const memberData = member.toJSON();
        delete memberData.password;
        res.status(201).json(memberData);
    } catch (error) {
        console.error("Add Member Error:", error);
        res.status(500).json({ message: 'Failed to add member' });
    }
});

// --- FLEET MANAGEMENT ---

// Get all vehicles
router.get('/vehicles', protect, authorize('admin', 'agent'), async (req, res) => {
    try {
        const query = {};
        // If agent, they might only see vehicles they own or their riders use.
        // For now, super-set.
        const vehicles = await Vehicle.findAll({
            where: query,
            include: [{ model: User, as: 'owner', attributes: ['username', 'email'] }],
            order: [['createdAt', 'DESC']]
        });
        res.json(vehicles);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch vehicles' });
    }
});

// --- BOOKING MANAGEMENT ---

// Get all bookings
router.get('/bookings', protect, authorize('admin', 'agent'), async (req, res) => {
    try {
        const bookings = await Booking.findAll({
            include: [
                { model: Vehicle, as: 'vehicle' },
                { model: User, as: 'seeker', attributes: ['username', 'email'] }
            ],
            order: [['createdAt', 'DESC']]
        });
        res.json(bookings);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch bookings' });
    }
});

// Update booking status
router.put('/bookings/:id/status', protect, authorize('admin', 'agent'), async (req, res) => {
    try {
        const { status } = req.body;
        const booking = await Booking.findByPk(req.params.id);
        if (!booking) return res.status(404).json({ message: 'Booking not found' });

        await booking.update({ status });
        res.json(booking);
    } catch (error) {
        res.status(500).json({ message: 'Update failed' });
    }
});

module.exports = router;
