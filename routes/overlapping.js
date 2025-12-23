const express = require('express');
const router = express.Router();
const UnpaidService = require('../models/UnpaidService');
const CashTransaction = require('../models/CashTransaction');
const { authenticateAdmin } = require('../middleware/authMiddleware');

// Middleware to check if user is authenticated
router.use(authenticateAdmin);

// Predefined service types
const SERVICE_TYPES = [
  'Paper Translation',
  'CV Creation',
  'Document Legalization',
  'Certificate Request',
  'Letter Writing',
  'Form Filling',
  'Other'
];

// ==================== GET ROUTES ====================

// Get all unpaid services with filters
router.get('/', async (req, res) => {
  try {
    const { status, search, sortBy, sortOrder } = req.query;
    
    let query = {};
    
    // Filter by status (default to unpaid)
    if (status && status !== 'all') {
      query.status = status;
    }
    
    // Search by client name or phone
    if (search) {
      query.$or = [
        { clientName: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { serviceType: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Build sort object
    let sort = { dateRequested: -1 }; // Default: newest first
    if (sortBy) {
      sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };
    }
    
    const services = await UnpaidService.find(query).sort(sort);
    
    // Add age information to unpaid services
    const servicesWithAge = services.map(service => {
      const now = new Date();
      const requested = new Date(service.dateRequested);
      const diffTime = Math.abs(now - requested);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      let ageCategory = 'recent';
      if (diffDays > 30) {
        ageCategory = 'very_old';
      } else if (diffDays > 14) {
        ageCategory = 'old';
      } else if (diffDays > 7) {
        ageCategory = 'moderate';
      }
      
      return {
        ...service.toObject(),
        ageDays: diffDays,
        ageCategory
      };
    });
    
    res.json({
      success: true,
      services: servicesWithAge
    });
  } catch (error) {
    console.error('Error fetching unpaid services:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch unpaid services',
      error: error.message
    });
  }
});

// Get statistics
router.get('/stats', async (req, res) => {
  try {
    const stats = await UnpaidService.getStats();
    
    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics',
      error: error.message
    });
  }
});

// Get service types
router.get('/service-types', async (req, res) => {
  try {
    // Get custom service types from database
    const customTypes = await UnpaidService.distinct('serviceType');
    
    // Merge with predefined types
    const allTypes = [...new Set([...SERVICE_TYPES, ...customTypes])].sort();
    
    res.json({
      success: true,
      serviceTypes: allTypes
    });
  } catch (error) {
    console.error('Error fetching service types:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch service types',
      error: error.message
    });
  }
});

// Get single unpaid service
router.get('/:id', async (req, res) => {
  try {
    const service = await UnpaidService.findById(req.params.id);
    
    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }
    
    res.json({
      success: true,
      service
    });
  } catch (error) {
    console.error('Error fetching service:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch service',
      error: error.message
    });
  }
});

// ==================== CREATE/UPDATE ROUTES ====================

// Create new unpaid service
router.post('/', async (req, res) => {
  try {
    const { clientName, phone, serviceType, amount, description, dateRequested } = req.body;
    
    // Validate required fields
    if (!clientName || !phone || !serviceType || !amount) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: clientName, phone, serviceType, amount'
      });
    }
    
    const service = new UnpaidService({
      clientName: clientName.trim(),
      phone: phone.trim(),
      serviceType: serviceType.trim(),
      amount: parseFloat(amount),
      description: description?.trim() || '',
      dateRequested: dateRequested ? new Date(dateRequested) : new Date(),
      status: 'unpaid',
      addedBy: req.admin.id,
      addedByName: req.admin.username
    });
    
    await service.save();
    
    res.status(201).json({
      success: true,
      message: 'Unpaid service added successfully',
      service
    });
  } catch (error) {
    console.error('Error creating unpaid service:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create unpaid service',
      error: error.message
    });
  }
});

// Update unpaid service
router.put('/:id', async (req, res) => {
  try {
    const { clientName, phone, serviceType, amount, description, dateRequested } = req.body;
    
    const service = await UnpaidService.findById(req.params.id);
    
    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }
    
    // Only allow editing unpaid services
    if (service.status !== 'unpaid') {
      return res.status(400).json({
        success: false,
        message: 'Cannot edit a service that has been paid or cancelled'
      });
    }
    
    // Update fields
    if (clientName) service.clientName = clientName.trim();
    if (phone) service.phone = phone.trim();
    if (serviceType) service.serviceType = serviceType.trim();
    if (amount) service.amount = parseFloat(amount);
    if (description !== undefined) service.description = description.trim();
    if (dateRequested) service.dateRequested = new Date(dateRequested);
    
    await service.save();
    
    res.json({
      success: true,
      message: 'Service updated successfully',
      service
    });
  } catch (error) {
    console.error('Error updating service:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update service',
      error: error.message
    });
  }
});

// ==================== STATUS CHANGE ROUTES ====================

// Mark as paid (creates income transaction)
router.patch('/:id/mark-paid', async (req, res) => {
  try {
    const service = await UnpaidService.findById(req.params.id);
    
    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }
    
    if (service.status !== 'unpaid') {
      return res.status(400).json({
        success: false,
        message: 'Service is already ' + service.status
      });
    }
    
    // Update service status
    service.status = 'paid';
    service.datePaid = new Date();
    service.paidBy = req.admin.id;
    service.paidByName = req.admin.username;
    await service.save();
    
    // Create income transaction
    const now = new Date();
    const transaction = new CashTransaction({
      title: `${service.serviceType} - ${service.clientName}`,
      amount: service.amount,
      type: 'income',
      category: 'Other Income',
      remarks: `Overlapping payment: ${service.description || service.serviceType}. Phone: ${service.phone}`,
      date: now,
      month: now.getMonth() + 1,
      year: now.getFullYear(),
      status: 'completed',
      addedBy: req.admin.id,
      addedByName: req.admin.username
    });
    
    await transaction.save();
    
    res.json({
      success: true,
      message: 'Service marked as paid and income transaction created',
      service,
      transaction
    });
  } catch (error) {
    console.error('Error marking service as paid:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark service as paid',
      error: error.message
    });
  }
});

// Mark as cancelled
router.patch('/:id/cancel', async (req, res) => {
  try {
    const service = await UnpaidService.findById(req.params.id);
    
    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }
    
    if (service.status !== 'unpaid') {
      return res.status(400).json({
        success: false,
        message: 'Service is already ' + service.status
      });
    }
    
    service.status = 'cancelled';
    await service.save();
    
    res.json({
      success: true,
      message: 'Service cancelled successfully',
      service
    });
  } catch (error) {
    console.error('Error cancelling service:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel service',
      error: error.message
    });
  }
});

// ==================== DELETE ROUTE ====================

// Delete unpaid service
router.delete('/:id', async (req, res) => {
  try {
    const service = await UnpaidService.findByIdAndDelete(req.params.id);
    
    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Service deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting service:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete service',
      error: error.message
    });
  }
});

module.exports = router;
