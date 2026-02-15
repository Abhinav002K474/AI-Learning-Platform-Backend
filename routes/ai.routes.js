const express = require("express");
const router = express.Router();

// OPTIONAL: protect with auth middleware
// const auth = require("../middleware/auth");

router.post("/summarize", async (req, res) => {
    try {
        const { text } = req.body;

        // 🔹 Enhanced validation with logging
        if (!text || text.trim().length === 0) {
            console.warn("[AI Summarize] Empty text received");
            return res.status(400).json({ message: "No text provided" });
        }

        if (text.trim().length < 50) {
            console.warn("[AI Summarize] Insufficient text length:", text.length);
            return res.status(400).json({ message: "Not enough content to summarize (minimum 50 characters)" });
        }

        console.log("[AI Summarize] Processing request, text length:", text.length);

        // TEMP: simple summarization (safe fallback)
        const summary = text
            .split(".")
            .slice(0, 5)
            .join(".") + ".";

        console.log("[AI Summarize] ✅ Success, summary length:", summary.length);
        res.json({ summary });

    } catch (err) {
        console.error("[AI Summarize] ❌ Error:", err.message);
        res.status(500).json({ message: "Summarization failed" });
    }
});

module.exports = router;
