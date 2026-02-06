import { queryOpenAI } from './lib/openaiWrapper.js';

async function testBaseAgent() {
  console.log('Testing openaiWrapper with baseAgent schema...\n');
  
  // Test 1: Simple response
  console.log('Test 1: Simple conversational query');
  try {
    const result1 = await queryOpenAI(
      "What is the capital of France?",
      { temperature: 0.7 }
    );
    console.log('Result:', JSON.stringify(result1, null, 2));
  } catch (error) {
    console.error('Test 1 failed:', error.message);
  }
  
  console.log('\n---\n');
  
  // Test 2: Request code generation
  console.log('Test 2: Code generation request');
  try {
    const result2 = await queryOpenAI(
      "Generate a JavaScript function to calculate fibonacci numbers recursively",
      { temperature: 0.5 }
    );
    console.log('Result:', JSON.stringify(result2, null, 2));
  } catch (error) {
    console.error('Test 2 failed:', error.message);
  }
  
  console.log('\n---\n');
  
  // Test 3: Terminal command request
  console.log('Test 3: Terminal command request');
  try {
    const result3 = await queryOpenAI(
      "List all JavaScript files in the current directory",
      { temperature: 0.3 }
    );
    console.log('Result:', JSON.stringify(result3, null, 2));
  } catch (error) {
    console.error('Test 3 failed:', error.message);
  }
}

testBaseAgent().then(() => {
  console.log('\nAll tests completed!');
}).catch(err => {
  console.error('Fatal error:', err);
});
