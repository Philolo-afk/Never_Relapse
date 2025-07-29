import mongoose from 'mongoose';

const quoteSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },
  author: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  category: {
    type: String,
    enum: ['motivation', 'strength', 'perseverance', 'hope', 'recovery', 'general'],
    default: 'general'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  addedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  likes: {
    type: Number,
    default: 0
  },
  usageCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Index for efficient querying
quoteSchema.index({ isActive: 1, category: 1 });
quoteSchema.index({ usageCount: -1 });

export default mongoose.model('Quote', quoteSchema);