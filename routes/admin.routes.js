const express = require('express');
const router = express.Router();
const db = require('../db');

// Middleware for Admin Auth
function adminOnly(req, res, next) {
    const userRole = req.headers['x-user-role'];
    if (userRole !== 'admin') {
        return res.status(403).json({ success: false, message: "Access denied: Admins only" });
    }
    next();
}

// GET Users by Role (Generic - Unifies Student, Teacher, Parent)
router.get('/users', adminOnly, async (req, res) => {
    const role = req.query.role;
    // Map plural to singular
    let targetRole = role;
    if (role === 'students') targetRole = 'student';
    if (role === 'teachers') targetRole = 'teacher';
    if (role === 'parents') targetRole = 'parent';

    if (!['student', 'teacher', 'parent'].includes(targetRole)) {
        return res.status(400).json({ success: false, message: "Invalid role parameter" });
    }

    try {
        let users = [];

        if (targetRole === 'parent') {
            // PARENTS: Fetch Students and format as Parents
            const [rows] = await db.query(
                "SELECT id, name, email, phone, role, class, is_active, created_at FROM users WHERE role = 'student' ORDER BY created_at DESC"
            );

            users = rows.map(u => ({
                id: u.id,
                name: `Parent of ${u.name}`,
                email: u.email || u.phone,
                role: 'parent',
                info: `Linked Student: ${u.name} (${u.class})`,
                child_name: u.name,
                child_class: u.class,
                is_active: u.is_active
            }));

        } else {
            // Students Or Teachers
            const [rows] = await db.query(
                "SELECT id, name, email, phone, role, class, is_active, created_at FROM users WHERE role = ? ORDER BY created_at DESC",
                [targetRole]
            );
            users = rows; // Already formatted correctly, password excluded by SELECT
        }

        res.json({ success: true, users: users });
    } catch (e) {
        console.error("Admin Fetch Users Error:", e);
        res.status(500).json({ success: false, error: e.message });
    }
});

// PATCH User Status (Enable/Disable)
router.patch('/users/:userId/status', adminOnly, async (req, res) => {
    const { userId } = req.params;
    const { is_active } = req.body; // Expect boolean (true/false) OR int (1/0)

    try {
        const [result] = await db.query(
            "UPDATE users SET is_active = ? WHERE id = ?",
            [is_active, userId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        res.json({ success: true, message: `User ${is_active ? 'enabled' : 'disabled'} successfully` });

    } catch (e) {
        console.error("Admin Status Update Error:", e);
        res.status(500).json({ success: false, error: "Failed to update user status" });
    }
});

module.exports = router;
