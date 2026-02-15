const { GoogleGenerativeAI } = require("@google/generative-ai");
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function generateGeminiReply(prompt) {
    try {
        // Using confirmed available model: gemini-2.5-flash
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        const result = await model.generateContent(prompt);
        return result.response.text();
    } catch (err) {
        console.warn("Gemini 2.5 Flash failed, attempting fallback:", err.message);
        try {
            // Fallback: Gemini 2.0 Flash (Previous stable version)
            const fallbackModel = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
            const result = await fallbackModel.generateContent(prompt);
            return result.response.text();
        } catch (fallbackErr) {
            console.error("Gemini Fallback failed:", fallbackErr.message);
            // Last resort: Return a friendly error message instead of throwing 500
            throw new Error("AI Service currently unavailable. Please try again later.");
        }
    }
}

module.exports = { generateGeminiReply };
