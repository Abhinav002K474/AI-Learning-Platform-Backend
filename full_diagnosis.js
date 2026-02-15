const mysql = require('mysql2/promise');
require('dotenv').config({ path: 'backend/.env' }); // Explicit path to .env in backend folder

async function diagnose() {
    console.log("=== DIAGNOSIS START ===");
    console.log("Attempting connection with:");
    console.log("HOST:", process.env.DB_HOST);
    console.log("USER:", process.env.DB_USER);
    console.log("DB:", process.env.DB_NAME);
    // console.log("PASS:", process.env.DB_PASSWORD); // Hide pass for log safety

    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '', // Default to empty string if not set
            database: process.env.DB_NAME || 'school_db'
        });

        console.log("✅ Connected to Database");

        // STEP 1 & 2: Verify Table Structure
        console.log("\n--- TABLE STRUCTURE (DESCRIBE users) ---");
        const [columns] = await connection.query("DESCRIBE users");
        console.table(columns);

        // STEP 3: Verify Users Exist
        console.log("\n--- EXISTING USERS (SELECT * FROM users) ---");
        const [users] = await connection.query("SELECT id, name, email, phone, role, password_hash, is_active FROM users");
        console.table(users);

        await connection.end();
    } catch (error) {
        console.error("❌ Diagnosis Failed:", error);
    }
    console.log("=== DIAGNOSIS END ===");
}

diagnose();
