import VoiceJournal from '../models/VoiceJournal.js';
import StudentProfile from '../models/StudentProfile.js';

export const logVoiceEntry = async (req, res) => {
  try {
    const { transcript, sentiment, duration, audioUrl } = req.body;

    if (!transcript || transcript.trim().length < 5) {
      return res.status(400).json({ error: 'Transcript must be at least 5 characters' });
    }

    const entry = await VoiceJournal.create({
      userId: req.user.userId,
      transcript: transcript.trim(),
      sentiment: sentiment || 'neutral',
      duration: duration || 30,
      audioUrl: audioUrl || null,
      analyzedOnDevice: true
    });

    let profile = await StudentProfile.findOne({ userId: req.user.userId });
    if (profile) {
      profile.wellness.recentSentiment = sentiment || 'neutral';
      profile.engagement.mentorVoiceTurns += 1;
      profile.xp += 20;
      await profile.save();
    }

    res.status(201).json({
      entryId: entry._id,
      sentiment: entry.sentiment,
      timestamp: entry.createdAt
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getVoiceEntries = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const entries = await VoiceJournal.find({ userId: req.user.userId })
      .sort({ createdAt: -1 })
      .limit(limit);

    const sentimentCounts = { positive: 0, neutral: 0, negative: 0 };
    entries.forEach(e => {
      sentimentCounts[e.sentiment] = (sentimentCounts[e.sentiment] || 0) + 1;
    });

    res.json({
      entries,
      stats: {
        total: entries.length,
        sentimentBreakdown: sentimentCounts,
        dominantMood: Object.entries(sentimentCounts)
          .sort((a, b) => b[1] - a[1])[0]?.[0] || 'neutral'
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getVoiceTrend = async (req, res) => {
  try {
    const entries = await VoiceJournal.find({ userId: req.user.userId })
      .sort({ createdAt: -1 })
      .limit(30)
      .select('sentiment createdAt duration');

    const trend = entries.reverse().map(e => ({
      date: e.createdAt,
      sentiment: e.sentiment,
      score: e.sentiment === 'positive' ? 1 : e.sentiment === 'negative' ? -1 : 0
    }));

    res.json({ trend });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export default { logVoiceEntry, getVoiceEntries, getVoiceTrend };
