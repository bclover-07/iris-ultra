import { callGemini } from '../services/gemini.service.js';

export async function transcribeAudio(audioBuffer) {
  try {
    const text = await callGemini(
      `You are a speech transcription system. The user has provided audio that was transcribed using browser speech recognition. 
       Please clean up and format the following raw transcription, fixing any obvious errors while preserving the original meaning.
       If no text is provided, return an empty transcription.
       Return ONLY the cleaned text, nothing else.`,
      { systemPrompt: 'You are a precise speech-to-text post-processor.' }
    );

    return {
      transcript: text || '',
      words: [],
      duration: 0
    };
  } catch (e) {
    return {
      transcript: '',
      words: [],
      duration: 0
    };
  }
}

export function processTranscriptMetrics(transcript, durationSeconds) {
  const words = transcript.split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  const wpm = durationSeconds > 0 ? Math.round((wordCount / durationSeconds) * 60) : 0;

  const fillerWords = ['um', 'uh', 'like', 'you know', 'basically', 'literally', 'actually', 'right', 'so', 'okay'];
  let fillerCount = 0;
  const lowerText = transcript.toLowerCase();
  fillerWords.forEach(filler => {
    const regex = new RegExp(`\\b${filler}\\b`, 'g');
    const matches = lowerText.match(regex);
    if (matches) fillerCount += matches.length;
  });

  return {
    wordCount,
    wpm,
    fillerCount,
    fillerRate: wordCount > 0 ? fillerCount / wordCount : 0,
    duration: durationSeconds
  };
}

export default { transcribeAudio, processTranscriptMetrics };
