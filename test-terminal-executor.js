import { queryOpenAI } from './lib/openaiWrapper.js';
import { executeAgentCommand } from './lib/terminalExecutor.js';
import { baseAgentExtendedResponseSchema } from './schemas/baseAgent.js';

async function testTerminalExecution() {
  console.log('🧪 Testing Terminal Executor with BaseAgent');
  console.log('='.repeat(70));
  console.log();

  // Test 1: Simple safe command
  console.log('Test 1: Generate and execute a simple directory listing');
  console.log('-'.repeat(70));
  
  try {
    // Get a terminal command from the baseAgent
    const agentResponse = await queryOpenAI(
      "List all JavaScript files in the current directory with their sizes",
      { 
        schema: baseAgentExtendedResponseSchema,
        temperature: 0.3 
      }
    );

    console.log('\n📋 Agent Response:');
    console.log(`  Choice: ${agentResponse.choice}`);
    
    if (agentResponse.choice === 'terminalCommand') {
      console.log(`  Command: ${agentResponse.terminalCommand}`);
      console.log(`  Reasoning: ${agentResponse.commandReasoning}`);
      console.log(`  Requires Approval: ${agentResponse.requiresApproval}`);
      
      // Execute the command with auto-approval for this safe test
      const executionResult = await executeAgentCommand(
        {
          command: agentResponse.terminalCommand,
          reasoning: agentResponse.commandReasoning,
          requiresApproval: agentResponse.requiresApproval
        },
        {
          autoApprove: true,  // Auto-approve for this test
          dryRun: false,
          timeout: 10000
        }
      );
      
      console.log('\n📊 Execution Result:');
      console.log(JSON.stringify(executionResult, null, 2));
    } else {
      console.log('⚠️  Agent did not return a terminal command');
      console.log('   Response:', agentResponse.response);
    }
    
  } catch (error) {
    console.error('❌ Test 1 failed:', error.message);
  }

  console.log('\n' + '='.repeat(70));
  console.log();

  // Test 2: Another command - checking system info
  console.log('Test 2: Generate and execute system info command');
  console.log('-'.repeat(70));
  
  try {
    const agentResponse = await queryOpenAI(
      "Show me the current date and time in a nice format",
      { 
        schema: baseAgentExtendedResponseSchema,
        temperature: 0.3 
      }
    );

    console.log('\n📋 Agent Response:');
    console.log(`  Choice: ${agentResponse.choice}`);
    
    if (agentResponse.choice === 'terminalCommand') {
      console.log(`  Command: ${agentResponse.terminalCommand}`);
      console.log(`  Reasoning: ${agentResponse.commandReasoning}`);
      
      const executionResult = await executeAgentCommand(
        {
          command: agentResponse.terminalCommand,
          reasoning: agentResponse.commandReasoning,
          requiresApproval: agentResponse.requiresApproval
        },
        {
          autoApprove: true,
          dryRun: false
        }
      );
      
      console.log('\n📊 Execution Result:');
      console.log(JSON.stringify(executionResult, null, 2));
    } else {
      console.log('⚠️  Agent did not return a terminal command');
      console.log('   Response:', agentResponse.response);
    }
    
  } catch (error) {
    console.error('❌ Test 2 failed:', error.message);
  }

  console.log('\n' + '='.repeat(70));
  console.log();

  // Test 3: Dry run mode test
  console.log('Test 3: Dry run mode (validation only, no execution)');
  console.log('-'.repeat(70));
  
  try {
    const agentResponse = await queryOpenAI(
      "Count the number of lines in all JavaScript files",
      { 
        schema: baseAgentExtendedResponseSchema,
        temperature: 0.3 
      }
    );

    console.log('\n📋 Agent Response:');
    console.log(`  Choice: ${agentResponse.choice}`);
    
    if (agentResponse.choice === 'terminalCommand') {
      console.log(`  Command: ${agentResponse.terminalCommand}`);
      console.log(`  Reasoning: ${agentResponse.commandReasoning}`);
      
      const executionResult = await executeAgentCommand(
        {
          command: agentResponse.terminalCommand,
          reasoning: agentResponse.commandReasoning,
          requiresApproval: agentResponse.requiresApproval
        },
        {
          autoApprove: true,
          dryRun: true  // Just validate, don't execute
        }
      );
      
      console.log('\n📊 Execution Result:');
      console.log(JSON.stringify(executionResult, null, 2));
    } else {
      console.log('⚠️  Agent did not return a terminal command');
      console.log('   Response:', agentResponse.response);
    }
    
  } catch (error) {
    console.error('❌ Test 3 failed:', error.message);
  }

  console.log('\n' + '='.repeat(70));
  console.log('\n✅ All tests completed!\n');
}

testTerminalExecution().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
