const express = require('express');
const cors = require('cors');

const db = require('./db');

const authRoutes = require('./routes/auth_routes');
const adminRoutes = require('./routes/admin_routes');
const volunteerRoutes = require('./routes/volunteer_routes');
const helpRoutes = require('./routes/help_routes');

const app = express();

const PORT = process.env.PORT || 3000;

// ============================================================
// MIDDLEWARE
// ============================================================

app.use(cors());

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

// ============================================================
// API ROUTES
// ============================================================

// Authentication
app.use('/api/auth', authRoutes);

// Admin
app.use('/api/admin', adminRoutes);

// Volunteer
app.use('/api/volunteer', volunteerRoutes);

// Help / Emergency
app.use('/api/help', helpRoutes);

// ============================================================
// BACKEND HEALTH CHECK
// ============================================================

app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Nirdidhay Backend is running',
  });
});

// ============================================================
// API HEALTH CHECK
// ============================================================

app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: 'Nirdidhay API is running',
  });
});

// ============================================================
// 404 HANDLER
// ============================================================

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found.',
    path: req.originalUrl,
  });
});

// ============================================================
// ERROR HANDLER
// ============================================================

app.use((err, req, res, next) => {
  console.error('Server error:', err);

  res.status(500).json({
    success: false,
    message: 'Internal server error.',
  });
});

// ============================================================
// START SERVER
// ============================================================

app.listen(PORT, '0.0.0.0', () => {
  console.log(
    `Nirdidhay backend running on port ${PORT}`
  );
});