const express = require('express');
const Court = require('../models/Court');

const router = express.Router();

// Get all available courts (public route - no auth required)
router.get('/', async (req, res) => {
  try { 
    console.log('Fetching courts...');
    const courts = await Court.find({ 
      available: true, 
      maintenanceMode: false 
    }).sort({ createdAt: -1 });
    
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

// Get court by ID (public route)
router.get('/:id', async (req, res) => {
  try {
    const court = await Court.findById(req.params.id);
    
    if (!court) {
      return res.status(404).json({
        success: false,
        message: 'Court not found'
      });
    }
    
    res.json({
      success: true,
      data: court
    });
  } catch (error) {
    console.error('Error fetching court:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching court'
    });
  }
});

module.exports = router;
