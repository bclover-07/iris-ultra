import 'package:flutter/material.dart';

class AppColors {
  // Neubrutalist Core
  static const Color brutalBlack = Color(0xFF111111);
  static const Color brutalWhite = Color(0xFFFFFFFF);
  static const Color brutalBg = Color(0xFFFAFAFA); // Light gray background
  
  // Faculty Dashboard Palette (matching frontend)
  static const Color brutalistCyan = Color(0xFF22D3EE);
  static const Color brutalistBlue = Color(0xFF06B6D4);
  static const Color brutalistOrange = Color(0xFF7DD3FC);
  static const Color brutalistLime = Color(0xFFCFFAFE);
  static const Color brutalistYellow = Color(0xFFBAE6FD);
  static const Color brutalistPink = Color(0xFFE0F2FE);
  static const Color brutalistRed = Color(0xFF0891B2);

  // Student Comic Palette (mapping old names to the cyan palette for ease)
  static const Color comicYellow = Color(0xFFBAE6FD); // brutalist-yellow
  static const Color comicPink = Color(0xFFE0F2FE);   // brutalist-pink
  static const Color comicBlue = Color(0xFF06B6D4);   // brutalist-blue
  static const Color comicRed = Color(0xFF0891B2);    // brutalist-red
  static const Color comicCyan = Color(0xFF22D3EE);   // brutalist-cyan
  static const Color comicOrange = Color(0xFF7DD3FC); // brutalist-orange
  static const Color comicGreen = Color(0xFFCFFAFE);  // brutalist-lime

  // Legacy Theme Mapping
  static const Color senseiPurple = Color(0xFF06B6D4);
  static const Color senseiPink = Color(0xFFE0F2FE);
  static const Color senseiYellow = Color(0xFFBAE6FD);
  static const Color senseiBlue = Color(0xFF06B6D4);
  static const Color senseiGreen = Color(0xFFCFFAFE);
  static const Color senseiCoral = Color(0xFF0891B2);
  static const Color senseiRed = Color(0xFF0891B2);
  static const Color senseiCyan = Color(0xFF22D3EE);
  static const Color senseiOrange = Color(0xFF7DD3FC);
  static const Color senseiGold = Color(0xFFBAE6FD);
  static const Color senseiCard5 = Color(0xFF06B6D4);
  static const Color iconCyan = Color(0xFF0891B2);
  static const Color accentCyan = Color(0xFF06B6D4);
  static const Color textBlack = Color(0xFF111111);
  static const Color teacherAccent = Color(0xFF22D3EE);
  static const Color brutalBlue = Color(0xFF06B6D4);
  static const Color brutalCyan = Color(0xFF22D3EE);
  static const Color lightCyan = Color(0xFFCFFAFE);
  static const Color gold = Color(0xFFBAE6FD);
  
  // Student specific missing colors
  static const Color pageYellow = Color(0xFFFEF9C3);
  static const Color comicPurple = Color(0xFFA78BFA);
  static const Color statBlue = Color(0xFFDBEAFE);
  static const Color statGreen = Color(0xFFDCFCE7);
  static const Color statYellow = Color(0xFFFEF08A);
  static const Color statPurple = Color(0xFFF3E8FF);
  static const Color statAmber = Color(0xFFFEF3C7);
  static const Color statRed = Color(0xFFFEE2E2);

  // Accent Colors
  static const Color accentPurple = Color(0xFF7B4FE9);
  static const Color accentPurpleDark = Color(0xFF5B35C4);
  static const Color accentTeal = Color(0xFF0097A7);
  static const Color accentGreenDark = Color(0xFF388E3C);

  // Risk Colors
  static const Color riskLow = Color(0xFF4CAF50);
  static const Color riskMedium = Color(0xFFFFC107);
  static const Color riskHigh = Color(0xFFFF9800);
  static const Color riskCritical = Color(0xFFF44336);

  // Login/Landing Theme
  static const Color navy = Color(0xFF1A1A2E);
  static const Color cream = Color(0xFFF5EFE8);
  static const Color noteLavender = Color(0xFFC9A0FF);
  static const Color noteYellow = Color(0xFFFFE93A);
  static const Color noteGreen = Color(0xFF81D4A8);
  static const Color notePink = Color(0xFFF48FB1);
  static const Color noteBlue = Color(0xFF81D4FA);



  // Admin Theme
  static const Color adminBg = Color(0xFFF5F3FF);
  static const Color adminAccent = Color(0xFF7C3AED);
  static const Color adminSurface = Color(0xFFFFFFFF);

  // Chart Colors
  static const List<Color> chartPalette = [
    Color(0xFF3B82F6),
    Color(0xFFEF4444),
    Color(0xFFEAB308),
    Color(0xFFA855F7),
    Color(0xFFF97316),
  ];

  // Dark Mode
  static const Color darkBg = Color(0xFF050508);
  static const Color darkCard = Color(0xFF111111);
  static const Color darkBorder = Color(0xFFFFFFFF);
  static const Color darkShadowHover = Color(0xFFFFD700);

  static Color riskColor(String level) {
    switch (level.toLowerCase()) {
      case 'low':
        return riskLow;
      case 'medium':
        return riskMedium;
      case 'high':
        return riskHigh;
      case 'critical':
        return riskCritical;
      default:
        return riskLow;
    }
  }

  static String riskEmoji(String level) {
    switch (level.toLowerCase()) {
      case 'low':
        return '🟢';
      case 'medium':
        return '🟡';
      case 'high':
        return '🟠';
      case 'critical':
        return '🔴';
      default:
        return '🟢';
    }
  }
}
