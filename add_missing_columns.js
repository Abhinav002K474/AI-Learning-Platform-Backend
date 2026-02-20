const db = require('./db');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

async function addMissingColumns() {
    console.log("=== ADDING MISSING COLUMNS TO users TABLE ===");

    const migrations = [
        `ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_image TEXT`,
        `ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT DEFAULT ''`,
        `ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar VARCHAR(50) DEFAULT 'boy1'`,
        `ALTER TABLE users ADD COLUMN IF NOT EXISTS term VARCHAR(50)`,
    ];

    for (const sql of migrations) {
        try {
            await db.pool.query(sql);
            console.log("✅ Executed:", sql);
        } catch (err) {
            console.error("❌ Failed:", sql, err.message);
        }
    }

    console.log("\n=== MIGRATION COMPLETE ===");
    console.log("Verifying columns...");

    try {
        const result = await db.pool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'users' 
            ORDER BY ordinal_position
        `);
        console.log("\nusers table columns:");
        result.rows.forEach(row => console.log(`  - ${row.column_name} (${row.data_type})`));
    } catch (err) {
        console.error("Could not verify columns:", err.message);
    }

    process.exit(0);
}

addMissingColumns();
