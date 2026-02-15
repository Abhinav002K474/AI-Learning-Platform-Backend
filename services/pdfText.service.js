const fs = require("fs");
const pdf = require("pdf-parse");
const path = require('path');

function logDebug(msg) {
    try {
        fs.appendFileSync(path.join(__dirname, '../debug.log'), `[PDF] ${new Date().toISOString()} ${msg}\n`);
    } catch (e) { console.error("Log error", e); }
}

async function extractTextFromPDF(pdfPath) {
    if (!fs.existsSync(pdfPath)) {
        logDebug(`File not found: ${pdfPath}`);
        throw new Error("PDF file not found");
    }

    logDebug(`Reading file: ${pdfPath}`);
    const buffer = fs.readFileSync(pdfPath);
    logDebug(`File read. Parse starting...`);
    try {
        const data = await pdf(buffer);
        logDebug(`Parse complete. Text length: ${data.text.length}`);
        return data.text;
    } catch (e) {
        logDebug(`Parse error: ${e.message}`);
        throw e;
    }
}

module.exports = {
    extractTextFromPDF
};
