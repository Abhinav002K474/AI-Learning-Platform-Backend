const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: 'backend/.env' });

async function fixUser() {
    console.log("=== CREATING USER deepak@gmail.com ===");
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'school_db'
        });

        // 1. Hash Password
        const password = 'password';
        const hashedPassword = await bcrypt.hash(password, 10);
        console.log(`Password 'password' hashed to: ${hashedPassword.substring(0, 20)}...`);

        // 2. Check if exists
        const [existing] = await connection.query("SELECT * FROM users WHERE email = ?", ['deepak@gmail.com']);

        if (existing.length > 0) {
            console.log("User exists. Updating password...");
            await connection.query("UPDATE users SET password_hash = ?, role = 'student', is_active = 1 WHERE email = ?", [hashedPassword, 'deepak@gmail.com']);
        } else {
            console.log("User does NOT exist. Inserting...");
            await connection.query(
                "INSERT INTO users (name, email, phone, password_hash, role, class, is_active) VALUES (?, ?, ?, ?, ?, ?, ?)",
                ['Deepak Student', 'deepak@gmail.com', '9999999999', hashedPassword, 'student', 'Class 10', 1]
            );
        }

        console.log("✅ SUCCESS: User deepak@gmail.com is ready with password: 'password'");
        await connection.end();

    } catch (error) {
        console.error("❌ Failed:", error);
    }
}

fixUser();
