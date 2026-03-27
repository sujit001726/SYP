const { User } = require('./models');
const { sequelize } = require('./db/connection');

async function checkUser() {
    try {
        await sequelize.authenticate();
        const users = await User.findAll({
            attributes: ['id', 'username', 'email', 'role', 'profileImage']
        });
        users.forEach(u => {
            console.log(`- ${u.username} (${u.email}) - Image: ${u.profileImage}`);
        });
    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}

checkUser();
