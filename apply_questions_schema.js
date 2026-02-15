const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config();

async function applySchema() {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            multipleStatements: true
        });

        console.log("Connected to DB...");

        const sql = fs.readFileSync(path.join(__dirname, 'schema_update_questions.sql'), 'utf8');

        console.log("Applying Schema Update...");
        await connection.query(sql);

        console.log("Schema Updated Successfully.");
        await connection.end();
    } catch (err) {
        console.error("Schema Update Failed:", err);
    }
}

applySchema();
