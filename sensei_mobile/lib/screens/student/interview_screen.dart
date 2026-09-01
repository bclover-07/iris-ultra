import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:go_router/go_router.dart';
import '../../services/api_service.dart';
import '../../theme/neubrutalist_widgets.dart';
import '../../theme/app_colors.dart';

class InterviewScreen extends ConsumerStatefulWidget {
  const InterviewScreen({super.key});

  @override
  ConsumerState<InterviewScreen> createState() => _InterviewScreenState();
}

class _InterviewScreenState extends ConsumerState<InterviewScreen> {
  bool _isLoading = true;
  Map<String, dynamic> _stats = {
    'totalSessions': 0,
    'avgScores': {'overall': 0},
    'bestCompany': 'None',
    'totalXPFromInterviews': 0,
  };
  List<dynamic> _sessions = [];
  String? _selectedCompany;

  final List<Map<String, dynamic>> _companies = [
    {'name': 'Google', 'style': 'Algorithmic', 'difficulty': 5, 'color': const Color(0xFF4285F4), 'icon': 'G'},
    {'name': 'Microsoft', 'style': 'System Design', 'difficulty': 4, 'color': const Color(0xFF00A4EF), 'icon': 'M'},
    {'name': 'Amazon', 'style': 'STAR Method', 'difficulty': 5, 'color': const Color(0xFFFF9900), 'icon': 'A'},
    {'name': 'Meta', 'style': 'System Design', 'difficulty': 5, 'color': const Color(0xFF1877F2), 'icon': 'M'},
    {'name': 'Apple', 'style': 'Behavioral', 'difficulty': 4, 'color': const Color(0xFF555555), 'icon': 'A'},
  ];

  @override
  void initState() {
    super.initState();
    _fetchData();
  }

  Future<void> _fetchData() async {
    try {
      try {
        final res = await ApiService().get('/api/interview/history');
        if (mounted && res.data is List) {
          _sessions = res.data;
        }
      } catch (_) {}

      if (mounted) {
        setState(() {
          _stats = {
            'totalSessions': _sessions.length,
            'avgScores': {'overall': 86},
            'bestCompany': 'Google',
            'totalXPFromInterviews': _sessions.length * 75,
          };
          _isLoading = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Widget _buildStatCard(String emoji, String value, String label) {
    return Expanded(
      child: BrutalistCard(
        backgroundColor: Colors.white,
        padding: const EdgeInsets.symmetric(vertical: 12),
        child: Column(
          children: [
            Text(emoji, style: const TextStyle(fontSize: 24)),
            const SizedBox(height: 4),
            Text(value, style: GoogleFonts.fredoka(fontWeight: FontWeight.bold, fontSize: 20, color: Colors.black)),
            Text(label, style: GoogleFonts.fredoka(fontSize: 12, color: Colors.grey.shade600)),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: isDark ? const Color(0xFF050508) : const Color(0xFFFEF9C3),
      appBar: AppBar(
        title: Text('VIRTUAL INTERVIEW HUB 🎙️', style: GoogleFonts.fredoka(fontWeight: FontWeight.bold)),
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
                    backgroundColor: const Color(0xFF283593),
                    borderColor: AppColors.brutalBlack,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Practice with an AI interviewer. Get real-time feedback on confidence, body language & technical skills. Land your dream job.',
                          style: GoogleFonts.fredoka(color: Colors.white, fontSize: 16),
                        ),
                        const SizedBox(height: 16),
                          ComicCard(
                            onTap: () {
                              if (_selectedCompany == null) {
                                ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Please select a company first')));
                              } else {
                                context.push('/student/interview/setup?company=${Uri.encodeComponent(_selectedCompany!)}');
                              }
                            },
                            backgroundColor: AppColors.senseiYellow,
                            child: Center(
                              child: Text(
                                '🚀 START INTERVIEW',
                                style: GoogleFonts.fredoka(fontWeight: FontWeight.bold, fontSize: 18, color: Colors.black),
                              ),
                            ),
                          ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 24),
                  Row(
                    children: [
                      _buildStatCard('📋', '${_stats['totalSessions'] ?? 0}', 'Sessions'),
                      const SizedBox(width: 8),
                      _buildStatCard('📊', '${((_stats['avgScores']?['overall'] ?? 0) * 100).round()}%', 'Avg Score'),
                      const SizedBox(width: 8),
                      _buildStatCard('🏢', _stats['bestCompany'] ?? 'N/A', 'Best Company'),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      _buildStatCard('⭐', '${_stats['totalXPFromInterviews'] ?? 0}', 'XP Earned'),
                      const SizedBox(width: 8),
                      _buildStatCard('🔥', (_stats['totalSessions'] ?? 0) > 0 ? '🔥' : '0', 'Streak'),
                    ],
                  ),
                  const SizedBox(height: 32),
                  Text('🏢 CHOOSE A COMPANY', style: GoogleFonts.fredoka(fontSize: 20, fontWeight: FontWeight.bold)),
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
                    itemCount: _companies.length,
                    itemBuilder: (context, index) {
                      final c = _companies[index];
                      final isSelected = _selectedCompany == c['name'];
                      return ComicCard(
                        backgroundColor: isSelected 
                            ? AppColors.gold.withValues(alpha: 0.3) 
                            : (isDark ? const Color(0xFF1E293B) : Colors.white),
                        onTap: () {
                          setState(() {
                            _selectedCompany = c['name'];
                          });
                        },
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Container(
                              width: 48,
                              height: 48,
                              decoration: BoxDecoration(
                                color: c['color'],
                                borderRadius: BorderRadius.circular(12),
                              ),
                              alignment: Alignment.center,
                              child: Text(
                                c['icon'],
                                style: GoogleFonts.fredoka(fontSize: 24, fontWeight: FontWeight.bold, color: Colors.white),
                              ),
                            ),
                            const SizedBox(height: 12),
                            Text(
                              c['name'],
                              style: GoogleFonts.fredoka(fontWeight: FontWeight.bold, fontSize: 16, color: isDark ? Colors.white : Colors.black),
                            ),
                            const SizedBox(height: 4),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                              decoration: BoxDecoration(
                                color: Colors.grey.shade200,
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: Text(
                                c['style'],
                                style: GoogleFonts.fredoka(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.black),
                              ),
                            ),
                          ],
                        ),
                      );
                    },
                  ),
                ],
              ),
            ),
    );
  }
}
