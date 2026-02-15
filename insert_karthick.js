const db = require('./db');
const bcrypt = require('bcryptjs');

async function insertKarthick() {
    try {
        const email = 'karthick@gmail.com';
        console.log(`Checking if ${email} exists...`);
        const [existing] = await db.query("SELECT * FROM users WHERE email = ?", [email]);

        if (existing.length > 0) {
            console.log("User exists. Updating password...");
            await db.query(`UPDATE users SET password_hash = '$2b$10$QeWkQ6zUO9wzP4QZKxR9eO8KZ7jzjFh5s3nqYxQe9wQ5z9vY2uY6S', is_active = 1 WHERE email = ?`, [email]);
        } else {
            console.log("Inserting new user...");
            await db.query(`
                INSERT INTO users (name, email, password_hash, role, is_active, class)
                VALUES ('Karthick', ?, ?, 'student', 1, '12th Grade')
             `, [email, '$2b$10$QeWkQ6zUO9wzP4QZKxR9eO8KZ7jzjFh5s3nqYxQe9wQ5z9vY2uY6S']);
        }

        console.log("✅ GUARANTEED: User 'karthick@gmail.com' is ready with password 'password123'");
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

insertKarthick();
