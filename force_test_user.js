const db = require('./db');

async function forceTestUser() {
    try {
        console.log("🔍 Checking Database Consistency...");

        // 1. Check Table
        const [tables] = await db.query("SHOW TABLES LIKE 'users'");
        if (tables.length === 0) {
            console.error("❌ CRITICAL: 'users' table does not exist!");
            process.exit(1);
        }
        console.log("✅ Table 'users' exists.");

        // 2. Check/Insert User
        const email = 'student@test.com';
        const [users] = await db.query("SELECT * FROM users WHERE email = ?", [email]);

        const validHash = '$2b$10$QeWkQ6zUO9wzP4QZKxR9eO8KZ7jzjFh5s3nqYxQe9wQ5z9vY2uY6S'; // password123

        if (users.length === 0) {
            console.log("⚠️ User not found. Inserting force test user...");
            await db.query(
                `INSERT INTO users (name, email, password_hash, role, is_active, class) 
                 VALUES (?, ?, ?, ?, ?, ?)`,
                ['Test Student', email, validHash, 'student', 1, '10th Grade']
            );
            console.log("✅ User 'student@test.com' inserted successfully.");
        } else {
            console.log("ℹ️ User exists. Updating password to ensure match...");
            await db.query("UPDATE users SET password_hash = ?, is_active = 1 WHERE email = ?", [validHash, email]);
            console.log("✅ User password reset to 'password123'.");
        }

        console.log("\n✅ DATABASE READY. TRY LOGIN NOW:");
        console.log("📧 Email: student@test.com");
        console.log("🔑 Password: password123");
        console.log("🎭 Role: Student");

        process.exit(0);

    } catch (err) {
        console.error("❌ Error:", err);
        process.exit(1);
    }
}

forceTestUser();
