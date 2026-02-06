/**
 * A file operation agent that can create, read, update, delete files with safety checks and rollback capabilities
 * 
 * Generated: 2026-02-06T09:58:25.155Z
 * Reasoning: The schema includes properties that define the core functionality of a file operation agent. Each property has been given a strict type according to the OpenAI structured output format requirements. The 'operation' property restricts operations to valid types (create, read, update, delete), ensuring the agent only performs defined actions. The 'safetyChecks' object is nested to encapsulate related checks, with required checks specified. The 'rollback' property allows for indicating if rollback capabilities are enabled, which is crucial for maintaining data integrity. The schema adheres to strict types and includes descriptions for clarity.
 */
export const fileOperationAgentSchema = {
  "type": "object",
  "properties": {
    "operation": {
      "type": "string",
      "enum": [
        "create",
        "read",
        "update",
        "delete"
      ],
      "description": "The file operation to be performed"
    },
    "filePath": {
      "type": "string",
      "description": "The path to the file on which the operation will be performed"
    },
    "data": {
      "type": "string",
      "description": "The content to write to the file, required for create and update operations"
    },
    "safetyChecks": {
      "type": "object",
      "properties": {
        "checkExistence": {
          "type": "boolean",
          "description": "Check if the file exists before performing the operation"
        },
        "checkPermissions": {
          "type": "boolean",
          "description": "Check if the user has the necessary permissions for the operation"
        }
      },
      "required": [
        "checkExistence",
        "checkPermissions"
      ],
      "additionalProperties": false,
      "description": "Safety checks to perform before executing the operation"
    },
    "rollback": {
      "type": "boolean",
      "description": "Indicates if rollback capabilities are enabled for the operation"
    }
  },
  "required": [
    "operation",
    "filePath",
    "data",
    "safetyChecks",
    "rollback"
  ],
  "additionalProperties": false
};
