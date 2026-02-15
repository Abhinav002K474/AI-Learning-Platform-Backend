const db = require('./db');

(async () => {
    try {
        console.log("Describing assessments table...");
        const [rows] = await db.query("DESCRIBE assessments");
        console.log(JSON.stringify(rows, null, 2));
    } catch (err) {
        console.error("Error", err);
    } finally {
        process.exit();
    }
})();
