const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const db = require('../db'); // Assuming db.js exports pool

// Upload Config
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = path.join(__dirname, '../uploads/temp');
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ storage });

// Helper to insert questions
async function insertQuestions(questions) {
    let count = 0;
    for (const q of questions) {
        // Validate required fields
        if (!q.question || !q.options || q.correct_option === undefined) continue;

        // Ensure options is JSON string
        const optionsStr = typeof q.options === 'string' ? q.options : JSON.stringify(q.options);

        // Default values
        const qClass = q.class || 'General';
        const subject = q.subject || 'General';
        const chapter = q.chapter || '';
        const diff = q.difficulty || 'Medium';
        const src = q.source || 'Upload';

        try {
            await db.execute(
                `INSERT INTO question_bank 
                (class, subject, chapter, question_text, options, correct_option, difficulty, source) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [qClass, subject, chapter, q.question, optionsStr, q.correct_option, diff, src]
            );
            count++;
        } catch (err) {
            console.error("Insert Error:", err.message);
        }
    }
    return count;
}

// Route: Upload Question Bank
router.post('/admin/question-bank/upload', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: "No file uploaded" });

        const filePath = req.file.path;
        const ext = path.extname(req.file.originalname).toLowerCase();
        let questions = [];

        // Parse File
        if (ext === '.json') {
            const data = fs.readFileSync(filePath, 'utf8');
            questions = JSON.parse(data);
            // Support array or single object wrapper
            if (!Array.isArray(questions) && questions.questions) {
                questions = questions.questions;
            }
        } else if (ext === '.csv') {
            // Stream parse
            await new Promise((resolve, reject) => {
                fs.createReadStream(filePath)
                    .pipe(csv())
                    .on('data', (row) => {
                        // Map CSV row to Object
                        // Expected: class, subject, question, option1, option2, option3, option4, correct_index
                        const opts = [row.option1, row.option2, row.option3, row.option4].filter(o => o);
                        questions.push({
                            class: row.class || req.body.class,
                            subject: row.subject || req.body.subject,
                            chapter: row.chapter,
                            question: row.question,
                            options: opts,
                            correct_option: parseInt(row.correct_index) || 0,
                            difficulty: row.difficulty,
                            source: row.source
                        });
                    })
                    .on('end', resolve)
                    .on('error', reject);
            });
        } else {
            return res.status(400).json({ error: "Invalid format. Use JSON or CSV." });
        }

        // Insert to DB
        const insertedCount = await insertQuestions(questions);

        // Cleanup
        fs.unlinkSync(filePath);

        res.json({ success: true, message: `Successfully imported ${insertedCount} questions.` });

    } catch (err) {
        console.error("QB Upload Error:", err);
        res.status(500).json({ error: err.message });
    }
});

// Route: Get Questions (for Teacher Build)
router.get('/teacher/questions', async (req, res) => {
    try {
        const { subject, class: qClass, limit } = req.query;
        let sql = "SELECT * FROM question_bank WHERE 1=1";
        const params = [];

        if (subject) {
            sql += " AND subject = ?";
            params.push(subject);
        }
        if (qClass) {
            sql += " AND class = ?";
            params.push(qClass);
        }

        // Randomize
        sql += " ORDER BY RAND()";

        if (limit) {
            sql += " LIMIT ?";
            params.push(parseInt(limit));
        } else {
            sql += " LIMIT 50"; // Default safety
        }

        const [rows] = await db.execute(sql, params);
        res.json({ success: true, questions: rows });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
