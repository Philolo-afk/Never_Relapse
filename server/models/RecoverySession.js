import mongoose from 'mongoose';

const achievementSchema = new mongoose.Schema({
  milestone: {
    type: Number,
    required: true
  },
  unlockedAt: {
    type: Date,
    default: Date.now
  },
  title: String,
  description: String
}, { _id: false });

const recoverySessionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  startTime: {
    type: Date,
    required: true,
    default: Date.now
  },
  pausedTime: {
    type: Number,
    default: 0
  },
  isRunning: {
    type: Boolean,
    default: true
  },
  isPaused: {
    type: Boolean,
    default: false
  },
  pausedAt: {
    type: Date,
    default: null
  },
  achievements: [achievementSchema],
  relapseCount: {
    type: Number,
    default: 0
  },
  longestStreak: {
    type: Number,
    default: 0
  },
  totalAttempts: {
    type: Number,
    default: 1
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Calculate current streak
recoverySessionSchema.methods.getCurrentStreak = function() {
  if (!this.isRunning && !this.isPaused) return 0;
  
  const now = new Date();
  const elapsed = now - this.startTime - this.pausedTime;
  
  if (this.isPaused && this.pausedAt) {
    const currentPauseDuration = now - this.pausedAt;
    return Math.max(0, elapsed - currentPauseDuration);
  }
  
  return Math.max(0, elapsed);
};

// Get streak in days
recoverySessionSchema.methods.getStreakInDays = function() {
  const streakMs = this.getCurrentStreak();
  return Math.floor(streakMs / (1000 * 60 * 60 * 24));
};

// Reset session
recoverySessionSchema.methods.reset = function() {
  // Update statistics before reset
  const currentStreak = this.getCurrentStreak();
  if (currentStreak > this.longestStreak) {
    this.longestStreak = currentStreak;
  }
  
  this.relapseCount += 1;
  this.totalAttempts += 1;
  
  // Reset current session
  this.startTime = new Date();
  this.pausedTime = 0;
  this.isRunning = false;
  this.isPaused = false;
  this.pausedAt = null;
  this.achievements = [];
  
  return this;
};

// Pause session
recoverySessionSchema.methods.pause = function() {
  if (this.isRunning) {
    this.isRunning = false;
    this.isPaused = true;
    this.pausedAt = new Date();
  }
  return this;
};

// Resume session
recoverySessionSchema.methods.resume = function() {
  if (this.isPaused) {
    const pauseDuration = new Date() - this.pausedAt;
    this.pausedTime += pauseDuration;
    this.isRunning = true;
    this.isPaused = false;
    this.pausedAt = null;
  }
  return this;
};

// Start new session
recoverySessionSchema.methods.start = function() {
  this.startTime = new Date();
  this.pausedTime = 0;
  this.isRunning = true;
  this.isPaused = false;
  this.pausedAt = null;
  return this;
};

export default mongoose.model('RecoverySession', recoverySessionSchema);