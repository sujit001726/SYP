const express = require('express');
const { Op } = require('sequelize');
const router = express.Router();
const { Vehicle, User } = require('../models');

// Get all vehicles with optional filters
router.get('/', async (req, res) => {
    try {
        const { type, location, serviceType } = req.query;
        let where = {};

        if (type && type !== 'All') where.type = type.toLowerCase();
        if (serviceType) where.serviceType = serviceType.toLowerCase();
        if (location) where.location = { [Op.iLike]: `%${location}%` };

        const vehicles = await Vehicle.findAll({
            where,
            include: [{ model: User, as: 'owner', attributes: ['username', 'email'] }]
        });
        res.json(vehicles);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Create a vehicle
router.post('/', async (req, res) => {
    try {
        const { ownerId, name, brand, model, year, type, serviceType, pricePerDay, location, registrationNumber, description, lat, lng, features, images } = req.body;

        if (!ownerId || !name || !registrationNumber || !pricePerDay) {
            return res.status(400).json({ message: 'Missing required fields: Name, Registration, and Price are mandatory.' });
        }

        const normalizedType = (type || 'car').toLowerCase();
        const finalType = normalizedType.includes('luxury') ? 'luxury' :
            normalizedType.includes('suv') ? 'suv' :
                normalizedType.includes('sedan') ? 'sedan' :
                    normalizedType.includes('bike') ? 'bike' :
                        normalizedType.includes('scooter') ? 'scooter' : 'car';

        const vehicle = await Vehicle.create({
            ownerId,
            name,
            brand,
            model,
            year,
            type: finalType,
            serviceType: serviceType || 'rent',
            pricePerDay,
            location,
            registrationNumber,
            description,
            lat,
            lng,
            features: Array.isArray(features) ? features : [],
            images: Array.isArray(images) ? images : []
        });

        res.status(201).json(vehicle);
    } catch (error) {
        console.error("VEHICLE_CREATE_ERROR:", error);
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(400).json({ message: 'This registration number is already registered in our system.' });
        }
        res.status(500).json({ message: 'Server error: ' + error.message });
    }
});

// Get single vehicle
router.get('/:id', async (req, res) => {
    try {
        const vehicle = await Vehicle.findByPk(req.params.id, {
            include: [{ model: User, as: 'owner', attributes: ['username', 'email'] }]
        });
        if (!vehicle) {
            return res.status(404).json({ message: 'Vehicle not found' });
        }
        res.json(vehicle);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update vehicle details (Edit Details)
router.put('/:id', async (req, res) => {
    try {
        const vehicle = await Vehicle.findByPk(req.params.id);
        if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' });
        const { name, brand, model, year, type, pricePerDay, location, description, features } = req.body;
        await vehicle.update({ name, brand, model, year, type, pricePerDay, location, description, features });
        res.json(vehicle);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error: ' + error.message });
    }
});

// Update vehicle images only (Replace / Delete Image)
router.patch('/:id/images', async (req, res) => {
    try {
        const vehicle = await Vehicle.findByPk(req.params.id);
        if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' });
        await vehicle.update({ images: req.body.images || [] });
        res.json(vehicle);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error: ' + error.message });
    }
});

// Delete vehicle (Delete Listing)
router.delete('/:id', async (req, res) => {
    try {
        const vehicle = await Vehicle.findByPk(req.params.id);
        if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' });
        await vehicle.destroy();
        res.json({ message: 'Vehicle deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error: ' + error.message });
    }
});

module.exports = router;

