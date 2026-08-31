import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class MarketingColors {
  static const purple = Color(0xFF7B4FE9);
  static const purpleDark = Color(0xFF5B35C4);
  static const navy = Color(0xFF1A1A2E);
  static const cream = Color(0xFFF5EFE8);
  static const bgPage = Color(0xFFFAFAFA);
  
  static const noteYellow = Color(0xFFFFE93A);
  static const notePink = Color(0xFFF48FB1);
  static const noteGreen = Color(0xFF81D4A8);
  static const noteLavender = Color(0xFFC9A0FF);
  static const noteBlue = Color(0xFF81D4FA);
}

class StickyNote extends StatelessWidget {
  final Color color;
  final double rotateDegrees;
  final Widget child;
  final double? width;
  final double? height;

  const StickyNote({
    super.key,
    required this.color,
    this.rotateDegrees = 0,
    required this.child,
    this.width,
    this.height,
  });

  @override
  Widget build(BuildContext context) {
    return Transform.rotate(
      angle: rotateDegrees * 3.14159 / 180,
      child: Container(
        width: width,
        height: height,
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: color,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: Colors.black.withValues(alpha: 0.1), width: 1.5),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.15),
              offset: const Offset(4, 5),
              blurRadius: 0,
            ),
          ],
        ),
        child: Stack(
          clipBehavior: Clip.none,
          children: [
            // Tape strip
            Positioned(
              top: -26,
              left: 0,
              right: 0,
              child: Center(
                child: Container(
                  width: 48,
                  height: 14,
                  decoration: BoxDecoration(
                    color: const Color(0xFFD2BE8C).withValues(alpha: 0.6),
                    borderRadius: BorderRadius.circular(3),
                    border: Border.all(color: Colors.black.withValues(alpha: 0.06)),
                  ),
                ),
              ),
            ),
            child,
          ],
        ),
      ),
    );
  }
}

class PolkaDotBackground extends StatelessWidget {
  final Widget child;

  const PolkaDotBackground({super.key, required this.child});

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        // Base color
        Positioned.fill(
          child: Container(color: MarketingColors.bgPage)
        ),
        
        // Ambient Blobs
        Positioned(
          top: -100,
          left: -100,
          child: Container(
            width: 300,
            height: 300,
            decoration: BoxDecoration(
              color: const Color(0xFFD4B8FF).withValues(alpha: 0.4),
              shape: BoxShape.circle,
            ),
            child: BackdropFilter(
              filter: ColorFilter.mode(Colors.white.withValues(alpha: 0.1), BlendMode.dstOut),
              child: Container(
                decoration: BoxDecoration(
                  boxShadow: [
                    BoxShadow(color: const Color(0xFFD4B8FF).withValues(alpha: 0.4), blurRadius: 100)
                  ]
                ),
              ),
            ),
          ),
        ),
        Positioned(
          bottom: -50,
          right: -50,
          child: Container(
            width: 250,
            height: 250,
            decoration: BoxDecoration(
              color: const Color(0xFFB5EAD7).withValues(alpha: 0.4),
              shape: BoxShape.circle,
              boxShadow: [
                BoxShadow(color: const Color(0xFFB5EAD7).withValues(alpha: 0.4), blurRadius: 80)
              ]
            ),
          ),
        ),

        // Polka Dots overlay via CustomPaint (simplified)
        Positioned.fill(
          child: CustomPaint(
            painter: _PolkaDotPainter(),
          ),
        ),

        // Content
        child,
      ],
    );
  }
}

class _PolkaDotPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = MarketingColors.purple.withValues(alpha: 0.07)
      ..style = PaintingStyle.fill;

    const double spacing = 24.0;
    const double radius = 1.0;

    for (double x = 0; x < size.width; x += spacing) {
      for (double y = 0; y < size.height; y += spacing) {
        canvas.drawCircle(Offset(x, y), radius, paint);
      }
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

class MarketingButton extends StatefulWidget {
  final String label;
  final VoidCallback onTap;
  final IconData? icon;

  const MarketingButton({super.key, required this.label, required this.onTap, this.icon});

  @override
  State<MarketingButton> createState() => _MarketingButtonState();
}

class _MarketingButtonState extends State<MarketingButton> {
  bool _isHovered = false;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: widget.onTap,
      onTapDown: (_) => setState(() => _isHovered = true),
      onTapUp: (_) => setState(() => _isHovered = false),
      onTapCancel: () => setState(() => _isHovered = false),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        transform: Matrix4.translationValues(0, _isHovered ? -3 : 0, 0),
        padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 14),
        decoration: BoxDecoration(
          gradient: const LinearGradient(
            colors: [MarketingColors.purple, MarketingColors.purpleDark],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          borderRadius: BorderRadius.circular(12),
          boxShadow: [
            BoxShadow(
              color: MarketingColors.purple.withValues(alpha: _isHovered ? 0.52 : 0.38),
              offset: const Offset(0, 6),
              blurRadius: _isHovered ? 34 : 22,
            )
          ]
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Flexible(
              child: Text(
                widget.label,
                overflow: TextOverflow.ellipsis,
                style: GoogleFonts.raleway(
                  color: Colors.white,
                  fontWeight: FontWeight.bold,
                  fontSize: 16,
                ),
              ),
            ),
            if (widget.icon != null) ...[
              const SizedBox(width: 8),
              Icon(widget.icon, color: Colors.white, size: 18),
            ]
          ],
        ),
      ),
    );
  }
}
