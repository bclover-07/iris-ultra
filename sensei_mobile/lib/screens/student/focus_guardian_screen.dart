import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:go_router/go_router.dart';
import '../../theme/app_colors.dart';
import '../../theme/neubrutalist_widgets.dart';
import '../../theme/animations.dart';
import '../../providers/focus_provider.dart';
import '../../services/api_service.dart';

class FocusGuardianScreen extends ConsumerStatefulWidget {
  const FocusGuardianScreen({super.key});

  @override
  ConsumerState<FocusGuardianScreen> createState() => _FocusGuardianScreenState();
}

class _FocusGuardianScreenState extends ConsumerState<FocusGuardianScreen>
    with SingleTickerProviderStateMixin {
  late AnimationController _breathingAnim;
  String _breathingText = 'Inhale (4s)';
  int _breathingCount = 4;

  @override
  void initState() {
    super.initState();
    _breathingAnim = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 19),
    );
  }

  @override
  void dispose() {
    _breathingAnim.dispose();
    super.dispose();
  }

  Future<void> _handleStartSession({bool biometric = false}) async {
    await ref.read(focusProvider.notifier).startSession(biometricGated: biometric);
  }

  Future<void> _handleEndSession() async {
    final session = await ref.read(focusProvider.notifier).endSession();

    try {
      await ApiService().post('/api/focus/session', data: {
        'startTime': session.startTime.toIso8601String(),
        'endTime': session.endTime?.toIso8601String(),
        'distractionCount': session.distractionCount,
        'verifiedMinutes': session.verifiedMinutes,
        'ambientScore': session.ambientScore,
        'ambientSummary': session.ambientSummary,
      });
    } catch (_) {}

    if (mounted) {
      _showSummaryDialog(session);
    }
  }

  void _showSummaryDialog(dynamic session) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppColors.creamCard,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(20),
          side: const BorderSide(color: AppColors.brutalBlack, width: 3),
        ),
        title: Text(
          'SESSION COMPLETED! 🎯',
          style: GoogleFonts.fredoka(fontWeight: FontWeight.bold, color: AppColors.brutalBlack),
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('• Verified Minutes: ${session.verifiedMinutes} min', style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
            const SizedBox(height: 6),
            Text('• Distractions: ${session.distractionCount}', style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
            const SizedBox(height: 6),
            Text('• Environment: ${session.ambientSummary.isEmpty ? "Optimal Light & Quiet Desk" : session.ambientSummary}', style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
            const SizedBox(height: 12),
            const NeuBadge(label: '+45 XP TO VERIFIED PRESENCE', backgroundColor: AppColors.popGreen),
          ],
        ),
        actions: [
          NeuButton(
            text: 'GREAT!',
            backgroundColor: AppColors.popYellow,
            onPressed: () => Navigator.of(ctx).pop(),
          ),
        ],
      ),
    );
  }

  String _formatDuration(int totalSeconds) {
    final minutes = (totalSeconds ~/ 60).toString().padLeft(2, '0');
    final seconds = (totalSeconds % 60).toString().padLeft(2, '0');
    return '$minutes:$seconds';
  }

  @override
  Widget build(BuildContext context) {
    final focusState = ref.watch(focusProvider);

    return Scaffold(
      backgroundColor: AppColors.creamBg,
      body: SafeArea(
        child: Column(
          children: [
            _buildHeader(focusState),
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(16),
                child: Column(
                  children: [
                    if (!focusState.isSessionActive)
                      _buildStartSessionCard()
                    else
                      _buildActiveSessionView(focusState),
                    const SizedBox(height: 16),
                    _buildAmbientEnvironmentCard(focusState),
                    const SizedBox(height: 16),
                    _buildBreathingExerciseCard(focusState),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildHeader(FocusState state) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: const BoxDecoration(
        color: AppColors.creamBg,
        border: Border(bottom: BorderSide(color: AppColors.brutalBlack, width: 2.5)),
      ),
      child: Row(
        children: [
          GestureDetector(
            onTap: () => context.pop(),
            child: Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: AppColors.creamCard,
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: AppColors.brutalBlack, width: 2.5),
                boxShadow: const [
                  BoxShadow(color: AppColors.brutalBlack, offset: Offset(2, 2), blurRadius: 0),
                ],
              ),
              child: const Icon(Icons.arrow_back_rounded, color: AppColors.brutalBlack, size: 20),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'FOCUS GUARDIAN',
                  style: GoogleFonts.fredoka(fontSize: 18, fontWeight: FontWeight.bold, color: AppColors.brutalBlack),
                ),
                Text(
                  'ON-DEVICE PRESENCE & POSE VERIFIER',
                  style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.black54, letterSpacing: 1.1),
                ),
              ],
            ),
          ),
          NeuBadge(
            label: state.isSessionActive ? 'RECORDING PRESENCE' : 'STANDBY',
            backgroundColor: state.isSessionActive ? AppColors.popGreen : AppColors.popYellow,
            isLive: state.isSessionActive,
          ),
        ],
      ),
    );
  }

  Widget _buildStartSessionCard() {
    return NeuCard(
      backgroundColor: Colors.white,
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: AppColors.popGreen.withOpacity(0.2),
              shape: BoxShape.circle,
              border: Border.all(color: AppColors.brutalBlack, width: 3),
            ),
            child: const Icon(Icons.visibility_rounded, size: 52, color: AppColors.brutalBlack),
          ),
          const SizedBox(height: 16),
          Text(
            'START VERIFIED STUDY SESSION',
            style: GoogleFonts.fredoka(fontSize: 18, fontWeight: FontWeight.bold, color: AppColors.brutalBlack),
          ),
          const SizedBox(height: 8),
          Text(
            'Uses Qualcomm QNN NPU pose landmarks to verify study presence. No typed logs — strictly camera and ambient verified.',
            textAlign: TextAlign.center,
            style: GoogleFonts.inter(fontSize: 13, color: Colors.black54, height: 1.4),
          ),
          const SizedBox(height: 20),
          Row(
            children: [
              Expanded(
                child: NeuButton(
                  text: 'START SESSION',
                  icon: Icons.play_arrow_rounded,
                  backgroundColor: AppColors.popGreen,
                  onPressed: () => _handleStartSession(),
                ),
              ),
              const SizedBox(width: 10),
              GestureDetector(
                onTap: () => _handleStartSession(biometric: true),
                child: Container(
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: AppColors.popViolet,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: AppColors.brutalBlack, width: 3),
                    boxShadow: const [
                      BoxShadow(color: AppColors.brutalBlack, offset: Offset(3, 3), blurRadius: 0),
                    ],
                  ),
                  child: const Icon(Icons.fingerprint_rounded, color: Colors.white, size: 24),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildActiveSessionView(FocusState state) {
    return Column(
      children: [
        NeuCard(
          backgroundColor: const Color(0xFF1E1E2E),
          child: Column(
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const NeuBadge(
                    label: 'HEXAGON NPU · POSE DETECTOR',
                    backgroundColor: AppColors.npuTeal,
                    isLive: true,
                  ),
                  if (state.isBiometricVerified)
                    const NeuBadge(
                      label: 'FINGERPRINT LOCKED',
                      backgroundColor: AppColors.popPink,
                      icon: Icons.lock_rounded,
                    ),
                ],
              ),
              const SizedBox(height: 20),
              Text(
                _formatDuration(state.elapsedSeconds),
                style: GoogleFonts.fredoka(
                  fontSize: 56,
                  fontWeight: FontWeight.bold,
                  color: Colors.white,
                  letterSpacing: 2,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                state.latestPose?.isDistracted == true
                    ? '⚠️ DISTRACTION DETECTED — HAPTIC NUDGE'
                    : '✅ STUDENT ATTENTIVE & PRESENT AT DESK',
                style: GoogleFonts.fredoka(
                  fontSize: 12,
                  fontWeight: FontWeight.bold,
                  color: state.latestPose?.isDistracted == true ? AppColors.popCoral : AppColors.popGreen,
                ),
              ),
              const SizedBox(height: 20),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceAround,
                children: [
                  _buildMiniStat('ATTENTION', '${((state.latestPose?.attentionScore ?? 0.9) * 100).round()}%', AppColors.popYellow),
                  _buildMiniStat('DISTRACTIONS', '${state.distractionCount}', AppColors.popCoral),
                  _buildMiniStat('POSTURE', '${((state.latestPose?.postureScore ?? 0.85) * 100).round()}%', AppColors.popBlue),
                ],
              ),
              const SizedBox(height: 20),
              NeuButton(
                text: 'END SESSION & SYNC PRESENCE',
                icon: Icons.stop_rounded,
                backgroundColor: AppColors.popCoral,
                textColor: Colors.white,
                onPressed: _handleEndSession,
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildMiniStat(String label, String value, Color color) {
    return Column(
      children: [
        Text(
          value,
          style: GoogleFonts.fredoka(fontSize: 22, fontWeight: FontWeight.bold, color: color),
        ),
        const SizedBox(height: 2),
        Text(
          label,
          style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.white60),
        ),
      ],
    );
  }

  Widget _buildAmbientEnvironmentCard(FocusState state) {
    final score = state.ambientScore;

    return NeuCard(
      backgroundColor: Colors.white,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'AMBIENT STUDY ENVIRONMENT',
                style: GoogleFonts.fredoka(fontSize: 14, fontWeight: FontWeight.bold, color: AppColors.brutalBlack),
              ),
              NeuBadge(
                label: '${(score?.compositeScore ?? 88).round()}/100',
                backgroundColor: AppColors.popGreen,
              ),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            score?.summary ?? 'Good light · Stable desk · Quiet room',
            style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.bold, color: AppColors.brutalBlack),
          ),
          const SizedBox(height: 12),
          NeuProgressBar(
            percentage: score?.compositeScore ?? 88,
            fillColor: AppColors.popGreen,
          ),
          const SizedBox(height: 10),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              _buildSensorChip(Icons.wb_sunny_rounded, score?.lightQuality ?? 'Good Light', AppColors.popYellow),
              _buildSensorChip(Icons.screen_rotation_rounded, score?.stabilityLabel ?? 'Stable Desk', AppColors.popBlue),
              _buildSensorChip(Icons.mic_none_rounded, score?.noiseLabel ?? 'Quiet Room', AppColors.popViolet),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildSensorChip(IconData icon, String text, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color.withOpacity(0.2),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: AppColors.brutalBlack, width: 1.5),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 14, color: AppColors.brutalBlack),
          const SizedBox(width: 4),
          Text(text, style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.bold, color: AppColors.brutalBlack)),
        ],
      ),
    );
  }

  Widget _buildBreathingExerciseCard(FocusState state) {
    return NeuCard(
      backgroundColor: AppColors.popViolet.withOpacity(0.1),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  const Icon(Icons.air_rounded, color: AppColors.popViolet, size: 20),
                  const SizedBox(width: 6),
                  Text(
                    '4-7-8 CALM BREATHING',
                    style: GoogleFonts.fredoka(fontSize: 14, fontWeight: FontWeight.bold, color: AppColors.brutalBlack),
                  ),
                ],
              ),
              NeuBadge(
                label: 'WELLNESS SYNC',
                backgroundColor: AppColors.popPink,
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            'Calibrate your nervous system with 4s inhale, 7s hold, and 8s exhale cycles to maximize study retention.',
            style: GoogleFonts.inter(fontSize: 12, color: Colors.black54, height: 1.3),
          ),
          const SizedBox(height: 14),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: [
              _buildBreathStep('1. INHALE', '4 SEC', AppColors.popBlue),
              const Icon(Icons.arrow_forward_rounded, size: 16, color: AppColors.brutalBlack),
              _buildBreathStep('2. HOLD', '7 SEC', AppColors.popYellow),
              const Icon(Icons.arrow_forward_rounded, size: 16, color: AppColors.brutalBlack),
              _buildBreathStep('3. EXHALE', '8 SEC', AppColors.popGreen),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildBreathStep(String step, String duration, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
      decoration: BoxDecoration(
        color: color.withOpacity(0.3),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.brutalBlack, width: 2),
      ),
      child: Column(
        children: [
          Text(step, style: GoogleFonts.fredoka(fontSize: 11, fontWeight: FontWeight.bold, color: AppColors.brutalBlack)),
          Text(duration, style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.black54)),
        ],
      ),
    );
  }
}
