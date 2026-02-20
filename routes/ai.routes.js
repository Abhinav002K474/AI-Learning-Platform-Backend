const express = require("express");
const router = express.Router();
const { generateGeminiReply } = require("../services/gemini.service");

// ✅ POST /api/ai/generate-questions
router.post("/generate-questions", async (req, res) => {
    try {
        const { text } = req.body;

        if (!text || text.trim().length === 0) {
            return res.status(400).json({ success: false, message: "No topic/text provided" });
        }

        console.log("[AI Generate Questions] Topic:", text.substring(0, 100));

        const prompt = `Generate 5 exam-style questions based on the following topic or content. 
Format each question on a new line with a number prefix (1., 2., etc.).
Topic/Content: ${text}`;

        let questions;
        try {
            questions = await generateGeminiReply(prompt);
        } catch (aiErr) {
            console.warn("[AI Generate Questions] Gemini unavailable, using fallback");
            questions = `1. What is ${text}?\n2. Explain the key concepts of ${text}.\n3. What are the main components of ${text}?\n4. How does ${text} work in practice?\n5. What are the real-world applications of ${text}?`;
        }

        console.log("[AI Generate Questions] ✅ Success");
        res.json({ success: true, questions });

    } catch (err) {
        console.error("[AI Generate Questions] ❌ Error:", err.message);
        res.status(500).json({ success: false, message: "Question generation failed" });
    }
});

// ✅ POST /api/ai/summarize
router.post("/summarize", async (req, res) => {
    try {
        const { text } = req.body;

        if (!text || text.trim().length === 0) {
            console.warn("[AI Summarize] Empty text received");
            return res.status(400).json({ message: "No text provided" });
        }

        if (text.trim().length < 50) {
            console.warn("[AI Summarize] Insufficient text length:", text.length);
            return res.status(400).json({ message: "Not enough content to summarize (minimum 50 characters)" });
        }

        console.log("[AI Summarize] Processing request, text length:", text.length);

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
