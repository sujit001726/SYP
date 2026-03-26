const { DataTypes } = require('sequelize');
const { sequelize } = require('../db/connection');

const Booking = sequelize.define('Booking', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    vehicleId: {
        type: DataTypes.UUID,
        allowNull: true
    },
    seekerId: {
        type: DataTypes.UUID,
        allowNull: false
    },
    startDate: {
        type: DataTypes.DATE,
        allowNull: false
    },
    endDate: {
        type: DataTypes.DATE,
        allowNull: false
    },
    totalAmount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    status: {
        type: DataTypes.ENUM('pending', 'confirmed', 'completed', 'cancelled'),
        defaultValue: 'pending'
    },
    paymentStatus: {
        type: DataTypes.ENUM('unpaid', 'paid', 'refunded'),
        defaultValue: 'unpaid'
    },
    type: {
        type: DataTypes.ENUM('Rent', 'Ride'),
        defaultValue: 'Rent'
    },
    transactionId: {
        type: DataTypes.STRING,
        allowNull: true
    }
});

module.exports = Booking;
