const express = require('express');
const router = express.Router();
const { Booking, Vehicle, User, sequelize } = require('../models');
const { Op } = require('sequelize');
const { protect } = require('../middleware/auth.middleware');
const { createNotification } = require('../utils/notificationHelper');

// Create a booking
router.post('/', protect, async (req, res) => {
    try {
        const { vehicleId, startDate, endDate, totalAmount } = req.body;
        const seekerId = req.user.id;

        // Sandbox check for static vehicles (IDs starting with 's')
        if (typeof vehicleId === 'string' && vehicleId.startsWith('s')) {
            const booking = await Booking.create({
                vehicleId: null, // Virtual item
                seekerId,
                startDate,
                endDate,
                totalAmount,
                status: 'pending'
            });
            return res.status(201).json(booking);
        }

        // Check if vehicle exists and is available
        const vehicle = await Vehicle.findByPk(vehicleId);
        if (!vehicle) {
            return res.status(404).json({ message: 'Vehicle not found' });
        }

        if (vehicle.status === 'maintenance') {
            return res.status(400).json({ message: 'Vehicle is currently offline for maintenance.' });
        }

        // --- AVAILABILITY OVERLAP CHECK ---
        const overlappingBooking = await Booking.findOne({
            where: {
                vehicleId,
                status: { [Op.in]: ['pending', 'confirmed'] },
                [Op.or]: [
                    {
                        startDate: { [Op.between]: [startDate, endDate] }
                    },
                    {
                        endDate: { [Op.between]: [startDate, endDate] }
                    },
                    {
                        [Op.and]: [
                            { startDate: { [Op.lte]: startDate } },
                            { endDate: { [Op.gte]: endDate } }
                        ]
                    }
                ]
            }
        });

        if (overlappingBooking) {
            const start = new Date(overlappingBooking.startDate).toLocaleDateString();
            const end = new Date(overlappingBooking.endDate).toLocaleDateString();
            return res.status(400).json({ 
                message: `Vehicle is not available for booking from ${start} to ${end}. Please select other dates.` 
            });
        }

        const booking = await Booking.create({
            vehicleId,
            seekerId,
            startDate,
            endDate,
            totalAmount,
            status: 'pending'
        });

        // Optionally update vehicle status (depending on business logic)
        // await vehicle.update({ status: 'rented' });

        // Notify Owner
        await createNotification(req.io, {
            userId: vehicle.ownerId,
            title: 'New Booking Request',
            message: `You have a new booking request for ${vehicle.name}.`,
            type: 'info',
            link: '/dashboard?tab=fleet'
        });

        res.status(201).json(booking);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get user's bookings (as seeker)
router.get('/my-bookings', protect, async (req, res) => {
    try {
        const bookings = await Booking.findAll({
            where: { seekerId: req.user.id },
            include: [{ model: Vehicle, as: 'vehicle' }]
        });
        res.json(bookings);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get bookings for an owner's vehicles
router.get('/owner-bookings', protect, async (req, res) => {
    try {
        const bookings = await Booking.findAll({
            include: [
                {
                    model: Vehicle,
                    as: 'vehicle',
                    where: { ownerId: req.user.id }
                },
                {
                    model: User,
                    as: 'seeker',
                    attributes: ['username', 'email', 'phoneNumber']
                }
            ]
        });
        res.json(bookings);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update booking status (confirm/cancel/complete)
router.put('/:id/status', protect, async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { status } = req.body;
        const booking = await Booking.findByPk(req.params.id, {
            include: [{ model: Vehicle, as: 'vehicle' }],
            transaction: t
        });

        if (!booking) {
            await t.rollback();
            return res.status(404).json({ message: 'Booking not found' });
        }

        // Only the owner of the vehicle or the seeker can update status (with restrictions)
        const isOwner = booking.vehicle.ownerId === req.user.id;
        const isSeeker = booking.seekerId === req.user.id;

        if (!isOwner && !isSeeker) {
            await t.rollback();
            return res.status(403).json({ message: 'Not authorized' });
        }

        // Update status
        await booking.update({ status }, { transaction: t });

        // Logic for vehicle availability
        if (status === 'confirmed') {
            await booking.vehicle.update({ status: 'rented' }, { transaction: t });
        } else if (status === 'cancelled' || status === 'completed') {
            await booking.vehicle.update({ status: 'available' }, { transaction: t });
        }

        // --- ESCROW SYSTEM LOGIC ---
        // Release funds to owner when booking is completed and mark as paid
        if (status === 'completed' && booking.paymentStatus === 'paid') {
            const owner = await User.findByPk(booking.vehicle.ownerId, { transaction: t });

            // Standard platform commission (e.g., 90% to owner)
            const commissionRate = 0.90;
            const payoutAmount = parseFloat(booking.totalAmount) * commissionRate;

            const newBalance = parseFloat(owner.balance) + payoutAmount;
            await owner.update({ balance: newBalance }, { transaction: t });

            // Record transaction for owner
            await Transaction.create({
                userId: owner.id,
                bookingId: booking.id,
                type: 'credit',
                amount: payoutAmount,
                category: 'earning',
                description: `Escrow Released: Booking #${booking.id.substring(0, 8)} (90% Payout)`,
                status: 'completed'
            }, { transaction: t });

            console.log(`Escrow Released: Rs. ${payoutAmount} credited to Owner ${owner.username}`);
        }

        // Notify Seeker about status update
        let notifyTitle = 'Booking Update';
        let notifyMessage = `Your booking for ${booking.vehicle.name} has been ${status}.`;
        let notifyType = 'info';

        if (status === 'confirmed') {
            notifyTitle = 'Booking Confirmed! 🎉';
            notifyType = 'success';
        } else if (status === 'cancelled') {
            notifyTitle = 'Booking Cancelled';
            notifyType = 'error';
        } else if (status === 'completed') {
            notifyTitle = 'Booking Completed';
            notifyType = 'success';
            notifyMessage = `Hope you enjoyed your ride! Your booking for ${booking.vehicle.name} is now complete.`;
        }

        await createNotification(req.io, {
            userId: booking.seekerId,
            title: notifyTitle,
            message: notifyMessage,
            type: notifyType,
            link: '/dashboard?tab=bookings'
        });

        await t.commit();
        res.json(booking);
    } catch (error) {
        await t.rollback();
        console.error("Status update error:", error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get all bookings for a specific vehicle (to show occupied dates)
router.get('/vehicle/:vehicleId', async (req, res) => {
    try {
        const bookings = await Booking.findAll({
            where: { 
                vehicleId: req.params.vehicleId,
                status: { [Op.in]: ['pending', 'confirmed'] } 
            },
            attributes: ['startDate', 'endDate', 'status']
        });
        res.json(bookings);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
