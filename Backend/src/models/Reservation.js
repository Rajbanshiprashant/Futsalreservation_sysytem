const mongoose = require('mongoose');

const reservationSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  date: { type: Date, required: true },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  contact: { type: String, required: true },
  totalPrice: { type: Number, required: true, min: 0 },
  status: { 
    type: String, 
    required: true, 
    enum: ['pending', 'confirmed', 'cancelled', 'completed'],
    default: 'pending'
  },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  court: { type: mongoose.Schema.Types.ObjectId, ref: 'Court', required: true },
  notes: { type: String, trim: true, maxlength: 500 },
  pidx: { type: String, trim: true },           // Khalti payment ID
  transactionId: { type: String, trim: true },   // Khalti transaction ID after verify
}, { timestamps: true });

// Virtual for duration in hours
reservationSchema.virtual('durationHours').get(function() {
  const start = new Date(`1970-01-01T${this.startTime}:00`);
  const end = new Date(`1970-01-01T${this.endTime}:00`);
  return (end - start) / (1000 * 60 * 60);
});

// Ensure virtuals are included in JSON output
reservationSchema.set('toJSON', { virtuals: true });
reservationSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Reservation', reservationSchema);
