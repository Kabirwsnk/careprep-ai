/**
 * OpenRouter Client for CarePrep AI Backend
 * Provides chat and summarization capabilities using free OpenRouter models
 */

import axios from 'axios';

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const DEFAULT_MODEL = 'mistralai/mistral-7b-instruct';

/**
 * Make a request to OpenRouter API
 * @param {Array} messages - Array of message objects with role and content
 * @param {Object} options - Optional parameters
 * @returns {Promise<string>} - The AI response content
 */
async function makeRequest(messages, options = {}) {
    const apiKey = process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
        throw new Error('OPENROUTER_API_KEY environment variable not set');
    }

    const {
        model = process.env.OPENROUTER_MODEL || DEFAULT_MODEL,
        temperature = 0.7,
        maxTokens = 1500,
        maxRetries = 3
    } = options;

    const headers = {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://careprep-ai.local',
        'X-Title': 'CarePrep AI'
    };

    const payload = {
        model,
        messages,
        temperature,
        max_tokens: maxTokens
    };

    let lastError;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            const response = await axios.post(OPENROUTER_API_URL, payload, {
                headers,
                timeout: 60000
            });

            if (response.data?.choices?.[0]?.message?.content) {
                return response.data.choices[0].message.content;
            } else {
                throw new Error('Unexpected response format from OpenRouter');
            }
        } catch (error) {
            lastError = error;

            // Handle rate limiting
            if (error.response?.status === 429) {
                const waitTime = Math.pow(2, attempt) * 1000;
                console.log(`Rate limited, waiting ${waitTime}ms before retry...`);
                await new Promise(resolve => setTimeout(resolve, waitTime));
                continue;
            }

            // Handle other retryable errors
            if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT') {
                const waitTime = 1000 * (attempt + 1);
                await new Promise(resolve => setTimeout(resolve, waitTime));
                continue;
            }

            // Non-retryable error
            break;
        }
    }

    throw lastError;
}

/**
 * Send a chat message and get AI response
 * @param {Array} messages - Array of message objects with role and content
 * @param {Object} options - Optional parameters (temperature, maxTokens)
 * @returns {Promise<string>} - The AI response
 */
export async function chat(messages, options = {}) {
    return makeRequest(messages, {
        temperature: options.temperature || 0.7,
        maxTokens: options.maxTokens || 800,
        ...options
    });
}

/**
 * Summarize text using AI
 * @param {string} text - Text to summarize
 * @param {Object} options - Optional parameters
 * @returns {Promise<string>} - The summary
 */
export async function summarize(text, options = {}) {
    const messages = [
        {
            role: 'user',
            content: `Please provide a clear, concise summary of the following text:\n\n${text}`
        }
    ];

    return makeRequest(messages, {
        temperature: options.temperature || 0.5,
        maxTokens: options.maxTokens || 1500,
        ...options
    });
}

/**
 * Check if OpenRouter is configured and available
 * @returns {boolean} - True if API key is configured
 */
export function isAvailable() {
    return !!process.env.OPENROUTER_API_KEY;
}

export default {
    chat,
    summarize,
    isAvailable
};
