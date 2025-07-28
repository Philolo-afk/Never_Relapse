// Achievement Manager
export class AchievementManager {
    constructor(storage) {
        this.storage = storage;
        this.milestones = [1, 3, 7, 14, 21, 30, 60, 90, 180, 365];
    }

    unlockAchievement(username, milestone) {
        const achievements = this.getUserAchievements(username);
        
        // Check if already unlocked
        const existingAchievement = achievements.find(a => a.milestone === milestone);
        if (existingAchievement) {
            return false; // Already unlocked
        }

        // Add new achievement
        const newAchievement = {
            milestone,
            unlockedAt: new Date().toISOString(),
            title: this.getAchievementTitle(milestone),
            description: this.getAchievementDescription(milestone)
        };

        achievements.push(newAchievement);
        this.saveUserAchievements(username, achievements);
        
        return true; // Newly unlocked
    }

    getUserAchievements(username) {
        return this.storage.get(`achievements_${username}`) || [];
    }

    saveUserAchievements(username, achievements) {
        this.storage.set(`achievements_${username}`, achievements);
    }

    getUnlockedCount(username) {
        const achievements = this.getUserAchievements(username);
        return achievements.length;
    }

    isUnlocked(username, milestone) {
        const achievements = this.getUserAchievements(username);
        return achievements.some(a => a.milestone === milestone);
    }

    getAchievementTitle(milestone) {
        if (milestone === 1) return "First Day";
        if (milestone < 7) return `${milestone} Days`;
        if (milestone < 30) return `${milestone / 7} Week${milestone === 7 ? '' : 's'}`;
        if (milestone < 365) return `${milestone / 30} Month${milestone === 30 ? '' : 's'}`;
        return "One Year";
    }

    getAchievementDescription(milestone) {
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

    getNextMilestone(username, currentDays) {
        const achievements = this.getUserAchievements(username);
        const unlockedMilestones = achievements.map(a => a.milestone);
        
        // Find next unlocked milestone
        for (const milestone of this.milestones) {
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

    getProgressToNext(username, currentDays) {
        const nextMilestone = this.getNextMilestone(username, currentDays);
        if (!nextMilestone) return { progress: 100, remaining: 0 };

        const progress = (currentDays / nextMilestone) * 100;
        const remaining = nextMilestone - currentDays;

        return {
            milestone: nextMilestone,
            progress: Math.min(progress, 100),
            remaining: Math.max(remaining, 0)
        };
    }

    reset(username) {
        this.storage.remove(`achievements_${username}`);
    }

    // Get achievement statistics
    getStats(username) {
        const achievements = this.getUserAchievements(username);
        
        const stats = {
            total: achievements.length,
            totalPossible: this.milestones.length,
            percentage: (achievements.length / this.milestones.length) * 100,
            recent: achievements
                .sort((a, b) => new Date(b.unlockedAt) - new Date(a.unlockedAt))
                .slice(0, 3)
        };

        return stats;
    }

    // Export achievements for backup
    exportAchievements(username) {
        return {
            achievements: this.getUserAchievements(username),
            exportedAt: new Date().toISOString()
        };
    }

    // Import achievements from backup
    importAchievements(username, data) {
        if (data.achievements && Array.isArray(data.achievements)) {
            this.saveUserAchievements(username, data.achievements);
            return true;
        }
        return false;
    }

    // Get achievement by milestone
    getAchievement(username, milestone) {
        const achievements = this.getUserAchievements(username);
        return achievements.find(a => a.milestone === milestone);
    }

    // Get all available milestones
    getAllMilestones() {
        return [...this.milestones];
    }

    // Check if user should unlock any achievements based on current progress
    checkPendingAchievements(username, currentDays) {
        const pendingAchievements = [];
        
        for (const milestone of this.milestones) {
            if (currentDays >= milestone && !this.isUnlocked(username, milestone)) {
                pendingAchievements.push(milestone);
            }
        }

        return pendingAchievements;
    }

    // Batch unlock achievements
    unlockMultiple(username, milestones) {
        const results = [];
        
        for (const milestone of milestones) {
            const wasUnlocked = this.unlockAchievement(username, milestone);
            results.push({ milestone, wasUnlocked });
        }

        return results;
    }
}