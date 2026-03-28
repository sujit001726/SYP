const { Booking, Vehicle, User } = require('./models');
const { sequelize } = require('./db/connection');

async function checkBookings() {
    try {
        await sequelize.authenticate();
        const bookings = await Booking.findAll({
            include: [
                { model: Vehicle, as: 'vehicle' },
                { model: User, as: 'seeker', attributes: ['username', 'email'] }
            ]
        });
        console.log(`Total Bookings: ${bookings.length}`);
        bookings.forEach(b => {
            console.log(`- ID: ${b.id}, User: ${b.seeker?.username}, Vehicle: ${b.vehicle?.name}, Status: ${b.status}`);
        });
    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}

checkBookings();
