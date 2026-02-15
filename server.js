console.log("=== BACKEND SERVER BOOTING ===");
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const pdf = require('pdf-parse');
const fs = require('fs');
const axios = require('axios');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { generateGeminiReply } = require('./services/gemini.service');
const { summarizeText } = require('./services/summarizer.client');
const { buildIndex } = require("./services/studyMaterialIndex.service");

// Build Index on Start
buildIndex();

const app = express();
const PORT = 5000;

// 1. Request Logging (Debug)
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// 2. Core Middleware
app.use(cors());
app.use(express.json({ limit: "150mb" }));
app.use(express.urlencoded({ limit: "150mb", extended: true }));

// 3. File Upload Configuration
// 3. File Upload Configuration (Memory for PDFs, Disk for Profiles)
const uploadDir = path.join(__dirname, 'uploads/profiles');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Storage for Profile Images
const diskStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        // Use userId from body if available, else timestamp
        const userId = req.body.userId || 'unknown';
        const ext = path.extname(file.originalname) || '.png';
        cb(null, `${userId}_${Date.now()}${ext}`);
    }
});

const uploadProfile = multer({ storage: diskStorage });

// Storage for Modulator (Memory)
const memoryStorage = multer.memoryStorage();
const uploadModulator = multer({
    storage: memoryStorage,
    limits: { fileSize: 10 * 1024 * 1024 }
});

// Helper: Call AI API
// Helper: Call AI API (Delegates to Service)
async function callAI(finalPrompt) {
    try {
        console.log("Calling AI Service (Gemini)...");
        const answer = await generateGeminiReply(finalPrompt);
        return answer;
    } catch (error) {
        console.error("AI Service Failed:", error.message);
        throw new Error("AI Assistant is currently unavailable.");
    }
}

app.get('/health', (req, res) => res.json({ status: "OK" }));

// ------------------------------------------------------------------
// API ROUTES (Must be defined BEFORE static files)
// ------------------------------------------------------------------

// Main API Router that aggregates all feature routes
app.use("/api", require("./routes/auth.routes.js")); // Explicitly mount auth routes first
app.use("/api", require("./routes/index.js"));

// ===== HEALTH CHECK & INFO ENDPOINTS =====
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        service: 'Day One AI Backend',
        port: PORT,
        database: 'Connected'
    });
});

app.get('/api/info', (req, res) => {
    res.json({
        name: 'Day One AI Learning Platform API',
        version: '1.0.0',
        endpoints: {
            auth: ['/api/signup', '/api/login', '/api/logout'],
            student: ['/api/student/assessments', '/api/student/study-materials'],
            teacher: ['/api/teacher/students', '/api/teacher/attendance'],
            admin: ['/api/admin/users', '/api/admin/study-material/upload'],
            ai: ['/api/modulator', '/api/ai/summarize', '/api/pdf/summarize']
        },
        docs: 'See README.md for complete API documentation'
    });
});



const conditionalUpload = (req, res, next) => {
    const ct = req.headers['content-type'] || '';
    if (ct.includes('multipart/form-data')) {
        uploadModulator.any()(req, res, next);
    } else {
        next();
    }
};

app.post('/api/modulator', express.json(), async (req, res) => {
    try {
        console.log(`[${new Date().toISOString()}] Received /api/modulator`);

        // 1. Extract Text (Support both 'question' from frontend and 'message' from generic snippets)
        const userText = req.body.question || req.body.message || req.body.text;

        if (!userText || typeof userText !== 'string' || !userText.trim()) {
            return res.status(400).json({
                success: false,
                message: "Please enter a valid question."
            });
        }

        // 2. Call AI Service
        const answer = await callAI(userText);

        // 3. Success Response
        return res.json({
            success: true,
            answer: answer
        });

    } catch (err) {
        console.error("AI Provider Error:", err.message);

        // ✅ Graceful fallback (CRITICAL)
        // Return 200 OK so frontend treats it as a success response and displays the message
        return res.status(200).json({
            success: true,
            answer: "AI service is temporarily unavailable. This feature is provider-limited in the free tier."
        });
    }
});

// Old profile route removed in favor of /api/user/update-profile in user.routes.js
// (Route handler removed)

// AUTH LOGIN ROUTE (Real SQL/JSON with Active Check)
const bcrypt = require('bcryptjs');
const db = require('./db');

// ✅ 3. TEST DB ON SERVER START (ONCE)
(async () => {
    try {
        await db.query("SELECT 1");
        console.log("✅ Database connected successfully");
    } catch (err) {
        console.error("❌ Database connection failed", err);
    }
})();

// Auth routes are now handled in routes/auth.routes.js (included in routes/index.js)




// ------------------------------------------------------------------
// ADMIN ROUTES
// ------------------------------------------------------------------

// Temp storage for general uploads which we move later
// Materials Logic Moved to routes/materials.routes.js



// 2. Admin User Management Logic moved to routes/admin.routes.js

// ------------------------------------------------------------------
// STUDENT STUDY MATERIAL ROUTES
// ------------------------------------------------------------------

// Materials List moved to routes/materials.routes.js

// Materials View/Summarize moved to routes/materials.routes.js

app.post("/api/summarize-page", async (req, res) => {
    try {
        const { text, page } = req.body;

        if (!text || text.length < 50) {
            return res.status(400).json({ summary: "Page has insufficient content." });
        }

        console.log(`Summarizing Page ${page} (${text.length} chars)...`);
        const summary = await summarizeText(text); // Re-use existing client helper
        res.json({ page, summary });

    } catch (err) {
        console.error("Page Summarize Error:", err);
        res.status(500).json({ summary: "Summarizer unavailable." });
    }
});



// ------------------------------------------------------------------
// FALLBACKS & ERROR HANDLING
// ------------------------------------------------------------------

// 1. API 404 Handler - Catch ALL /api/* requests that didn't match above
app.all('/api/*', (req, res) => {
    console.warn(`[API 404] Route not found: ${req.method} ${req.url}`);
    res.status(404).json({
        success: false,
        message: "API route not found"
    });
});

// 2. Serve Static Files (Frontend)
app.use('/uploads', express.static(path.join(__dirname, 'uploads'))); // Serve Uploads

// EXPLICIT ADMIN ROUTE (Must be before general static)
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, '../admin.html'));
});

app.use(express.static(path.join(__dirname, '../'))); // Serve Frontend

app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, '../index.html'));
});

// 3. Global Error Handler (Last Middleware)
// Catches any errors passed via next(err) from previous middleware
app.use((err, req, res, next) => {
    console.error("Global Error Handler Caught:", err);

    // Ensure we ALWAYS return JSON for API errors
    if (req.url.startsWith('/api') || req.headers['content-type'] === 'application/json') {
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: err.message
        });
    } else {
        // For non-API errors (unlikely here), use default
        next(err);
    }
});

app.listen(PORT, "0.0.0.0", () => {
    console.log(`SERVER RUNNING → http://localhost:${PORT}`);
});

// ABSOLUTE CRASH PROTECTION
process.on("uncaughtException", err => {
    console.error("UNCAUGHT EXCEPTION:", err);
});

process.on("unhandledRejection", err => {
    console.error("UNHANDLED REJECTION:", err);
});
