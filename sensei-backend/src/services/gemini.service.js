import axios from 'axios';
import { callLocalGemma, callLocalGemmaJSON } from './localModel.service.js';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
const GEMINI_BASE_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}`;

export const callGemini = async (prompt, options = {}) => {
  const { systemPrompt, temperature = 0.7, maxTokens = 1024 } = options;

  if (!GEMINI_API_KEY) {
    console.warn('[GeminiProxy] No API key — falling back to local rule engine');
    return callLocalGemma(prompt, { systemPrompt });
  }

  try {
    const contents = [];

    if (systemPrompt) {
      contents.push({
        role: 'user',
        parts: [{ text: `System: ${systemPrompt}` }]
      });
      contents.push({
        role: 'model',
        parts: [{ text: 'Understood. I will follow these instructions.' }]
      });
    }

    contents.push({
      role: 'user',
      parts: [{ text: prompt }]
    });

    const response = await axios.post(
      `${GEMINI_BASE_URL}:generateContent?key=${GEMINI_API_KEY}`,
      {
        contents,
        generationConfig: {
          temperature,
          maxOutputTokens: maxTokens,
          topP: 0.95,
          topK: 40
        }
      },
      { timeout: 30000 }
    );

    const candidates = response.data?.candidates;
    if (candidates?.[0]?.content?.parts?.[0]?.text) {
      return candidates[0].content.parts[0].text;
    }

    console.warn('[GeminiProxy] Empty response — falling back to local');
    return callLocalGemma(prompt, { systemPrompt });
  } catch (err) {
    console.error('[GeminiProxy] API error:', err.response?.data?.error?.message || err.message);
    return callLocalGemma(prompt, { systemPrompt });
  }
};

export const callGeminiJSON = async (prompt, options = {}) => {
  const jsonPrompt = `${prompt}\n\nIMPORTANT: Respond with ONLY valid JSON, no markdown, no code fences.`;

  if (!GEMINI_API_KEY) {
    return callLocalGemmaJSON(prompt, options);
  }

  try {
    const text = await callGemini(jsonPrompt, { ...options, temperature: 0.2 });

    let cleaned = text.trim();
    if (cleaned.startsWith('```json')) cleaned = cleaned.slice(7);
    else if (cleaned.startsWith('```')) cleaned = cleaned.slice(3);
    if (cleaned.endsWith('```')) cleaned = cleaned.slice(0, -3);
    cleaned = cleaned.trim();

    try {
      return JSON.parse(cleaned);
    } catch (e) {
      const match = cleaned.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
      if (match) {
        try {
          return JSON.parse(match[0]);
        } catch (e2) {}
      }
      console.warn('[GeminiProxy] JSON parse failed — falling back to local');
      return callLocalGemmaJSON(prompt, options);
    }
  } catch (err) {
    return callLocalGemmaJSON(prompt, options);
  }
};

export default { callGemini, callGeminiJSON };
