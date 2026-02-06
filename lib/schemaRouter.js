import { queryOpenAI } from './openaiWrapper.js';
import { baseAgentExtendedResponseSchema } from '../schemas/baseAgent.js';
import { projectScaffolderAgentSchema } from '../schemas/projectScaffolderAgent.js';
import { fileOperationAgentSchema } from '../schemas/fileOperationAgent.js';
import { codeAnalyzerAgentSchema } from '../schemas/codeAnalyzerAgent.js';
import { testingAgentSchema } from '../schemas/testingAgent.js';
import { docGeneratorAgentSchema } from '../schemas/docGeneratorAgent.js';

/**
 * Schema Registry - Maps intent types to specialized agent schemas
 */
const SCHEMA_REGISTRY = {
  scaffold: projectScaffolderAgentSchema,
  fileOp: fileOperationAgentSchema,
  analyze: codeAnalyzerAgentSchema,
  test: testingAgentSchema,
  docs: docGeneratorAgentSchema,
  default: baseAgentExtendedResponseSchema
};

/**
 * Intent Classification Schema
 * Used to determine which specialized agent to use
 */
const intentClassificationSchema = {
  type: "object",
  properties: {
    recommendedAgent: { 
      type: "string", 
      enum: ["scaffold", "fileOp", "analyze", "test", "docs", "default"],
      description: "The specialized agent best suited for this task"
    },
    reasoning: { 
      type: "string",
      description: "Why this agent was selected"
    },
    confidence: {
      type: "string",
      enum: ["high", "medium", "low"],
      description: "Confidence level in this classification"
    }
  },
  required: ["recommendedAgent", "reasoning", "confidence"],
  additionalProperties: false
};

/**
 * Schema Router - Dynamically selects the correct schema for queryOpenAI
 * based on user intent and conversational history.
 * 
 * This acts as a "dispatcher" that routes requests to specialized agents.
 * 
 * @param {string} userInput - The user's request
 * @param {MemoryManager} memory - Memory context
 * @returns {Promise<object>} Agent response with appropriate schema
 */
export async function schemaRouter(userInput, memory) {
  const context = memory.getHydratedContext();

  // Keywords that strongly indicate specific agents
  const keywords = {
    scaffold: ['initialize', 'scaffold', 'create project', 'setup project', 'new project', 'bootstrap'],
    fileOp: ['create file', 'write file', 'delete file', 'update file', 'move file', 'rename file'],
    analyze: ['analyze code', 'review code', 'check quality', 'find bugs', 'code review', 'refactor'],
    test: ['generate tests', 'write tests', 'create tests', 'test this', 'unit test', 'integration test'],
    docs: ['document', 'generate docs', 'create documentation', 'explain this code']
  };

  // Quick keyword-based routing for obvious cases
  const lowerInput = userInput.toLowerCase();
  for (const [agentType, words] of Object.entries(keywords)) {
    if (words.some(word => lowerInput.includes(word))) {
      console.log(`🎯 [Schema Router] Quick match: ${agentType} agent (keyword detected)`);
      return await queryOpenAI(userInput, {
        context,
        schema: SCHEMA_REGISTRY[agentType],
        temperature: 0.6
      });
    }
  }

  // If no obvious match, use AI to classify intent
  try {
    const classification = await queryOpenAI(
      `Analyze this user request and determine which specialized agent is best suited.
      
User Request: "${userInput}"

Available Agents:
- scaffold: For initializing new projects with templates, dependencies, and directory structures
- fileOp: For file CRUD operations (create, read, update, delete)
- analyze: For code quality review, bug detection, and refactoring suggestions
- test: For generating unit tests, integration tests, and test data
- docs: For creating documentation from code
- default: For general conversation, questions, or tasks that don't fit other categories`,
      { 
        context, 
        schema: intentClassificationSchema,
        temperature: 0.3
      }
    );

    console.log(`🎯 [Schema Router] AI classification: ${classification.recommendedAgent} (${classification.confidence} confidence)`);
    console.log(`   Reasoning: ${classification.reasoning}`);

    const selectedSchema = SCHEMA_REGISTRY[classification.recommendedAgent] || SCHEMA_REGISTRY.default;

    return await queryOpenAI(userInput, {
      context,
      schema: selectedSchema,
      temperature: 0.6
    });

  } catch (error) {
    console.error('Schema routing failed, falling back to default agent:', error.message);
    return await queryOpenAI(userInput, {
      context,
      schema: SCHEMA_REGISTRY.default,
      temperature: 0.6
    });
  }
}

/**
 * Get information about available schemas
 * @returns {object} Schema registry info
 */
export function getAvailableSchemas() {
  return Object.keys(SCHEMA_REGISTRY).map(key => ({
    name: key,
    description: getSchemaDescription(key)
  }));
}

function getSchemaDescription(key) {
  const descriptions = {
    scaffold: 'Initialize new projects with templates and structure',
    fileOp: 'Perform file operations with safety checks',
    analyze: 'Analyze code quality and detect issues',
    test: 'Generate automated tests',
    docs: 'Create comprehensive documentation',
    default: 'General conversation and task handling'
  };
  return descriptions[key] || 'Unknown';
}
