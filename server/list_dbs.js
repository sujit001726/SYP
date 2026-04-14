const { Client } = require('pg');
require('dotenv').config();

const listDbs = async () => {
    const client = new Client({
        user: process.env.DB_USER,
        host: process.env.DB_HOST,
        database: 'postgres',
        password: process.env.DB_PASSWORD,
        port: process.env.DB_PORT,
    });

    try {
        await client.connect();
        const res = await client.query("SELECT datname FROM pg_database WHERE datistemplate = false;");
        console.log('Databases:', res.rows.map(r => r.datname));
    } catch (err) {
        console.error('Error:', err);
    } finally {
        await client.end();
    }
};

listDbs();
