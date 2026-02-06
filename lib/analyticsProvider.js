/**
 * Analytics Provider - Non-blocking event logging for Lumen Core
 * Tracks agent usage, latency, war room metrics, and memory patterns
 * Uses Redis for real-time metrics and batch exports for historical data
 */

const Redis = require('ioredis');

class AnalyticsProvider {
  constructor(options = {}) {
    this.redis = new Redis({
      host: options.redisHost || process.env.REDIS_HOST || 'localhost',
      port: options.redisPort || process.env.REDIS_PORT || 6379,
      password: options.redisPassword || process.env.REDIS_PASSWORD || undefined,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      lazyConnect: false
    });

    this.redis.on('error', (err) => {
      console.error('❌ Analytics Redis Error:', err.message);
    });

    this.redis.on('connect', () => {
      console.log('📊 Analytics Provider connected to Redis');
    });

    // Key prefixes for organized data structure
    this.keys = {
      agentUsage: 'lumen:stats:agent_usage',
      latency: 'lumen:stats:latency',
      warRoom: 'lumen:stats:war_room',
      memory: 'lumen:stats:memory',
      websockets: 'lumen:stats:websockets',
      errors: 'lumen:stats:errors',
      sessions: 'lumen:stats:sessions',
      commands: 'lumen:stats:commands'
    };

    // Retention policy: Keep last 1000 latency samples
    this.maxLatencySamples = 1000;
  }

  /**
   * Log agent selection and usage
   * @param {string} agentName - Name of the selected agent
   * @param {object} metadata - Additional context
   */
  async logAgentUsage(agentName, metadata = {}) {
    try {
      const timestamp = Date.now();
      
      // Increment counter for this agent
      await this.redis.hincrby(this.keys.agentUsage, agentName, 1);
      
      // Store last used timestamp
      await this.redis.hset(
        `${this.keys.agentUsage}:last_used`,
        agentName,
        timestamp
      );

      // Track hourly usage for trending
      const hourKey = `${this.keys.agentUsage}:hourly:${this.getHourKey()}`;
      await this.redis.hincrby(hourKey, agentName, 1);
      await this.redis.expire(hourKey, 86400); // 24 hour retention
    } catch (error) {
      this._handleError('logAgentUsage', error);
    }
  }

  /**
   * Log response latency for performance monitoring
   * @param {string} endpoint - API endpoint or operation
   * @param {number} latencyMs - Response time in milliseconds
   * @param {string} agentName - Agent that handled the request
   */
  async logLatency(endpoint, latencyMs, agentName = null) {
    try {
      const timestamp = Date.now();
      const entry = JSON.stringify({
        endpoint,
        latency: latencyMs,
        agent: agentName,
        timestamp
      });

      // Add to latency list
      await this.redis.lpush(this.keys.latency, entry);
      
      // Trim to maintain max samples
      await this.redis.ltrim(this.keys.latency, 0, this.maxLatencySamples - 1);

      // Update endpoint-specific stats
      const endpointKey = `${this.keys.latency}:${endpoint}`;
      await this.redis.lpush(endpointKey, latencyMs);
      await this.redis.ltrim(endpointKey, 0, 99); // Keep last 100 per endpoint
      await this.redis.expire(endpointKey, 3600); // 1 hour retention
    } catch (error) {
      this._handleError('logLatency', error);
    }
  }

  /**
   * Log War Room review outcome
   * @param {string} verdict - APPROVED or REJECTED
   * @param {number} qualityScore - Quality score (0-100)
   * @param {object} metadata - Additional review data
   */
  async logWarRoomReview(verdict, qualityScore, metadata = {}) {
    try {
      // Increment total reviews
      await this.redis.hincrby(this.keys.warRoom, 'total_reviews', 1);
      
      // Increment verdict counter
      const verdictKey = verdict === 'APPROVED' ? 'approvals' : 'rejections';
      await this.redis.hincrby(this.keys.warRoom, verdictKey, 1);

      // Track quality scores for trending
      await this.redis.lpush(`${this.keys.warRoom}:scores`, qualityScore);
      await this.redis.ltrim(`${this.keys.warRoom}:scores`, 0, 999);

      // Track critical issues
      if (metadata.criticalIssues && metadata.criticalIssues.length > 0) {
        await this.redis.hincrby(this.keys.warRoom, 'critical_blocks', 1);
      }
    } catch (error) {
      this._handleError('logWarRoomReview', error);
    }
  }

  /**
   * Log memory compaction event
   * @param {string} sessionId - Session identifier
   * @param {number} windowSize - Current window size
   * @param {number} summaryCount - Number of summaries
   */
  async logMemoryEvent(sessionId, windowSize, summaryCount) {
    try {
      // Track memory pressure (how often we hit limits)
      if (windowSize >= 21) {
        await this.redis.hincrby(this.keys.memory, 'limit_hits', 1);
      }

      // Track compaction events
      if (summaryCount > 0) {
        await this.redis.hincrby(this.keys.memory, 'compactions', 1);
      }

      // Average window size
      await this.redis.lpush(`${this.keys.memory}:window_sizes`, windowSize);
      await this.redis.ltrim(`${this.keys.memory}:window_sizes`, 0, 999);
    } catch (error) {
      this._handleError('logMemoryEvent', error);
    }
  }

  /**
   * Log WebSocket connection event
   * @param {string} event - connect, disconnect, error
   * @param {string} connectionId - Unique connection identifier
   */
  async logWebSocketEvent(event, connectionId = null) {
    try {
      const timestamp = Date.now();

      if (event === 'connect') {
        await this.redis.hincrby(this.keys.websockets, 'total_connections', 1);
        await this.redis.sadd(`${this.keys.websockets}:active`, connectionId);
      } else if (event === 'disconnect') {
        await this.redis.srem(`${this.keys.websockets}:active`, connectionId);
      } else if (event === 'error') {
        await this.redis.hincrby(this.keys.websockets, 'errors', 1);
      }

      // Track connection duration for disconnects
      if (event === 'disconnect' && connectionId) {
        const connectedAt = await this.redis.hget(
          `${this.keys.websockets}:timestamps`,
          connectionId
        );
        if (connectedAt) {
          const duration = timestamp - parseInt(connectedAt);
          await this.redis.lpush(`${this.keys.websockets}:durations`, duration);
          await this.redis.ltrim(`${this.keys.websockets}:durations`, 0, 999);
          await this.redis.hdel(`${this.keys.websockets}:timestamps`, connectionId);
        }
      } else if (event === 'connect' && connectionId) {
        await this.redis.hset(
          `${this.keys.websockets}:timestamps`,
          connectionId,
          timestamp
        );
      }
    } catch (error) {
      this._handleError('logWebSocketEvent', error);
    }
  }

  /**
   * Log terminal command execution
   * @param {string} command - Command that was executed
   * @param {boolean} approved - Whether command was approved
   * @param {boolean} dangerous - Whether command was flagged as dangerous
   */
  async logCommandExecution(command, approved, dangerous = false) {
    try {
      await this.redis.hincrby(this.keys.commands, 'total_executions', 1);

      if (dangerous) {
        await this.redis.hincrby(this.keys.commands, 'dangerous_blocked', 1);
      }

      if (!approved) {
        await this.redis.hincrby(this.keys.commands, 'require_approval', 1);
      }

      // Track command types (first word)
      const commandType = command.split(' ')[0];
      await this.redis.hincrby(`${this.keys.commands}:types`, commandType, 1);
    } catch (error) {
      this._handleError('logCommandExecution', error);
    }
  }

  /**
   * Log error occurrence
   * @param {string} errorType - Type/category of error
   * @param {string} message - Error message
   */
  async logError(errorType, message) {
    try {
      await this.redis.hincrby(this.keys.errors, errorType, 1);
      
      const timestamp = Date.now();
      const entry = JSON.stringify({ errorType, message, timestamp });
      
      await this.redis.lpush(`${this.keys.errors}:recent`, entry);
      await this.redis.ltrim(`${this.keys.errors}:recent`, 0, 99);
    } catch (error) {
      this._handleError('logError', error);
    }
  }

  /**
   * Log session activity
   * @param {string} sessionId - Session identifier
   * @param {string} action - create, update, clear
   */
  async logSessionActivity(sessionId, action) {
    try {
      const timestamp = Date.now();

      if (action === 'create') {
        await this.redis.hincrby(this.keys.sessions, 'total_created', 1);
        await this.redis.hset(`${this.keys.sessions}:created_at`, sessionId, timestamp);
      } else if (action === 'clear') {
        await this.redis.hincrby(this.keys.sessions, 'total_cleared', 1);
        
        // Calculate session lifetime
        const createdAt = await this.redis.hget(`${this.keys.sessions}:created_at`, sessionId);
        if (createdAt) {
          const lifetime = timestamp - parseInt(createdAt);
          await this.redis.lpush(`${this.keys.sessions}:lifetimes`, lifetime);
          await this.redis.ltrim(`${this.keys.sessions}:lifetimes`, 0, 999);
          await this.redis.hdel(`${this.keys.sessions}:created_at`, sessionId);
        }
      }
    } catch (error) {
      this._handleError('logSessionActivity', error);
    }
  }

  /**
   * Get comprehensive analytics summary
   * @returns {object} Analytics data across all tracked metrics
   */
  async getAnalytics() {
    try {
      const [
        agentUsage,
        warRoomStats,
        memoryStats,
        activeConnections,
        websocketStats,
        errorStats,
        sessionStats,
        commandStats,
        latencyList
      ] = await Promise.all([
        this.redis.hgetall(this.keys.agentUsage),
        this.redis.hgetall(this.keys.warRoom),
        this.redis.hgetall(this.keys.memory),
        this.redis.scard(`${this.keys.websockets}:active`),
        this.redis.hgetall(this.keys.websockets),
        this.redis.hgetall(this.keys.errors),
        this.redis.hgetall(this.keys.sessions),
        this.redis.hgetall(this.keys.commands),
        this.redis.lrange(this.keys.latency, 0, 99)
      ]);

      // Calculate latency statistics
      const latencyStats = this._calculateLatencyStats(latencyList);

      // Calculate War Room approval rate
      const totalReviews = parseInt(warRoomStats.total_reviews || 0);
      const approvals = parseInt(warRoomStats.approvals || 0);
      const approvalRate = totalReviews > 0 ? (approvals / totalReviews * 100).toFixed(2) : 0;

      return {
        agents: {
          usage: agentUsage,
          mostPopular: this._getMostPopular(agentUsage)
        },
        warRoom: {
          ...warRoomStats,
          approvalRate: parseFloat(approvalRate)
        },
        memory: {
          ...memoryStats,
          averageWindowSize: await this._getAverageFromList(`${this.keys.memory}:window_sizes`)
        },
        websockets: {
          ...websocketStats,
          activeConnections,
          averageDuration: await this._getAverageFromList(`${this.keys.websockets}:durations`)
        },
        commands: {
          ...commandStats,
          safetyRate: this._calculateSafetyRate(commandStats)
        },
        sessions: {
          ...sessionStats,
          averageLifetime: await this._getAverageFromList(`${this.keys.sessions}:lifetimes`)
        },
        errors: errorStats,
        latency: latencyStats,
        timestamp: Date.now()
      };
    } catch (error) {
      this._handleError('getAnalytics', error);
      return null;
    }
  }

  /**
   * Get agent usage for specific time period
   * @param {string} period - hour, day, week
   * @returns {object} Agent usage statistics
   */
  async getAgentUsageTrend(period = 'hour') {
    try {
      if (period === 'hour') {
        const hourKey = `${this.keys.agentUsage}:hourly:${this.getHourKey()}`;
        return await this.redis.hgetall(hourKey);
      }
      // Future: Implement day/week trends with time-series data
      return await this.redis.hgetall(this.keys.agentUsage);
    } catch (error) {
      this._handleError('getAgentUsageTrend', error);
      return {};
    }
  }

  /**
   * Clear all analytics data (use with caution)
   */
  async clearAll() {
    try {
      const keys = await this.redis.keys('lumen:stats:*');
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
      console.log('🗑️  All analytics data cleared');
    } catch (error) {
      this._handleError('clearAll', error);
    }
  }

  /**
   * Close Redis connection
   */
  async close() {
    await this.redis.quit();
  }

  // ========== Private Helper Methods ==========

  _handleError(method, error) {
    console.error(`❌ Analytics Error [${method}]:`, error.message);
    // Don't throw - analytics should never break the main app
  }

  _getMostPopular(usage) {
    const entries = Object.entries(usage || {});
    if (entries.length === 0) return null;
    
    return entries.reduce((max, curr) => {
      return parseInt(curr[1]) > parseInt(max[1]) ? curr : max;
    })[0];
  }

  _calculateLatencyStats(latencyList) {
    if (!latencyList || latencyList.length === 0) {
      return { count: 0, avg: 0, min: 0, max: 0, p95: 0 };
    }

    const latencies = latencyList
      .map(entry => {
        try {
          return JSON.parse(entry).latency;
        } catch {
          return null;
        }
      })
      .filter(l => l !== null)
      .sort((a, b) => a - b);

    if (latencies.length === 0) {
      return { count: 0, avg: 0, min: 0, max: 0, p95: 0 };
    }

    const sum = latencies.reduce((a, b) => a + b, 0);
    const avg = sum / latencies.length;
    const p95Index = Math.floor(latencies.length * 0.95);
    
    return {
      count: latencies.length,
      avg: Math.round(avg),
      min: latencies[0],
      max: latencies[latencies.length - 1],
      p95: latencies[p95Index] || latencies[latencies.length - 1]
    };
  }

  async _getAverageFromList(key) {
    try {
      const values = await this.redis.lrange(key, 0, -1);
      if (values.length === 0) return 0;
      
      const sum = values.reduce((acc, val) => acc + parseFloat(val), 0);
      return Math.round(sum / values.length);
    } catch {
      return 0;
    }
  }

  _calculateSafetyRate(commandStats) {
    const total = parseInt(commandStats.total_executions || 0);
    const dangerous = parseInt(commandStats.dangerous_blocked || 0);
    
    if (total === 0) return 100;
    return ((1 - dangerous / total) * 100).toFixed(2);
  }

  getHourKey() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}-${String(now.getHours()).padStart(2, '0')}`;
  }
}

// Singleton instance
let analyticsInstance = null;

function getAnalyticsProvider(options = {}) {
  if (!analyticsInstance) {
    analyticsInstance = new AnalyticsProvider(options);
  }
  return analyticsInstance;
}

module.exports = {
  AnalyticsProvider,
  getAnalyticsProvider
};
