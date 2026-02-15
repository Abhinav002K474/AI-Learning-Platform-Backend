const axios = require('axios');

async function checkHealth() {
    try {
        console.log("Checking Health...");
        const response = await axios.get('http://localhost:5000/health');
        console.log("Health Status:", response.status);
        console.log("Health Data:", response.data);
    } catch (error) {
        console.error("Health Check Failed:", error.message);
        if (error.response) {
            console.error("Response Data:", error.response.data);
        }
    }
}

checkHealth();
