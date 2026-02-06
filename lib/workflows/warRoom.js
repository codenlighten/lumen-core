import { queryOpenAI } from '../openaiWrapper.js';
import { codeAnalyzerAgentSchema } from '../../schemas/codeAnalyzerAgent.js';
import { testingAgentSchema } from '../../schemas/testingAgent.js';

/**
 * Agent War Room - Multi-Agent Debate System
 * 
 * This workflow orchestrates a debate between specialized agents to
 * validate complex code changes before execution.
 * 
 * @param {string} proposal - The proposed change or feature
 * @param {string} code - The code to be analyzed
 * @param {string} context - Additional context about the system
 * @returns {Object} War room verdict with analysis and recommendations
 */
export async function runWarRoom(proposal, code, context = '') {
  console.log('\n⚔️ ENTERING AGENT WAR ROOM ⚔️');
  console.log('Proposal:', proposal);
  console.log('═══════════════════════════════════════\n');

  // War Room thresholds
  const qualityThreshold = 75;  // Minimum quality score required
  const minTestCases = 2;        // Minimum number of test cases required

  const debateLog = [];

  try {
    // ROUND 1: Code Analyzer (The Challenger)
    console.log('🔍 CHALLENGER: Code Analyzer reviewing proposal...');
    const analysisPrompt = `
You are a critical code reviewer. Analyze this proposal and code for potential issues:

**Proposal:** ${proposal}

**Code:**
\`\`\`
${code}
\`\`\`

**System Context:** ${context}

Find bugs, security issues, performance problems, and suggest improvements.
`;

    const analysis = await queryOpenAI(analysisPrompt, {
      schema: codeAnalyzerAgentSchema
    });

    const issues = analysis.codeQuality?.issues || [];
    const recommendations = analysis.refactoringRecommendations || [];
    const score = analysis.codeQuality?.score || 50;

    debateLog.push({
      agent: 'Code Analyzer',
      score: score,
      findings: issues,
      recommendations: recommendations
    });

    console.log(`   Score: ${score}/100`);
    console.log(`   Issues Found: ${issues.length}`);

    // ROUND 2: Testing Agent (The Validator)
    console.log('\n🧪 VALIDATOR: Testing Agent creating test plan...');
    const testPrompt = `
You are a test engineer. Create a comprehensive test plan for this proposal:

**Proposal:** ${proposal}

**Code:**
\`\`\`
${code}
\`\`\`

**Known Issues:** ${issues.map(i => i.description).join(', ')}

Generate test cases that would catch potential bugs and verify correct behavior.
`;

    const testPlan = await queryOpenAI(testPrompt, {
      schema: testingAgentSchema
    });

    const tests = testPlan.tests || [];
    const coverage = testPlan.coverageTarget || 80;

    debateLog.push({
      agent: 'Testing Agent',
      testCount: tests.length,
      coverage: coverage,
      tests: tests
    });

    console.log(`   Tests Generated: ${tests.length}`);
    console.log(`   Coverage Target: ${coverage}%`);

    // CONSENSUS EVALUATION
    console.log('\n⚖️ EVALUATING CONSENSUS...');
    const criticalIssues = issues.filter(issue => 
      issue.severity === 'critical' || issue.severity === 'high'
    );

    const isSafe = (
      score >= qualityThreshold &&
      tests.length >= minTestCases &&
      criticalIssues.length === 0
    );

    console.log(`   Quality Score: ${score}/${qualityThreshold} ${score >= qualityThreshold ? '✓' : '✗'}`);
    console.log(`   Test Cases: ${tests.length}/${minTestCases} ${tests.length >= minTestCases ? '✓' : '✗'}`);
    console.log(`   Critical Issues: ${criticalIssues.length} ${criticalIssues.length === 0 ? '✓' : '✗'}`);
    console.log(`\n   VERDICT: ${isSafe ? '✅ APPROVED' : '❌ REJECTED'}`);

    // Build comprehensive report
    return {
      verdict: isSafe ? 'APPROVED' : 'REJECTED',
      isSafe,
      qualityScore: score,
      analysis: {
        issues: issues,
        recommendations: recommendations,
        reasoning: analysis.reasoning || 'No reasoning provided'
      },
      testing: {
        testCount: tests.length,
        coverage: coverage,
        testCases: tests.map(t => ({
          name: t.testName,
          description: t.testDescription,
          type: t.testType
        }))
      },
      criticalIssues,
      debateLog,
      summary: generateSummary(isSafe, analysis, testPlan, criticalIssues)
    };

  } catch (error) {
    console.error('❌ War Room Error:', error.message);
    throw new Error(`War Room failed: ${error.message}`);
  }
}

/**
 * Generate human-readable summary of the war room debate
 */
function generateSummary(isSafe, analysis, testPlan, criticalIssues) {
  const score = analysis.codeQuality?.score || 0;
  const issues = analysis.codeQuality?.issues || [];
  const recommendations = analysis.refactoringRecommendations || [];
  const tests = testPlan.tests || [];
  const coverage = testPlan.coverageTarget || 0;

  const lines = [];
  
  lines.push(`**Quality Assessment:** ${score}/100`);
  lines.push(`**Test Coverage:** ${coverage}%`);
  lines.push(`**Test Cases:** ${tests.length} generated`);
  
  if (criticalIssues.length > 0) {
    lines.push(`\n**⚠️ Critical Issues:**`);
    criticalIssues.forEach(issue => {
      lines.push(`- ${issue.description} (${issue.severity})`);
    });
  }
  
  if (recommendations.length > 0) {
    lines.push(`\n**💡 Recommendations:**`);
    recommendations.slice(0, 3).forEach(rec => {
      lines.push(`- ${rec}`);
    });
  }
  
  lines.push(`\n**Final Verdict:** ${isSafe ? '✅ Safe to proceed' : '❌ Requires revision'}`);
  
  return lines.join('\n');
}

/**
 * Quick safety check for simple operations
 * Bypasses full war room for low-risk commands
 */
export function requiresWarRoom(command) {
  const highRiskPatterns = [
    /rm\s+-rf/,
    /sudo/,
    /chmod\s+777/,
    />.+\.js$/,  // Overwriting JS files
    /npm\s+install.*-g/,  // Global installations
    /git\s+push.*--force/
  ];
  
  return highRiskPatterns.some(pattern => pattern.test(command));
}
