const bcrypt = require('bcryptjs');
const hash = bcrypt.hashSync('password123', 10);
console.log('Pre-computed hash for password123:', hash);
