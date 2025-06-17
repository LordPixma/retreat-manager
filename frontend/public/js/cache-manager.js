window.CacheManager = {
    /**
     * Clear all browser caches and storage
     */
    async clearAllCaches() {
        console.log('🧹 Starting comprehensive cache clearing...');
        
        try {
            // 1. Clear all localStorage
            this.clearLocalStorage();
            
            // 2. Clear all sessionStorage
            this.clearSessionStorage();
            
            // 3. Clear all cookies (that we can access)
            this.clearCookies();
            
            // 4. Clear browser caches (Service Workers, Cache API)
            await this.clearBrowserCaches();
            
            // 5. Clear IndexedDB
            await this.clearIndexedDB();
            
            // 6. Clear any component-specific caches
            this.clearComponentCaches();
            
            console.log('✅ Cache clearing completed successfully');
            return true;
            
        } catch (error) {
            console.error('❌ Error during cache clearing:', error);
            return false;
        }
    },

    /**
     * Clear localStorage
     */
    clearLocalStorage() {
        try {
            const itemCount = localStorage.length;
            localStorage.clear();
            console.log(`🗑️ Cleared ${itemCount} localStorage items`);
        } catch (error) {
            console.warn('Failed to clear localStorage:', error);
        }
    },

    /**
     * Clear sessionStorage
     */
    clearSessionStorage() {
        try {
            const itemCount = sessionStorage.length;
            sessionStorage.clear();
            console.log(`🗑️ Cleared ${itemCount} sessionStorage items`);
        } catch (error) {
            console.warn('Failed to clear sessionStorage:', error);
        }
    },

    /**
     * Clear accessible cookies
     */
    clearCookies() {
        try {
            const cookies = document.cookie.split(";");
            let clearedCount = 0;
            
            for (let cookie of cookies) {
                const eqPos = cookie.indexOf("=");
                const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
                
                if (name) {
                    // Clear for current domain and path
                    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
                    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${window.location.hostname}`;
                    
                    // Try with dot prefix for subdomain cookies
                    if (window.location.hostname.includes('.')) {
                        const domain = '.' + window.location.hostname.split('.').slice(-2).join('.');
                        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${domain}`;
                    }
                    
                    clearedCount++;
                }
            }
            
            console.log(`🍪 Cleared ${clearedCount} cookies`);
        } catch (error) {
            console.warn('Failed to clear cookies:', error);
        }
    },

    /**
     * Clear browser caches (Cache API, Service Workers)
     */
    async clearBrowserCaches() {
        // Clear Cache API
        if ('caches' in window) {
            try {
                const cacheNames = await caches.keys();
                await Promise.all(
                    cacheNames.map(cacheName => caches.delete(cacheName))
                );
                console.log(`💾 Cleared ${cacheNames.length} browser caches`);
            } catch (error) {
                console.warn('Failed to clear browser caches:', error);
            }
        }

        // Unregister Service Workers
        if ('serviceWorker' in navigator) {
            try {
                const registrations = await navigator.serviceWorker.getRegistrations();
                await Promise.all(
                    registrations.map(registration => registration.unregister())
                );
                console.log(`🔧 Unregistered ${registrations.length} service workers`);
            } catch (error) {
                console.warn('Failed to unregister service workers:', error);
            }
        }
    },

    /**
     * Clear IndexedDB
     */
    async clearIndexedDB() {
        if ('indexedDB' in window) {
            try {
                // Get list of databases (if supported)
                if (indexedDB.databases) {
                    const databases = await indexedDB.databases();
                    await Promise.all(
                        databases.map(db => {
                            return new Promise((resolve, reject) => {
                                const deleteReq = indexedDB.deleteDatabase(db.name);
                                deleteReq.onsuccess = () => resolve();
                                deleteReq.onerror = () => reject(deleteReq.error);
                            });
                        })
                    );
                    console.log(`📊 Cleared ${databases.length} IndexedDB databases`);
                } else {
                    // Fallback: try to delete common database names
                    const commonNames = ['localforage', 'app-cache', 'user-data'];
                    for (const name of commonNames) {
                        try {
                            indexedDB.deleteDatabase(name);
                        } catch (e) {
                            // Ignore errors for non-existent databases
                        }
                    }
                    console.log('📊 Attempted to clear common IndexedDB databases');
                }
            } catch (error) {
                console.warn('Failed to clear IndexedDB:', error);
            }
        }
    },

    /**
     * Clear component-specific caches
     */
    clearComponentCaches() {
        try {
            // Clear any global app state
            if (window.App) {
                window.App.currentUser = null;
                window.App.currentView = null;
            }

            // Clear admin dashboard data
            if (window.AdminDashboard) {
                window.AdminDashboard.data = {
                    attendees: [],
                    rooms: [],
                    groups: [],
                    announcements: [],
                    stats: {}
                };
            }

            // Clear email management state
            if (window.EmailManagement) {
                window.EmailManagement.availableGroups = [];
                window.EmailManagement.availableAttendees = [];
                window.EmailManagement.isInitialized = false;
            }

            // Clear any other component caches
            console.log('🧩 Cleared component caches');
        } catch (error) {
            console.warn('Failed to clear component caches:', error);
        }
    },

    /**
     * Show cache clearing progress to user
     */
    async clearCachesWithProgress() {
        // Show loading indicator
        const originalBody = document.body.innerHTML;
        document.body.innerHTML = `
            <div style="
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 10000;
                color: white;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            ">
                <div style="text-align: center;">
                    <div style="
                        width: 60px;
                        height: 60px;
                        border: 4px solid rgba(255,255,255,0.3);
                        border-radius: 50%;
                        border-top-color: white;
                        animation: spin 1s ease-in-out infinite;
                        margin: 0 auto 2rem auto;
                    "></div>
                    <h2 style="margin: 0 0 1rem 0;">🧹 Clearing Cache...</h2>
                    <p style="margin: 0; opacity: 0.9;">Securing your session and clearing browser data</p>
                </div>
                <style>
                    @keyframes spin {
                        to { transform: rotate(360deg); }
                    }
                </style>
            </div>
        `;

        // Wait a moment for visual feedback
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Clear all caches
        const success = await this.clearAllCaches();

        // Wait another moment
        await new Promise(resolve => setTimeout(resolve, 500));

        return success;
    }
};

// Enhanced Auth logout function
if (window.Auth) {
    // Store original logout function
    const originalLogout = window.Auth.logout;

    // Override with cache-clearing version
    window.Auth.logout = async function() {
        console.log('🚪 Admin logout initiated with cache clearing...');
        
        try {
            // Clear auth tokens first
            this.clearAllTokens();
            
            // Clear all browser caches with progress indicator
            await CacheManager.clearCachesWithProgress();
            
            // Show success message briefly
            document.body.innerHTML = `
                <div style="
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 10000;
                    color: white;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                ">
                    <div style="text-align: center;">
                        <div style="
                            width: 60px;
                            height: 60px;
                            background: rgba(255,255,255,0.2);
                            border-radius: 50%;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            margin: 0 auto 2rem auto;
                            font-size: 24px;
                        ">✅</div>
                        <h2 style="margin: 0 0 1rem 0;">Logout Complete!</h2>
                        <p style="margin: 0; opacity: 0.9;">Cache cleared and session secured</p>
                    </div>
                </div>
            `;
            
            // Wait a moment to show success
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            // Force reload to completely refresh the page
            window.location.reload(true);
            
        } catch (error) {
            console.error('Error during logout:', error);
            
            // Fallback: still clear tokens and reload
            this.clearAllTokens();
            setTimeout(() => {
                window.location.reload(true);
            }, 1000);
        }
    };
}

// Enhanced AdminDashboard logout handler
if (window.AdminDashboard && window.AdminDashboard.bindEvents) {
    const originalBindEvents = window.AdminDashboard.bindEvents;
    
    window.AdminDashboard.bindEvents = function() {
        // Call original bind events
        originalBindEvents.call(this);
        
        // Override logout button with cache clearing
        const logoutBtn = document.getElementById('admin-logout');
        if (logoutBtn) {
            // Remove existing listeners
            logoutBtn.replaceWith(logoutBtn.cloneNode(true));
            const newLogoutBtn = document.getElementById('admin-logout');
            
            newLogoutBtn.addEventListener('click', async () => {
                if (confirm('Are you sure you want to logout? This will clear all cached data for security.')) {
                    await Auth.logout();
                }
            });
        }
    };
}