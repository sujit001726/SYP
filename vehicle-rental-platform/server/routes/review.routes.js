const express = require('express');
const router = express.Router();
const { Review, Vehicle, User } = require('../models');
const { protect } = require('../middleware/auth.middleware');

// Add a review
router.post('/', protect, async (req, res) => {
    try {
        const { vehicleId, rating, comment } = req.body;
        const userId = req.user.id;

        if (!vehicleId || !rating) {
            return res.status(400).json({ message: 'Vehicle ID and rating are required.' });
        }

        if (rating < 1 || rating > 5) {
            return res.status(400).json({ message: 'Rating must be between 1 and 5.' });
        }

        // Optional: Check if the user has actually booked this vehicle before allowing review
        // (Skipping for simplicity or can add later based on business logic)

        const vehicle = await Vehicle.findByPk(vehicleId);
        if (!vehicle) {
            return res.status(404).json({ message: 'Vehicle not found.' });
        }

        // Check if user already reviewed this vehicle
        const existingReview = await Review.findOne({ where: { userId, vehicleId } });
        if (existingReview) {
            return res.status(400).json({ message: 'You have already reviewed this vehicle.' });
        }

        const review = await Review.create({
            userId,
            vehicleId,
            rating,
            comment
        });

        res.status(201).json(review);
    } catch (error) {
        console.error("ADD_REVIEW_ERROR:", error);
        res.status(500).json({ message: 'Server error: ' + error.message });
    }
});

// Get reviews for a vehicle
router.get('/vehicle/:vehicleId', async (req, res) => {
    try {
        const reviews = await Review.findAll({
            where: { vehicleId: req.params.vehicleId },
            include: [
                { model: User, as: 'reviewer', attributes: ['id', 'username', 'profileImage'] }
            ],
            order: [['createdAt', 'DESC']]
        });

        res.json(reviews);
    } catch (error) {
        console.error("GET_REVIEWS_ERROR:", error);
        res.status(500).json({ message: 'Server error: ' + error.message });
    }
});

// Delete a review (Optional: for admins or user who created it)
router.delete('/:id', protect, async (req, res) => {
    try {
        const review = await Review.findByPk(req.params.id);
        if (!review) {
            return res.status(404).json({ message: 'Review not found.' });
        }

        // Only allow reviewer to delete their own review
        if (review.userId !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized to delete this review.' });
        }

        await review.destroy();
        res.json({ message: 'Review deleted successfully.' });
    } catch (error) {
        console.error("DELETE_REVIEW_ERROR:", error);
        res.status(500).json({ message: 'Server error: ' + error.message });
    }
});

module.exports = router;
