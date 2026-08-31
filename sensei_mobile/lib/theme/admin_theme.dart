import 'package:flutter/material.dart';

/// Admin dashboard theme colors that mirror the website's CSS variables.
/// Light mode maps to `:root` values, dark mode maps to `.dark` values
/// from `globals.css`.
class AdminThemeColors {
  final Color admBg;
  final Color admSurface;
  final Color admSurfaceRaised;
  final Color admText;
  final Color admTextSub;
  final Color admTextMuted;
  final Color admAccent;
  final Color admAccentLight;
  final Color admBorderSolid;
  final Color admShadow;
  final Color admInputBg;
  final Color admInputBorder;

  // Stat card colors (matching website's --stat-N-bg/accent)
  final Color stat1Bg;
  final Color stat1Accent;
  final Color stat2Bg;
  final Color stat2Accent;
  final Color stat3Bg;
  final Color stat3Accent;
  final Color stat4Bg;
  final Color stat4Accent;

  // Semantic colors
  final Color danger;
  final Color warning;
  final Color success;

  const AdminThemeColors({
    required this.admBg,
    required this.admSurface,
    required this.admSurfaceRaised,
    required this.admText,
    required this.admTextSub,
    required this.admTextMuted,
    required this.admAccent,
    required this.admAccentLight,
    required this.admBorderSolid,
    required this.admShadow,
    required this.admInputBg,
    required this.admInputBorder,
    required this.stat1Bg,
    required this.stat1Accent,
    required this.stat2Bg,
    required this.stat2Accent,
    required this.stat3Bg,
    required this.stat3Accent,
    required this.stat4Bg,
    required this.stat4Accent,
    required this.danger,
    required this.warning,
    required this.success,
  });
}

class AdminTheme {
  static const _light = AdminThemeColors(
    admBg: Color(0xFFF5F3FF),
    admSurface: Color(0xFFFFFFFF),
    admSurfaceRaised: Color(0xFFFFFFFF),
    admText: Color(0xFF1E293B),
    admTextSub: Color(0xFF475569),
    admTextMuted: Color(0xFF64748B),
    admAccent: Color(0xFF7C3AED),
    admAccentLight: Color(0x1A7C3AED),
    admBorderSolid: Color(0xFFE2E8F0),
    admShadow: Color(0x1A7C3AED),
    admInputBg: Color(0xFFF8FAFC),
    admInputBorder: Color(0xFFE2E8F0),
    // Stat cards
    stat1Bg: Color(0xD1EDE9FE),
    stat1Accent: Color(0xFF6D28D9),
    stat2Bg: Color(0xD1FEF9C3),
    stat2Accent: Color(0xFFD97706),
    stat3Bg: Color(0xD1FFE4E8),
    stat3Accent: Color(0xFFBE123C),
    stat4Bg: Color(0xD1D1FAE5),
    stat4Accent: Color(0xFF065F46),
    // Semantic
    danger: Color(0xFFEF4444),
    warning: Color(0xFFF59E0B),
    success: Color(0xFF22C55E),
  );

  static const _dark = AdminThemeColors(
    admBg: Color(0xFF0A0A0A),
    admSurface: Color(0xFF111111),
    admSurfaceRaised: Color(0xFF1A1A1A),
    admText: Color(0xFFF8FAFC),
    admTextSub: Color(0xFFA1A1AA),
    admTextMuted: Color(0xFF71717A),
    admAccent: Color(0xFFA855F7),
    admAccentLight: Color(0x33A855F7),
    admBorderSolid: Color(0xFFA855F7),
    admShadow: Color(0x99000000),
    admInputBg: Color(0xFF0B0B16),
    admInputBorder: Color(0xFF9333EA),
    // Stat cards
    stat1Bg: Color(0x1A8B5CF6),
    stat1Accent: Color(0xFFA78BFA),
    stat2Bg: Color(0x1AF59E0B),
    stat2Accent: Color(0xFFFBBF24),
    stat3Bg: Color(0x1AE11D48),
    stat3Accent: Color(0xFFFB7185),
    stat4Bg: Color(0x1A10B981),
    stat4Accent: Color(0xFF34D399),
    // Semantic
    danger: Color(0xFFF87171),
    warning: Color(0xFFFBBF24),
    success: Color(0xFF34D399),
  );

  /// Resolve admin theme colors from the current BuildContext brightness.
  static AdminThemeColors of(BuildContext context) {
    return Theme.of(context).brightness == Brightness.dark ? _dark : _light;
  }

  /// Check if context is in dark mode.
  static bool isDark(BuildContext context) {
    return Theme.of(context).brightness == Brightness.dark;
  }

  /// Accent gradient used for primary buttons and avatar.
  static List<Color> accentGradient(BuildContext context) {
    return isDark(context)
        ? [const Color(0xFFA855F7), const Color(0xFFC084FC)]
        : [const Color(0xFF7C3AED), const Color(0xFFA78BFA)];
  }

  /// Danger gradient for destructive actions.
  static List<Color> dangerGradient(BuildContext context) {
    return [const Color(0xFFEF4444), const Color(0xFFF97316)];
  }
}
