const db = require('./db');

(async () => {
    try {
        console.log("Fixing assessment status case...");
        // Update lowercase 'published' to 'PUBLISHED'
        const [result] = await db.query("UPDATE assessments SET status = 'PUBLISHED' WHERE status = 'published'");
        console.log(`Updated ${result.affectedRows} rows to uppercase PUBLISHED.`);

        // Check data again
        const [rows] = await db.query("SELECT id, title, subject, class, status FROM assessments");
        console.log("Current Data:", JSON.stringify(rows, null, 2));

    } catch (err) {
        console.error("Error", err);
    } finally {
        process.exit();
    }
})();
