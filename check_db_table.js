const db = require('./db');

async function checkTable() {
    try {
        console.log("Checking database connection...");
        const [rows] = await db.query("SELECT 1");
        console.log("✅ Database connected successfully.");

        console.log("Checking 'users' table structure...");
        const [columns] = await db.query("DESCRIBE users");
        console.log("✅ 'users' table exists. Columns:");
        columns.forEach(col => console.log(` - ${col.Field} (${col.Type})`));

        console.log("Checking for 'student' role users...");
        const [students] = await db.query("SELECT id, name, email FROM users WHERE role='student' LIMIT 5");
        console.log(`Found ${students.length} students.`);
        students.forEach(s => console.log(` - ${s.name} (${s.email})`));

        process.exit(0);
    } catch (err) {
        console.error("❌ Database Check Failed:", err.message);
        if (err.code) console.error("Error Code:", err.code);
        process.exit(1);
    }
}

checkTable();
