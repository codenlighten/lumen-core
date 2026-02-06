/**
 * A project scaffolder agent that can initialize new projects with templates, dependencies, configuration files, and directory structures
 * 
 * Fixed: 2026-02-06 - Made compatible with OpenAI strict mode
 * Uses arrays instead of dynamic objects with additionalProperties
 */
export const projectScaffolderAgentSchema = {
  "type": "object",
  "properties": {
    "projectName": {
      "type": "string",
      "description": "The name of the project to be initialized"
    },
    "template": {
      "type": "string",
      "description": "The template to use for project scaffolding (e.g., 'react', 'express', 'next-js')"
    },
    "dependencies": {
      "type": "array",
      "items": {
        "type": "string"
      },
      "description": "List of npm dependencies to install"
    },
    "configFiles": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "filename": {
            "type": "string",
            "description": "Name of the configuration file (e.g., '.eslintrc.json')"
          },
          "content": {
            "type": "string",
            "description": "Content of the configuration file"
          }
        },
        "required": ["filename", "content"],
        "additionalProperties": false
      },
      "description": "Configuration files to create with their contents"
    },
    "directories": {
      "type": "array",
      "items": {
        "type": "string"
      },
      "description": "List of directories to create (e.g., 'src', 'tests', 'lib')"
    },
    "files": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "path": {
            "type": "string",
            "description": "File path relative to project root (e.g., 'src/index.js')"
          },
          "content": {
            "type": "string",
            "description": "Initial content of the file"
          }
        },
        "required": ["path", "content"],
        "additionalProperties": false
      },
      "description": "Initial files to create with their content"
    },
    "setupCommands": {
      "type": "array",
      "items": {
        "type": "string"
      },
      "description": "Terminal commands to run after scaffolding (e.g., 'npm install')"
    }
  },
  "required": [
    "projectName",
    "template",
    "dependencies",
    "configFiles",
    "directories",
    "files",
    "setupCommands"
  ],
  "additionalProperties": false
};
