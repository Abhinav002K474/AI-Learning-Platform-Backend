const db = require('./db');

async function migrate() {
    console.log("Starting Assessment Tables Migration (MySQL)...");

    try {
        // 1. Create Assessments Table
        await db.query(`
            CREATE TABLE IF NOT EXISTS assessments (
                id INT AUTO_INCREMENT PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                subject VARCHAR(255) NOT NULL,
                class VARCHAR(50) NOT NULL,
                teacher_id INT,
                duration_minutes INT DEFAULT 30,
                status ENUM('DRAFT', 'PUBLISHED') DEFAULT 'DRAFT',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log("✅ Assessments table ready");

        // 2. Create Assessment Questions Table
        // Note: ensuring question_bank table exists is assumed, or constraints might fail if it doesn't.
        // We will skip strict FK constraint on question_id if we are unsure of question_bank schema details, 
        // to avoid migration failure, but ideally it should exist.
        // A safer approach for this additive step is to just create columns and index them.

        await db.query(`
            CREATE TABLE IF NOT EXISTS assessment_questions (
                assessment_id INT,
                question_id INT,
                INDEX (assessment_id),
                INDEX (question_id)
            )
        `);
        console.log("✅ Assessment Questions table ready");

        // 3. Create Assessment Results Table
        await db.query(`
            CREATE TABLE IF NOT EXISTS assessment_results (
                id INT AUTO_INCREMENT PRIMARY KEY,
                student_id INT,
                assessment_id INT,
                score INT,
                total_questions INT,
                percentage DECIMAL(5,2),
                completed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                INDEX (assessment_id),
                INDEX (student_id)
            )
        `);
        console.log("✅ Assessment Results table ready");

    } catch (err) {
        console.error("❌ Migration Failed:", err);
    } finally {
        process.exit();
    }
}

migrate();
