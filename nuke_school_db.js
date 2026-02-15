const fs = require('fs');
const path = require('path');

const targetDir = 'C:\\xampp\\mysql\\data\\school_db';

console.log(`Trying to remove: ${targetDir}`);

try {
    if (fs.existsSync(targetDir)) {
        fs.rmSync(targetDir, { recursive: true, force: true });
        console.log("✅ Successfully removed school_db directory.");
    } else {
        console.log("⚠️ Directory does not exist, proceeding...");
    }
} catch (err) {
    console.error("❌ Failed to remove directory:", err.message);
    // Try renamed method if lock issues
    try {
        const newName = targetDir + '_deleted_' + Date.now();
        fs.renameSync(targetDir, newName);
        console.log(`✅ Renamed locked directory to: ${newName}`);
    } catch (renameErr) {
        console.error("❌ Failed to rename directory:", renameErr.message);
    }
}
