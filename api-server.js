import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { MemoryManager } from './lib/MemoryManager.js';
import { schemaRouter } from './lib/schemaRouter.js';
import { executeAgentCommand } from './lib/terminalExecutor.js';
import { runWarRoom } from './lib/workflows/warRoom.js';
import { streamCommand } from './lib/terminalStreamer.js';

const app = express();
const PORT = process.env.PORT || 3000;
const server = createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

// Store sessions in memory (in production, use Redis or similar)
const sessions = new Map();

app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'Lumen Core API', version: '1.0.0' });
});

// Get or create session
function getSession(sessionId) {
  if (!sessions.has(sessionId)) {
    sessions.set(sessionId, new MemoryManager());
  }
  return sessions.get(sessionId);
}

// Main chat endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const { message, sessionId = 'default', autoApprove = true } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const memory = getSession(sessionId);
    await memory.addInteraction('user', message);

    const response = await schemaRouter(message, memory);
    
    // Handle terminal commands
    if (response.choice === 'terminalCommand') {
      if (!autoApprove && response.requiresApproval) {
        return res.json({
          type: 'approval_required',
          command: response.terminalCommand,
          reasoning: response.commandReasoning,
          response: response
        });
      }
      
      const execResult = await executeAgentCommand(
        {
          command: response.terminalCommand,
          reasoning: response.commandReasoning,
          requiresApproval: response.requiresApproval
        },
        { autoApprove: true, dryRun: false }
      );
      
      await memory.addInteraction('system', 'Command ' + execResult.status + ': ' + (execResult.stdout || execResult.stderr));
      
      return res.json({
        type: 'terminal',
        response: response,
        execution: execResult,
        memoryStatus: memory.getMemoryStatus()
      });
    }
    
    await memory.addInteraction('ai', response.response || 'Processing...');
    
    res.json({
      type: response.choice || 'response',
      response: response,
      memoryStatus: memory.getMemoryStatus()
    });
    
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get memory status
app.get('/api/memory/:sessionId', (req, res) => {
  const memory = getSession(req.params.sessionId);
  res.json(memory.getMemoryStatus());
});

// Clear session
app.delete('/api/session/:sessionId', (req, res) => {
  sessions.delete(req.params.sessionId);
  res.json({ status: 'cleared' });
});

// War Room endpoint - Multi-agent review
app.post('/api/war-room', async (req, res) => {
  try {
    const { proposal, code, context } = req.body;
    
    if (!proposal || !code) {
      return res.status(400).json({ error: 'Proposal and code are required' });
    }

    const result = await runWarRoom(proposal, code, context);
    
    res.json(result);
  } catch (error) {
    console.error('War Room error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Documentation endpoint
app.get('/api/docs', (req, res) => {
  res.json({
    service: 'Lumen Core API',
    version: '1.0.0',
    endpoints: {
      'GET /health': 'Health check',
      'POST /api/chat': 'Send message to Lumen Core (body: {message, sessionId?, autoApprove?})',
      'POST /api/war-room': 'Multi-agent code review (body: {proposal, code, context?})',
      'GET /api/memory/:sessionId': 'Get memory status for session',
      'DELETE /api/session/:sessionId': 'Clear session memory',
      'GET /api/docs': 'This documentation'
    },
    features: {
      memoryManagement: '21-interaction rolling window + 3 summaries',
      agents: ['base', 'scaffold', 'fileOp', 'analyze', 'test', 'docs'],
      safeExecution: 'Terminal commands with approval gates',
      warRoom: 'Multi-agent debate system for code review'
    }
  });
});

// WebSocket connection handler
wss.on('connection', (ws) => {
  console.log('WebSocket client connected');

  ws.on('message', async (message) => {
    try {
      const data = JSON.parse(message.toString());

      if (data.type === 'execute') {
        const { command, cwd, sessionId } = data;
        
        // Send acknowledgement
        ws.send(JSON.stringify({
          type: 'ack',
          command,
          message: 'Command execution started'
        }));

        // Stream command execution
        await streamCommand(command, ws, { cwd });
      }
    } catch (error) {
      ws.send(JSON.stringify({
        type: 'error',
        message: error.message
      }));
    }
  });

  ws.on('close', () => {
    console.log('WebSocket client disconnected');
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

server.listen(PORT, () => {
  console.log('Lumen Core API running on port ' + PORT);
  console.log('WebSocket server: ws://localhost:' + PORT + '/ws');
  console.log('Documentation: http://localhost:' + PORT + '/api/docs');
});
