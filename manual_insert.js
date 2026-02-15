const mysql = require('mysql2/promise');
require('dotenv').config();

async function insertUser() {
    let connection;
    try {
        connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
        });

        console.log("🔌 Connected to database...");

        // Check if user exists first to be clean
        const [rows] = await connection.query("SELECT id FROM users WHERE email = 'lg1089776@gmail.com'");
        if (rows.length > 0) {
            console.log("⚠️ User 'lg1089776@gmail.com' already exists. Skipping insert.");
            process.exit(0);
        }

        const sql = `
            INSERT INTO users (name, email, password_hash, role, is_active, class)
            VALUES (
                'Abi',
                'lg1089776@gmail.com',
                '$2b$10$QeWkQ6zUO9wzP4QZKxR9eO8KZ7jzjFh5s3nqYxQe9wQ5z9vY2uY6S',
                'student',
                1,
                '10th Grade'
            )
        `;

        // Note: I added 'class' (10th Grade) to ensure the student profile is complete for the demo.

        await connection.query(sql);
        console.log("✅ User 'Abi' inserted successfully.");

    } catch (err) {
        console.error("❌ Error inserting user:", err);
    } finally {
        if (connection) await connection.end();
    }
}

insertUser();
