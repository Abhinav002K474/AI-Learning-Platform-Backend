require('dotenv').config();
const mysql = require('mysql2/promise');

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'school_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

async function fixNullAssessments() {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        console.log("Connected to database.");

        const [checkRows] = await connection.query(`
            SELECT id, title, date, start_time, end_time
            FROM assessments
            WHERE date IS NULL OR start_time IS NULL OR end_time IS NULL
        `);

        console.log(`Found ${checkRows.length} invalid assessments.`);

        if (checkRows.length > 0) {
            const [result] = await connection.query(`
                DELETE FROM assessments
                WHERE date IS NULL OR start_time IS NULL OR end_time IS NULL
            `);
            console.log(`Deleted ${result.affectedRows} invalid assessments.`);
        } else {
            console.log("No invalid assessments found.");
        }

    } catch (error) {
        console.error("Error executing cleanup:", error);
    } finally {
        if (connection) await connection.end();
    }
}

fixNullAssessments();
