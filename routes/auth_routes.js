const express = require('express');

const router = express.Router();

const db = require('../db');

// User Registration
router.post('/register', (req, res) => {
  try {
    const {
      name,
      email,
      password,
      phone,
      dob,
      address,
      profilePicture,
      bloodGroup,
      occupation,
    } = req.body;

    if (!name || !email || !password || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, password and phone are required.',
      });
    }

    const existingUser = db
      .prepare(
        'SELECT user_id FROM users WHERE email = ?'
      )
      .get(email);

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists.',
      });
    }

    const result = db
      .prepare(`
        INSERT INTO users (
          name,
          email,
          password,
          phone,
          dob,
          address,
          profile_picture,
          blood_group,
          occupation,
          account_status
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .run(
        name,
        email,
        password,
        phone,
        dob || '',
        address || '',
        profilePicture || '',
        bloodGroup || '',
        occupation || '',
        'Active',
      );

    const user = db
      .prepare(`
        SELECT
          user_id,
          name,
          email,
          phone,
          dob,
          address,
          profile_picture,
          blood_group,
          occupation,
          role,
          account_status
        FROM users
        WHERE user_id = ?
      `)
      .get(result.lastInsertRowid);

    return res.status(201).json({
      success: true,
      message: 'Account created successfully.',
      user,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Registration failed.',
      error: error.message,
    });
  }
});

// User Login
router.post('/login', (req, res) => {
  try {
    const {
      email,
      password,
    } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required.',
      });
    }

    const user = db
      .prepare(`
        SELECT
          user_id,
          name,
          email,
          phone,
          dob,
          address,
          profile_picture,
          blood_group,
          occupation,
          role,
          account_status
        FROM users
        WHERE email = ?
          AND password = ?
      `)
      .get(email, password);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    if (user.account_status !== 'Active') {
      return res.status(403).json({
        success: false,
        message: 'This account is not active.',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Login successful.',
      user,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Login failed.',
      error: error.message,
    });
  }
});

module.exports = router;