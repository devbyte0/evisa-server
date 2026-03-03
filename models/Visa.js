const mongoose = require('mongoose');

const visaSchema = new mongoose.Schema({
  visaNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true
  },
  passportNumber: {
    type: String,
    required: true,
    trim: true,
    uppercase: true
  },
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  dateOfBirth: {
    type: Date,
    required: true
  },
  nationality: {
    type: String,
    required: true
  },
  visaType: {
    type: String,
    enum: ['Tourist', 'Business', 'Student', 'Work', 'Transit', 'Diplomatic'],
    required: true
  },
  status: {
    type: String,
    enum: ['Valid', 'Expired', 'Cancelled', 'Pending', 'Revoked'],
    default: 'Valid'
  },
  issueDate: {
    type: Date,
    required: true
  },
  expiryDate: {
    type: Date,
    required: true
  },
  entries: {
    type: String,
    enum: ['Single', 'Double', 'Multiple'],
    default: 'Single'
  },
  purposeOfVisit: {
    type: String,
    required: true
  },
  photo: {
    publicId: String,
    url: String,
    thumbnailUrl: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update timestamp on save
visaSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Index for faster searches
visaSchema.index({ visaNumber: 1, passportNumber: 1 });

module.exports = mongoose.model('Visa', visaSchema);
