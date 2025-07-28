// Authentication Manager
export class AuthManager {
    constructor(storage) {
        this.storage = storage;
        this.currentUser = null;
        this.sessionKey = 'nr_session';
        this.usersKey = 'nr_users';
        
        this.loadSession();
    }

    register(username, email, password) {
        const users = this.storage.get(this.usersKey) || {};
        
        // Check if username already exists
        if (users[username]) {
            return null;
        }

        // Create new user
        const user = {
            username,
            email,
            passwordHash: this.hashPassword(password),
            createdAt: new Date().toISOString(),
            lastLogin: new Date().toISOString()
        };

        // Save user
        users[username] = user;
        this.storage.set(this.usersKey, users);

        // Create session
        this.currentUser = { username, email };
        this.saveSession();

        return this.currentUser;
    }

    login(username, password) {
        const users = this.storage.get(this.usersKey) || {};
        const user = users[username];

        if (!user || user.passwordHash !== this.hashPassword(password)) {
            return null;
        }

        // Update last login
        user.lastLogin = new Date().toISOString();
        users[username] = user;
        this.storage.set(this.usersKey, users);

        // Create session
        this.currentUser = { username, email: user.email };
        this.saveSession();

        return this.currentUser;
    }

    logout() {
        this.currentUser = null;
        this.storage.remove(this.sessionKey);
    }

    getCurrentUser() {
        return this.currentUser;
    }

    isAuthenticated() {
        return !!this.currentUser;
    }

    // Simple password hashing (not for production use)
    hashPassword(password) {
        let hash = 0;
        for (let i = 0; i < password.length; i++) {
            const char = password.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return hash.toString();
    }

    saveSession() {
        if (this.currentUser) {
            this.storage.set(this.sessionKey, {
                user: this.currentUser,
                timestamp: new Date().toISOString()
            });
        }
    }

    loadSession() {
        const session = this.storage.get(this.sessionKey);
        if (session) {
            // Check if session is still valid (30 days)
            const sessionAge = new Date() - new Date(session.timestamp);
            const maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days

            if (sessionAge < maxAge) {
                this.currentUser = session.user;
            } else {
                this.storage.remove(this.sessionKey);
            }
        }
    }

    changePassword(username, oldPassword, newPassword) {
        const users = this.storage.get(this.usersKey) || {};
        const user = users[username];

        if (!user || user.passwordHash !== this.hashPassword(oldPassword)) {
            return false;
        }

        user.passwordHash = this.hashPassword(newPassword);
        users[username] = user;
        this.storage.set(this.usersKey, users);

        return true;
    }

    deleteAccount(username, password) {
        const users = this.storage.get(this.usersKey) || {};
        const user = users[username];

        if (!user || user.passwordHash !== this.hashPassword(password)) {
            return false;
        }

        // Remove user data
        delete users[username];
        this.storage.set(this.usersKey, users);

        // Remove user-specific data
        this.storage.remove(`timer_${username}`);
        this.storage.remove(`achievements_${username}`);
        this.storage.remove(`activities_${username}`);

        // Logout if current user
        if (this.currentUser?.username === username) {
            this.logout();
        }

        return true;
    }
}