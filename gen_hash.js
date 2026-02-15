const bcrypt = require('bcryptjs');

const pass = "student123";
const t_pass = "teacher123";

const hash = bcrypt.hashSync(pass, 10);
const t_hash = bcrypt.hashSync(t_pass, 10);

console.log("Student Hash:", hash);
console.log("Teacher Hash:", t_hash);
