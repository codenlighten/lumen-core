import { runWarRoom } from './lib/workflows/warRoom.js';

const scenarios = [
  {
    name: 'Fibonacci Optimization',
    proposal: 'Refactor the Fibonacci function to use memoization for O(n) performance',
    code: `function fib(n) {
  if (n <= 1) return n;
  return fib(n - 1) + fib(n - 2);
}`,
    context: 'Performance-critical function called 10,000+ times per request'
  },
  {
    name: 'SQL Injection Risk',
    proposal: 'Add user search functionality to database query',
    code: `function searchUsers(query) {
  const sql = "SELECT * FROM users WHERE name = '" + query + "'";
  return db.execute(sql);
}`,
    context: 'Public-facing API endpoint with user input'
  },
  {
    name: 'Safe File Operation',
    proposal: 'Create backup directory for user uploads',
    code: `import fs from 'fs';

function createBackupDir(userId) {
  const path = \`./backups/\${userId}\`;
  if (!fs.existsSync(path)) {
    fs.mkdirSync(path, { recursive: true });
  }
  return path;
}`,
    context: 'File management system for user data'
  }
];

async function runAllTests() {
  console.log('🚀 AGENT WAR ROOM TEST SUITE\n');
  console.log('Testing multi-agent debate system with various scenarios...\n');
  console.log('═══════════════════════════════════════════════════════════\n');

  for (const scenario of scenarios) {
    console.log(`\n📋 SCENARIO: ${scenario.name}`);
    console.log('───────────────────────────────────────────────────────────');

    try {
      const result = await runWarRoom(
        scenario.proposal,
        scenario.code,
        scenario.context
      );

      console.log('\n📊 WAR ROOM REPORT:');
      console.log('═══════════════════════════════════════════════════════════');
      console.log(result.summary);
      console.log('═══════════════════════════════════════════════════════════\n');

      // Save detailed report
      if (process.env.SAVE_REPORTS === 'true') {
        const fs = await import('fs');
        const reportPath = `./war-room-report-${Date.now()}.json`;
        fs.writeFileSync(reportPath, JSON.stringify(result, null, 2));
        console.log(`📄 Detailed report saved: ${reportPath}`);
      }

    } catch (error) {
      console.error(`❌ Test failed for "${scenario.name}":`, error.message);
    }

    console.log('\n' + '='.repeat(63) + '\n');
    
    // Delay between tests to avoid rate limits
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  console.log('✅ War Room Test Suite Complete!\n');
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllTests().catch(console.error);
}

export { runAllTests };
