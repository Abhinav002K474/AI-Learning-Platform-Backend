const mysql = require('mysql2/promise');
require('dotenv').config({ path: 'backend/.env' });

async function checkUser() {
    console.log("=== CHECK USER START ===\n");
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'school_db'
        });

        // Query 1: Requested User
        const targetEmail = 'test@email.com';
        console.log(`Checking for: ${targetEmail}`);

        const [rows] = await connection.query(
            "SELECT id, name, email, role, password_hash FROM users WHERE email = ?",
            [targetEmail]
        );

        console.table(rows);

        if (rows.length === 0) {
            console.log("❌ User NOT found.");
        } else {
            console.log("✅ User FOUND.");
            console.log("Hash:", rows[0].password_hash);
        }

        // Query 2: Check deepak@gmail.com (from screenshot context) just in case
        console.log("\n(Also checking deepak@gmail.com just in case...)");
        const [rows2] = await connection.query(
            "SELECT id, name, email, role, password_hash FROM users WHERE email = ?",
            ['deepak@gmail.com']
        );
        console.table(rows2);

        await connection.end();
    } catch (error) {
        console.error("Error:", error);
    }
    console.log("\n=== CHECK USER END ===");
}

checkUser();
