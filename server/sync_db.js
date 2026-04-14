const { sequelize } = require('./db/connection');
const models = require('./models'); // Ensure all models are loaded

const syncDb = async () => {
    try {
        await sequelize.authenticate();
        console.log('Database connected.');
        await sequelize.sync({ alter: true });
        console.log('Database synced successfully.');
    } catch (err) {
        console.error('Sync failed:', err);
    } finally {
        await sequelize.close();
    }
};

syncDb();
