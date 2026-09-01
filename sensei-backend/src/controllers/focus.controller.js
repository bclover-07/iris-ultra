import FocusSession from '../models/FocusSession.js';
import StudentProfile from '../models/StudentProfile.js';

export const logFocusSession = async (req, res) => {
  try {
    const {
      durationMinutes,
      verifiedPresenceRatio,
      breathingCompliance,
      ambientScore,
      distractionCount,
      hapticNudgeCount,
      fingerprintVerified,
      appSwitchesCount
    } = req.body;

    const sessionMinutes = durationMinutes || 25;
    const presenceRatio = verifiedPresenceRatio !== undefined ? verifiedPresenceRatio : 0.95;
    const verifiedMinutes = Math.round(sessionMinutes * presenceRatio);
    const xpEarned = verifiedMinutes * 5 + (fingerprintVerified ? 25 : 10);

    const session = await FocusSession.create({
      userId: req.user.userId,
      durationMinutes: sessionMinutes,
      verifiedMinutes,
      presenceScore: Math.round(presenceRatio * 100),
      breathingCompliance: Math.round((breathingCompliance || 0.9) * 100),
      ambientScore: ambientScore || 85,
      distractionsDetected: distractionCount || 0,
      hapticNudgesFired: hapticNudgeCount || 0,
      fingerprintGated: fingerprintVerified || false,
      appSwitches: appSwitchesCount || 0,
      xpEarned
    });

    let profile = await StudentProfile.findOne({ userId: req.user.userId });
    if (profile) {
      profile.presenceConsistency.totalVerifiedMinutes += verifiedMinutes;
      profile.presenceConsistency.verifiedSessionsCount += 1;
      profile.presenceConsistency.lastVerifiedAt = new Date();
      profile.presenceConsistency.score = Math.min(100, Math.round(profile.presenceConsistency.score * 0.85 + Math.round(presenceRatio * 100) * 0.15));

      profile.wellness.breathingComplianceAvg = Math.round(profile.wellness.breathingComplianceAvg * 0.8 + (breathingCompliance || 0.9) * 100 * 0.2);
      profile.wellness.ambientScoreAvg = Math.round(profile.wellness.ambientScoreAvg * 0.8 + (ambientScore || 85) * 0.2);
      profile.wellness.score = Math.round((profile.wellness.breathingComplianceAvg + profile.wellness.ambientScoreAvg) / 2);

      profile.xp += xpEarned;
      profile.level = Math.floor(profile.xp / 500) + 1;
      await profile.save();
    }

    res.status(201).json({
      sessionId: session._id,
      verifiedMinutes,
      xpEarned,
      message: 'Verified Study Session Logged Successfully! 🎯',
      stats: {
        presenceScore: session.presenceScore,
        ambientScore: session.ambientScore,
        wellnessContribution: '+5%'
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getFocusHistory = async (req, res) => {
  try {
    const history = await FocusSession.find({ userId: req.user.userId })
      .sort({ createdAt: -1 })
      .limit(10);
    res.json(history);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export default { logFocusSession, getFocusHistory };
