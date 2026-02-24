const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const db = require('../db');

// Middleware
const verifyToken = (req, res, next) => {
    const bearerHeader = req.headers['authorization'];
    if (typeof bearerHeader !== 'undefined') {
        const bearer = bearerHeader.split(' ');
        const bearerToken = bearer[1];
        jwt.verify(bearerToken, process.env.JWT_SECRET, (err, authData) => {
            if (err) return res.sendStatus(403);
            req.user = authData;
            next();
        });
    } else {
        res.sendStatus(403);
    }
};

// Update Profile API
router.put("/update-profile", verifyToken, async (req, res) => {
    console.log("Update profile hit!");
    try {
        const { fullName, avatar, bio } = req.body;
        const userId = req.user.id;

        // Update name, avatar(key), and bio
        await db.query(
            "UPDATE users SET name = $1, avatar = $2, bio = $3 WHERE id = $4",
            [fullName, avatar, bio, userId]
        );

        // Fetch updated user
        const [rows] = await db.query(
            "SELECT id, name as fullName, email, role, class, avatar, bio FROM users WHERE id = $1",
            [userId]
        );

        res.json({
            success: true,
            user: rows[0]
        });

    } catch (err) {
        console.error("Profile Update Error:", err);
        res.status(500).json({ message: "Failed to update profile", error: err.message });
    }
});

// GET profile endpoint for persistent avatar
router.get("/profile", verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const [rows] = await db.query(
            "SELECT id, name as fullName, email, role, class, avatar, bio FROM users WHERE id = $1",
            [userId]
        );

        if (rows.length === 0) return res.status(404).json({ success: false, message: "User not found" });

        res.json({
            success: true,
            user: rows[0]
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// Dedicated Avatar Update
router.put("/avatar", verifyToken, async (req, res) => {
    try {
        const { avatar } = req.body;
        const userId = req.user.id;

        await db.query("UPDATE users SET avatar = $1 WHERE id = $2", [avatar, userId]);

        res.json({ success: true, avatar });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;
