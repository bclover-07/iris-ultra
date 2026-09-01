import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:fl_chart/fl_chart.dart';

import '../../providers/student_dashboard_provider.dart';
import '../../theme/app_colors.dart';
import '../../theme/neubrutalist_widgets.dart';
import '../../theme/animations.dart';

class DashboardScreen extends ConsumerStatefulWidget {
  const DashboardScreen({super.key});

  @override
  ConsumerState<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends ConsumerState<DashboardScreen> {
  @override
  void initState() {
    super.initState();
    Future.microtask(() {
      ref.read(studentDashboardProvider.notifier).fetchDashboard();
    });
  }

  @override
  Widget build(BuildContext context) {
    final dashState = ref.watch(studentDashboardProvider);
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: isDark ? AppColors.darkBg : AppColors.creamBg,
      body: SafeArea(
        child: RefreshIndicator(
          color: AppColors.brutalBlack,
          backgroundColor: AppColors.popYellow,
          onRefresh: () => ref.read(studentDashboardProvider.notifier).fetchDashboard(),
          child: SingleChildScrollView(
            physics: const AlwaysScrollableScrollPhysics(),
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _buildHeader(dashState.data),
                const SizedBox(height: 16),
                _buildNpuConsoleBanner(),
                const SizedBox(height: 16),
                _buildRiskModelCard(dashState.data),
                const SizedBox(height: 20),
                _buildFiveSignalsHeader(),
                const SizedBox(height: 12),
                _buildFiveSignalsGrid(dashState.data),
                const SizedBox(height: 20),
                _buildRadarChartSection(dashState.data),
                const SizedBox(height: 20),
                _buildFeatureHubSection(),
                const SizedBox(height: 24),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildHeader(dynamic data) {
    final level = data?.level ?? 1;
    final xp = data?.totalXP ?? 250;
    final streak = data?.streakDays ?? 3;

    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'SENSEI ULTRA',
              style: GoogleFonts.fredoka(
                fontSize: 24,
                fontWeight: FontWeight.bold,
                letterSpacing: -0.5,
                color: AppColors.brutalBlack,
              ),
            ),
            Text(
              'STANDALONE AI CAMPUS OS · v3',
              style: GoogleFonts.inter(
                fontSize: 10,
                fontWeight: FontWeight.bold,
                letterSpacing: 1.2,
                color: Colors.black54,
              ),
            ),
          ],
        ),
        Row(
          children: [
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
              decoration: BoxDecoration(
                color: AppColors.popYellow,
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: AppColors.brutalBlack, width: 2),
                boxShadow: const [
                  BoxShadow(color: AppColors.brutalBlack, offset: Offset(2, 2), blurRadius: 0),
                ],
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(Icons.bolt_rounded, size: 16, color: AppColors.brutalBlack),
                  const SizedBox(width: 4),
                  Text(
                    'LVL $level · ${xp}XP',
                    style: GoogleFonts.fredoka(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.brutalBlack),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 8),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
              decoration: BoxDecoration(
                color: AppColors.popCoral,
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: AppColors.brutalBlack, width: 2),
                boxShadow: const [
                  BoxShadow(color: AppColors.brutalBlack, offset: Offset(2, 2), blurRadius: 0),
                ],
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Text('🔥', style: TextStyle(fontSize: 12)),
                  const SizedBox(width: 4),
                  Text(
                    '$streak DAYS',
                    style: GoogleFonts.fredoka(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.white),
                  ),
                ],
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildNpuConsoleBanner() {
    return GestureDetector(
      onTap: () => context.go('/student/npu-console'),
      child: NeuCard(
        backgroundColor: const Color(0xFF1E1E2E),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: AppColors.npuTeal.withOpacity(0.2),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: AppColors.npuTeal, width: 2),
              ),
              child: const Icon(Icons.memory_rounded, color: AppColors.npuTeal, size: 24),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Text(
                        'LIVE NPU CONSOLE',
                        style: GoogleFonts.fredoka(fontSize: 13, fontWeight: FontWeight.bold, color: Colors.white, letterSpacing: 1),
                      ),
                      const SizedBox(width: 6),
                      const NeuBadge(label: '72.4 TOK/S', backgroundColor: AppColors.npuTeal, isLive: true),
                    ],
                  ),
                  const SizedBox(height: 2),
                  Text(
                    'Gemma 3n · Hexagon QNN · View on-device fallback telemetry',
                    style: GoogleFonts.inter(fontSize: 11, color: Colors.white60),
                  ),
                ],
              ),
            ),
            const Icon(Icons.arrow_forward_ios_rounded, color: Colors.white, size: 16),
          ],
        ),
      ),
    );
  }

  Widget _buildRiskModelCard(dynamic data) {
    final riskTier = data?.riskTier ?? 'low';
    final riskScore = data?.riskScore ?? 12;
    final topFactors = data?.topContributingFactors ?? [
      'Verified presence consistency at 92%',
      'Camo Quizo gesture accuracy at 88%'
    ];
    final tierColor = AppColors.getRiskColor(riskTier);

    return NeuCard(
      backgroundColor: Colors.white,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  const Icon(Icons.shield_rounded, color: AppColors.brutalBlack, size: 20),
                  const SizedBox(width: 6),
                  Text(
                    'ON-DEVICE RISK CLASSIFIER',
                    style: GoogleFonts.fredoka(fontSize: 13, fontWeight: FontWeight.bold, color: AppColors.brutalBlack, letterSpacing: 1),
                  ),
                ],
              ),
              NeuBadge(
                label: '${riskTier.toUpperCase()} RISK · $riskScore%',
                backgroundColor: tierColor,
              ),
            ],
          ),
          const SizedBox(height: 10),
          Text(
            'SHAP Explainability (Top 2 Contributing Factors):',
            style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.black54),
          ),
          const SizedBox(height: 6),
          ...topFactors.take(2).map((factor) => Padding(
            padding: const EdgeInsets.only(bottom: 4),
            child: Row(
              children: [
                const Icon(Icons.check_circle_outline_rounded, size: 14, color: AppColors.popGreen),
                const SizedBox(width: 6),
                Expanded(
                  child: Text(
                    factor,
                    style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w600, color: AppColors.brutalBlack),
                  ),
                ),
              ],
            ),
          )),
        ],
      ),
    );
  }

  Widget _buildFiveSignalsHeader() {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'FIVE VERIFIED SIGNALS (§2)',
              style: GoogleFonts.fredoka(fontSize: 15, fontWeight: FontWeight.bold, color: AppColors.brutalBlack, letterSpacing: 0.5),
            ),
            Text(
              'NO TYPED ACADEMIC DATA · 100% OBSERVED & GRADED',
              style: GoogleFonts.inter(fontSize: 9, fontWeight: FontWeight.bold, color: Colors.black45, letterSpacing: 1),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildFiveSignalsGrid(dynamic data) {
    return Column(
      children: [
        Row(
          children: [
            Expanded(
              child: NeuStatCard(
                title: 'Study Presence',
                value: '92%',
                subtitle: 'Camera/pose verified',
                icon: Icons.visibility_rounded,
                color: AppColors.signalPresence,
                onTap: () => context.go('/student/focus-guardian'),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: NeuStatCard(
                title: 'Quiz Mastery',
                value: '86%',
                subtitle: 'Camo Quizo gestures',
                icon: Icons.front_hand_rounded,
                color: AppColors.signalMastery,
                onTap: () => context.go('/student/quiz/camo'),
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            Expanded(
              child: NeuStatCard(
                title: 'Study Progress',
                value: '78%',
                subtitle: 'Self-plan checklists',
                icon: Icons.checklist_rounded,
                color: AppColors.signalProgress,
                onTap: () => context.go('/student/study-plan'),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: NeuStatCard(
                title: 'Wellness',
                value: '90%',
                subtitle: '4-7-8 & ambient score',
                icon: Icons.favorite_rounded,
                color: AppColors.signalWellness,
                onTap: () => context.go('/student/voice-journal'),
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        NeuStatCard(
          title: 'Engagement Signal',
          value: '88%',
          subtitle: 'Mentor voice-turns + Practice Area drills',
          icon: Icons.psychology_rounded,
          color: AppColors.signalEngagement,
          onTap: () => context.go('/student/mentor'),
        ),
      ],
    );
  }

  Widget _buildRadarChartSection(dynamic data) {
    return NeuCard(
      backgroundColor: Colors.white,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'VERIFIED MASTERY RADAR',
                style: GoogleFonts.fredoka(fontSize: 14, fontWeight: FontWeight.bold, color: AppColors.brutalBlack, letterSpacing: 1),
              ),
              const NeuBadge(label: 'BALANCED', backgroundColor: AppColors.popGreen),
            ],
          ),
          const SizedBox(height: 16),
          SizedBox(
            height: 200,
            child: RadarChart(
              RadarChartData(
                radarShape: RadarShape.polygon,
                radarBorderData: const BorderSide(color: AppColors.brutalBlack, width: 2),
                gridBorderData: const BorderSide(color: Colors.black12, width: 1.5),
                tickBorderData: const BorderSide(color: Colors.transparent),
                ticksTextStyle: const TextStyle(color: Colors.transparent),
                dataSets: [
                  RadarDataSet(
                    fillColor: AppColors.popViolet.withOpacity(0.25),
                    borderColor: AppColors.popViolet,
                    borderWidth: 2.5,
                    entryRadius: 4,
                    dataEntries: const [
                      RadarEntry(value: 92), // Presence
                      RadarEntry(value: 86), // Quiz Mastery
                      RadarEntry(value: 78), // Study Plan
                      RadarEntry(value: 90), // Wellness
                      RadarEntry(value: 88), // Engagement
                    ],
                  ),
                ],
                getTitle: (index, angle) {
                  const titles = ['Presence', 'Mastery', 'Progress', 'Wellness', 'Engage'];
                  return RadarChartTitle(
                    text: titles[index % titles.length],
                    angle: angle,
                  );
                },
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFeatureHubSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'CAMPUS HUBS & PRACTICE ARENAS',
          style: GoogleFonts.fredoka(fontSize: 15, fontWeight: FontWeight.bold, color: AppColors.brutalBlack, letterSpacing: 0.5),
        ),
        const SizedBox(height: 12),
        _buildHubTile('AI Study Mentor', 'Gemma 3n voice mentor on Hexagon NPU', Icons.psychology_rounded, AppColors.popViolet, () => context.go('/student/mentor')),
        const SizedBox(height: 10),
        _buildHubTile('Camo Quizo Arena', 'Gesture-controlled hand pose quizzes', Icons.front_hand_rounded, AppColors.popCoral, () => context.go('/student/quiz/camo')),
        const SizedBox(height: 10),
        _buildHubTile('Multimodal Doubt Solver', 'Notebook scanner & handwriting digitizer', Icons.crop_free_rounded, AppColors.popYellow, () => context.go('/student/doubt-solver')),
        const SizedBox(height: 10),
        _buildHubTile('Practice Area', 'Mock Interviews + Live Debate Arena', Icons.gavel_rounded, AppColors.popBlue, () => context.go('/student/practice-area')),
        const SizedBox(height: 10),
        _buildHubTile('Virtual World Hub', 'Multiplayer 3D study campus & quiz battles', Icons.public_rounded, AppColors.popGreen, () => context.go('/student/world')),
        const SizedBox(height: 10),
        _buildHubTile('Career Simulator', 'Monte Carlo on-device trajectory simulation', Icons.trending_up_rounded, AppColors.popPink, () => context.go('/student/career-simulator')),
      ],
    );
  }

  Widget _buildHubTile(String title, String subtitle, IconData icon, Color color, VoidCallback onTap) {
    return NeuCard(
      backgroundColor: Colors.white,
      onTap: onTap,
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: color.withOpacity(0.2),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: AppColors.brutalBlack, width: 2),
            ),
            child: Icon(icon, color: AppColors.brutalBlack, size: 22),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: GoogleFonts.fredoka(fontSize: 14, fontWeight: FontWeight.bold, color: AppColors.brutalBlack),
                ),
                Text(
                  subtitle,
                  style: GoogleFonts.inter(fontSize: 11, color: Colors.black54),
                ),
              ],
            ),
          ),
          const Icon(Icons.arrow_forward_ios_rounded, size: 14, color: AppColors.brutalBlack),
        ],
      ),
    );
  }
}
