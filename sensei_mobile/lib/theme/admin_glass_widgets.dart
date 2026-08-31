import 'package:flutter/material.dart';
import 'dart:ui';
import 'package:google_fonts/google_fonts.dart';
import 'admin_theme.dart';

class GlassCard extends StatelessWidget {
  final Widget child;
  final double blur;
  final EdgeInsetsGeometry padding;
  final BorderRadiusGeometry? borderRadius;

  const GlassCard({
    super.key,
    required this.child,
    this.blur = 10,
    this.padding = const EdgeInsets.all(16),
    this.borderRadius,
  });

  @override
  Widget build(BuildContext context) {
    final t = AdminTheme.of(context);
    final radius = borderRadius ?? BorderRadius.circular(16);

    return ClipRRect(
      borderRadius: radius,
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: blur, sigmaY: blur),
        child: Container(
          padding: padding,
          decoration: BoxDecoration(
            color: t.admSurface,
            borderRadius: radius,
            border: Border.all(color: t.admBorderSolid, width: 1),
          ),
          child: child,
        ),
      ),
    );
  }
}

class AdminButton extends StatelessWidget {
  final VoidCallback? onTap;
  final Widget? child;
  final String? text;
  final IconData? icon;
  final List<Color>? gradient;
  final bool isLoading;

  const AdminButton({
    super.key,
    this.onTap,
    this.child,
    this.text,
    this.icon,
    this.gradient,
    this.isLoading = false,
  });

  @override
  Widget build(BuildContext context) {
    final colors = gradient ?? AdminTheme.accentGradient(context);

    return GestureDetector(
      onTap: isLoading ? null : onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: colors,
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          borderRadius: BorderRadius.circular(12),
          boxShadow: [
            BoxShadow(
              color: colors.first.withValues(alpha: 0.3),
              blurRadius: 12,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Center(
          child: isLoading
              ? const SizedBox(
                  width: 20,
                  height: 20,
                  child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                )
              : DefaultTextStyle(
                  style: GoogleFonts.spaceGrotesk(
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                  ),
                  child: child ?? Row(
                    mainAxisSize: MainAxisSize.min,
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      if (icon != null) ...[
                        Icon(icon, color: Colors.white, size: 20),
                        const SizedBox(width: 8),
                      ],
                      if (text != null) Text(text!),
                    ],
                  ),
                ),
        ),
      ),
    );
  }
}

/// Legacy constants — kept for backward compat but prefer AdminTheme.of(context).
class AdminGlassColors {
  static const Color bgDark = Color(0xFF0F172A);
  static const Color glassBg = Color(0x1AFFFFFF);
  static const Color glassBorder = Color(0x33FFFFFF);
  static const Color textPrimary = Color(0xFFF8FAFC);
  static const Color textMuted = Color(0xFF94A3B8);
  static const Color accentPrimary = Color(0xFF3B82F6);
  static const Color accentSecondary = Color(0xFF8B5CF6);
  static const Color danger = Color(0xFFEF4444);
  static const Color warning = Color(0xFFF59E0B);
  static const Color success = Color(0xFF10B981);
}

class AdminGlassContainer extends StatelessWidget {
  final Widget child;
  final EdgeInsetsGeometry? padding;
  final EdgeInsetsGeometry? margin;
  final double? width;
  final double? height;

  const AdminGlassContainer({
    super.key,
    required this.child,
    this.padding,
    this.margin,
    this.width,
    this.height,
  });

  @override
  Widget build(BuildContext context) {
    final t = AdminTheme.of(context);

    return Container(
      width: width,
      height: height,
      margin: margin,
      padding: padding,
      decoration: BoxDecoration(
        color: t.admSurface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: t.admBorderSolid),
        boxShadow: [
          BoxShadow(
            color: t.admShadow,
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: child,
    );
  }
}

/// A styled back button matching the website's adm-back-btn class.
class AdminBackButton extends StatelessWidget {
  final VoidCallback? onTap;

  const AdminBackButton({super.key, this.onTap});

  @override
  Widget build(BuildContext context) {
    final t = AdminTheme.of(context);

    return GestureDetector(
      onTap: onTap ?? () => Navigator.of(context).pop(),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
        decoration: BoxDecoration(
          color: t.admAccentLight,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: t.admAccent.withValues(alpha: 0.15)),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.arrow_back_ios_new, size: 14, color: t.admAccent),
            const SizedBox(width: 6),
            Text(
              'Back',
              style: GoogleFonts.inter(
                fontSize: 13,
                fontWeight: FontWeight.w600,
                color: t.admAccent,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// Section title styled like the website's adm-section-title.
class AdminSectionTitle extends StatelessWidget {
  final String title;
  final String? subtitle;
  final IconData? icon;
  final Color? iconColor;

  const AdminSectionTitle({
    super.key,
    required this.title,
    this.subtitle,
    this.icon,
    this.iconColor,
  });

  @override
  Widget build(BuildContext context) {
    final t = AdminTheme.of(context);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            if (icon != null) ...[
              Icon(icon, size: 24, color: iconColor ?? t.admAccent),
              const SizedBox(width: 8),
            ],
            Expanded(
              child: Text(
                title,
                style: GoogleFonts.spaceGrotesk(
                  fontSize: 26,
                  fontWeight: FontWeight.w900,
                  color: t.admText,
                  letterSpacing: -0.5,
                ),
              ),
            ),
          ],
        ),
        if (subtitle != null) ...[
          const SizedBox(height: 4),
          Text(
            subtitle!,
            style: GoogleFonts.inter(
              fontSize: 13,
              color: t.admTextMuted,
            ),
          ),
        ],
      ],
    );
  }
}
