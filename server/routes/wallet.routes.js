const express = require('express');
const router = express.Router();
const { Transaction, User, Booking } = require('../models');
const { sequelize } = require('../db/connection');
const { protect } = require('../middleware/auth.middleware');

// Apply protection to all routes
router.use(protect);

// Get wallet balance and transactions
router.get('/history', async (req, res) => {
    try {
        const userId = req.user.id; // From auth middleware
        const transactions = await Transaction.findAll({
            where: { userId },
            order: [['createdAt', 'DESC']],
            include: [{ model: Booking, as: 'booking' }]
        });

        const user = await User.findByPk(userId);

        res.json({
            balance: user.balance,
            transactions
        });
    } catch (error) {
        console.error("Wallet error:", error);
        res.status(500).json({ message: 'Error fetching wallet data' });
    }
});

// Top up wallet (Simulated)
router.post('/topup', async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { amount, method } = req.body;
        const userId = req.user.id;

        if (!amount || amount <= 0) {
            return res.status(400).json({ message: 'Invalid amount' });
        }

        const user = await User.findByPk(userId, { transaction: t });

        // Update user balance
        const newBalance = parseFloat(user.balance) + parseFloat(amount);
        await user.update({ balance: newBalance }, { transaction: t });

        // Create transaction record
        await Transaction.create({
            userId,
            type: 'credit',
            amount,
            category: 'topup',
            description: `Wallet top-up via ${method || 'Digital Payment'}`,
            status: 'completed'
        }, { transaction: t });

        await t.commit();
        res.json({ message: 'Top-up successful', balance: newBalance });
    } catch (error) {
        await t.rollback();
        console.error("Top-up error:", error);
        res.status(500).json({ message: 'Top-up failed' });
    }
});

module.exports = router;
