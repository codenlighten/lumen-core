import { queryOpenAI } from './lib/openaiWrapper.js';
import { schemaGeneratorResponseSchema } from './schemas/schemaGenerator.js';
import fs from 'fs';
import path from 'path';

async function generateSchema(description, filename) {
  console.log(`\nGenerating schema for: ${description}`);
  console.log('='.repeat(60));
  
  try {
    const result = await queryOpenAI(
      `Create a JSON schema for: ${description}. 
      
      The schema should follow OpenAI's structured output format requirements:
      - Use strict: true compatible types
      - All properties in 'required' must exist in 'properties'
      - Set additionalProperties to false
      - Use proper type definitions (string, number, boolean, object, array)
      - Include helpful descriptions for each field
      
      Return the complete schema as a valid JSON object string that can be parsed.`,
      { 
        schema: schemaGeneratorResponseSchema,
        temperature: 0.7 
      }
    );
    
    console.log('\nReasoning:', result.reasoning);
    
    if (result.missingContext.length > 0) {
      console.log('\nMissing context:');
      result.missingContext.forEach(ctx => console.log(`  - ${ctx}`));
    }
    
    // Parse the schema string to validate it's valid JSON
    const schema = JSON.parse(result.schemaAsString);
    
    // Create the schema file content
    const fileContent = `/**
 * ${description}
 * 
 * Generated: ${new Date().toISOString()}
 * Reasoning: ${result.reasoning}
 */
export const ${filename.replace('.js', '')}Schema = ${JSON.stringify(schema, null, 2)};
`;
    
    const filePath = path.join('schemas', filename);
    fs.writeFileSync(filePath, fileContent);
    
    console.log(`\n✓ Schema saved to: ${filePath}`);
    console.log('\nGenerated schema preview:');
    console.log(JSON.stringify(schema, null, 2).substring(0, 500) + '...');
    
    return { success: true, schema, filePath };
    
  } catch (error) {
    console.error(`✗ Failed to generate schema: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function main() {
  console.log('Schema Generator Tool');
  console.log('====================\n');
  
  // Define schemas to generate
  const schemasToGenerate = [
    {
      description: "A file operation agent that can create, read, update, delete files with safety checks and rollback capabilities",
      filename: "fileOperationAgent.js"
    },
    {
      description: "A code analyzer agent that reviews code quality, suggests improvements, detects potential bugs, and provides refactoring recommendations",
      filename: "codeAnalyzerAgent.js"
    },
    {
      description: "A project scaffolder agent that can initialize new projects with templates, dependencies, configuration files, and directory structures",
      filename: "projectScaffolderAgent.js"
    },
    {
      description: "A documentation generator agent that creates comprehensive documentation from code comments, function signatures, and usage examples",
      filename: "docGeneratorAgent.js"
    },
    {
      description: "A testing agent that can generate unit tests, integration tests, and test data based on code analysis",
      filename: "testingAgent.js"
    }
  ];
  
  const results = [];
  
  for (const spec of schemasToGenerate) {
    const result = await generateSchema(spec.description, spec.filename);
    results.push({ ...spec, ...result });
    
    // Small delay between requests to avoid rate limits
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n\n' + '='.repeat(60));
  console.log('Summary');
  console.log('='.repeat(60));
  
  results.forEach(r => {
    const status = r.success ? '✓' : '✗';
    console.log(`${status} ${r.filename}: ${r.success ? 'Generated' : r.error}`);
  });
  
  const successCount = results.filter(r => r.success).length;
  console.log(`\n${successCount}/${results.length} schemas generated successfully`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
