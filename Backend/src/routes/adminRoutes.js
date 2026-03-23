const express = require('express');
const router = express.Router();
const isAdmin = require('../middleware/adminAuth');

// Apply admin middleware to all admin routes
router.use(isAdmin);

// Get admin dashboard stats
router.get('/stats', async (req, res) => {
  try {
    const User = require('../models/User');
    const Reservation = require('../models/Reservation');
    const Court = require('../models/Court');
    
    // Get total users
    const totalUsers = await User.countDocuments({ role: 'user' });
    
    // Get total reservations
    const totalReservations = await Reservation.countDocuments();
    
    // Get total revenue (sum of all confirmed reservations)
    const revenueData = await Reservation.aggregate([
      { $match: { status: 'confirmed' } },
      { $group: { _id: null, total: { $sum: '$totalPrice' } } }
    ]);
    const totalRevenue = revenueData[0]?.total || 0;
    
    // Get active courts
    const activeCourts = await Court.countDocuments({ 
      available: true, 
      maintenanceMode: false 
    });
    
    res.json({
      success: true,
      data: {
        totalUsers,
        totalReservations,
        totalRevenue,
        activeCourts
      }
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard statistics'
    });
  }
});

// Get all users
router.get('/users', async (req, res) => {
  try {
    const User = require('../models/User');
    const users = await User.find({ role: 'user' })
      .select('-passwordHash -otp -expiredin')
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching users'
    });
  }
});

// Update user status
router.patch('/users/:id/status', async (req, res) => {
  try {
    const User = require('../models/User');
    const { isverified } = req.body;
    
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isverified },
      { new: true }
    ).select('-passwordHash -otp -expiredin');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.json({
      success: true,
      data: user,
      message: 'User status updated successfully'
    });
  } catch (error) {
    console.error('Error updating user status:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating user status'
    });
  }
});

// Delete user
router.delete('/users/:id', async (req, res) => {
  try {
    const User = require('../models/User');
    const user = await User.findByIdAndDelete(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting user'
    });
  }
});

// Get all reservations
router.get('/reservations', async (req, res) => {
  try {
    const Reservation = require('../models/Reservation');
    const reservations = await Reservation.find()
      .populate('user', 'username email')
      .populate('court', 'name type location')
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      data: reservations
    });
  } catch (error) {
    console.error('Error fetching reservations:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching reservations'
    });
  }
});

// Update reservation status
router.patch('/reservations/:id/status', async (req, res) => {
  try {
    const Reservation = require('../models/Reservation');
    const { status } = req.body;
    
    const reservation = await Reservation.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).populate('userId', 'username email');
    
    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: 'Reservation not found'
      });
    }
    
    res.json({
      success: true,
      data: reservation,
      message: 'Reservation status updated successfully'
    });
  } catch (error) {
    console.error('Error updating reservation status:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating reservation status'
    });
  }
});

// Delete reservation
router.delete('/reservations/:id', async (req, res) => {
  try {
    const Reservation = require('../models/Reservation');
    const reservation = await Reservation.findByIdAndDelete(req.params.id);
    
    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: 'Reservation not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Reservation deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting reservation:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting reservation'
    });
  }
});

// ===== COURT MANAGEMENT ROUTES =====

// Get all courts
router.get('/courts', async (req, res) => {
  try {
    console.log('Fetching courts...');
    const Court = require('../models/Court');
    const courts = await Court.find({});
    
    res.json({
      success: true,
      data: courts
    });
  } catch (error) {
    console.error('Error fetching courts:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching courts'
    });
  }
});

// Create new court
router.post('/courts', async (req, res) => {
  try {
    const Court = require('../models/Court');
    const courtData = req.body;
    
    const court = new Court(courtData);
    await court.save();
    
    res.status(201).json({
      success: true,
      data: court,
      message: 'Court created successfully'
    });
  } catch (error) {
    console.error('Error creating court:', error);
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Court name already exists'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Error creating court'
    });
  }
});

// Update court
router.put('/courts/:id', async (req, res) => {
  try {
    const Court = require('../models/Court');
    const courtData = req.body;
    
    const court = await Court.findByIdAndUpdate(
      req.params.id,
      courtData,
      { new: true, runValidators: true }
    );
    
    if (!court) {
      return res.status(404).json({
        success: false,
        message: 'Court not found'
      });
    }
    
    res.json({
      success: true,
      data: court,
      message: 'Court updated successfully'
    });
  } catch (error) {
    console.error('Error updating court:', error);
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Court name already exists'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Error updating court'
    });
  }
});

// Delete court
router.delete('/courts/:id', async (req, res) => {
  try {
    const Court = require('../models/Court');
    const Reservation = require('../models/Reservation');
    
    // Check if court has existing reservations
    const reservationCount = await Reservation.countDocuments({ court: req.params.id });
    if (reservationCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete court with existing reservations'
      });
    }
    
    const court = await Court.findByIdAndDelete(req.params.id);
    
    if (!court) {
      return res.status(404).json({
        success: false,
        message: 'Court not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Court deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting court:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting court'
    });
  }
});

// Toggle court availability
router.patch('/courts/:id/availability', async (req, res) => {
  try {
    const Court = require('../models/Court');
    const { available } = req.body;
    
    const court = await Court.findByIdAndUpdate(
      req.params.id,
      { available },
      { new: true }
    );
    
    if (!court) {
      return res.status(404).json({
        success: false,
        message: 'Court not found'
      });
    }
    
    res.json({
      success: true,
      data: court,
      message: `Court ${available ? 'activated' : 'deactivated'} successfully`
    });
  } catch (error) {
    console.error('Error updating court availability:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating court availability'
    });
  }
});

module.exports = router;
