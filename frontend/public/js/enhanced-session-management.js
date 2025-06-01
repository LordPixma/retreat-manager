// frontend/public/js/enhanced-session-management.js
// Complete enhanced session management for multiple concurrent sessions

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

    // 4. Connection Status Manager
    const ConnectionManager = {
        isOnline: navigator.onLine,
        reconnectAttempts: 0,
        maxReconnectAttempts: 5,
        reconnectDelay: 1000,
        heartbeatInterval: null,
        lastSuccessfulPing: Date.now(),
        debug: localStorage.getItem('debug_connection') === 'true',
        
        /**
         * Initialize connection management
         */
        init() {
            this.log('Connection Manager initializing...');
            this.setupEventListeners();
            this.startHeartbeat();
        },
        
        /**
         * Enhanced logging
         */
        log(...args) {
            if (this.debug) {
                console.log('[ConnectionManager]', ...args);
            }
        },
        
        /**
         * Setup online/offline event listeners
         */
        setupEventListeners() {
            window.addEventListener('online', () => {
                this.log('Browser reports online');
                this.handleOnline();
            });
            
            window.addEventListener('offline', () => {
                this.log('Browser reports offline');
                this.handleOffline();
            });
        },
        
        /**
         * Handle going online
         */
        async handleOnline() {
            this.isOnline = true;
            this.reconnectAttempts = 0;
            this.lastSuccessfulPing = Date.now();
            
            if (window.Utils) {
                Utils.showAlert('Connection restored', 'success', 3000);
            }
            
            // Sync data after reconnection
            await this.syncData();
            
            // Process any queued requests
            if (window.EnhancedAPI && typeof window.EnhancedAPI.processQueue === 'function') {
                await window.EnhancedAPI.processQueue();
            }
        },
        
        /**
         * Handle going offline
         */
        handleOffline() {
            this.isOnline = false;
            
            if (window.Utils) {
                Utils.showAlert('Connection lost. Working offline...', 'warning', 5000);
            }
        },
        
        /**
         * Start connection heartbeat
         */
        startHeartbeat() {
            // Ping server every 30 seconds when online
            this.heartbeatInterval = setInterval(async () => {
                if (this.isOnline && !document.hidden) {
                    try {
                        await this.pingServer();
                        this.lastSuccessfulPing = Date.now();
                    } catch (error) {
                        this.handleConnectionError();
                    }
                }
            }, 30000);
            
            this.log('Heartbeat started (30s interval)');
        },
        
        /**
         * Ping server to check connectivity
         */
        async pingServer() {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);
            
            try {
                const response = await fetch('/api/ping', {
                    signal: controller.signal,
                    headers: {
                        'X-Session-ID': SessionManager.sessionId
                    }
                });
                
                clearTimeout(timeoutId);
                
                if (!response.ok) {
                    throw new Error(`Server responded with ${response.status}`);
                }
                
                const data = await response.json();
                this.log('Ping successful:', data);
                
                // Reset reconnect attempts on successful ping
                this.reconnectAttempts = 0;
                
                return data;
            } catch (error) {
                clearTimeout(timeoutId);
                this.log('Ping failed:', error.message);
                throw error;
            }
        },
        
        /**
         * Handle connection errors
         */
        handleConnectionError() {
            this.reconnectAttempts++;
            this.log(`Connection attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
            
            if (this.reconnectAttempts >= this.maxReconnectAttempts) {
                this.isOnline = false;
                
                if (window.Utils) {
                    Utils.showAlert('Connection issues detected. Please refresh the page.', 'error');
                }
            } else {
                // Exponential backoff for reconnection
                const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
                this.log(`Will retry connection in ${delay}ms`);
                
                setTimeout(async () => {
                    try {
                        await this.pingServer();
                        this.handleOnline();
                    } catch (error) {
                        this.log('Retry failed:', error.message);
                    }
                }, delay);
            }
        },
        
        /**
         * Sync data after reconnection
         */
        async syncData() {
            this.log('Syncing data after reconnection');
            
            try {
                // Refresh admin dashboard if available and active
                if (window.AdminDashboard && window.AdminDashboard.data) {
                    this.log('Refreshing admin dashboard');
                    await window.AdminDashboard.refresh();
                }
                
                // Refresh attendee dashboard if available and active
                if (window.AttendeeDashboard && window.AttendeeDashboard.data) {
                    this.log('Refreshing attendee dashboard');
                    await window.AttendeeDashboard.loadData();
                }
                
                this.log('Data sync completed');
            } catch (error) {
                this.log('Data sync failed:', error);
            }
        },
        
        /**
         * Check connection status
         */
        getStatus() {
            const timeSinceLastPing = Date.now() - this.lastSuccessfulPing;
            
            return {
                isOnline: this.isOnline,
                reconnectAttempts: this.reconnectAttempts,
                lastSuccessfulPing: this.lastSuccessfulPing,
                timeSinceLastPing,
                status: this.isOnline ? 'connected' : 'disconnected'
            };
        },
        
        /**
         * Force connection check
         */
        async checkConnection() {
            this.log('Force checking connection');
            
            try {
                await this.pingServer();
                if (!this.isOnline) {
                    this.handleOnline();
                }
                return true;
            } catch (error) {
                if (this.isOnline) {
                    this.handleConnectionError();
                }
                return false;
            }
        },
        
        /**
         * Destroy connection manager
         */
        destroy() {
            if (this.heartbeatInterval) {
                clearInterval(this.heartbeatInterval);
            }
        }
    };

    // 5. Enhanced Error Handling
    const ErrorManager = {
        errorQueue: [],
        maxErrors: 50,
        reportingEndpoint: '/api/errors',
        debug: localStorage.getItem('debug_errors') === 'true',
        
        /**
         * Initialize error management
         */
        init() {
            this.setupGlobalHandlers();
            this.log('Error Manager initialized');
        },
        
        /**
         * Enhanced logging
         */
        log(...args) {
            if (this.debug) {
                console.log('[ErrorManager]', ...args);
            }
        },
        
        /**
         * Setup global error handlers
         */
        setupGlobalHandlers() {
            // Handle uncaught errors
            window.addEventListener('error', (event) => {
                this.handleError(event.error || new Error(event.message), 'global_error', {
                    filename: event.filename,
                    lineno: event.lineno,
                    colno: event.colno
                });
            });
            
            // Handle unhandled promise rejections
            window.addEventListener('unhandledrejection', (event) => {
                this.handleError(
                    new Error(event.reason), 
                    'unhandled_promise_rejection'
                );
            });
        },
        
        /**
         * Handle errors with context
         */
        handleError(error, context = '', additionalInfo = {}) {
            const errorInfo = {
                message: error.message || 'Unknown error',
                stack: error.stack || '',
                context,
                timestamp: new Date().toISOString(),
                sessionId: SessionManager.sessionId,
                userAgent: navigator.userAgent,
                url: window.location.href,
                userId: this.getCurrentUserId(),
                connectionStatus: ConnectionManager.getStatus(),
                ...additionalInfo
            };
            
            this.log('Handling error:', errorInfo);
            
            // Add to queue
            this.errorQueue.push(errorInfo);
            
            // Limit queue size
            if (this.errorQueue.length > this.maxErrors) {
                this.errorQueue.shift();
            }
            
            // Report to server if possible (don't block UI)
            this.reportError(errorInfo).catch(() => {
                // Silent fail for error reporting
                this.log('Failed to report error to server');
            });
            
            // Handle specific error types
            this.categorizeAndHandle(error, context);
        },
        
        /**
         * Get current user ID for error context
         */
        getCurrentUserId() {
            try {
                const adminToken = EnhancedAuth.getToken('admin');
                const attendeeToken = EnhancedAuth.getToken('attendee');
                
                if (adminToken) return 'admin_user';
                if (attendeeToken) return 'attendee_user';
                
                return 'anonymous';
            } catch (error) {
                return 'unknown';
            }
        },
        
        /**
         * Categorize and handle errors appropriately
         */
        categorizeAndHandle(error, context) {
            const message = error.message.toLowerCase();
            
            if (message.includes('authentication') || message.includes('unauthorized')) {
                this.handleAuthError(error, context);
            } else if (message.includes('network') || message.includes('fetch')) {
                this.handleNetworkError(error, context);
            } else if (message.includes('session') || message.includes('conflict')) {
                this.handleSessionError(error, context);
            } else if (message.includes('rate limit') || message.includes('too many')) {
                this.handleRateLimitError(error, context);
            } else {
                this.handleGenericError(error, context);
            }
        },
        
        /**
         * Handle authentication errors
         */
        handleAuthError(error, context) {
            this.log('Authentication error:', error.message);
            
            if (window.Utils) {
                Utils.showAlert('Session expired. Please log in again.', 'error');
            }
            
            setTimeout(() => {
                EnhancedAuth.logout();
            }, 2000);
        },
        
        /**
         * Handle network errors
         */
        handleNetworkError(error, context) {
            this.log('Network error:', error.message);
            
            if (ConnectionManager.isOnline) {
                if (window.Utils) {
                    Utils.showAlert('Network error. Please check your connection.', 'error');
                }
                
                // Trigger connection check
                ConnectionManager.checkConnection();
            }
        },
        
        /**
         * Handle session errors
         */
        handleSessionError(error, context) {
            this.log('Session error:', error.message);
            
            if (window.Utils) {
                Utils.showAlert('Session conflict detected. Please refresh if issues persist.', 'warning');
            }
        },
        
        /**
         * Handle rate limiting errors
         */
        handleRateLimitError(error, context) {
            this.log('Rate limit error:', error.message);
            
            if (window.Utils) {
                Utils.showAlert('Please slow down. Too many requests.', 'warning');
            }
        },
        
        /**
         * Handle generic errors
         */
        handleGenericError(error, context) {
            this.log('Generic error:', error.message, 'Context:', context);
            
            // Only show user-facing message for non-trivial errors
            if (!this.isTrivialError(error)) {
                if (window.Utils) {
                    Utils.showAlert('An unexpected error occurred. Please try again.', 'error');
                }
            }
        },
        
        /**
         * Check if error is trivial (shouldn't bother user)
         */
        isTrivialError(error) {
            const trivialMessages = [
                'non-error thrown',
                'script error',
                'network error', // Already handled
                'loading chunk',
                'dynamically imported module'
            ];
            
            const message = error.message.toLowerCase();
            return trivialMessages.some(trivial => message.includes(trivial));
        },
        
        /**
         * Report error to server
         */
        async reportError(errorInfo) {
            try {
                // Don't report if offline
                if (!ConnectionManager.isOnline) {
                    return;
                }
                
                await fetch(this.reportingEndpoint, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Session-ID': SessionManager.sessionId
                    },
                    body: JSON.stringify(errorInfo)
                });
                
                this.log('Error reported to server');
            } catch (reportError) {
                this.log('Failed to report error:', reportError.message);
            }
        },
        
        /**
         * Get error statistics
         */
        getErrorStats() {
            const now = Date.now();
            const oneHourAgo = now - (60 * 60 * 1000);
            const oneDayAgo = now - (24 * 60 * 60 * 1000);
            
            const recentErrors = this.errorQueue.filter(error => {
                const errorTime = new Date(error.timestamp).getTime();
                return errorTime > oneHourAgo;
            });
            
            const dailyErrors = this.errorQueue.filter(error => {
                const errorTime = new Date(error.timestamp).getTime();
                return errorTime > oneDayAgo;
            });
            
            return {
                total: this.errorQueue.length,
                lastHour: recentErrors.length,
                lastDay: dailyErrors.length,
                byContext: this.groupErrorsByContext(),
                mostRecent: this.errorQueue[this.errorQueue.length - 1] || null
            };
        },
        
        /**
         * Group errors by context for analysis
         */
        groupErrorsByContext() {
            const grouped = {};
            
            this.errorQueue.forEach(error => {
                const context = error.context || 'unknown';
                if (!grouped[context]) {
                    grouped[context] = 0;
                }
                grouped[context]++;
            });
            
            return grouped;
        },
        
        /**
         * Clear error queue
         */
        clearErrors() {
            this.errorQueue = [];
            this.log('Error queue cleared');
        }
    };

    // 6. Enhanced Utils Extension
    const UtilsExtensions = {
        /**
         * Enhanced alert with session context
         */
        showAlert(message, type = 'error', duration = 5000) {
            // Call original Utils.showAlert if available
            if (window.Utils && typeof window.Utils.showAlert === 'function') {
                window.Utils.showAlert(message, type, duration);
            } else {
                // Fallback alert
                console.warn('Utils.showAlert not available, using fallback');
                this.fallbackAlert(message, type, duration);
            }
            
            // Log alert for debugging
            SessionManager.log('Alert shown:', { message, type, duration });
        },
        
        /**
         * Fallback alert implementation
         */
        fallbackAlert(message, type, duration) {
            // Create simple alert div
            const alert = document.createElement('div');
            alert.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 12px 20px;
                border-radius: 4px;
                color: white;
                font-weight: 500;
                z-index: 10000;
                max-width: 400px;
                word-wrap: break-word;
            `;
            
            // Set background color based on type
            switch (type) {
                case 'success':
                    alert.style.backgroundColor = '#10b981';
                    break;
                case 'warning':
                    alert.style.backgroundColor = '#f59e0b';
                    break;
                case 'info':
                    alert.style.backgroundColor = '#3b82f6';
                    break;
                default: // error
                    alert.style.backgroundColor = '#ef4444';
            }
            
            alert.textContent = message;
            document.body.appendChild(alert);
            
            // Auto remove
            setTimeout(() => {
                if (alert.parentNode) {
                    alert.parentNode.removeChild(alert);
                }
            }, duration);
        },
        
        /**
         * Show session information
         */
        showSessionInfo() {
            const info = SessionManager.getSessionInfo();
            const connectionStatus = ConnectionManager.getStatus();
            const errorStats = ErrorManager.getErrorStats();
            
            const details = `
Session ID: ${info.sessionId}
Uptime: ${Math.round(info.uptime / 1000)}s
Connection: ${connectionStatus.status}
Errors (1h): ${errorStats.lastHour}
Conflicts: Attendee(${info.hasConflicts.attendee}), Admin(${info.hasConflicts.admin})
            `.trim();
            
            console.group('🔧 Session Information');
            console.log(details);
            console.log('Full session info:', info);
            console.log('Connection status:', connectionStatus);
            console.log('Error stats:', errorStats);
            console.groupEnd();
            
            if (window.Utils) {
                this.showAlert('Session information logged to console', 'info');
            }
        }
    };

    // 7. System Initialization
    function initializeEnhancedSystems() {
        console.log('🚀 Initializing Enhanced Session Management Systems...');
        
        try {
            // Initialize session management
            SessionManager.init();
            console.log('✅ Session Manager initialized');
            
            // Initialize connection monitoring
            ConnectionManager.init();
            console.log('✅ Connection Manager initialized');
            
            // Initialize error management
            ErrorManager.init();
            console.log('✅ Error Manager initialized');
            
            // Replace global Auth and API with enhanced versions
            window.Auth = EnhancedAuth;
            window.API = EnhancedAPI;
            console.log('✅ Enhanced Auth and API installed');
            
            // Extend Utils if available
            if (window.Utils) {
                Object.assign(window.Utils, UtilsExtensions);
                console.log('✅ Utils extended');
            }
            
            // Add session info helper to console
            window.showSessionInfo = UtilsExtensions.showSessionInfo;
            
            console.log('🎉 Enhanced session management initialized successfully');
            console.log('💡 Type "showSessionInfo()" in console for session details');
            
            // Show initialization success
            setTimeout(() => {
                if (window.Utils) {
                    UtilsExtensions.showAlert('Enhanced session management active', 'success', 3000);
                }
            }, 1000);
            
        } catch (error) {
            console.error('❌ Failed to initialize enhanced systems:', error);
            ErrorManager.handleError(error, 'system_initialization');
        }
    }

    // 8. Debug Helpers
    const DebugHelpers = {
        /**
         * Enable debug mode for all components
         */
        enableDebug() {
            localStorage.setItem('debug_sessions', 'true');
            localStorage.setItem('debug_api', 'true');
            localStorage.setItem('debug_connection', 'true');
            localStorage.setItem('debug_errors', 'true');
            
            console.log('🐛 Debug mode enabled for all components');
            console.log('💡 Refresh the page to see debug output');
        },
        
        /**
         * Disable debug mode
         */
        disableDebug() {
            localStorage.removeItem('debug_sessions');
            localStorage.removeItem('debug_api');
            localStorage.removeItem('debug_connection');
            localStorage.removeItem('debug_errors');
            
            console.log('🔇 Debug mode disabled');
        },
        
        /**
         * Force session conflict for testing
         */
        simulateConflict(userType = 'attendee') {
            SessionManager.handleSessionConflict(userType, 'debug_simulation');
            console.log(`🔄 Simulated session conflict for ${userType}`);
        },
        
        /**
         * Clear all session data
         */
        clearAllData() {
            SessionManager.clearSession('attendee');
            SessionManager.clearSession('admin');
            localStorage.removeItem(SessionManager.storagePrefix + 'registry');
            sessionStorage.clear();
            
            console.log('🗑️ All session data cleared');
        },
        
        /**
         * Show storage usage
         */
        showStorageUsage() {
            let totalSize = 0;
            let sessionSize = 0;
            
            for (let key in localStorage) {
                if (localStorage.hasOwnProperty(key)) {
                    const size = localStorage[key].length;
                    totalSize += size;
                    
                    if (key.startsWith(SessionManager.storagePrefix)) {
                        sessionSize += size;
                    }
                }
            }
            
            console.group('💾 Storage Usage');
            console.log(`Total localStorage: ${totalSize} characters`);
            console.log(`Session data: ${sessionSize} characters`);
            console.log(`Session percentage: ${((sessionSize/totalSize)*100).toFixed(1)}%`);
            console.groupEnd();
        }
    };

    // 9. Export to Global Scope
    window.SessionManager = SessionManager;
    window.EnhancedAuth = EnhancedAuth;
    window.EnhancedAPI = EnhancedAPI;
    window.ConnectionManager = ConnectionManager;
    window.ErrorManager = ErrorManager;
    window.initializeEnhancedSystems = initializeEnhancedSystems;
    
    // Debug helpers
    window.debugSession = DebugHelpers;
    
    console.log('📦 Enhanced Session Management components loaded');
    console.log('🔧 Call initializeEnhancedSystems() to activate');
    console.log('🐛 Use debugSession.enableDebug() for detailed logging');

})();
        
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
         * Queue requests when offline
         */
        queueRequest(endpoint, options) {
            this.requestQueue.push({ endpoint, options, timestamp: Date.now() });
            this.log('Queued request for later:', endpoint);
        },
        
        /**
         * Process queued requests when back online
         */
        async processQueue() {
            if (this.requestQueue.length === 0) return;
            
            this.log(`Processing ${this.requestQueue.length} queued requests`);
            
            const queue = [...this.requestQueue];
            this.requestQueue = [];
            
            for (const { endpoint, options } of queue) {
                try {
                    await this.request(endpoint, options);
                } catch (error) {
                    this.log('Queued request failed:', endpoint, error.message);
                    // Re-queue failed requests
                    this.requestQueue.push({ endpoint, options, timestamp: Date.now() });
                }
            }
        },