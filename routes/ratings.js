const express = require('express');
const router = express.Router();
const Rating = require('../models/Rating');
const { authenticateAdmin } = require('../middleware/authMiddleware');
const notificationService = require('../services/notificationService');

// Public route - Submit a rating
router.post('/submit', async (req, res) => {
  try {
    const { name, stars, comment } = req.body;

    // Validation
    if (!name || !stars || !comment) {
      return res.status(400).json({ 
        error: 'All fields are required',
        message: 'Please provide name, rating, and comment' 
      });
    }

    if (stars < 1 || stars > 5) {
      return res.status(400).json({ 
        error: 'Invalid rating',
        message: 'Rating must be between 1 and 5 stars' 
      });
    }

    if (comment.length < 10) {
      return res.status(400).json({ 
        error: 'Comment too short',
        message: 'Please provide a comment with at least 10 characters' 
      });
    }

    // Create new rating
    const rating = new Rating({
      name: name.trim(),
      stars: parseInt(stars),
      comment: comment.trim(),
      status: 'pending'
    });

    await rating.save();

    // Send real-time notification to admins
    notificationService.notifyNewRating(rating).catch(err => {
      console.error('Failed to send notification:', err);
    });

    res.status(201).json({ 
      success: true,
      message: 'Thank you for your feedback! Your rating is pending approval.',
      rating: {
        id: rating._id,
        name: rating.name,
        stars: rating.stars,
        comment: rating.comment,
        submittedAt: rating.submittedAt
      }
    });
  } catch (error) {
    console.error('Error submitting rating:', error);
    res.status(500).json({ 
      error: 'Failed to submit rating',
      message: error.message 
    });
  }
});

// Public route - Get approved ratings
router.get('/approved', async (req, res) => {
  try {
    const ratings = await Rating.find({ status: 'approved' })
      .select('name stars comment submittedAt')
      .sort({ submittedAt: -1 })
      .limit(50);

    res.json({ 
      success: true,
      count: ratings.length,
      ratings 
    });
  } catch (error) {
    console.error('Error fetching approved ratings:', error);
    res.status(500).json({ 
      error: 'Failed to fetch ratings',
      message: error.message 
    });
  }
});

// Admin route - Get all ratings with filters
router.get('/admin/all', authenticateAdmin, async (req, res) => {
  try {
    const { status } = req.query;
    const filter = {};
    
    if (status && ['pending', 'approved', 'rejected'].includes(status)) {
      filter.status = status;
    }

    const ratings = await Rating.find(filter)
      .populate('reviewedBy', 'username')
      .sort({ submittedAt: -1 });

    // Get statistics
    const stats = {
      total: await Rating.countDocuments(),
      pending: await Rating.countDocuments({ status: 'pending' }),
      approved: await Rating.countDocuments({ status: 'approved' }),
      rejected: await Rating.countDocuments({ status: 'rejected' }),
      averageRating: 0
    };

    // Calculate average rating for approved ratings
    const approvedRatings = await Rating.find({ status: 'approved' });
    if (approvedRatings.length > 0) {
      const sum = approvedRatings.reduce((acc, r) => acc + r.stars, 0);
      stats.averageRating = (sum / approvedRatings.length).toFixed(1);
    }

    res.json({ 
      success: true,
      stats,
      ratings 
    });
  } catch (error) {
    console.error('Error fetching ratings:', error);
    res.status(500).json({ 
      error: 'Failed to fetch ratings',
      message: error.message 
    });
  }
});

// Admin route - Get statistics
router.get('/admin/stats', authenticateAdmin, async (req, res) => {
  try {
    const stats = {
      total: await Rating.countDocuments(),
      pending: await Rating.countDocuments({ status: 'pending' }),
      approved: await Rating.countDocuments({ status: 'approved' }),
      rejected: await Rating.countDocuments({ status: 'rejected' }),
      averageRating: 0,
      ratingDistribution: {
        5: await Rating.countDocuments({ status: 'approved', stars: 5 }),
        4: await Rating.countDocuments({ status: 'approved', stars: 4 }),
        3: await Rating.countDocuments({ status: 'approved', stars: 3 }),
        2: await Rating.countDocuments({ status: 'approved', stars: 2 }),
        1: await Rating.countDocuments({ status: 'approved', stars: 1 })
      }
    };

    // Calculate average rating for approved ratings
    const approvedRatings = await Rating.find({ status: 'approved' });
    if (approvedRatings.length > 0) {
      const sum = approvedRatings.reduce((acc, r) => acc + r.stars, 0);
      stats.averageRating = (sum / approvedRatings.length).toFixed(1);
    }

    res.json({ 
      success: true,
      stats 
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ 
      error: 'Failed to fetch statistics',
      message: error.message 
    });
  }
});

// Admin route - Approve rating
router.patch('/admin/:id/approve', authenticateAdmin, async (req, res) => {
  try {
    const rating = await Rating.findById(req.params.id);
    
    if (!rating) {
      return res.status(404).json({ 
        error: 'Rating not found' 
      });
    }

    rating.status = 'approved';
    rating.reviewedAt = new Date();
    rating.reviewedBy = req.admin._id;
    
    await rating.save();

    res.json({ 
      success: true,
      message: 'Rating approved successfully',
      rating 
    });
  } catch (error) {
    console.error('Error approving rating:', error);
    res.status(500).json({ 
      error: 'Failed to approve rating',
      message: error.message 
    });
  }
});

// Admin route - Reject/Delete rating
router.delete('/admin/:id', authenticateAdmin, async (req, res) => {
  try {
    const rating = await Rating.findByIdAndDelete(req.params.id);
    
    if (!rating) {
      return res.status(404).json({ 
        error: 'Rating not found' 
      });
    }

    res.json({ 
      success: true,
      message: 'Rating deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting rating:', error);
    res.status(500).json({ 
      error: 'Failed to delete rating',
      message: error.message 
    });
  }
});

// Admin route - Update rating
router.put('/admin/:id', authenticateAdmin, async (req, res) => {
  try {
    const { name, stars, comment } = req.body;
    
    const rating = await Rating.findById(req.params.id);
    
    if (!rating) {
      return res.status(404).json({ 
        error: 'Rating not found' 
      });
    }

    if (name) rating.name = name.trim();
    if (stars) rating.stars = parseInt(stars);
    if (comment) rating.comment = comment.trim();
    
    await rating.save();

    res.json({ 
      success: true,
      message: 'Rating updated successfully',
      rating 
    });
  } catch (error) {
    console.error('Error updating rating:', error);
    res.status(500).json({ 
      error: 'Failed to update rating',
      message: error.message 
    });
  }
});

module.exports = router;
