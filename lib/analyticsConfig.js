/**
 * Analytics Configuration
 * Centralized settings for analytics engine
 */

module.exports = {
  // Redis connection settings
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD || undefined,
    db: parseInt(process.env.REDIS_DB || '0'),
    keyPrefix: 'lumen:',
    
    // Connection pool settings
    maxRetriesPerRequest: 3,
    retryStrategy: (times) => {
      const delay = Math.min(times * 50, 2000);
      return delay;
    },
    
    // Reconnection settings
    enableReadyCheck: true,
    lazyConnect: false,
    
    // Connection timeout
    connectTimeout: 10000
  },

  // Data retention policies
  retention: {
    // Maximum samples to keep in memory
    maxLatencySamples: 1000,
    maxErrorSamples: 100,
    maxMemorySamples: 1000,
    maxWebSocketDurations: 1000,
    maxSessionLifetimes: 1000,
    
    // Time-based retention (seconds)
    hourlyDataExpiry: 86400,    // 24 hours
    dailyDataExpiry: 2592000,   // 30 days
    weeklyDataExpiry: 7776000,  // 90 days
    
    // Cleanup intervals (milliseconds)
    cleanupInterval: 3600000    // 1 hour
  },

  // Feature flags
  features: {
    enableAgentTracking: true,
    enableLatencyTracking: true,
    enableWarRoomTracking: true,
    enableMemoryTracking: true,
    enableWebSocketTracking: true,
    enableErrorTracking: true,
    enableSessionTracking: true,
    enableCommandTracking: true
  },

  // Performance thresholds (for alerting)
  thresholds: {
    // Latency thresholds in milliseconds
    latency: {
      warning: 1000,    // 1 second
      critical: 5000    // 5 seconds
    },
    
    // Memory pressure thresholds
    memory: {
      windowSizeWarning: 18,  // Approaching 21 limit
      compactionRate: 0.3     // More than 30% of sessions compacting
    },
    
    // Error rate thresholds (percentage)
    errorRate: {
      warning: 5,     // 5% error rate
      critical: 10    // 10% error rate
    },
    
    // War Room approval thresholds
    warRoom: {
      approvalRateWarning: 50,  // Below 50% approval
      criticalIssuesMax: 10      // Max critical blocks per hour
    },
    
    // WebSocket health thresholds
    websocket: {
      errorRateWarning: 10,      // 10% connection errors
      avgDurationMin: 30000      // Connections shorter than 30s
    }
  },

  // Metrics aggregation settings
  aggregation: {
    // How often to calculate aggregated metrics (milliseconds)
    intervalMinute: 60000,       // 1 minute
    intervalHour: 3600000,       // 1 hour
    intervalDay: 86400000,       // 24 hours
    
    // Percentile calculations
    percentiles: [50, 75, 90, 95, 99]
  },

  // Dashboard settings
  dashboard: {
    // Auto-refresh interval (milliseconds)
    refreshInterval: 30000,    // 30 seconds
    
    // Chart data points
    chartDataPoints: 100,
    
    // Real-time updates
    enableRealtime: true
  },

  // Export settings (for historical analysis)
  export: {
    enabled: false,
    
    // Export to PostgreSQL, MongoDB, etc.
    destination: process.env.ANALYTICS_EXPORT_DB || null,
    
    // Export interval (milliseconds)
    interval: 3600000,  // 1 hour
    
    // Batch size
    batchSize: 1000
  },

  // API settings
  api: {
    // Rate limiting for analytics endpoints
    rateLimit: {
      windowMs: 60000,    // 1 minute
      maxRequests: 100
    },
    
    // Cache control
    cacheMaxAge: 10,      // 10 seconds
    
    // Pagination
    defaultPageSize: 50,
    maxPageSize: 1000
  },

  // Logging settings
  logging: {
    // Log level for analytics operations
    level: process.env.ANALYTICS_LOG_LEVEL || 'info',
    
    // Silent mode (no console output)
    silent: process.env.ANALYTICS_SILENT === 'true',
    
    // Log analytics errors
    logErrors: true,
    
    // Verbose mode for debugging
    verbose: process.env.ANALYTICS_VERBOSE === 'true'
  },

  // Alert settings (future feature)
  alerts: {
    enabled: false,
    
    // Alert channels
    channels: {
      email: process.env.ALERT_EMAIL || null,
      slack: process.env.ALERT_SLACK_WEBHOOK || null,
      webhook: process.env.ALERT_WEBHOOK_URL || null
    },
    
    // Alert cooldown (minimum time between alerts of same type)
    cooldownMs: 300000  // 5 minutes
  }
};
