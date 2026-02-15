USE school_db;
CREATE TABLE IF NOT EXISTS question_bank (
    id INT AUTO_INCREMENT PRIMARY KEY,
    class VARCHAR(50),
    subject VARCHAR(50),
    chapter VARCHAR(100),
    question_text TEXT NOT NULL,
    options JSON,
    correct_option INT,
    -- 0-based index
    difficulty ENUM('Easy', 'Medium', 'Hard') DEFAULT 'Medium',
    source VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS assessments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(100),
    class VARCHAR(50),
    subject VARCHAR(50),
    created_by INT,
    -- Teacher User ID
    status ENUM('draft', 'published', 'closed') DEFAULT 'draft',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS assessment_questions (
    assessment_id INT,
    question_id INT,
    question_order INT,
    FOREIGN KEY (assessment_id) REFERENCES assessments(id) ON DELETE CASCADE,
    FOREIGN KEY (question_id) REFERENCES question_bank(id) ON DELETE CASCADE,
    PRIMARY KEY (assessment_id, question_id)
);