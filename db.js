const Database = require('better-sqlite3');

const db = new Database('nirdidhay.db');

db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    user_id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    phone TEXT NOT NULL,
    dob TEXT,
    address TEXT,
    profile_picture TEXT,
    blood_group TEXT,
    occupation TEXT,
    role TEXT NOT NULL DEFAULT 'User',
    account_status TEXT NOT NULL DEFAULT 'Active'
  );

  CREATE TABLE IF NOT EXISTS volunteers (
    volunteer_id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    verification_status TEXT NOT NULL DEFAULT 'Pending',
    service_area TEXT,
    availability TEXT,
    help_categories TEXT,
    expected_fee REAL DEFAULT 0,
    volunteer_status TEXT NOT NULL DEFAULT 'Inactive',

    FOREIGN KEY (user_id)
      REFERENCES users(user_id)
      ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS volunteer_verification (
    verification_id INTEGER PRIMARY KEY AUTOINCREMENT,
    volunteer_id INTEGER NOT NULL,
    document_type TEXT,
    document_reference TEXT,
    verification_status TEXT NOT NULL DEFAULT 'Pending',
    admin_decision TEXT,

    FOREIGN KEY (volunteer_id)
      REFERENCES volunteers(volunteer_id)
      ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS guardians (
    guardian_id INTEGER PRIMARY KEY AUTOINCREMENT,
    volunteer_id INTEGER NOT NULL,
    guardian_name TEXT,
    relationship TEXT,
    phone TEXT,
    address TEXT,

    FOREIGN KEY (volunteer_id)
      REFERENCES volunteers(volunteer_id)
      ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS help_requests (
    request_id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    category TEXT NOT NULL,
    description TEXT,
    location TEXT,
    destination TEXT,
    date TEXT,
    time TEXT,
    expected_duration TEXT,
    estimated_fee REAL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'Pending',

    FOREIGN KEY (user_id)
      REFERENCES users(user_id)
      ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS help_assignments (
    assignment_id INTEGER PRIMARY KEY AUTOINCREMENT,
    request_id INTEGER NOT NULL,
    volunteer_id INTEGER NOT NULL,
    accepted_time TEXT,
    completion_time TEXT,
    status TEXT NOT NULL DEFAULT 'Assigned',

    FOREIGN KEY (request_id)
      REFERENCES help_requests(request_id)
      ON DELETE CASCADE,

    FOREIGN KEY (volunteer_id)
      REFERENCES volunteers(volunteer_id)
      ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS chats (
    chat_id INTEGER PRIMARY KEY AUTOINCREMENT,
    request_id INTEGER NOT NULL,
    sender_id INTEGER NOT NULL,
    receiver_id INTEGER NOT NULL,
    message TEXT NOT NULL,
    timestamp TEXT NOT NULL,

    FOREIGN KEY (request_id)
      REFERENCES help_requests(request_id)
      ON DELETE CASCADE,

    FOREIGN KEY (sender_id)
      REFERENCES users(user_id),

    FOREIGN KEY (receiver_id)
      REFERENCES users(user_id)
  );

  CREATE TABLE IF NOT EXISTS payments (
    payment_id INTEGER PRIMARY KEY AUTOINCREMENT,
    request_id INTEGER NOT NULL,
    payer_id INTEGER NOT NULL,
    receiver_id INTEGER NOT NULL,
    amount REAL NOT NULL DEFAULT 0,
    payment_method TEXT,
    transaction_id TEXT,
    payment_status TEXT NOT NULL DEFAULT 'Pending',
    payment_time TEXT,

    FOREIGN KEY (request_id)
      REFERENCES help_requests(request_id)
      ON DELETE CASCADE,

    FOREIGN KEY (payer_id)
      REFERENCES users(user_id),

    FOREIGN KEY (receiver_id)
      REFERENCES users(user_id)
  );

  CREATE TABLE IF NOT EXISTS feedback (
    feedback_id INTEGER PRIMARY KEY AUTOINCREMENT,
    request_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    volunteer_id INTEGER NOT NULL,
    rating INTEGER NOT NULL,
    feedback TEXT,
    date TEXT,

    FOREIGN KEY (request_id)
      REFERENCES help_requests(request_id)
      ON DELETE CASCADE,

    FOREIGN KEY (user_id)
      REFERENCES users(user_id),

    FOREIGN KEY (volunteer_id)
      REFERENCES volunteers(volunteer_id)
  );

  CREATE TABLE IF NOT EXISTS reports (
    report_id INTEGER PRIMARY KEY AUTOINCREMENT,
    reporter_id INTEGER NOT NULL,
    reported_user_id INTEGER NOT NULL,
    request_id INTEGER,
    reason TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Pending',

    FOREIGN KEY (reporter_id)
      REFERENCES users(user_id),

    FOREIGN KEY (reported_user_id)
      REFERENCES users(user_id),

    FOREIGN KEY (request_id)
      REFERENCES help_requests(request_id)
      ON DELETE SET NULL
  );

  CREATE TABLE IF NOT EXISTS locations (
    location_id INTEGER PRIMARY KEY AUTOINCREMENT,
    division TEXT,
    district TEXT,
    area TEXT,
    latitude REAL,
    longitude REAL
  );
`);

// Add role to existing database if the column does not exist.
try {
  db.prepare(
    "ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'User'"
  ).run();

  console.log('Role column added to users table.');
} catch (error) {
  if (!error.message.includes('duplicate column name')) {
    throw error;
  }
}

console.log('Nirdidhay database initialized successfully.');

module.exports = db;