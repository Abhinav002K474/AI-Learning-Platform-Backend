const db = require('./db');

(async () => {
    try {
        console.log("Fixing ENUM definition...");
        // 1. Widen ENUM to include both cases temporarily
        await db.query("ALTER TABLE assessments MODIFY COLUMN status ENUM('DRAFT', 'PUBLISHED', 'draft', 'published') DEFAULT 'DRAFT'");
        console.log("ENUM widened.");

        // 2. Converge data to UPPERCASE
        await db.query("UPDATE assessments SET status = 'PUBLISHED' WHERE status = 'published' OR status = 'Published'");
        await db.query("UPDATE assessments SET status = 'DRAFT' WHERE status = 'draft'");
        console.log("Data normalized to uppercase.");

        // 3. Restrict ENUM to Uppercase only (clean up)
        await db.query("ALTER TABLE assessments MODIFY COLUMN status ENUM('DRAFT', 'PUBLISHED') DEFAULT 'DRAFT'");
        console.log("ENUM restricted to uppercase.");

        const [rows] = await db.query("SELECT * FROM assessments");
        console.log("Final Data:", rows);

    } catch (err) {
        console.error("Schema Fix Error:", err);
    } finally {
        process.exit();
    }
})();
