const express = require("express");
const router = express.Router();

const { extractTextFromPDF } = require("../services/pdfText.service");
const { summarizeText } = require("../services/summarizer.client");

// Summarize existing uploaded PDF
router.post("/summarize-pdf", async (req, res) => {
    try {
        const { pdfPath } = req.body;

        if (!pdfPath) {
            return res.json({
                summary: "PDF path is required."
            });
        }

        // 1. Extract text from PDF
        const fullText = await extractTextFromPDF(pdfPath);

        if (!fullText || fullText.trim().length === 0) {
            return res.json({
                summary: "No readable text found in this PDF."
            });
        }

        // 2. Limit text size (important for performance)
        const limitedText = fullText.slice(0, 1000);

        // 3. Send to Python summarizer
        const summary = await summarizeText(limitedText);

        res.json({ summary });

    } catch (err) {
        console.error("Summarize PDF error:", err.message);

        res.json({
            summary:
                "Unable to summarize this document right now."
        });
    }
});



// Summarize raw text (from Frontend PDF Viewer Page)
router.post("/summarize", async (req, res) => {
    try {
        const { text } = req.body;

        if (!text) {
            return res.json({
                summary: "No text received for summarization."
            });
        }

        const summary = await summarizeText(text);
        res.json({ summary });

    } catch (err) {
        console.error(err);
        res.json({
            summary: "Summarizer temporarily unavailable."
        });
    }
});

module.exports = router;
