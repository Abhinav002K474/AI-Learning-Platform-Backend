const db = require('./db');
const bcrypt = require('bcryptjs');

async function insertTestUser() {
    console.log("=== STEP 6: MANUAL INSERT TEST USER ===");
    const name = 'Test User';
    const email = 'manual@test.com';
    const password = 'password';
    const role = 'student';
    // Hash provided by user
    const hash = '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36Vf4bR4F7k6T8wK6';

    try {
        // Cleanup first
        await db.query("DELETE FROM users WHERE email = ?", [email]);

        const [result] = await db.query(
            `INSERT INTO users (name, email, password_hash, role)
             VALUES (?, ?, ?, ?)`,
            [name, email, hash, role]
        );
        console.log("✅ INSERT SUCCESS. ID:", result.insertId);
        console.log(`You can now login with:\nEmail: ${email}\nPassword: ${password}`);
    } catch (err) {
        console.error("❌ INSERT FAILED:", err.message);
    } finally {
        process.exit();
    }
}

insertTestUser();
