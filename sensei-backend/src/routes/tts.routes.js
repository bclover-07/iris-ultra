import { Router } from 'express';
import { verifyAccessToken } from '../middleware/auth.middleware.js';
import axios from 'axios';

const router = Router();
router.use(verifyAccessToken);

router.all('/generate', async (req, res) => {
  try {
    const text = req.body.text || req.query.text;
    const voiceId = req.body.voiceId || req.query.voiceId || process.env.ELEVENLABS_VOICE_ID || 'EXAVITQu4vr4xnSDxMaL';
    
    if (!process.env.ELEVENLABS_API_KEY || process.env.ELEVENLABS_API_KEY.includes('your_')) {
      throw new Error('ElevenLabs API key is not configured.');
    }

    const response = await axios.post(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        text,
        model_id: 'eleven_monolingual_v1',
        voice_settings: { stability: 0.5, similarity_boost: 0.5 }
      },
      {
        headers: {
          'xi-api-key': process.env.ELEVENLABS_API_KEY,
          'Content-Type': 'application/json',
          'Accept': 'audio/mpeg'
        },
        responseType: 'arraybuffer'
      }
    );

    res.set('Content-Type', 'audio/mpeg');
    res.send(response.data);
  } catch (error) {
    console.warn('ElevenLabs TTS failed, falling back to Google Translate TTS:', error.message);
    try {
      if (!text) {
        return res.status(400).json({ error: 'Text parameter is required' });
      }

      // Helper to split text into chunks of max 180 characters
      const splitTextIntoChunks = (str, maxLength = 180) => {
        const sentences = str.match(/[^.!?]+[.!?]+(\s|$)|[^.!?]+$/g) || [str];
        const resultChunks = [];
        let currentChunk = '';

        for (let sentence of sentences) {
          sentence = sentence.trim();
          if (!sentence) continue;
          
          if (sentence.length > maxLength) {
            const words = sentence.split(/\s+/);
            for (const word of words) {
              if ((currentChunk + ' ' + word).trim().length > maxLength) {
                if (currentChunk.trim()) resultChunks.push(currentChunk.trim());
                currentChunk = word;
              } else {
                currentChunk = currentChunk ? currentChunk + ' ' + word : word;
              }
            }
          } else {
            if ((currentChunk + ' ' + sentence).trim().length > maxLength) {
              if (currentChunk.trim()) resultChunks.push(currentChunk.trim());
              currentChunk = sentence;
            } else {
              currentChunk = currentChunk ? currentChunk + ' ' + sentence : sentence;
            }
          }
        }
        if (currentChunk.trim()) {
          resultChunks.push(currentChunk.trim());
        }
        return resultChunks;
      };

      const chunks = splitTextIntoChunks(text, 180);
      const audioBuffers = [];

      for (const chunk of chunks) {
        const fallbackUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=en&client=tw-ob&q=${encodeURIComponent(chunk)}`;
        const fallbackResponse = await axios.get(fallbackUrl, {
          responseType: 'arraybuffer',
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.0.0 Safari/537.36'
          }
        });
        audioBuffers.push(Buffer.from(fallbackResponse.data));
      }

      const combinedBuffer = Buffer.concat(audioBuffers);
      res.set('Content-Type', 'audio/mpeg');
      res.send(combinedBuffer);
    } catch (fallbackError) {
      console.error('All TTS engines failed:', fallbackError.message);
      res.status(500).json({ error: 'Failed to generate speech', details: fallbackError.message });
    }
  }
});

export default router;
