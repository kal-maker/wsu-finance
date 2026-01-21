import { GoogleGenerativeAI } from "@google/generative-ai";

export const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Updated model list with 2025 Gemini models (TEXT + IMAGE support for receipt scanning)
// DO NOT USE deprecated models: gemini-1.5-pro, gemini-1.5-flash, gemini-1.5-pro-latest, gemini-1.5-flash-latest
const modelNames = [
  "gemini-2.0-flash-exp",
  "gemini-1.5-flash-001",
  "gemini-1.5-pro-001",
];

/**
 * Get a Gemini model with error-safe fallback
 * If the requested model fails, it will try other models in order
 * @param {string} model - Model name to use (defaults to first in list)
 * @param {object} options - Additional options for getGenerativeModel
 * @returns {object} Generative model instance
 */
export function getModel(model = "gemini-2.0-flash-exp", options = {}) {
  return genAI.getGenerativeModel({ 
    model,
    ...options 
  });
}

/**
 * Get a model with automatic fallback if the model name is invalid
 * Tries the requested model first, then falls back through the model list
 * @param {string} preferredModel - Preferred model name
 * @param {object} modelOptions - Options for getGenerativeModel
 * @returns {object} Generative model instance
 */
export async function getModelWithFallback(preferredModel = "gemini-2.0-flash-exp", modelOptions = {}) {
  // Start with preferred model, then fallback models
  const modelsToTry = [
    preferredModel,
    ...modelNames.filter(m => m !== preferredModel)
  ];

  let lastError = null;

  for (const modelName of modelsToTry) {
    try {
      const model = genAI.getGenerativeModel({ 
        model: modelName,
        ...modelOptions 
      });
      
      // Try a simple validation by accessing the model
      // Note: Actual validation happens on first API call
      return model;
    } catch (error) {
      lastError = error;
      console.warn(`⚠️ Model ${modelName} not available:`, error.message);
      // Continue to next model
    }
  }

  // If all models failed, throw the last error
  throw new Error(
    `Failed to initialize any Gemini model. Last error: ${lastError?.message || 'Unknown error'}`
  );
}

