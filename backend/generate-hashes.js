const bcrypt = require('bcryptjs');

// Generate hashes for all default passwords
const passwords = {
  admin_swms: 'swmsewu2025',
  students: 'password123',
  faculty: 'password123',
  consultants: 'password123'
};

console.log('Generating password hashes...\n');

Object.entries(passwords).forEach(([user, password]) => {
  const hash = bcrypt.hashSync(password, 12);
  console.log(`${user}: ${password} -> ${hash}`);
});

console.log('\nUpdate SQL commands:');
console.log(`UPDATE users SET password_hash = '${bcrypt.hashSync('swmsewu2025', 12)}' WHERE username = 'admin_swms';`);
console.log(`UPDATE users SET password_hash = '${bcrypt.hashSync('password123', 12)}' WHERE role IN ('student', 'faculty', 'consultant');`);
