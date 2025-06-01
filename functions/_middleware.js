// functions/_middleware.js
// Enhanced middleware for session management, rate limiting, and security - FIXED VERSION

/**
 * Rate Limiter Class for request throttling (local version to avoid conflicts)
 */
class MiddlewareRateLimiter {
    constructor(env) {
        this.env = env;
    }

    /**
     * Check rate limit for identifier (IP + endpoint combination)
     */
    async checkRateLimit(identifier, maxRequests = 60, windowMs = 60000, endpoint = '') {
        const windowStart = Date.now() - windowMs;

        try {
            // Get current request count in the time window
            const { results } = await this.env.DB.prepare(`
                SELECT COUNT(*) as count 
                FROM request_log 
                WHERE identifier = ? AND timestamp > ? AND endpoint = ?
            `).bind(identifier, windowStart, endpoint).all();

            const currentCount = results[0]?.count || 0;

            // Log this request
            await this.env.DB.prepare(`
                INSERT INTO request_log (identifier, timestamp, endpoint, method)
                VALUES (?, ?, ?, ?)
            `).bind(identifier, Date.now(), endpoint, 'REQUEST').run();

            // Clean up old entries (done async, don't await)
            this.cleanupOldEntries(windowStart).catch(err => {
                console.warn('Cleanup failed:', err);
            });

            const remaining = Math.max(0, maxRequests - currentCount - 1);
            const resetTime = Date.now() + windowMs;

            return {
                allowed: currentCount < maxRequests,
                remaining,
                resetTime,
                currentCount: currentCount + 1,
                limit: maxRequests
            };
        } catch (error) {
            console.error('Rate limiting error:', error);
            // Allow request on error to avoid blocking service
            return { 
                allowed: true, 
                remaining: maxRequests, 
                resetTime: Date.now() + windowMs,
                currentCount: 0,
                limit: maxRequests
            };
        }
    }

    /**
     * Clean up old request log entries
     */
    async cleanupOldEntries(windowStart) {
        try {
            const result = await this.env.DB.prepare(`
                DELETE FROM request_log 
                WHERE timestamp < ?
            `).bind(windowStart - 86400000).run(); // Keep 24 hours of logs

            if (result.changes > 0) {
                console.log(`Cleaned up ${result.changes} old request log entries`);
            }
        } catch (error) {
            console.error('Request log cleanup failed:', error);
        }
    }

    /**
     * Check if identifier is temporarily blocked
     */
    async isBlocked(identifier) {
        try {
            const { results } = await this.env.DB.prepare(`
                SELECT blocked_until 
                FROM blocked_ips 
                WHERE identifier = ? AND blocked_until > ?
            `).bind(identifier, new Date().toISOString()).all();

            return results.length > 0;
        } catch (error) {
            console.error('Block check failed:', error);
            return false;
        }
    }

    /**
     * Block an identifier temporarily
     */
    async blockIdentifier(identifier, durationMs = 300000) { // 5 minutes default
        const blockedUntil = new Date(Date.now() + durationMs).toISOString();
        
        try {
            await this.env.DB.prepare(`
                INSERT OR REPLACE INTO blocked_ips (identifier, blocked_until, created_at)
                VALUES (?, ?, ?)
            `).bind(identifier, blockedUntil, new Date().toISOString()).run();

            console.log(`Blocked identifier ${identifier} until ${blockedUntil}`);
        } catch (error) {
            console.error('Failed to block identifier:', error);
        }
    }
}

/**
 * Session Manager for cleanup and validation (local version)
 */
class MiddlewareSessionManager {
    constructor(env) {
        this.env = env;
        this.sessionTimeout = 2 * 60 * 60 * 1000; // 2 hours
    }

    /**
     * Clean up expired sessions
     */
    async cleanupExpiredSessions() {
        try {
            const result = await this.env.DB.prepare(`
                DELETE FROM active_sessions 
                WHERE expires_at < ?
            `).bind(new Date().toISOString()).run();
            
            if (result.changes > 0) {
                console.log(`Cleaned up ${result.changes} expired sessions`);
            }
            
            return result.changes;
        } catch (error) {
            console.error('Session cleanup failed:', error);
            return 0;
        }
    }

    /**
     * Update session activity
     */
    async updateSessionActivity(sessionId) {
        if (!sessionId) return;

        try {
            await this.env.DB.prepare(`
                UPDATE active_sessions 
                SET last_activity = ? 
                WHERE session_id = ?
            `).bind(new Date().toISOString(), sessionId).run();
        } catch (error) {
            console.error('Failed to update session activity:', error);
        }
    }

    /**
     * Get session statistics
     */
    async getSessionStats() {
        try {
            const { results } = await this.env.DB.prepare(`
                SELECT 
                    user_type,
                    COUNT(*) as active_sessions,
                    AVG(julianday('now') - julianday(last_activity)) * 24 * 60 as avg_idle_minutes
                FROM active_sessions 
                WHERE expires_at > datetime('now')
                GROUP BY user_type
            `).all();

            return results;
        } catch (error) {
            console.error('Failed to get session stats:', error);
            return [];
        }
    }
}

/**
 * Security utilities
 */
class SecurityManager {
    /**
     * Check for suspicious patterns in requests
     */
    static isSuspiciousRequest(request, url) {
        const suspiciousPatterns = [
            /\.\./,                    // Path traversal
            /<script/i,                // XSS attempts
            /union.*select/i,          // SQL injection
            /javascript:/i,            // JavaScript protocol
            /data:.*base64/i,          // Data URI with base64
            /(eval|exec|system)\(/i,   // Code execution attempts
        ];

        // Check URL path
        const path = url.pathname + url.search;
        for (const pattern of suspiciousPatterns) {
            if (pattern.test(path)) {
                return true;
            }
        }

        // Check headers for suspicious content
        const userAgent = request.headers.get('user-agent') || '';
        const referer = request.headers.get('referer') || '';
        
        if (userAgent.length > 1000 || referer.length > 1000) {
            return true; // Unusually long headers
        }

        return false;
    }

    /**
     * Validate request size
     */
    static isRequestTooLarge(request) {
        const contentLength = request.headers.get('content-length');
        if (contentLength) {
            const size = parseInt(contentLength);
            return size > 10 * 1024 * 1024; // 10MB limit
        }
        return false;
    }

    /**
     * Check for bot-like behavior
     */
    static isBotLike(request) {
        const userAgent = (request.headers.get('user-agent') || '').toLowerCase();
        
        const botPatterns = [
            /bot/i, /crawler/i, /spider/i, /scraper/i,
            /curl/i, /wget/i, /python/i, /requests/i
        ];

        return botPatterns.some(pattern => pattern.test(userAgent));
    }
}

/**
 * Performance monitoring
 */
class PerformanceMonitor {
    constructor() {
        this.requestTimes = new Map();
    }

    startTiming(requestId) {
        this.requestTimes.set(requestId, Date.now());
    }

    endTiming(requestId) {
        const startTime = this.requestTimes.get(requestId);
        if (startTime) {
            const duration = Date.now() - startTime;
            this.requestTimes.delete(requestId);
            return duration;
        }
        return 0;
    }

    static generateRequestId() {
        return Math.random().toString(36).substr(2, 9);
    }
}

/**
 * Main middleware function
 */
export async function onRequest(context) {
    const { request, env, next } = context;
    const url = new URL(request.url);
    const method = request.method;
    const startTime = Date.now();
    const requestId = PerformanceMonitor.generateRequestId();
    
    // Initialize managers
    const rateLimiter = new MiddlewareRateLimiter(env);
    const sessionManager = new MiddlewareSessionManager(env);
    const performanceMonitor = new PerformanceMonitor();
    
    performanceMonitor.startTiming(requestId);

    try {
        // Skip middleware for certain paths
        const skipPaths = [
            '/favicon.ico',
            '/robots.txt',
            '/sitemap.xml',
            '/_next/',
            '/static/',
            '/public/',
            '/assets/',
            '/css/',
            '/js/',
            '/images/',
            '/fonts/'
        ];

        const shouldSkip = skipPaths.some(path => url.pathname.includes(path));
        if (shouldSkip) {
            return next();
        }

        // Get client information
        const clientIP = request.headers.get('CF-Connecting-IP') || 
                        request.headers.get('X-Forwarded-For') || 
                        request.headers.get('X-Real-IP') || 
                        'unknown';
        
        const userAgent = request.headers.get('User-Agent') || '';
        const sessionId = request.headers.get('X-Session-ID') || '';

        console.log(`${method} ${url.pathname} from ${clientIP} (${sessionId || 'no-session'})`);

        // Security checks
        if (SecurityManager.isSuspiciousRequest(request, url)) {
            console.warn(`Suspicious request detected from ${clientIP}: ${url.pathname}`);
            
            // Block IP temporarily
            await rateLimiter.blockIdentifier(clientIP, 300000); // 5 minutes
            
            return new Response('Suspicious request detected', { 
                status: 403,
                headers: {
                    'Content-Type': 'text/plain',
                    'X-Blocked-Reason': 'suspicious-pattern'
                }
            });
        }

        // Check if request is too large
        if (SecurityManager.isRequestTooLarge(request)) {
            console.warn(`Request too large from ${clientIP}: ${request.headers.get('content-length')} bytes`);
            
            return new Response('Request entity too large', { 
                status: 413,
                headers: {
                    'Content-Type': 'text/plain'
                }
            });
        }

        // Check if IP is blocked
        const isBlocked = await rateLimiter.isBlocked(clientIP);
        if (isBlocked) {
            console.warn(`Blocked IP attempted access: ${clientIP}`);
            
            return new Response('Access temporarily blocked', { 
                status: 429,
                headers: {
                    'Content-Type': 'text/plain',
                    'Retry-After': '300'
                }
            });
        }

        // Rate limiting for API endpoints
        if (url.pathname.startsWith('/api/')) {
            const endpoint = url.pathname;
            const identifier = `${clientIP}_${endpoint}`;
            
            // Different limits for different endpoints
            let maxRequests = 60; // Default: 60 requests per minute
            let windowMs = 60000;   // 1 minute window
            
            // Stricter limits for sensitive endpoints
            if (endpoint.includes('/login') || endpoint.includes('/admin/login')) {
                maxRequests = 5;   // Only 5 login attempts per minute
                windowMs = 60000;
            } else if (endpoint.includes('/upload') || endpoint.includes('/bulk')) {
                maxRequests = 3;   // Only 3 upload attempts per 5 minutes
                windowMs = 300000; // 5 minute window
            } else if (endpoint.includes('/admin/')) {
                maxRequests = 100; // Higher limit for admin operations
                windowMs = 60000;
            }

            // Special handling for bots (stricter limits)
            if (SecurityManager.isBotLike(request)) {
                maxRequests = Math.floor(maxRequests / 4); // Quarter the limit for bots
                console.log(`Bot-like request detected, applying stricter limits: ${maxRequests}`);
            }

            const rateLimit = await rateLimiter.checkRateLimit(identifier, maxRequests, windowMs, endpoint);
            
            if (!rateLimit.allowed) {
                console.warn(`Rate limit exceeded for ${clientIP} on ${endpoint}: ${rateLimit.currentCount}/${rateLimit.limit}`);
                
                // Temporarily block aggressive users
                if (rateLimit.currentCount > rateLimit.limit * 2) {
                    await rateLimiter.blockIdentifier(clientIP, 600000); // 10 minutes
                }
                
                return new Response(JSON.stringify({ 
                    error: 'Rate limit exceeded',
                    limit: rateLimit.limit,
                    remaining: 0,
                    resetTime: rateLimit.resetTime
                }), { 
                    status: 429,
                    headers: {
                        'Content-Type': 'application/json',
                        'X-RateLimit-Limit': rateLimit.limit.toString(),
                        'X-RateLimit-Remaining': '0',
                        'X-RateLimit-Reset': rateLimit.resetTime.toString(),
                        'Retry-After': Math.ceil((rateLimit.resetTime - Date.now()) / 1000).toString()
                    }
                });
            }
        }

        // Periodic cleanup (1% chance on each request to avoid overload)
        if (Math.random() < 0.01) {
            // Run cleanup in background (don't await to avoid slowing down requests)
            Promise.all([
                sessionManager.cleanupExpiredSessions(),
                rateLimiter.cleanupOldEntries(Date.now() - 86400000) // 24 hours ago
            ]).catch(error => {
                console.error('Background cleanup failed:', error);
            });
        }

        // Update session activity if session ID is provided
        if (sessionId) {
            // Don't await this to avoid slowing down the request
            sessionManager.updateSessionActivity(sessionId).catch(error => {
                console.warn('Failed to update session activity:', error);
            });
        }

        // Continue to the next handler
        const response = await next();

        // Calculate response time
        const responseTime = performanceMonitor.endTiming(requestId);
        const totalTime = Date.now() - startTime;

        // Add security and performance headers
        const enhancedResponse = new Response(response.body, {
            status: response.status,
            statusText: response.statusText,
            headers: response.headers
        });

        // Security headers
        enhancedResponse.headers.set('X-Content-Type-Options', 'nosniff');
        enhancedResponse.headers.set('X-Frame-Options', 'DENY');
        enhancedResponse.headers.set('X-XSS-Protection', '1; mode=block');
        enhancedResponse.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
        enhancedResponse.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
        
        // Performance headers
        enhancedResponse.headers.set('X-Response-Time', `${totalTime}ms`);
        enhancedResponse.headers.set('X-Request-ID', requestId);
        
        // Rate limit headers for API responses
        if (url.pathname.startsWith('/api/') && response.status !== 429) {
            const endpoint = url.pathname;
            const identifier = `${clientIP}_${endpoint}`;
            
            // Get current rate limit status (quick check)
            try {
                const rateCheck = await rateLimiter.checkRateLimit(identifier, 60, 60000, endpoint);
                enhancedResponse.headers.set('X-RateLimit-Limit', '60');
                enhancedResponse.headers.set('X-RateLimit-Remaining', rateCheck.remaining.toString());
                enhancedResponse.headers.set('X-RateLimit-Reset', rateCheck.resetTime.toString());
            } catch (error) {
                // Don't fail the request if rate limit check fails
                console.warn('Rate limit header generation failed:', error);
            }
        }

        // CORS headers for API endpoints
        if (url.pathname.startsWith('/api/')) {
            enhancedResponse.headers.set('Access-Control-Allow-Origin', '*');
            enhancedResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
            enhancedResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Session-ID');
            enhancedResponse.headers.set('Access-Control-Expose-Headers', 'X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset, X-Session-Conflict');
        }

        // Cache control headers
        if (url.pathname.startsWith('/api/')) {
            enhancedResponse.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
            enhancedResponse.headers.set('Pragma', 'no-cache');
            enhancedResponse.headers.set('Expires', '0');
        } else if (url.pathname.includes('/static/') || url.pathname.includes('/assets/')) {
            enhancedResponse.headers.set('Cache-Control', 'public, max-age=31536000'); // 1 year
        }

        // Log slow requests for monitoring
        if (totalTime > 1000) { // Requests taking longer than 1 second
            console.warn(`Slow request: ${method} ${url.pathname} took ${totalTime}ms`);
        }

        // Log API request metrics
        if (url.pathname.startsWith('/api/')) {
            console.log(`API ${method} ${url.pathname}: ${response.status} in ${totalTime}ms`);
        }

        return enhancedResponse;

    } catch (error) {
        console.error('Middleware error:', error);

        // Log error to database if possible
        try {
            await env.DB.prepare(`
                INSERT INTO error_log (error_message, error_context, timestamp, url)
                VALUES (?, ?, ?, ?)
            `).bind(
                error.message,
                'middleware_error',
                new Date().toISOString(),
                url.toString()
            ).run();
        } catch (logError) {
            console.error('Failed to log error to database:', logError);
        }

        // Return error response
        return new Response(JSON.stringify({
            error: 'Internal server error',
            requestId: requestId
        }), {
            status: 500,
            headers: {
                'Content-Type': 'application/json',
                'X-Request-ID': requestId
            }
        });
    }
}

/**
 * Handle OPTIONS requests for CORS preflight
 */
export async function onRequestOptions(context) {
    return new Response(null, {
        status: 204,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Session-ID',
            'Access-Control-Max-Age': '86400', // 24 hours
            'Cache-Control': 'public, max-age=86400'
        }
    });
}