// Storage Manager
export class StorageManager {
    constructor() {
        this.prefix = 'never_relapse_';
        this.isLocalStorageAvailable = this.testLocalStorage();
        
        if (!this.isLocalStorageAvailable) {
            console.warn('localStorage is not available, using fallback memory storage');
            this.memoryStorage = new Map();
        }
    }

    testLocalStorage() {
        try {
            const test = '__storage_test__';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch (e) {
            return false;
        }
    }

    set(key, value) {
        const fullKey = this.prefix + key;
        
        try {
            const serializedValue = JSON.stringify(value);
            
            if (this.isLocalStorageAvailable) {
                localStorage.setItem(fullKey, serializedValue);
            } else {
                this.memoryStorage.set(fullKey, serializedValue);
            }
            
            return true;
        } catch (error) {
            console.error('Storage set error:', error);
            return false;
        }
    }

    get(key, defaultValue = null) {
        const fullKey = this.prefix + key;
        
        try {
            let value;
            
            if (this.isLocalStorageAvailable) {
                value = localStorage.getItem(fullKey);
            } else {
                value = this.memoryStorage.get(fullKey);
            }
            
            if (value === null || value === undefined) {
                return defaultValue;
            }
            
            return JSON.parse(value);
        } catch (error) {
            console.error('Storage get error:', error);
            return defaultValue;
        }
    }

    remove(key) {
        const fullKey = this.prefix + key;
        
        try {
            if (this.isLocalStorageAvailable) {
                localStorage.removeItem(fullKey);
            } else {
                this.memoryStorage.delete(fullKey);
            }
            
            return true;
        } catch (error) {
            console.error('Storage remove error:', error);
            return false;
        }
    }

    clear() {
        try {
            if (this.isLocalStorageAvailable) {
                // Remove only keys with our prefix
                const keysToRemove = [];
                for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    if (key && key.startsWith(this.prefix)) {
                        keysToRemove.push(key);
                    }
                }
                keysToRemove.forEach(key => localStorage.removeItem(key));
            } else {
                // Clear only keys with our prefix
                const keysToRemove = [];
                for (const key of this.memoryStorage.keys()) {
                    if (key.startsWith(this.prefix)) {
                        keysToRemove.push(key);
                    }
                }
                keysToRemove.forEach(key => this.memoryStorage.delete(key));
            }
            
            return true;
        } catch (error) {
            console.error('Storage clear error:', error);
            return false;
        }
    }

    exists(key) {
        const fullKey = this.prefix + key;
        
        if (this.isLocalStorageAvailable) {
            return localStorage.getItem(fullKey) !== null;
        } else {
            return this.memoryStorage.has(fullKey);
        }
    }

    keys() {
        try {
            const keys = [];
            
            if (this.isLocalStorageAvailable) {
                for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    if (key && key.startsWith(this.prefix)) {
                        keys.push(key.substring(this.prefix.length));
                    }
                }
            } else {
                for (const key of this.memoryStorage.keys()) {
                    if (key.startsWith(this.prefix)) {
                        keys.push(key.substring(this.prefix.length));
                    }
                }
            }
            
            return keys;
        } catch (error) {
            console.error('Storage keys error:', error);
            return [];
        }
    }

    size() {
        return this.keys().length;
    }

    // Utility methods for backup and restore
    exportData() {
        const data = {};
        const keys = this.keys();
        
        keys.forEach(key => {
            data[key] = this.get(key);
        });
        
        return {
            data,
            exportedAt: new Date().toISOString(),
            version: '1.0'
        };
    }

    importData(exportedData) {
        try {
            if (!exportedData.data || typeof exportedData.data !== 'object') {
                throw new Error('Invalid data format');
            }
            
            let importedCount = 0;
            
            Object.entries(exportedData.data).forEach(([key, value]) => {
                if (this.set(key, value)) {
                    importedCount++;
                }
            });
            
            return {
                success: true,
                importedCount,
                totalCount: Object.keys(exportedData.data).length
            };
        } catch (error) {
            console.error('Import error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Storage usage information
    getStorageInfo() {
        const info = {
            available: this.isLocalStorageAvailable,
            type: this.isLocalStorageAvailable ? 'localStorage' : 'memory',
            keysCount: this.size(),
            keys: this.keys()
        };

        if (this.isLocalStorageAvailable) {
            try {
                // Estimate storage usage
                let totalSize = 0;
                this.keys().forEach(key => {
                    const fullKey = this.prefix + key;
                    const value = localStorage.getItem(fullKey);
                    if (value) {
                        totalSize += key.length + value.length;
                    }
                });
                
                info.estimatedSize = totalSize;
                info.estimatedSizeKB = Math.round(totalSize / 1024);
            } catch (error) {
                console.error('Error calculating storage size:', error);
            }
        }

        return info;
    }

    // Cleanup old data
    cleanup(maxAge = 90) {
        const maxAgeMs = maxAge * 24 * 60 * 60 * 1000; // Convert days to milliseconds
        const now = new Date().getTime();
        let cleanedCount = 0;

        this.keys().forEach(key => {
            const data = this.get(key);
            
            // Check if data has a timestamp field
            let timestamp = null;
            if (data && typeof data === 'object') {
                timestamp = data.createdAt || data.lastLogin || data.timestamp;
            }

            if (timestamp) {
                const dataAge = now - new Date(timestamp).getTime();
                if (dataAge > maxAgeMs) {
                    this.remove(key);
                    cleanedCount++;
                }
            }
        });

        return cleanedCount;
    }

    // Batch operations
    setMultiple(keyValuePairs) {
        let successCount = 0;
        
        Object.entries(keyValuePairs).forEach(([key, value]) => {
            if (this.set(key, value)) {
                successCount++;
            }
        });

        return {
            total: Object.keys(keyValuePairs).length,
            successful: successCount,
            failed: Object.keys(keyValuePairs).length - successCount
        };
    }

    getMultiple(keys) {
        const results = {};
        
        keys.forEach(key => {
            results[key] = this.get(key);
        });

        return results;
    }

    removeMultiple(keys) {
        let successCount = 0;
        
        keys.forEach(key => {
            if (this.remove(key)) {
                successCount++;
            }
        });

        return {
            total: keys.length,
            successful: successCount,
            failed: keys.length - successCount
        };
    }
}