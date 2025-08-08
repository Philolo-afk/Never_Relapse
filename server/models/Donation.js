import mongoose from 'mongoose';

const donationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 1
  },
  currency: {
    type: String,
    required: true,
    enum: ['USD', 'EUR', 'GBP', 'KES'], // KES for M-Pesa
    default: 'USD'
  },
  paymentMethod: {
    type: String,
    required: true,
    enum: ['stripe', 'paypal', 'mpesa', 'bitcoin_trc20']
  },
  paymentId: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  donorName: {
    type: String,
    trim: true
  },
  donorEmail: {
    type: String,
    trim: true,
    lowercase: true
  },
  message: {
    type: String,
    maxlength: 500,
    trim: true
  },
  isAnonymous: {
    type: Boolean,
    default: false
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Index for efficient querying
donationSchema.index({ userId: 1, createdAt: -1 });
donationSchema.index({ status: 1 });
donationSchema.index({ paymentMethod: 1 });

export default mongoose.model('Donation', donationSchema);