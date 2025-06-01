// frontend/public/js/enhanced-session-management.js
// Complete enhanced session management for multiple concurrent sessions - FIXED VERSION

(function() {
    'use strict';
    
    console.log('Loading Enhanced Session Management...');

    // 1. Session Storage with Conflict Detection
    const SessionManager = {
        storagePrefix: 'retreat_session_',
        sessionId: null,
        sessionStartTime: Date.now(),
        heartbeatInterval: null,
        conflictCheckInterval: null,
        debug: localStorage.getItem('debug_sessions') === 'true',
        
        /**
         * Initialize session management
         */
        init() {
            this.sessionId = this.generateSessionId();
            this.log('Session Manager initialized with ID:', this.sessionId);
            
            this.setupStorageListener();
            this.setupVisibilityListener();
            this.setupBeforeUnloadHandler();
            this.startHeartbeat();
            this.startConflictMonitoring();
            
            return this.sessionId;
        },
        
        /**
         * Generate unique session ID
         */
        generateSessionId() {
            const timestamp = Date.now().toString(36);
            const random = Math.random().toString(36).substr(2, 9);
            const uuid = 'sess_' + timestamp + '_' + random;
            return uuid;
        },
        
        /**
         * Enhanced logging
         */
        log(...args) {
            if (this.debug) {
                console.log('[SessionManager]', ...args);
            }
        },
        
        /**
         * Store data with session context
         */
        setItem(key, value, userType = 'attendee') {
            const sessionKey = `${this.storagePrefix}${userType}_${key}`;
            const sessionData = {
                value,
                sessionId: this.sessionId,
                timestamp: Date.now(),
                userType,
                expiresAt: Date.now() + (2 * 60 * 60 * 1000) // 2 hours
            };
            
            try {
                localStorage.setItem(sessionKey, JSON.stringify(sessionData));
                this.log(`Stored ${key} for ${userType}:`, sessionData);
                
                // Update session registry
                this.updateSessionRegistry(userType, key);
            } catch (error) {
                console.warn('Session storage failed:', error);
                this.handleStorageError(error);
            }
        },
        
        /**
         * Get data with session validation
         */
        getItem(key, userType = 'attendee') {
            const sessionKey = `${this.storagePrefix}${userType}_${key}`;
            
            try {
                const stored = localStorage.getItem(sessionKey);
                if (!stored) {
                    this.log(`No data found for ${key} (${userType})`);
                    return null;
                }
                
                const sessionData = JSON.parse(stored);
                
                // Check if session is expired
                if (Date.now() > sessionData.expiresAt) {
                    this.log(`Session data expired for ${key} (${userType})`);
                    this.removeItem(key, userType);
                    return null;
                }
                
                // Check if session is still valid (not too old)
                const maxAge = 24 * 60 * 60 * 1000; // 24 hours absolute max
                if (Date.now() - sessionData.timestamp > maxAge) {
                    this.log(`Session data too old for ${key} (${userType})`);
                    this.removeItem(key, userType);
                    return null;
                }
                
                this.log(`Retrieved ${key} for ${userType}:`, sessionData.value);
                return sessionData.value;
            } catch (error) {
                console.warn('Session retrieval failed:', error);
                this.removeItem(key, userType); // Clean up corrupted data
                return null;
            }
        },
        
        /**
         * Remove session data
         */
        removeItem(key, userType = 'attendee') {
            const sessionKey = `${this.storagePrefix}${userType}_${key}`;
            localStorage.removeItem(sessionKey);
            this.log(`Removed ${key} for ${userType}`);
            this.updateSessionRegistry(userType, key, true); // remove flag
        },
        
        /**
         * Clear all session data for user type
         */
        clearSession(userType = 'attendee') {
            const prefix = `${this.storagePrefix}${userType}_`;
            const keysToRemove = [];
            
            // Find all keys for this user type
            Object.keys(localStorage).forEach(key => {
                if (key.startsWith(prefix)) {
                    keysToRemove.push(key);
                }
            });
            
            // Remove them
            keysToRemove.forEach(key => {
                localStorage.removeItem(key);
            });
            
            this.log(`Cleared session for ${userType}, removed ${keysToRemove.length} items`);
            this.updateSessionRegistry(userType, null, true); // clear all
        },
        
        /**
         * Track active sessions to detect conflicts
         */
        updateSessionRegistry(userType, key, remove = false) {
            const registryKey = `${this.storagePrefix}registry`;
            let registry = {};
            
            try {
                const stored = localStorage.getItem(registryKey);
                if (stored) {
                    registry = JSON.parse(stored);
                }
            } catch (e) {
                this.log('Registry corrupted, resetting');
                registry = {};
            }
            
            if (!registry[userType]) {
                registry[userType] = {};
            }
            
            if (remove) {
                if (key) {
                    delete registry[userType][key];
                    this.log(`Removed ${key} from registry for ${userType}`);
                } else {
                    registry[userType] = {};
                    this.log(`Cleared registry for ${userType}`);
                }
            } else {
                registry[userType][key] = {
                    sessionId: this.sessionId,
                    lastUpdated: Date.now(),
                    userAgent: navigator.userAgent.substr(0, 100) // Truncate for storage
                };
                this.log(`Updated registry for ${userType}.${key}`);
            }
            
            try {
                localStorage.setItem(registryKey, JSON.stringify(registry));
            } catch (error) {
                console.warn('Failed to update session registry:', error);
            }
        },
        
        /**
         * Listen for storage changes from other tabs
         */
        setupStorageListener() {
            window.addEventListener('storage', (e) => {
                if (e.key && e.key.startsWith(this.storagePrefix)) {
                    this.log('Storage change detected:', e.key, e.newValue ? 'updated' : 'removed');
                    this.handleStorageConflict(e);
                }
            });
            
            this.log('Storage listener setup complete');
        },
        
        /**
         * Handle storage conflicts from other tabs
         */
        handleStorageConflict(storageEvent) {
            // Detect if another tab logged in with different credentials
            if (storageEvent.key.includes('_token')) {
                try {
                    if (storageEvent.newValue) {
                        const newData = JSON.parse(storageEvent.newValue);
                        
                        if (newData.sessionId !== this.sessionId) {
                            this.log('Session conflict detected from storage event');
                            
                            const userType = storageEvent.key.includes('admin') ? 'admin' : 'attendee';
                            this.handleSessionConflict(userType, 'storage_change');
                        }
                    }
                } catch (error) {
                    this.log('Failed to parse storage event data:', error);
                }
            }
            
            // Handle registry updates
            if (storageEvent.key.includes('registry')) {
                this.checkForConflictsInRegistry();
            }
        },
        
        /**
         * Check registry for conflicts
         */
        checkForConflictsInRegistry() {
            const registryKey = `${this.storagePrefix}registry`;
            
            try {
                const stored = localStorage.getItem(registryKey);
                if (!stored) return;
                
                const registry = JSON.parse(stored);
                
                ['attendee', 'admin'].forEach(userType => {
                    if (registry[userType] && registry[userType].token) {
                        const tokenInfo = registry[userType].token;
                        
                        if (tokenInfo.sessionId !== this.sessionId) {
                            // Check if this is a newer session
                            const timeDiff = tokenInfo.lastUpdated - this.sessionStartTime;
                            
                            if (timeDiff > 5000) { // 5 second buffer
                                this.log(`Registry conflict detected for ${userType}`);
                                this.handleSessionConflict(userType, 'registry_check');
                            }
                        }
                    }
                });
            } catch (error) {
                this.log('Registry conflict check failed:', error);
            }
        },
        
        /**
         * Handle session conflicts
         */
        handleSessionConflict(userType, source = 'unknown') {
            const currentToken = this.getItem('token', userType);
            if (!currentToken) {
                this.log(`No current token for ${userType}, ignoring conflict`);
                return;
            }
            
            this.log(`Session conflict detected for ${userType} from ${source}`);
            
            const isAdmin = userType === 'admin';
            const message = isAdmin 
                ? 'Another admin session has been detected in a different tab or device.'
                : 'Another session has been detected in a different tab or device.';
                
            // Show warning but don't force logout immediately
            if (window.Utils) {
                Utils.showAlert(message + ' You may be logged out automatically if the conflict persists.', 'warning', 8000);
            }
            
            // Mark this session as potentially conflicted
            this.setConflictFlag(userType, true);
            
            // Option: Force logout after delay if conflict persists
            setTimeout(() => {
                if (this.isSessionConflicted(userType) && this.getConflictFlag(userType)) {
                    this.log(`Forcing logout due to persistent conflict for ${userType}`);
                    
                    if (window.Utils) {
                        Utils.showAlert('Session conflict detected. Logging out for security...', 'error', 5000);
                    }
                    
                    setTimeout(() => {
                        if (window.Auth) {
                            window.Auth.logout();
                        }
                    }, 2000);
                }
            }, 10000); // 10 second grace period
        },
        
        /**
         * Set/get conflict flags
         */
        setConflictFlag(userType, hasConflict) {
            const key = `conflict_${userType}`;
            if (hasConflict) {
                sessionStorage.setItem(key, Date.now().toString());
            } else {
                sessionStorage.removeItem(key);
            }
        },
        
        getConflictFlag(userType) {
            const key = `conflict_${userType}`;
            const flagTime = sessionStorage.getItem(key);
            
            if (!flagTime) return false;
            
            // Flag expires after 30 seconds
            const age = Date.now() - parseInt(flagTime);
            if (age > 30000) {
                sessionStorage.removeItem(key);
                return false;
            }
            
            return true;
        },
        
        /**
         * Check if session is conflicted
         */
        isSessionConflicted(userType) {
            const currentToken = this.getItem('token', userType);
            if (!currentToken) return false;
            
            // Check if our session ID matches the latest in registry
            const registryKey = `${this.storagePrefix}registry`;
            try {
                const stored = localStorage.getItem(registryKey);
                if (!stored) return false;
                
                const registry = JSON.parse(stored);
                const tokenInfo = registry[userType]?.token;
                
                if (tokenInfo && tokenInfo.sessionId !== this.sessionId) {
                    // Check if the other session is actually newer
                    const timeDiff = tokenInfo.lastUpdated - this.sessionStartTime;
                    return timeDiff > 1000; // 1 second buffer for clock differences
                }
                
                return false;
            } catch (error) {
                this.log('Conflict check failed:', error);
                return false;
            }
        },
        
        /**
         * Handle browser visibility changes
         */
        setupVisibilityListener() {
            document.addEventListener('visibilitychange', () => {
                if (!document.hidden) {
                    this.log('Tab became visible, checking for conflicts');
                    
                    // Tab became visible, check for conflicts
                    setTimeout(() => {
                        this.checkSessionConflicts();
                    }, 500); // Small delay to let storage settle
                }
            });
            
            this.log('Visibility listener setup complete');
        },
        
        /**
         * Check for session conflicts
         */
        checkSessionConflicts() {
            const attendeeToken = window.Auth?.getToken('attendee');
            const adminToken = window.Auth?.getToken('admin');
            
            if (attendeeToken && this.isSessionConflicted('attendee')) {
                this.log('Attendee session conflict detected on visibility change');
                this.handleSessionConflict('attendee', 'visibility_check');
            }
            
            if (adminToken && this.isSessionConflicted('admin')) {
                this.log('Admin session conflict detected on visibility change');
                this.handleSessionConflict('admin', 'visibility_check');
            }
        },
        
        /**
         * Start session heartbeat
         */
        startHeartbeat() {
            // Send heartbeat every 30 seconds when tab is active
            this.heartbeatInterval = setInterval(() => {
                if (!document.hidden) {
                    this.sendHeartbeat();
                }
            }, 30000);
            
            this.log('Heartbeat started (30s interval)');
        },
        
        /**
         * Send heartbeat to update session activity
         */
        sendHeartbeat() {
            const attendeeToken = window.Auth?.getToken('attendee');
            const adminToken = window.Auth?.getToken('admin');
            
            if (attendeeToken || adminToken) {
                // Update our own timestamp in registry
                const userType = adminToken ? 'admin' : 'attendee';
                this.updateSessionRegistry(userType, 'heartbeat');
                
                this.log(`Heartbeat sent for ${userType}`);
                
                // Optional: ping server
                if (window.ConnectionManager && typeof window.ConnectionManager.pingServer === 'function') {
                    window.ConnectionManager.pingServer().catch(() => {
                        // Silent fail for heartbeat
                    });
                }
            }
        },
        
        /**
         * Start conflict monitoring
         */
        startConflictMonitoring() {
            // Check for conflicts every 60 seconds
            this.conflictCheckInterval = setInterval(() => {
                if (!document.hidden) {
                    this.performConflictCheck();
                }
            }, 60000);
            
            this.log('Conflict monitoring started (60s interval)');
        },
        
        /**
         * Perform periodic conflict check
         */
        performConflictCheck() {
            try {
                this.checkForConflictsInRegistry();
                this.cleanupExpiredSessions();
            } catch (error) {
                this.log('Conflict check error:', error);
            }
        },
        
        /**
         * Clean up expired sessions from local storage
         */
        cleanupExpiredSessions() {
            const now = Date.now();
            const keysToRemove = [];
            
            Object.keys(localStorage).forEach(key => {
                if (key.startsWith(this.storagePrefix) && key !== `${this.storagePrefix}registry`) {
                    try {
                        const data = JSON.parse(localStorage.getItem(key));
                        if (data.expiresAt && now > data.expiresAt) {
                            keysToRemove.push(key);
                        }
                    } catch (error) {
                        // Corrupted data, remove it
                        keysToRemove.push(key);
                    }
                }
            });
            
            keysToRemove.forEach(key => {
                localStorage.removeItem(key);
            });
            
            if (keysToRemove.length > 0) {
                this.log(`Cleaned up ${keysToRemove.length} expired sessions`);
            }
        },
        
        /**
         * Handle storage errors
         */
        handleStorageError(error) {
            if (error.name === 'QuotaExceededError') {
                this.log('Storage quota exceeded, performing cleanup');
                
                // Try to free up space
                this.cleanupExpiredSessions();
                
                // Clear old registry entries
                this.cleanupRegistry();
                
                if (window.Utils) {
                    Utils.showAlert('Storage space low. Some session data was cleaned up.', 'warning');
                }
            }
        },
        
        /**
         * Clean up old registry entries
         */
        cleanupRegistry() {
            const registryKey = `${this.storagePrefix}registry`;
            
            try {
                const stored = localStorage.getItem(registryKey);
                if (!stored) return;
                
                const registry = JSON.parse(stored);
                const now = Date.now();
                const maxAge = 2 * 60 * 60 * 1000; // 2 hours
                
                let cleaned = false;
                
                Object.keys(registry).forEach(userType => {
                    Object.keys(registry[userType]).forEach(key => {
                        const entry = registry[userType][key];
                        if (entry.lastUpdated && (now - entry.lastUpdated) > maxAge) {
                            delete registry[userType][key];
                            cleaned = true;
                        }
                    });
                });
                
                if (cleaned) {
                    localStorage.setItem(registryKey, JSON.stringify(registry));
                    this.log('Registry cleanup completed');
                }
            } catch (error) {
                this.log('Registry cleanup failed:', error);
            }
        },
        
        /**
         * Clean up on page unload
         */
        setupBeforeUnloadHandler() {
            window.addEventListener('beforeunload', () => {
                this.log('Page unloading, performing cleanup');
                
                // Mark this session as ended
                this.updateSessionRegistry('attendee', 'session_end');
                this.updateSessionRegistry('admin', 'session_end');
                
                // Clear intervals
                if (this.heartbeatInterval) {
                    clearInterval(this.heartbeatInterval);
                }
                
                if (this.conflictCheckInterval) {
                    clearInterval(this.conflictCheckInterval);
                }
            });
            
            this.log('Beforeunload handler setup complete');
        },
        
        /**
         * Get session information
         */
        getSessionInfo() {
            return {
                sessionId: this.sessionId,
                startTime: this.sessionStartTime,
                uptime: Date.now() - this.sessionStartTime,
                hasConflicts: {
                    attendee: this.isSessionConflicted('attendee'),
                    admin: this.isSessionConflicted('admin')
                }
            };
        },
        
        /**
         * Force refresh session
         */
        refreshSession(userType = 'attendee') {
            this.log(`Forcing session refresh for ${userType}`);
            
            // Clear conflict flags
            this.setConflictFlag(userType, false);
            
            // Update registry with current time
            this.updateSessionRegistry(userType, 'force_refresh');
            
            if (window.Utils) {
                Utils.showAlert('Session refreshed successfully', 'success');
            }
        },
        
        /**
         * Destroy session manager
         */
        destroy() {
            this.log('Destroying session manager');
            
            if (this.heartbeatInterval) {
                clearInterval(this.heartbeatInterval);
            }
            
            if (this.conflictCheckInterval) {
                clearInterval(this.conflictCheckInterval);
            }
            
            // Remove event listeners would require storing references
            // For now, they'll be cleaned up when page unloads
        }
    };

    // 2. Enhanced Auth with Session Management
    const EnhancedAuth = {
        // Copy all existing Auth properties/methods first
        ...(window.Auth || {}),
        
        /**
         * Set token with session management
         */
        setToken(token, type = 'attendee') {
            SessionManager.log(`Setting token for ${type}`);
            
            // Use session manager instead of direct localStorage
            SessionManager.setItem('token', token, type);
            
            // Set expiration tracking
            const expiresAt = Date.now() + (2 * 60 * 60 * 1000); // 2 hours
            SessionManager.setItem('token_expires', expiresAt, type);
            
            // Clear any conflict flags
            SessionManager.setConflictFlag(type, false);
        },
        
        /**
         * Get token with expiration check
         */
        getToken(type = 'attendee') {
            const token = SessionManager.getItem('token', type);
            const expiresAt = SessionManager.getItem('token_expires', type);
            
            if (token && expiresAt && Date.now() > expiresAt) {
                SessionManager.log(`Token expired for ${type}`);
                this.clearToken(type);
                return null;
            }
            
            return token;
        },
        
        /**
         * Clear token
         */
        clearToken(type = 'attendee') {
            SessionManager.log(`Clearing token for ${type}`);
            SessionManager.removeItem('token', type);
            SessionManager.removeItem('token_expires', type);
            SessionManager.setConflictFlag(type, false);
        },
        
        /**
         * Clear all tokens
         */
        clearAllTokens() {
            SessionManager.log('Clearing all tokens');
            this.clearToken('attendee');
            this.clearToken('admin');
            SessionManager.clearSession('attendee');
            SessionManager.clearSession('admin');
        },
        
        /**
         * Check authentication with session validation
         */
        isAuthenticated(type = 'attendee') {
            const token = this.getToken(type);
            const isValid = token !== null && token !== '';
            
            if (isValid && SessionManager.isSessionConflicted(type)) {
                SessionManager.log(`Session conflict detected for authenticated ${type}`);
                // Still return true but the conflict will be handled elsewhere
            }
            
            return isValid;
        },
        
        /**
         * Enhanced attendee login with session management
         */
        async attendeeLogin(ref, password) {
            SessionManager.log('Attempting attendee login');
            
            try {
                const response = await window.API.post('/login', { ref, password });
                
                // Enhanced response handling
                if (response.token) {
                    this.setToken(response.token, 'attendee');
                    
                    // Handle existing sessions notification
                    if (response.existingSessions > 0) {
                        const message = `Note: You have ${response.existingSessions} other active session${response.existingSessions > 1 ? 's' : ''}.`;
                        if (window.Utils) {
                            Utils.showAlert(message, 'info', 5000);
                        }
                    }
                }
                
                return response;
            } catch (error) {
                SessionManager.log('Attendee login failed:', error.message);
                throw error;
            }
        },
        
        /**
         * Enhanced admin login with session management
         */
        async adminLogin(user, pass) {
            SessionManager.log('Attempting admin login');
            
            try {
                const response = await window.API.post('/admin/login', { user, pass });
                
                if (response.token) {
                    this.setToken(response.token, 'admin');
                    
                    // Handle existing sessions notification
                    if (response.existingSessions > 0) {
                        const message = `Note: You have ${response.existingSessions} other active admin session${response.existingSessions > 1 ? 's' : ''}.`;
                        if (window.Utils) {
                            Utils.showAlert(message, 'info', 5000);
                        }
                    }
                }
                
                return response;
            } catch (error) {
                SessionManager.log('Admin login failed:', error.message);
                throw error;
            }
        },
        
        /**
         * Enhanced logout with session cleanup
         */
        logout() {
            SessionManager.log('Logging out user');
            
            this.clearAllTokens();
            
            // Redirect to login
            if (window.App && typeof window.App.showLoginView === 'function') {
                window.App.showLoginView();
            } else {
                // Fallback: reload page
                window.location.reload();
            }
        }
    };

    // 3. Enhanced API with Request Deduplication
    const EnhancedAPI = {
        // Copy existing API properties
        ...(window.API || {}),
        
        pendingRequests: new Map(),
        requestQueue: [],
        isOnline: navigator.onLine,
        debug: localStorage.getItem('debug_api') === 'true',
        
        /**
         * Enhanced logging
         */
        log(...args) {
            if (this.debug) {
                console.log('[EnhancedAPI]', ...args);
            }
        },
        
        /**
         * Enhanced request with deduplication and session management
         */
        async request(endpoint, options = {}) {
            // Create request key for deduplication
            const requestKey = this.createRequestKey(endpoint, options);
            
            this.log('Making request:', endpoint, options.method || 'GET');
            
            // Check if similar request is already in progress
            if (this.pendingRequests.has(requestKey)) {
                this.log('Deduplicating request:', endpoint);
                return this.pendingRequests.get(requestKey);
            }
            
            // Create the request promise
            const requestPromise = this.makeRequest(endpoint, options);
            
            // Store in pending requests
            this.pendingRequests.set(requestKey, requestPromise);
            
            try {
                const result = await requestPromise;
                this.log('Request successful:', endpoint);
                return result;
            } catch (error) {
                this.log('Request failed:', endpoint, error.message);
                throw error;
            } finally {
                // Clean up
                this.pendingRequests.delete(requestKey);
            }
        },
        
        /**
         * Create unique request key for deduplication
         */
        createRequestKey(endpoint, options) {
            const method = options.method || 'GET';
            const body = options.body || '';
            const hash = this.hashString(body);
            return `${method}:${endpoint}:${hash}`;
        },
        
        /**
         * Simple string hash function
         */
        hashString(str) {
            let hash = 0;
            for (let i = 0; i < str.length; i++) {
                const char = str.charCodeAt(i);
                hash = ((hash << 5) - hash) + char;
                hash = hash & hash; // Convert to 32-bit integer
            }
            return hash.toString();
        },
        
        /**
         * Make actual HTTP request
         */
        async makeRequest(endpoint, options = {}) {
            const url = `${this.baseURL || '/api'}${endpoint}`;
            const config = {
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                ...options
            };

            // Add authentication token with session info
            const adminToken = EnhancedAuth.getToken('admin');
            const attendeeToken = EnhancedAuth.getToken('attendee');
            const token = adminToken || attendeeToken;
            
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
                config.headers['X-Session-ID'] = SessionManager.sessionId;
            }

            try {
                const response = await fetch(url, config);
                
                // Handle rate limiting
                const remaining = response.headers.get('X-RateLimit-Remaining');
                if (remaining !== null && parseInt(remaining) < 5) {
                    this.log('Approaching rate limit, remaining:', remaining);
                    if (window.Utils) {
                        Utils.showAlert('API rate limit approaching. Please slow down.', 'warning');
                    }
                }
                
                // Handle authentication errors
                if (response.status === 401) {
                    this.log('Authentication failed, clearing tokens');
                    EnhancedAuth.clearAllTokens();
                    
                    if (window.App && typeof window.App.showLoginView === 'function') {
                        window.App.showLoginView();
                    }
                    
                    throw new Error('Authentication failed. Please log in again.');
                }

                // Handle session conflicts
                const sessionConflict = response.headers.get('X-Session-Conflict');
                if (sessionConflict === 'true') {
                    this.log('Session conflict detected from server');
                    const userType = adminToken ? 'admin' : 'attendee';
                    SessionManager.handleSessionConflict(userType, 'server_response');
                }

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({ 
                        error: `HTTP ${response.status}: ${response.statusText}` 
                    }));
                    throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
                }

                return await response.json();
                
            } catch (error) {
                // Handle network errors
                if (error.name === 'TypeError' && error.message.includes('fetch')) {
                    this.log('Network error detected');
                    
                    if (window.ConnectionManager) {
                        window.ConnectionManager.handleConnectionError();
                    }
                    
                    throw new Error('Network error. Please check your connection.');
                }
                
                this.log('Request error:', error);
                throw error;
            }
        },
        
        /**
         * GET request wrapper
         */
        async get(endpoint) {
            return this.request(endpoint, { method: 'GET' });
        },

        /**
         * POST request wrapper
         */
        async post(endpoint, data) {
            return this.request(endpoint, {
                method: 'POST',
                body: JSON.stringify(data)
            });
        },

        /**
         * PUT request wrapper
         */
        async put(endpoint, data) {
            return this.request(endpoint, {
                method: 'PUT',
                body: JSON.stringify(data)
            });
        },

        /**
         * DELETE request wrapper
         */
        async delete(endpoint) {
            return this.request(endpoint, { method: 'DELETE' });
        }
    };

    // 4. Connection Manager for Offline/Online Detection
    const ConnectionManager = {
        isOnline: navigator.onLine,
        retryQueue: [],
        maxRetries: 3,
        retryDelay: 1000,
        
        /**
         * Initialize connection management
         */
        init() {
            this.setupOnlineListeners();
            this.log('Connection Manager initialized');
        },
        
        log(...args) {
            console.log('[ConnectionManager]', ...args);
        },
        
        /**
         * Setup online/offline event listeners
         */
        setupOnlineListeners() {
            window.addEventListener('online', () => {
                this.log('Connection restored');
                this.isOnline = true;
                
                if (window.Utils) {
                    Utils.showAlert('Connection restored', 'success');
                }
                
                this.processRetryQueue();
            });
            
            window.addEventListener('offline', () => {
                this.log('Connection lost');
                this.isOnline = false;
                
                if (window.Utils) {
                    Utils.showAlert('Connection lost. Some features may be unavailable.', 'warning');
                }
            });
        },
        
        /**
         * Handle connection errors
         */
        handleConnectionError() {
            this.isOnline = false;
            
            if (window.Utils) {
                Utils.showAlert('Network error. Please check your connection.', 'error');
            }
        },
        
        /**
         * Process retry queue when connection is restored
         */
        processRetryQueue() {
            this.log(`Processing ${this.retryQueue.length} queued requests`);
            
            const queue = [...this.retryQueue];
            this.retryQueue = [];
            
            queue.forEach(request => {
                this.retryRequest(request);
            });
        },
        
        /**
         * Retry a failed request
         */
        async retryRequest(request) {
            try {
                const result = await request.retry();
                this.log('Retry successful for:', request.endpoint);
                
                if (request.onSuccess) {
                    request.onSuccess(result);
                }
            } catch (error) {
                this.log('Retry failed for:', request.endpoint, error.message);
                
                if (request.retryCount < this.maxRetries) {
                    request.retryCount++;
                    setTimeout(() => {
                        this.retryRequest(request);
                    }, this.retryDelay * request.retryCount);
                } else if (request.onFailure) {
                    request.onFailure(error);
                }
            }
        },
        
        /**
         * Add request to retry queue
         */
        queueForRetry(endpoint, retryFn, onSuccess, onFailure) {
            this.retryQueue.push({
                endpoint,
                retry: retryFn,
                onSuccess,
                onFailure,
                retryCount: 0
            });
        },
        
        /**
         * Ping server to check connectivity
         */
        async pingServer() {
            try {
                const response = await fetch('/api/ping', {
                    method: 'GET',
                    cache: 'no-cache'
                });
                
                this.isOnline = response.ok;
                return response.ok;
            } catch (error) {
                this.isOnline = false;
                return false;
            }
        }
    };

    // 5. Enhanced Integration Module
    const EnhancedIntegration = {
        /**
         * Initialize real-time features
         */
        initializeRealTime() {
            console.log('Enhanced real-time features initialized');
            
            // Setup periodic data refresh for admin users
            if (window.Auth && window.Auth.getToken('admin')) {
                this.setupAdminDataRefresh();
            }
        },
        
        /**
         * Setup periodic data refresh for admin dashboard
         */
        setupAdminDataRefresh() {
            // Refresh admin data every 5 minutes
            setInterval(async () => {
                if (window.AdminDashboard && typeof window.AdminDashboard.refresh === 'function') {
                    try {
                        await window.AdminDashboard.refresh();
                        console.log('Admin dashboard auto-refreshed');
                    } catch (error) {
                        console.warn('Auto-refresh failed:', error);
                    }
                }
            }, 5 * 60 * 1000); // 5 minutes
        }
    };

    // 6. Main Initialization Function
    function initializeEnhancedSystems() {
        console.log('Initializing Enhanced Systems...');
        
        try {
            // Initialize session management
            SessionManager.init();
            
            // Initialize connection management
            ConnectionManager.init();
            
            // Replace existing Auth and API with enhanced versions
            if (window.Auth) {
                // Merge enhanced auth with existing auth
                Object.assign(window.Auth, EnhancedAuth);
                console.log('Enhanced Auth integrated');
            }
            
            if (window.API) {
                // Merge enhanced API with existing API
                Object.assign(window.API, EnhancedAPI);
                console.log('Enhanced API integrated');
            }
            
            // Make enhanced components globally available
            window.SessionManager = SessionManager;
            window.ConnectionManager = ConnectionManager;
            window.EnhancedIntegration = EnhancedIntegration;
            
            console.log('Enhanced Systems initialized successfully');
            
        } catch (error) {
            console.error('Enhanced Systems initialization failed:', error);
            
            // Don't break the app if enhanced features fail
            if (window.Utils) {
                Utils.showAlert('Some enhanced features are unavailable', 'warning');
            }
        }
    }

    // Make initialization function globally available
    window.initializeEnhancedSystems = initializeEnhancedSystems;
    
    // Auto-initialize if Auth and API are already available
    if (window.Auth && window.API) {
        initializeEnhancedSystems();
    }
    
    console.log('Enhanced Session Management loaded successfully');

})();