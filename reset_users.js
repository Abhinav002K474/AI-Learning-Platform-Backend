const db = require('./db');

async function resetUsers() {
    try {
        console.log("⚠️  Attempting to DELETE ALL users from the database...");

        const [result] = await db.query("DELETE FROM users");

        console.log(`✅ Success! Deleted ${result.affectedRows} user records.`);
        console.log("🔄 You can now register fresh accounts.");

        process.exit(0);
    } catch (err) {
        console.error("❌ Error resetting users table:", err);
        process.exit(1);
    }
}

resetUsers();
