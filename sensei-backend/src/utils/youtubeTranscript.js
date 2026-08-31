import { YoutubeTranscript } from 'youtube-transcript';

export const extractVideoId = (url) => {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /^([a-zA-Z0-9_-]{11})$/
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
};

export const fetchTranscript = async (videoUrl) => {
  try {
    const videoId = extractVideoId(videoUrl);
    if (!videoId) {
      throw new Error('Invalid YouTube URL');
    }

    const transcriptItems = await Promise.race([
      YoutubeTranscript.fetchTranscript(videoId),
      new Promise((_, reject) => setTimeout(() => reject(new Error('YouTube transcript fetch timeout')), 10000))
    ]);

    const rawChunks = transcriptItems.map((item) => ({
      text: item.text,
      offset: item.offset,
      duration: item.duration
    }));

    const fullText = rawChunks
      .map((chunk) => chunk.text)
      .join(' ')
      .replace(/\s+/g, ' ')
      .replace(/\[.*?\]/g, '')
      .trim();

    return {
      videoId,
      chunks: rawChunks,
      fullText,
      wordCount: fullText.split(/\s+/).length
    };
  } catch (error) {
    throw new Error(`Failed to fetch transcript: ${error.message}`);
  }
};

export default { extractVideoId, fetchTranscript };
