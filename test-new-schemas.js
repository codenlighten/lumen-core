import { queryOpenAI } from './lib/openaiWrapper.js';
import { fileOperationAgentSchema } from './schemas/fileOperationAgent.js';
import { codeAnalyzerAgentSchema } from './schemas/codeAnalyzerAgent.js';
import { testingAgentSchema } from './schemas/testingAgent.js';

console.log('Testing newly generated schemas...\n');

// Test 1: File Operation Agent
console.log('Test 1: File Operation Agent');
console.log('='.repeat(60));
try {
  const result = await queryOpenAI(
    "I need to create a new config.json file with user settings. Make sure to check if it exists first and enable rollback.",
    { schema: fileOperationAgentSchema, temperature: 0.5 }
  );
  console.log(JSON.stringify(result, null, 2));
} catch (error) {
  console.error('Failed:', error.message);
}

console.log('\n' + '='.repeat(60) + '\n');

// Test 2: Code Analyzer Agent
console.log('Test 2: Code Analyzer Agent');
console.log('='.repeat(60));
try {
  const result = await queryOpenAI(
    `Analyze this code for quality and potential issues:
    
    function calc(a,b){
      var result=a+b
      return result
    }`,
    { schema: codeAnalyzerAgentSchema, temperature: 0.6 }
  );
  console.log(JSON.stringify(result, null, 2));
} catch (error) {
  console.error('Failed:', error.message);
}

console.log('\n' + '='.repeat(60) + '\n');

// Test 3: Testing Agent
console.log('Test 3: Testing Agent');
console.log('='.repeat(60));
try {
  const result = await queryOpenAI(
    `Generate Jest unit tests for a simple add function: function add(a, b) { return a + b; }`,
    { schema: testingAgentSchema, temperature: 0.5 }
  );
  console.log(JSON.stringify(result, null, 2));
} catch (error) {
  console.error('Failed:', error.message);
}

console.log('\n\nAll schema tests completed!');
