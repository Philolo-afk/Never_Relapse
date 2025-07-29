import express from 'express';
import RecoverySession from '../models/RecoverySession.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

const MILESTONES = [1, 3, 7, 14, 21, 30, 60, 90, 180, 365];

// Get user achievements
router.get('/', authenticateToken, async (req, res) => {
  try {
    const session = await RecoverySession.findOne({ 
      userId: req.user.userId,
      isActive: true 
    });

    if (!session) {
      return res.json({
        success: true,
        data: {
          achievements: [],
          availableMilestones: MILESTONES,
          nextMilestone: MILESTONES[0],
          progress: 0
        }
      });
    }

    const streakInDays = session.getStreakInDays();
    const nextMilestone = getNextMilestone(session.achievements, streakInDays);
    const progress = nextMilestone ? (streakInDays / nextMilestone) * 100 : 100;

    res.json({
      success: true,
      data: {
        achievements: session.achievements,
        availableMilestones: MILESTONES,
        nextMilestone,
        progress: Math.min(progress, 100),
        currentDays: streakInDays
      }
    });

  } catch (error) {
    console.error('Get achievements error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get achievements'
    });
  }
});

// Check and unlock new achievements
router.post('/check', authenticateToken, async (req, res) => {
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

    const streakInDays = session.getStreakInDays();
    const newAchievements = [];

    // Check each milestone
    for (const milestone of MILESTONES) {
      if (streakInDays >= milestone) {
        // Check if achievement already exists
        const existingAchievement = session.achievements.find(a => a.milestone === milestone);
        
        if (!existingAchievement) {
          const newAchievement = {
            milestone,
            unlockedAt: new Date(),
            title: getAchievementTitle(milestone),
            description: getAchievementDescription(milestone)
          };
          
          session.achievements.push(newAchievement);
          newAchievements.push(newAchievement);
        }
      }
    }

    if (newAchievements.length > 0) {
      await session.save();
    }

    res.json({
      success: true,
      data: {
        newAchievements,
        totalAchievements: session.achievements.length,
        currentDays: streakInDays
      }
    });

  } catch (error) {
    console.error('Check achievements error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check achievements'
    });
  }
});

// Get achievement statistics
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const session = await RecoverySession.findOne({ 
      userId: req.user.userId,
      isActive: true 
    });

    if (!session) {
      return res.json({
        success: true,
        data: {
          total: 0,
          totalPossible: MILESTONES.length,
          percentage: 0,
          recent: []
        }
      });
    }

    const total = session.achievements.length;
    const percentage = (total / MILESTONES.length) * 100;
    const recent = session.achievements
      .sort((a, b) => new Date(b.unlockedAt) - new Date(a.unlockedAt))
      .slice(0, 3);

    res.json({
      success: true,
      data: {
        total,
        totalPossible: MILESTONES.length,
        percentage,
        recent
      }
    });

  } catch (error) {
    console.error('Get achievement stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get achievement statistics'
    });
  }
});

// Helper functions
function getNextMilestone(achievements, currentDays) {
  const unlockedMilestones = achievements.map(a => a.milestone);
  
  for (const milestone of MILESTONES) {
    if (!unlockedMilestones.includes(milestone) && currentDays < milestone) {
      return milestone;
    }
  }
  
  // If all standard milestones are unlocked, calculate next weekly milestone
  if (currentDays >= 365) {
    const nextWeeklyMilestone = Math.ceil((currentDays + 1) / 7) * 7;
    return nextWeeklyMilestone;
  }
  
  return null;
}

function getAchievementTitle(milestone) {
  if (milestone === 1) return "First Day";
  if (milestone < 7) return `${milestone} Days`;
  if (milestone < 30) return `${milestone / 7} Week${milestone === 7 ? '' : 's'}`;
  if (milestone < 365) return `${milestone / 30} Month${milestone === 30 ? '' : 's'}`;
  return "One Year";
}

function getAchievementDescription(milestone) {
  const descriptions = {
    1: "Your journey begins with a single step",
    3: "Three days of commitment and strength",
    7: "One full week of recovery",
    14: "Two weeks of consistent progress",
    21: "Three weeks of dedication",
    30: "One month of incredible growth",
    60: "Two months of sustained recovery",
    90: "Three months of life transformation",
    180: "Six months of remarkable progress",
    365: "One full year of recovery success"
  };
  
  return descriptions[milestone] || `${milestone} days of recovery`;
}

export default router;