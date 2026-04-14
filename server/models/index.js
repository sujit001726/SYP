const User = require('./user.model');
const Vehicle = require('./vehicle.model');
const Booking = require('./booking.model');
const Transaction = require('./transaction.model');
const Notification = require('./notification.model');
const Review = require('./review.model');
const Message = require('./message.model');


// Associations

// User -> Notification
User.hasMany(Notification, { foreignKey: 'userId', as: 'notifications' });
Notification.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// User -> Vehicle (One-to-Many)
User.hasMany(Vehicle, { foreignKey: 'ownerId', as: 'ownedVehicles' });
Vehicle.belongsTo(User, { foreignKey: 'ownerId', as: 'owner' });

// User -> Booking (One-to-Many as Seeker)
User.hasMany(Booking, { foreignKey: 'seekerId', as: 'bookings' });
Booking.belongsTo(User, { foreignKey: 'seekerId', as: 'seeker' });

// Vehicle -> Booking (One-to-Many)
Vehicle.hasMany(Booking, { foreignKey: 'vehicleId', as: 'bookings' });
Booking.belongsTo(Vehicle, { foreignKey: 'vehicleId', as: 'vehicle' });

// User -> Transaction
User.hasMany(Transaction, { foreignKey: 'userId', as: 'transactions' });
Transaction.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Booking -> Transaction (One booking can have multiple transactions like payment + refund)
Booking.hasMany(Transaction, { foreignKey: 'bookingId', as: 'transactions' });
Transaction.belongsTo(Booking, { foreignKey: 'bookingId', as: 'booking' });

// User -> Review
User.hasMany(Review, { foreignKey: 'userId', as: 'givenReviews' });
Review.belongsTo(User, { foreignKey: 'userId', as: 'reviewer' });

// Vehicle -> Review
Vehicle.hasMany(Review, { foreignKey: 'vehicleId', as: 'reviews' });
Review.belongsTo(Vehicle, { foreignKey: 'vehicleId', as: 'vehicle' });

// Message Associations
User.hasMany(Message, { foreignKey: 'senderId', as: 'sentMessages' });
User.hasMany(Message, { foreignKey: 'receiverId', as: 'receivedMessages' });
Message.belongsTo(User, { foreignKey: 'senderId', as: 'sender' });
Message.belongsTo(User, { foreignKey: 'receiverId', as: 'receiver' });


const { sequelize } = require('../db/connection');

module.exports = {
    User,
    Vehicle,
    Booking,
    Transaction,
    Notification,
    Review,
    Message,
    sequelize
};
