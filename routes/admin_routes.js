const express = require('express');

const router = express.Router();

const db = require('../db');

// Get pending volunteer applications
router.get('/volunteers/pending', (req, res) => {
  try {
    const volunteers = db
      .prepare(`
        SELECT
          v.volunteer_id,
          v.user_id,
          u.name,
          u.email,
          u.phone,
          u.dob,
          u.address,
          u.occupation,
          u.blood_group,
          v.service_area,
          v.availability,
          v.help_categories,
          v.expected_fee,
          v.verification_status,
          v.volunteer_status
        FROM volunteers v
        INNER JOIN users u
          ON u.user_id = v.user_id
        WHERE v.verification_status = 'Pending'
        ORDER BY v.volunteer_id DESC
      `)
      .all();

    return res.status(200).json({
      success: true,
      volunteers,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to load pending volunteers.',
      error: error.message,
    });
  }
});

// Approve volunteer
router.patch('/volunteers/:volunteerId/approve', (req, res) => {
  try {
    const volunteerId = Number(req.params.volunteerId);

    const volunteer = db
      .prepare(`
        SELECT volunteer_id, user_id
        FROM volunteers
        WHERE volunteer_id = ?
      `)
      .get(volunteerId);

    if (!volunteer) {
      return res.status(404).json({
        success: false,
        message: 'Volunteer application not found.',
      });
    }

    db.prepare(`
      UPDATE volunteers
      SET
        verification_status = 'Verified',
        volunteer_status = 'Active'
      WHERE volunteer_id = ?
    `).run(volunteerId);

    db.prepare(`
      UPDATE users
      SET role = 'Volunteer'
      WHERE user_id = ?
    `).run(volunteer.user_id);

    return res.status(200).json({
      success: true,
      message: 'Volunteer approved successfully.',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to approve volunteer.',
      error: error.message,
    });
  }
});

// Reject volunteer
router.patch('/volunteers/:volunteerId/reject', (req, res) => {
  try {
    const volunteerId = Number(req.params.volunteerId);

    const volunteer = db
      .prepare(`
        SELECT volunteer_id
        FROM volunteers
        WHERE volunteer_id = ?
      `)
      .get(volunteerId);

    if (!volunteer) {
      return res.status(404).json({
        success: false,
        message: 'Volunteer application not found.',
      });
    }

    db.prepare(`
      UPDATE volunteers
      SET
        verification_status = 'Rejected',
        volunteer_status = 'Inactive'
      WHERE volunteer_id = ?
    `).run(volunteerId);

    return res.status(200).json({
      success: true,
      message: 'Volunteer application rejected.',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to reject volunteer.',
      error: error.message,
    });
  }
});

module.exports = router;