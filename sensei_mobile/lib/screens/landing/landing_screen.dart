import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../theme/marketing_widgets.dart';
import '../../providers/auth_provider.dart';
import '../../theme/app_colors.dart';

class LandingScreen extends ConsumerWidget {
  const LandingScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final themeMode = ref.watch(themeProvider);
    final isDark = themeMode == ThemeMode.dark;

    final bgColor = isDark ? const Color(0xFF1A1A2E) : MarketingColors.bgPage;
    final textColor = isDark ? Colors.white : MarketingColors.navy;
    final textMuted = isDark ? Colors.white70 : Colors.grey.shade600;

    return Scaffold(
      backgroundColor: bgColor,
      body: CustomScrollView(
        slivers: [
          // App Bar
          SliverAppBar(
            pinned: true,
            backgroundColor: isDark ? const Color(0xFF111111).withValues(alpha: 0.9) : Colors.white.withValues(alpha: 0.9),
            elevation: 1,
            title: Row(
              children: [
                Container(
                  width: 32,
                  height: 32,
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(
                      colors: [MarketingColors.purple, MarketingColors.purpleDark],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: const Icon(Icons.psychology, color: Colors.white, size: 20),
                ),
                const SizedBox(width: 8),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'SENSEI',
                      style: GoogleFonts.cinzel(
                        fontWeight: FontWeight.w900,
                        fontSize: 16,
                        letterSpacing: 2,
                        color: textColor,
                      ),
                    ),
                    Text(
                      'AI CAMPUS OS',
                      style: GoogleFonts.raleway(
                        fontWeight: FontWeight.bold,
                        fontSize: 6,
                        letterSpacing: 2,
                        color: MarketingColors.purple,
                      ),
                    ),
                  ],
                ),
              ],
            ),
            actions: [
              IconButton(
                icon: Icon(isDark ? Icons.light_mode : Icons.dark_mode, color: textColor),
                onPressed: () {
                  ref.read(themeProvider.notifier).toggleTheme();
                },
              ),
              IconButton(
                icon: Icon(Icons.language, color: textColor),
                onPressed: () {},
              ),
              Padding(
                padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 8),
                child: ElevatedButton(
                  onPressed: () => context.go('/login'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: MarketingColors.purple,
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                  ),
                  child: const Text('Request Demo', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
                ),
              ),
              const SizedBox(width: 8),
            ],
          ),
          
          // Main Content
          SliverToBoxAdapter(
            child: Column(
              children: [
                // Hero Section (wrapped in polka dots)
                SizedBox(
                  width: double.infinity,
                  child: PolkaDotBackground(
                    child: Padding(
                      padding: const EdgeInsets.fromLTRB(24, 40, 24, 60),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          // Badge
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                            decoration: BoxDecoration(
                              color: MarketingColors.purple.withValues(alpha: 0.14),
                              border: Border.all(color: MarketingColors.purple.withValues(alpha: 0.35), width: 1.5),
                              borderRadius: BorderRadius.circular(999),
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Container(
                                  width: 8,
                                  height: 8,
                                  decoration: const BoxDecoration(
                                    color: Colors.green,
                                    shape: BoxShape.circle,
                                  ),
                                ),
                                const SizedBox(width: 8),
                                Text(
                                  'AI-POWERED UNIVERSITY PLATFORM',
                                  style: GoogleFonts.raleway(
                                    color: MarketingColors.purple,
                                    fontWeight: FontWeight.w900,
                                    fontSize: 10,
                                    letterSpacing: 1.5,
                                  ),
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(height: 24),
        
                          // Headline
                          Text(
                            'The AI\nOperating\nSystem for\nModern Campuses',
                            style: GoogleFonts.raleway(
                              fontSize: 42,
                              fontWeight: FontWeight.w900,
                              height: 1.1,
                              color: textColor,
                            ),
                          ),
                          const SizedBox(height: 16),
        
                          // Tagline
                          RichText(
                            text: TextSpan(
                              style: GoogleFonts.raleway(
                                fontSize: 20,
                                fontWeight: FontWeight.w800,
                              ),
                              children: [
                                TextSpan(text: 'Predict. ', style: TextStyle(color: textColor)),
                                const TextSpan(text: 'Intervene. ', style: TextStyle(color: MarketingColors.purple, fontStyle: FontStyle.italic, decoration: TextDecoration.underline)),
                                const TextSpan(text: 'Empower.', style: TextStyle(color: Colors.green)),
                              ],
                            ),
                          ),
                          const SizedBox(height: 24),
        
                          Text(
                            'Sensei unifies students, faculty, and administrators in one intelligent ecosystem to drive success & excellence.',
                            style: GoogleFonts.raleway(
                              fontSize: 16,
                              fontWeight: FontWeight.w500,
                              color: textMuted,
                              height: 1.5,
                            ),
                          ),
                          const SizedBox(height: 32),
        
                          // CTA Buttons
                          Wrap(
                            spacing: 12,
                            runSpacing: 12,
                            children: [
                              MarketingButton(
                                label: 'Explore Platform',
                                icon: Icons.arrow_forward,
                                onTap: () => context.go('/login'),
                              ),
                              OutlinedButton.icon(
                                onPressed: () {},
                                icon: const Icon(Icons.play_arrow),
                                label: const Text('Watch Demo'),
                                style: OutlinedButton.styleFrom(
                                  foregroundColor: textColor,
                                  side: BorderSide(color: textColor.withValues(alpha: 0.2), width: 1.5),
                                  padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
                                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                  textStyle: GoogleFonts.raleway(fontWeight: FontWeight.bold, fontSize: 16),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 40),
                          
                          // Social Proof
                          Row(
                            children: [
                              SizedBox(
                                width: 100,
                                height: 40,
                                child: Stack(
                                  children: List.generate(4, (i) => Positioned(
                                    left: i * 20.0,
                                    child: CircleAvatar(
                                      radius: 18,
                                      backgroundColor: bgColor,
                                      child: CircleAvatar(
                                        radius: 16,
                                        child: Icon(Icons.person, size: 16, color: Colors.white),
                                      ),
                                    ),
                                  )),
                                ),
                              ),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Row(
                                      children: List.generate(5, (_) => const Icon(Icons.star, color: Colors.amber, size: 14)),
                                    ),
                                    RichText(
                                      text: TextSpan(
                                        style: GoogleFonts.raleway(fontSize: 12, color: textMuted, fontWeight: FontWeight.bold),
                                        children: const [
                                          TextSpan(text: 'Trusted by '),
                                          TextSpan(text: '12,000+', style: TextStyle(color: MarketingColors.purple)),
                                          TextSpan(text: ' students & faculty'),
                                        ]
                                      )
                                    )
                                  ],
                                ),
                              )
                            ],
                          ),
                          const SizedBox(height: 24),
                          
                          // Doodle Badges
                          Wrap(
                            spacing: 12,
                            runSpacing: 12,
                            children: [
                              _buildDoodleBadge('🎓', '15+ AI Agents', isDark),
                              _buildDoodleBadge('🧠', 'Smart Analytics', isDark),
                              _buildDoodleBadge('🎯', 'Risk Detection', isDark),
                            ],
                          )
                        ],
                      ),
                    ),
                  ),
                ),
                
                // Stats Strip
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.symmetric(vertical: 40),
                  decoration: BoxDecoration(
                    color: bgColor,
                    border: Border.symmetric(horizontal: BorderSide(color: textMuted.withValues(alpha: 0.1), width: 2, style: BorderStyle.solid)),
                  ),
                  child: SingleChildScrollView(
                    scrollDirection: Axis.horizontal,
                    padding: const EdgeInsets.symmetric(horizontal: 24),
                    child: Row(
                      children: [
                        _buildStatItem('10K+', 'Students Impacted'),
                        const SizedBox(width: 40),
                        _buildStatItem('500+', 'Courses Analyzed'),
                        const SizedBox(width: 40),
                        _buildStatItem('95%', 'Early Risk Detection'),
                        const SizedBox(width: 40),
                        _buildStatItem('24/7', 'AI Monitoring'),
                      ],
                    ),
                  ),
                ),
                
                // Why Choose Us
                Container(
                  width: double.infinity,
                  color: bgColor,
                  padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 60),
                  child: Column(
                    children: [
                      Text(
                        'WHY CHOOSE US',
                        style: GoogleFonts.raleway(
                          fontSize: 12,
                          fontWeight: FontWeight.w800,
                          letterSpacing: 2,
                          color: MarketingColors.purple,
                        ),
                      ),
                      const SizedBox(height: 12),
                      Text(
                        'Built for Real Impact',
                        style: GoogleFonts.raleway(fontSize: 28, fontWeight: FontWeight.w900, color: textColor),
                        textAlign: TextAlign.center,
                      ),
                      const SizedBox(height: 40),
                      
                      // 2x2 Grid of Sticky Notes
                      Row(
                        children: [
                          Expanded(child: _buildWhyCard('🧠', 'Predictive Intelligence', 'AI models analyze signals to identify at-risk students.', MarketingColors.noteLavender, -2)),
                          const SizedBox(width: 16),
                          Expanded(child: _buildWhyCard('⚡', 'Real-time Interventions', 'Automated actions triggered at the right moment.', MarketingColors.noteYellow, 2)),
                        ],
                      ),
                      const SizedBox(height: 16),
                      Row(
                        children: [
                          Expanded(child: _buildWhyCard('📊', 'Unified Analytics', 'One dashboard for students, faculty, and admins.', MarketingColors.noteGreen, 1)),
                          const SizedBox(width: 16),
                          Expanded(child: _buildWhyCard('🎯', 'Proven Results', '+23% avg grade improvement & 95% early detection.', MarketingColors.notePink, -1)),
                        ],
                      ),
                    ],
                  ),
                ),
                
                // How Sensei Works (Dark Section)
                Container(
                  width: double.infinity,
                  color: const Color(0xFF111111), // Always dark
                  padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 60),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'HOW SENSEI WORKS',
                        style: GoogleFonts.raleway(fontSize: 28, fontWeight: FontWeight.w900, color: Colors.white, letterSpacing: 1.5),
                      ),
                      const SizedBox(height: 40),
                      _buildHowStep('Collect', 'Real-time data from across campus systems.', Icons.bar_chart, MarketingColors.noteLavender, const Color(0xFF7B4FE9)),
                      _buildHowStep('Analyze', 'AI agents detect patterns & predict outcomes.', Icons.psychology, MarketingColors.noteYellow, const Color(0xFFE65100)),
                      _buildHowStep('Intervene', 'Smart actions triggered at the right time.', Icons.track_changes, MarketingColors.notePink, const Color(0xFFC62828)),
                      _buildHowStep('Empower', 'Better decisions. Healthier students. Smarter campuses.', Icons.trending_up, MarketingColors.noteGreen, const Color(0xFF2E7D32)),
                      
                      const SizedBox(height: 40),
                      // Live AI Insight Card
                      Container(
                        padding: const EdgeInsets.all(20),
                        decoration: BoxDecoration(
                          color: const Color(0xFF1A1A1A),
                          borderRadius: BorderRadius.circular(16),
                          boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.5), blurRadius: 20)],
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Container(width: 8, height: 8, decoration: const BoxDecoration(color: Colors.green, shape: BoxShape.circle)),
                                const SizedBox(width: 8),
                                Text('LIVE AI INSIGHT', style: GoogleFonts.raleway(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold, letterSpacing: 2)),
                              ],
                            ),
                            const SizedBox(height: 16),
                            const Text('Dropout Risk Detected', style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold)),
                            const SizedBox(height: 4),
                            const Text('3 Students • B.Tech CSE 2nd Year', style: TextStyle(color: Colors.white70, fontSize: 12)),
                            const SizedBox(height: 20),
                            // Faux chart
                            Container(
                              height: 60,
                              width: double.infinity,
                              decoration: BoxDecoration(
                                border: const Border(bottom: BorderSide(color: Colors.red, width: 2)),
                                gradient: LinearGradient(
                                  begin: Alignment.topCenter,
                                  end: Alignment.bottomCenter,
                                  colors: [Colors.red.withValues(alpha: 0.3), Colors.red.withValues(alpha: 0.0)],
                                )
                              ),
                            ),
                            const SizedBox(height: 16),
                            OutlinedButton.icon(
                              onPressed: () {},
                              icon: const Icon(Icons.arrow_forward, size: 14),
                              label: const Text('View Insight'),
                              style: OutlinedButton.styleFrom(
                                foregroundColor: Colors.white,
                                side: const BorderSide(color: Colors.white24),
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                              ),
                            )
                          ],
                        ),
                      )
                    ],
                  ),
                ),
                
                // One Platform
                Container(
                  width: double.infinity,
                  color: bgColor,
                  padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 60),
                  child: Column(
                    children: [
                      Text(
                        'ONE PLATFORM. MULTIPLE PERSPECTIVES.',
                        style: GoogleFonts.raleway(fontSize: 24, fontWeight: FontWeight.w900, color: textColor),
                        textAlign: TextAlign.center,
                      ),
                      const SizedBox(height: 40),
                      _buildRoleCard('For Students', 'An AI that adapts to how you think and grows with you.', Icons.school, MarketingColors.purple, const Color(0xFFF0E8FF), isDark),
                      const SizedBox(height: 16),
                      _buildRoleCard('For Faculty', 'Intelligent tools that save time so you focus on students.', Icons.menu_book, const Color(0xFF0097A7), const Color(0xFFE0F7FA), isDark),
                      const SizedBox(height: 16),
                      _buildRoleCard('For Admins', 'System-wide analytics and AI-powered risk insights.', Icons.security, const Color(0xFF2E7D32), const Color(0xFFE8F5E9), isDark),
                    ],
                  ),
                ),
                
                const SizedBox(height: 40),
              ],
            ),
          )
        ],
      ),
    );
  }

  Widget _buildDoodleBadge(String emoji, String text, bool isDark) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: isDark ? Colors.white.withValues(alpha: 0.05) : Colors.black.withValues(alpha: 0.03),
        border: Border.all(color: isDark ? Colors.white24 : Colors.black12, width: 1.5),
        borderRadius: BorderRadius.circular(10),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(emoji, style: const TextStyle(fontSize: 16)),
          const SizedBox(width: 8),
          Text(text, style: GoogleFonts.raleway(fontSize: 12, fontWeight: FontWeight.bold, color: isDark ? Colors.white70 : Colors.black87)),
        ],
      ),
    );
  }

  Widget _buildStatItem(String val, String label) {
    return Column(
      children: [
        Text(val, style: GoogleFonts.cinzel(fontSize: 40, fontWeight: FontWeight.w900, color: MarketingColors.purple)),
        const SizedBox(height: 8),
        Text(label, style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.grey)),
      ],
    );
  }

  Widget _buildWhyCard(String emoji, String title, String desc, Color color, double rotate) {
    return StickyNote(
      color: color,
      rotateDegrees: rotate,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(emoji, style: const TextStyle(fontSize: 24)),
          const SizedBox(height: 12),
          Text(title, style: GoogleFonts.raleway(fontWeight: FontWeight.w900, fontSize: 14, color: Colors.black87)),
          const SizedBox(height: 8),
          Text(desc, style: GoogleFonts.raleway(fontSize: 12, color: Colors.black87, height: 1.4)),
        ],
      ),
    );
  }

  Widget _buildHowStep(String title, String desc, IconData icon, Color color, Color iconColor) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 20),
      child: StickyNote(
        color: color,
        rotateDegrees: 1,
        child: Row(
          children: [
            Container(
              width: 46, height: 46,
              decoration: BoxDecoration(color: Colors.black12, borderRadius: BorderRadius.circular(12)),
              child: Icon(icon, color: iconColor),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title, style: GoogleFonts.raleway(fontWeight: FontWeight.w900, fontSize: 16, color: Colors.black87)),
                  const SizedBox(height: 4),
                  Text(desc, style: GoogleFonts.raleway(fontSize: 13, color: Colors.black87)),
                ],
              ),
            )
          ],
        ),
      ),
    );
  }

  Widget _buildRoleCard(String title, String desc, IconData icon, Color primary, Color bgLight, bool isDark) {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: isDark ? primary.withValues(alpha: 0.1) : bgLight,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: primary.withValues(alpha: 0.3), width: 2),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(color: primary.withValues(alpha: 0.2), shape: BoxShape.circle),
            child: Icon(icon, color: primary),
          ),
          const SizedBox(height: 16),
          Text(title, style: GoogleFonts.raleway(fontSize: 20, fontWeight: FontWeight.bold, color: isDark ? Colors.white : Colors.black87)),
          const SizedBox(height: 8),
          Text(desc, style: TextStyle(color: isDark ? Colors.white70 : Colors.black54)),
        ],
      ),
    );
  }
}
