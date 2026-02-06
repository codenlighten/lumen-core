# Lumen Core API Documentation

**Version:** 2.0  
**Base URL:** `https://lumenchat.org`  
**WebSocket URL:** `wss://lumenchat.org/ws`  
**Updated:** February 6, 2026

## Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [REST API Endpoints](#rest-api-endpoints)
4. [WebSocket API](#websocket-api)
5. [Error Handling](#error-handling)
6. [Rate Limits](#rate-limits)
7. [Code Examples](#code-examples)

---

## Overview

Lumen Core is an agentic AI platform with memory management, dynamic agent routing, safe terminal execution, and real-time streaming capabilities.

**Key Features:**
- 🧠 Memory Method (21-interaction rolling window + 3 summaries)
- 🤖 8 Specialized AI Agents
- 🛡️ Agent War Room (multi-agent code validation)
- 💻 Live Terminal Monitor (WebSocket streaming)
- 🔒 Safety gates and approval workflows

---

## Authentication

**Current Version:** No authentication required (open access)

**Future:** API keys will be required for production use:
```http
Authorization: Bearer YOUR_API_KEY
```

---

## REST API Endpoints

### 1. Health Check

**Endpoint:** `GET /health`

**Description:** Check API server status

**Request:**
```bash
curl https://lumenchat.org/health
```

**Response:**
```json
{
  "status": "ok",
  "service": "Lumen Core API",
  "version": "1.0.0"
}
```

---

### 2. Chat Interface

**Endpoint:** `POST /api/chat`

**Description:** Send messages to Lumen AI with memory persistence and agent routing

**Request Body:**
```json
{
  "message": "Create a Python function to calculate fibonacci numbers",
  "sessionId": "session-12345",
  "autoApprove": true
}
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `message` | string | Yes | User message or command |
| `sessionId` | string | No | Session identifier for memory persistence (auto-generated if omitted) |
| `autoApprove` | boolean | No | Auto-approve terminal commands (default: true) |

**Response Types:**

**A. Conversational Response**
```json
{
  "type": "response",
  "response": {
    "choice": "default",
    "response": "Here's a Fibonacci function...",
    "reasoning": "User requested code implementation"
  },
  "memoryStatus": {
    "currentWindowSize": 4,
    "summaryCount": 0,
    "totalInteractions": 4
  }
}
```

**B. Terminal Command Response**
```json
{
  "type": "terminal",
  "response": {
    "choice": "terminalCommand",
    "response": "I'll list the files in the directory.",
    "terminalCommand": "ls -la",
    "commandReasoning": "User requested directory listing",
    "requiresApproval": false
  },
  "execution": {
    "status": "success",
    "stdout": "total 48\ndrwxr-xr-x  5 user user 4096 Feb  6 10:00 .\n...",
    "stderr": "",
    "duration": 45
  },
  "memoryStatus": {
    "currentWindowSize": 6,
    "summaryCount": 0
  }
}
```

**C. Approval Required Response**
```json
{
  "type": "approval_required",
  "command": "rm -rf /tmp/old-files",
  "reasoning": "Command performs deletion, requires approval",
  "response": {
    "terminalCommand": "rm -rf /tmp/old-files",
    "requiresApproval": true
  }
}
```

**D. Code Generation Response**
```json
{
  "type": "code",
  "response": {
    "choice": "code",
    "codeExplanation": "Here's a Fibonacci implementation...",
    "code": "def fibonacci(n):\n    if n <= 1:\n        return n\n    return fibonacci(n-1) + fibonacci(n-2)",
    "language": "python"
  }
}
```

**cURL Example:**
```bash
curl -X POST https://lumenchat.org/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What is the square root of 144?",
    "sessionId": "session-demo-001"
  }'
```

---

### 3. Agent War Room

**Endpoint:** `POST /api/war-room`

**Description:** Multi-agent adversarial code review (Code Analyzer vs Testing Agent)

**Request Body:**
```json
{
  "proposal": "Optimize database query performance",
  "code": "SELECT * FROM users WHERE created_at > NOW() - INTERVAL 7 DAY",
  "context": "MySQL query for weekly active users report"
}
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `proposal` | string | Yes | Description of what the code does |
| `code` | string | Yes | The code to be reviewed |
| `context` | string | No | Additional context or requirements |

**Response:**
```json
{
  "verdict": "APPROVED",
  "isSafe": true,
  "qualityScore": 82,
  "analysis": {
    "issues": [
      {
        "severity": "medium",
        "description": "SELECT * can be inefficient",
        "location": "line 1"
      }
    ],
    "recommendations": [
      "Specify columns instead of SELECT *",
      "Add index on created_at column"
    ],
    "reasoning": "Query is functional but has optimization opportunities"
  },
  "testing": {
    "testCount": 3,
    "coverage": 85,
    "testCases": [
      {
        "name": "test_query_returns_recent_users",
        "description": "Verify query returns users from last 7 days",
        "type": "integration"
      },
      {
        "name": "test_query_excludes_older_users",
        "description": "Verify older users are not returned",
        "type": "integration"
      },
      {
        "name": "test_query_performance",
        "description": "Verify query executes within 100ms",
        "type": "performance"
      }
    ]
  },
  "criticalIssues": [],
  "debateLog": [
    "Code Analyzer: Quality score 82/100...",
    "Testing Agent: Proposing 3 test cases..."
  ],
  "summary": "APPROVED: Code quality meets threshold (82/100), sufficient test coverage (3 tests), no critical issues detected."
}
```

**Approval Criteria:**
- Quality Score ≥ 75/100
- Test Cases ≥ 2
- Critical Issues = 0

**cURL Example:**
```bash
curl -X POST https://lumenchat.org/api/war-room \
  -H "Content-Type: application/json" \
  -d '{
    "proposal": "User authentication function",
    "code": "function auth(user, pass) { return user === \"admin\" && pass === \"password\"; }",
    "context": "JavaScript authentication for admin panel"
  }'
```

---

### 4. Memory Status

**Endpoint:** `GET /api/memory/:sessionId`

**Description:** Get memory status for a specific session

**Request:**
```bash
curl https://lumenchat.org/api/memory/session-12345
```

**Response:**
```json
{
  "currentWindowSize": 12,
  "summaryCount": 1,
  "totalInteractions": 28,
  "maxWindowSize": 21,
  "oldestInteraction": "2026-02-06T10:15:00.000Z",
  "newestInteraction": "2026-02-06T11:30:00.000Z"
}
```

---

### 5. Clear Session

**Endpoint:** `DELETE /api/session/:sessionId`

**Description:** Clear all memory for a session

**Request:**
```bash
curl -X DELETE https://lumenchat.org/api/session/session-12345
```

**Response:**
```json
{
  "status": "cleared"
}
```

---

### 6. API Documentation

**Endpoint:** `GET /api/docs`

**Description:** Get API documentation (JSON format)

**Request:**
```bash
curl https://lumenchat.org/api/docs
```

**Response:**
```json
{
  "service": "Lumen Core API",
  "version": "1.0.0",
  "endpoints": {
    "GET /health": "Health check",
    "POST /api/chat": "Send message to Lumen Core",
    "POST /api/war-room": "Multi-agent code review",
    "GET /api/memory/:sessionId": "Get memory status",
    "DELETE /api/session/:sessionId": "Clear session"
  },
  "features": {
    "memoryManagement": "21-interaction rolling window + 3 summaries",
    "agents": ["base", "scaffold", "fileOp", "analyze", "test", "docs"],
    "safeExecution": "Terminal commands with approval gates",
    "warRoom": "Multi-agent debate system"
  }
}
```

---

## WebSocket API

### Connection

**URL:** `wss://lumenchat.org/ws`

**Protocol:** WebSocket (RFC 6455)

**Description:** Real-time terminal command streaming with live stdout/stderr output

### Client → Server Messages

#### Execute Command

```json
{
  "type": "execute",
  "command": "npm install express",
  "cwd": "/path/to/working/directory",
  "sessionId": "session-12345"
}
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `type` | string | Yes | Always "execute" |
| `command` | string | Yes | Shell command to execute |
| `cwd` | string | No | Working directory (default: current) |
| `sessionId` | string | No | Session identifier |

### Server → Client Messages

#### Acknowledgement
```json
{
  "type": "ack",
  "command": "npm install express",
  "message": "Command execution started"
}
```

#### Command Started
```json
{
  "type": "start",
  "command": "npm install express",
  "cwd": "/app",
  "timestamp": 1738845600000
}
```

#### Standard Output
```json
{
  "type": "stdout",
  "data": "added 50 packages in 2.5s\n",
  "timestamp": 1738845602500
}
```

#### Standard Error
```json
{
  "type": "stderr",
  "data": "WARN deprecated package@1.0.0\n",
  "timestamp": 1738845601800
}
```

#### Command Completed
```json
{
  "type": "complete",
  "result": {
    "status": "success",
    "exitCode": 0,
    "stdout": "added 50 packages in 2.5s\n",
    "stderr": "",
    "duration": 2543,
    "killed": false
  },
  "timestamp": 1738845602543
}
```

#### Error
```json
{
  "type": "error",
  "message": "Command blocked: Contains dangerous patterns",
  "timestamp": 1738845600100
}
```

#### Timeout
```json
{
  "type": "timeout",
  "message": "Command exceeded 300000ms timeout",
  "timestamp": 1738845900000
}
```

### Safety Features

**Blocked Patterns:**
- `rm -rf /` - Root deletion
- `:(){ :|: };` - Fork bombs
- `/dev/sda` - Direct disk access
- `mkfs` - Format operations
- `dd if=` - Disk dumps
- `curl|bash` - Pipe to bash
- `wget|sh` - Pipe to shell

**Timeout:** 5 minutes (300,000ms) default

---

## Error Handling

### HTTP Status Codes

| Code | Meaning | Description |
|------|---------|-------------|
| 200 | OK | Request successful |
| 400 | Bad Request | Invalid parameters |
| 404 | Not Found | Endpoint doesn't exist |
| 500 | Internal Server Error | Server error |
| 502 | Bad Gateway | Backend unavailable |

### Error Response Format

```json
{
  "error": "Message is required",
  "code": "MISSING_PARAMETER",
  "details": {
    "parameter": "message",
    "expected": "string"
  }
}
```

### Common Errors

**Missing Required Parameter:**
```json
{
  "error": "Message is required"
}
```

**Session Not Found:**
```json
{
  "error": "Session not found"
}
```

**Command Blocked:**
```json
{
  "error": "Command blocked: Contains dangerous patterns"
}
```

---

## Rate Limits

**Current:** No rate limits

**Future:**
- Free tier: 100 requests/hour
- Pro tier: 1000 requests/hour
- Enterprise: Unlimited

**Headers (Future):**
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1738846200
```

---

## Code Examples

### Node.js

#### Chat API
```javascript
const axios = require('axios');

async function chat(message, sessionId = 'my-session') {
  const response = await axios.post('https://lumenchat.org/api/chat', {
    message,
    sessionId,
    autoApprove: true
  });
  
  console.log('AI Response:', response.data.response.response);
  
  if (response.data.type === 'terminal') {
    console.log('Command:', response.data.response.terminalCommand);
    console.log('Output:', response.data.execution.stdout);
  }
}

chat('List files in current directory');
```

#### WebSocket Terminal Streaming
```javascript
const WebSocket = require('ws');

const ws = new WebSocket('wss://lumenchat.org/ws');

ws.on('open', () => {
  console.log('Connected to terminal monitor');
  
  ws.send(JSON.stringify({
    type: 'execute',
    command: 'npm install express',
    cwd: '/app'
  }));
});

ws.on('message', (data) => {
  const message = JSON.parse(data.toString());
  
  switch(message.type) {
    case 'start':
      console.log(`\n⚡ Running: ${message.command}`);
      break;
    case 'stdout':
      process.stdout.write(message.data);
      break;
    case 'stderr':
      process.stderr.write(message.data);
      break;
    case 'complete':
      const duration = (message.result.duration / 1000).toFixed(2);
      console.log(`\n✅ Completed in ${duration}s`);
      ws.close();
      break;
    case 'error':
      console.error(`\n❌ Error: ${message.message}`);
      ws.close();
      break;
  }
});
```

---

### Python

#### Chat API
```python
import requests

def chat(message, session_id='my-session'):
    response = requests.post('https://lumenchat.org/api/chat', json={
        'message': message,
        'sessionId': session_id,
        'autoApprove': True
    })
    
    data = response.json()
    print(f"AI Response: {data['response']['response']}")
    
    if data['type'] == 'terminal':
        print(f"Command: {data['response']['terminalCommand']}")
        print(f"Output: {data['execution']['stdout']}")

chat('What is 12 * 12?')
```

#### WebSocket Terminal Streaming
```python
import asyncio
import websockets
import json

async def stream_command(command):
    uri = "wss://lumenchat.org/ws"
    
    async with websockets.connect(uri) as websocket:
        # Send command
        await websocket.send(json.dumps({
            'type': 'execute',
            'command': command,
            'cwd': '/app'
        }))
        
        # Receive messages
        async for message in websocket:
            data = json.loads(message)
            
            if data['type'] == 'start':
                print(f"\n⚡ Running: {data['command']}")
            elif data['type'] == 'stdout':
                print(data['data'], end='')
            elif data['type'] == 'stderr':
                print(f"[stderr] {data['data']}", end='')
            elif data['type'] == 'complete':
                duration = data['result']['duration'] / 1000
                print(f"\n✅ Completed in {duration:.2f}s")
                break
            elif data['type'] == 'error':
                print(f"\n❌ Error: {data['message']}")
                break

asyncio.run(stream_command('npm install express'))
```

---

### cURL

#### Chat API
```bash
curl -X POST https://lumenchat.org/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Create a hello world function in JavaScript",
    "sessionId": "curl-session"
  }' | jq
```

#### War Room API
```bash
curl -X POST https://lumenchat.org/api/war-room \
  -H "Content-Type: application/json" \
  -d '{
    "proposal": "Fibonacci calculator",
    "code": "def fib(n): return n if n <= 1 else fib(n-1) + fib(n-2)",
    "context": "Python recursive implementation"
  }' | jq
```

#### Memory Status
```bash
curl https://lumenchat.org/api/memory/my-session | jq
```

---

### JavaScript (Browser)

#### Chat API with Fetch
```javascript
async function sendMessage(message) {
  const response = await fetch('https://lumenchat.org/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      message: message,
      sessionId: 'browser-session'
    })
  });
  
  const data = await response.json();
  console.log('Response:', data);
  return data;
}

sendMessage('What is machine learning?');
```

#### WebSocket Terminal
```javascript
const ws = new WebSocket('wss://lumenchat.org/ws');

ws.onopen = () => {
  console.log('Connected');
  ws.send(JSON.stringify({
    type: 'execute',
    command: 'echo "Hello from browser"'
  }));
};

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  console.log(message.type, message);
  
  if (message.type === 'complete') {
    console.log('Exit code:', message.result.exitCode);
  }
};
```

---

## Best Practices

### 1. Session Management
- Use consistent `sessionId` for conversation continuity
- Sessions store up to 21 interactions + 3 summaries
- Clear sessions when starting new topics

### 2. Terminal Commands
- Set `autoApprove: false` for production safety
- Handle `approval_required` responses appropriately
- Use War Room for risky operations

### 3. WebSocket Connections
- Implement reconnection logic (3s delay)
- Handle all message types
- Set reasonable timeouts

### 4. Error Handling
- Check HTTP status codes
- Parse error messages
- Implement retry logic for transient errors

### 5. Memory Efficiency
- Monitor `memoryStatus` in responses
- Clear old sessions
- Use summaries for long conversations

---

## Support

**Documentation:** https://github.com/codenlighten/lumen-core  
**Issues:** https://github.com/codenlighten/lumen-core/issues  
**Production URL:** https://lumenchat.org

---

**Last Updated:** February 6, 2026  
**API Version:** 2.0
