const { GoogleGenerativeAI } = require("@google/generative-ai");
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function generateGeminiReply(prompt) {
    try {
        // Using confirmed available model: gemini-2.5-flash
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        const result = await model.generateContent(prompt);
        return result.response.text();
    } catch (error) {
        console.error("===== GEMINI ERROR START =====");
        console.error("Error Message:", error.message);
        console.error("Error Stack:", error.stack);

        if (error.response) {
            console.error("Gemini Response Status:", error.response.status);
            console.error("Gemini Response Data:", error.response.data);
        }

        if (error.error) {
            console.error("Gemini API Error:", error.error);
        }

        console.error("===== GEMINI ERROR END =====");

        console.warn("Gemini 2.5 Flash failed, attempting fallback...");
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
