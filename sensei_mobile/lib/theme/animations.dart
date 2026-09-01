import 'package:flutter/material.dart';

class NeuAnimations {
  static const Duration fast = Duration(milliseconds: 120);
  static const Duration normal = Duration(milliseconds: 250);
  static const Duration slow = Duration(milliseconds: 400);

  static const Curve bounce = Curves.easeOutBack;
  static const Curve smooth = Curves.easeInOutCubic;
}

// Bouncy Press Animation Wrapper for Neu-Brutalist Buttons & Cards
class BouncyNeuTap extends StatefulWidget {
  final Widget child;
  final VoidCallback? onTap;
  final double pressOffset;

  const BouncyNeuTap({
    super.key,
    required this.child,
    this.onTap,
    this.pressOffset = 3.0,
  });

  @override
  State<BouncyNeuTap> createState() => _BouncyNeuTapState();
}

class _BouncyNeuTapState extends State<BouncyNeuTap> with SingleTickerProviderStateMixin {
  bool _isPressed = false;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTapDown: (_) => setState(() => _isPressed = true),
      onTapUp: (_) {
        setState(() => _isPressed = false);
        widget.onTap?.call();
      },
      onTapCancel: () => setState(() => _isPressed = false),
      child: AnimatedContainer(
        duration: NeuAnimations.fast,
        curve: Curves.easeOutQuad,
        transform: Matrix4.translationValues(
          _isPressed ? widget.pressOffset : 0,
          _isPressed ? widget.pressOffset : 0,
          0,
        ),
        child: widget.child,
      ),
    );
  }
}

// Subtle Pulse Animation for Live NPU & Camera Indicators
class PulsingBadge extends StatefulWidget {
  final Widget child;
  final Duration period;

  const PulsingBadge({
    super.key,
    required this.child,
    this.period = const Duration(milliseconds: 1400),
  });

  @override
  State<PulsingBadge> createState() => _PulsingBadgeState();
}

class _PulsingBadgeState extends State<PulsingBadge> with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _scaleAnimation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(vsync: this, duration: widget.period)..repeat(reverse: true);
    _scaleAnimation = Tween<double>(begin: 0.95, end: 1.05).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeInOut),
    );
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return ScaleTransition(
      scale: _scaleAnimation,
      child: widget.child,
    );
  }
}

// Staggered Slide-In Animation for Screen Lists
class StaggeredFadeSlide extends StatelessWidget {
  final Widget child;
  final int index;
  final Duration delay;

  const StaggeredFadeSlide({
    super.key,
    required this.child,
    required this.index,
    this.delay = const Duration(milliseconds: 50),
  });

  @override
  Widget build(BuildContext context) {
    return TweenAnimationBuilder<double>(
      tween: Tween(begin: 0.0, end: 1.0),
      duration: Duration(milliseconds: 300 + (index * 40)),
      curve: Curves.easeOutCubic,
      builder: (context, value, child) {
        return Opacity(
          opacity: value.clamp(0.0, 1.0),
          child: Transform.translate(
            offset: Offset(0, (1 - value) * 20),
            child: child,
          ),
        );
      },
      child: child,
    );
  }
}
