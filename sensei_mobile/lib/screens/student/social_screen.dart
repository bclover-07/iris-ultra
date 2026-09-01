import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../theme/neubrutalist_widgets.dart';
import '../../theme/app_colors.dart';

class SocialScreen extends StatelessWidget {
  const SocialScreen({super.key});

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
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    NeuCard(
                      backgroundColor: Colors.white,
                      child: Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.all(14),
                            decoration: BoxDecoration(
                              color: AppColors.popViolet.withValues(alpha: 0.2),
                              borderRadius: BorderRadius.circular(14),
                              border: Border.all(color: AppColors.brutalBlack, width: 2),
                            ),
                            child: const Icon(Icons.people_alt_rounded, size: 32, color: AppColors.brutalBlack),
                          ),
                          const SizedBox(width: 14),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'SOCIAL & GAMIFICATION HUB',
                                  style: GoogleFonts.fredoka(fontSize: 16, fontWeight: FontWeight.bold, color: AppColors.brutalBlack),
                                ),
                                const SizedBox(height: 2),
                                Text(
                                  'Opt-in leaderboard, campus badges, and peer study streaks.',
                                  style: GoogleFonts.inter(fontSize: 12, color: Colors.black54),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 20),
                    _buildActionCard(
                      title: 'Opt-in Leaderboard',
                      subtitle: 'Check verified XP rankings & streak positions',
                      icon: Icons.emoji_events_rounded,
                      color: AppColors.popYellow,
                      onTap: () => context.go('/student/leaderboard'),
                    ),
                    const SizedBox(height: 12),
                    _buildActionCard(
                      title: 'Virtual World Hub',
                      subtitle: 'Multiplayer 3D study plaza and quiz battles',
                      icon: Icons.public_rounded,
                      color: AppColors.popGreen,
                      onTap: () => context.go('/student/world'),
                    ),
                    const SizedBox(height: 12),
                    _buildActionCard(
                      title: 'AI Practice Area',
                      subtitle: 'Mock Interviews and Live Debate Arena',
                      icon: Icons.gavel_rounded,
                      color: AppColors.popCoral,
                      onTap: () => context.go('/student/practice-area'),
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
          Text(
            'CAMPUS SOCIAL',
            style: GoogleFonts.fredoka(fontSize: 18, fontWeight: FontWeight.bold, color: AppColors.brutalBlack),
          ),
        ],
      ),
    );
  }

  Widget _buildActionCard({
    required String title,
    required String subtitle,
    required IconData icon,
    required Color color,
    required VoidCallback onTap,
  }) {
    return NeuCard(
      backgroundColor: Colors.white,
      onTap: onTap,
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.25),
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: AppColors.brutalBlack, width: 2),
            ),
            child: Icon(icon, size: 26, color: AppColors.brutalBlack),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: GoogleFonts.fredoka(fontSize: 15, fontWeight: FontWeight.bold, color: AppColors.brutalBlack)),
                const SizedBox(height: 2),
                Text(subtitle, style: GoogleFonts.inter(fontSize: 12, color: Colors.black54)),
              ],
            ),
          ),
          const Icon(Icons.arrow_forward_ios_rounded, size: 14, color: AppColors.brutalBlack),
        ],
      ),
    );
  }
}
