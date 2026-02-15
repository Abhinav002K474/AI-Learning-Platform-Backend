const db = require('./db');
const bcrypt = require('bcryptjs');

async function fixTeacherLogin() {
    console.log("=== FIXING TEACHER LOGIN ===");

    const email = "raju@gmail.com";
    const password = "password";
    const name = "Raju Teacher";
    const role = "teacher";

    try {
        // 1. Check if user exists
        const [existing] = await db.query("SELECT * FROM users WHERE email = ?", [email]);

        if (existing.length > 0) {
            console.log(`User ${email} found.`);
            console.log("Current Role:", existing[0].role);

            // Update to ensure correct role and password
            const hash = await bcrypt.hash(password, 10);
            await db.query("UPDATE users SET password_hash = ?, role = ? WHERE email = ?", [hash, role, email]);
            console.log("✅ Updated existing user to Teacher role with known password.");

        } else {
            // Create new teacher
            const hash = await bcrypt.hash(password, 10);
            await db.query(
                "INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)",
                [name, email, hash, role]
            );
            console.log("✅ Created NEW Teacher account.");
        }

        console.log("\n👉 LOGIN DETAILS:");
        console.log(`Email: ${email}`);
        console.log(`Password: ${password}`);
        console.log(`Role: ${role}`);

    } catch (err) {
        console.error("Error fixing teacher login:", err);
    } finally {
        process.exit();
    }
}

fixTeacherLogin();
