import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../theme/app_colors.dart';
import '../../theme/neubrutalist_widgets.dart';

class LandingScreen extends ConsumerWidget {
  const LandingScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      backgroundColor: AppColors.creamBg,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Top Bar
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: AppColors.popYellow,
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(color: AppColors.brutalBlack, width: 2),
                          boxShadow: const [
                            BoxShadow(color: AppColors.brutalBlack, offset: Offset(2, 2), blurRadius: 0),
                          ],
                        ),
                        child: const Icon(Icons.bolt_rounded, color: AppColors.brutalBlack, size: 22),
                      ),
                      const SizedBox(width: 10),
                      Text(
                        'SENSEI ULTRA',
                        style: GoogleFonts.fredoka(
                          fontSize: 20,
                          fontWeight: FontWeight.bold,
                          color: AppColors.brutalBlack,
                          letterSpacing: 1,
                        ),
                      ),
                    ],
                  ),
                  NeuBadge(
                    label: 'iQOO 2026',
                    backgroundColor: AppColors.popPink,
                  ),
                ],
              ),
              const SizedBox(height: 28),

              // Hero Card
              NeuCard(
                backgroundColor: Colors.white,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        NeuBadge(
                          label: 'STUDENT ON-DEVICE AI',
                          backgroundColor: AppColors.popGreen,
                        ),
                        const SizedBox(width: 8),
                        NeuBadge(
                          label: '⚡ 75+ TOK/S NPU',
                          backgroundColor: AppColors.popYellow,
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    Text(
                      'Your Verified AI Academic Copilot.',
                      style: GoogleFonts.fredoka(
                        fontSize: 28,
                        fontWeight: FontWeight.bold,
                        color: AppColors.brutalBlack,
                        height: 1.15,
                      ),
                    ),
                    const SizedBox(height: 12),
                    Text(
                      'Zero typed academic data. 100% app-observed signals from camera pose, mic sentiment, hand gestures, and on-device Hexagon NPU intelligence.',
                      style: GoogleFonts.inter(
                        fontSize: 13,
                        color: Colors.black87,
                        height: 1.4,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                    const SizedBox(height: 20),
                    NeuButton(
                      text: 'GET STARTED / LOGIN ⚡',
                      backgroundColor: AppColors.popYellow,
                      onPressed: () => context.go('/login'),
                    ),
                    const SizedBox(height: 10),
                    NeuButton(
                      text: 'CREATE NEW ACCOUNT 🚀',
                      backgroundColor: AppColors.popPink,
                      textColor: Colors.white,
                      onPressed: () => context.go('/register'),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 20),

              // 5 Verified Signals Grid
              Text(
                'FIVE HARDWARE-VERIFIED SIGNALS',
                style: GoogleFonts.fredoka(
                  fontSize: 14,
                  fontWeight: FontWeight.bold,
                  color: AppColors.brutalBlack,
                  letterSpacing: 1,
                ),
              ),
              const SizedBox(height: 12),
              _buildFeatureTile(
                'Presence Consistency',
                'Camera pose tracking & ambient stability.',
                Icons.visibility_rounded,
                AppColors.popBlue,
              ),
              const SizedBox(height: 10),
              _buildFeatureTile(
                'Camo Quizo Gesture Mastery',
                'Hand gesture answers: Fist, Index, Peace, Palm.',
                Icons.front_hand_rounded,
                AppColors.popYellow,
              ),
              const SizedBox(height: 10),
              _buildFeatureTile(
                'On-Device NPU Doubt Solver',
                'DocLayout-YOLO formula digitizer with Gemma 3n.',
                Icons.crop_free_rounded,
                AppColors.popCoral,
              ),
              const SizedBox(height: 10),
              _buildFeatureTile(
                'Multiplayer 3D Study Campus',
                'Interactive Three.js 3D avatars & peer quiz arenas.',
                Icons.public_rounded,
                AppColors.popGreen,
              ),
              const SizedBox(height: 10),
              _buildFeatureTile(
                'AI Practice & Debate Arena',
                'Adaptive 10-turn mock interviews & timed rebuttals.',
                Icons.gavel_rounded,
                AppColors.popViolet,
              ),
              const SizedBox(height: 24),

              // Bottom Attribution
              Center(
                child: Text(
                  'SENSEI ULTRA • Pune City Battle 2026',
                  style: GoogleFonts.inter(
                    fontSize: 11,
                    fontWeight: FontWeight.bold,
                    color: Colors.black45,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildFeatureTile(String title, String subtitle, IconData icon, Color color) {
    return NeuCard(
      backgroundColor: Colors.white,
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.25),
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
                  style: GoogleFonts.fredoka(
                    fontSize: 14,
                    fontWeight: FontWeight.bold,
                    color: AppColors.brutalBlack,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  subtitle,
                  style: GoogleFonts.inter(fontSize: 11, color: Colors.black54),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
