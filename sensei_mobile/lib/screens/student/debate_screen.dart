import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:go_router/go_router.dart';
import '../../theme/neubrutalist_widgets.dart';
import '../../theme/app_colors.dart';
import '../../services/api_service.dart';

class DebateScreen extends ConsumerStatefulWidget {
  const DebateScreen({super.key});

  @override
  ConsumerState<DebateScreen> createState() => _DebateScreenState();
}

class _DebateScreenState extends ConsumerState<DebateScreen> {
  List<dynamic> _sessions = [];
  bool _isLoading = true;

  final List<Map<String, dynamic>> _aiPersonalities = [
    {'id': 'aggressive_politician', 'name': 'Aggressive Politician', 'diff': 5, 'tag': 'Interrupts constantly', 'icon': '🎤'},
    {'id': 'calm_professor', 'name': 'Calm Professor', 'diff': 3, 'tag': 'Pure logic, no emotion', 'icon': '📚'},
    {'id': 'troll_debater', 'name': 'Troll Debater', 'diff': 4, 'tag': 'Emotional bait, mockery', 'icon': '😈'},
    {'id': 'fast_thinker', 'name': 'Fast Thinker', 'diff': 5, 'tag': 'Rapid-fire questions', 'icon': '⚡'},
  ];

  final List<String> _topics = [
    "AI will eventually replace most human jobs",
    "Social media platforms should be held liable for user content",
    "Remote work is better for society than office work",
    "Universal Basic Income is necessary for the future",
  ];

  @override
  void initState() {
    super.initState();
    _fetchSessions();
  }

  Future<void> _fetchSessions() async {
    try {
      final response = await ApiService().get('/api/debate');
      if (mounted) {
        setState(() {
          _sessions = response.data['sessions'] ?? response.data['history'] ?? [];
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  void _startDebate(String aiPersonality, String topic) async {
    try {
      final res = await ApiService().post('/api/debate/start', data: {
        'topic': topic,
        'aiPersonality': aiPersonality,
      });
      final sessionId = res.data['sessionId'] ?? res.data['id'] ?? 'deb_mock_${DateTime.now().millisecondsSinceEpoch}';
      if (mounted) {
        context.push('/student/debate/session', extra: {
          'sessionId': sessionId,
          'topic': topic,
          'aiPersonality': aiPersonality,
        });
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Failed to start debate.')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    const defaultTopic = "AI will eventually replace most human jobs";
    const defaultAi = "aggressive_politician";

    return Scaffold(
      backgroundColor: isDark ? const Color(0xFF050508) : const Color(0xFFFEF9C3),
      appBar: AppBar(
        title: Text('VIRTUAL DEBATE ARENA ⚔️', style: GoogleFonts.fredoka(fontWeight: FontWeight.bold)),
        backgroundColor: Colors.transparent,
        elevation: 0,
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  BrutalistCard(
                    backgroundColor: isDark ? const Color(0xFF1E293B) : Colors.white,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            const Text('⚔️', style: TextStyle(fontSize: 40)),
                            const SizedBox(width: 16),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text('Virtual Debate Arena', style: GoogleFonts.fredoka(fontSize: 24, fontWeight: FontWeight.bold)),
                                  Text('Challenge AI opponents. Master the art of argument.', style: GoogleFonts.fredoka(color: Colors.grey)),
                                ],
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 16),
                        ComicCard(
                          onTap: () {
                            _startDebate(defaultAi, defaultTopic);
                          },
                          backgroundColor: AppColors.senseiYellow,
                          child: Center(
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                const Icon(Icons.sports_kabaddi, color: AppColors.brutalBlack),
                                const SizedBox(width: 8),
                                Text(
                                  'ENTER THE ARENA',
                                  style: GoogleFonts.fredoka(fontWeight: FontWeight.bold, fontSize: 18, color: AppColors.brutalBlack),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 24),
                  
                  Text('CHOOSE YOUR OPPONENT', style: GoogleFonts.fredoka(fontSize: 20, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 16),
                  GridView.builder(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                      crossAxisCount: 2,
                      crossAxisSpacing: 16,
                      mainAxisSpacing: 16,
                      childAspectRatio: 0.9,
                    ),
                    itemCount: _aiPersonalities.length,
                    itemBuilder: (context, index) {
                      final ai = _aiPersonalities[index];
                      return ComicCard(
                        backgroundColor: isDark ? const Color(0xFF0F172A) : Colors.white,
                        onTap: () {
                          _startDebate(ai['id'], defaultTopic);
                        },
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Text(ai['icon'], style: const TextStyle(fontSize: 32)),
                            const SizedBox(height: 8),
                            Text(
                              ai['name'],
                              style: GoogleFonts.fredoka(fontWeight: FontWeight.bold, fontSize: 14),
                              textAlign: TextAlign.center,
                            ),
                            Text(
                              ai['tag'],
                              style: GoogleFonts.fredoka(fontSize: 10, color: Colors.grey),
                              textAlign: TextAlign.center,
                            ),
                            const SizedBox(height: 8),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: List.generate(5, (i) => Icon(
                                i < ai['diff'] ? Icons.star : Icons.star_border,
                                color: Colors.amber,
                                size: 14,
                              )),
                            ),
                          ],
                        ),
                      );
                    },
                  ),

                  const SizedBox(height: 24),
                  Text('HOT DEBATE TOPICS', style: GoogleFonts.fredoka(fontSize: 20, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 16),
                  ..._topics.map((topic) => Padding(
                    padding: const EdgeInsets.only(bottom: 12),
                    child: BrutalistCard(
                      backgroundColor: isDark ? const Color(0xFF1E293B) : Colors.grey.shade100,
                      padding: const EdgeInsets.all(12),
                      onTap: () {
                        _startDebate(defaultAi, topic);
                      },
                      child: Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.all(4),
                            decoration: BoxDecoration(
                              color: Colors.white,
                              shape: BoxShape.circle,
                              border: Border.all(color: AppColors.brutalBlack, width: 2),
                            ),
                            child: const Icon(Icons.arrow_forward_ios, size: 12),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Text(
                              topic,
                              style: GoogleFonts.fredoka(fontWeight: FontWeight.bold),
                            ),
                          ),
                        ],
                      ),
                    ),
                  )),

                  if (_sessions.isNotEmpty) ...[
                    const SizedBox(height: 24),
                    Text('RECENT DEBATES', style: GoogleFonts.fredoka(fontSize: 20, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 12),
                    ..._sessions.take(3).map((s) => Padding(
                      padding: const EdgeInsets.only(bottom: 10),
                      child: BrutalistCard(
                        backgroundColor: Colors.white,
                        padding: const EdgeInsets.all(12),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(s['topic'] ?? 'AI Ethics Debate', style: GoogleFonts.fredoka(fontSize: 14, fontWeight: FontWeight.bold)),
                                  Text('Opponent: ${s['aiPersonality'] ?? "AI Persona"}', style: GoogleFonts.inter(fontSize: 11, color: Colors.grey)),
                                ],
                              ),
                            ),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                              decoration: BoxDecoration(
                                color: AppColors.senseiYellow,
                                borderRadius: BorderRadius.circular(8),
                                border: Border.all(color: AppColors.brutalBlack, width: 1.5),
                              ),
                              child: Text('${s['score'] ?? 85} PTS', style: GoogleFonts.fredoka(fontWeight: FontWeight.bold, fontSize: 12)),
                            ),
                          ],
                        ),
                      ),
                    )),
                  ],
                ],
              ),
            ),
    );
  }
}
