import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:go_router/go_router.dart';
import '../../theme/neubrutalist_widgets.dart';
import '../../theme/app_colors.dart';

class QuizScreen extends ConsumerWidget {
  const QuizScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: isDark ? const Color(0xFF050508) : const Color(0xFFFEF9C3),
      appBar: AppBar(
        title: Text('QUIZ ARENA 🎯', style: GoogleFonts.fredoka(fontWeight: FontWeight.bold)),
        backgroundColor: Colors.transparent,
        elevation: 0,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(
              'Test your knowledge with AI-generated adaptive quizzes',
              style: GoogleFonts.fredoka(fontSize: 16, color: Colors.grey),
            ),
            const SizedBox(height: 24),
            
            // Standard Quiz Card
            ComicCard(
              backgroundColor: isDark ? const Color(0xFF1E293B) : Colors.white,
              onTap: () {
                context.go('/student/quiz/standard');
              },
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Icon(Icons.psychology, size: 48, color: AppColors.senseiYellow),
                  const SizedBox(height: 16),
                  Text('Standard Quiz', style: GoogleFonts.fredoka(fontSize: 24, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 8),
                  Text(
                    'Classic MCQ format with adaptive difficulty. AI generates questions based on your weak areas.',
                    style: GoogleFonts.fredoka(color: Colors.grey),
                  ),
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(color: AppColors.senseiYellow.withValues(alpha: 0.2), borderRadius: BorderRadius.circular(12)),
                        child: Text('10 Questions', style: GoogleFonts.spaceMono(fontSize: 12, color: Colors.orange)),
                      ),
                      const SizedBox(width: 8),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(color: AppColors.senseiGreen.withValues(alpha: 0.2), borderRadius: BorderRadius.circular(12)),
                        child: Text('Adaptive', style: GoogleFonts.spaceMono(fontSize: 12, color: Colors.green)),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            
            const SizedBox(height: 16),

            // CAMO Quiz Card
            ComicCard(
              backgroundColor: const Color(0xFF1A1A2E), // Always dark for CAMO theme
              onTap: () {
                context.go('/student/quiz/camo');
              },
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Icon(Icons.back_hand, size: 48, color: AppColors.senseiPurple),
                  const SizedBox(height: 16),
                  Text('🤚 CAMO Quiz', style: GoogleFonts.fredoka(fontSize: 24, fontWeight: FontWeight.bold, color: Colors.purple.shade200)),
                  const SizedBox(height: 8),
                  Text(
                    'Answer with hand gestures using MediaPipe. 3D floating bubbles in Three.js arena.',
                    style: GoogleFonts.fredoka(color: Colors.grey.shade400),
                  ),
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(color: AppColors.senseiPurple.withValues(alpha: 0.2), borderRadius: BorderRadius.circular(12)),
                        child: Text('Gesture', style: GoogleFonts.spaceMono(fontSize: 12, color: Colors.purple.shade300)),
                      ),
                      const SizedBox(width: 8),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(color: AppColors.senseiBlue.withValues(alpha: 0.2), borderRadius: BorderRadius.circular(12)),
                        child: Text('3D Arena', style: GoogleFonts.spaceMono(fontSize: 12, color: Colors.blue.shade300)),
                      ),
                    ],
                  ),
                ],
              ),
            ),

            const SizedBox(height: 24),
            
            TextButton.icon(
              onPressed: () {
                ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('View History...')));
              },
              icon: const Icon(Icons.history, color: Colors.grey),
              label: Text('View Quiz History →', style: GoogleFonts.spaceMono(color: Colors.grey)),
            ),
          ],
        ),
      ),
    );
  }
}
