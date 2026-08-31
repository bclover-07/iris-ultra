import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../theme/app_colors.dart';
import '../../theme/neubrutalist_widgets.dart';

class UltraStudyScreen extends StatelessWidget {
  const UltraStudyScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    
    final features = [
      {
        'title': 'AI Quiz',
        'desc': 'Generate custom quizzes to test your knowledge',
        'icon': Icons.quiz_rounded,
        'color': AppColors.comicBlue,
        'route': '/student/quiz',
      },
      {
        'title': 'Study Plan',
        'desc': 'AI-generated adaptive study schedules',
        'icon': Icons.calendar_month_rounded,
        'color': AppColors.comicPurple,
        'route': '/student/study-plan',
      },
      {
        'title': 'Doubt Solver',
        'desc': 'Upload images or type questions for instant AI solutions',
        'icon': Icons.help_center_rounded,
        'color': AppColors.comicRed,
        'route': '/student/doubt-solver',
      },
      {
        'title': 'Smart Notes',
        'desc': 'AI summarized notes from lectures and materials',
        'icon': Icons.notes_rounded,
        'color': AppColors.comicYellow,
        'route': '/student/notes',
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
              'ULTRA STUDY 🧠',
              style: GoogleFonts.fredoka(
                fontSize: 32,
                fontWeight: FontWeight.bold,
                color: isDark ? Colors.white : AppColors.brutalBlack,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Your AI-powered academic arsenal.',
              style: GoogleFonts.inter(
                fontSize: 16,
                color: isDark ? Colors.white70 : Colors.grey.shade700,
              ),
            ),
            const SizedBox(height: 32),
            GridView.builder(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 2,
                crossAxisSpacing: 16,
                mainAxisSpacing: 16,
                childAspectRatio: 0.85,
              ),
              itemCount: features.length,
              itemBuilder: (context, index) {
                final feature = features[index];
                final color = feature['color'] as Color;
                
                return ComicCard(
                  backgroundColor: isDark ? AppColors.darkCard : Colors.white,
                  onTap: () => context.go(feature['route'] as String),
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: color.withValues(alpha: 0.2),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: AppColors.brutalBlack, width: 2),
                        ),
                        child: Icon(feature['icon'] as IconData, color: color, size: 32),
                      ),
                      const Spacer(),
                      Text(
                        feature['title'] as String,
                        style: GoogleFonts.fredoka(
                          fontSize: 20,
                          fontWeight: FontWeight.bold,
                          color: isDark ? Colors.white : AppColors.brutalBlack,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        feature['desc'] as String,
                        style: GoogleFonts.inter(
                          fontSize: 12,
                          color: isDark ? Colors.white60 : Colors.grey.shade600,
                        ),
                        maxLines: 3,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                  ),
                );
              },
            ),
          ],
        ),
      ),
    );
  }
}
