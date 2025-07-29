import express from 'express';
import RecoverySession from '../models/RecoverySession.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get current timer state
router.get('/', authenticateToken, async (req, res) => {
  try {
    let session = await RecoverySession.findOne({ 
      userId: req.user.userId,
      isActive: true 
    });

    if (!session) {
      // Create new session if none exists
      session = new RecoverySession({
        userId: req.user.userId,
        isRunning: false
      });
      await session.save();
    }

    const currentStreak = session.getCurrentStreak();
    const streakInDays = session.getStreakInDays();

    res.json({
      success: true,
      data: {
        sessionId: session._id,
        currentStreak,
        streakInDays,
        isRunning: session.isRunning,
        isPaused: session.isPaused,
        startTime: session.startTime,
        achievements: session.achievements,
        relapseCount: session.relapseCount,
        longestStreak: session.longestStreak,
        totalAttempts: session.totalAttempts
      }
    });

  } catch (error) {
    console.error('Get timer error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get timer state'
    });
  }
});

// Start timer
router.post('/start', authenticateToken, async (req, res) => {
  try {
    let session = await RecoverySession.findOne({ 
      userId: req.user.userId,
      isActive: true 
    });

    if (!session) {
      session = new RecoverySession({
        userId: req.user.userId
      });
    }

    session.start();
    await session.save();

    const currentStreak = session.getCurrentStreak();
    const streakInDays = session.getStreakInDays();

    res.json({
      success: true,
      message: 'Timer started successfully',
      data: {
        sessionId: session._id,
        currentStreak,
        streakInDays,
        isRunning: session.isRunning,
        isPaused: session.isPaused,
        startTime: session.startTime
      }
    });

  } catch (error) {
    console.error('Start timer error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to start timer'
    });
  }
});

// Pause timer
router.post('/pause', authenticateToken, async (req, res) => {
  try {
    const session = await RecoverySession.findOne({ 
      userId: req.user.userId,
      isActive: true 
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'No active session found'
      });
    }

    session.pause();
    await session.save();

    const currentStreak = session.getCurrentStreak();
    const streakInDays = session.getStreakInDays();

    res.json({
      success: true,
      message: 'Timer paused successfully',
      data: {
        sessionId: session._id,
        currentStreak,
        streakInDays,
        isRunning: session.isRunning,
        isPaused: session.isPaused
      }
    });

  } catch (error) {
    console.error('Pause timer error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to pause timer'
    });
  }
});

// Resume timer
router.post('/resume', authenticateToken, async (req, res) => {
  try {
    const session = await RecoverySession.findOne({ 
      userId: req.user.userId,
      isActive: true 
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'No active session found'
      });
    }

    session.resume();
    await session.save();

    const currentStreak = session.getCurrentStreak();
    const streakInDays = session.getStreakInDays();

    res.json({
      success: true,
      message: 'Timer resumed successfully',
      data: {
        sessionId: session._id,
        currentStreak,
        streakInDays,
        isRunning: session.isRunning,
        isPaused: session.isPaused
      }
    });

  } catch (error) {
    console.error('Resume timer error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to resume timer'
    });
  }
});

// Reset timer (panic button)
router.post('/reset', authenticateToken, async (req, res) => {
  try {
    const session = await RecoverySession.findOne({ 
      userId: req.user.userId,
      isActive: true 
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'No active session found'
      });
    }

    session.reset();
    await session.save();

    res.json({
      success: true,
      message: 'Timer reset successfully',
      data: {
        sessionId: session._id,
        currentStreak: 0,
        streakInDays: 0,
        isRunning: session.isRunning,
        isPaused: session.isPaused,
        relapseCount: session.relapseCount,
        longestStreak: session.longestStreak,
        totalAttempts: session.totalAttempts,
        achievements: session.achievements
      }
    });

  } catch (error) {
    console.error('Reset timer error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset timer'
    });
  }
});

export default router;