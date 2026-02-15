const db = require('./db');

async function resetUsers() {
    try {
        console.log("Checking existing users...");
        const [users] = await db.query("SELECT COUNT(*) as count FROM users");
        console.log(`Found ${users[0].count} users.`);

        console.log("Deleting all user records (FULL RESET)...");
        await db.query("DELETE FROM users");

        console.log("✅ All users deleted successfully. ID counters will continue from last value unless reset (TRUNCATE was not used to stay safe with foreign keys if any, though DELETE is safer for now).");

        // Optional: Reset auto increment if needed, but DELETE is safer for now as per user Option 1 "DELETE FROM users"
        // await db.query("ALTER TABLE users AUTO_INCREMENT = 1"); 

        process.exit(0);
    } catch (err) {
        console.error("❌ Error deleting users:", err);
        process.exit(1);
    }
}

resetUsers();
