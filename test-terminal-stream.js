import WebSocket from 'ws';

/**
 * Test WebSocket Terminal Streaming
 * 
 * Tests the real-time terminal monitor with various commands
 */

const WS_URL = process.env.WS_URL || 'ws://localhost:3000/ws';

async function testTerminalStream() {
  console.log('🧪 Testing WebSocket Terminal Streaming...\n');

  const ws = new WebSocket(WS_URL);

  ws.on('open', () => {
    console.log('✅ WebSocket connected\n');

    // Test 1: Simple echo command
    console.log('Test 1: Simple echo command');
    ws.send(JSON.stringify({
      type: 'execute',
      command: 'echo "Hello from Lumen Terminal Monitor"'
    }));

    // Test 2: Long-running command after delay
    setTimeout(() => {
      console.log('\nTest 2: Multi-line output (ls -la)');
      ws.send(JSON.stringify({
        type: 'execute',
        command: 'ls -la'
      }));
    }, 2000);

    // Test 3: Command with stderr
    setTimeout(() => {
      console.log('\nTest 3: Command with stderr (ls nonexistent)');
      ws.send(JSON.stringify({
        type: 'execute',
        command: 'ls /nonexistent-dir-test-123 2>&1'
      }));
    }, 4000);

    // Test 4: npm command (shows real-time output)
    setTimeout(() => {
      console.log('\nTest 4: npm version (shows installed packages)');
      ws.send(JSON.stringify({
        type: 'execute',
        command: 'npm list --depth=0'
      }));
    }, 6000);

    // Close after tests
    setTimeout(() => {
      console.log('\n✅ All tests completed');
      ws.close();
      process.exit(0);
    }, 10000);
  });

  ws.on('message', (data) => {
    const message = JSON.parse(data.toString());
    
    switch(message.type) {
      case 'start':
        console.log(`\n⚡ Started: ${message.command}`);
        break;
      case 'stdout':
        process.stdout.write(`  ${message.data}`);
        break;
      case 'stderr':
        console.log(`  [stderr] ${message.data}`);
        break;
      case 'complete':
        const duration = message.result.duration / 1000;
        if (message.result.exitCode === 0) {
          console.log(`\n✅ Success (${duration.toFixed(2)}s)\n`);
        } else {
          console.log(`\n❌ Failed with exit code ${message.result.exitCode} (${duration.toFixed(2)}s)\n`);
        }
        break;
      case 'error':
        console.log(`\n❌ Error: ${message.message}\n`);
        break;
      case 'ack':
        console.log(`  Acknowledged: ${message.message}`);
        break;
    }
  });

  ws.on('error', (error) => {
    console.error('❌ WebSocket error:', error.message);
    process.exit(1);
  });

  ws.on('close', () => {
    console.log('\nWebSocket connection closed');
  });
}

testTerminalStream();
