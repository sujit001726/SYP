const { Booking } = require('./models');
const { connectDB } = require('./db/connection');

async function checkBookings() {
    await connectDB();
    const bookings = await Booking.findAll();
    const data = bookings.map(b => ({
        id: b.id,
        status: b.status,
        startDate: b.startDate,
        endDate: b.endDate
    }));
    console.log(JSON.stringify(data, null, 2));
    process.exit(0);
}
checkBookings();
