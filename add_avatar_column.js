const db = require('./db');

async function updateSchema() {
    try {
        console.log("Checking and Updating Schema...");

        // Add avatar column
        try {
            await db.query("ALTER TABLE users ADD COLUMN avatar VARCHAR(50) DEFAULT 'boy1'");
            console.log("✅ 'avatar' column added.");
        } catch (err) {
            if (err.code === 'ER_DUP_FIELDNAME') {
                console.log("ℹ️ 'avatar' column already exists.");
            } else {
                console.error("Error adding avatar column:", err);
            }
        }

        // Add proper null handling - Update existing users who might have null avatar
        await db.query("UPDATE users SET avatar = 'boy1' WHERE avatar IS NULL OR avatar = ''");
        console.log("✅ Existing null/empty avatars updated to 'boy1'.");

        console.log("Schema Update Complete.");
        process.exit();
    } catch (err) {
        console.error("Fatal Error:", err);
        process.exit(1);
    }
}

updateSchema();
