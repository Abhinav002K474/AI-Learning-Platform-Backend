const fs = require('fs');
const bcrypt = require('bcryptjs');
const path = require('path');

const usersPath = path.join(__dirname, 'data/users.json');
const users = JSON.parse(fs.readFileSync(usersPath, 'utf8'));

const studentPass = "student123";
const teacherPass = "teacher123";

const studentHash = bcrypt.hashSync(studentPass, 10);
const teacherHash = bcrypt.hashSync(teacherPass, 10);

const sIdx = users.findIndex(u => u.email === 'student@test.com');
if (sIdx !== -1) {
    users[sIdx].password_hash = studentHash;
    console.log("Updated student hash");
}

const tIdx = users.findIndex(u => u.email === 'teacher@test.com');
if (tIdx !== -1) {
    users[tIdx].password_hash = teacherHash;
    console.log("Updated teacher hash");
}

fs.writeFileSync(usersPath, JSON.stringify(users, null, 4));
console.log("Done.");
