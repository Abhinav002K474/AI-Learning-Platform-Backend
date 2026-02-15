const db = require('./db');

async function diagnose() {
    console.log("=== STEP 2: CHECKING TABLES ===");
    try {
        const [tables] = await db.query("SHOW TABLES");
        console.log("Tables in DB:", tables.map(t => Object.values(t)[0]));

        const tablesToCheck = ['users', 'students', 'student_users'];
        for (const table of tablesToCheck) {
            try {
                const [rows] = await db.query(`SELECT count(*) as count FROM ${table}`);
                console.log(`Table '${table}' has ${rows[0].count} rows.`);
            } catch (err) {
                console.log(`Table '${table}' does NOT exist or error: ${err.message}`);
            }
        }

        console.log("\n=== STEP 3: CHECKING LATEST USERS ===");
        try {
            const [users] = await db.query("SELECT id, name, email, role, created_at FROM users ORDER BY id DESC LIMIT 5");
            if (users.length === 0) {
                console.log("❌ No users found in 'users' table.");
            } else {
                console.table(users);
                console.log("✅ Users found. Check if recent signup is here.");
            }
        } catch (err) {
            console.error("Error querying users:", err.message);
        }

    } catch (err) {
        console.error("CRITICAL DB ERROR:", err);
    } finally {
        process.exit();
    }
}

diagnose();
