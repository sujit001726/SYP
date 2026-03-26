const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { protect } = require('../middleware/auth.middleware');
const { Booking, Vehicle, User, Transaction } = require('../models');
const { sequelize } = require('../db/connection');

// Generate eSewa signature
const generateSignature = (message) => {
    const secret = process.env.ESEWA_SECRET_KEY || '8gBm/:&EnhH.1/q';
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(message);
    return hmac.digest('base64');
};

// Route to initiate eSewa payment
router.post('/initiate-esewa', protect, async (req, res) => {
    try {
        const { bookingId } = req.body;

        const booking = await Booking.findByPk(bookingId, {
            include: [{ model: Vehicle, as: 'vehicle' }]
        });

        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        // eSewa fields
        // Ensure totalAmount is a clean integer or float string
        const amountValue = Number(booking.totalAmount);
        const totalAmount = amountValue.toString();

        const transactionUuid = `${booking.id}-${Date.now()}`;
        const productCode = process.env.ESEWA_MERCHANT_ID || 'EPAYTEST';

        // Critical: Signed fields must exactly match the 'signed_field_names' and order
        const message = `total_amount=${totalAmount},transaction_uuid=${transactionUuid},product_code=${productCode}`;

        console.log("Generating Signature for Message:", message);
        const signature = generateSignature(message);
        console.log("Generated Signature:", signature);

        // Prepare payment data for the frontend to submit
        const paymentData = {
            amount: totalAmount,
            tax_amount: "0",
            total_amount: totalAmount,
            transaction_uuid: transactionUuid,
            product_code: productCode,
            product_service_charge: "0",
            product_delivery_charge: "0",
            success_url: process.env.ESEWA_SUCCESS_URL,
            failure_url: process.env.ESEWA_FAILURE_URL,
            signed_field_names: "total_amount,transaction_uuid,product_code",
            signature: signature,
            esewa_url: process.env.ESEWA_GATEWAY_URL
        };

        // Update booking with transaction UUID for later verification
        await booking.update({ transactionId: transactionUuid });

        res.json(paymentData);
    } catch (error) {
        console.error('eSewa Initiation Error:', error);
        res.status(500).json({ message: 'Failed to initialize payment' });
    }
});

// Route to verify eSewa payment (callback)
router.get('/verify-esewa', async (req, res) => {
    try {
        const { data } = req.query; // eSewa returns base64 encoded data in v2
        if (!data) return res.status(400).send('Invalid data');

        const decodedData = JSON.parse(Buffer.from(data, 'base64').toString('utf-8'));
        // decodedData contains: transaction_code, status, total_amount, transaction_uuid, product_code, signature

        const { transaction_uuid, status, total_amount, transaction_code } = decodedData;

        // Extract booking ID from transaction_uuid
        const bookingId = transaction_uuid.split('-')[0];
        const booking = await Booking.findByPk(bookingId);

        if (!booking) return res.status(404).send('Booking not found');

        if (status === 'COMPLETE') {
            await booking.update({
                paymentStatus: 'paid',
                status: 'confirmed',
                transactionId: transaction_code // Actual eSewa transaction code
            });

            // Log Transaction history for seeker
            await Transaction.create({
                userId: booking.seekerId,
                bookingId: booking.id,
                type: 'debit',
                amount: total_amount,
                category: 'payment',
                description: `Booking #${booking.id.substring(0, 8)} - Funds Held in Escrow (eSewa)`,
                status: 'completed'
            });

            return res.json({ success: true, message: 'Payment verified successfully' });
        } else {
            return res.status(400).json({ success: false, message: 'Payment failed at gateway' });
        }
    } catch (error) {
        console.error('eSewa Verification Error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// Route to pay using YatraHub Wallet
router.post('/pay-wallet', protect, async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { bookingId } = req.body;
        const seekerId = req.user.id;

        const booking = await Booking.findByPk(bookingId, { transaction: t });
        if (!booking) return res.status(404).json({ message: 'Booking not found' });
        if (booking.paymentStatus === 'paid') return res.status(400).json({ message: 'Already paid' });

        const user = await User.findByPk(seekerId, { transaction: t });
        const amount = parseFloat(booking.totalAmount);

        if (parseFloat(user.balance) < amount) {
            return res.status(400).json({ message: 'Insufficient wallet balance' });
        }

        // Deduct from user wallet
        await user.update({ balance: parseFloat(user.balance) - amount }, { transaction: t });

        // Update booking
        await booking.update({
            paymentStatus: 'paid',
            status: 'confirmed',
            transactionId: `WALLET_${Date.now()}`
        }, { transaction: t });

        // Create transaction history
        await Transaction.create({
            userId: seekerId,
            bookingId: booking.id,
            type: 'debit',
            amount: amount,
            category: 'payment',
            description: `Booking #${booking.id.substring(0, 8)} - Funds Held in Escrow (Wallet)`,
            status: 'completed'
        }, { transaction: t });

        await t.commit();
        res.json({ success: true, message: 'Payment successful using wallet' });
    } catch (error) {
        await t.rollback();
        console.error('Wallet Payment Error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// Route to verify manual payment token (Reference ID from QR/Bank Apps)
router.post('/verify-manual', protect, async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { bookingId, token } = req.body;

        const booking = await Booking.findByPk(bookingId, { transaction: t });
        if (!booking) {
            await t.rollback();
            return res.status(404).json({ message: 'Booking not found' });
        }

        if (booking.paymentStatus === 'paid') {
            await t.rollback();
            return res.status(400).json({ message: 'This booking is already marked as paid' });
        }

        // Update booking with the provided manual token
        await booking.update({
            paymentStatus: 'paid',
            status: 'confirmed',
            transactionId: token // Store the Reference ID
        }, { transaction: t });

        // Record the transaction locally
        await Transaction.create({
            userId: req.user.id,
            bookingId: booking.id,
            type: 'debit',
            amount: booking.totalAmount,
            category: 'payment',
            description: `Manual Verification: Booking #${booking.id.substring(0, 8)} (Ref: ${token})`,
            status: 'completed'
        }, { transaction: t });

        await t.commit();
        res.json({ success: true, message: 'Payment token verified. Booking is now confirmed.' });
    } catch (error) {
        if (t) await t.rollback();
        console.error('Manual Verification Error:', error);
        res.status(500).json({ message: 'Failed to verify payment token' });
    }
});

module.exports = router;
