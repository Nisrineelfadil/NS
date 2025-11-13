const express = require('express');
const router = express.Router();
const Appointment = require('../models/Appointment');
const { authenticateAdmin } = require('../middleware/authMiddleware');
const { generateDailyAppointmentsPDF } = require('../services/appointmentPdfGenerator');

// Apply authentication middleware to all routes
router.use(authenticateAdmin);

/**
 * GET /api/appointments
 * Get all appointments with optional filters
 * Query params: date, status, priority, search
 */
router.get('/', async (req, res) => {
    try {
        const { date, status, priority, search } = req.query;
        let query = {};

        // Filter by date (specific day)
        if (date) {
            const startDate = new Date(date);
            startDate.setHours(0, 0, 0, 0);
            const endDate = new Date(date);
            endDate.setHours(23, 59, 59, 999);
            
            query.appointmentDate = {
                $gte: startDate,
                $lte: endDate
            };
        }

        // Filter by status
        if (status && ['pending', 'completed', 'cancelled'].includes(status)) {
            query.status = status;
        }

        // Filter by priority
        if (priority && ['low', 'medium', 'high'].includes(priority)) {
            query.priority = priority;
        }

        // Search by name or phone
        if (search) {
            query.$or = [
                { fullName: { $regex: search, $options: 'i' } },
                { phoneNumber: { $regex: search, $options: 'i' } },
                { purpose: { $regex: search, $options: 'i' } }
            ];
        }

        const appointments = await Appointment.find(query)
            .sort({ appointmentDate: 1, createdAt: -1 })
            .lean();

        res.json({
            success: true,
            count: appointments.length,
            appointments
        });

    } catch (error) {
        console.error('Error fetching appointments:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch appointments',
            error: error.message
        });
    }
});

/**
 * GET /api/appointments/stats
 * Get appointment statistics
 */
router.get('/stats', async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const [totalCount, todayCount, pendingCount, completedCount] = await Promise.all([
            Appointment.countDocuments(),
            Appointment.countDocuments({
                appointmentDate: { $gte: today, $lt: tomorrow }
            }),
            Appointment.countDocuments({ status: 'pending' }),
            Appointment.countDocuments({ status: 'completed' })
        ]);

        res.json({
            success: true,
            stats: {
                total: totalCount,
                today: todayCount,
                pending: pendingCount,
                completed: completedCount
            }
        });

    } catch (error) {
        console.error('Error fetching appointment stats:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch statistics',
            error: error.message
        });
    }
});

/**
 * GET /api/appointments/pdf/daily
 * Generate and download daily appointments PDF
 * Query params: date (required)
 */
router.get('/pdf/daily', async (req, res) => {
    try {
        const { date } = req.query;

        if (!date) {
            return res.status(400).json({
                success: false,
                message: 'Date parameter is required'
            });
        }

        // Get appointments for the specified date
        const startDate = new Date(date);
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(date);
        endDate.setHours(23, 59, 59, 999);

        const appointments = await Appointment.find({
            appointmentDate: {
                $gte: startDate,
                $lte: endDate
            }
        })
        .sort({ priority: -1, createdAt: 1 }) // High priority first
        .lean();

        // Generate PDF
        const pdfBuffer = await generateDailyAppointmentsPDF(appointments, startDate);

        // Set response headers
        const filename = `Appointments_${startDate.toISOString().split('T')[0]}.pdf`;
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Length', pdfBuffer.length);

        // Send PDF
        res.send(pdfBuffer);

    } catch (error) {
        console.error('Error generating appointments PDF:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate PDF',
            error: error.message
        });
    }
});

/**
 * GET /api/appointments/:id
 * Get a specific appointment by ID
 */
router.get('/:id', async (req, res) => {
    try {
        const appointment = await Appointment.findById(req.params.id).lean();

        if (!appointment) {
            return res.status(404).json({
                success: false,
                message: 'Appointment not found'
            });
        }

        res.json({
            success: true,
            appointment
        });

    } catch (error) {
        console.error('Error fetching appointment:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch appointment',
            error: error.message
        });
    }
});

/**
 * POST /api/appointments
 * Create a new appointment
 */
router.post('/', async (req, res) => {
    try {
        const { fullName, phoneNumber, purpose, appointmentDate, priority, notes } = req.body;

        // Validation
        if (!fullName || !phoneNumber || !purpose || !appointmentDate) {
            return res.status(400).json({
                success: false,
                message: 'Full name, phone number, purpose, and appointment date are required'
            });
        }

        // Create appointment
        const appointment = new Appointment({
            fullName: fullName.trim(),
            phoneNumber: phoneNumber.trim(),
            purpose: purpose.trim(),
            appointmentDate: new Date(appointmentDate),
            priority: priority || 'medium',
            notes: notes ? notes.trim() : '',
            createdBy: req.admin.id,
            createdByName: req.admin.username,
            status: 'pending'
        });

        await appointment.save();

        res.status(201).json({
            success: true,
            message: 'Appointment created successfully',
            appointment
        });

    } catch (error) {
        console.error('Error creating appointment:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create appointment',
            error: error.message
        });
    }
});

/**
 * PUT /api/appointments/:id
 * Update an existing appointment
 */
router.put('/:id', async (req, res) => {
    try {
        const { fullName, phoneNumber, purpose, appointmentDate, priority, notes, status } = req.body;

        const appointment = await Appointment.findById(req.params.id);

        if (!appointment) {
            return res.status(404).json({
                success: false,
                message: 'Appointment not found'
            });
        }

        // Update fields
        if (fullName) appointment.fullName = fullName.trim();
        if (phoneNumber) appointment.phoneNumber = phoneNumber.trim();
        if (purpose) appointment.purpose = purpose.trim();
        if (appointmentDate) appointment.appointmentDate = new Date(appointmentDate);
        if (priority) appointment.priority = priority;
        if (notes !== undefined) appointment.notes = notes.trim();
        if (status) appointment.status = status;

        await appointment.save();

        res.json({
            success: true,
            message: 'Appointment updated successfully',
            appointment
        });

    } catch (error) {
        console.error('Error updating appointment:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update appointment',
            error: error.message
        });
    }
});

/**
 * PATCH /api/appointments/:id/status
 * Update appointment status (mark as completed/cancelled)
 */
router.patch('/:id/status', async (req, res) => {
    try {
        const { status } = req.body;

        if (!status || !['pending', 'completed', 'cancelled'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Valid status is required (pending, completed, or cancelled)'
            });
        }

        const appointment = await Appointment.findById(req.params.id);

        if (!appointment) {
            return res.status(404).json({
                success: false,
                message: 'Appointment not found'
            });
        }

        appointment.status = status;

        if (status === 'completed') {
            appointment.completedAt = new Date();
            appointment.completedBy = req.admin.id;
            appointment.completedByName = req.admin.username;
        }

        await appointment.save();

        res.json({
            success: true,
            message: `Appointment marked as ${status}`,
            appointment
        });

    } catch (error) {
        console.error('Error updating appointment status:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update appointment status',
            error: error.message
        });
    }
});

/**
 * DELETE /api/appointments/:id
 * Delete an appointment
 */
router.delete('/:id', async (req, res) => {
    try {
        const appointment = await Appointment.findByIdAndDelete(req.params.id);

        if (!appointment) {
            return res.status(404).json({
                success: false,
                message: 'Appointment not found'
            });
        }

        res.json({
            success: true,
            message: 'Appointment deleted successfully'
        });

    } catch (error) {
        console.error('Error deleting appointment:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete appointment',
            error: error.message
        });
    }
});

module.exports = router;
