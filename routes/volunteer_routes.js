const express = require('express');

const router = express.Router();

const db = require('../db');

// ============================================================
// APPLY AS VOLUNTEER
// ============================================================

router.post('/apply', (req, res) => {
  try {
    const {
      userId,
      fullName,
      dob,
      phone,
      email,
      currentAddress,
      permanentAddress,
      occupation,
      bloodGroup,
      emergencyContact,
      profilePicture,
      serviceArea,
      availability,
      helpCategories,
      expectedFee,
      documentType,
      documentReference,
      guardianName,
      guardianRelationship,
      guardianPhone,
      guardianAddress,
    } = req.body;

    const requiredFields = [
      userId,
      fullName,
      dob,
      phone,
      email,
      currentAddress,
      permanentAddress,
      occupation,
      bloodGroup,
      emergencyContact,
      profilePicture,
      serviceArea,
      availability,
      helpCategories,
      expectedFee,
      documentType,
      documentReference,
      guardianName,
      guardianRelationship,
      guardianPhone,
      guardianAddress,
    ];

    const hasEmptyField = requiredFields.some(
      (value) =>
        value === undefined ||
        value === null ||
        String(value).trim() === ''
    );

    if (hasEmptyField) {
      return res.status(400).json({
        message: 'Please provide all required information.',
      });
    }

    const user = db
      .prepare(
        `
        SELECT *
        FROM users
        WHERE user_id = ?
        `
      )
      .get(userId);

    if (!user) {
      return res.status(404).json({
        message: 'User not found.',
      });
    }

    const existingVolunteer = db
      .prepare(
        `
        SELECT *
        FROM volunteers
        WHERE user_id = ?
        `
      )
      .get(userId);

    if (existingVolunteer) {
      return res.status(409).json({
        message: 'You already have a volunteer application.',
      });
    }

    db.prepare(
      `
      UPDATE users
      SET
        name = ?,
        email = ?,
        phone = ?,
        dob = ?,
        address = ?,
        profile_picture = ?,
        blood_group = ?,
        occupation = ?
      WHERE user_id = ?
      `
    ).run(
      fullName,
      email,
      phone,
      dob,
      currentAddress,
      profilePicture,
      bloodGroup,
      occupation,
      userId
    );

    const volunteerResult = db
      .prepare(
        `
        INSERT INTO volunteers (
          user_id,
          verification_status,
          service_area,
          availability,
          help_categories,
          expected_fee,
          volunteer_status
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)
        `
      )
      .run(
        userId,
        'Pending',
        serviceArea,
        availability,
        helpCategories,
        Number(expectedFee),
        'Inactive'
      );

    const volunteerId = volunteerResult.lastInsertRowid;

    db.prepare(
      `
      INSERT INTO volunteer_verification (
        volunteer_id,
        document_type,
        document_reference,
        verification_status,
        admin_decision
      )
      VALUES (?, ?, ?, ?, ?)
      `
    ).run(
      volunteerId,
      documentType,
      documentReference,
      'Pending',
      'Pending'
    );

    db.prepare(
      `
      INSERT INTO guardians (
        volunteer_id,
        guardian_name,
        relationship,
        phone,
        address
      )
      VALUES (?, ?, ?, ?, ?)
      `
    ).run(
      volunteerId,
      guardianName,
      guardianRelationship,
      guardianPhone,
      guardianAddress
    );

    return res.status(201).json({
      message: 'Volunteer application submitted successfully.',
      volunteerId,
      verificationStatus: 'Pending',
    });
  } catch (error) {
    console.error('Volunteer application error:', error);

    return res.status(500).json({
      message: 'Failed to submit volunteer application.',
    });
  }
});

// ============================================================
// GET PENDING VOLUNTEERS
// ============================================================

router.get('/pending', (req, res) => {
  try {
    const rows = db
      .prepare(
        `
        SELECT
          v.volunteer_id,
          v.user_id,
          u.name,
          u.email,
          u.phone,
          u.profile_picture,
          v.verification_status,
          v.service_area,
          v.availability,
          v.help_categories,
          v.expected_fee,
          v.volunteer_status
        FROM volunteers v
        JOIN users u
          ON v.user_id = u.user_id
        WHERE v.verification_status = 'Pending'
        ORDER BY v.volunteer_id DESC
        `
      )
      .all();

    return res.json(rows);
  } catch (error) {
    console.error('Pending volunteers error:', error);

    return res.status(500).json({
      message: 'Failed to load volunteer applications.',
    });
  }
});

// ============================================================
// CREATE EMERGENCY
// ============================================================

router.post('/emergency', (req, res) => {
  try {
    const {
      userId,
      latitude,
      longitude,
    } = req.body;

    if (
      latitude === undefined ||
      longitude === undefined ||
      latitude === null ||
      longitude === null
    ) {
      return res.status(400).json({
        success: false,
        message: 'Location is required.',
      });
    }

    const lat = Number(latitude);
    const lng = Number(longitude);

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid location.',
      });
    }

    const result = db
      .prepare(
        `
        INSERT INTO emergency_requests (
          user_id,
          latitude,
          longitude,
          status,
          created_at
        )
        VALUES (?, ?, ?, 'Active', ?)
        `
      )
      .run(
        userId || null,
        lat,
        lng,
        new Date().toISOString()
      );

    return res.status(201).json({
      success: true,
      emergencyId: result.lastInsertRowid,
      message: 'Emergency request sent.',
    });
  } catch (error) {
    console.error('Emergency create error:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to send emergency request.',
    });
  }
});

// ============================================================
// GET ACTIVE EMERGENCIES
// ============================================================

router.get('/emergency/active', (req, res) => {
  try {
    const emergencies = db
      .prepare(
        `
        SELECT
          e.emergency_id,
          e.user_id,
          e.latitude,
          e.longitude,
          e.status,
          e.created_at,
          u.name,
          u.phone,
          u.profile_picture
        FROM emergency_requests e
        LEFT JOIN users u
          ON e.user_id = u.user_id
        WHERE e.status = 'Active'
        ORDER BY e.created_at DESC
        `
      )
      .all();

    return res.json({
      success: true,
      emergencies,
    });
  } catch (error) {
    console.error('Emergency list error:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to load emergencies.',
    });
  }
});

// ============================================================
// CLOSE EMERGENCY
// ============================================================

router.patch('/emergency/:id/close', (req, res) => {
  try {
    const emergencyId = Number(req.params.id);

    if (!Number.isInteger(emergencyId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid emergency ID.',
      });
    }

    const result = db
      .prepare(
        `
        UPDATE emergency_requests
        SET status = 'Closed'
        WHERE emergency_id = ?
        `
      )
      .run(emergencyId);

    if (result.changes === 0) {
      return res.status(404).json({
        success: false,
        message: 'Emergency not found.',
      });
    }

    return res.json({
      success: true,
      message: 'Emergency closed.',
    });
  } catch (error) {
    console.error('Emergency close error:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to close emergency.',
    });
  }
});

module.exports = router;