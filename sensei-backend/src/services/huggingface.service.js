import { HfInference } from '@huggingface/inference';

let hf = null;
const getHF = () => {
  if (!hf) {
    hf = new HfInference(process.env.HF_TOKEN);
  }
  return hf;
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const withRetry = async (fn, retries = 1, baseDelay = 2000) => {
  let lastError;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt < retries) {
        const delay = baseDelay * Math.pow(2, attempt);
        console.warn(`[HF Retry] Attempt ${attempt + 1} failed: ${error.message}. Retrying in ${delay}ms...`);
        await sleep(delay);
      }
    }
  }
  throw lastError;
};

export const callHuggingFace = async (prompt, options = {}) => {
  if (!process.env.HF_TOKEN || process.env.HF_TOKEN === 'hf_placeholder_token') {
    throw new Error('HuggingFace token not configured');
  }
  const { systemPrompt = '', maxTokens = 2048 } = options;
  const client = getHF();

  const fullMessages = [];
  if (systemPrompt) {
    fullMessages.push({ role: 'system', content: systemPrompt });
  }
  fullMessages.push({ role: 'user', content: prompt });

  return await withRetry(async () => {
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('HuggingFace timeout after 30s')), 30000)
    );
    const response = await Promise.race([
      client.chatCompletion({
        model: 'meta-llama/Meta-Llama-3-8B-Instruct',
        messages: fullMessages,
        max_tokens: maxTokens,
        temperature: 0.7,
      }),
      timeoutPromise
    ]);

    const text = response.choices?.[0]?.message?.content || '';
    if (!text) throw new Error('Empty response from HuggingFace');
    return text;
  }, 1, 3000);
};

export const callHuggingFaceJSON = async (prompt, options = {}) => {
  const text = await callHuggingFace(
    `${prompt}\n\nRespond ONLY with valid JSON. No markdown, no backticks, no explanation.`,
    options
  );

  let cleaned = text.trim();
  cleaned = cleaned.replace(/^\uFEFF/, '');
  if (cleaned.startsWith('```json')) cleaned = cleaned.slice(7);
  else if (cleaned.startsWith('```')) cleaned = cleaned.slice(3);
  if (cleaned.endsWith('```')) cleaned = cleaned.slice(0, -3);
  cleaned = cleaned.trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    const jsonMatch = cleaned.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
    if (jsonMatch) {
      const rawJson = jsonMatch[0];
      try {
        return JSON.parse(rawJson);
      } catch {
        try {
          // Quote unquoted keys
          let fixedJson = rawJson.replace(/([{,]\s*)([a-zA-Z0-9_-]+)\s*:/g, '$1"$2":');
          // Replace single quotes with double quotes
          fixedJson = fixedJson.replace(/'/g, '"');
          // Remove trailing commas
          fixedJson = fixedJson.replace(/,\s*}/g, '}').replace(/,\s*]/g, ']');
          return JSON.parse(fixedJson);
        } catch (e) {}
      }
    }
    throw new Error('Failed to parse HuggingFace JSON response');
  }
};

export const summarizeWithHF = async (text, maxLength = 500) => {
  try {
    const client = getHF();
    return await withRetry(async () => {
      const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('HF timeout')), 20000));
      const result = await Promise.race([
        client.summarization({
          model: 'facebook/bart-large-cnn',
          inputs: text.slice(0, 4000),
          parameters: { max_length: maxLength, min_length: 50 },
        }),
        timeoutPromise
      ]);
      return result.summary_text;
    }, 1, 2000);
  } catch (error) {
    console.warn(`HF Summarization failed: ${error.message}. Returning truncated text.`);
    return text.slice(0, maxLength);
  }
};

export const classifySentimentHF = async (text) => {
  try {
    const client = getHF();
    return await withRetry(async () => {
      const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('HF timeout')), 20000));
      const result = await Promise.race([
        client.textClassification({
          model: 'distilbert-base-uncased-finetuned-sst-2-english',
          inputs: text.slice(0, 512),
        }),
        timeoutPromise
      ]);

      let score = 0;
      const positive = result.find(r => r.label === 'POSITIVE');
      const negative = result.find(r => r.label === 'NEGATIVE');

      if (positive && positive.score > 0.5) score = positive.score * 100;
      else if (negative && negative.score > 0.5) score = -(negative.score * 100);
      else if (result[0]) score = result[0].label === 'POSITIVE' ? result[0].score * 100 : -(result[0].score * 100);

      return Math.round(score);
    }, 1, 2000);
  } catch (error) {
    console.warn(`HF Sentiment failed: ${error.message}. Returning neutral score.`);
    return 0;
  }
};

const embeddingCache = new Map();

export const generateEmbeddingsHF = async (text) => {
  if (embeddingCache.has(text)) return embeddingCache.get(text);

  try {
    const client = getHF();
    return await withRetry(async () => {
      const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('HF timeout')), 20000));
      const result = await Promise.race([
        client.featureExtraction({
          model: 'sentence-transformers/all-MiniLM-L6-v2',
          inputs: text.slice(0, 512),
        }),
        timeoutPromise
      ]);

      if (embeddingCache.size > 1000) {
        const firstKey = embeddingCache.keys().next().value;
        embeddingCache.delete(firstKey);
      }

      embeddingCache.set(text, result);
      return result;
    }, 1, 2000);
  } catch (error) {
    console.warn(`HF Embedding failed: ${error.message}. Returning zero vector.`);
    return new Array(384).fill(0);
  }
};

export default { callHuggingFace, callHuggingFaceJSON, summarizeWithHF, classifySentimentHF, generateEmbeddingsHF };
