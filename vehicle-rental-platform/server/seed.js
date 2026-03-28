const { User, Vehicle } = require('./models');
const { sequelize } = require('./db/connection');

async function seed() {
    try {
        await sequelize.authenticate();
        console.log('Database connected for admin seeding...');

        // 1. Create Admin User
        const adminEmail = 'admin@gmail.com';
        let admin = await User.findOne({ where: { email: adminEmail } });
        if (!admin) {
            admin = await User.create({
                username: 'System Admin',
                email: adminEmail,
                password: 'admin123',
                role: 'admin'
            });
            console.log('✅ Admin user created: admin@gmail.com / admin123');
        } else {
            console.log('ℹ️ Admin user already exists.');
        }

        // 2. Create Owner User (if not exists)
        let owner = await User.findOne({ where: { role: 'owner' } });
        if (!owner) {
            owner = await User.create({
                username: 'ElitePartner',
                email: 'partner@yatrahub.com',
                password: 'password123',
                role: 'owner'
            });
            console.log('✅ Owner user created');
        }

        // 3. Create Seeker User (if not exists)
        let seeker = await User.findOne({ where: { role: 'seeker' } });
        if (!seeker) {
            seeker = await User.create({
                username: 'JohnSeeker',
                email: 'seeker@gmail.com',
                password: 'password123',
                role: 'seeker'
            });
            console.log('✅ Seeker user created');
        }

        // 4. Seed Vehicles (Clear old data first)
        console.log('🧹 Clearing old vehicle data...');
        await Vehicle.destroy({ where: {}, truncate: true, cascade: true });

        const vehicles = [
            {
                ownerId: owner.id,
                name: "Mahindra Scorpio S11",
                brand: "Mahindra",
                model: "S11",
                year: 2023,
                type: "SUV",
                pricePerDay: 8500,
                location: "Kathmandu",
                registrationNumber: "BA-PA-9999",
                images: ["https://images.unsplash.com/photo-1668506290810-14ecf053ecba?auto=format&fit=crop&q=80&w=800"],
                features: ["7 Seats", "4x4 Drive", "Rugged"],
                status: 'available'
            },
            {
                ownerId: owner.id,
                name: "Toyota Hilux Adventure",
                brand: "Toyota",
                model: "Hilux",
                year: 2024,
                type: "Car",
                pricePerDay: 14000,
                location: "Kathmandu",
                registrationNumber: "BA-PA-8888",
                images: ["https://images.unsplash.com/photo-1590059392253-9a3b2b0051ce?auto=format&fit=crop&q=80&w=800"],
                features: ["5 Seats", "Hill Assist", "Elite"],
                status: 'available'
            },
            {
                ownerId: owner.id,
                name: "Royal Enfield 350",
                brand: "Royal Enfield",
                model: "Classic 350",
                year: 2023,
                type: "Bike",
                pricePerDay: 2500,
                location: "Pokhara",
                registrationNumber: "BA-PA-7777",
                images: ["https://images.unsplash.com/photo-1615172282427-9a57ef2d142e?auto=format&fit=crop&q=80&w=800"],
                features: ["2 Seats", "350cc", "Classic"],
                status: 'available'
            },
            {
                ownerId: owner.id,
                name: "Hyundai Creta",
                brand: "Hyundai",
                model: "Creta",
                year: 2022,
                type: "Car",
                pricePerDay: 6000,
                location: "Kathmandu",
                registrationNumber: "BA-PA-6666",
                images: ["https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&q=80&w=800"],
                features: ["5 Seats", "AC", "Smooth"],
                status: 'available'
            }
        ];

        for (const v of vehicles) {
            const exists = await Vehicle.findOne({ where: { registrationNumber: v.registrationNumber } });
            if (!exists) {
                await Vehicle.create(v);
                console.log(`✅ Created vehicle: ${v.name}`);
            }
        }

        console.log('🚀 Hub Initialization Complete.');
    } catch (err) {
        console.error('❌ Seeding failed:', err);
    } finally {
        process.exit();
    }
}

seed();
