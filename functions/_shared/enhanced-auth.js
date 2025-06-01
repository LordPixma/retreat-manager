// Backend improvements for handling multiple concurrent sessions

// 1. Enhanced Authentication with Session Tracking
// functions/_shared/enhanced-auth.js

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
        } catch (error) {
            console.error('Session cleanup failed:', error);
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

// 2. Enhanced Auth Functions with Session Management
// functions/_shared/enhanced-auth.js (continued)

const sessionManager = new SessionManager();

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

/**
 * Create response with session conflict headers
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

// 3. Rate Limiting and Request Deduplication
// functions/_shared/rate-limiter.js

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

// 4. Enhanced Database Schema
// migrations/003_session_management.sql

const sessionTables = `
-- Active sessions table for conflict detection
CREATE TABLE IF NOT EXISTS active_sessions (
    session_id TEXT PRIMARY KEY,
    user_type TEXT NOT NULL,
    user_ref TEXT NOT NULL,
    created_at DATETIME NOT NULL,
    expires_at DATETIME NOT NULL,
    last_activity DATETIME NOT NULL,
    ip_address TEXT,
    user_agent TEXT
);

-- Request logging for rate limiting
CREATE TABLE IF NOT EXISTS request_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    identifier TEXT NOT NULL,
    timestamp INTEGER NOT NULL,
    endpoint TEXT,
    method TEXT
);

-- Error logging
CREATE TABLE IF NOT EXISTS error_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT,
    error_message TEXT NOT NULL,
    error_context TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    user_agent TEXT,
    url TEXT
);

-- Announcements table (if not exists)
CREATE TABLE IF NOT EXISTS announcements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    type TEXT DEFAULT 'general',
    priority INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT 1,
    target_audience TEXT DEFAULT 'all',
    target_groups TEXT,
    author_name TEXT,
    starts_at DATETIME,
    expires_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_active_sessions_user ON active_sessions(user_type, user_ref);
CREATE INDEX IF NOT EXISTS idx_active_sessions_expires ON active_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_request_log_identifier ON request_log(identifier, timestamp);
CREATE INDEX IF NOT EXISTS idx_announcements_active ON announcements(is_active, target_audience);
`;

// 5. Enhanced Login Endpoint
// functions/api/enhanced-login.js

import { SessionManager, RateLimiter, createResponse, verifyPassword } from '../_shared/enhanced-auth.js';

export async function onRequestPost(context) {
    const rateLimiter = new RateLimiter(context.env);
    const sessionManager = new SessionManager(context.env);
    
    try {
        const clientIP = context.request.headers.get('CF-Connecting-IP') || 'unknown';
        
        // Rate limiting
        const rateLimit = await rateLimiter.checkRateLimit(clientIP, 10, 60000); // 10 requests per minute
        if (!rateLimit.allowed) {
            return createResponse({ 
                error: 'Too many login attempts. Please try again later.' 
            }, 429);
        }

        const { ref, password } = await context.request.json();
        
        if (!ref || !password) {
            return createResponse({ error: 'Login failed' }, 500);
    }
}

// 6. Middleware for Session Management
// functions/_middleware.js

export async function onRequest(context) {
    const { request, env, next } = context;
    
    // Skip middleware for certain paths
    const skipPaths = ['/api/ping', '/api/health', '/favicon.ico'];
    const url = new URL(request.url);
    
    if (skipPaths.some(path => url.pathname.includes(path))) {
        return next();
    }

    try {
        // Initialize managers
        const sessionManager = new SessionManager(env);
        const rateLimiter = new RateLimiter(env);
        
        // Clean up expired sessions periodically
        if (Math.random() < 0.01) { // 1% chance on each request
            await sessionManager.cleanupExpiredSessions();
        }
        
        // Rate limiting for API endpoints
        if (url.pathname.startsWith('/api/')) {
            const clientIP = request.headers.get('CF-Connecting-IP') || 'unknown';
            const identifier = `${clientIP}_${url.pathname}`;
            
            const rateLimit = await rateLimiter.checkRateLimit(identifier, 60, 60000);
            if (!rateLimit.allowed) {
                return new Response(JSON.stringify({ 
                    error: 'Rate limit exceeded' 
                }), { 
                    status: 429,
                    headers: {
                        'Content-Type': 'application/json',
                        'X-RateLimit-Remaining': '0',
                        'X-RateLimit-Reset': rateLimit.resetTime.toString()
                    }
                });
            }
        }
        
        // Continue to the next handler
        const response = await next();
        
        // Add security headers
        response.headers.set('X-Content-Type-Options', 'nosniff');
        response.headers.set('X-Frame-Options', 'DENY');
        response.headers.set('X-XSS-Protection', '1; mode=block');
        
        return response;
        
    } catch (error) {
        console.error('Middleware error:', error);
        return next(); // Continue on middleware errors
    }
}

// 7. Health Check and Ping Endpoints
// functions/api/ping.js

export async function onRequestGet(context) {
    const sessionId = context.request.headers.get('X-Session-ID');
    
    return new Response(JSON.stringify({
        status: 'ok',
        timestamp: new Date().toISOString(),
        sessionId: sessionId || 'none'
    }), {
        headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache'
        }
    });
}

// functions/api/health.js
export async function onRequestGet(context) {
    try {
        // Quick database health check
        const { results } = await context.env.DB.prepare('SELECT 1 as test').all();
        
        return new Response(JSON.stringify({
            status: 'healthy',
            timestamp: new Date().toISOString(),
            database: results.length > 0 ? 'connected' : 'disconnected'
        }), {
            headers: {
                'Content-Type': 'application/json'
            }
        });
    } catch (error) {
        return new Response(JSON.stringify({
            status: 'unhealthy',
            error: error.message,
            timestamp: new Date().toISOString()
        }), {
            status: 503,
            headers: {
                'Content-Type': 'application/json'
            }
        });
    }
}

// 8. Error Logging Endpoint
// functions/api/errors.js

import { createResponse } from '../_shared/enhanced-auth.js';

export async function onRequestPost(context) {
    try {
        const errorData = await context.request.json();
        const sessionId = context.request.headers.get('X-Session-ID') || 'unknown';
        
        // Store error in database
        await context.env.DB.prepare(`
            INSERT INTO error_log 
            (session_id, error_message, error_context, user_agent, url)
            VALUES (?, ?, ?, ?, ?)
        `).bind(
            sessionId,
            errorData.message || 'Unknown error',
            errorData.context || '',
            errorData.userAgent || '',
            errorData.url || ''
        ).run();
        
        return createResponse({ success: true });
        
    } catch (error) {
        console.error('Error logging failed:', error);
        return createResponse({ error: 'Failed to log error' }, 500);
    }
}

// 9. Enhanced Admin Dashboard API with Concurrency Safety
// functions/api/admin/attendees/index.js (enhanced version)

import { SessionManager, RateLimiter, createResponse } from '../../../_shared/enhanced-auth.js';

export async function onRequestGet(context) {
    const sessionManager = new SessionManager(context.env);
    
    try {
        // Enhanced authentication with session conflict detection
        const user = await sessionManager.validateToken(context.request);
        if (!user || user.userType !== 'admin') {
            return createResponse({ error: 'Unauthorized' }, 401);
        }
        
        // Use database transaction for consistency
        const { results } = await context.env.DB.prepare(`
            SELECT 
                a.id,
                a.ref_number,
                a.name,
                a.email,
                a.payment_due,
                a.room_id,
                a.group_id,
                r.number AS room_number,
                g.name AS group_name
            FROM attendees a
            LEFT JOIN rooms r ON a.room_id = r.id
            LEFT JOIN groups g ON a.group_id = g.id
            ORDER BY a.name
        `).all();
        
        const formattedResults = results.map(attendee => ({
            id: attendee.id,
            ref_number: attendee.ref_number,
            name: attendee.name,
            email: attendee.email,
            payment_due: attendee.payment_due || 0,
            room_id: attendee.room_id,
            group_id: attendee.group_id,
            room: attendee.room_number ? { number: attendee.room_number } : null,
            group: attendee.group_name ? { name: attendee.group_name } : null
        }));
        
        return createResponse(formattedResults, 200, user);
        
    } catch (error) {
        console.error('Error fetching attendees:', error);
        return createResponse({ error: 'Failed to fetch attendees' }, 500);
    }
}

// Enhanced POST with conflict detection
export async function onRequestPost(context) {
    const sessionManager = new SessionManager(context.env);
    
    try {
        const user = await sessionManager.validateToken(context.request);
        if (!user || user.userType !== 'admin') {
            return createResponse({ error: 'Unauthorized' }, 401);
        }
        
        const { name, email, ref_number, password, room_id, group_id, payment_due } = 
            await context.request.json();
        
        // Validate required fields
        if (!name?.trim() || !ref_number?.trim() || !password?.trim()) {
            return createResponse({ 
                error: 'Name, reference number, and password are required' 
            }, 400);
        }
        
        // Use transaction for atomicity
        try {
            await context.env.DB.prepare('BEGIN TRANSACTION').run();
            
            // Check for existing reference number
            const { results: existing } = await context.env.DB.prepare(`
                SELECT id FROM attendees WHERE ref_number = ?
            `).bind(ref_number.trim()).all();
            
            if (existing.length > 0) {
                await context.env.DB.prepare('ROLLBACK').run();
                return createResponse({ error: 'Reference number already exists' }, 409);
            }
            
            // Hash password
            const password_hash = await hashPassword(password);
            
            // Insert new attendee
            const result = await context.env.DB.prepare(`
                INSERT INTO attendees (name, email, ref_number, password_hash, room_id, group_id, payment_due)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `).bind(
                name.trim(),
                email?.trim() || null,
                ref_number.trim(),
                password_hash,
                room_id || null,
                group_id || null,
                payment_due || 0
            ).run();
            
            await context.env.DB.prepare('COMMIT').run();
            
            return createResponse({ 
                id: result.meta.last_row_id,
                message: 'Attendee created successfully'
            }, 201, user);
            
        } catch (dbError) {
            await context.env.DB.prepare('ROLLBACK').run();
            throw dbError;
        }
        
    } catch (error) {
        console.error('Error creating attendee:', error);
        
        if (error.message.includes('UNIQUE constraint failed')) {
            return createResponse({ error: 'Reference number already exists' }, 409);
        }
        
        return createResponse({ error: 'Failed to create attendee' }, 500);
    }
}

// 10. Real-time Updates with Server-Sent Events
// functions/api/events/stream.js

export async function onRequestGet(context) {
    const sessionManager = new SessionManager(context.env);
    
    try {
        const user = await sessionManager.validateToken(context.request);
        if (!user) {
            return new Response('Unauthorized', { status: 401 });
        }
        
        // Create Server-Sent Events stream
        const stream = new ReadableStream({
            start(controller) {
                // Send initial connection message
                const data = `data: ${JSON.stringify({
                    type: 'connected',
                    timestamp: new Date().toISOString(),
                    sessionId: user.sessionId
                })}\n\n`;
                
                controller.enqueue(new TextEncoder().encode(data));
                
                // Set up periodic heartbeat
                const heartbeat = setInterval(() => {
                    try {
                        const heartbeatData = `data: ${JSON.stringify({
                            type: 'heartbeat',
                            timestamp: new Date().toISOString()
                        })}\n\n`;
                        
                        controller.enqueue(new TextEncoder().encode(heartbeatData));
                    } catch (error) {
                        clearInterval(heartbeat);
                        controller.close();
                    }
                }, 30000); // Every 30 seconds
                
                // Clean up on close
                context.request.signal?.addEventListener('abort', () => {
                    clearInterval(heartbeat);
                    controller.close();
                });
            }
        });
        
        return new Response(stream, {
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Authorization, X-Session-ID'
            }
        });
        
    } catch (error) {
        console.error('SSE stream error:', error);
        return new Response('Internal Server Error', { status: 500 });
    }
}

// 11. Database Optimization Queries
const optimizationQueries = `
-- Add composite indexes for better performance
CREATE INDEX IF NOT EXISTS idx_attendees_composite ON attendees(ref_number, name);
CREATE INDEX IF NOT EXISTS idx_active_sessions_composite ON active_sessions(user_type, user_ref, expires_at);
CREATE INDEX IF NOT EXISTS idx_request_log_cleanup ON request_log(timestamp);

-- Create materialized view for dashboard stats (simulated with regular view)
CREATE VIEW IF NOT EXISTS dashboard_stats AS
SELECT 
    COUNT(DISTINCT a.id) as total_attendees,
    COUNT(DISTINCT CASE WHEN a.room_id IS NOT NULL THEN a.id END) as attendees_with_rooms,
    COUNT(DISTINCT r.id) as total_rooms,
    COUNT(DISTINCT g.id) as total_groups,
    SUM(a.payment_due) as total_payment_due,
    COUNT(DISTINCT CASE WHEN a.payment_due > 0 THEN a.id END) as attendees_with_dues,
    COUNT(DISTINCT CASE WHEN ann.is_active = 1 THEN ann.id END) as active_announcements
FROM attendees a
LEFT JOIN rooms r ON a.room_id = r.id
LEFT JOIN groups g ON a.group_id = g.id
LEFT JOIN announcements ann ON ann.is_active = 1;

-- Cleanup procedure for old data
-- This would be called periodically via cron job
CREATE TRIGGER IF NOT EXISTS cleanup_old_request_logs
AFTER INSERT ON request_log
BEGIN
    DELETE FROM request_log 
    WHERE timestamp < (NEW.timestamp - 86400000); -- 24 hours ago
END;
`;

// 12. Frontend Integration Helper
// Add to frontend/public/js/enhanced-integration.js

const EnhancedIntegration = {
    eventSource: null,
    reconnectAttempts: 0,
    maxReconnectAttempts: 5,
    
    /**
     * Initialize real-time connection
     */
    initializeRealTime() {
        if (!window.EventSource) {
            console.warn('Server-Sent Events not supported');
            return;
        }
        
        this.connectEventStream();
    },
    
    connectEventStream() {
        try {
            const token = EnhancedAuth.getToken('admin') || EnhancedAuth.getToken('attendee');
            if (!token) return;
            
            this.eventSource = new EventSource('/api/events/stream', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'X-Session-ID': SessionManager.sessionId
                }
            });
            
            this.eventSource.onopen = () => {
                console.log('Real-time connection established');
                this.reconnectAttempts = 0;
            };
            
            this.eventSource.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    this.handleRealTimeMessage(data);
                } catch (error) {
                    console.error('Failed to parse SSE message:', error);
                }
            };
            
            this.eventSource.onerror = (error) => {
                console.error('SSE connection error:', error);
                this.handleConnectionError();
            };
            
        } catch (error) {
            console.error('Failed to establish SSE connection:', error);
        }
    },
    
    handleRealTimeMessage(data) {
        switch (data.type) {
            case 'connected':
                Utils.showAlert('Real-time updates connected', 'success');
                break;
            case 'data_updated':
                this.handleDataUpdate(data);
                break;
            case 'session_conflict':
                SessionManager.handleSessionConflict(data.userType);
                break;
            case 'heartbeat':
                // Connection is alive
                break;
        }
    },
    
    handleDataUpdate(data) {
        // Refresh relevant components
        if (data.entity === 'attendees' && window.AdminDashboard) {
            AdminDashboard.loadAttendees();
        } else if (data.entity === 'announcements' && window.AttendeeDashboard) {
            AttendeeDashboard.loadData();
        }
    },
    
    handleConnectionError() {
        this.eventSource?.close();
        
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            const delay = Math.pow(2, this.reconnectAttempts) * 1000; // Exponential backoff
            
            setTimeout(() => {
                console.log(`Attempting SSE reconnect ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
                this.connectEventStream();
            }, delay);
        } else {
            Utils.showAlert('Real-time connection failed. Please refresh the page.', 'error');
        }
    },
    
    disconnect() {
        this.eventSource?.close();
        this.eventSource = null;
    }
};

// Add to window
window.EnhancedIntegration = EnhancedIntegration;: 'Missing credentials' }, 400);
        }

        // Get attendee
        const { results } = await context.env.DB.prepare(`
            SELECT id, ref_number, password_hash, name
            FROM attendees 
            WHERE ref_number = ?
        `).bind(ref.trim()).all();

        if (!results.length) {
            return createResponse({ error: 'Invalid credentials' }, 401);
        }

        const attendee = results[0];
        
        // Verify password
        const isValid = await verifyPassword(password, attendee.password_hash);
        if (!isValid) {
            return createResponse({ error: 'Invalid credentials' }, 401);
        }

        // Check for existing sessions
        const existingSessions = await sessionManager.getActiveSessions('attendee', ref);
        
        // Create new session
        const { token, sessionId } = await sessionManager.createToken({
            ref: attendee.ref_number,
            name: attendee.name,
            id: attendee.id
        }, 'attendee');

        // Clean up old sessions if too many
        if (existingSessions.length > 3) {
            for (const session of existingSessions.slice(3)) {
                await sessionManager.cleanupSession(session.session_id);
            }
        }

        const response = createResponse({ 
            token,
            sessionId,
            existingSessions: existingSessions.length
        });

        // Add rate limit headers
        response.headers.set('X-RateLimit-Remaining', rateLimit.remaining.toString());
        response.headers.set('X-RateLimit-Reset', rateLimit.resetTime.toString());

        return response;

    } catch (error) {
        console.error('Enhanced login error:', error);
        return createResponse({ error