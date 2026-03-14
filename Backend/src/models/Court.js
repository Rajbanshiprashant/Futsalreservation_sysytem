const mongoose = require('mongoose');

const courtSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true, 
    trim: true,
    unique: true
  },
  type: { 
    type: String, 
    required: true, 
    enum: ['indoor', 'outdoor'],
    default: 'indoor'
  },
  location: { 
    type: String, 
    required: true, 
    trim: true 
  },
  capacity: { 
    type: Number, 
    required: true,
    min: 1,
    max: 20
  },
  hourlyRate: { 
    type: Number, 
    required: true,
    min: 0
  },
  available: { 
    type: Boolean, 
    default: true 
  },
  features: [{ 
    type: String, 
    trim: true 
  }],
  description: { 
    type: String, 
    trim: true,
    maxlength: 500
  },
  imageUrl: { 
    type: String, 
    trim: true 
  },
  currentOccupancy: { 
    type: Number, 
    default: 0,
    min: 0
  },
  maintenanceMode: { 
    type: Boolean, 
    default: false 
  }
}, { 
  timestamps: true 
});

// Virtual for checking if court is at full capacity
courtSchema.virtual('isFull').get(function() {
  return this.currentOccupancy >= this.capacity;
});

// Virtual for availability status
courtSchema.virtual('availabilityStatus').get(function() {
  if (this.maintenanceMode) return 'maintenance';
  if (!this.available) return 'unavailable';
  if (this.isFull) return 'full';
  return 'available';
});

// Ensure virtuals are included in JSON output
courtSchema.set('toJSON', { virtuals: true });
courtSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Court', courtSchema);
