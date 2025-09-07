const bcrypt = require('bcryptjs');

const password = 'swmsewu2025';
const hash = '$2a$12$DJ.06so9PRY6gNzZTFr4Z.XDGrZRvPfRg5TldOnd3eg4GXwKwLBIW';

console.log('Testing password:', password);
console.log('Against hash:', hash);
console.log('Result:', bcrypt.compareSync(password, hash));

// Also test the original hash from seeds
const originalHash = '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhxHKthjTRBxoyxLrQnEzG';
console.log('Testing against original hash:', bcrypt.compareSync(password, originalHash));
