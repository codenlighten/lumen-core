/**
 * A testing agent that can generate unit tests, integration tests, and test data based on code analysis
 * 
 * Generated: 2026-02-06T10:00:00.000Z
 * Reasoning: This schema defines a comprehensive testing agent that can generate different types of tests with detailed configuration options.
 */
export const testingAgentSchema = {
  "type": "object",
  "properties": {
    "testType": {
      "type": "string",
      "enum": ["unit", "integration", "e2e", "performance", "security"],
      "description": "The type of test to generate"
    },
    "targetEntity": {
      "type": "string",
      "description": "The function, class, or module being tested"
    },
    "framework": {
      "type": "string",
      "enum": ["jest", "mocha", "jasmine", "vitest", "ava", "tape"],
      "description": "Testing framework to use"
    },
    "tests": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "testName": {
            "type": "string",
            "description": "Descriptive name for the test case"
          },
          "description": {
            "type": "string",
            "description": "What this test validates"
          },
          "code": {
            "type": "string",
            "description": "The generated test code"
          },
          "expectedBehavior": {
            "type": "string",
            "description": "Expected outcome of the test"
          },
          "testData": {
            "type": "object",
            "properties": {
              "input": {
                "type": "string",
                "description": "Test input data"
              },
              "expected": {
                "type": "string",
                "description": "Expected output"
              }
            },
            "required": ["input", "expected"],
            "additionalProperties": false,
            "description": "Test data for this specific test"
          }
        },
        "required": ["testName", "description", "code", "expectedBehavior", "testData"],
        "additionalProperties": false
      },
      "description": "Array of generated test cases"
    },
    "coverage": {
      "type": "object",
      "properties": {
        "targetPercentage": {
          "type": "number",
          "description": "Target code coverage percentage"
        },
        "areas": {
          "type": "array",
          "items": {
            "type": "string"
          },
          "description": "Specific code areas or branches covered"
        }
      },
      "required": ["targetPercentage", "areas"],
      "additionalProperties": false,
      "description": "Coverage information for the generated tests"
    },
    "mocks": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "target": {
            "type": "string",
            "description": "What is being mocked (function, module, etc)"
          },
          "mockImplementation": {
            "type": "string",
            "description": "The mock implementation code"
          },
          "reason": {
            "type": "string",
            "description": "Why this mock is needed"
          }
        },
        "required": ["target", "mockImplementation", "reason"],
        "additionalProperties": false
      },
      "description": "Mock objects and functions needed for testing"
    },
    "setup": {
      "type": "string",
      "description": "Setup code that runs before tests"
    },
    "teardown": {
      "type": "string",
      "description": "Cleanup code that runs after tests"
    }
  },
  "required": ["testType", "targetEntity", "framework", "tests", "coverage", "mocks", "setup", "teardown"],
  "additionalProperties": false
};
