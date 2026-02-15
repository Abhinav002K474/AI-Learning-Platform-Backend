const mysql = require("mysql2/promise");
const path = require('path');
require("dotenv").config({ path: path.join(__dirname, '.env') });

async function resetDatabase() {
    console.log("=== HARD RESETTING DATABASE ===");
    console.log("Creating connection to MySQL Root...");

    // Connect without DB selected to DROP it
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD
    });

    try {
        console.log("1. Dropping existing database 'school_db'...");
        await connection.query("DROP DATABASE IF EXISTS school_db");

        console.log("2. Creating fresh database 'school_db'...");
        await connection.query("CREATE DATABASE school_db");
        await connection.query("USE school_db");

        console.log("3. Creating 'users' table...");
        const createTableQuery = `
            CREATE TABLE users (
              id INT AUTO_INCREMENT PRIMARY KEY,
              name VARCHAR(100) NOT NULL,
              email VARCHAR(100) UNIQUE,
              phone VARCHAR(20) UNIQUE,
              password_hash VARCHAR(255) NOT NULL,
              role ENUM('student','parent','teacher','admin') DEFAULT 'student',
              class VARCHAR(50), 
              is_active BOOLEAN DEFAULT TRUE,
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `;
        // Added 'class' and 'is_active' because the backend depends on them, 
        // even if the user's minimal snippet didn't list them explicitly in Step 70,
        // they were in Step 54 and Step 6.
        await connection.query(createTableQuery);

        console.log("✅ DATABASE RESET & TABLE CREATED SUCCESSFULLY.");

    } catch (err) {
        console.error("❌ SQL ERROR:", err);
    } finally {
        await connection.end();
        process.exit();
    }
}

resetDatabase();
