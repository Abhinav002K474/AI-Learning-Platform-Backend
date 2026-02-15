const express = require("express");
const router = express.Router();
const fs = require("fs");
const db = require("../db");
const multer = require("multer");

// Configure Multer to handle file uploads
const upload = multer({ storage: multer.memoryStorage() });

router.post("/upload-admin-question-bank", upload.single('file'), async (req, res) => {
    console.log("📥 Upload Question Bank route HIT");
    try {
        console.log("REQ BODY:", req.body);
        console.log("REQ FILE:", req.file);

        if (!req.file) {
            return res.status(400).json({ error: "No question bank file received (Field: file)" });
        }
        const filePath = req.file.path; // multer upload
        const raw = fs.readFileSync(filePath, "utf-8");

        let parsed;
        try {
            parsed = JSON.parse(raw);
        } catch (err) {
            console.error("❌ JSON PARSE ERROR:", err.message);
            fs.unlinkSync(filePath);
            return res.status(400).json({ error: "Invalid JSON format" });
        }

        console.log("📄 Parsed JSON keys:", Object.keys(parsed));
        console.log("📄 Questions array exists:", Array.isArray(parsed.questions), "Length:", parsed.questions?.length);

        const { subject, class: classLevel, questions } = parsed;

        if (!subject || !classLevel) {
            console.error("❌ Missing required fields: subject or class");
            fs.unlinkSync(filePath);
            return res.status(400).json({ error: "Missing 'subject' or 'class' field" });
        }

        if (!Array.isArray(questions) || questions.length === 0) {
            console.error("❌ No questions found or invalid format");
            fs.unlinkSync(filePath);
            return res.status(400).json({
                error: "Question bank contains no valid questions (Must be an array)"
            });
        }

        let importedCount = 0;
        for (const q of questions) {
            if (typeof q.question !== "string" || !Array.isArray(q.options) || q.options.length !== 4 ||
                typeof q.answer !== "number" || q.answer < 0 || q.answer > 3) {
                continue;
            }
            await insertQuestion({
                classLevel,
                subject,
                question: q.question,
                options: q.options,
                correctIndex: q.answer
            });
            importedCount++;
        }

        // Clean up file
        fs.unlinkSync(filePath);

        return res.json({
            success: true,
            message: `Successfully imported ${importedCount} questions.`
        });

    } catch (err) {
        console.error(err);
        // Try clean up file
        if (req.file && req.file.path) try { fs.unlinkSync(req.file.path); } catch (e) { }

        return res.status(500).json({
            error: err.message || "Question bank import failed"
        });
    }
});

// Unified Route for File Upload AND JSON Paste
router.post("/upload-question-bank-json", upload.single('file'), async (req, res) => {
    try {
        let parsed;

        // CASE 1: JSON pasted in textarea (handled by express.json)
        if (req.body && req.body.pastedJson) {
            try {
                parsed = JSON.parse(req.body.pastedJson);
            } catch (e) {
                return res.status(400).json({ error: "Invalid JSON format in pasted content" });
            }
        }
        // CASE 2: JSON file upload (handled by multer memory storage)
        else if (req.file) {
            try {
                parsed = JSON.parse(req.file.buffer.toString("utf-8"));
            } catch (e) {
                return res.status(400).json({ error: "Invalid JSON format in file" });
            }
        }
        else {
            return res.status(400).json({
                error: "No question bank data provided. Please upload a file or paste JSON."
            });
        }

        const { subject, class: classLevel, questions } = parsed;

        // 🔒 Structure validation
        if (!subject || !classLevel) {
            return res.status(400).json({ error: "Missing required fields: subject or class" });
        }

        if (!Array.isArray(questions) || questions.length === 0) {
            return res.status(400).json({
                error: "Invalid or empty questions array"
            });
        }

        // ✅ Insert into Database
        let imported = 0;
        for (const q of questions) {
            if (typeof q.question !== "string" || !Array.isArray(q.options) || q.options.length !== 4 ||
                typeof q.answer !== "number" || q.answer < 0 || q.answer > 3) {
                continue;
            }
            await insertQuestion({
                classLevel,
                subject,
                question: q.question,
                options: q.options,
                correctIndex: q.answer
            });
            imported++;
        }

        return res.json({
            success: true,
            total: imported,
            message: `Successfully imported ${imported} questions.`
        });

    } catch (err) {
        console.error("QB Parse Error:", err);
        return res.status(500).json({
            error: "Internal Server Error: " + err.message
        });
    }
});


// ✅ STEP 2 — Database Insert Helper (SAFE)
async function insertQuestion({ classLevel, subject, question, options, correctIndex }) {
    const sql = `
    INSERT INTO question_bank
    (class, subject, question, option_a, option_b, option_c, option_d, correct_index)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;

    await db.query(sql, [
        classLevel,
        subject,
        question,
        options[0],
        options[1],
        options[2],
        options[3],
        correctIndex
    ]);
}

module.exports = router;
