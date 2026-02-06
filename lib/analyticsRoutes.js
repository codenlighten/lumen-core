/**
 * Analytics API Routes
 * Exposes real-time metrics and dashboard data
 */

const express = require('express');
const { getAnalyticsProvider } = require('./analyticsProvider');

const router = express.Router();
const analytics = getAnalyticsProvider();

/**
 * GET /api/analytics
 * Returns comprehensive analytics summary
 */
router.get('/analytics', async (req, res) => {
  try {
    const data = await analytics.getAnalytics();
    
    if (!data) {
      return res.status(500).json({
        error: 'Failed to retrieve analytics data'
      });
    }
    
    res.json({
      status: 'ok',
      data,
      generatedAt: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Analytics endpoint error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * GET /api/analytics/agents
 * Returns agent usage statistics
 */
router.get('/analytics/agents', async (req, res) => {
  try {
    const period = req.query.period || 'hour'; // hour, day, week
    const usage = await analytics.getAgentUsageTrend(period);
    
    // Sort by usage count
    const sorted = Object.entries(usage)
      .map(([name, count]) => ({ name, count: parseInt(count) }))
      .sort((a, b) => b.count - a.count);
    
    res.json({
      status: 'ok',
      period,
      agents: sorted,
      total: sorted.reduce((sum, agent) => sum + agent.count, 0)
    });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/analytics/latency
 * Returns latency statistics
 */
router.get('/analytics/latency', async (req, res) => {
  try {
    const data = await analytics.getAnalytics();
    
    res.json({
      status: 'ok',
      latency: data.latency,
      breakdown: {
        '/api/chat': data.latency.avg,
        '/api/war-room': data.latency.avg,
        websocket: data.latency.avg
      }
    });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/analytics/war-room
 * Returns War Room statistics
 */
router.get('/analytics/war-room', async (req, res) => {
  try {
    const data = await analytics.getAnalytics();
    
    const totalReviews = parseInt(data.warRoom.total_reviews || 0);
    const approvals = parseInt(data.warRoom.approvals || 0);
    const rejections = parseInt(data.warRoom.rejections || 0);
    
    res.json({
      status: 'ok',
      warRoom: {
        totalReviews,
        approvals,
        rejections,
        approvalRate: data.warRoom.approvalRate,
        criticalBlocks: parseInt(data.warRoom.critical_blocks || 0)
      }
    });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/analytics/memory
 * Returns memory management statistics
 */
router.get('/analytics/memory', async (req, res) => {
  try {
    const data = await analytics.getAnalytics();
    
    res.json({
      status: 'ok',
      memory: {
        limitHits: parseInt(data.memory.limit_hits || 0),
        compactions: parseInt(data.memory.compactions || 0),
        averageWindowSize: data.memory.averageWindowSize
      }
    });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/analytics/websockets
 * Returns WebSocket connection statistics
 */
router.get('/analytics/websockets', async (req, res) => {
  try {
    const data = await analytics.getAnalytics();
    
    res.json({
      status: 'ok',
      websockets: {
        activeConnections: data.websockets.activeConnections,
        totalConnections: parseInt(data.websockets.total_connections || 0),
        errors: parseInt(data.websockets.errors || 0),
        averageDuration: data.websockets.averageDuration
      }
    });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/analytics/commands
 * Returns terminal command execution statistics
 */
router.get('/analytics/commands', async (req, res) => {
  try {
    const data = await analytics.getAnalytics();
    
    res.json({
      status: 'ok',
      commands: {
        totalExecutions: parseInt(data.commands.total_executions || 0),
        dangerousBlocked: parseInt(data.commands.dangerous_blocked || 0),
        requireApproval: parseInt(data.commands.require_approval || 0),
        safetyRate: parseFloat(data.commands.safetyRate || 100)
      }
    });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/analytics/sessions
 * Returns session lifecycle statistics
 */
router.get('/analytics/sessions', async (req, res) => {
  try {
    const data = await analytics.getAnalytics();
    
    res.json({
      status: 'ok',
      sessions: {
        totalCreated: parseInt(data.sessions.total_created || 0),
        totalCleared: parseInt(data.sessions.total_cleared || 0),
        averageLifetime: data.sessions.averageLifetime,
        averageLifetimeFormatted: formatDuration(data.sessions.averageLifetime)
      }
    });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/analytics/errors
 * Returns error tracking statistics
 */
router.get('/analytics/errors', async (req, res) => {
  try {
    const data = await analytics.getAnalytics();
    
    // Convert error hash to array
    const errorBreakdown = Object.entries(data.errors || {})
      .map(([type, count]) => ({ type, count: parseInt(count) }))
      .sort((a, b) => b.count - a.count);
    
    res.json({
      status: 'ok',
      errors: {
        breakdown: errorBreakdown,
        total: errorBreakdown.reduce((sum, err) => sum + err.count, 0)
      }
    });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/analytics/dashboard
 * Returns formatted data for admin dashboard
 */
router.get('/analytics/dashboard', async (req, res) => {
  try {
    const data = await analytics.getAnalytics();
    
    // Transform data for dashboard visualization
    const dashboard = {
      overview: {
        activeWebSockets: data.websockets.activeConnections,
        totalRequests: calculateTotalRequests(data),
        averageLatency: data.latency.avg,
        errorRate: calculateErrorRate(data)
      },
      agents: {
        labels: Object.keys(data.agents.usage || {}),
        values: Object.values(data.agents.usage || {}).map(v => parseInt(v)),
        mostPopular: data.agents.mostPopular
      },
      warRoom: {
        totalReviews: parseInt(data.warRoom.total_reviews || 0),
        approvalRate: data.warRoom.approvalRate,
        approvals: parseInt(data.warRoom.approvals || 0),
        rejections: parseInt(data.warRoom.rejections || 0),
        criticalBlocks: parseInt(data.warRoom.critical_blocks || 0)
      },
      performance: {
        latency: {
          avg: data.latency.avg,
          min: data.latency.min,
          max: data.latency.max,
          p95: data.latency.p95
        },
        memory: {
          averageWindowSize: data.memory.averageWindowSize,
          compactions: parseInt(data.memory.compactions || 0),
          limitHits: parseInt(data.memory.limit_hits || 0)
        }
      },
      safety: {
        commandsExecuted: parseInt(data.commands.total_executions || 0),
        dangerousBlocked: parseInt(data.commands.dangerous_blocked || 0),
        safetyRate: parseFloat(data.commands.safetyRate || 100)
      },
      sessions: {
        totalCreated: parseInt(data.sessions.total_created || 0),
        totalCleared: parseInt(data.sessions.total_cleared || 0),
        averageLifetime: formatDuration(data.sessions.averageLifetime)
      },
      timestamp: data.timestamp
    };
    
    res.json({
      status: 'ok',
      dashboard
    });
    
  } catch (error) {
    console.error('Dashboard endpoint error:', error);
    res.status(500).json({
      error: 'Failed to generate dashboard',
      message: error.message
    });
  }
});

/**
 * DELETE /api/analytics
 * Clear all analytics data (admin only)
 */
router.delete('/analytics', async (req, res) => {
  try {
    // TODO: Add authentication check
    // if (!req.user || !req.user.isAdmin) {
    //   return res.status(403).json({ error: 'Unauthorized' });
    // }
    
    await analytics.clearAll();
    
    res.json({
      status: 'cleared',
      message: 'All analytics data has been cleared'
    });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ========== Helper Functions ==========

function calculateTotalRequests(data) {
  const agentUsage = Object.values(data.agents.usage || {})
    .reduce((sum, count) => sum + parseInt(count), 0);
  
  const warRoomReviews = parseInt(data.warRoom.total_reviews || 0);
  
  return agentUsage + warRoomReviews;
}

function calculateErrorRate(data) {
  const totalErrors = Object.values(data.errors || {})
    .reduce((sum, count) => sum + parseInt(count), 0);
  
  const totalRequests = calculateTotalRequests(data);
  
  if (totalRequests === 0) return 0;
  
  return ((totalErrors / totalRequests) * 100).toFixed(2);
}

function formatDuration(ms) {
  if (!ms || ms === 0) return '0s';
  
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
}

module.exports = router;
