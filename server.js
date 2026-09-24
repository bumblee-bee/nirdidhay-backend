const express = require('express');
const cors = require('cors');

const db = require('./db');

// =========================
// Routes
// =========================

const authRoutes = require('./routes/auth_routes');
const adminRoutes = require('./routes/admin_routes');
const volunteerRoutes =
  require('./routes/volunteer_routes');

// =========================
// App
// =========================

const app = express();

const PORT = 3000;

// =========================
// Middleware
// =========================

app.use(cors());

app.use(express.json());

// =========================
// API Routes
// =========================

app.use('/api/auth', authRoutes);

app.use('/api/admin', adminRoutes);

app.use('/api/volunteer', volunteerRoutes);

// =========================
// Database Test
// =========================

app.get('/api/db-test', (req, res) => {
  try {
    const result = db
      .prepare('SELECT 1 AS connected')
      .get();

    res.json({
      success: true,
      database: result.connected === 1,
      message: 'Nirdidhay database connected',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Database connection failed',
      error: error.message,
    });
  }
});

// =========================
// Backend Health Check
// =========================

app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Nirdidhay Backend is running',
  });
});

// =========================
// API Health Check
// =========================

app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: 'Nirdidhay API is running',
  });
});

// =========================
// Start Server
// =========================

app.listen(PORT, () => {
  console.log(
    `Nirdidhay backend running on http://localhost:${PORT}`
  );
});