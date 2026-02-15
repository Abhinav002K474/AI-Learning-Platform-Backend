const db = require('./db');

async function insertFinalTestUser() {
    try {
        const email = 'test@student.com';
        // password123 hash
        const hash = '$2b$10$QeWkQ6zUO9wzP4QZKxR9eO8KZ7jzjFh5s3nqYxQe9wQ5z9vY2uY6S';

        console.log(`Checking for ${email}...`);
        const [existing] = await db.query("SELECT * FROM users WHERE email = ?", [email]);

        if (existing.length > 0) {
            console.log("User exists. Resetting password and active status...");
            await db.query("UPDATE users SET password_hash = ?, role = 'student', is_active = 1 WHERE email = ?", [hash, email]);
        } else {
            console.log("Inserting new test user...");
            await db.query(`
                INSERT INTO users (name, email, password_hash, role, is_active, class)
                VALUES ('Test User', ?, ?, 'student', 1, '10th Grade')
            `, [email, hash]);
        }

        console.log("\n✅ SUCCESS: User 'test@student.com' created/updated.");
        console.log("👉 Login now with Password: password123");
        process.exit(0);

    } catch (error) {
        console.error("❌ Error:", error);
        process.exit(1);
    }
}

insertFinalTestUser();
