# 🌟 Superlumen - Advanced Agentic AI System

An autonomous AI system with rolling memory management, dynamic schema routing, and safe terminal execution capabilities.

## Overview

Superlumen implements an elegant "Memory Method" that maintains context through a 21-interaction rolling window combined with 3-level rolling summaries. This prevents context window bloat while ensuring the AI never loses track of long-term project goals.

### Key Features

- **🧠 Rolling Memory Management**: 21-interaction window + 3 automatic summaries
- **🎯 Dynamic Schema Routing**: 6 specialized agents for different task types
- **🔒 Safe Terminal Execution**: Command validation, approval gates, audit logging
- **🔄 Self-Correcting Loops**: Agents learn from command outputs and adjust
- **📊 Structured Outputs**: All responses follow strict JSON schemas
- **🔗 Multi-Step Workflows**: Automatic task chaining with continuity flags

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Lumen Core                             │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Memory    │  │    Schema    │  │   Terminal   │      │
│  │   Manager   │→ │    Router    │→ │   Executor   │      │
│  └─────────────┘  └──────────────┘  └──────────────┘      │
│         ↓                ↓                   ↓              │
│  ┌─────────────────────────────────────────────────┐       │
│  │          Specialized Agent Schemas              │       │
│  │  • Base Agent (conversation/code/terminal)      │       │
│  │  • Project Scaffolder (initialization)          │       │
│  │  • File Operation (CRUD with safety)            │       │
│  │  • Code Analyzer (quality & bugs)               │       │
│  │  • Testing Agent (test generation)              │       │
│  │  • Doc Generator (documentation)                │       │
│  │  • Summarizer (memory compression)              │       │
│  └─────────────────────────────────────────────────┘       │
└─────────────────────────────────────────────────────────────┘
```

## Installation

```bash
# Clone the repository
git clone <your-repo>
cd superlumen

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env and add your OPENAI_API_KEY
```

### Environment Variables

Create a `.env` file:

```env
OPENAI_API_KEY=your_api_key_here
OPENAI_DEFAULT_MODEL=gpt-4o-mini
OPENAI_DEFAULT_TEMPERATURE=0.7
```

## Usage

### Interactive Mode

Run the main Lumen Core system:

```bash
node lumen-core.js
```

This starts an interactive session where you can:
- Ask questions and get conversational responses
- Request code generation
- Execute terminal commands (with approval gates)
- Initialize projects
- Analyze code quality
- Generate tests and documentation

**Commands:**
- `exit` - Quit the system
- `status` - Show memory status

### Programmatic Usage

```javascript
import { MemoryManager } from './lib/MemoryManager.js';
import { schemaRouter } from './lib/schemaRouter.js';
import { executeAgentCommand } from './lib/terminalExecutor.js';

// Initialize memory
const memory = new MemoryManager();

// Add interaction
await memory.addInteraction('user', 'Create a new React project');

// Route to appropriate agent
const response = await schemaRouter('Create a new React project', memory);

// Handle response based on type
if (response.choice === 'terminalCommand') {
  const result = await executeAgentCommand(response);
  console.log(result);
}
```

## Specialized Agents

### 1. Base Agent (Universal)
Handles general conversation, code generation, and terminal commands.

**Capabilities:**
- Conversational responses with follow-up questions
- Code generation in any language
- Terminal command generation with reasoning
- Missing context detection

### 2. Project Scaffolder
Initializes new projects with complete structure.

**Use Cases:**
- "Initialize a new Express.js project"
- "Create a React app with TypeScript"
- "Set up a Node.js microservice"

### 3. File Operation Agent
Safe file CRUD operations.

**Features:**
- Safety checks (existence, permissions)
- Rollback capabilities
- Audit trail

**Use Cases:**
- "Create a new config file"
- "Update the package.json"
- "Delete temporary files"

### 4. Code Analyzer Agent
Reviews code quality and detects issues.

**Outputs:**
- Quality score (0-100)
- Potential bugs
- Improvement suggestions
- Refactoring recommendations

**Use Cases:**
- "Analyze this function for bugs"
- "Review the code quality"
- "Suggest improvements"

### 5. Testing Agent
Generates comprehensive tests.

**Supports:**
- Jest, Mocha, Jasmine, Vitest, AVA, Tape
- Unit tests
- Integration tests
- Test data generation
- Mock creation

**Use Cases:**
- "Generate tests for my calculator function"
- "Create integration tests for the API"

### 6. Documentation Generator
Creates comprehensive documentation.

**Generates:**
- Function/class documentation
- Parameter descriptions
- Return value documentation
- Usage examples
- Exception documentation

**Use Cases:**
- "Document this class"
- "Generate API documentation"

## Memory Method

The Memory Manager implements a sophisticated context management system:

### Rolling Window (21 interactions)
```
Recent detailed history
┌──┬──┬──┬──┬──┬──┬──┬──┬──┬──┐
│21│20│19│18│17│16│..│ 3│ 2│ 1│
└──┴──┴──┴──┴──┴──┴──┴──┴──┴──┘
```

### Rolling Summaries (3 chunks)
```
Compressed historical context
┌──────────┬──────────┬──────────┐
│Summary 3 │Summary 2 │Summary 1 │
│(newest)  │(middle)  │(oldest)  │
└──────────┴──────────┴──────────┘
```

When the 22nd interaction is added:
1. The current window is summarized
2. The summary is added to the summary stack
3. The oldest interaction is removed
4. Only the 3 most recent summaries are kept

This ensures:
- ✅ Constant memory usage
- ✅ Fast query performance
- ✅ Long-term goal retention
- ✅ No context window bloat

## Testing

Run all tests:

```bash
# Test individual components
node test-baseagent.js
node test-new-schemas.js
node test-terminal-executor.js
node test-lumen-core.js

# Integration demo
node demo-integration.js
```

## Project Structure

```
superlumen/
├── lib/
│   ├── openaiWrapper.js       # OpenAI API integration
│   ├── terminalExecutor.js    # Safe command execution
│   ├── auditLogger.js         # Command audit logging
│   ├── MemoryManager.js       # Rolling memory system
│   └── schemaRouter.js        # Dynamic agent selection
├── schemas/
│   ├── baseAgent.js           # Universal agent schema
│   ├── projectScaffolderAgent.js
│   ├── fileOperationAgent.js
│   ├── codeAnalyzerAgent.js
│   ├── testingAgent.js
│   ├── docGeneratorAgent.js
│   ├── summarizeAgent.js
│   └── schemaGenerator.js
├── lumen-core.js              # Main orchestration loop
├── test-*.js                  # Test files
├── package.json
├── STATUS.md                  # Development status
└── README.md                  # This file
```

## Safety Features

### Terminal Command Safety
- **Dangerous Pattern Detection**: Blocks commands like `rm -rf /`, fork bombs, etc.
- **Approval Gates**: Requires manual confirmation for destructive operations
- **Dry Run Mode**: Test commands without execution
- **Timeout Protection**: Commands timeout after 30s by default
- **Audit Logging**: All executions are logged with timestamps

### Command Approval
Commands requiring approval:
- File deletions
- System modifications
- Network operations
- Any command flagged by the AI as `requiresApproval: true`

## Advanced Features

### Continuity Chaining
Agents can set `continue: true` to automatically trigger the next step:

```javascript
{
  choice: "terminalCommand",
  terminalCommand: "npm init -y",
  continue: true  // Will automatically proceed after execution
}
```

### Context Hydration
Every AI query automatically includes:
- Last 21 interactions (detailed)
- 3 rolling summaries (compressed history)
- System instructions and constraints

### Self-Correction
When a command fails, the output is fed back into memory, allowing the agent to:
1. Understand what went wrong
2. Adjust its approach
3. Try alternative solutions

## Development

### Adding New Schemas

1. Create schema file in `schemas/`:
```javascript
export const myNewAgentSchema = {
  type: "object",
  properties: {
    // Your properties
  },
  required: [...],
  additionalProperties: false
};
```

2. Register in `schemaRouter.js`:
```javascript
const SCHEMA_REGISTRY = {
  myAgent: myNewAgentSchema,
  // ...
};
```

3. Add keywords for quick routing (optional):
```javascript
const keywords = {
  myAgent: ['keyword1', 'keyword2'],
  // ...
};
```

### Extending Memory Manager

The MemoryManager supports export/import for persistence:

```javascript
// Export state
const state = memory.export();
fs.writeFileSync('memory-state.json', JSON.stringify(state));

// Import state
const state = JSON.parse(fs.readFileSync('memory-state.json'));
memory.import(state);
```

## Performance

- **Memory Usage**: Constant (~21 interactions + 3 summaries)
- **Query Speed**: Fast (no context window bloat)
- **Token Efficiency**: Optimal (automatic compression)
- **Latency**: Low (predictable prompt sizes)

## Roadmap

- [ ] Docker sandbox for isolated execution
- [ ] Web interface / API endpoint
- [ ] Multi-user session management
- [ ] Long-term persistence (database)
- [ ] Streaming responses
- [ ] Plugin system
- [ ] Metrics dashboard

## Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

[Your License Here]

## Credits

Built by Gregory Ward with Lumen (AI Assistant)

---

**Note**: This system requires an OpenAI API key with access to structured output features (GPT-4o or gpt-4o-mini recommended).
