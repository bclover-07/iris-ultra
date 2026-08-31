import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:go_router/go_router.dart';
import '../../theme/app_colors.dart';
import '../../theme/neubrutalist_widgets.dart';

class QuizCamoScreen extends StatelessWidget {
  const QuizCamoScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF1A1A2E), // Dark Camo theme
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        scrolledUnderElevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.close, color: Colors.white),
          onPressed: () => context.pop(),
        ),
        title: Text(
          'CAMO Quiz Arena',
          style: GoogleFonts.spaceGrotesk(
            color: Colors.white,
            fontWeight: FontWeight.w900,
            fontSize: 20,
            letterSpacing: -1,
          ),
        ),
      ),
      body: SafeArea(
        child: Column(
          children: [
            // Camera Feed Placeholder
            Expanded(
              flex: 2,
              child: Container(
                margin: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: Colors.black,
                  borderRadius: BorderRadius.circular(24),
                  border: Border.all(color: AppColors.senseiPurple, width: 4),
                  boxShadow: [
                    BoxShadow(
                      color: AppColors.senseiPurple.withValues(alpha: 0.5),
                      blurRadius: 20,
                      spreadRadius: 5,
                    )
                  ],
                ),
                child: Stack(
                  alignment: Alignment.center,
                  children: [
                    // Mock camera feed background
                    Container(
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(20),
                        gradient: const LinearGradient(
                          colors: [Color(0xFF2D2D44), Color(0xFF1A1A2E)],
                          begin: Alignment.topCenter,
                          end: Alignment.bottomCenter,
                        ),
                      ),
                    ),
                    
                    // Question Overlay
                    Positioned(
                      top: 20,
                      left: 20,
                      right: 20,
                      child: Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: Colors.black.withValues(alpha: 0.7),
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: Colors.white24),
                        ),
                        child: Text(
                          'What is the capital of France?',
                          style: GoogleFonts.spaceGrotesk(
                            fontSize: 24,
                            fontWeight: FontWeight.bold,
                            color: Colors.white,
                          ),
                          textAlign: TextAlign.center,
                        ),
                      ),
                    ),

                    // Hand Tracking Indicator
                    Positioned(
                      bottom: 20,
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                        decoration: BoxDecoration(
                          color: AppColors.senseiGreen.withValues(alpha: 0.2),
                          borderRadius: BorderRadius.circular(20),
                          border: Border.all(color: AppColors.senseiGreen),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Icon(Icons.back_hand, color: AppColors.senseiGreen, size: 16),
                            const SizedBox(width: 8),
                            Text(
                              'Hand Tracking Active',
                              style: GoogleFonts.inter(color: AppColors.senseiGreen, fontWeight: FontWeight.bold, fontSize: 12),
                            ),
                          ],
                        ),
                      ),
                    ),

                    // Floating Option Bubbles (Mocked)
                    Positioned(
                      left: 40,
                      top: 150,
                      child: _buildBubble('A. Berlin', AppColors.senseiBlue),
                    ),
                    Positioned(
                      right: 40,
                      top: 100,
                      child: _buildBubble('B. Madrid', AppColors.senseiPink),
                    ),
                    Positioned(
                      left: 80,
                      bottom: 80,
                      child: _buildBubble('C. Paris', AppColors.senseiGreen),
                    ),
                    Positioned(
                      right: 80,
                      bottom: 120,
                      child: _buildBubble('D. Rome', AppColors.senseiYellow),
                    ),
                  ],
                ),
              ),
            ),
            
            // Instructions
            Padding(
              padding: const EdgeInsets.all(24),
              child: Column(
                children: [
                  Text(
                    'Use hand gestures to select answers!',
                    style: GoogleFonts.spaceGrotesk(fontSize: 18, color: Colors.white, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Pinch to pop the bubble of the correct answer.',
                    style: GoogleFonts.inter(color: Colors.grey.shade400),
                  ),
                  const SizedBox(height: 24),
                  BrutalistButton(
                    text: 'End Simulation',
                    backgroundColor: AppColors.senseiRed,
                    onTap: () => context.pop(),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildBubble(String text, Color color) {
    return Container(
      width: 100,
      height: 100,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: color.withValues(alpha: 0.2),
        border: Border.all(color: color, width: 3),
        boxShadow: [
          BoxShadow(
            color: color.withValues(alpha: 0.5),
            blurRadius: 10,
            spreadRadius: 2,
          )
        ],
      ),
      alignment: Alignment.center,
      child: Text(
        text,
        style: GoogleFonts.spaceGrotesk(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16),
        textAlign: TextAlign.center,
      ),
    );
  }
}
