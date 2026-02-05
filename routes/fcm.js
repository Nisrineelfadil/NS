// Firebase Cloud Messaging Routes
// Handle FCM token registration and deletion

const express = require('express');
const router = express.Router();
const ManagedStudent = require('../models/ManagedStudent');
const { authenticateStudent } = require('../middleware/authMiddleware');

// Register FCM token for student
router.post('/register-token', authenticateStudent, async (req, res) => {
  try {
    const { fcmToken, deviceInfo } = req.body;
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
      // Limit to max 5 tokens per student (to handle multiple devices)
      if (student.fcmTokens.length >= 5) {
        // Remove oldest token
        student.fcmTokens.shift();
      }
      student.fcmTokens.push(fcmToken);
      await student.save();
      console.log(`✅ FCM token registered for: ${student.fullName} (${student.fcmTokens.length} devices)`);
      
      // Log device info if provided
      if (deviceInfo) {
        try {
          const info = JSON.parse(deviceInfo);
          console.log(`   📱 Device: ${info.isIOS ? 'iOS' : 'Android/Other'}, PWA: ${info.isPWA ? 'Yes' : 'No'}`);
        } catch (e) {
          // Ignore parse errors
        }
      }
    } else {
      console.log(`ℹ️ FCM token already registered for: ${student.fullName}`);
    }

    res.json({
      success: true,
      message: 'FCM token registered successfully',
      deviceCount: student.fcmTokens.length
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

// Remove invalid FCM token (called when push fails)
router.post('/remove-invalid-token', async (req, res) => {
  try {
    const { fcmToken } = req.body;

    if (!fcmToken) {
      return res.status(400).json({
        success: false,
        message: 'FCM token is required'
      });
    }

    // Find all students with this token and remove it
    const result = await ManagedStudent.updateMany(
      { fcmTokens: fcmToken },
      { $pull: { fcmTokens: fcmToken } }
    );

    console.log(`🗑️ Removed invalid FCM token from ${result.modifiedCount} student(s)`);

    res.json({
      success: true,
      message: 'Invalid token removed',
      studentsAffected: result.modifiedCount
    });
  } catch (error) {
    console.error('Error removing invalid FCM token:', error);
    res.status(500).json({
      success: false,
      message: 'Error removing token',
      error: error.message
    });
  }
});

module.exports = router;
