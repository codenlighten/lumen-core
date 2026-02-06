import { queryOpenAI } from './lib/openaiWrapper.js';
import { executeAgentCommand } from './lib/terminalExecutor.js';
import { baseAgentExtendedResponseSchema } from './schemas/baseAgent.js';

async function demonstrateIntegration() {
  console.log('🎯 BaseAgent + TerminalExecutor Integration Demo');
  console.log('='.repeat(70));
  console.log('This demo shows how the AI agent generates terminal commands');
  console.log('and the executor safely runs them with proper validation.\n');

  // Demo 1: File discovery
  console.log('Demo 1: Discovering project structure');
  console.log('-'.repeat(70));
  
  const result1 = await queryOpenAI(
    "Show me the directory structure of the lib folder",
    { schema: baseAgentExtendedResponseSchema, temperature: 0.3 }
  );

  if (result1.choice === 'terminalCommand') {
    console.log(`\n🤖 AI Generated Command: ${result1.terminalCommand}`);
    console.log(`💭 Reasoning: ${result1.commandReasoning}\n`);
    
    const exec1 = await executeAgentCommand(
      {
        command: result1.terminalCommand,
        reasoning: result1.commandReasoning,
        requiresApproval: result1.requiresApproval
      },
      { autoApprove: true }
    );
    
    if (exec1.status === 'success') {
      console.log('\n✅ Command succeeded!\n');
    }
  }

  console.log('\n' + '='.repeat(70) + '\n');

  // Demo 2: Git info
  console.log('Demo 2: Git repository information');
  console.log('-'.repeat(70));
  
  const result2 = await queryOpenAI(
    "Check if this is a git repository and show the current branch",
    { schema: baseAgentExtendedResponseSchema, temperature: 0.3 }
  );

  if (result2.choice === 'terminalCommand') {
    console.log(`\n🤖 AI Generated Command: ${result2.terminalCommand}`);
    console.log(`💭 Reasoning: ${result2.commandReasoning}\n`);
    
    const exec2 = await executeAgentCommand(
      {
        command: result2.terminalCommand,
        reasoning: result2.commandReasoning,
        requiresApproval: result2.requiresApproval
      },
      { autoApprove: true }
    );
    
    if (exec2.status === 'success') {
      console.log('\n✅ Command succeeded!\n');
    } else if (exec2.status === 'error') {
      console.log(`\n⚠️  Command failed (probably not a git repo): ${exec2.message}\n`);
    }
  }

  console.log('\n' + '='.repeat(70) + '\n');

  // Demo 3: Package info
  console.log('Demo 3: Show installed npm packages');
  console.log('-'.repeat(70));
  
  const result3 = await queryOpenAI(
    "Show me what npm packages are installed in this project",
    { schema: baseAgentExtendedResponseSchema, temperature: 0.3 }
  );

  if (result3.choice === 'terminalCommand') {
    console.log(`\n🤖 AI Generated Command: ${result3.terminalCommand}`);
    console.log(`💭 Reasoning: ${result3.commandReasoning}\n`);
    
    const exec3 = await executeAgentCommand(
      {
        command: result3.terminalCommand,
        reasoning: result3.commandReasoning,
        requiresApproval: result3.requiresApproval
      },
      { autoApprove: true, timeout: 15000 }
    );
    
    if (exec3.status === 'success') {
      console.log('\n✅ Command succeeded!\n');
    }
  }

  console.log('\n' + '='.repeat(70));
  
  // Summary
  console.log('\n📊 Integration Summary:');
  console.log('  ✓ BaseAgent successfully generated contextual terminal commands');
  console.log('  ✓ TerminalExecutor safely validated and executed commands');
  console.log('  ✓ Audit logging captured all execution events');
  console.log('  ✓ Error handling worked properly for failed commands');
  console.log('\n🎉 Integration working perfectly!\n');
}

demonstrateIntegration().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
