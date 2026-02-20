const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const pdf = require('pdf-parse');
const { summarizeText } = require('../services/summarizer.client');

// Multer Setup for Temp Uploads
const tempStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const tempDir = path.join(__dirname, '../uploads/temp');
        if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
        cb(null, tempDir);
    },
    filename: (req, file, cb) => {
        cb(null, `temp_${Date.now()}_${file.originalname}`);
    }
});

const uploadTemp = multer({
    storage: tempStorage,
    limits: { fileSize: 100 * 1024 * 1024 }, // 100 MB Limit
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new Error("Only PDF files are allowed"));
        }
    }
});

// ------------------------------------------------------------------
// STUDENT/TEACHER: Upload Study Material (General)
// POST /api/upload/study-material
// ------------------------------------------------------------------
const uploadAny = multer({
    storage: tempStorage,
    limits: { fileSize: 100 * 1024 * 1024 }, // 100 MB
});

router.post('/upload/study-material', (req, res, next) => {
    uploadAny.single('file')(req, res, (err) => {
        if (err) {
            return res.status(400).json({ success: false, message: err.message });
        }
        next();
    });
}, async (req, res) => {
    try {
        console.log(`[${new Date().toISOString()}] POST /api/upload/study-material`);

        // Auth check via token header
        const authHeader = req.headers['authorization'];
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ success: false, message: "Unauthorized: Token required" });
        }

        const file = req.file;
        if (!file) {
            return res.status(400).json({ success: false, message: "No file uploaded" });
        }

        // Save record to JSON DB
        const dbPath = path.join(__dirname, '../data/materials.json');
        let materials = [];
        if (fs.existsSync(dbPath)) {
            try { materials = JSON.parse(fs.readFileSync(dbPath, 'utf8')); } catch (e) { materials = []; }
        } else {
            const dataDir = path.join(__dirname, '../data');
            if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
        }

        const newRecord = {
            id: `mat_${Date.now()}`,
            title: req.body.title || file.originalname,
            subject: req.body.subject || 'General',
            class: req.body.class || 'All',
            filePath: `/uploads/temp/${file.filename}`,
            uploadedBy: req.body.uploadedBy || 'user',
            isActive: true,
            createdAt: new Date().toISOString()
        };

        materials.push(newRecord);
        fs.writeFileSync(dbPath, JSON.stringify(materials, null, 2));

        console.log("[Upload] ✅ File saved:", newRecord.id, file.originalname);

        res.json({
            success: true,
            message: "Study material uploaded successfully",
            data: newRecord
        });

    } catch (err) {
        console.error("[Upload] ❌ Error:", err.message);
        res.status(500).json({ success: false, message: "Upload failed: " + err.message });
    }
});

// ------------------------------------------------------------------
// ADMIN: Upload Study Material
// ------------------------------------------------------------------
router.post('/admin/study-material/upload', (req, res, next) => {
    // Multer Wrapper for Limit Handling
    uploadTemp.single('pdfFile')(req, res, (err) => {
        if (err) {
            if (err.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({ success: false, error: "File too large. Max limit is 100MB." });
            }
            return res.status(400).json({ success: false, error: err.message });
        }
        next();
    });
}, (req, res) => {
    console.log(`[${new Date().toISOString()}] Received /api/admin/study-material/upload`);

    // 1. Role Check
    const userRole = req.headers['x-user-role'];
    if (userRole !== 'admin') {
        console.warn("Unauthorized Access Attempt to Admin Upload");
        return res.status(403).json({ success: false, error: "Access Denied: Admins only" });
    }

    try {
        const { class: className, subject, title, uploadedBy } = req.body;
        const file = req.file;

        // 2. Validation
        if (!className || !subject || !title || !file) {
            return res.status(400).json({ success: false, error: "Missing required fields" });
        }

        if (path.extname(file.originalname).toLowerCase() !== '.pdf') {
            if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
            return res.status(400).json({ success: false, error: "Only PDF files are allowed" });
        }

        // 3. Move File to Structured Directory
        // Structure: uploads/study-materials/{classId}/{subjectId}/filename.pdf
        const safeClass = className.replace(/\s+/g, '').toLowerCase();
        const safeSubject = subject.replace(/\s+/g, '').toLowerCase();

        const targetDir = path.join(__dirname, '../uploads/study-materials', safeClass, safeSubject);
        if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });

        const uniqueFilename = `${Date.now()}_${file.originalname}`;
        const targetPath = path.join(targetDir, uniqueFilename);

        // Move file
        fs.renameSync(file.path, targetPath);

        // 4. Save Record to JSON DB
        const dbPath = path.join(__dirname, '../data/materials.json');
        let materials = [];
        if (fs.existsSync(dbPath)) {
            try {
                materials = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
            } catch (err) {
                console.error("Error reading materials DB, starting fresh", err);
            }
        }

        const newRecord = {
            id: `mat_${Date.now()}`,
            class: className,
            subject: subject,
            title: title,
            filePath: `/uploads/study-materials/${safeClass}/${safeSubject}/${uniqueFilename}`,
            uploadedBy: uploadedBy || 'admin',
            isActive: true,
            createdAt: new Date().toISOString()
        };

        materials.push(newRecord);
        fs.writeFileSync(dbPath, JSON.stringify(materials, null, 2));

        console.log("Material Saved:", newRecord.id);

        res.json({
            success: true,
            message: "Study material uploaded successfully",
            data: newRecord
        });

    } catch (error) {
        console.error("Admin Upload Error:", error);
        // Clean up temp file if logic fails after upload
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        res.status(500).json({ success: false, error: "Internal Server Error during upload" });
    }
});

// ------------------------------------------------------------------
// STUDENT: List Materials (Filtered by Subject)
// ------------------------------------------------------------------
router.get('/student/study-materials', (req, res) => {
    const subject = req.query.subject;

    if (!subject) return res.status(400).json({ success: false, error: "Subject is required" });

    try {
        const dbPath = path.join(__dirname, '../data/materials.json');
        if (!fs.existsSync(dbPath)) {
            return res.json({ success: true, materials: [] });
        }

        const materials = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

        // Filter: Match Subject AND (Ideally) Class. 
        const filtered = materials.filter(m =>
            m.subject.toLowerCase() === subject.toLowerCase() &&
            m.isActive
        );

        res.json({ success: true, materials: filtered });
    } catch (err) {
        console.error("Fetch Materials Error:", err);
        res.status(500).json({ success: false, error: "Failed to fetch materials" });
    }
});

// ------------------------------------------------------------------
// STUDENT: View Material (Secure PDF Stream)
// ------------------------------------------------------------------
router.get('/student/study-materials/view/:materialId', (req, res) => {
    const materialId = req.params.materialId;

    try {
        const dbPath = path.join(__dirname, '../data/materials.json');
        if (!fs.existsSync(dbPath)) return res.status(404).send("Material database not found");

        const materials = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
        const material = materials.find(m => m.id === materialId);

        if (!material) return res.status(404).send("Material not found");

        // Construct absolute path. 
        // material.filePath is distinct: /uploads/study-materials/...
        // We need to map it to the system path.
        const relativePath = material.filePath.startsWith('/') ? material.filePath.substring(1) : material.filePath;
        const absolutePath = path.join(__dirname, '..', relativePath);

        if (!fs.existsSync(absolutePath)) {
            return res.status(404).send("File resource not found on server");
        }

        // Security check: Prevent directory traversal
        if (!absolutePath.startsWith(path.join(__dirname, '../uploads'))) {
            return res.status(403).send("Access Denied");
        }

        // Stream File
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="${material.title}.pdf"`);
        const fileStream = fs.createReadStream(absolutePath);
        fileStream.pipe(res);

    } catch (err) {
        console.error("Stream Material Error:", err);
        res.status(500).send("Server Error");
    }
});

// ------------------------------------------------------------------
// AI: Summarize Material
// ------------------------------------------------------------------
router.post('/pdf/summarize', async (req, res) => {
    try {
        const { materialId } = req.body;
        if (!materialId) return res.status(400).json({ success: false, message: "Material ID required" });

        // 1. Find File
        const dbPath = path.join(__dirname, '../data/materials.json');
        if (!fs.existsSync(dbPath)) return res.status(404).json({ success: false, message: "DB not found" });

        const materials = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
        const material = materials.find(m => m.id === materialId);
        if (!material) return res.status(404).json({ success: false, message: "Material not found" });

        // 2. Resolve Path
        const relativePath = material.filePath.startsWith('/') ? material.filePath.substring(1) : material.filePath;
        const absolutePath = path.join(__dirname, '..', relativePath);

        if (!fs.existsSync(absolutePath)) return res.status(404).json({ success: false, message: "File not found" });

        // 3. Parse PDF
        const dataBuffer = fs.readFileSync(absolutePath);
        const pdfData = await pdf(dataBuffer);
        // Limit context to 2000 chars for efficency
        const text = pdfData.text.substring(0, 2000);

        // 4. Summarize (Using Python Service)
        console.log("Delegating to Python Summarizer...");
        const summary = await summarizeText(text);

        res.json({ success: true, summary: summary });

    } catch (err) {
        console.error("Summarize Error:", err);
        res.status(500).json({ success: false, message: "AI Summarization Failed" });
    }
});

module.exports = router;
