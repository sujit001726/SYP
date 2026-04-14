const { DataTypes } = require('sequelize');
const { sequelize } = require('../db/connection');

const Vehicle = sequelize.define('Vehicle', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    ownerId: {
        type: DataTypes.UUID,
        allowNull: false
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    brand: {
        type: DataTypes.STRING,
        allowNull: false
    },
    model: {
        type: DataTypes.STRING,
        allowNull: false
    },
    year: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    type: {
        type: DataTypes.STRING,
        defaultValue: 'car'
    },
    serviceType: {
        type: DataTypes.STRING,
        defaultValue: 'rent' // 'rent' or 'ride'
    },
    pricePerDay: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    location: {
        type: DataTypes.STRING,
        allowNull: false
    },
    lat: {
        type: DataTypes.DECIMAL(10, 8),
        allowNull: true
    },
    lng: {
        type: DataTypes.DECIMAL(11, 8),
        allowNull: true
    },
    registrationNumber: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    features: {
        type: DataTypes.JSONB,
        defaultValue: []
    },
    images: {
        type: DataTypes.JSONB,
        defaultValue: []
    },
    status: {
        type: DataTypes.ENUM('available', 'rented', 'maintenance'),
        defaultValue: 'available'
    },
    isVerified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    }
});

module.exports = Vehicle;
