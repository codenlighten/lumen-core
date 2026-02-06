import { spawn } from 'child_process';
import { logCommand } from './auditLogger.js';

/**
 * Terminal Streamer - Real-time streaming command execution
 * 
 * Executes commands and streams stdout/stderr via WebSocket
 * Provides live visibility into long-running processes
 */

const DANGEROUS_PATTERNS = [
  /rm\s+-rf\s+\/($|\s)/,
  /:\(\)\{.*:\|:.*\}/,
  /\/dev\/sda/,
  /mkfs/,
  /dd\s+if=/,
  /\/etc\/passwd/,
  /curl.*\|.*bash/,
  /wget.*\|.*sh/,
];

/**
 * Check if command contains dangerous patterns
 */
function isDangerous(command) {
  return DANGEROUS_PATTERNS.some(pattern => pattern.test(command));
}

/**
 * Stream terminal command execution via WebSocket
 * @param {string} command - Command to execute
 * @param {object} ws - WebSocket connection
 * @param {object} options - Execution options
 * @returns {Promise<object>} Final execution result
 */
export async function streamCommand(command, ws, options = {}) {
  const {
    cwd = process.cwd(),
    timeout = 300000, // 5 min default
    shell = '/bin/bash'
  } = options;

  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    let stdout = '';
    let stderr = '';
    let killed = false;

    // Safety check
    if (isDangerous(command)) {
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Command blocked: Contains dangerous patterns',
        command
      }));
      return reject(new Error('Dangerous command blocked'));
    }

    // Notify start
    ws.send(JSON.stringify({
      type: 'start',
      command,
      cwd,
      timestamp: startTime
    }));

    // Spawn process
    const [cmd, ...args] = command.split(' ');
    const proc = spawn(cmd, args, {
      cwd,
      shell,
      env: process.env
    });

    // Stream stdout
    proc.stdout.on('data', (data) => {
      const text = data.toString();
      stdout += text;
      ws.send(JSON.stringify({
        type: 'stdout',
        data: text,
        timestamp: Date.now()
      }));
    });

    // Stream stderr
    proc.stderr.on('data', (data) => {
      const text = data.toString();
      stderr += text;
      ws.send(JSON.stringify({
        type: 'stderr',
        data: text,
        timestamp: Date.now()
      }));
    });

    // Handle completion
    proc.on('close', (code) => {
      const endTime = Date.now();
      const duration = endTime - startTime;

      const result = {
        status: code === 0 ? 'success' : 'error',
        exitCode: code,
        stdout,
        stderr,
        duration,
        killed
      };

      ws.send(JSON.stringify({
        type: 'complete',
        result,
        timestamp: endTime
      }));

      // Log to audit trail
      logCommand({
        command,
        status: result.status,
        stdout: stdout.slice(0, 500),
        stderr: stderr.slice(0, 500),
        duration
      });

      resolve(result);
    });

    // Handle errors
    proc.on('error', (error) => {
      ws.send(JSON.stringify({
        type: 'error',
        message: error.message,
        timestamp: Date.now()
      }));
      reject(error);
    });

    // Timeout protection
    const timeoutId = setTimeout(() => {
      killed = true;
      proc.kill('SIGTERM');
      
      setTimeout(() => {
        if (!proc.killed) {
          proc.kill('SIGKILL');
        }
      }, 5000);

      ws.send(JSON.stringify({
        type: 'timeout',
        message: `Command exceeded ${timeout}ms timeout`,
        timestamp: Date.now()
      }));
    }, timeout);

    // Cleanup on process exit
    proc.on('close', () => {
      clearTimeout(timeoutId);
    });
  });
}

/**
 * Get list of running processes
 * Useful for monitoring what commands are active
 */
export function getActiveProcesses() {
  // Track active processes in memory
  // In production, use Redis or similar
  return [];
}
