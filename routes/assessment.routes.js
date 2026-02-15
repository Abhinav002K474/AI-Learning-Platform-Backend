const express = require('express');
const router = express.Router();
const db = require('../db');

// ==============================================================================
const jwt = require('jsonwebtoken');

// ==============================================================================
// TEACHER ROUTES
// ==============================================================================

// 1. Publish Assessment
router.post('/teacher/assessments/publish', async (req, res) => {
    try {
        const { assessmentId } = req.body;
        if (!assessmentId) return res.status(400).json({ error: "Assessment ID required" });

        await db.query("UPDATE assessments SET status = 'published' WHERE id = ?", [assessmentId]);
        res.json({ success: true, message: "Assessment Published Successfully!" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to publish assessment" });
    }
});

// 1.5 Fetch Teacher Stats
router.get('/teacher/stats', async (req, res) => {
    try {
        let teacherId = 1; // Default
        const authHeader = req.headers['authorization'];
        if (authHeader) {
            const token = authHeader.split(' ')[1];
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                teacherId = decoded.id;
            } catch (e) {
                console.warn("Token verify failed in stats, using default ID 1");
            }
        }

        // 1. Assessments Created
        const [assessCount] = await db.query("SELECT COUNT(*) as count FROM assessments WHERE teacher_id = ?", [teacherId]);

        // 2. Active Classes (Unique classes in assessments)
        const [classCount] = await db.query("SELECT COUNT(DISTINCT class) as count FROM assessments WHERE teacher_id = ?", [teacherId]);

        // 3. Avg Performance
        const [perf] = await db.query(`
            SELECT AVG(r.percentage) as avg_score 
            FROM assessment_results r 
            JOIN assessments a ON r.assessment_id = a.id 
            WHERE a.teacher_id = ?`,
            [teacherId]
        );

        // 4. Total Students (Global)
        const [studentCount] = await db.query("SELECT COUNT(*) as count FROM users WHERE role = 'student'");

        res.json({
            success: true,
            stats: {
                totalStudents: studentCount[0].count,
                activeClasses: classCount[0].count,
                assessmentsCreated: assessCount[0].count,
                avgPerformance: perf[0].avg_score ? parseFloat(perf[0].avg_score).toFixed(1) : 0
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch teacher stats" });
    }
});

// 2. Fetch Questions (Used for Auto-Add / Manual Selection)
router.get('/teacher/questions', async (req, res) => {
    try {
        const { subject, class: classVal, limit } = req.query;
        let sql = "SELECT * FROM question_bank WHERE 1=1";
        const params = [];

        if (subject) {
            sql += " AND subject = ?";
            params.push(subject);
        }
        if (classVal) {
            sql += " AND class = ?";
            params.push(classVal);
        }

        sql += " ORDER BY RAND()"; // Randomize for 'Auto-Add' feel

        if (limit) {
            sql += " LIMIT ?";
            params.push(parseInt(limit));
        }

        const [rows] = await db.query(sql, params);
        res.json({ success: true, questions: rows });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch questions" });
    }
});

// 3. Create Draft Assessment (Needed to have an ID to publish)
// This is a helper to allow the "Publish" flow to have context if not already created
router.post('/teacher/assessments/create', async (req, res) => {
    try {
        console.log("CREATE ASSESSMENT BODY:", req.body); // DEBUG Log

        const { title, subject, class: classLevel, questions, duration, status } = req.body;

        // Debug Questions
        console.log("Questions received:", questions);

        // Temp Teacher ID (or from auth if available)
        const teacherId = req.user ? req.user.id : 1;

        // 1. Create Assessment Header
        // 🔒 STEP 2: HARDEN THE BACKEND (PREVENT THIS FOREVER)
        const { date, startTime, endTime } = req.body;

        if (!date || !startTime || !endTime) {
            return res.status(400).json({
                message: 'Date, start time, and end time are required to publish'
            });
        }

        const [result] = await db.query(
            "INSERT INTO assessments (title, subject, class, duration_minutes, status, teacher_id, date, start_time, end_time) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
            [title, subject, classLevel, duration || 30, status || 'DRAFT', teacherId, date, startTime, endTime]
        );
        const assessmentId = result.insertId;

        // 2. Link Questions
        if (Array.isArray(questions) && questions.length > 0) {
            const values = questions.map(q => {
                // Robustly handle if q is just ID or Object {questionId: 1...}
                const qId = (typeof q === 'object' && q !== null && q.questionId) ? q.questionId : q;
                return [assessmentId, qId];
            });
            await db.query("INSERT INTO assessment_questions (assessment_id, question_id) VALUES ?", [values]);
        }

        res.json({ success: true, assessmentId, message: "Draft Assessment Created" });
    } catch (err) {
        console.error("CREATE ASSESSMENT ERROR:", err);
        res.status(500).json({
            message: "Failed to create assessment",
            error: err.message
        });
    }
});

// ==============================================================================
// STUDENT ROUTES
// ==============================================================================

// 4. Fetch Published Assessments
router.get('/student/assessments', async (req, res) => {
    try {
        const studentClass = req.query.class;

        if (!studentClass) {
            return res.status(400).json({ message: "Student class missing" });
        }

        const sql = `
            SELECT *
            FROM assessments
            WHERE class = ?
              AND status = 'published'
              AND date IS NOT NULL
              AND start_time IS NOT NULL
              AND end_time IS NOT NULL
            ORDER BY date, start_time
        `;

        const [results] = await db.query(sql, [studentClass]);

        console.log(
            "Student class used for fetch:",
            studentClass,
            "| Loaded:",
            results.length
        );

        res.json(results);

    } catch (err) {
        console.error("Student assessment error:", err);
        res.status(500).json({ message: "Server error" });
    }
});

// 5. Start Assessment (Fetch Questions for Student)
router.get('/student/assessment/:id/start', async (req, res) => {
    try {
        const assessmentId = req.params.id;

        // Fetch Assessment Details
        const [assessments] = await db.query("SELECT * FROM assessments WHERE id = ?", [assessmentId]);
        if (assessments.length === 0) return res.status(404).json({ error: "Assessment not found" });
        const assessment = assessments[0];

        // Fetch Questions (Hide Correct Answer)
        const [questions] = await db.query(`
            SELECT q.id, q.question, q.option_a, q.option_b, q.option_c, q.option_d
            FROM question_bank q
            JOIN assessment_questions aq ON aq.question_id = q.id
            WHERE aq.assessment_id = ?
        `, [assessmentId]);

        // Transform for frontend
        const formattedQuestions = questions.map(q => ({
            id: q.id,
            question: q.question,
            options: [q.option_a, q.option_b, q.option_c, q.option_d]
        }));

        res.json({
            assessmentId: assessment.id,
            title: assessment.title,
            duration: assessment.duration_minutes,
            questions: formattedQuestions
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to start assessment" });
    }
});

// 6. Submit Assessment
router.post('/student/assessment/submit', async (req, res) => {
    try {
        const { assessmentId, studentId, answers } = req.body; // answers: { qId: optionIndex }

        // Fetch Correct Answers
        const [questions] = await db.query(`
            SELECT q.id, q.correct_index
            FROM question_bank q
            JOIN assessment_questions aq ON aq.question_id = q.id
            WHERE aq.assessment_id = ?
        `, [assessmentId]);

        let score = 0;
        const total = questions.length;

        questions.forEach(q => {
            const studentAns = answers[q.id]; // 0, 1, 2, 3
            if (studentAns !== undefined && parseInt(studentAns) === q.correct_index) {
                score++;
            }
        });

        const percentage = (score / total) * 100;

        // Save Result
        await db.query(
            "INSERT INTO assessment_results (student_id, assessment_id, score, total_questions, percentage) VALUES (?, ?, ?, ?, ?)",
            [studentId || 0, assessmentId, score, total, percentage]
        );

        res.json({
            success: true,
            score,
            total,
            percentage
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to submit assessment" });
    }
});

module.exports = router;
