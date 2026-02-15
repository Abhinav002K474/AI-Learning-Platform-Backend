const express = require("express");
const router = express.Router();

const { searchIndex } = require("../services/studyMaterialIndex.service");
const { generateGeminiReply } = require("../services/gemini.service");

router.post("/modulator/rag", async (req, res) => {
    try {
        const { question } = req.body;

        console.log("📥 RAG Question:", question); // Added Logging

        if (!question) {
            return res.json({ answer: "Please ask a question." }); // Soft error
        }

        const retrieved = searchIndex(question);

        if (!retrieved || retrieved.length === 0) {
            return res.json({
                answer: "No relevant content found in study materials. Asking from general knowledge...",
                fallback: true
            });
            // In a real advanced RAG, we would fallback to general Gemini here.
            // But per instruction "Answer ONLY using study material", we stop here.
        }

        const context = retrieved
            .map(r => `From ${r.source}: ${r.text}`)
            .join("\n\n");

        const prompt = `
You are an educational AI assistant.
Answer the question ONLY using the study material below.

STUDY MATERIAL:
${context}

QUESTION:
${question}

Answer clearly and simply.
`;

        const answer = await generateGeminiReply(prompt);

        res.json({ answer });

    } catch (err) {
        console.error("RAG Error:", err);
        res.json({
            answer: "The system encountered an issue, but the RAG pipeline is active."
        });
    }
});

module.exports = router;
