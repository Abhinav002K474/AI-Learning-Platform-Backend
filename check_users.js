const db = require('./db');

async function showUsers() {
    try {
        console.log("=== CHECKING USERS TABLE ===");
        const [rows] = await db.query("SELECT id, name, email, phone, role, password_hash FROM users");

        if (rows.length === 0) {
            console.log("⚠️ No users found in the database.");
        } else {
            console.log(`✅ Found ${rows.length} users:`);
            rows.forEach(u => {
                console.log("------------------------------------------------");
                console.log(`ID: ${u.id}`);
                console.log(`Name: ${u.name}`);
                console.log(`Email: ${u.email}`);
                console.log(`Phone: ${u.phone}`);
                console.log(`Role: ${u.role}`);
                console.log(`Password Hash: ${u.password_hash ? u.password_hash.substring(0, 20) + '...' : '(empty)'}`);
                console.log("------------------------------------------------");
            });
        }
        process.exit(0);
    } catch (err) {
        console.error("❌ Error fetching users:", err);
        process.exit(1);
    }
}

showUsers();
