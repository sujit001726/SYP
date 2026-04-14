const { DataTypes } = require('sequelize');
const { sequelize } = require('../db/connection');

const Transaction = sequelize.define('Transaction', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    userId: {
        type: DataTypes.UUID,
        allowNull: false
    },
    bookingId: {
        type: DataTypes.UUID,
        allowNull: true
    },
    type: {
        type: DataTypes.ENUM('credit', 'debit'),
        allowNull: false
    },
    amount: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false
    },
    description: {
        type: DataTypes.STRING,
        allowNull: true
    },
    category: {
        type: DataTypes.ENUM('payment', 'topup', 'withdrawal', 'refund', 'earning'),
        defaultValue: 'payment'
    },
    status: {
        type: DataTypes.ENUM('pending', 'completed', 'failed'),
        defaultValue: 'completed'
    }
});

module.exports = Transaction;
