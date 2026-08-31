import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:go_router/go_router.dart';
import '../../theme/app_colors.dart';
import '../../theme/neubrutalist_widgets.dart';

class DebateSetupScreen extends StatelessWidget {
  const DebateSetupScreen({super.key});

  final List<Map<String, dynamic>> _personalities = const [
    {'id': 'aggressive_politician', 'name': 'Aggressive Politician', 'diff': 5, 'tag': 'Interrupts constantly', 'icon': '🎤'},
    {'id': 'calm_professor', 'name': 'Calm Professor', 'diff': 3, 'tag': 'Pure logic, no emotion', 'icon': '📚'},
    {'id': 'troll_debater', 'name': 'Troll Debater', 'diff': 4, 'tag': 'Emotional bait, mockery', 'icon': '😈'},
    {'id': 'fast_thinker', 'name': 'Fast Thinker', 'diff': 5, 'tag': 'Rapid-fire questions', 'icon': '⚡'},
    {'id': 'passive_opponent', 'name': 'Passive Opponent', 'diff': 2, 'tag': 'Short vague answers', 'icon': '😶'},
    {'id': 'news_anchor', 'name': 'News Anchor', 'diff': 4, 'tag': 'Structured journalism', 'icon': '📺'},
    {'id': 'startup_investor', 'name': 'Startup Investor', 'diff': 4, 'tag': 'Challenges ROI/evidence', 'icon': '💰'},
    {'id': 'toxic_opponent', 'name': 'Toxic Opponent', 'diff': 5, 'tag': 'Maximum pressure & attacks', 'icon': '☠️'},
  ];

  final List<String> _topics = const [
    "AI will eventually replace most human jobs",
    "Social media platforms should be held liable for user content",
    "Remote work is better for society than office work",
    "Universal Basic Income is necessary for the future",
    "Space exploration is a waste of resources",
    "Coding should be a mandatory school subject",
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.brutalBg,
      appBar: AppBar(
        backgroundColor: AppColors.brutalBg,
        elevation: 0,
        scrolledUnderElevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: AppColors.brutalBlack),
          onPressed: () => context.pop(),
        ),
        title: Text(
          'Virtual Debate Arena',
          style: GoogleFonts.spaceGrotesk(
            color: AppColors.brutalBlack,
            fontWeight: FontWeight.w900,
            fontSize: 20,
            letterSpacing: -1,
          ),
        ),
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(2),
          child: Container(color: AppColors.brutalBlack, height: 2),
        ),
      ),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          // Banner
          Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(24),
              border: Border.all(color: AppColors.brutalBlack, width: 4),
              boxShadow: const [BoxShadow(color: AppColors.brutalBlack, offset: Offset(8, 8))],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    const Text('⚔️', style: TextStyle(fontSize: 48)),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Virtual Debate Arena',
                            style: GoogleFonts.spaceGrotesk(
                              fontSize: 28,
                              fontWeight: FontWeight.w900,
                              color: AppColors.brutalBlack,
                              height: 1.1,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            'CHALLENGE AI OPPONENTS. MASTER THE ART OF ARGUMENT.',
                            style: GoogleFonts.inter(
                              fontSize: 10,
                              fontWeight: FontWeight.bold,
                              color: Colors.grey.shade600,
                              letterSpacing: 1,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 24),
                BrutalistButton(
                  text: 'Enter the Arena',
                  backgroundColor: AppColors.comicYellow,
                  onTap: () => context.go('/student/debate'),
                ),
              ],
            ),
          ),
          const SizedBox(height: 32),

          // Opponents
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(24),
              border: Border.all(color: AppColors.brutalBlack, width: 4),
              boxShadow: const [BoxShadow(color: AppColors.brutalBlack, offset: Offset(8, 8))],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: AppColors.senseiPurple.withValues(alpha: 0.2),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: AppColors.brutalBlack, width: 2),
                      ),
                      child: const Icon(Icons.psychology, color: AppColors.senseiPurple),
                    ),
                    const SizedBox(width: 12),
                    Text(
                      'Choose Your Opponent',
                      style: GoogleFonts.spaceGrotesk(fontSize: 20, fontWeight: FontWeight.w900),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                GridView.builder(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: 2,
                    crossAxisSpacing: 12,
                    mainAxisSpacing: 12,
                    childAspectRatio: 0.85,
                  ),
                  itemCount: _personalities.length,
                  itemBuilder: (context, index) {
                    final p = _personalities[index];
                    return GestureDetector(
                      onTap: () => context.go('/student/debate?ai=${p['id']}'),
                      child: Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: AppColors.brutalBlack, width: 2),
                          boxShadow: const [BoxShadow(color: AppColors.brutalBlack, offset: Offset(4, 4))],
                        ),
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Text(p['icon'], style: const TextStyle(fontSize: 32)),
                            const SizedBox(height: 8),
                            Text(
                              p['name'].toString().toUpperCase(),
                              textAlign: TextAlign.center,
                              style: GoogleFonts.spaceGrotesk(fontSize: 12, fontWeight: FontWeight.bold),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              p['tag'],
                              textAlign: TextAlign.center,
                              style: GoogleFonts.inter(fontSize: 10, color: Colors.grey.shade600, fontWeight: FontWeight.w600),
                            ),
                            const Spacer(),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: List.generate(
                                5,
                                (i) => Icon(
                                  i < (p['diff'] as int) ? Icons.star : Icons.star_border,
                                  color: AppColors.senseiYellow,
                                  size: 14,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    );
                  },
                ),
              ],
            ),
          ),
          const SizedBox(height: 32),

          // Topics
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(24),
              border: Border.all(color: AppColors.brutalBlack, width: 4),
              boxShadow: const [BoxShadow(color: AppColors.brutalBlack, offset: Offset(8, 8))],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: AppColors.senseiRed.withValues(alpha: 0.2),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: AppColors.brutalBlack, width: 2),
                      ),
                      child: const Icon(Icons.local_fire_department, color: AppColors.senseiRed),
                    ),
                    const SizedBox(width: 12),
                    Text(
                      'Hot Debate Topics',
                      style: GoogleFonts.spaceGrotesk(fontSize: 20, fontWeight: FontWeight.w900),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                ..._topics.map((topic) => Padding(
                      padding: const EdgeInsets.only(bottom: 12),
                      child: GestureDetector(
                        onTap: () => context.go('/student/debate?topic=$topic'),
                        child: Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: Colors.grey.shade50,
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: AppColors.brutalBlack, width: 2),
                            boxShadow: const [BoxShadow(color: AppColors.brutalBlack, offset: Offset(3, 3))],
                          ),
                          child: Row(
                            children: [
                              Container(
                                width: 28, height: 28,
                                decoration: BoxDecoration(
                                  color: Colors.white,
                                  shape: BoxShape.circle,
                                  border: Border.all(color: AppColors.brutalBlack, width: 2),
                                ),
                                child: const Icon(Icons.arrow_forward, size: 14),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Text(
                                  topic,
                                  style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.grey.shade800),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    )),
              ],
            ),
          ),
          const SizedBox(height: 32),
        ],
      ),
    );
  }
}
