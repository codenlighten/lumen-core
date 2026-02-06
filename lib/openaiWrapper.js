import OpenAI from 'openai';
import dotenv from 'dotenv';
import { baseAgentExtendedResponseSchema } from '../schemas/baseAgent.js';

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Wrapper for OpenAI Chat Completions with JSON schema response format
 * Includes retry logic for rate limits and transient errors
 * @param {string} query - The user query/prompt
 * @param {object} options - Optional configuration
 * @param {object} options.context - Additional context object to include in the prompt
 * @param {object} options.schema - JSON schema for structured output (defaults to baseAgentResponseSchema)
 * @param {string} options.model - Model to use (defaults to OPENAI_DEFAULT_MODEL from .env)
 * @param {number} options.temperature - Temperature setting (defaults to OPENAI_DEFAULT_TEMPERATURE from .env)
 * @param {number} options.maxRetries - Maximum retry attempts for rate limits (default 3)
 * @returns {Promise<object>} Parsed JSON response matching the schema
 */
export async function queryOpenAI(query, options = {}) {
  const {
    context = null,
    schema = baseAgentExtendedResponseSchema,
    model = process.env.OPENAI_DEFAULT_MODEL || 'gpt-4o-mini',
    temperature = parseFloat(process.env.OPENAI_DEFAULT_TEMPERATURE) || 1.0,
    maxRetries = 3
  } = options;

  // Build the prompt with optional context
  let promptContent = query;
  if (context) {
    promptContent = `Context: ${JSON.stringify(context, null, 2)}\n\nQuery: ${query}`;
  }

  let lastError = null;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const completion = await openai.chat.completions.create({
        model,
        temperature,
        messages: [
          {
            role: "user",
            content: promptContent
          }
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "agent_response",
            strict: true,
            schema
          }
        }
      });

      // Parse and return the JSON response
      const responseContent = completion.choices[0].message.content;
      return JSON.parse(responseContent);
    } catch (error) {
      lastError = error;
      
      // Check if error is retryable (429 rate limit or 5xx server errors)
      const isRateLimitError = error.status === 429;
      const isServerError = error.status >= 500 && error.status < 600;
      const shouldRetry = (isRateLimitError || isServerError) && attempt < maxRetries;
      
      if (shouldRetry) {
        // Exponential backoff: 1s, 2s, 4s
        const delayMs = Math.pow(2, attempt) * 1000;
        console.warn(`OpenAI API Error (attempt ${attempt + 1}/${maxRetries + 1}): ${error.message}`);
        console.warn(`  Retrying in ${delayMs}ms...`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
        continue;
      }
      
      // Non-retryable error or max retries exceeded
      console.error('OpenAI API Error:', error.message);
      throw error;
    }
  }
  
  // Should never reach here, but just in case
  throw lastError;
}

/**
 * Simple wrapper for OpenAI with json_object mode (no strict schema)
 * @param {string} query - The user query/prompt (should mention JSON in the prompt)
 * @param {object} options - Optional configuration
 * @param {object} options.context - Additional context object to include in the prompt
 * @param {string} options.model - Model to use (defaults to OPENAI_DEFAULT_MODEL from .env)
 * @param {number} options.temperature - Temperature setting (defaults to OPENAI_DEFAULT_TEMPERATURE from .env)
 * @returns {Promise<object>} Parsed JSON response
 */
export async function queryOpenAIJsonMode(query, options = {}) {
  const {
    context = null,
    model = process.env.OPENAI_DEFAULT_MODEL || 'gpt-4o-mini',
    temperature = parseFloat(process.env.OPENAI_DEFAULT_TEMPERATURE) || 1.0,
  } = options;

  // Build the prompt with optional context
  let promptContent = query;
  if (context) {
    promptContent = `Context: ${JSON.stringify(context, null, 2)}\n\nQuery: ${query}`;
  }

  try {
    const completion = await openai.chat.completions.create({
      model,
      temperature,
      messages: [
        {
          role: "user",
          content: promptContent
        }
      ],
      response_format: { type: "json_object" }
    });

    // Parse and return the JSON response
    const responseContent = completion.choices[0].message.content;
    return JSON.parse(responseContent);
  } catch (error) {
    console.error('OpenAI API Error:', error.message);
    throw error;
  }
}

export default { queryOpenAI, queryOpenAIJsonMode };