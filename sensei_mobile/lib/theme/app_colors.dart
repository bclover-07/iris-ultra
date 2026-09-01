import 'package:flutter/material.dart';

class AppColors {
  // Neu-Brutalist Core Colors
  static const Color creamBg = Color(0xFFFFF8E7);       // Main app background (warm cream yellow)
  static const Color creamCard = Color(0xFFFFFDF5);     // Card background (clean cream white)
  static const Color brutalBlack = Color(0xFF1E1E1E);   // Heavy charcoal border & primary text
  static const Color brutalWhite = Color(0xFFFFFFFF);
  
  // Vibrant Neu-Brutalist Pop Palette
  static const Color popCoral = Color(0xFFFF6B6B);      // Primary action / Hot Coral
  static const Color popViolet = Color(0xFF7C5CFC);     // Secondary / Electric Violet
  static const Color popYellow = Color(0xFFFFD93D);     // Accent / Sunshine Yellow
  static const Color popGreen = Color(0xFF6BCB77);      // Success / Mint Green
  static const Color popBlue = Color(0xFF4D96FF);       // Tech / Sky Blue
  static const Color popPink = Color(0xFFFF8FAB);       // Playful / Bubblegum Pink
  static const Color popOrange = Color(0xFFFFA62B);     // Warning / Tangerine

  // Hexagon NPU & Hardware Accents
  static const Color npuTeal = Color(0xFF00F0FF);       // Hexagon NPU Active Cyan
  static const Color gpuPurple = Color(0xFFA855F7);     // GPU Delegate Purple
  static const Color cpuOrange = Color(0xFFF97316);     // CPU Fallback Amber
  static const Color verifiedGreen = Color(0xFF10B981); // Camera-Verified Signal

  // Five Verified Signal Palette
  static const Color signalPresence = Color(0xFF6BCB77);  // Verified Study Presence (Mint Green)
  static const Color signalMastery = Color(0xFFFF6B6B);   // Quiz Mastery (Hot Coral)
  static const Color signalProgress = Color(0xFF4D96FF);  // Study Plan Progress (Sky Blue)
  static const Color signalWellness = Color(0xFF7C5CFC);  // Wellness Score (Electric Violet)
  static const Color signalEngagement = Color(0xFFFFA62B);// Engagement (Tangerine)

  // Risk Model Tier Colors
  static const Color riskLow = Color(0xFF6BCB77);       // Low Risk (Green)
  static const Color riskMedium = Color(0xFFFFD93D);    // Medium Risk (Yellow)
  static const Color riskHigh = Color(0xFFFFA62B);      // High Risk (Orange)
  static const Color riskCritical = Color(0xFFFF6B6B);  // Critical Risk (Coral Red)

  // Dark Mode Overrides
  static const Color darkBg = Color(0xFF121216);
  static const Color darkCard = Color(0xFF1E1E24);
  static const Color darkBorder = Color(0xFFFFFFFF);

  // Legacy Compatibility Aliases (maps legacy theme tokens to Neu-Brutalist palette)
  static const Color brutalBg = creamBg;
  static const Color pageYellow = creamBg;
  static const Color gold = popYellow;
  static const Color senseiYellow = popYellow;
  static const Color senseiGreen = popGreen;
  static const Color senseiBlue = popBlue;
  static const Color senseiPurple = popViolet;
  static const Color senseiCoral = popCoral;
  static const Color senseiPink = popPink;
  static const Color senseiRed = popCoral;
  static const Color comicRed = popCoral;
  static const Color comicGreen = popGreen;
  static const Color comicBlue = popBlue;
  static const Color comicYellow = popYellow;
  static const Color comicOrange = popOrange;
  static const Color comicPurple = popViolet;

  static Color getRiskColor(String tier) {
    switch (tier.toLowerCase()) {
      case 'low': return riskLow;
      case 'medium': return riskMedium;
      case 'high': return riskHigh;
      case 'critical': return riskCritical;
      default: return riskLow;
    }
  }
}
