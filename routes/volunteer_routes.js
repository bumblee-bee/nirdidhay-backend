const express = require('express');

const router = express.Router();

const db = require('../db');

// Apply as volunteer
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

    // Required fields
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

    // Check user
    const user = db
      .prepare(
        `
        SELECT *
        FROM users
        WHERE User_ID = ?
        `
      )
      .get(userId);

    if (!user) {
      return res.status(404).json({
        message: 'User not found.',
      });
    }

    // Prevent duplicate active/pending application
    const existingVolunteer = db
      .prepare(
        `
        SELECT *
        FROM volunteers
        WHERE User_ID = ?
        `
      )
      .get(userId);

    if (existingVolunteer) {
      return res.status(409).json({
        message:
          'You already have a volunteer application.',
      });
    }

    // Update user information
    db.prepare(
      `
      UPDATE users
      SET
        Name = ?,
        Email = ?,
        Phone = ?,
        DOB = ?,
        Address = ?,
        Profile_Picture = ?,
        Blood_Group = ?,
        Occupation = ?
      WHERE User_ID = ?
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

    // Create volunteer record
    const volunteerResult = db
      .prepare(
        `
        INSERT INTO volunteers (
          User_ID,
          Verification_Status,
          Service_Area,
          Availability,
          Help_Categories,
          Expected_Fee,
          Volunteer_Status
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

    // Verification record
    db.prepare(
      `
      INSERT INTO volunteer_verification (
        Volunteer_ID,
        Document_Type,
        Document_Reference,
        Verification_Status,
        Admin_Decision
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

    // Guardian record
    db.prepare(
      `
      INSERT INTO guardians (
        Volunteer_ID,
        Guardian_Name,
        Relationship,
        Phone,
        Address
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
      message:
        'Volunteer application submitted successfully.',
      volunteerId,
      verificationStatus: 'Pending',
    });
  } catch (error) {
    console.error(
      'Volunteer application error:',
      error
    );

    return res.status(500).json({
      message:
        'Failed to submit volunteer application.',
    });
  }
});

// Get pending volunteer applications
router.get('/pending', (req, res) => {
  try {
    const rows = db
      .prepare(
        `
        SELECT
          v.Volunteer_ID,
          v.User_ID,
          u.Name,
          u.Email,
          u.Phone,
          u.Profile_Picture,
          v.Verification_Status,
          v.Service_Area,
          v.Availability,
          v.Help_Categories,
          v.Expected_Fee,
          v.Volunteer_Status
        FROM volunteers v
        JOIN users u
          ON v.User_ID = u.User_ID
        WHERE v.Verification_Status = 'Pending'
        ORDER BY v.Volunteer_ID DESC
        `
      )
      .all();

    return res.json(rows);
  } catch (error) {
    console.error(
      'Pending volunteers error:',
      error
    );

    return res.status(500).json({
      message:
        'Failed to load volunteer applications.',
    });
  }
});

module.exports = router;