import { MemoryManager } from './lib/MemoryManager.js';
import { schemaRouter } from './lib/schemaRouter.js';
import { executeAgentCommand } from './lib/terminalExecutor.js';
import { createInterface } from 'readline';

const rl = createInterface({ input: process.stdin, output: process.stdout });
const memory = new MemoryManager();

/**
 * Lumen Core - The primary execution loop that integrates:
 * - Rolling memory management (21-interaction window + 3 summaries)
 * - Dynamic schema routing (specialized agents)
 * - Safe terminal execution
 * - Self-correcting feedback loops
 */

const SYSTEM_PROMPT = `You are the Lumen Dispatcher, an advanced autonomous orchestrator.

CORE IDENTITY:
You solve user requests by either communicating directly or deploying specialized agent schemas.
You operate using a rolling 21-interaction window and 3-level summary memory.

OPERATIONAL HIERARCHY:
1. Context Alignment: Check if missingContext is required. If the request is vague, list requirements.
2. Schema Selection: Match intent to the most professional tool:
   - Project Initialization: Use projectScaffolderAgent for structures, dependencies, configs
   - File Manipulation: Use fileOperationAgent for CRUD with safetyChecks
   - Code Quality: Use codeAnalyzerAgent for quality scores and bug reports
   - Verification: Use testingAgent for unit/integration tests
   - Documentation: Use docGeneratorAgent for knowledge base
3. Memory Loop: Every 21 interactions triggers automatic summarization

EXECUTION RULES:
- Terminal Safety: All terminalCommand choices must include commandReasoning
- Set requiresApproval: true for destructive actions (rm, mv, overwrites)
- Continuity: Set continue: true for multi-step tasks to trigger next loop
- JSON Strictness: Output valid JSON matching the schema exactly

WORKFLOW PHASES:
Phase 1 - Discovery: Identify missingContext, scaffold structure, initialize
Phase 2 - Implementation: Write code, analyze quality, generate tests
Phase 3 - Finalization: Document code, verify completion

You are not just a chatbot - you are an autonomous system that plans, executes, and verifies.`;

/**
 * The primary loop that keeps Lumen running and learning
 */
async function mainLoop() {
  console.log("🌟 Lumen Core Online");
  console.log("━".repeat(70));
  console.log("Features:");
  console.log("  • Rolling memory (21-interaction window + 3 summaries)");
  console.log("  • Dynamic schema routing (6 specialized agents)");
  console.log("  • Safe terminal execution with audit logging");
  console.log("  • Self-correcting feedback loops");
  console.log("\nType 'exit' to quit, 'status' for memory status\n");

  const askQuestion = (query) => new Promise(resolve => rl.question(query, resolve));

  while (true) {
    const userInput = await askQuestion("👤 You: ");
    
    if (userInput.toLowerCase() === 'exit') {
      console.log("\n👋 Goodbye!");
      break;
    }

    if (userInput.toLowerCase() === 'status') {
      const status = memory.getMemoryStatus();
      console.log("\n📊 Memory Status:");
      console.log(`   Total interactions: ${status.totalInteractions}`);
      console.log(`   Current window: ${status.currentWindowSize}/${memory.config.windowSize}`);
      console.log(`   Summaries: ${status.summariesCount}/${memory.config.maxSummaries}`);
      console.log(`   ID range: ${status.oldestInteractionId} → ${status.newestInteractionId}\n`);
      continue;
    }

    if (!userInput.trim()) continue;

    let currentInput = userInput;
    let isChaining = true;
    let loopCount = 0;
    const maxLoops = 10; // Safety limit to prevent infinite loops

    while (isChaining && loopCount < maxLoops) {
      loopCount++;
      
      try {
        // 1. Memory Update: Store the user's intent
        await memory.addInteraction("user", currentInput);

        // 2. Routing: Decide which specialized agent to deploy
        console.log("\n🔍 Analyzing request...");
        const agentResponse = await schemaRouter(currentInput, memory);

        // 3. Context Gate: Stop if the agent is missing information
        if (agentResponse.missingContext?.length > 0) {
          console.log("\n🤔 Lumen needs more context:");
          agentResponse.missingContext.forEach(ctx => console.log(`   • ${ctx}`));
          
          if (agentResponse.response) {
            console.log(`\n💬 ${agentResponse.response}`);
          }
          
          await memory.addInteraction("ai", agentResponse.response || `Missing: ${agentResponse.missingContext.join(', ')}`);
          isChaining = false;
          break;
        }

        // 4. Execution Branching
        if (agentResponse.choice === "terminalCommand") {
          console.log(`\n🔧 Terminal Command Mode`);
          console.log(`   Command: ${agentResponse.terminalCommand}`);
          console.log(`   Reasoning: ${agentResponse.commandReasoning}`);
          
          const result = await executeAgentCommand(
            {
              command: agentResponse.terminalCommand,
              reasoning: agentResponse.commandReasoning,
              requiresApproval: agentResponse.requiresApproval
            },
            {
              autoApprove: false, // Always ask for approval in interactive mode
              dryRun: false,
              timeout: 30000
            }
          );
          
          // Feed the results back into memory
          const systemFeedback = `Command ${result.status}. ${result.stdout || result.stderr || result.message}`;
          await memory.addInteraction("system", systemFeedback.substring(0, 500)); // Truncate long output
          
          // Prepare input for next loop
          currentInput = `The command ${result.status}. ${result.status === 'success' ? 'What is the next step?' : 'How should we handle this?'}`;
          
        } else if (agentResponse.choice === "code") {
          console.log(`\n💻 Code Generation Mode`);
          console.log(`   Language: ${agentResponse.language}`);
          console.log(`   Explanation: ${agentResponse.codeExplanation}`);
          console.log(`\nGenerated Code:\n${"─".repeat(70)}`);
          console.log(agentResponse.code);
          console.log("─".repeat(70));
          
          await memory.addInteraction("ai", `Generated ${agentResponse.language} code: ${agentResponse.codeExplanation}`);
          
        } else {
          // Standard conversational response
          console.log(`\n🤖 Lumen: ${agentResponse.response}`);
          await memory.addInteraction("ai", agentResponse.response);
        }

        // Display questions if any
        if (agentResponse.questionsForUser && agentResponse.questions?.length > 0) {
          console.log("\n❓ Questions:");
          agentResponse.questions.forEach((q, i) => console.log(`   ${i + 1}. ${q}`));
        }

        // 5. Continuity Check
        isChaining = agentResponse.continue;
        if (isChaining) {
          console.log("\n🔄 Agent is continuing to next task...");
        }

      } catch (error) {
        console.error(`\n❌ Error: ${error.message}`);
        await memory.addInteraction("system", `Error occurred: ${error.message}`);
        isChaining = false;
      }
    }

    if (loopCount >= maxLoops) {
      console.log("\n⚠️  Reached maximum loop iterations. Stopping for safety.");
    }

    console.log(); // Extra newline for readability
  }

  rl.close();
}

// Start the system
console.log("\n" + SYSTEM_PROMPT + "\n");
mainLoop().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
