const mongoose = require('mongoose');

const attachmentSchema = new mongoose.Schema({
  url: {
    type: String,
    required: true,
  },
  public_id: {
    type: String,
    required: true,
  },
  originalName: String,
  mimeType: String,
  size: Number,
}, { _id: false });

const documentItemSchema = new mongoose.Schema({
  label: {
    type: String,
    required: [true, 'Document label is required'],
    trim: true,
    minlength: 2,
    maxlength: 120,
  },
  description: {
    type: String,
    trim: true,
    maxlength: 2000,
  },
  attachments: {
    type: [attachmentSchema],
    default: [],
  },
}, { _id: false });

const orsReportSchema = new mongoose.Schema({
  vehicle: {
    type: String,
    required: [true, 'Vehicle identifier is required'],
    trim: true,
    minlength: 2,
    maxlength: 100,
  },
  roadWorthinessScore: {
    type: String,
    required: [true, 'Road worthiness score is required'],
    trim: true,
  },
  overallTrafficScore: {
    type: String,
    required: [true, 'Overall traffic score is required'],
    trim: true,
  },
  actionRequired: {
    type: String,
    required: [true, 'Action required field is required'],
    trim: true,
    maxlength: 1500,
  },
  documents: {
    type: [documentItemSchema],
    default: [],
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    // required: true    ← uncomment if you add authentication
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

const ORSPlan = mongoose.model('OrsReport', orsReportSchema);
module.exports = ORSPlan;