// Timer Manager
export class TimerManager {
    constructor(storage) {
        this.storage = storage;
        this.timers = new Map();
        this.intervals = new Map();
    }

    start(username) {
        const timerData = {
            startTime: new Date().toISOString(),
            pausedTime: 0,
            isRunning: true,
            isPaused: false
        };

        this.timers.set(username, timerData);
        this.saveState(username);
        this.startInterval(username);
        
        return timerData;
    }

    pause() {
        const username = this.getCurrentUsername();
        if (!username) return;

        const timer = this.timers.get(username);
        if (timer && timer.isRunning) {
            timer.isRunning = false;
            timer.isPaused = true;
            timer.pausedAt = new Date().toISOString();
            
            this.saveState(username);
            this.stopInterval(username);
        }
    }

    resume() {
        const username = this.getCurrentUsername();
        if (!username) return;

        const timer = this.timers.get(username);
        if (timer && timer.isPaused) {
            const pauseDuration = new Date() - new Date(timer.pausedAt);
            timer.pausedTime += pauseDuration;
            timer.isRunning = true;
            timer.isPaused = false;
            delete timer.pausedAt;
            
            this.saveState(username);
            this.startInterval(username);
        }
    }

    stop() {
        const username = this.getCurrentUsername();
        if (!username) return;

        this.stopInterval(username);
        this.timers.delete(username);
    }

    reset(username) {
        const currentStats = this.getStats(username);
        
        // Update statistics before reset
        const stats = this.storage.get(`timer_stats_${username}`) || {
            totalAttempts: 0,
            longestStreak: 0,
            relapseCount: 0
        };

        // Update longest streak if current is longer
        if (currentStats.currentStreak > stats.longestStreak) {
            stats.longestStreak = currentStats.currentStreak;
        }

        stats.totalAttempts += 1;
        stats.relapseCount += 1;

        this.storage.set(`timer_stats_${username}`, stats);

        // Reset current timer
        this.stop();
        this.storage.remove(`timer_${username}`);
        
        return stats;
    }

    getElapsed() {
        const username = this.getCurrentUsername();
        if (!username) return 0;

        const timer = this.timers.get(username);
        if (!timer) return 0;

        const startTime = new Date(timer.startTime);
        const now = new Date();
        const elapsed = now - startTime - timer.pausedTime;

        // If paused, subtract current pause duration
        if (timer.isPaused && timer.pausedAt) {
            const currentPauseDuration = new Date() - new Date(timer.pausedAt);
            return elapsed - currentPauseDuration;
        }

        return Math.max(0, elapsed);
    }

    isRunning() {
        const username = this.getCurrentUsername();
        if (!username) return false;

        const timer = this.timers.get(username);
        return timer ? timer.isRunning : false;
    }

    isPaused() {
        const username = this.getCurrentUsername();
        if (!username) return false;

        const timer = this.timers.get(username);
        return timer ? timer.isPaused : false;
    }

    getStats(username) {
        const stats = this.storage.get(`timer_stats_${username}`) || {
            totalAttempts: 1,
            longestStreak: 0,
            relapseCount: 0
        };

        const currentStreak = this.getElapsedForUser(username);
        
        return {
            ...stats,
            currentStreak
        };
    }

    getElapsedForUser(username) {
        const timer = this.timers.get(username);
        if (!timer) return 0;

        const startTime = new Date(timer.startTime);
        const now = new Date();
        const elapsed = now - startTime - timer.pausedTime;

        if (timer.isPaused && timer.pausedAt) {
            const currentPauseDuration = new Date() - new Date(timer.pausedAt);
            return elapsed - currentPauseDuration;
        }

        return Math.max(0, elapsed);
    }

    loadState(username) {
        const savedTimer = this.storage.get(`timer_${username}`);
        if (savedTimer) {
            this.timers.set(username, savedTimer);
            
            if (savedTimer.isRunning && !savedTimer.isPaused) {
                this.startInterval(username);
            }
        }
    }

    saveState(username) {
        const timer = this.timers.get(username);
        if (timer) {
            this.storage.set(`timer_${username}`, timer);
        }
    }

    startInterval(username) {
        this.stopInterval(username);
        
        const interval = setInterval(() => {
            this.saveState(username);
        }, 10000); // Save every 10 seconds

        this.intervals.set(username, interval);
    }

    stopInterval(username) {
        const interval = this.intervals.get(username);
        if (interval) {
            clearInterval(interval);
            this.intervals.delete(username);
        }
    }

    getCurrentUsername() {
        // This should be set by the main app when user logs in
        const session = this.storage.get('nr_session');
        return session?.user?.username;
    }

    // Get formatted time for display
    formatElapsed() {
        const elapsed = this.getElapsed();
        const totalSeconds = Math.floor(elapsed / 1000);
        
        const days = Math.floor(totalSeconds / (24 * 60 * 60));
        const hours = Math.floor((totalSeconds % (24 * 60 * 60)) / (60 * 60));
        const minutes = Math.floor((totalSeconds % (60 * 60)) / 60);
        const seconds = totalSeconds % 60;

        return {
            days,
            hours,
            minutes,
            seconds,
            formatted: `${days}d ${hours}h ${minutes}m ${seconds}s`
        };
    }

    // Get timer state for backup/export
    exportState(username) {
        return {
            timer: this.timers.get(username),
            stats: this.getStats(username)
        };
    }

    // Restore timer state from backup/import
    importState(username, data) {
        if (data.timer) {
            this.timers.set(username, data.timer);
            this.saveState(username);
        }
        
        if (data.stats) {
            this.storage.set(`timer_stats_${username}`, data.stats);
        }
    }
}