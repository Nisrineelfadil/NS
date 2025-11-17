const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const notificationService = require('../services/notificationService');

// POST /api/contact - Submit a new contact message
router.post('/', async (req, res) => {
    try {
        const { fullName, phoneNumber, message } = req.body;

        if (!fullName || !phoneNumber || !message) {
            return res.status(400).json({ 
                success: false, 
                message: 'All fields are required.' 
            });
        }

        const newMessage = new Message({
            fullName,
            phoneNumber,
            message
        });

        await newMessage.save();

        // Send real-time notification to admin
        await notificationService.notifyNewMessage(newMessage);

        res.status(201).json({ 
            success: true, 
            message: 'Message sent successfully!'
        });

    } catch (error) {
        console.error('Contact form submission error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error. Please try again later.' 
        });
    }
});

module.exports = router;
