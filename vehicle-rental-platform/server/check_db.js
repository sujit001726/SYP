const { Vehicle } = require('./models');
const { sequelize } = require('./db/connection');

async function check() {
    try {
        await sequelize.authenticate();
        const vehicles = await Vehicle.findAll();
        console.log(`Total Vehicles: ${vehicles.length}`);
        vehicles.forEach(v => {
            console.log(`- ${v.name} (${v.pricePerDay}) - Images: ${JSON.stringify(v.images)}`);
        });
    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}

check();
