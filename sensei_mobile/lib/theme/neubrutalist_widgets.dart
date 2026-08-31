import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'app_colors.dart';

class BrutalistCard extends StatelessWidget {
  final Widget child;
  final Color? backgroundColor;
  final Color borderColor;
  final double borderWidth;
  final double shadowOffset;
  final EdgeInsetsGeometry padding;
  final BorderRadius? borderRadius;
  final VoidCallback? onTap;

  const BrutalistCard({
    super.key,
    required this.child,
    this.backgroundColor,
    this.borderColor = AppColors.brutalBlack,
    this.borderWidth = 4,
    this.shadowOffset = 8,
    this.padding = const EdgeInsets.all(16),
    this.borderRadius,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final effectiveBorder = isDark ? Colors.white : borderColor;
    final effectiveBg = backgroundColor ?? (isDark ? AppColors.darkCard : Colors.white);

    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: padding,
        decoration: BoxDecoration(
          color: effectiveBg,
          borderRadius: borderRadius ?? BorderRadius.zero,
          border: Border.all(color: effectiveBorder, width: borderWidth),
          boxShadow: [
            BoxShadow(
              color: effectiveBorder,
              offset: Offset(shadowOffset, shadowOffset),
              blurRadius: 0,
            ),
          ],
        ),
        child: child,
      ),
    );
  }
}

class ComicCard extends StatefulWidget {
  final Widget child;
  final Color? backgroundColor;
  final EdgeInsetsGeometry padding;
  final VoidCallback? onTap;

  const ComicCard({
    super.key,
    required this.child,
    this.backgroundColor,
    this.padding = const EdgeInsets.all(16),
    this.onTap,
  });

  @override
  State<ComicCard> createState() => _ComicCardState();
}

class _ComicCardState extends State<ComicCard> {
  bool _isPressed = false;

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final borderColor = isDark ? Colors.white : AppColors.brutalBlack;
    final bg = widget.backgroundColor ?? (isDark ? AppColors.darkCard : Colors.white);

    return GestureDetector(
      onTapDown: (_) => setState(() => _isPressed = true),
      onTapUp: (_) {
        setState(() => _isPressed = false);
        widget.onTap?.call();
      },
      onTapCancel: () => setState(() => _isPressed = false),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 150),
        curve: Curves.easeOut,
        padding: widget.padding,
        transform: _isPressed
            ? Matrix4.translationValues(2, 2, 0)
            : Matrix4.translationValues(0, 0, 0),
        decoration: BoxDecoration(
          color: bg,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: borderColor, width: 4),
          boxShadow: [
            BoxShadow(
              color: borderColor,
              offset: _isPressed ? const Offset(1, 1) : const Offset(6, 6),
              blurRadius: 0,
            ),
          ],
        ),
        child: widget.child,
      ),
    );
  }
}

class StickyNote extends StatelessWidget {
  final Widget child;
  final Color color;
  final double rotation;
  final EdgeInsetsGeometry padding;

  const StickyNote({
    super.key,
    required this.child,
    this.color = const Color(0xFFFFE93A),
    this.rotation = -1.5,
    this.padding = const EdgeInsets.all(16),
  });

  @override
  Widget build(BuildContext context) {
    return Transform.rotate(
      angle: rotation * 3.14159 / 180,
      child: Stack(
        clipBehavior: Clip.none,
        children: [
          Container(
            padding: padding,
            decoration: BoxDecoration(
              color: color,
              borderRadius: BorderRadius.circular(4),
              border: Border.all(color: Colors.black.withValues(alpha: 0.08), width: 1.5),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.12),
                  offset: const Offset(4, 5),
                  blurRadius: 0,
                ),
              ],
            ),
            child: child,
          ),
          Positioned(
            top: -10,
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
        ],
      ),
    );
  }
}

class PowBurst extends StatelessWidget {
  final String text;
  final Color backgroundColor;
  final Color textColor;
  final double rotation;

  const PowBurst({
    super.key,
    required this.text,
    this.backgroundColor = AppColors.gold,
    this.textColor = Colors.black,
    this.rotation = -3,
  });

  @override
  Widget build(BuildContext context) {
    return Transform.rotate(
      angle: rotation * 3.14159 / 180,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
        decoration: BoxDecoration(
          color: backgroundColor,
          border: Border.all(color: Colors.black, width: 4),
          boxShadow: const [
            BoxShadow(color: Colors.black, offset: Offset(6, 6), blurRadius: 0),
          ],
        ),
        child: Text(
          text,
          style: TextStyle(
            fontWeight: FontWeight.w900,
            fontSize: 18,
            color: textColor,
            letterSpacing: 2,
          ),
        ),
      ),
    );
  }
}

class ComicButton extends StatefulWidget {
  final String label;
  final VoidCallback? onPressed;
  final Color? backgroundColor;
  final Color? textColor;
  final IconData? icon;
  final bool isLoading;

  const ComicButton({
    super.key,
    required this.label,
    this.onPressed,
    this.backgroundColor,
    this.textColor,
    this.icon,
    this.isLoading = false,
  });

  @override
  State<ComicButton> createState() => _ComicButtonState();
}

class _ComicButtonState extends State<ComicButton> {
  bool _isPressed = false;

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final borderColor = isDark ? Colors.white : AppColors.brutalBlack;
    final bg = widget.backgroundColor ?? AppColors.gold;
    final fg = widget.textColor ?? AppColors.brutalBlack;

    return GestureDetector(
      onTapDown: (_) => setState(() => _isPressed = true),
      onTapUp: (_) {
        setState(() => _isPressed = false);
        widget.onPressed?.call();
      },
      onTapCancel: () => setState(() => _isPressed = false),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 100),
        transform: _isPressed
            ? Matrix4.translationValues(2, 2, 0)
            : Matrix4.translationValues(0, 0, 0),
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
        decoration: BoxDecoration(
          color: widget.isLoading ? bg.withValues(alpha: 0.5) : bg,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: borderColor, width: 3),
          boxShadow: [
            BoxShadow(
              color: borderColor,
              offset: _isPressed ? Offset.zero : const Offset(4, 4),
              blurRadius: 0,
            ),
          ],
        ),
        child: widget.isLoading
            ? Row(
                mainAxisSize: MainAxisSize.min,
                children: List.generate(3, (i) => _buildDot(i)),
              )
            : Row(
                mainAxisSize: MainAxisSize.min,
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  if (widget.icon != null) ...[
                    Icon(widget.icon, color: fg, size: 18),
                    const SizedBox(width: 8),
                  ],
                  Text(
                    widget.label.toUpperCase(),
                    style: GoogleFonts.inter(
                      fontWeight: FontWeight.w900,
                      fontSize: 12,
                      letterSpacing: 1,
                      color: fg,
                    ),
                  ),
                ],
              ),
      ),
    );
  }

  Widget _buildDot(int index) {
    return TweenAnimationBuilder<double>(
      tween: Tween(begin: 0.0, end: 1.0),
      duration: Duration(milliseconds: 600 + index * 150),
      builder: (_, val, child) => Padding(
        padding: const EdgeInsets.symmetric(horizontal: 3),
        child: Transform.translate(
          offset: Offset(0, -6 * (1 - (2 * val - 1).abs())),
          child: child,
        ),
      ),
      child: Container(
        width: 7,
        height: 7,
        decoration: const BoxDecoration(
          color: Colors.black54,
          shape: BoxShape.circle,
        ),
      ),
    );
  }
}

class StatCard extends StatelessWidget {
  final String label;
  final String value;
  final IconData icon;
  final Color iconColor;
  final Color backgroundColor;
  final Color borderColor;
  final VoidCallback? onTap;

  const StatCard({
    super.key,
    required this.label,
    required this.value,
    required this.icon,
    required this.iconColor,
    required this.backgroundColor,
    required this.borderColor,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return BrutalistCard(
      backgroundColor: backgroundColor,
      borderColor: borderColor,
      onTap: onTap,
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Container(
                width: 36,
                height: 36,
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: borderColor, width: 2),
                ),
                child: Icon(icon, color: iconColor, size: 18),
              ),
              Expanded(
                child: Text(
                  label.toUpperCase(),
                  textAlign: TextAlign.right,
                  style: TextStyle(
                    fontSize: 9,
                    fontWeight: FontWeight.bold,
                    letterSpacing: 2,
                    color: iconColor.withValues(alpha: 0.8),
                  ),
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Flexible(
            child: FittedBox(
              fit: BoxFit.scaleDown,
              child: Text(
                value,
                style: const TextStyle(
                  fontSize: 32,
                  fontWeight: FontWeight.bold,
                  height: 1,
                  color: AppColors.brutalBlack,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class BrutalistProgressBar extends StatelessWidget {
  final double percentage;
  final Color fillColor;
  final double height;

  const BrutalistProgressBar({
    super.key,
    required this.percentage,
    required this.fillColor,
    this.height = 28,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final borderColor = isDark ? Colors.white : AppColors.brutalBlack;
    final pct = percentage.clamp(0, 100);

    return Container(
      height: height,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: borderColor, width: 3),
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(12),
        child: Row(
          children: [
            Flexible(
              flex: pct.toInt(),
              child: Container(
                decoration: BoxDecoration(
                  color: fillColor,
                  borderRadius: const BorderRadius.only(
                    topLeft: Radius.circular(12),
                    bottomLeft: Radius.circular(12),
                  ),
                ),
              ),
            ),
            if (pct < 100)
              Flexible(
                flex: (100 - pct).toInt().clamp(1, 100),
                child: Container(
                  decoration: BoxDecoration(
                    color: Colors.grey.shade100,
                    backgroundBlendMode: BlendMode.multiply,
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}

class SpeechBubble extends StatelessWidget {
  final Widget child;
  final EdgeInsetsGeometry padding;

  const SpeechBubble({
    super.key,
    required this.child,
    this.padding = const EdgeInsets.all(12),
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final borderColor = isDark ? Colors.white : AppColors.brutalBlack;

    return Stack(
      clipBehavior: Clip.none,
      children: [
        Container(
          padding: padding,
          decoration: BoxDecoration(
            color: isDark ? AppColors.darkCard : Colors.white,
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: borderColor, width: 3),
            boxShadow: [
              BoxShadow(color: borderColor, offset: const Offset(4, 4), blurRadius: 0),
            ],
          ),
          child: child,
        ),
        Positioned(
          bottom: -14,
          left: 24,
          child: CustomPaint(
            size: const Size(24, 16),
            painter: _BubbleTailPainter(
              fillColor: isDark ? AppColors.darkCard : Colors.white,
              borderColor: borderColor,
            ),
          ),
        ),
      ],
    );
  }
}

class _BubbleTailPainter extends CustomPainter {
  final Color fillColor;
  final Color borderColor;

  _BubbleTailPainter({required this.fillColor, required this.borderColor});

  @override
  void paint(Canvas canvas, Size size) {
    final path = Path()
      ..moveTo(0, 0)
      ..lineTo(size.width / 2, size.height)
      ..lineTo(size.width, 0)
      ..close();

    canvas.drawPath(path, Paint()..color = borderColor);

    final innerPath = Path()
      ..moveTo(3, 0)
      ..lineTo(size.width / 2, size.height - 4)
      ..lineTo(size.width - 3, 0)
      ..close();

    canvas.drawPath(innerPath, Paint()..color = fillColor);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

class LoadingSkeleton extends StatelessWidget {
  final double width;
  final double height;
  final BorderRadius? borderRadius;

  const LoadingSkeleton({
    super.key,
    this.width = double.infinity,
    required this.height,
    this.borderRadius,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: width,
      height: height,
      decoration: BoxDecoration(
        color: Colors.grey.shade200,
        borderRadius: borderRadius ?? BorderRadius.circular(12),
        border: Border.all(color: Colors.grey.shade300, width: 2),
      ),
    );
  }
}

class BrutalistButton extends StatefulWidget {
  final String text;
  final VoidCallback onTap;
  final Color backgroundColor;
  final Color textColor;
  final IconData? icon;

  const BrutalistButton({
    super.key,
    required this.text,
    required this.onTap,
    this.backgroundColor = AppColors.comicYellow,
    this.textColor = AppColors.brutalBlack,
    this.icon,
  });

  @override
  State<BrutalistButton> createState() => _BrutalistButtonState();
}

class _BrutalistButtonState extends State<BrutalistButton> {
  bool _isPressed = false;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTapDown: (_) => setState(() => _isPressed = true),
      onTapUp: (_) {
        setState(() => _isPressed = false);
        widget.onTap();
      },
      onTapCancel: () => setState(() => _isPressed = false),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 100),
        curve: Curves.easeOut,
        transform: _isPressed ? Matrix4.translationValues(4, 4, 0) : Matrix4.identity(),
        padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 24),
        decoration: BoxDecoration(
          color: widget.backgroundColor,
          border: Border.all(color: AppColors.brutalBlack, width: 4),
          boxShadow: [
            BoxShadow(
              color: AppColors.brutalBlack,
              offset: _isPressed ? const Offset(0, 0) : const Offset(6, 6),
            ),
          ],
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          mainAxisSize: MainAxisSize.min,
          children: [
            if (widget.icon != null) ...[
              Icon(widget.icon, color: widget.textColor, size: 24),
              const SizedBox(width: 12),
            ],
            Text(
              widget.text.toUpperCase(),
              style: TextStyle(
                fontFamily: 'Inter',
                fontSize: 16,
                fontWeight: FontWeight.w900,
                color: widget.textColor,
                letterSpacing: 1.5,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class BrutalistTextField extends StatelessWidget {
  final TextEditingController? controller;
  final String hintText;
  final bool obscureText;
  final IconData? prefixIcon;
  final ValueChanged<String>? onChanged;

  const BrutalistTextField({
    super.key,
    this.controller,
    required this.hintText,
    this.obscureText = false,
    this.prefixIcon,
    this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        border: Border.all(color: AppColors.brutalBlack, width: 3),
        boxShadow: const [
          BoxShadow(
            color: AppColors.brutalBlack,
            offset: Offset(4, 4),
          ),
        ],
      ),
      child: TextField(
        controller: controller,
        obscureText: obscureText,
        onChanged: onChanged,
        style: const TextStyle(
          fontFamily: 'Inter',
          fontSize: 16,
          fontWeight: FontWeight.w600,
          color: AppColors.brutalBlack,
        ),
        decoration: InputDecoration(
          hintText: hintText,
          hintStyle: TextStyle(
            fontFamily: 'Inter',
            color: Colors.grey.shade600,
            fontWeight: FontWeight.w500,
          ),
          prefixIcon: prefixIcon != null ? Icon(prefixIcon, color: AppColors.brutalBlack) : null,
          border: InputBorder.none,
          contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 18),
        ),
      ),
    );
  }
}
