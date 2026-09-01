import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'app_colors.dart';

/// 1. NeuCard — Core Neu-Brutalist container
class NeuCard extends StatelessWidget {
  final Widget child;
  final Color backgroundColor;
  final Color borderColor;
  final double borderWidth;
  final double borderRadius;
  final Offset shadowOffset;
  final EdgeInsetsGeometry padding;
  final VoidCallback? onTap;

  const NeuCard({
    super.key,
    required this.child,
    this.backgroundColor = AppColors.creamCard,
    this.borderColor = AppColors.brutalBlack,
    this.borderWidth = 2.5,
    this.borderRadius = 20.0,
    this.shadowOffset = const Offset(3.5, 3.5),
    this.padding = const EdgeInsets.all(16.0),
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    Widget card = Container(
      padding: padding,
      decoration: BoxDecoration(
        color: backgroundColor,
        borderRadius: BorderRadius.circular(borderRadius),
        border: Border.all(color: borderColor, width: borderWidth),
        boxShadow: [
          BoxShadow(
            color: borderColor,
            offset: shadowOffset,
            blurRadius: 0,
          ),
        ],
      ),
      child: child,
    );

    if (onTap != null) {
      return GestureDetector(
        onTap: onTap,
        child: card,
      );
    }
    return card;
  }
}

/// 2. NeuButton — High-contrast clickable button
class NeuButton extends StatefulWidget {
  final String text;
  final VoidCallback? onPressed;
  final Color backgroundColor;
  final Color textColor;
  final IconData? icon;
  final bool isLoading;
  final double height;
  final double fontSize;

  const NeuButton({
    super.key,
    required this.text,
    this.onPressed,
    this.backgroundColor = AppColors.popYellow,
    this.textColor = AppColors.brutalBlack,
    this.icon,
    this.isLoading = false,
    this.height = 48.0,
    this.fontSize = 14.0,
  });

  @override
  State<NeuButton> createState() => _NeuButtonState();
}

class _NeuButtonState extends State<NeuButton> {
  bool _isPressed = false;

  @override
  Widget build(BuildContext context) {
    final bool enabled = widget.onPressed != null && !widget.isLoading;

    return GestureDetector(
      onTapDown: enabled ? (_) => setState(() => _isPressed = true) : null,
      onTapUp: enabled ? (_) => setState(() => _isPressed = false) : null,
      onTapCancel: enabled ? () => setState(() => _isPressed = false) : null,
      onTap: enabled ? widget.onPressed : null,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 80),
        height: widget.height,
        transform: _isPressed ? Matrix4.translationValues(2, 2, 0) : Matrix4.identity(),
        padding: const EdgeInsets.symmetric(horizontal: 20),
        decoration: BoxDecoration(
          color: enabled ? widget.backgroundColor : Colors.grey.shade300,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppColors.brutalBlack, width: 2.5),
          boxShadow: [
            BoxShadow(
              color: AppColors.brutalBlack,
              offset: _isPressed ? const Offset(1, 1) : const Offset(3.5, 3.5),
              blurRadius: 0,
            ),
          ],
        ),
        child: Center(
          child: widget.isLoading
              ? SizedBox(
                  width: 20,
                  height: 20,
                  child: CircularProgressIndicator(
                    strokeWidth: 2.5,
                    color: widget.textColor,
                  ),
                )
              : Row(
                  mainAxisSize: MainAxisSize.min,
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    if (widget.icon != null) ...[
                      Icon(widget.icon, size: 18, color: widget.textColor),
                      const SizedBox(width: 8),
                    ],
                    Text(
                      widget.text.toUpperCase(),
                      style: GoogleFonts.fredoka(
                        fontSize: widget.fontSize,
                        fontWeight: FontWeight.bold,
                        letterSpacing: 0.8,
                        color: widget.textColor,
                      ),
                    ),
                  ],
                ),
        ),
      ),
    );
  }
}

/// 3. NeuTextField — Thick-bordered input
class NeuTextField extends StatelessWidget {
  final TextEditingController? controller;
  final String hintText;
  final IconData? prefixIcon;
  final Widget? suffixIcon;
  final bool obscureText;
  final TextInputType keyboardType;
  final ValueChanged<String>? onChanged;
  final ValueChanged<String>? onSubmitted;
  final int maxLines;

  const NeuTextField({
    super.key,
    this.controller,
    required this.hintText,
    this.prefixIcon,
    this.suffixIcon,
    this.obscureText = false,
    this.keyboardType = TextInputType.text,
    this.onChanged,
    this.onSubmitted,
    this.maxLines = 1,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.brutalBlack, width: 2.5),
        boxShadow: const [
          BoxShadow(
            color: AppColors.brutalBlack,
            offset: Offset(3, 3),
            blurRadius: 0,
          ),
        ],
      ),
      child: TextField(
        controller: controller,
        obscureText: obscureText,
        keyboardType: keyboardType,
        onChanged: onChanged,
        onSubmitted: onSubmitted,
        maxLines: maxLines,
        style: GoogleFonts.inter(
          fontSize: 14,
          fontWeight: FontWeight.w600,
          color: AppColors.brutalBlack,
        ),
        decoration: InputDecoration(
          hintText: hintText,
          hintStyle: GoogleFonts.inter(
            fontSize: 14,
            fontWeight: FontWeight.w500,
            color: Colors.black38,
          ),
          prefixIcon: prefixIcon != null
              ? Icon(prefixIcon, color: AppColors.brutalBlack, size: 20)
              : null,
          suffixIcon: suffixIcon,
          border: InputBorder.none,
          contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        ),
      ),
    );
  }
}

/// 4. NeuBadge — Pill chip
class NeuBadge extends StatelessWidget {
  final String label;
  final Color backgroundColor;
  final Color textColor;
  final IconData? icon;
  final bool isLive;

  const NeuBadge({
    super.key,
    required this.label,
    this.backgroundColor = AppColors.popYellow,
    this.textColor = AppColors.brutalBlack,
    this.icon,
    this.isLive = false,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: backgroundColor,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColors.brutalBlack, width: 1.8),
        boxShadow: const [
          BoxShadow(
            color: AppColors.brutalBlack,
            offset: Offset(1.5, 1.5),
            blurRadius: 0,
          ),
        ],
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (isLive) ...[
            Container(
              width: 6,
              height: 6,
              decoration: const BoxDecoration(
                color: Colors.red,
                shape: BoxShape.circle,
              ),
            ),
            const SizedBox(width: 5),
          ] else if (icon != null) ...[
            Icon(icon, size: 12, color: textColor),
            const SizedBox(width: 4),
          ],
          Text(
            label.toUpperCase(),
            style: GoogleFonts.fredoka(
              fontSize: 10,
              fontWeight: FontWeight.bold,
              letterSpacing: 0.8,
              color: textColor,
            ),
          ),
        ],
      ),
    );
  }
}

/// 5. NeuProgressBar — Progress meter
class NeuProgressBar extends StatelessWidget {
  final double percentage;
  final Color fillColor;
  final double height;

  const NeuProgressBar({
    super.key,
    required this.percentage,
    this.fillColor = AppColors.popGreen,
    this.height = 14.0,
  });

  @override
  Widget build(BuildContext context) {
    final clamped = (percentage / 100.0).clamp(0.0, 1.0);

    return Container(
      height: height,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColors.brutalBlack, width: 2),
        boxShadow: const [
          BoxShadow(
            color: AppColors.brutalBlack,
            offset: Offset(2, 2),
            blurRadius: 0,
          ),
        ],
      ),
      child: FractionallySizedBox(
        alignment: Alignment.centerLeft,
        widthFactor: clamped,
        child: Container(
          decoration: BoxDecoration(
            color: fillColor,
            borderRadius: BorderRadius.circular(16),
          ),
        ),
      ),
    );
  }
}

/// 6. NeuStatCard — Stat Display
class NeuStatCard extends StatelessWidget {
  final String title;
  final String value;
  final String subtitle;
  final IconData icon;
  final Color color;
  final VoidCallback? onTap;

  const NeuStatCard({
    super.key,
    required this.title,
    required this.value,
    required this.subtitle,
    required this.icon,
    required this.color,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return NeuCard(
      backgroundColor: Colors.white,
      onTap: onTap,
      padding: const EdgeInsets.all(14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: color.withValues(alpha: 0.25),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppColors.brutalBlack, width: 2),
                ),
                child: Icon(icon, color: AppColors.brutalBlack, size: 18),
              ),
              Text(
                title.toUpperCase(),
                style: GoogleFonts.fredoka(
                  fontSize: 10,
                  fontWeight: FontWeight.bold,
                  letterSpacing: 0.8,
                  color: Colors.black54,
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Text(
            value,
            style: GoogleFonts.fredoka(
              fontSize: 26,
              fontWeight: FontWeight.bold,
              letterSpacing: -0.5,
              color: AppColors.brutalBlack,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            subtitle,
            style: GoogleFonts.inter(
              fontSize: 11,
              fontWeight: FontWeight.w500,
              color: Colors.black45,
            ),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
        ],
      ),
    );
  }
}

/// 7. NeuSpeechBubble — Mentor bubble
class NeuSpeechBubble extends StatelessWidget {
  final String text;
  final bool isUser;
  final String? modelEngine;
  final String? timeString;

  const NeuSpeechBubble({
    super.key,
    required this.text,
    required this.isUser,
    this.modelEngine,
    this.timeString,
  });

  @override
  Widget build(BuildContext context) {
    return Align(
      alignment: isUser ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        margin: EdgeInsets.only(
          top: 6,
          bottom: 6,
          left: isUser ? 48 : 16,
          right: isUser ? 16 : 48,
        ),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        decoration: BoxDecoration(
          color: isUser ? AppColors.popYellow : AppColors.creamCard,
          borderRadius: BorderRadius.only(
            topLeft: const Radius.circular(20),
            topRight: const Radius.circular(20),
            bottomLeft: Radius.circular(isUser ? 20 : 4),
            bottomRight: Radius.circular(isUser ? 4 : 20),
          ),
          border: Border.all(color: AppColors.brutalBlack, width: 2.2),
          boxShadow: const [
            BoxShadow(
              color: AppColors.brutalBlack,
              offset: Offset(3, 3),
              blurRadius: 0,
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (!isUser && modelEngine != null) ...[
              Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(Icons.memory, size: 12, color: AppColors.brutalBlack),
                  const SizedBox(width: 4),
                  Text(
                    modelEngine!.toUpperCase(),
                    style: GoogleFonts.fredoka(
                      fontSize: 9,
                      fontWeight: FontWeight.bold,
                      letterSpacing: 1,
                      color: AppColors.popViolet,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 6),
            ],
            Text(
              text,
              style: GoogleFonts.inter(
                fontSize: 14,
                fontWeight: FontWeight.w600,
                color: AppColors.brutalBlack,
                height: 1.35,
              ),
            ),
            if (timeString != null) ...[
              const SizedBox(height: 4),
              Align(
                alignment: Alignment.bottomRight,
                child: Text(
                  timeString!,
                  style: GoogleFonts.inter(
                    fontSize: 10,
                    fontWeight: FontWeight.w500,
                    color: Colors.black38,
                  ),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

// -------------------------------------------------------------
// Legacy Backward Compatibility Widget Aliases
// -------------------------------------------------------------

class BrutalistCard extends StatelessWidget {
  final Widget child;
  final Color backgroundColor;
  final Color borderColor;
  final EdgeInsetsGeometry padding;
  final VoidCallback? onTap;

  const BrutalistCard({
    super.key,
    required this.child,
    this.backgroundColor = Colors.white,
    this.borderColor = AppColors.brutalBlack,
    this.padding = const EdgeInsets.all(16.0),
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return NeuCard(
      backgroundColor: backgroundColor,
      borderColor: borderColor,
      padding: padding,
      onTap: onTap,
      child: child,
    );
  }
}

class ComicCard extends StatelessWidget {
  final Widget child;
  final Color backgroundColor;
  final Color borderColor;
  final EdgeInsetsGeometry padding;
  final VoidCallback? onTap;

  const ComicCard({
    super.key,
    required this.child,
    this.backgroundColor = Colors.white,
    this.borderColor = AppColors.brutalBlack,
    this.padding = const EdgeInsets.all(16.0),
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return NeuCard(
      backgroundColor: backgroundColor,
      borderColor: borderColor,
      padding: padding,
      onTap: onTap,
      child: child,
    );
  }
}

class BrutalistButton extends StatelessWidget {
  final String text;
  final VoidCallback? onTap;
  final Color backgroundColor;

  const BrutalistButton({
    super.key,
    required this.text,
    this.onTap,
    this.backgroundColor = AppColors.popYellow,
  });

  @override
  Widget build(BuildContext context) {
    return NeuButton(
      text: text,
      onPressed: onTap,
      backgroundColor: backgroundColor,
    );
  }
}

class ComicButton extends StatelessWidget {
  final String label;
  final VoidCallback? onPressed;
  final Color backgroundColor;

  const ComicButton({
    super.key,
    required this.label,
    this.onPressed,
    this.backgroundColor = AppColors.popYellow,
  });

  @override
  Widget build(BuildContext context) {
    return NeuButton(
      text: label,
      onPressed: onPressed,
      backgroundColor: backgroundColor,
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
    this.iconColor = AppColors.popViolet,
    this.backgroundColor = Colors.white,
    this.borderColor = AppColors.brutalBlack,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return NeuStatCard(
      title: label,
      value: value,
      subtitle: '',
      icon: icon,
      color: iconColor,
      onTap: onTap,
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
    this.backgroundColor = AppColors.popYellow,
    this.textColor = AppColors.brutalBlack,
    this.rotation = 0.0,
  });

  @override
  Widget build(BuildContext context) {
    return Transform.rotate(
      angle: rotation,
      child: NeuBadge(
        label: text,
        backgroundColor: backgroundColor,
        textColor: textColor,
      ),
    );
  }
}
