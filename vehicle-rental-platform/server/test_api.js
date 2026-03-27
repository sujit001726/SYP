const { User } = require('./models');
const { connectDB } = require('./db/connection');
const jwt = require('jsonwebtoken');

async function testFetch() {
    await connectDB();
    const adminUser = await User.findOne({ where: { role: 'admin' } });
    if (!adminUser) {
        console.log("No admin user found.");
        process.exit(0);
    }
    
    console.log("Found admin user:", adminUser.email);
    
    // Create token
    const token = jwt.sign({ id: adminUser.id }, process.env.JWT_SECRET || 'yatrahub_premium_secret_key_2026', { expiresIn: '1d' });
    
    const response = await fetch('http://localhost:5000/api/admin-v2/bookings', {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const data = await response.json();
    console.log("Response status:", response.status);
    console.log("Total Bookings from API:", data.length);
    if(data.length > 0) {
        console.log("Sample:", data[0].startDate, data[0].endDate);
    }
    process.exit(0);
}
testFetch();
