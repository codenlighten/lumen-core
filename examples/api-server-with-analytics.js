/**
 * Analytics Integration Example for api-server.js
 * Shows how to integrate the analytics engine into your Express API
 */

// ========== IMPORTS ==========
const express = require('express');
const cors = require('cors');
const { createServer } = require('http');
const { WebSocketServer } = require('ws');

// Analytics imports
const { getAnalyticsProvider } = require('./lib/analyticsProvider');
const {
  chatAnalyticsMiddleware,
  warRoomAnalyticsMiddleware,
  sessionAnalyticsMiddleware,
  errorAnalyticsMiddleware,
  initAnalyticsMiddleware,
  timingMiddleware,
  WebSocketAnalytics
} = require('./lib/analyticsMiddleware');
const analyticsRoutes = require('./lib/analyticsRoutes');

// ========== APP SETUP ==========
const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 3000;

// Initialize analytics
const analytics = getAnalyticsProvider();
const wsAnalytics = new WebSocketAnalytics();

// ========== MIDDLEWARE ==========
app.use(cors());
app.use(express.json());

// Analytics middleware (add before routes)
app.use(initAnalyticsMiddleware());  // Attach analytics to req object
app.use(timingMiddleware());          // Track overall request timing

// ========== ROUTES ==========

/**
 * Chat endpoint with analytics
 */
app.post('/api/chat', chatAnalyticsMiddleware(), async (req, res) => {
  try {
    const { message, sessionId, autoApprove } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }
    
    // Your existing chat logic here
    // const response = await agentRouter.process(message, sessionId);
    
    // Example response structure
    const response = {
      type: 'response',
      selectedAgent: 'baseAgent',
      response: {
        choice: 'default',
        response: 'This is a demo response'
      },
      memoryStatus: {
        currentWindowSize: 5,
        summaryCount: 0,
        totalInteractions: 5
      }
    };
    
    res.json(response);
    
  } catch (error) {
    console.error('Chat error:', error);
    req.analytics.logError('ChatError', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * War Room endpoint with analytics
 */
app.post('/api/war-room', warRoomAnalyticsMiddleware(), async (req, res) => {
  try {
    const { proposal, code, context } = req.body;
    
    if (!proposal || !code) {
      return res.status(400).json({ error: 'Proposal and code are required' });
    }
    
    // Your existing war room logic here
    // const result = await warRoom.review(proposal, code, context);
    
    // Example response
    const result = {
      verdict: 'APPROVED',
      isSafe: true,
      qualityScore: 85,
      analysis: {
        issues: [],
        recommendations: []
      },
      testing: {
        testCount: 3
      },
      criticalIssues: []
    };
    
    res.json(result);
    
  } catch (error) {
    console.error('War room error:', error);
    req.analytics.logError('WarRoomError', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Memory status endpoint with analytics
 */
app.get('/api/memory/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    // Your existing memory logic here
    // const memoryStatus = memoryManager.getStatus(sessionId);
    
    const memoryStatus = {
      currentWindowSize: 12,
      summaryCount: 1,
      totalInteractions: 28
    };
    
    // Log memory check
    req.analytics.logMemoryEvent(
      sessionId,
      memoryStatus.currentWindowSize,
      memoryStatus.summaryCount
    );
    
    res.json(memoryStatus);
    
  } catch (error) {
    req.analytics.logError('MemoryError', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Clear session endpoint with analytics
 */
app.delete('/api/session/:sessionId', sessionAnalyticsMiddleware('clear'), async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    // Your existing session clearing logic here
    // memoryManager.clearSession(sessionId);
    
    res.json({ status: 'cleared' });
    
  } catch (error) {
    req.analytics.logError('SessionError', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Health check
 */
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Lumen Core API',
    version: '2.0.0',
    analytics: 'enabled'
  });
});

// ========== ANALYTICS ROUTES ==========
// Mount all analytics endpoints
app.use('/api', analyticsRoutes);

// ========== ERROR HANDLING ==========
app.use(errorAnalyticsMiddleware());

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message
  });
});

// ========== WEBSOCKET SETUP WITH ANALYTICS ==========
const wss = new WebSocketServer({ server, path: '/ws' });

wss.on('connection', (ws) => {
  const connectionId = `conn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  console.log(`🔌 WebSocket connected: ${connectionId}`);
  
  // Track connection
  wsAnalytics.onConnection(ws, connectionId);
  
  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());
      
      if (message.type === 'execute') {
        const { command, cwd, sessionId } = message;
        
        // Track command execution
        wsAnalytics.onCommandExecuted(connectionId, command, true);
        
        // Your existing terminal streaming logic here
        ws.send(JSON.stringify({
          type: 'ack',
          command,
          message: 'Command execution started'
        }));
        
        // Simulate command execution
        setTimeout(() => {
          ws.send(JSON.stringify({
            type: 'complete',
            result: {
              status: 'success',
              exitCode: 0,
              duration: 100
            }
          }));
        }, 100);
      }
      
    } catch (error) {
      console.error('WebSocket message error:', error);
      analytics.logError('WebSocketMessageError', error.message);
    }
  });
  
  ws.on('close', () => {
    console.log(`🔌 WebSocket disconnected: ${connectionId}`);
  });
});

// ========== SERVER START ==========
server.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════╗
║   🚀 Lumen Core API Server Running        ║
║                                            ║
║   Port: ${PORT}                              ║
║   Analytics: ✅ Enabled                    ║
║   WebSocket: ws://localhost:${PORT}/ws       ║
║                                            ║
║   Endpoints:                               ║
║   • POST /api/chat                         ║
║   • POST /api/war-room                     ║
║   • GET  /api/memory/:sessionId            ║
║   • GET  /api/analytics                    ║
║   • GET  /api/analytics/dashboard          ║
║   • GET  /health                           ║
╚════════════════════════════════════════════╝
  `);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('🛑 SIGTERM received, shutting down gracefully...');
  
  // Close WebSocket server
  wss.close(() => {
    console.log('✅ WebSocket server closed');
  });
  
  // Close analytics connection
  await analytics.close();
  console.log('✅ Analytics connection closed');
  
  // Close HTTP server
  server.close(() => {
    console.log('✅ HTTP server closed');
    process.exit(0);
  });
});

module.exports = { app, server };
