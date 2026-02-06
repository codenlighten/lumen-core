/**
 * Lumen Core API Usage Examples
 * 
 * Complete examples for developers integrating with Lumen Core API
 */

const axios = require('axios');
const WebSocket = require('ws');

const BASE_URL = 'https://lumenchat.org';
const WS_URL = 'wss://lumenchat.org/ws';

// ============================================================================
// Example 1: Simple Chat Interaction
// ============================================================================

async function example1_simpleChat() {
  console.log('\n📝 Example 1: Simple Chat\n');
  
  const response = await axios.post(`${BASE_URL}/api/chat`, {
    message: 'What is the capital of France?',
    sessionId: 'example-1'
  });
  
  console.log('AI:', response.data.response.response);
  console.log('Memory:', response.data.memoryStatus.currentWindowSize, '/21 interactions');
}

// ============================================================================
// Example 2: Terminal Command Execution
// ============================================================================

async function example2_terminalCommand() {
  console.log('\n💻 Example 2: Terminal Command\n');
  
  const response = await axios.post(`${BASE_URL}/api/chat`, {
    message: 'List all JavaScript files in the current directory',
    sessionId: 'example-2',
    autoApprove: true
  });
  
  if (response.data.type === 'terminal') {
    console.log('Command:', response.data.response.terminalCommand);
    console.log('Output:\n', response.data.execution.stdout);
    console.log('Status:', response.data.execution.status);
    console.log('Duration:', response.data.execution.duration, 'ms');
  }
}

// ============================================================================
// Example 3: Multi-turn Conversation with Memory
// ============================================================================

async function example3_conversation() {
  console.log('\n💬 Example 3: Multi-turn Conversation\n');
  
  const sessionId = 'example-3-' + Date.now();
  
  // Turn 1
  let response = await axios.post(`${BASE_URL}/api/chat`, {
    message: 'My name is Alice and I like Python programming',
    sessionId
  });
  console.log('Turn 1:', response.data.response.response);
  
  // Turn 2
  response = await axios.post(`${BASE_URL}/api/chat`, {
    message: 'What programming language do I prefer?',
    sessionId
  });
  console.log('Turn 2:', response.data.response.response);
  
  // Turn 3
  response = await axios.post(`${BASE_URL}/api/chat`, {
    message: 'What is my name?',
    sessionId
  });
  console.log('Turn 3:', response.data.response.response);
  
  // Check memory status
  const memStatus = await axios.get(`${BASE_URL}/api/memory/${sessionId}`);
  console.log('\nMemory Status:', memStatus.data);
}

// ============================================================================
// Example 4: Code Generation
// ============================================================================

async function example4_codeGeneration() {
  console.log('\n🔧 Example 4: Code Generation\n');
  
  const response = await axios.post(`${BASE_URL}/api/chat`, {
    message: 'Create a JavaScript function to reverse a string',
    sessionId: 'example-4'
  });
  
  if (response.data.response.choice === 'code') {
    console.log('Generated Code:\n');
    console.log(response.data.response.code);
    console.log('\nExplanation:', response.data.response.codeExplanation);
  } else {
    console.log('Response:', response.data.response.response);
  }
}

// ============================================================================
// Example 5: War Room Code Review
// ============================================================================

async function example5_warRoom() {
  console.log('\n🛡️ Example 5: Agent War Room\n');
  
  const codeToReview = `
function authenticateUser(username, password) {
  if (username === "admin" && password === "admin123") {
    return true;
  }
  return false;
}
  `.trim();
  
  const response = await axios.post(`${BASE_URL}/api/war-room`, {
    proposal: 'User authentication function',
    code: codeToReview,
    context: 'Simple admin authentication for internal tool'
  });
  
  console.log('Verdict:', response.data.verdict);
  console.log('Safe:', response.data.isSafe);
  console.log('Quality Score:', response.data.qualityScore + '/100');
  console.log('\nIssues Found:', response.data.analysis.issues.length);
  response.data.analysis.issues.forEach(issue => {
    console.log(`  - [${issue.severity}] ${issue.description}`);
  });
  
  console.log('\nRecommendations:');
  response.data.analysis.recommendations.forEach(rec => {
    console.log(`  - ${rec}`);
  });
  
  console.log('\nTest Cases:', response.data.testing.testCount);
  response.data.testing.testCases.forEach(test => {
    console.log(`  - ${test.name}: ${test.description}`);
  });
}

// ============================================================================
// Example 6: WebSocket Real-time Terminal Streaming
// ============================================================================

async function example6_websocketStreaming() {
  console.log('\n⚡ Example 6: WebSocket Terminal Streaming\n');
  
  return new Promise((resolve) => {
    const ws = new WebSocket(WS_URL);
    let startTime;
    
    ws.on('open', () => {
      console.log('Connected to WebSocket\n');
      
      ws.send(JSON.stringify({
        type: 'execute',
        command: 'echo "Hello from WebSocket" && sleep 1 && echo "Still running..." && sleep 1 && echo "Done!"'
      }));
    });
    
    ws.on('message', (data) => {
      const message = JSON.parse(data.toString());
      
      switch(message.type) {
        case 'start':
          startTime = Date.now();
          console.log(`🚀 Command Started: ${message.command}\n`);
          break;
          
        case 'stdout':
          process.stdout.write(message.data);
          break;
          
        case 'stderr':
          process.stderr.write(`[ERROR] ${message.data}`);
          break;
          
        case 'complete':
          const duration = ((Date.now() - startTime) / 1000).toFixed(2);
          console.log(`\n\n✅ Completed in ${duration}s`);
          console.log(`Exit Code: ${message.result.exitCode}`);
          ws.close();
          resolve();
          break;
          
        case 'error':
          console.error(`\n❌ Error: ${message.message}`);
          ws.close();
          resolve();
          break;
          
        case 'timeout':
          console.error(`\n⏱️ Timeout: ${message.message}`);
          ws.close();
          resolve();
          break;
      }
    });
    
    ws.on('error', (error) => {
      console.error('WebSocket Error:', error.message);
      resolve();
    });
  });
}

// ============================================================================
// Example 7: Session Management
// ============================================================================

async function example7_sessionManagement() {
  console.log('\n📊 Example 7: Session Management\n');
  
  const sessionId = 'managed-session-' + Date.now();
  
  // Create some interactions
  for (let i = 1; i <= 5; i++) {
    await axios.post(`${BASE_URL}/api/chat`, {
      message: `This is message number ${i}`,
      sessionId
    });
  }
  
  // Check memory status
  const memStatus = await axios.get(`${BASE_URL}/api/memory/${sessionId}`);
  console.log('Memory Status:', memStatus.data);
  console.log(`Used ${memStatus.data.currentWindowSize}/${memStatus.data.maxWindowSize} slots`);
  
  // Clear session
  await axios.delete(`${BASE_URL}/api/session/${sessionId}`);
  console.log('\n✅ Session cleared');
  
  // Verify it's cleared
  try {
    await axios.get(`${BASE_URL}/api/memory/${sessionId}`);
    console.log('Memory after clear: 0 interactions');
  } catch (e) {
    console.log('Session successfully cleared');
  }
}

// ============================================================================
// Example 8: Error Handling
// ============================================================================

async function example8_errorHandling() {
  console.log('\n⚠️ Example 8: Error Handling\n');
  
  // Missing required parameter
  try {
    await axios.post(`${BASE_URL}/api/chat`, {
      sessionId: 'error-example'
      // message is missing!
    });
  } catch (error) {
    console.log('Expected Error:', error.response.data.error);
  }
  
  // Dangerous command (should be blocked)
  const response = await axios.post(`${BASE_URL}/api/chat`, {
    message: 'Delete all files with rm -rf /',
    sessionId: 'error-example',
    autoApprove: false
  });
  
  if (response.data.type === 'approval_required') {
    console.log('\n✅ Dangerous command correctly requires approval');
    console.log('Command:', response.data.command);
    console.log('Reasoning:', response.data.reasoning);
  }
}

// ============================================================================
// Example 9: Batch Processing
// ============================================================================

async function example9_batchProcessing() {
  console.log('\n📦 Example 9: Batch Processing\n');
  
  const questions = [
    'What is 2+2?',
    'What is the capital of Japan?',
    'Who wrote Romeo and Juliet?'
  ];
  
  const sessionId = 'batch-' + Date.now();
  
  const results = await Promise.all(
    questions.map(question => 
      axios.post(`${BASE_URL}/api/chat`, {
        message: question,
        sessionId: sessionId + '-' + questions.indexOf(question)
      })
    )
  );
  
  results.forEach((response, index) => {
    console.log(`Q${index + 1}: ${questions[index]}`);
    console.log(`A${index + 1}: ${response.data.response.response}\n`);
  });
}

// ============================================================================
// Example 10: Advanced WebSocket with Reconnection
// ============================================================================

class ResilientTerminalClient {
  constructor(url) {
    this.url = url;
    this.ws = null;
    this.reconnectDelay = 3000;
    this.shouldReconnect = true;
  }
  
  connect() {
    this.ws = new WebSocket(this.url);
    
    this.ws.on('open', () => {
      console.log('✅ Connected to terminal monitor');
    });
    
    this.ws.on('message', (data) => {
      const message = JSON.parse(data.toString());
      this.handleMessage(message);
    });
    
    this.ws.on('close', () => {
      console.log('❌ Connection closed');
      if (this.shouldReconnect) {
        console.log(`🔄 Reconnecting in ${this.reconnectDelay/1000}s...`);
        setTimeout(() => this.connect(), this.reconnectDelay);
      }
    });
    
    this.ws.on('error', (error) => {
      console.error('WebSocket Error:', error.message);
    });
  }
  
  handleMessage(message) {
    switch(message.type) {
      case 'stdout':
        process.stdout.write(message.data);
        break;
      case 'stderr':
        process.stderr.write(message.data);
        break;
      case 'complete':
        console.log(`\n✅ Exit code: ${message.result.exitCode}`);
        break;
    }
  }
  
  execute(command) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'execute',
        command
      }));
    } else {
      console.error('Not connected');
    }
  }
  
  disconnect() {
    this.shouldReconnect = false;
    if (this.ws) {
      this.ws.close();
    }
  }
}

async function example10_resilientWebSocket() {
  console.log('\n🔄 Example 10: Resilient WebSocket Client\n');
  
  const client = new ResilientTerminalClient(WS_URL);
  client.connect();
  
  // Wait for connection
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Execute command
  client.execute('echo "Testing resilient connection"');
  
  // Wait for completion
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  client.disconnect();
}

// ============================================================================
// Run All Examples
// ============================================================================

async function runAllExamples() {
  console.log('═══════════════════════════════════════════════');
  console.log('   Lumen Core API - Complete Usage Examples');
  console.log('═══════════════════════════════════════════════');
  
  try {
    await example1_simpleChat();
    await example2_terminalCommand();
    await example3_conversation();
    await example4_codeGeneration();
    await example5_warRoom();
    await example6_websocketStreaming();
    await example7_sessionManagement();
    await example8_errorHandling();
    await example9_batchProcessing();
    await example10_resilientWebSocket();
    
    console.log('\n═══════════════════════════════════════════════');
    console.log('   ✅ All Examples Completed Successfully');
    console.log('═══════════════════════════════════════════════\n');
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
}

// Run if executed directly
if (require.main === module) {
  runAllExamples();
}

// Export for use in other modules
module.exports = {
  example1_simpleChat,
  example2_terminalCommand,
  example3_conversation,
  example4_codeGeneration,
  example5_warRoom,
  example6_websocketStreaming,
  example7_sessionManagement,
  example8_errorHandling,
  example9_batchProcessing,
  example10_resilientWebSocket,
  ResilientTerminalClient
};
