import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'app_colors.dart';
import 'animations.dart';

/// 1. NeuCard — Round-edged Neu-brutalist Card with Hard Box-Shadow
class NeuCard extends StatefulWidget {
  final Widget child;
  final Color? backgroundColor;
  final Color borderColor;
  final double borderWidth;
  final double shadowOffset;
  final BorderRadius? borderRadius;
  final EdgeInsetsGeometry padding;
  final VoidCallback? onTap;

  const NeuCard({
    super.key,
    required this.child,
    this.backgroundColor,
    this.borderColor = AppColors.brutalBlack,
    this.borderWidth = 3.0,
    this.shadowOffset = 5.0,
    this.borderRadius,
    this.padding = const EdgeInsets.all(16),
    this.onTap,
  });

  @override
  State<NeuCard> createState() => _NeuCardState();
}

class _NeuCardState extends State<NeuCard> {
  bool _isPressed = false;

  @override
  Widget build(BuildContext context) {
    final effectiveRadius = widget.borderRadius ?? BorderRadius.circular(20);
    final bg = widget.backgroundColor ?? AppColors.creamCard;
    final hasTap = widget.onTap != null;

    return GestureDetector(
      onTapDown: hasTap ? (_) => setState(() => _isPressed = true) : null,
      onTapUp: hasTap
          ? (_) {
              setState(() => _isPressed = false);
              widget.onTap?.call();
            }
          : null,
      onTapCancel: hasTap ? () => setState(() => _isPressed = false) : null,
      child: AnimatedContainer(
        duration: NeuAnimations.fast,
        curve: Curves.easeOutQuad,
        padding: widget.padding,
        transform: Matrix4.translationValues(
          _isPressed ? 2.5 : 0,
          _isPressed ? 2.5 : 0,
          0,
        ),
        decoration: BoxDecoration(
          color: bg,
          borderRadius: effectiveRadius,
          border: Border.all(color: widget.borderColor, width: widget.borderWidth),
          boxShadow: [
            BoxShadow(
              color: widget.borderColor,
              offset: _isPressed
                  ? const Offset(1.5, 1.5)
                  : Offset(widget.shadowOffset, widget.shadowOffset),
              blurRadius: 0,
            ),
          ],
        ),
        child: widget.child,
      ),
    );
  }
}

/// 2. NeuButton — Bouncy Neu-brutalist Action Button with Round Edges
class NeuButton extends StatefulWidget {
  final String text;
  final VoidCallback? onPressed;
  final Color backgroundColor;
  final Color textColor;
  final IconData? icon;
  final bool isLoading;
  final double height;
  final double? width;
  final BorderRadius? borderRadius;

  const NeuButton({
    super.key,
    required this.text,
    required this.onPressed,
    this.backgroundColor = AppColors.popYellow,
    this.textColor = AppColors.brutalBlack,
    this.icon,
    this.isLoading = false,
    this.height = 54,
    this.width,
    this.borderRadius,
  });

  @override
  State<NeuButton> createState() => _NeuButtonState();
}

class _NeuButtonState extends State<NeuButton> {
  bool _isPressed = false;

  @override
  Widget build(BuildContext context) {
    final effectiveRadius = widget.borderRadius ?? BorderRadius.circular(16);
    final enabled = widget.onPressed != null && !widget.isLoading;

    return GestureDetector(
      onTapDown: enabled ? (_) => setState(() => _isPressed = true) : null,
      onTapUp: enabled
          ? (_) {
              setState(() => _isPressed = false);
              widget.onPressed?.call();
            }
          : null,
      onTapCancel: enabled ? () => setState(() => _isPressed = false) : null,
      child: AnimatedContainer(
        duration: NeuAnimations.fast,
        curve: Curves.easeOutQuad,
        height: widget.height,
        width: widget.width,
        transform: Matrix4.translationValues(
          _isPressed ? 3 : 0,
          _isPressed ? 3 : 0,
          0,
        ),
        padding: const EdgeInsets.symmetric(horizontal: 20),
        decoration: BoxDecoration(
          color: enabled ? widget.backgroundColor : Colors.grey.shade300,
          borderRadius: effectiveRadius,
          border: Border.all(color: AppColors.brutalBlack, width: 3),
          boxShadow: [
            BoxShadow(
              color: AppColors.brutalBlack,
              offset: _isPressed ? const Offset(1, 1) : const Offset(4, 4),
              blurRadius: 0,
            ),
          ],
        ),
        child: Center(
          child: widget.isLoading
              ? const SizedBox(
                  width: 24,
                  height: 24,
                  child: CircularProgressIndicator(
                    strokeWidth: 3,
                    color: AppColors.brutalBlack,
                  ),
                )
              : Row(
                  mainAxisSize: MainAxisSize.min,
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    if (widget.icon != null) ...[
                      Icon(widget.icon, color: widget.textColor, size: 20),
                      const SizedBox(width: 8),
                    ],
                    Text(
                      widget.text.toUpperCase(),
                      style: GoogleFonts.fredoka(
                        fontSize: 14,
                        fontWeight: FontWeight.bold,
                        letterSpacing: 1.2,
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

/// 3. NeuTextField — Round-edged Form Input with Neu-brutalist styling
class NeuTextField extends StatelessWidget {
  final TextEditingController? controller;
  final String hintText;
  final String? labelText;
  final bool obscureText;
  final IconData? prefixIcon;
  final Widget? suffixIcon;
  final ValueChanged<String>? onChanged;
  final int maxLines;
  final TextInputType keyboardType;

  const NeuTextField({
    super.key,
    this.controller,
    required this.hintText,
    this.labelText,
    this.obscureText = false,
    this.prefixIcon,
    this.suffixIcon,
    this.onChanged,
    this.maxLines = 1,
    this.keyboardType = TextInputType.text,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (labelText != null) ...[
          Text(
            labelText!.toUpperCase(),
            style: GoogleFonts.fredoka(
              fontSize: 12,
              fontWeight: FontWeight.bold,
              letterSpacing: 1.2,
              color: AppColors.brutalBlack,
            ),
          ),
          const SizedBox(height: 6),
        ],
        Container(
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: AppColors.brutalBlack, width: 2.8),
            boxShadow: const [
              BoxShadow(
                color: AppColors.brutalBlack,
                offset: Offset(3.5, 3.5),
                blurRadius: 0,
              ),
            ],
          ),
          child: TextField(
            controller: controller,
            obscureText: obscureText,
            onChanged: onChanged,
            maxLines: maxLines,
            keyboardType: keyboardType,
            style: GoogleFonts.inter(
              fontSize: 15,
              fontWeight: FontWeight.w600,
              color: AppColors.brutalBlack,
            ),
            decoration: InputDecoration(
              hintText: hintText,
              hintStyle: GoogleFonts.inter(
                color: Colors.black38,
                fontWeight: FontWeight.w500,
              ),
              prefixIcon: prefixIcon != null
                  ? Icon(prefixIcon, color: AppColors.brutalBlack, size: 20)
                  : null,
              suffixIcon: suffixIcon,
              border: InputBorder.none,
              contentPadding: const EdgeInsets.symmetric(horizontal: 18, vertical: 14),
            ),
          ),
        ),
      ],
    );
  }
}

/// 4. NeuBadge — Hexagon NPU / Verified Status Pill
class NeuBadge extends StatelessWidget {
  final String label;
  final IconData? icon;
  final Color backgroundColor;
  final Color textColor;
  final bool isLive;

  const NeuBadge({
    super.key,
    required this.label,
    this.icon,
    this.backgroundColor = AppColors.npuTeal,
    this.textColor = AppColors.brutalBlack,
    this.isLive = false,
  });

  @override
  Widget build(BuildContext context) {
    final badge = Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: backgroundColor,
        borderRadius: BorderRadius.circular(30),
        border: Border.all(color: AppColors.brutalBlack, width: 2),
        boxShadow: const [
          BoxShadow(
            color: AppColors.brutalBlack,
            offset: Offset(2, 2),
            blurRadius: 0,
          ),
        ],
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (isLive) ...[
            Container(
              width: 8,
              height: 8,
              decoration: const BoxDecoration(
                color: Colors.red,
                shape: BoxShape.circle,
              ),
            ),
            const SizedBox(width: 6),
          ],
          if (icon != null && !isLive) ...[
            Icon(icon, color: textColor, size: 14),
            const SizedBox(width: 6),
          ],
          Text(
            label.toUpperCase(),
            style: GoogleFonts.fredoka(
              fontSize: 11,
              fontWeight: FontWeight.bold,
              letterSpacing: 1,
              color: textColor,
            ),
          ),
        ],
      ),
    );

    return isLive ? PulsingBadge(child: badge) : badge;
  }
}

/// 5. NeuProgressBar — Round Striped Progress Indicator
class NeuProgressBar extends StatelessWidget {
  final double percentage; // 0 - 100
  final Color fillColor;
  final double height;

  const NeuProgressBar({
    super.key,
    required this.percentage,
    this.fillColor = AppColors.popGreen,
    this.height = 22,
  });

  @override
  Widget build(BuildContext context) {
    final pct = percentage.clamp(0.0, 100.0);

    return Container(
      height: height,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.brutalBlack, width: 2.5),
        boxShadow: const [
          BoxShadow(
            color: AppColors.brutalBlack,
            offset: Offset(2, 2),
            blurRadius: 0,
          ),
        ],
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(13),
        child: Stack(
          children: [
            FractionallySizedBox(
              widthFactor: (pct / 100).clamp(0.0, 1.0),
              child: Container(
                decoration: BoxDecoration(
                  color: fillColor,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// 6. NeuStatCard — Five Verified Signal Display Box
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
                  color: color.withOpacity(0.25),
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
                  letterSpacing: 1.1,
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
              color: AppColors.brutalBlack,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            subtitle,
            style: GoogleFonts.inter(
              fontSize: 11,
              fontWeight: FontWeight.w600,
              color: Colors.black45,
            ),
          ),
        ],
      ),
    );
  }
}

/// 7. NeuSpeechBubble — Conversational Bubble for Local Gemma Mentor
class NeuSpeechBubble extends StatelessWidget {
  final String text;
  final bool isUser;
  final String? timeString;
  final String? modelEngine; // e.g. "Gemma 3n · Hexagon NPU"

  const NeuSpeechBubble({
    super.key,
    required this.text,
    required this.isUser,
    this.timeString,
    this.modelEngine,
  });

  @override
  Widget build(BuildContext context) {
    final bg = isUser ? AppColors.popYellow : AppColors.creamCard;

    return Align(
      alignment: isUser ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        margin: const EdgeInsets.symmetric(vertical: 6, horizontal: 12),
        constraints: BoxConstraints(
          maxWidth: MediaQuery.of(context).size.width * 0.78,
        ),
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: bg,
          borderRadius: BorderRadius.only(
            topLeft: const Radius.circular(20),
            topRight: const Radius.circular(20),
            bottomLeft: Radius.circular(isUser ? 20 : 4),
            bottomRight: Radius.circular(isUser ? 4 : 20),
          ),
          border: Border.all(color: AppColors.brutalBlack, width: 2.8),
          boxShadow: const [
            BoxShadow(
              color: AppColors.brutalBlack,
              offset: Offset(3.5, 3.5),
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
