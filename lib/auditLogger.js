/**
 * Audit Logger - Logs command executions for security and debugging
 * Simple implementation that logs to console and could be extended to write to files
 */

/**
 * Logs a command execution event
 * @param {object} event - The command execution event
 * @param {string} event.status - success, error, denied, blocked, dry-run
 * @param {string} event.command - The command that was executed
 * @param {string} event.reasoning - Why this command was chosen
 * @param {string} event.stdout - Standard output (if success)
 * @param {string} event.stderr - Standard error (if success)
 * @param {string} event.message - Error or status message
 */
export async function logCommand(event) {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    ...event
  };
  
  // For now, just log to console with structured format
  // In production, this could write to a file, database, or external logging service
  console.log('\n📋 [Audit Log]', JSON.stringify(logEntry, null, 2));
  
  return logEntry;
}
