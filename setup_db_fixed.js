const mysql = require('mysql2/promise');
require('dotenv').config();

async function setupDatabase() {
    console.log("🔄 Connecting to MySQL...");

    // Connect WITHOUT database selected first
    let connection;
    try {
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            multipleStatements: true
        });
        console.log("✅ Connected to MySQL Server");
    } catch (err) {
        console.error("❌ Failed to connect to MySQL. Ensure XAMPP MySQL is running.", err.message);
        process.exit(1);
    }

    try {
        console.log("⚠️ Dropping database 'school_db' to fix tablespace issues...");
        await connection.query("DROP DATABASE IF EXISTS school_db");
        console.log("✅ Database dropped.");

        console.log("🛠 Creating Database 'school_db'...");
        await connection.query("CREATE DATABASE school_db");
        console.log("✅ Database 'school_db' created.");

        console.log("🔄 Switching to 'school_db'...");
        await connection.changeUser({ database: 'school_db' });

        console.log("🛠 Dropping old 'users' table if exists...");
        await connection.query("DROP TABLE IF EXISTS users");
        console.log("✅ Old table dropped.");

        console.log("🛠 Creating 'users' table...");
        const createTableQuery = `
            CREATE TABLE users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                email VARCHAR(150) UNIQUE,
                phone VARCHAR(15) UNIQUE,
                password_hash VARCHAR(255) NOT NULL,
                role ENUM('student', 'teacher') NOT NULL,
                class VARCHAR(20),
                profile_image VARCHAR(255),
                bio TEXT,
                avatar VARCHAR(50) DEFAULT 'boy1',
                is_active BOOLEAN DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `;
        await connection.query(createTableQuery); // Create table if not exists

        // Check if class column exists (in case table existed but was old version)
        // This is a quick fix to ensure the schema is correct without deleting data if table exists
        try {
            await connection.query("SELECT class FROM users LIMIT 1");
        } catch (colErr) {
            console.log("⚠️ 'class' column missing. Adding it...");
            await connection.query("ALTER TABLE users ADD COLUMN class VARCHAR(20) AFTER role");
            console.log("✅ 'class' column added.");
        }

        console.log("✅ Table 'users' is ready.");

        console.log("✨ Setup Complete! You can now restart the backend.");
        process.exit(0);

    } catch (err) {
        console.error("❌ Setup Failed:", err);
        process.exit(1);
    } finally {
        if (connection) await connection.end();
    }
}

setupDatabase();
