const mysql = require('mysql2/promise');
require('dotenv').config({ path: 'backend/.env' });

async function verify() {
    console.log("=== VERIFICATION START ===");
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST === 'localhost' ? '127.0.0.1' : process.env.DB_HOST,
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'school_db'
        });

        console.log("✅ Connected to Database");

        console.log("\n--- QUERY 1: SELECT DISTINCT class, subject FROM question_bank ---");
        const [rows1] = await connection.query("SELECT DISTINCT class, subject FROM question_bank");
        if (rows1.length === 0) {
            console.log("Result: [EMPTY]");
        } else {
            console.table(rows1);
        }

        console.log("\n--- QUERY 2: SELECT COUNT(*) FROM question_bank WHERE subject = 'Mathematics' AND class = '10A' ---");
        const [rows2] = await connection.query("SELECT COUNT(*) as count FROM question_bank WHERE subject = 'Mathematics' AND class = '10A'");
        console.log("Count:", rows2[0].count);

        await connection.end();
    } catch (error) {
        console.error("❌ Verification Failed:", error.message);
        console.error("Code:", error.code);
        console.error("Errno:", error.errno);
    }
    console.log("=== VERIFICATION END ===");
}

verify();
