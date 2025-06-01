// functions/_shared/enhanced-auth.js
// Fixed version - Enhanced authentication utilities for all functions

/**
 * Consistent password hashing using crypto.subtle
 */
export async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + 'retreat_portal_salt_2024');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return '$retreat$' + hashHex;
}

/**
 * Verify password against stored hash
 */
export async function verifyPassword(password, storedHash) {
  const generatedHash = await hashPassword(password);
  return generatedHash === storedHash;
}

/**
 * Enhanced session management with conflict detection
 */
export class SessionManager {
    constructor(env) {
        this.env = env;
        this.sessionTimeout = 2 * 60 * 60 * 1000; // 2 hours
    }

    /**
     * Generate a unique session ID
     */
    generateSessionId() {
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substr(2, 9);
        return `sess_${timestamp}_${random}`;
    }

    /**
     * Create token with session tracking
     */
    async createToken(userInfo, userType = 'attendee') {
        const sessionId = this.generateSessionId();
        const timestamp = Date.now();
        
        const tokenData = {
            ...userInfo,
            sessionId,
            timestamp,
            userType,
            expiresAt: timestamp + this.sessionTimeout
        };

        // Store session in D1 database for conflict detection
        await this.storeSession(sessionId, tokenData);

        // Create JWT-like token (simplified for this example)
        const token = `${userType}-token-` + btoa(JSON.stringify(tokenData));
        
        return { token, sessionId };
    }

    /**
     * Store session information in database
     */
    async storeSession(sessionId, tokenData) {
        try {
            await this.env.DB.prepare(`
                INSERT OR REPLACE INTO active_sessions 
                (session_id, user_type, user_ref, created_at, expires_at, last_activity)
                VALUES (?, ?, ?, ?, ?, ?)
            `).bind(
                sessionId,
                tokenData.userType,
                tokenData.ref || tokenData.user,
                new Date(tokenData.timestamp).toISOString(),
                new Date(tokenData.expiresAt).toISOString(),
                new Date().toISOString()
            ).run();
        } catch (error) {
            console.error('Failed to store session:', error);
        }
    }

    /**
     * Validate token and check for conflicts
     */
    async validateToken(request) {
        const auth = request.headers.get('Authorization') || '';
        const token = auth.replace('Bearer ', '');
        const sessionId = request.headers.get('X-Session-ID');

        if (!token) return null;

        try {
            let tokenData;
            
            if (token.startsWith('admin-token-')) {
                tokenData = JSON.parse(atob(token.replace('admin-token-', '')));
            } else if (token.startsWith('attendee-token-')) {
                tokenData = JSON.parse(atob(token.replace('attendee-token-', '')));
            } else {
                return null;
            }

            // Check if token is expired
            if (Date.now() > tokenData.expiresAt) {
                await this.cleanupSession(tokenData.sessionId);
                return null;
            }

            // Update last activity
            await this.updateLastActivity(tokenData.sessionId);

            // Check for session conflicts
            const conflict = await this.checkSessionConflict(tokenData, sessionId);
            
            return {
                ...tokenData,
                hasConflict: conflict
            };
        } catch (error) {
            console.error('Token validation failed:', error);
            return null;
        }
    }

    /**
     * Check for session conflicts
     */
    async checkSessionConflict(tokenData, requestSessionId) {
        try {
            // Get all active sessions for this user
            const { results } = await this.env.DB.prepare(`
                SELECT session_id, last_activity 
                FROM active_sessions 
                WHERE user_type = ? AND user_ref = ? AND expires_at > ?
                ORDER BY last_activity DESC
            `).bind(
                tokenData.userType,
                tokenData.ref || tokenData.user,
                new Date().toISOString()
            ).all();

            // If there are multiple sessions and this isn't the most recent
            if (results.length > 1 && results[0].session_id !== tokenData.sessionId) {
                return true;
            }

            return false;
        } catch (error) {
            console.error('Session conflict check failed:', error);
            return false;
        }
    }

    /**
     * Update last activity timestamp
     */
    async updateLastActivity(sessionId) {
        try {
            await this.env.DB.prepare(`
                UPDATE active_sessions 
                SET last_activity = ? 
                WHERE session_id = ?
            `).bind(
                new Date().toISOString(),
                sessionId
            ).run();
        } catch (error) {
            console.error('Failed to update last activity:', error);
        }
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
            
            console.log(`Cleaned up ${result.changes} expired sessions`);
            return result.changes;
        } catch (error) {
            console.error('Session cleanup failed:', error);
            return 0;
        }
    }

    /**
     * Clean up specific session
     */
    async cleanupSession(sessionId) {
        try {
            await this.env.DB.prepare(`
                DELETE FROM active_sessions 
                WHERE session_id = ?
            `).bind(sessionId).run();
        } catch (error) {
            console.error('Failed to cleanup session:', error);
        }
    }

    /**
     * Get active sessions for user
     */
    async getActiveSessions(userType, userRef) {
        try {
            const { results } = await this.env.DB.prepare(`
                SELECT session_id, created_at, last_activity 
                FROM active_sessions 
                WHERE user_type = ? AND user_ref = ? AND expires_at > ?
                ORDER BY last_activity DESC
            `).bind(
                userType,
                userRef,
                new Date().toISOString()
            ).all();

            return results;
        } catch (error) {
            console.error('Failed to get active sessions:', error);
            return [];
        }
    }
}

/**
 * Rate limiting and request management
 */
export class RateLimiter {
    constructor(env) {
        this.env = env;
    }

    /**
     * Check rate limit for user/IP
     */
    async checkRateLimit(identifier, maxRequests = 100, windowMs = 60000) {
        const windowStart = Date.now() - windowMs;
        const key = `rate_limit_${identifier}`;

        try {
            // Get current request count
            const { results } = await this.env.DB.prepare(`
                SELECT COUNT(*) as count 
                FROM request_log 
                WHERE identifier = ? AND timestamp > ?
            `).bind(identifier, windowStart).all();

            const currentCount = results[0]?.count || 0;

            // Log this request
            await this.env.DB.prepare(`
                INSERT INTO request_log (identifier, timestamp)
                VALUES (?, ?)
            `).bind(identifier, Date.now()).run();

            // Clean up old entries
            await this.env.DB.prepare(`
                DELETE FROM request_log 
                WHERE timestamp < ?
            `).bind(windowStart).run();

            return {
                allowed: currentCount < maxRequests,
                remaining: Math.max(0, maxRequests - currentCount - 1),
                resetTime: Date.now() + windowMs
            };
        } catch (error) {
            console.error('Rate limiting error:', error);
            return { allowed: true, remaining: maxRequests, resetTime: Date.now() + windowMs };
        }
    }
}

/**
 * Create standardized JSON response with CORS headers
 */
export function createResponse(data, status = 200, sessionInfo = null) {
    const headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Session-ID',
        'Cache-Control': 'no-cache'
    };

    // Add session conflict header if detected
    if (sessionInfo?.hasConflict) {
        headers['X-Session-Conflict'] = 'true';
    }

    return new Response(JSON.stringify(data), { status, headers });
}

/**
 * Handle CORS preflight requests
 */
export function handleCORS() {
    return new Response(null, {
        status: 204,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Session-ID',
            'Access-Control-Max-Age': '86400'
        }
    });
}

/**
 * Enhanced admin authentication check
 */
export function checkAdminAuth(request, env) {
    const sessionMgr = new SessionManager(env);
    return sessionMgr.validateToken(request);
}

/**
 * Enhanced attendee authentication check
 */
export function checkAttendeeAuth(request, env) {
    const sessionMgr = new SessionManager(env);
    return sessionMgr.validateToken(request);
}