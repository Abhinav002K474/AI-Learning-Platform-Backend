const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
// ✅ SIGNUP (Create Account)
router.post("/auth/signup", async (req, res) => {
    const { name, email, phone, password, role, class: studentClass } = req.body;

    console.log("[SIGNUP ATTEMPT]", email || phone);

    if (!name || !password || (!email && !phone)) {
        return res.status(400).json({ message: "Missing fields" });
    }

    // Ensure strictly valid role enum to prevent SQL errors
    const safeRole = (role && ['student', 'teacher', 'parent', 'admin'].includes(role)) ? role : 'student';

    try {
        const hash = await bcrypt.hash(password, 10);

        const [existing] = await db.query(
            "SELECT id FROM users WHERE email = $1 OR phone = $2",
            [email || null, phone || null]
        );

        if (existing.length > 0) {
            return res.status(409).json({ message: "User already exists" });
        }

        const result = await db.pool.query(
            `INSERT INTO users (name, email, phone, password_hash, role, class, is_active)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             RETURNING id`,
            [
                name,
                email || null,
                phone || null,
                hash,
                safeRole,
                safeRole === 'student' ? studentClass : null,
                true
            ]
        );

        const rows = result.rows;
        const userId = rows[0].id;

        console.log("[SIGNUP SUCCESS]", email || phone);
        res.json({
            success: true,
            message: "Signup successful",
            userId: userId
        });

    } catch (err) {
        console.error("SIGNUP ERROR:", err);
        res.status(500).json({ message: "Server error" });
    }
});

// Support legacy route if frontend uses it
router.post("/auth/register", (req, res) => {
    // Redirect logic handled by function reuse or 307 redirect
    // Ideally just call the logic directly or forward
    req.url = '/signup';
    router.handle(req, res);
});


// ✅ LOGIN (Email OR Phone)
router.post("/auth/login", async (req, res) => {
    // Support both 'identifier' and direct email/phone fields
    const identifier = req.body.identifier || req.body.email || req.body.phone;
    const { password } = req.body;
    const loginAs = req.body.loginAs || req.body.role;

    console.log("[LOGIN ATTEMPT]", identifier, "as", loginAs);

    if (!identifier || !password) {
        return res.status(400).json({ message: "Missing credentials" });
    }

    try {
        const [rows] = await db.query(
            "SELECT id, name, email, phone, role, class, password_hash, profile_image, bio, avatar FROM users WHERE email = $1 OR phone = $2",
            [identifier, identifier]
        );

        if (rows.length === 0) {
            console.log("[LOGIN FAIL] User not found:", identifier);
            return res.status(401).json({ message: "Invalid credentials" });
        }

        const user = rows[0];
        const ok = await bcrypt.compare(password, user.password_hash);

        if (!ok) {
            console.log("[LOGIN FAIL] Password mismatch:", identifier);
            return res.status(401).json({ message: "Invalid credentials" });
        }

        // Parent login uses same student credentials
        if ((loginAs === "parent" || loginAs === "Parent") && user.role === "student") {
            // allowed - Parent logging in via Student account
            console.log(`[LOGIN SUCCESS] Parent logged in via Student ${user.name}`);

            const token = jwt.sign(
                { id: user.id, role: "parent", student_id: user.id }, // Custom payload for parent
                process.env.JWT_SECRET,
                { expiresIn: "7d" }
            );

            return res.json({
                success: true,
                token,
                message: "Login successful",
                user: {
                    id: user.id,
                    name: `Parent of ${user.name}`,
                    role: "parent",
                    linked_student: { id: user.id, name: user.name, class: user.class }
                },
                // Include session object if frontend expects it structured this way
                session: {
                    user_id: user.id,
                    name: `Parent of ${user.name}`,
                    role: "parent",
                    info: `Parent of ${user.name}`
                }
            });
        }
        else if (loginAs && user.role.toLowerCase() !== loginAs.toLowerCase()) {
            console.log(`[LOGIN FAIL] Role mismatch. User: ${user.role}, Req: ${loginAs}`);
            return res.status(403).json({ message: "Role mismatch" });
        }

        console.log("[LOGIN SUCCESS]", identifier);

        // Issue JWT
        const token = jwt.sign(
            { id: user.id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        res.json({
            success: true,
            token, // Send token to frontend
            message: "Login successful",
            user: {
                id: user.id,
                fullName: user.name,
                email: user.email,
                role: user.role,
                class: user.class,
                avatar: user.avatar || "boy1",
                bio: user.bio || ""
            },
            session: {
                user_id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                info: user.class || "Teacher"
            }
        });

    } catch (err) {
        console.error("LOGIN ERROR:", err);
        res.status(500).json({ message: "Server error" });
    }
});

// ✅ RESET PASSWORD (Direct)
router.post("/auth/reset-password", async (req, res) => {
    const { email, newPassword } = req.body;

    if (!email || !newPassword) {
        return res.status(400).json({
            success: false,
            message: "Email and password required"
        });
    }

    try {
        const [rows] = await db.query(
            "SELECT id FROM users WHERE email = $1",
            [email]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        // Hash password to ensure login works (System uses bcrypt)
        const hash = await bcrypt.hash(newPassword, 10);

        await db.query(
            "UPDATE users SET password_hash = $1 WHERE email = $2",
            [hash, email]
        );

        res.json({
            success: true,
            message: "Password reset successful. Please login."
        });

    } catch (err) {
        console.error("RESET PASSWORD ERROR:", err);
        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
});

module.exports = router;
