const { Vehicle } = require('./models');
const { sequelize } = require('./db/connection');

async function updateVehicles() {
    try {
        await sequelize.authenticate();

        // Update Mahindra Scorpio S11
        await Vehicle.update(
            { images: ['/src/assets/scorpio.jpg'] },
            { where: { name: 'Mahindra Scorpio S11' } }
        );
        console.log('Updated Mahindra Scorpio S11');

        // Update Toyota Hilux Adventure
        await Vehicle.update(
            { images: ['/src/assets/toyota.jpg'] },
            { where: { name: 'Toyota Hilux Adventure' } }
        );
        console.log('Updated Toyota Hilux Adventure');

        // Update Royal Enfield 350
        await Vehicle.update(
            { images: ['/src/assets/bullet.jpg'] },
            { where: { name: 'Royal Enfield 350' } }
        );
        console.log('Updated Royal Enfield 350');

        // Update Bajaj Pulsar NS200
        await Vehicle.update(
            { images: ['/src/assets/ns.jpg'] },
            { where: { name: 'Bajaj Pulsar NS200' } }
        );
        console.log('Updated Bajaj Pulsar NS200');

        // Update Honda Dio
        await Vehicle.update(
            { images: ['/src/assets/dio.jpg'] },
            { where: { name: 'Honda Dio' } }
        );
        console.log('Updated Honda Dio');

    } catch (err) {
        console.error('Error updating vehicles:', err);
    } finally {
        process.exit();
    }
}

updateVehicles();
