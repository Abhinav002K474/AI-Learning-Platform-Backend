const axios = require('axios');

async function testSignup() {
    console.log("Testing Signup for 'Test User'...");
    const payload = {
        name: "Test User",
        email: "test@gmail.com",
        password: "123456",
        role: "student",
        class: "Grade 10" // Adding a dummy class as it might be required for students
    };

    try {
        const response = await axios.post('http://localhost:5000/api/auth/signup', payload);
        console.log("✅ Signup Successful!");
        console.log("Status:", response.status);
        console.log("Body:", response.data);
    } catch (error) {
        console.error("❌ Signup Failed.");
        if (error.response) {
            console.error("Status:", error.response.status);
            console.error("Data:", error.response.data);
        } else {
            console.error("Error:", error.message);
        }
    }
}

testSignup();
