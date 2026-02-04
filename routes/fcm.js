// Firebase Cloud Messaging Routes
// Handle FCM token registration and deletion

const express = require('express');
const router = express.Router();
const ManagedStudent = require('../models/ManagedStudent');
const { authenticateStudent } = require('../middleware/authMiddleware');

// Register FCM token for student
router.post('/register-token', authenticateStudent, async (req, res) => {
  try {
    const { fcmToken } = req.body;
    const studentId = req.student._id;

    if (!fcmToken) {
      return res.status(400).json({
        success: false,
        message: 'FCM token is required'
      });
    }

    // Find the ManagedStudent directly
    const student = await ManagedStudent.findById(studentId);
    
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
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
      console.log(`✅ FCM token registered for: ${student.fullName}`);
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
    const studentId = req.student._id;

    if (!fcmToken) {
      return res.status(400).json({
        success: false,
        message: 'FCM token is required'
      });
    }

    const student = await ManagedStudent.findById(studentId);
    
    if (!student) {
      return res.json({
        success: true,
        message: 'Student not found'
      });
    }

    if (student.fcmTokens) {
      student.fcmTokens = student.fcmTokens.filter(token => token !== fcmToken);
      await student.save();
      console.log(`✅ FCM token deleted for: ${student.fullName}`);
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
