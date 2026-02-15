const db = require('./db');

(async () => {
    try {
        console.log("Forcing status update...");
        // This query assumes the column allows 'PUBLISHED'
        await db.query("UPDATE assessments SET status = 'PUBLISHED'");
        console.log("Updated all assessments to PUBLISHED");

        const [rows] = await db.query("SELECT * FROM assessments");
        console.log(rows);
    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
})();
