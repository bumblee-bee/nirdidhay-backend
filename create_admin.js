const db = require('./db');

const name = 'Sanjana';
const email = 'sanjanaatabaa@gmail.com';
const password = 'chuchuchu';
const phone = '01700000000';

const existingUser = db
  .prepare('SELECT user_id FROM users WHERE email = ?')
  .get(email);

if (existingUser) {
  db.prepare(`
    UPDATE users
    SET
      name = ?,
      password = ?,
      role = 'Admin',
      account_status = 'Active'
    WHERE email = ?
  `).run(name, password, email);

  console.log('Admin account updated successfully.');
} else {
  db.prepare(`
    INSERT INTO users (
      name,
      email,
      password,
      phone,
      role,
      account_status
    )
    VALUES (?, ?, ?, ?, 'Admin', 'Active')
  `).run(name, email, password, phone);

  console.log('Admin account created successfully.');
}

const admin = db
  .prepare(`
    SELECT user_id, name, email, role, account_status
    FROM users
    WHERE email = ?
  `)
  .get(email);

console.log(admin);