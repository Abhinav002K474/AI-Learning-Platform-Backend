const db = require('./db');

async function truncateUsers() {
    try {
        console.log("⚠️ STARTING HARD RESET (TRUNCATE)...");

        // Truncate is faster and resets auto-increment
        await db.query("TRUNCATE TABLE users");
        console.log("✅ Table 'users' TRUNCATED (Empty & Auto-inc reset).");

        console.log("🚀 DATABASE IS CLEAN. PLEASE REGISTER A NEW USER.");
        process.exit(0);

    } catch (err) {
        console.error("❌ Error truncating users:", err);
        process.exit(1);
    }
}

truncateUsers();
