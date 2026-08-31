import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../theme/app_colors.dart';
import '../../theme/neubrutalist_widgets.dart';

class VirtualBeyondScreen extends StatelessWidget {
  const VirtualBeyondScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    
    final features = [
      {
        'title': 'Virtual World 🌍',
        'desc': 'Walk around, meet friends, and study together in 3D',
        'icon': Icons.public_rounded,
        'color': AppColors.comicGreen,
        'route': '/student/world',
      },
      {
        'title': 'AI Interview',
        'desc': 'Practice interviews with AI avatars in real-time',
        'icon': Icons.work_outline_rounded,
        'color': AppColors.comicPurple,
        'route': '/student/interview',
      },
      {
        'title': 'Debate Arena',
        'desc': 'Engage in logical debates with LangGraph agents',
        'icon': Icons.mic_rounded,
        'color': AppColors.comicRed,
        'route': '/student/debate',
      },
    ];

    return Scaffold(
      backgroundColor: isDark ? AppColors.darkBg : AppColors.pageYellow,
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'VIRTUAL BEYOND 🚀',
              style: GoogleFonts.fredoka(
                fontSize: 32,
                fontWeight: FontWeight.bold,
                color: isDark ? Colors.white : AppColors.brutalBlack,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Immersive simulations to build real-world skills.',
              style: GoogleFonts.inter(
                fontSize: 16,
                color: isDark ? Colors.white70 : Colors.grey.shade700,
              ),
            ),
            const SizedBox(height: 32),
            ...features.map((feature) {
              final color = feature['color'] as Color;
              return Padding(
                padding: const EdgeInsets.only(bottom: 16),
                child: ComicCard(
                  backgroundColor: isDark ? AppColors.darkCard : Colors.white,
                  onTap: () => context.go(feature['route'] as String),
                  padding: const EdgeInsets.all(24),
                  child: Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: color.withValues(alpha: 0.2),
                          shape: BoxShape.circle,
                          border: Border.all(color: AppColors.brutalBlack, width: 2),
                        ),
                        child: Icon(feature['icon'] as IconData, color: color, size: 36),
                      ),
                      const SizedBox(width: 20),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              feature['title'] as String,
                              style: GoogleFonts.fredoka(
                                fontSize: 22,
                                fontWeight: FontWeight.bold,
                                color: isDark ? Colors.white : AppColors.brutalBlack,
                              ),
                            ),
                            const SizedBox(height: 6),
                            Text(
                              feature['desc'] as String,
                              style: GoogleFonts.inter(
                                fontSize: 14,
                                color: isDark ? Colors.white60 : Colors.grey.shade600,
                              ),
                            ),
                          ],
                        ),
                      ),
                      Icon(Icons.chevron_right, size: 32, color: isDark ? Colors.white54 : Colors.grey),
                    ],
                  ),
                ),
              );
            }),
          ],
        ),
      ),
    );
  }
}
