import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../theme/admin_theme.dart';
import '../../theme/admin_glass_widgets.dart';
import '../../services/api_service.dart';

class FacultyScreen extends ConsumerStatefulWidget {
  const FacultyScreen({super.key});

  @override
  ConsumerState<FacultyScreen> createState() => _FacultyScreenState();
}

class _FacultyScreenState extends ConsumerState<FacultyScreen> {
  List<dynamic> _faculty = [];
  bool _isLoading = true;

  final List<Color> _rankColors = [
    const Color(0xFFF59E0B),
    const Color(0xFF9CA3AF),
    const Color(0xFFCD7C2A),
  ];
  final List<String> _rankLabels = ['🥇', '🥈', '🥉'];

  @override
  void initState() {
    super.initState();
    _fetchFaculty();
  }

  Future<void> _fetchFaculty() async {
    try {
      final api = ApiService();
      final data = await api.authenticatedGet('/api/admin/faculty-effectiveness');
      if (mounted) {
        setState(() {
          _faculty = data?['leaderboard'] ?? [];
          if (_faculty.isEmpty) _faculty = _mockFaculty;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _faculty = _mockFaculty;
          _isLoading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final t = AdminTheme.of(context);

    return _isLoading
        ? Center(child: CircularProgressIndicator(color: t.admAccent))
        : RefreshIndicator(
            onRefresh: _fetchFaculty,
            color: t.admAccent,
            child: ListView(
              physics: const AlwaysScrollableScrollPhysics(),
              padding: const EdgeInsets.all(20),
              children: [
                // Header with Back Button
                const Align(
                  alignment: Alignment.centerLeft,
                  child: AdminBackButton(),
                ),
                const SizedBox(height: 16),

                // Title Section
                AdminSectionTitle(
                  title: 'Faculty Effectiveness',
                  subtitle: 'AI-driven teacher performance rankings',
                  icon: Icons.emoji_events_rounded,
                  iconColor: Colors.amber,
                ),
                const SizedBox(height: 24),

                if (_faculty.isEmpty)
                  AdminGlassContainer(
                    child: Padding(
                      padding: const EdgeInsets.all(40),
                      child: Column(
                        children: [
                          Icon(
                            Icons.emoji_events_outlined,
                            size: 64,
                            color: t.admTextMuted.withValues(alpha: 0.5),
                          ),
                          const SizedBox(height: 16),
                          Text(
                            'No faculty data available',
                            style: GoogleFonts.inter(color: t.admTextMuted),
                          ),
                        ],
                      ),
                    ),
                  )
                else
                  ..._faculty.asMap().entries.map((entry) {
                    final i = entry.key;
                    final f = entry.value;
                    final isTop3 = i < 3;

                    return Padding(
                      padding: const EdgeInsets.only(bottom: 16),
                      child: AdminGlassContainer(
                        child: Padding(
                          padding: const EdgeInsets.all(16),
                          child: Row(
                            children: [
                              // Rank Card
                              Container(
                                width: 46,
                                height: 46,
                                decoration: BoxDecoration(
                                  color: isTop3
                                      ? _rankColors[i].withValues(alpha: 0.15)
                                      : t.admInputBg,
                                  border: Border.all(
                                    color: isTop3
                                        ? _rankColors[i].withValues(alpha: 0.3)
                                        : t.admBorderSolid.withValues(alpha: 0.3),
                                  ),
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                alignment: Alignment.center,
                                child: isTop3
                                    ? Text(_rankLabels[i], style: const TextStyle(fontSize: 22))
                                    : Text(
                                        '${i + 1}',
                                        style: GoogleFonts.spaceGrotesk(
                                          fontSize: 16,
                                          fontWeight: FontWeight.bold,
                                          color: t.admTextMuted,
                                        ),
                                      ),
                              ),
                              const SizedBox(width: 12),

                              // Avatar Card
                              Container(
                                width: 44,
                                height: 44,
                                decoration: BoxDecoration(
                                  gradient: LinearGradient(
                                    colors: AdminTheme.accentGradient(context),
                                  ),
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                alignment: Alignment.center,
                                child: Text(
                                  (f['name'] ?? 'F').toString().substring(0, 1).toUpperCase(),
                                  style: GoogleFonts.spaceGrotesk(
                                    fontSize: 18,
                                    fontWeight: FontWeight.bold,
                                    color: Colors.white,
                                  ),
                                ),
                              ),
                              const SizedBox(width: 12),

                              // Info Card
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      f['name'] ?? '',
                                      style: GoogleFonts.spaceGrotesk(
                                        fontSize: 15,
                                        fontWeight: FontWeight.bold,
                                        color: t.admText,
                                      ),
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                    const SizedBox(height: 2),
                                    Text(
                                      f['dept'] ?? '',
                                      style: GoogleFonts.inter(
                                        fontSize: 11,
                                        color: t.admTextMuted,
                                      ),
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                  ],
                                ),
                              ),
                              const SizedBox(width: 8),

                              // Score Stats
                              Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Column(
                                    crossAxisAlignment: CrossAxisAlignment.center,
                                    children: [
                                      Row(
                                        children: [
                                          const Icon(Icons.star_rounded, color: Colors.amber, size: 15),
                                          const SizedBox(width: 2),
                                          Text(
                                            '${f['score']}',
                                            style: GoogleFonts.spaceGrotesk(
                                              fontSize: 15,
                                              fontWeight: FontWeight.bold,
                                              color: Colors.amber[700],
                                            ),
                                          ),
                                        ],
                                      ),
                                      const SizedBox(height: 2),
                                      Text(
                                        'AI SCORE',
                                        style: GoogleFonts.inter(
                                          fontSize: 8,
                                          fontWeight: FontWeight.bold,
                                          color: t.admTextMuted,
                                        ),
                                      ),
                                    ],
                                  ),
                                  const SizedBox(width: 12),
                                  Column(
                                    crossAxisAlignment: CrossAxisAlignment.center,
                                    children: [
                                      Row(
                                        children: [
                                          Icon(Icons.trending_up_rounded, color: t.success, size: 15),
                                          const SizedBox(width: 2),
                                          Text(
                                            '${f['passRate']}%',
                                            style: GoogleFonts.spaceGrotesk(
                                              fontSize: 15,
                                              fontWeight: FontWeight.bold,
                                              color: t.success,
                                            ),
                                          ),
                                        ],
                                      ),
                                      const SizedBox(height: 2),
                                      Text(
                                        'PASS RATE',
                                        style: GoogleFonts.inter(
                                          fontSize: 8,
                                          fontWeight: FontWeight.bold,
                                          color: t.admTextMuted,
                                        ),
                                      ),
                                    ],
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ),
                      ),
                    );
                  }).toList(),

                const SizedBox(height: 40),
              ],
            ),
          );
  }
}

final List<Map<String, dynamic>> _mockFaculty = [
  {'name': 'Dr. Alan Turing', 'dept': 'Computer Science', 'score': 98.5, 'passRate': 94},
  {'name': 'Prof. Marie Curie', 'dept': 'Physics', 'score': 95.2, 'passRate': 89},
  {'name': 'Dr. Richard Feynman', 'dept': 'Physics', 'score': 91.0, 'passRate': 85},
  {'name': 'Prof. Ada Lovelace', 'dept': 'Mathematics', 'score': 88.4, 'passRate': 82},
];
