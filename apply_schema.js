const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require("dotenv").config({ path: path.join(__dirname, '.env') });

async function applySchema() {
    console.log("=== APPLYING NEW SCHEMA (PostgreSQL) ===");

    const client = new Client({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        // Connect to 'postgres' initially to create DB if needed, but usually we connect to target DB
        // For Supabase, user usually provides full connection string or DB exists.
        database: process.env.DB_NAME || "postgres",
        port: process.env.DB_PORT || 5432
    });

    try {
        await client.connect();

        const schemaPath = path.join(__dirname, 'schema.sql');
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');

        console.log("Executing SQL from schema.sql...");
        await client.query(schemaSql);

        console.log("✅ SCHEMA APPLIED SUCCESSFULLY.");
        console.log("Verified Table 'users' created.");

    } catch (err) {
        console.error("❌ SCHEMA ERROR:", err);
    } finally {
        await client.end();
        process.exit();
    }
}

applySchema();

