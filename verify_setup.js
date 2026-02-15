/**
 * System Verification Script
 * Tests all critical components before starting the application
 */

const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config();

console.log('\n╔══════════════════════════════════════════════════════╗');
console.log('║   DAY ONE AI - SYSTEM VERIFICATION                  ║');
console.log('╚══════════════════════════════════════════════════════╝\n');

const tests = [];
let totalTests = 0;
let passedTests = 0;

// Test tracker
function test(name, fn) {
    tests.push({ name, fn });
}

function pass(message) {
    console.log(`✅ PASS: ${message}`);
    passedTests++;
}

function fail(message) {
    console.log(`❌ FAIL: ${message}`);
}

function info(message) {
    console.log(`ℹ️  INFO: ${message}`);
}

// ==================
// TEST DEFINITIONS
// ==================

test('Environment Variables Loaded', () => {
    if (process.env.DB_HOST && process.env.DB_NAME) {
        pass('Environment variables loaded from .env');
        info(`Database: ${process.env.DB_NAME} @ ${process.env.DB_HOST}`);
        return true;
    } else {
        fail('.env file missing or incomplete');
        info('Copy .env.example to .env and fill in values');
        return false;
    }
});

test('Port Configuration', () => {
    const PORT = parseInt(process.env.PORT || 5000);
    if (PORT === 5000) {
        pass(`Backend port correctly set to ${PORT}`);
        return true;
    } else {
        fail(`Backend port is ${PORT}, should be 5000`);
        return false;
    }
});

test('JWT Secret Configured', () => {
    if (process.env.JWT_SECRET &&
        process.env.JWT_SECRET !== 'your_super_secret_jwt_key_change_this_in_production_12345') {
        pass('JWT secret is configured');
        return true;
    } else {
        fail('JWT secret not set or using default value');
        info('Set a strong JWT_SECRET in .env');
        return false;
    }
});

test('Gemini API Key Configured', () => {
    if (process.env.GEMINI_API_KEY &&
        process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here') {
        pass('Gemini API key is configured');
        return true;
    } else {
        fail('Gemini API key not configured');
        info('Get a free API key from: https://makersuite.google.com/app/apikey');
        return false;
    }
});

test('Required Files Exist', () => {
    const requiredFiles = [
        'server.js',
        'db.js',
        '.env',
        'routes/auth.routes.js',
        'routes/student.routes.js',
        'routes/teacher.routes.js',
        'routes/admin.routes.js'
    ];

    let allExist = true;
    requiredFiles.forEach(file => {
        if (fs.existsSync(path.join(__dirname, file))) {
            // File exists
        } else {
            fail(`Missing file: ${file}`);
            allExist = false;
        }
    });

    if (allExist) {
        pass('All required backend files exist');
        return true;
    }
    return false;
});

test('Frontend Files Exist', () => {
    const frontendDir = path.join(__dirname, '..');
    const requiredFiles = [
        'index.html',
        'admin.html',
        'pdf_viewer.html',
        'styles.css'
    ];

    let allExist = true;
    requiredFiles.forEach(file => {
        if (fs.existSync(path.join(frontendDir, file))) {
            // File exists
        } else {
            fail(`Missing frontend file: ${file}`);
            allExist = false;
        }
    });

    if (allExist) {
        pass('All frontend files exist');
        return true;
    }
    return false;
});

test('Upload Directories Exist', () => {
    const uploadDirs = [
        path.join(__dirname, 'uploads'),
        path.join(__dirname, 'uploads/profiles'),
        path.join(__dirname, 'uploads/study_materials'),
        path.join(__dirname, 'uploads/question_banks')
    ];

    uploadDirs.forEach(dir => {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
    });

    pass('Upload directories verified/created');
    return true;
});

test('Database Connection', async () => {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD || '',
            port: process.env.DB_PORT || 3306
        });

        await connection.ping();
        pass('MySQL connection successful');
        info(`Connected to MySQL at ${process.env.DB_HOST}:${process.env.DB_PORT || 3306}`);
        await connection.end();
        return true;
    } catch (error) {
        fail('Cannot connect to MySQL');
        info('Make sure MySQL is running in XAMPP');
        info(`Error: ${error.message}`);
        return false;
    }
});

test('Database Exists', async () => {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME,
            port: process.env.DB_PORT || 3306
        });

        await connection.ping();
        pass(`Database '${process.env.DB_NAME}' exists and is accessible`);
        await connection.end();
        return true;
    } catch (error) {
        fail(`Database '${process.env.DB_NAME}' not found`);
        info('Run: node setup_db_fixed.js to create database');
        return false;
    }
});

test('Users Table Exists', async () => {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME,
            port: process.env.DB_PORT || 3306
        });

        const [tables] = await connection.query("SHOW TABLES LIKE 'users'");
        if (tables.length > 0) {
            pass('Users table exists');

            // Check for test users
            const [users] = await connection.query('SELECT COUNT(*) as count FROM users');
            info(`${users[0].count} users in database`);

            await connection.end();
            return true;
        } else {
            fail('Users table does not exist');
            info('Run: node setup_db_fixed.js to create tables');
            await connection.end();
            return false;
        }
    } catch (error) {
        fail('Error checking users table');
        info(`Error: ${error.message}`);
        return false;
    }
});

test('Documentation Files Exist', () => {
    const frontendDir = path.join(__dirname, '..');
    const docs = [
        'README.md',
        'STARTUP_GUIDE.md',
        'QUICK_REFERENCE.txt',
        'DEPLOYMENT.md',
        'ARCHITECTURE.md'
    ];

    let allExist = true;
    docs.forEach(doc => {
        if (!fs.existsSync(path.join(frontendDir, doc))) {
            fail(`Missing documentation: ${doc}`);
            allExist = false;
        }
    });

    if (allExist) {
        pass('All documentation files exist');
        return true;
    }
    return false;
});

// ==================
// RUN TESTS
// ==================

async function runTests() {
    for (const { name, fn } of tests) {
        console.log(`\n📋 Testing: ${name}`);
        console.log('─'.repeat(60));
        totalTests++;

        try {
            const result = await fn();
            if (!result) {
                // Test failed
            }
        } catch (error) {
            fail(`Test threw error: ${error.message}`);
        }
    }

    // Summary
    console.log('\n' + '═'.repeat(60));
    console.log('VERIFICATION SUMMARY');
    console.log('═'.repeat(60));
    console.log(`✅ Passed: ${passedTests}/${totalTests}`);
    console.log(`❌ Failed: ${totalTests - passedTests}/${totalTests}`);

    if (passedTests === totalTests) {
        console.log('\n🎉 ALL TESTS PASSED! System is ready to run.\n');
        console.log('Next steps:');
        console.log('  1. Start MySQL in XAMPP');
        console.log('  2. Run: node server.js (or START_BACKEND.bat)');
        console.log('  3. Open: index.html in browser\n');
        process.exit(0);
    } else {
        console.log('\n⚠️  SOME TESTS FAILED. Fix issues before running the app.\n');
        process.exit(1);
    }
}

// Start testing
runTests().catch(error => {
    console.error('\n❌ Fatal error during testing:', error);
    process.exit(1);
});
