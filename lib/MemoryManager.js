import { queryOpenAI } from './openaiWrapper.js';
import { summarizeAgentResponseSchema } from '../schemas/summarizeAgent.js';

/**
 * MemoryManager - Implements the 21-interaction rolling window 
 * and 3-chunk rolling summary method.
 * 
 * This creates a "Context Hydrator" that maintains both:
 * - Recent detailed interactions (last 21 messages)
 * - Compressed historical summaries (3 rolling chunks)
 * 
 * This approach prevents context window bloat while maintaining
 * long-term alignment with project goals.
 */
export class MemoryManager {
  constructor(config = { windowSize: 21, maxSummaries: 3 }) {
    this.interactions = [];
    this.summaries = [];
    this.config = config;
    this.globalCounter = 0;
  }

  /**
   * Add an interaction to the rolling window
   * Automatically triggers summary creation when window exceeds size
   * @param {string} role - 'user', 'ai', or 'system'
   * @param {string} text - The interaction content
   */
  async addInteraction(role, text) {
    this.globalCounter++;
    this.interactions.push({
      role,
      text,
      ts: new Date().toISOString(),
      id: this.globalCounter
    });

    // Trigger summary when window is full
    if (this.interactions.length > this.config.windowSize) {
      await this._createSummary();
      this.interactions.shift(); // Remove oldest interaction
    }
  }

  /**
   * Create a summary of the current window before it slides
   * @private
   */
  async _createSummary() {
    const contextToSummarize = this.interactions;
    
    // Format interactions for summarization
    const conversationText = contextToSummarize
      .map(i => `[${i.role}]: ${i.text}`)
      .join('\n');

    try {
      const result = await queryOpenAI(
        "Summarize this conversation segment concisely, focusing on goals, decisions, state changes, and any important technical details or file paths.",
        {
          context: { conversation: conversationText },
          schema: summarizeAgentResponseSchema,
          temperature: 0.5
        }
      );

      const newSummary = {
        range: { 
          startId: contextToSummarize[0].id, 
          endId: contextToSummarize[contextToSummarize.length - 1].id 
        },
        text: result.summary,
        reasoning: result.reasoning,
        ts: new Date().toISOString()
      };

      this.summaries.push(newSummary);

      // Keep only the most recent summaries
      if (this.summaries.length > this.config.maxSummaries) {
        this.summaries.shift(); // Drop oldest summary
      }

      console.log(`\n📚 [Memory Compaction] Created summary for interactions ${newSummary.range.startId}-${newSummary.range.endId}`);
    } catch (error) {
      console.error('Failed to create summary:', error.message);
    }
  }

  /**
   * Get the hydrated context for AI queries
   * Includes both recent interactions and historical summaries
   * @returns {object} Context object with recent history and summaries
   */
  getHydratedContext() {
    return {
      recentHistory: this.interactions,
      contextSummaries: [...this.summaries].reverse() // Newest first
    };
  }

  /**
   * Get a human-readable representation of the current memory state
   * @returns {string} Formatted memory status
   */
  getMemoryStatus() {
    return {
      totalInteractions: this.globalCounter,
      currentWindowSize: this.interactions.length,
      summariesCount: this.summaries.length,
      oldestInteractionId: this.interactions[0]?.id,
      newestInteractionId: this.interactions[this.interactions.length - 1]?.id
    };
  }

  /**
   * Export memory state for persistence
   * @returns {object} Serializable memory state
   */
  export() {
    return {
      interactions: this.interactions,
      summaries: this.summaries,
      globalCounter: this.globalCounter,
      config: this.config
    };
  }

  /**
   * Import memory state from persistence
   * @param {object} state - Previously exported state
   */
  import(state) {
    this.interactions = state.interactions || [];
    this.summaries = state.summaries || [];
    this.globalCounter = state.globalCounter || 0;
    this.config = { ...this.config, ...state.config };
  }
}
