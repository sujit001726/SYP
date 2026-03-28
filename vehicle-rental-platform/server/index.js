const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config(); // Trigger reload
const http = require('http');
const socketManager = require('./socket/socketManager');


const { connectDB, sequelize } = require('./db/connection');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Basic Route
app.get('/', (req, res) => {
    res.send('Vehicle Rental API is running...');
});

// Port
const PORT = process.env.PORT || 5000;

const { User, Vehicle, Booking } = require('./models');

// Routes
console.log("Initializing routes...");
app.use('/api/auth', require('./routes/auth.routes.js'));
app.use('/api/vehicles', require('./routes/vehicle.routes.js'));
app.use('/api/bookings', require('./routes/booking.routes.js'));
app.use('/api/users', require('./routes/user.routes.js'));
app.use('/api/media', require('./routes/upload.routes.js'));
app.use('/api/admin-v2', require('./routes/admin.js'));
app.use('/api/payments', require('./routes/payment.routes.js'));
app.use('/api/wallet', require('./routes/wallet.routes.js'));
app.use('/api/notifications', require('./routes/notification.routes.js'));
app.use('/api/reviews', require('./routes/review.routes.js'));
app.use('/api/messages', require('./routes/message.routes.js'));


// Create HTTP server for Socket.io
const server = http.createServer(app);
const io = socketManager(server);

// Make io accessible in routes
app.use((req, res, next) => {
    req.io = io;
    next();
});

// Connect to Database and Start Server
const startServer = async () => {
    await connectDB();

    // Sync models
    try {
        await sequelize.sync({ alter: true });
        console.log('Database models synced successfully.');
    } catch (error) {
        console.error('Error syncing database models:', error);
    }

    server.listen(PORT, '0.0.0.0', () => {
        console.log(`Server is running on port ${PORT}`);
    });
};

startServer();

