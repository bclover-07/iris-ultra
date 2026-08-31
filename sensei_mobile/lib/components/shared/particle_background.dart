import 'dart:math';
import 'package:flutter/material.dart';

class ParticleBackground extends StatefulWidget {
  const ParticleBackground({super.key});

  @override
  State<ParticleBackground> createState() => _ParticleBackgroundState();
}

class _ParticleBackgroundState extends State<ParticleBackground> with SingleTickerProviderStateMixin {
  late final AnimationController _controller;
  final List<Particle> _particles = [];
  final int _particleCount = 25;
  final Random _random = Random();

  final List<Color> _palette = const [
    Color(0xFF9966FF), // Purple
    Color(0xFFD9ADFF), // Lavender
    Color(0xFFFFED59), // Yellow
    Color(0xFFFFA6C6), // Pink
    Color(0xFF73D9FF), // Blue
  ];

  @override
  void initState() {
    super.initState();
    for (int i = 0; i < _particleCount; i++) {
      _particles.add(Particle(
        x: _random.nextDouble(),
        y: _random.nextDouble(),
        color: _palette[_random.nextInt(_palette.length)],
        speedX: (_random.nextDouble() - 0.5) * 0.05,
        speedY: (_random.nextDouble() - 0.5) * 0.05,
        size: _random.nextDouble() * 12 + 6,
      ));
    }

    _controller = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 10),
    )..repeat();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Positioned.fill(
      child: AnimatedBuilder(
        animation: _controller,
        builder: (context, _) {
          return CustomPaint(
            painter: ParticlePainter(
              particles: _particles,
              progress: _controller.value,
            ),
          );
        },
      ),
    );
  }
}

class Particle {
  double x;
  double y;
  Color color;
  double speedX;
  double speedY;
  double size;

  Particle({
    required this.x,
    required this.y,
    required this.color,
    required this.speedX,
    required this.speedY,
    required this.size,
  });
}

class ParticlePainter extends CustomPainter {
  final List<Particle> particles;
  final double progress;

  ParticlePainter({required this.particles, required this.progress});

  @override
  void paint(Canvas canvas, Size size) {
    for (var i = 0; i < particles.length; i++) {
      final p = particles[i];
      
      // Update position continuously
      p.x += p.speedX * 0.01;
      p.y += p.speedY * 0.01;
      
      // Very subtle floating wave drift
      p.y += sin(progress * 2 * pi + i) * 0.0003;

      // Wrap around edges
      if (p.x < -0.1) p.x = 1.1;
      if (p.x > 1.1) p.x = -0.1;
      if (p.y < -0.1) p.y = 1.1;
      if (p.y > 1.1) p.y = -0.1;

      final paint = Paint()
        ..color = p.color.withValues(alpha: 0.45)
        ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 4);

      canvas.drawCircle(
        Offset(p.x * size.width, p.y * size.height),
        p.size,
        paint,
      );
    }
  }

  @override
  bool shouldRepaint(covariant ParticlePainter oldDelegate) => true;
}
