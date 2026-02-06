/**
 * Analytics Middleware - Lightweight hooks for tracking API activity
 * Integrates with AnalyticsProvider for non-blocking event logging
 */

const { getAnalyticsProvider } = require('./analyticsProvider');

/**
 * Middleware for tracking chat endpoint performance and agent selection
 */
function chatAnalyticsMiddleware() {
  const analytics = getAnalyticsProvider();
  
  return async (req, res, next) => {
    const startTime = Date.now();
    
    // Capture original send method
    const originalSend = res.send;
    
    // Override send to capture response data
    res.send = function(data) {
      const latency = Date.now() - startTime;
      
      // Parse response to extract agent info
      try {
        const responseData = typeof data === 'string' ? JSON.parse(data) : data;
        
        // Log latency
        analytics.logLatency('/api/chat', latency, responseData.selectedAgent || 'unknown');
        
        // Log agent usage if available
        if (responseData.selectedAgent) {
          analytics.logAgentUsage(responseData.selectedAgent, {
            sessionId: req.body?.sessionId,
            messageType: responseData.type
          });
        }
        
        // Log memory event if status available
        if (responseData.memoryStatus) {
          const { currentWindowSize, summaryCount } = responseData.memoryStatus;
          analytics.logMemoryEvent(
            req.body?.sessionId || 'unknown',
            currentWindowSize,
            summaryCount
          );
        }
        
        // Log terminal command execution
        if (responseData.type === 'terminal' && responseData.response?.terminalCommand) {
          analytics.logCommandExecution(
            responseData.response.terminalCommand,
            !responseData.response.requiresApproval,
            responseData.response.requiresApproval
          );
        }
        
      } catch (error) {
        // Silent fail - don't break response
        console.error('Analytics middleware error:', error.message);
      }
      
      // Call original send
      return originalSend.call(this, data);
    };
    
    next();
  };
}

/**
 * Middleware for tracking War Room reviews
 */
function warRoomAnalyticsMiddleware() {
  const analytics = getAnalyticsProvider();
  
  return async (req, res, next) => {
    const startTime = Date.now();
    
    const originalSend = res.send;
    
    res.send = function(data) {
      const latency = Date.now() - startTime;
      
      try {
        const responseData = typeof data === 'string' ? JSON.parse(data) : data;
        
        // Log War Room review
        if (responseData.verdict) {
          analytics.logWarRoomReview(
            responseData.verdict,
            responseData.qualityScore || 0,
            {
              criticalIssues: responseData.criticalIssues || [],
              testCount: responseData.testing?.testCount || 0
            }
          );
        }
        
        // Log latency
        analytics.logLatency('/api/war-room', latency, 'war-room');
        
      } catch (error) {
        console.error('War Room analytics error:', error.message);
      }
      
      return originalSend.call(this, data);
    };
    
    next();
  };
}

/**
 * Middleware for tracking session operations
 */
function sessionAnalyticsMiddleware(action) {
  const analytics = getAnalyticsProvider();
  
  return async (req, res, next) => {
    try {
      const sessionId = req.params.sessionId || req.body?.sessionId || 'unknown';
      
      // Log session activity
      analytics.logSessionActivity(sessionId, action);
      
    } catch (error) {
      console.error('Session analytics error:', error.message);
    }
    
    next();
  };
}

/**
 * Global error tracking middleware
 */
function errorAnalyticsMiddleware() {
  const analytics = getAnalyticsProvider();
  
  return (err, req, res, next) => {
    // Log error
    analytics.logError(err.name || 'UnknownError', err.message);
    
    // Pass error to next handler
    next(err);
  };
}

/**
 * WebSocket connection analytics wrapper
 * Usage: Wrap WebSocket event handlers
 */
class WebSocketAnalytics {
  constructor() {
    this.analytics = getAnalyticsProvider();
    this.connections = new Map();
  }
  
  /**
   * Track new WebSocket connection
   * @param {WebSocket} ws - WebSocket instance
   * @param {string} connectionId - Unique connection identifier
   */
  onConnection(ws, connectionId) {
    this.connections.set(connectionId, {
      connectedAt: Date.now(),
      commandCount: 0
    });
    
    this.analytics.logWebSocketEvent('connect', connectionId);
    
    // Track disconnect
    ws.on('close', () => {
      this.onDisconnect(connectionId);
    });
    
    // Track errors
    ws.on('error', (error) => {
      this.analytics.logWebSocketEvent('error', connectionId);
      this.analytics.logError('WebSocketError', error.message);
    });
  }
  
  /**
   * Track WebSocket disconnection
   * @param {string} connectionId - Connection identifier
   */
  onDisconnect(connectionId) {
    this.analytics.logWebSocketEvent('disconnect', connectionId);
    this.connections.delete(connectionId);
  }
  
  /**
   * Track command execution via WebSocket
   * @param {string} connectionId - Connection identifier
   * @param {string} command - Command that was executed
   * @param {boolean} approved - Whether command was approved
   */
  onCommandExecuted(connectionId, command, approved = true) {
    const conn = this.connections.get(connectionId);
    if (conn) {
      conn.commandCount++;
    }
    
    this.analytics.logCommandExecution(command, approved, !approved);
  }
  
  /**
   * Get active connections count
   * @returns {number} Number of active WebSocket connections
   */
  getActiveCount() {
    return this.connections.size;
  }
}

/**
 * Express middleware wrapper for analytics initialization
 * Attaches analytics instance to request object
 */
function initAnalyticsMiddleware() {
  const analytics = getAnalyticsProvider();
  
  return (req, res, next) => {
    req.analytics = analytics;
    next();
  };
}

/**
 * Request timing middleware
 * Tracks overall API request latency
 */
function timingMiddleware() {
  const analytics = getAnalyticsProvider();
  
  return (req, res, next) => {
    const startTime = Date.now();
    
    // Track when response finishes
    res.on('finish', () => {
      const latency = Date.now() - startTime;
      const endpoint = req.path;
      
      analytics.logLatency(endpoint, latency, null);
    });
    
    next();
  };
}

module.exports = {
  chatAnalyticsMiddleware,
  warRoomAnalyticsMiddleware,
  sessionAnalyticsMiddleware,
  errorAnalyticsMiddleware,
  initAnalyticsMiddleware,
  timingMiddleware,
  WebSocketAnalytics
};
