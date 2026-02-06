/**
 * A documentation generator agent that creates comprehensive documentation from code comments, function signatures, and usage examples
 * 
 * Generated: 2026-02-06T10:00:00.000Z
 * Reasoning: This schema captures the essential components of generated documentation including function/class metadata, parameters, return types, and usage examples.
 */
export const docGeneratorAgentSchema = {
  "type": "object",
  "properties": {
    "entityName": {
      "type": "string",
      "description": "The name of the function, class, or method being documented"
    },
    "entityType": {
      "type": "string",
      "enum": ["function", "class", "method", "module", "interface"],
      "description": "The type of code entity being documented"
    },
    "summary": {
      "type": "string",
      "description": "A brief summary of what the entity does"
    },
    "description": {
      "type": "string",
      "description": "Detailed description of the entity's purpose and behavior"
    },
    "parameters": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "name": {
            "type": "string",
            "description": "Parameter name"
          },
          "type": {
            "type": "string",
            "description": "Parameter type"
          },
          "description": {
            "type": "string",
            "description": "Parameter description"
          },
          "required": {
            "type": "boolean",
            "description": "Whether the parameter is required"
          },
          "defaultValue": {
            "type": "string",
            "description": "Default value if applicable"
          }
        },
        "required": ["name", "type", "description", "required", "defaultValue"],
        "additionalProperties": false
      },
      "description": "List of parameters for the entity"
    },
    "returnValue": {
      "type": "object",
      "properties": {
        "type": {
          "type": "string",
          "description": "Return type"
        },
        "description": {
          "type": "string",
          "description": "Description of what is returned"
        }
      },
      "required": ["type", "description"],
      "additionalProperties": false,
      "description": "Information about the return value"
    },
    "examples": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "title": {
            "type": "string",
            "description": "Title of the example"
          },
          "code": {
            "type": "string",
            "description": "Example code snippet"
          },
          "description": {
            "type": "string",
            "description": "Explanation of the example"
          }
        },
        "required": ["title", "code", "description"],
        "additionalProperties": false
      },
      "description": "Usage examples demonstrating the entity"
    },
    "throws": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "type": {
            "type": "string",
            "description": "Exception/error type"
          },
          "description": {
            "type": "string",
            "description": "When this error is thrown"
          }
        },
        "required": ["type", "description"],
        "additionalProperties": false
      },
      "description": "List of exceptions that can be thrown"
    },
    "seeAlso": {
      "type": "array",
      "items": {
        "type": "string"
      },
      "description": "References to related entities or documentation"
    }
  },
  "required": ["entityName", "entityType", "summary", "description", "parameters", "returnValue", "examples", "throws", "seeAlso"],
  "additionalProperties": false
};
