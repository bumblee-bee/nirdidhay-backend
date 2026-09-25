const express = require('express');
const router = express.Router();
const db = require('../db');

// CREATE HELP REQUEST
router.post('/create', (req, res) => {
  try {
    const {
      userId,
      category,
      description,
      latitude,
      longitude,
      destination,
      date,
      time,
      expectedDuration,
      estimatedFee,
    } = req.body;

    if (!userId || !category || !description) {
      return res.status(400).json({
        success: false,
        message: 'Required information missing.',
      });
    }

    if (
      latitude === undefined ||
      longitude === undefined ||
      !Number.isFinite(Number(latitude)) ||
      !Number.isFinite(Number(longitude))
    ) {
      return res.status(400).json({
        success: false,
        message: 'Location is required.',
      });
    }

    const result = db.prepare(`
      INSERT INTO help_requests (
        user_id,
        category,
        description,
        latitude,
        longitude,
        destination,
        date,
        time,
        expected_duration,
        estimated_fee,
        status,
        created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending', ?)
    `).run(
      userId,
      category,
      description,
      Number(latitude),
      Number(longitude),
      destination || '',
      date || '',
      time || '',
      expectedDuration || '',
      Number(estimatedFee || 0),
      new Date().toISOString()
    );

    res.status(201).json({
      success: true,
      requestId: result.lastInsertRowid,
      message: 'Help request created successfully.',
    });
  } catch (error) {
    console.error('Help request error:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to create help request.',
    });
  }
});

// VOLUNTEER: GET ACTIVE REQUESTS
router.get('/active', (req, res) => {
  try {
    const rows = db.prepare(`
      SELECT
        h.request_id,
        h.user_id,
        h.category,
        h.description,
        h.latitude,
        h.longitude,
        h.destination,
        h.date,
        h.time,
        h.expected_duration,
        h.estimated_fee,
        h.status,
        h.created_at,
        u.name,
        u.phone,
        u.profile_picture
      FROM help_requests h
      LEFT JOIN users u
        ON h.user_id = u.user_id
      WHERE h.status = 'Pending'
      ORDER BY h.created_at DESC
    `).all();

    res.json({
      success: true,
      requests: rows,
    });
  } catch (error) {
    console.error('Active requests error:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to load requests.',
    });
  }
});

// VOLUNTEER ACCEPT REQUEST
router.patch('/:id/accept', (req, res) => {
  try {
    const requestId = Number(req.params.id);
    const volunteerId = Number(req.body.volunteerId);

    if (!Number.isInteger(requestId) || !Number.isInteger(volunteerId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid request or volunteer ID.',
      });
    }

    const request = db.prepare(`
      SELECT *
      FROM help_requests
      WHERE request_id = ?
    `).get(requestId);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Help request not found.',
      });
    }

    if (request.status !== 'Pending') {
      return res.status(409).json({
        success: false,
        message: 'This request has already been accepted.',
      });
    }

    const result = db.prepare(`
      UPDATE help_requests
      SET status = 'Accepted',
          volunteer_id = ?
      WHERE request_id = ?
      AND status = 'Pending'
    `).run(volunteerId, requestId);

    if (result.changes === 0) {
      return res.status(409).json({
        success: false,
        message: 'Request is no longer available.',
      });
    }

    res.json({
      success: true,
      message: 'Help request accepted.',
      requestId,
      volunteerId,
      location: {
        latitude: request.latitude,
        longitude: request.longitude,
      },
    });
  } catch (error) {
    console.error('Accept request error:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to accept request.',
    });
  }
});

// USER: GET ACCEPTED REQUEST + LOCATION
router.get('/user/:userId', (req, res) => {
  try {
    const userId = Number(req.params.userId);

    const request = db.prepare(`
      SELECT
        h.*,
        u.name AS volunteer_name,
        u.phone AS volunteer_phone
      FROM help_requests h
      LEFT JOIN volunteers v
        ON h.volunteer_id = v.volunteer_id
      LEFT JOIN users u
        ON v.user_id = u.user_id
      WHERE h.user_id = ?
      ORDER BY h.request_id DESC
      LIMIT 1
    `).get(userId);

    if (!request) {
      return res.json({
        success: true,
        request: null,
      });
    }

    res.json({
      success: true,
      request,
      location: {
        latitude: request.latitude,
        longitude: request.longitude,
      },
    });
  } catch (error) {
    console.error('User request error:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to load request.',
    });
  }
});

module.exports = router;