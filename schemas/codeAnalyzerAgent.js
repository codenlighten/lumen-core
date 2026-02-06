/**
 * A code analyzer agent that reviews code quality, suggests improvements, detects potential bugs, and provides refactoring recommendations
 * 
 * Generated: 2026-02-06T09:58:34.597Z
 * Reasoning: The schema was designed to capture all essential aspects of a code analyzer agent, including its name, version, and detailed outputs about code quality, suggested improvements, potential bugs, and refactoring recommendations. Each property is clearly defined with appropriate types and descriptions, ensuring that it meets the strict requirements outlined. The use of arrays for lists of issues and recommendations allows for flexibility in the output, accommodating varying amounts of data.
 */
export const codeAnalyzerAgentSchema = {
  "type": "object",
  "properties": {
    "agentName": {
      "type": "string",
      "description": "The name of the code analyzer agent."
    },
    "version": {
      "type": "string",
      "description": "The version of the code analyzer agent software."
    },
    "codeQuality": {
      "type": "object",
      "properties": {
        "score": {
          "type": "number",
          "description": "A numeric score indicating the overall quality of the code, on a scale from 0 to 100."
        },
        "issuesFound": {
          "type": "array",
          "items": {
            "type": "string"
          },
          "description": "An array of identified issues related to code quality."
        }
      },
      "required": [
        "score",
        "issuesFound"
      ],
      "additionalProperties": false,
      "description": "An object representing the quality assessment of the provided code."
    },
    "improvements": {
      "type": "array",
      "items": {
        "type": "string"
      },
      "description": "A list of suggested improvements for enhancing the code quality."
    },
    "potentialBugs": {
      "type": "array",
      "items": {
        "type": "string"
      },
      "description": "A list of detected potential bugs in the code."
    },
    "refactoringRecommendations": {
      "type": "array",
      "items": {
        "type": "string"
      },
      "description": "A list of recommendations for refactoring the code to improve readability and maintainability."
    }
  },
  "required": [
    "agentName",
    "version",
    "codeQuality",
    "improvements",
    "potentialBugs",
    "refactoringRecommendations"
  ],
  "additionalProperties": false
};
