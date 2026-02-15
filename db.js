const { Pool } = require('pg');
const path = require('path');
require("dotenv").config({ path: path.join(__dirname, '.env') });

const isProduction = process.env.NODE_ENV === 'production';
const connectionString = process.env.DATABASE_URL;

const pool = new Pool({
    connectionString: connectionString ? connectionString : undefined,
    host: connectionString ? undefined : (process.env.DB_HOST || "127.0.0.1"),
    user: connectionString ? undefined : (process.env.DB_USER || "postgres"),
    password: connectionString ? undefined : (process.env.DB_PASSWORD || ""),
    database: connectionString ? undefined : (process.env.DB_NAME || "school_db"),
    port: connectionString ? undefined : (process.env.DB_PORT || 5432),
    ssl: connectionString ? { rejectUnauthorized: false } : false, // Supabase requires SSL
    max: 10,
    idleTimeoutMillis: 30000,
    family: 4 // Force IPv4 to avoid Windows IPv6 resolution issues
});

// Test connection immediately
(async () => {
    try {
        const client = await pool.connect();
        console.log("✅ Database (PostgreSQL) connected successfully");
        client.release();
    } catch (err) {
        console.error("❌ DB Connection Failed", err);
    }
})();

module.exports = {
    query: async (text, params) => {
        const start = Date.now();
        const res = await pool.query(text, params);
        const duration = Date.now() - start;
        // console.log('executed query', { text, duration, rows: res.rowCount });

        // Return [rows, fields] to match mysql2 signature
        return [res.rows, res.fields];
    },
    pool
};

