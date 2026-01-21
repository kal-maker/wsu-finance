import OpenAI from "openai";

// Use OpenRouter for DeepSeek access (handles billing and rate limiting)
export const deepseekClient = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY || process.env.DEEPSEEK_API_KEY, // Fallback to DEEPSEEK_API_KEY if OPENROUTER_API_KEY not set
  baseURL: "https://openrouter.ai/api/v1",
});

// Available DeepSeek models through OpenRouter
const visionModels = [
  "deepseek/deepseek-chat", // Text-only via OpenRouter
  "deepseek/deepseek-reasoner", // Text-only with reasoning via OpenRouter
];

/**
 * Get a DeepSeek model for chat completions
 * @param {string} model - Model name to use (defaults to deepseek-chat)
 * @returns {object} OpenAI client (compatible with OpenAI SDK)
 */
export function getDeepSeekModel(model = "deepseek-chat") {
  return {
    client: deepseekClient,
    model: model,
  };
}

/**
 * Analyze image with DeepSeek using vision capabilities
 * Note: DeepSeek may require base64 images or image URLs
 * @param {string} imageBase64 - Base64 encoded image
 * @param {string} prompt - Text prompt for analysis
 * @param {string} mimeType - MIME type of the image
 * @param {object} options - Additional options
 * @returns {Promise<object>} Analysis result
 */
export async function analyzeImageWithDeepSeek(imageBase64, prompt, mimeType = "image/jpeg", options = {}) {
  try {
    // For DeepSeek, we use the chat completion API with vision
    // Format: data:image/jpeg;base64,{base64String}
    const imageUrl = `data:${mimeType};base64,${imageBase64}`;

    const response = await deepseekClient.chat.completions.create({
      model: "deepseek-chat", // Use DeepSeek's chat model
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: prompt,
            },
            {
              type: "image_url",
              image_url: {
                url: imageUrl,
              },
            },
          ],
        },
      ],
      temperature: options.temperature || 0.1,
      max_tokens: options.maxTokens || 1000,
      ...options,
    });

    return response.choices[0]?.message?.content || "";
  } catch (error) {
    console.error("DeepSeek API error:", error);
    throw new Error(`DeepSeek API error: ${error.message}`);
  }
}

/**
 * Simple text completion with DeepSeek
 * @param {string} prompt - Text prompt
 * @param {object} options - Additional options
 * @returns {Promise<string>} Completion text
 */
export async function completeWithDeepSeek(prompt, options = {}) {
  try {
    const response = await deepseekClient.chat.completions.create({
      model: "deepseek/deepseek-chat", // Use OpenRouter model path
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: options.temperature || 0.7,
      max_tokens: options.maxTokens || 1000,
      ...options,
    });

    return response.choices[0]?.message?.content || "";
  } catch (error) {
    console.error("DeepSeek API error:", error);
    throw new Error(`DeepSeek API error: ${error.message}`);
  }
}

