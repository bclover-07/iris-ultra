import { GoogleGenerativeAI } from '@google/generative-ai';
import PQueue from 'p-queue';
import { callHuggingFace, callHuggingFaceJSON } from './huggingface.service.js';

const MODELS = ['gemini-2.0-flash', 'gemini-1.5-flash'];
const RETRY_DELAYS = [500, 1500, 3000];

const getKeys = () => process.env.GEMINI_API_KEY?.split(',').map(k => k.trim()).filter(Boolean) || [];

let currentKeyIndex = 0;
let genAI = null;

const getGenAI = () => {
  const keys = getKeys();
  if (keys.length === 0) throw new Error('No Gemini API keys configured');
  
  if (!genAI || genAI._currentKey !== keys[currentKeyIndex]) {
    genAI = new GoogleGenerativeAI(keys[currentKeyIndex]);
    genAI._currentKey = keys[currentKeyIndex];
  }
  return genAI;
};

const rotateKey = () => {
  const keys = getKeys();
  if (keys.length > 1) {
    currentKeyIndex = (currentKeyIndex + 1) % keys.length;
    console.warn(`[Gemini] Rotating API key to index ${currentKeyIndex}`);
    genAI = null; // force recreation on next getGenAI()
    return true;
  }
  return false;
};

const queue = new PQueue({
  concurrency: 2,
  interval: 60000,
  intervalCap: 14
});

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const callGemini = async (prompt, options = {}) => {
  const { systemPrompt, jsonMode = false, maxAttempts = 4 } = options;

  const fullPrompt = jsonMode
    ? `${prompt}\n\nRespond ONLY with valid JSON. No markdown, no backticks, no explanation.`
    : prompt;

  try {
    return await queue.add(async () => {
      let lastError = null;

      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        let modelIndex = attempt % MODELS.length;
        const modelName = MODELS[modelIndex];

        try {
          const client = getGenAI();
          const model = client.getGenerativeModel({ 
            model: modelName,
            systemInstruction: systemPrompt 
          });

          const result = await model.generateContent(fullPrompt);
          const response = await result.response;
          const text = response.text();
          
          if (!text) throw new Error('Empty response from Gemini');
          return text;
        } catch (error) {
          lastError = error;
          const isQuotaError = error.message?.includes('429') || error.message?.toLowerCase().includes('quota');
          
          console.error(`[Gemini Attempt ${attempt + 1}] failed with ${isQuotaError ? 'QUOTA LIMIT' : error.message}`);
          
          if (isQuotaError) {
            if (rotateKey()) {
              console.log('[Gemini] Retrying immediately with new key...');
              continue;
            } else {
              console.warn('[Gemini] Quota limit reached and no other keys available. Falling back immediately...');
              break;
            }
          }

          if (attempt < maxAttempts - 1) {
            await sleep(RETRY_DELAYS[attempt] || 1500);
          }
        }
      }

      throw lastError;
    });
  } catch (geminiError) {
    if (process.env.HF_TOKEN && process.env.HF_TOKEN !== 'hf_placeholder_token') {
      console.log('[AI Fallback] Gemini failed, trying HuggingFace...');
      try {
        const hfResult = await callHuggingFace(fullPrompt, { systemPrompt });
        if (hfResult && hfResult.trim()) return hfResult;
      } catch (hfError) {
        console.warn('[AI Fallback] Both Gemini and HuggingFace failed:', hfError.message);
      }
    }
    throw new Error(`AI service temporarily unavailable: ${geminiError.message}`);
  }
};

export const callGeminiJSON = async (prompt, options = {}) => {
  let text;
  try {
    text = await callGemini(prompt, { ...options, jsonMode: true });
  } catch (geminiError) {
    if (process.env.HF_TOKEN && process.env.HF_TOKEN !== 'hf_placeholder_token') {
      console.log('[AI Fallback] Gemini JSON failed, trying HuggingFace JSON...');
      try {
        const hfResult = await callHuggingFaceJSON(prompt, options);
        if (hfResult && typeof hfResult === 'object') {
          return hfResult;
        }
      } catch (hfError) {
        console.error('[AI Fallback] HuggingFace JSON also failed:', hfError.message);
      }
    }
    throw new Error(`AI JSON service temporarily unavailable: ${geminiError.message}`);
  }

  let cleaned = text.trim();
  cleaned = cleaned.replace(/^\uFEFF/, '');
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.slice(7);
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.slice(3);
  }
  if (cleaned.endsWith('```')) {
    cleaned = cleaned.slice(0, -3);
  }
  cleaned = cleaned.trim();

  try {
    return JSON.parse(cleaned);
  } catch (parseError) {
    const jsonMatch = cleaned.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
    if (jsonMatch) {
      const rawJson = jsonMatch[0];
      try {
        return JSON.parse(rawJson);
      } catch (e) {
        try {
          // Quote unquoted keys
          let fixedJson = rawJson.replace(/([{,]\s*)([a-zA-Z0-9_-]+)\s*:/g, '$1"$2":');
          // Replace single quotes with double quotes
          fixedJson = fixedJson.replace(/'/g, '"');
          // Remove trailing commas
          fixedJson = fixedJson.replace(/,\s*}/g, '}').replace(/,\s*]/g, ']');
          return JSON.parse(fixedJson);
        } catch (e2) {}
      }
    }
    throw new Error(`Failed to parse AI JSON response: ${parseError.message}`);
  }
};

export default { callGemini, callGeminiJSON };
