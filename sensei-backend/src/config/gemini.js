import { GoogleGenAI } from '@google/genai';

const MODELS = {
  primary: 'gemini-2.0-flash',
  fallback: 'gemini-2.0-flash-lite',
  lastResort: 'gemini-1.5-pro'
};

let aiClient = null;

const getClient = () => {
  if (!aiClient) {
    aiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return aiClient;
};

export { getClient, MODELS };
export default getClient;
