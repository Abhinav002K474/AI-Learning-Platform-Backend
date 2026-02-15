const db = require('./db');

(async () => {
    try {
        console.log("Verifying PUBLISHED assessments...");
        const [rows] = await db.query(`
            SELECT id, title, subject, class, status, duration_minutes 
            FROM assessments 
            WHERE status = 'PUBLISHED'
        `);
        console.table(rows);

        if (rows.length === 0) {
            console.log("❌ No PUBLISHED assessments found.");
        } else {
            console.log("✅ Data exists.");
        }
    } catch (err) {
        console.error("Error executing query:", err);
    } finally {
        process.exit();
    }
})();
