import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../theme/app_colors.dart';
import '../../theme/neubrutalist_widgets.dart';

class WorldScreen extends StatelessWidget {
  const WorldScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: isDark ? AppColors.darkBg : AppColors.pageYellow,
      appBar: AppBar(
        title: Text(
          'VIRTUAL WORLD 🌍',
          style: GoogleFonts.fredoka(
            fontWeight: FontWeight.bold,
            color: isDark ? Colors.white : AppColors.brutalBlack,
          ),
        ),
        backgroundColor: Colors.transparent,
        leading: IconButton(
          icon: Icon(Icons.arrow_back, color: isDark ? Colors.white : AppColors.brutalBlack),
          onPressed: () => context.go('/student/virtual-beyond'),
        ),
        elevation: 0,
      ),
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  color: AppColors.comicGreen,
                  shape: BoxShape.circle,
                  border: Border.all(color: AppColors.brutalBlack, width: 4),
                  boxShadow: const [
                    BoxShadow(
                      color: AppColors.brutalBlack,
                      offset: Offset(4, 4),
                      blurRadius: 0,
                    ),
                  ],
                ),
                child: const Icon(Icons.public, size: 80, color: AppColors.brutalBlack),
              ),
              const SizedBox(height: 32),
              BrutalistCard(
                backgroundColor: isDark ? AppColors.darkCard : Colors.white,
                padding: const EdgeInsets.all(24),
                child: Column(
                  children: [
                    Text(
                      'COMING SOON! 🚀',
                      style: GoogleFonts.fredoka(
                        fontSize: 28,
                        fontWeight: FontWeight.bold,
                        color: isDark ? Colors.white : AppColors.brutalBlack,
                      ),
                    ),
                    const SizedBox(height: 16),
                    Text(
                      'We are busy building the ultimate 3D virtual campus experience for your mobile device.',
                      textAlign: TextAlign.center,
                      style: GoogleFonts.inter(
                        fontSize: 16,
                        color: isDark ? Colors.white70 : Colors.grey.shade800,
                      ),
                    ),
                    const SizedBox(height: 24),
                    ComicCard(
                      backgroundColor: AppColors.senseiYellow,
                      onTap: () => context.go('/student/virtual-beyond'),
                      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                      child: Text(
                        'GO BACK',
                        style: GoogleFonts.fredoka(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                          color: AppColors.brutalBlack,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
