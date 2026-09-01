import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:go_router/go_router.dart';
import '../../theme/app_colors.dart';
import '../../theme/neubrutalist_widgets.dart';
import '../../theme/animations.dart';

class PracticeAreaScreen extends StatelessWidget {
  const PracticeAreaScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.creamBg,
      body: SafeArea(
        child: Column(
          children: [
            _buildHeader(context),
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(16),
                child: Column(
                  children: [
                    StaggeredFadeSlide(
                      index: 0,
                      child: _buildModeCard(
                        context,
                        title: 'MOCK INTERVIEW',
                        subtitle: '10-Turn Adaptive AI Interview',
                        description: 'Practice with a virtual interviewer. Voice-powered, scored in real-time with face mesh confidence tracking.',
                        icon: Icons.work_outline_rounded,
                        color: AppColors.popBlue,
                        onTap: () => context.go('/student/interview'),
                      ),
                    ),
                    const SizedBox(height: 16),
                    StaggeredFadeSlide(
                      index: 1,
                      child: _buildModeCard(
                        context,
                        title: 'DEBATE ARENA',
                        subtitle: 'Real-Time AI Debate Opponent',
                        description: 'Choose a topic, defend your stance against an AI opponent. Timed turns with delivery and rebuttal scoring.',
                        icon: Icons.gavel_rounded,
                        color: AppColors.popCoral,
                        onTap: () => context.go('/student/debate'),
                      ),
                    ),
                    const SizedBox(height: 24),
                    StaggeredFadeSlide(
                      index: 2,
                      child: _buildStatsRow(),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildHeader(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: const BoxDecoration(
        color: AppColors.creamBg,
        border: Border(bottom: BorderSide(color: AppColors.brutalBlack, width: 2.5)),
      ),
      child: Row(
        children: [
          GestureDetector(
            onTap: () => Navigator.of(context).pop(),
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
          Text(
            'PRACTICE AREA',
            style: GoogleFonts.fredoka(fontSize: 20, fontWeight: FontWeight.bold, color: AppColors.brutalBlack),
          ),
        ],
      ),
    );
  }

  Widget _buildModeCard(
    BuildContext context, {
    required String title,
    required String subtitle,
    required String description,
    required IconData icon,
    required Color color,
    required VoidCallback onTap,
  }) {
    return NeuCard(
      backgroundColor: Colors.white,
      onTap: onTap,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: color.withOpacity(0.2),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: AppColors.brutalBlack, width: 2.5),
                  boxShadow: [
                    BoxShadow(color: color.withOpacity(0.3), offset: const Offset(3, 3), blurRadius: 0),
                  ],
                ),
                child: Icon(icon, color: AppColors.brutalBlack, size: 28),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: GoogleFonts.fredoka(fontSize: 18, fontWeight: FontWeight.bold, color: AppColors.brutalBlack),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      subtitle,
                      style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w600, color: Colors.black45),
                    ),
                  ],
                ),
              ),
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: color,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppColors.brutalBlack, width: 2),
                ),
                child: const Icon(Icons.arrow_forward_rounded, color: AppColors.brutalBlack, size: 18),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            description,
            style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w500, color: Colors.black54, height: 1.4),
          ),
        ],
      ),
    );
  }

  Widget _buildStatsRow() {
    return Row(
      children: [
        Expanded(
          child: NeuStatCard(
            title: 'Interviews',
            value: '0',
            subtitle: 'Sessions completed',
            icon: Icons.work_outline_rounded,
            color: AppColors.popBlue,
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: NeuStatCard(
            title: 'Debates',
            value: '0',
            subtitle: 'Rounds debated',
            icon: Icons.gavel_rounded,
            color: AppColors.popCoral,
          ),
        ),
      ],
    );
  }
}
