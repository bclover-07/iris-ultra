import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../theme/neubrutalist_widgets.dart';
import '../../theme/app_colors.dart';

class SocialScreen extends StatelessWidget {
  const SocialScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: isDark ? const Color(0xFF050508) : const Color(0xFFFEF9C3),
      appBar: AppBar(
        title: Text('SOCIAL HUB 🌐', style: GoogleFonts.fredoka(fontWeight: FontWeight.bold)),
        backgroundColor: Colors.transparent,
        elevation: 0,
        actions: [
          Container(
            margin: const EdgeInsets.all(8),
            padding: const EdgeInsets.symmetric(horizontal: 12),
            decoration: BoxDecoration(
              color: AppColors.senseiPurple.withValues(alpha: 0.2),
              border: Border.all(color: AppColors.senseiPurple),
              borderRadius: BorderRadius.circular(16),
            ),
            alignment: Alignment.center,
            child: Row(
              children: [
                const Icon(Icons.group, size: 16, color: AppColors.senseiPurple),
                const SizedBox(width: 4),
                Text('Connect & Compete', style: GoogleFonts.spaceMono(fontSize: 10, fontWeight: FontWeight.bold, color: AppColors.senseiPurple)),
              ],
            ),
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            BrutalistCard(
              backgroundColor: isDark ? const Color(0xFF1E293B) : Colors.white,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: AppColors.senseiPurple.withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: AppColors.senseiPurple),
                        ),
                        child: const Icon(Icons.people, size: 32, color: AppColors.senseiPurple),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text('Social Hub', style: GoogleFonts.fredoka(fontSize: 28, fontWeight: FontWeight.bold)),
                            Text('Connect, Compete, and Collaborate!', style: GoogleFonts.fredoka(color: Colors.grey)),
                          ],
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),
            _buildActionCard(
              context: context,
              title: 'Leaderboard',
              subtitle: 'Check your class ranking & XP',
              icon: Icons.emoji_events,
              color: AppColors.senseiYellow,
              route: '/student/leaderboard',
              isDark: isDark,
            ),
            const SizedBox(height: 16),
            _buildActionCard(
              context: context,
              title: 'Live Polls',
              subtitle: 'Vote in classroom polls',
              icon: Icons.bar_chart,
              color: AppColors.senseiGreen,
              route: '/student/polls',
              isDark: isDark,
            ),
            const SizedBox(height: 16),
            _buildActionCard(
              context: context,
              title: 'Help Desk',
              subtitle: 'Raise tickets & get fast support',
              icon: Icons.help_outline,
              color: AppColors.senseiBlue,
              route: '/student/help-desk',
              isDark: isDark,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildActionCard({
    required BuildContext context,
    required String title,
    required String subtitle,
    required IconData icon,
    required Color color,
    required String route,
    required bool isDark,
  }) {
    return ComicCard(
      onTap: () => context.push(route),
      backgroundColor: isDark ? const Color(0xFF0F172A) : Colors.white,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: color.withValues(alpha: 0.1),
                border: Border.all(color: color, width: 2),
                borderRadius: BorderRadius.circular(16),
              ),
              child: Icon(icon, size: 32, color: color),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title, style: GoogleFonts.fredoka(fontSize: 20, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 4),
                  Text(subtitle, style: GoogleFonts.fredoka(color: Colors.grey.shade600)),
                ],
              ),
            ),
            const Icon(Icons.arrow_forward_ios, size: 16, color: Colors.grey),
          ],
        ),
      ),
    );
  }
}
