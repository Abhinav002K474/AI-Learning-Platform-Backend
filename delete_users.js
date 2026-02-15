const db = require('./db');

async function deleteUsers() {
    try {
        console.log("⚠️ STARTING FULL USER RESET...");

        // 1. Delete all users
        const [result] = await db.query("DELETE FROM users");
        console.log(`✅ Deleted ${result.affectedRows} users.`);

        // 2. Reset Auto Increment (Optional but cleaner)
        await db.query("ALTER TABLE users AUTO_INCREMENT = 1");
        console.log("✅ Auto-increment counter reset.");

        console.log("🚀 User table is now empty. Please register new accounts to ensure correct password hashing.");
        process.exit(0);

    } catch (err) {
        console.error("❌ Error deleting users:", err);
        process.exit(1);
    }
}

deleteUsers();
