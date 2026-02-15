const axios = require('axios');
const fs = require('fs');
const path = require('path');

function logDebug(msg) {
    fs.appendFileSync(path.join(__dirname, '../debug.log'), `[Client] ${new Date().toISOString()} ${msg}\n`);
}

async function summarizeText(text) {
    try {
        logDebug("Sending text to Python service...");
        // Connect to the Python local service
        const response = await axios.post('http://127.0.0.1:5001/summarize', {
            text: text
        });
        logDebug("Received response from Python");
        return response.data.summary;
    } catch (error) {
        if (error.response && error.response.data) {
            const serverError = JSON.stringify(error.response.data);
            logDebug(`Summarizer Client Error (Server): ${serverError}`);
            console.error("Summarizer Client Error (Server):", serverError);
        }
        logDebug(`Summarizer Client Error: ${error.message}`);
        console.error("Summarizer Client Error:", error.message);
        throw error;
    }
}

module.exports = {
    summarizeText
};
