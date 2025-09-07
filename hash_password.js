const bcrypt = require('bcryptjs');

async function hashPassword() {
  const password = 'Faculty21@#';
  const saltRounds = 12;
  const hash = await bcrypt.hash(password, saltRounds);
  console.log('Password hash for Faculty21@#:', hash);
  
  // Also show the SQL insert statement
  console.log(`
INSERT INTO users (name, username, email, password_hash, role) VALUES 
('Faculty Twenty One', 'faculty21', 'faculty21@swms.edu', '${hash}', 'faculty')
ON CONFLICT (username) DO NOTHING;
  `);
}

hashPassword().catch(console.error);
