// Firebase Cloud Messaging Routes
// Handle FCM token registration and deletion

const express = require('express');
const router = express.Router();
const Student = require('../models/Student');
const { authenticateStudent } = require('../middleware/authMiddleware');

// Register FCM token for student
router.post('/register-token', authenticateStudent, async (req, res) => {
  try {
    const { fcmToken } = req.body;
    const managedStudentId = req.student._id; // This is ManagedStudent ID from token

    if (!fcmToken) {
      return res.status(400).json({
        success: false,
        message: 'FCM token is required'
      });
    }

    // Find or create Student record linked to ManagedStudent
    let student = await Student.findOne({ managedStudentId: managedStudentId });
    
    if (!student) {
      // Create new Student record for FCM tokens
      student = new Student({
        managedStudentId: managedStudentId,
        fullName: req.student.fullName,
        fcmTokens: []
      });
    }

    // Initialize fcmTokens array if it doesn't exist
    if (!student.fcmTokens) {
      student.fcmTokens = [];
    }

    // Add token if not already present
    if (!student.fcmTokens.includes(fcmToken)) {
      student.fcmTokens.push(fcmToken);
      await student.save();
      console.log(`✅ FCM token registered for student: ${student.fullName || req.student.fullName}`);
    }

    res.json({
      success: true,
      message: 'FCM token registered successfully'
    });
  } catch (error) {
    console.error('Error registering FCM token:', error);
    res.status(500).json({
      success: false,
      message: 'Error registering FCM token',
      error: error.message
    });
  }
});

// Delete FCM token for student (on logout)
router.post('/delete-token', authenticateStudent, async (req, res) => {
  try {
    const { fcmToken } = req.body;
    const managedStudentId = req.student._id; // This is ManagedStudent ID from token

    if (!fcmToken) {
      return res.status(400).json({
        success: false,
        message: 'FCM token is required'
      });
    }

    // Find Student record linked to ManagedStudent
    const student = await Student.findOne({ managedStudentId: managedStudentId });
    
    if (!student) {
      // No Student record exists, nothing to delete
      return res.json({
        success: true,
        message: 'No FCM token to delete'
      });
    }

    if (student.fcmTokens) {
      student.fcmTokens = student.fcmTokens.filter(token => token !== fcmToken);
      await student.save();
      console.log(`✅ FCM token deleted for student: ${student.fullName}`);
    }

    res.json({
      success: true,
      message: 'FCM token deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting FCM token:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting FCM token',
      error: error.message
    });
  }
});

module.exports = router;
