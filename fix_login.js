const db = require('./db');
const bcrypt = require('bcryptjs');

async function checkAndFix() {
    console.log("=== DEBUGGING INVALID CREDENTIALS ===");

    // 1. Check existing users
    const [users] = await db.query("SELECT * FROM users");
    console.log(`Current User Count: ${users.length}`);
    if (users.length > 0) {
        console.table(users);
    } else {
        console.log("❌ DATABASE IS EMPTY (This is why login fails!)");
    }

    // 2. Insert Emergency Test User
    console.log("\ncreating emergency test user...");
    const name = "Emergency User";
    const email = "test@test.com";
    const pass = "password";
    // Generate hash manually to be 100% sure
    const hash = await bcrypt.hash(pass, 10);
    const role = "student";
    const className = "Class 10";

    try {
        // Delete if exists to avoid conflict
        await db.query("DELETE FROM users WHERE email = ?", [email]);

        await db.query(
            "INSERT INTO users (name, email, password_hash, role, class) VALUES (?, ?, ?, ?, ?)",
            [name, email, hash, role, className]
        );

        console.log(`\n✅ CREATED TEST USER:\nEmail: ${email}\nPassword: ${pass}\nRole: ${role}`);
        console.log("👉 PLEASE TRY LOGGING IN WITH THIS EXACT ACCOUNT NOW.");

    } catch (err) {
        console.error("Insert failed:", err);
    } finally {
        process.exit();
    }
}

checkAndFix();
