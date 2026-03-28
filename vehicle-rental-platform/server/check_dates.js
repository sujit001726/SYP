const { Booking } = require('./models');
const { connectDB } = require('./db/connection');

async function checkBookings() {
    await connectDB();
    const bookings = await Booking.findAll();
    console.log(`Found ${bookings.length} bookings.`);
    if (bookings.length > 0) {
        console.log(bookings[0].toJSON());
        console.log(bookings.map(b => ({
            id: b.id,
            status: b.status,
            startDate: b.startDate,
            endDate: b.endDate
        })));
    }
    process.exit(0);
}

checkBookings();
