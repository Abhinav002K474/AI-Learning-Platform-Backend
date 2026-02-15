const db = require('./db');

(async () => {
    try {
        console.log("Attempting to add 'duration_minutes' column to 'assessments' table...");
        await db.query("ALTER TABLE assessments ADD COLUMN duration_minutes INT DEFAULT 30");
        console.log("✅ 'duration_minutes' column added successfully.");
    } catch (err) {
        if (err.code === 'ER_DUP_FIELDNAME') {
            console.log("ℹ️ 'duration_minutes' column already exists.");
        } else {
            console.error("❌ Error adding 'duration_minutes':", err.message);
        }
    }   

    try {
        console.log("Attempting to add 'teacher_id' column to 'assessments' table (if missing)...");
        await db.query("ALTER TABLE assessments ADD COLUMN teacher_id INT");
        console.log("✅ 'teacher_id' column added successfully.");
    } catch (err) {
        if (err.code === 'ER_DUP_FIELDNAME') {
            console.log("ℹ️ 'teacher_id' column already exists.");
        } else {
            console.error("❌ Error adding 'teacher_id':", err.message);
        }
    }

    process.exit();
})();
