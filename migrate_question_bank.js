const db = require('./db');

(async () => {
    try {
        console.log("Migration: Disabling foreign keys...");
        await db.execute("SET FOREIGN_KEY_CHECKS = 0");

        console.log("Migration: Dropping old question_bank table...");
        await db.execute("DROP TABLE IF EXISTS question_bank");

        console.log("Migration: Creating new question_bank table...");
        const sql = `
            CREATE TABLE question_bank (
              id INT AUTO_INCREMENT PRIMARY KEY,
              class INT NOT NULL,
              subject VARCHAR(50) NOT NULL,
              question TEXT NOT NULL,
              option_a TEXT NOT NULL,
              option_b TEXT NOT NULL,
              option_c TEXT NOT NULL,
              option_d TEXT NOT NULL,
              correct_index INT NOT NULL,
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `;
        await db.execute(sql);

        console.log("Migration: Re-enabling foreign keys...");
        await db.execute("SET FOREIGN_KEY_CHECKS = 1");

        console.log("✅ Table question_bank recreated successfully.");
        process.exit(0);
    } catch (err) {
        console.error("Migration Failed:", err);
        process.exit(1);
    }
})();
