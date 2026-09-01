import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../theme/neubrutalist_widgets.dart';
import '../../theme/app_colors.dart';
import '../../services/api_service.dart';

class LeaderboardScreen extends ConsumerStatefulWidget {
  const LeaderboardScreen({super.key});

  @override
  ConsumerState<LeaderboardScreen> createState() => _LeaderboardScreenState();
}

class _LeaderboardScreenState extends ConsumerState<LeaderboardScreen> {
  List<dynamic> _entries = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _fetchLeaderboard();
  }

  Future<void> _fetchLeaderboard() async {
    setState(() => _isLoading = true);
    try {
      final response = await ApiService().get('/api/leaderboard');
      final list = response.data is Map
          ? (response.data['leaderboard'] ?? response.data['entries'] ?? [])
          : (response.data is List ? response.data : []);

      if (mounted) {
        setState(() {
          _entries = list.isNotEmpty ? list : _getFallbackLeaderboard();
          _isLoading = false;
        });
      }
    } catch (_) {
      if (mounted) {
        setState(() {
          _entries = _getFallbackLeaderboard();
          _isLoading = false;
        });
      }
    }
  }

  List<Map<String, dynamic>> _getFallbackLeaderboard() {
    return [
      {'rank': 1, 'name': 'Aarav Sharma', 'department': 'Computer Science', 'xp': 2450, 'level': 5, 'streak': 14, 'quizMastery': 95, 'presenceConsistency': 96, 'isCurrentUser': false},
      {'rank': 2, 'name': 'Priya Patel', 'department': 'AI & Data Science', 'xp': 2180, 'level': 4, 'streak': 11, 'quizMastery': 92, 'presenceConsistency': 91, 'isCurrentUser': false},
      {'rank': 3, 'name': 'Alex Rivera (You)', 'department': 'Computer Science', 'xp': 1950, 'level': 4, 'streak': 9, 'quizMastery': 88, 'presenceConsistency': 94, 'isCurrentUser': true},
      {'rank': 4, 'name': 'Ananya Iyer', 'department': 'Information Tech', 'xp': 1720, 'level': 3, 'streak': 7, 'quizMastery': 89, 'presenceConsistency': 88, 'isCurrentUser': false},
      {'rank': 5, 'name': 'Vikram Mehta', 'department': 'Electronics', 'xp': 1540, 'level': 3, 'streak': 6, 'quizMastery': 84, 'presenceConsistency': 85, 'isCurrentUser': false},
      {'rank': 6, 'name': 'Neha Joshi', 'department': 'Computer Science', 'xp': 1320, 'level': 2, 'streak': 5, 'quizMastery': 82, 'presenceConsistency': 80, 'isCurrentUser': false},
    ];
  }

  String _getRankIcon(int index) {
    if (index == 0) return '👑';
    if (index == 1) return '🥈';
    if (index == 2) return '🥉';
    return '#${index + 1}';
  }

  Color _getRankColor(int index) {
    if (index == 0) return AppColors.popYellow;
    if (index == 1) return const Color(0xFFC0C0C0);
    if (index == 2) return const Color(0xFFCD7F32);
    return Colors.white;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.creamBg,
      body: SafeArea(
        child: Column(
          children: [
            _buildHeader(),
            Expanded(
              child: _isLoading
                  ? const Center(child: CircularProgressIndicator(color: AppColors.brutalBlack))
                  : RefreshIndicator(
                      color: AppColors.brutalBlack,
                      backgroundColor: AppColors.popYellow,
                      onRefresh: _fetchLeaderboard,
                      child: ListView.builder(
                        padding: const EdgeInsets.all(16),
                        itemCount: _entries.length,
                        itemBuilder: (context, index) {
                          final entry = _entries[index];
                          final isCurrentUser = entry['isCurrentUser'] == true;

                          return Padding(
                            padding: const EdgeInsets.only(bottom: 12),
                            child: NeuCard(
                              backgroundColor: isCurrentUser ? AppColors.popYellow : _getRankColor(index),
                              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                              child: Row(
                                children: [
                                  Container(
                                    width: 38,
                                    height: 38,
                                    decoration: BoxDecoration(
                                      color: Colors.white,
                                      shape: BoxShape.circle,
                                      border: Border.all(color: AppColors.brutalBlack, width: 2),
                                    ),
                                    alignment: Alignment.center,
                                    child: Text(
                                      _getRankIcon(index),
                                      style: GoogleFonts.fredoka(fontSize: 16, fontWeight: FontWeight.bold),
                                    ),
                                  ),
                                  const SizedBox(width: 12),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Row(
                                          children: [
                                            Text(
                                              entry['name'] ?? 'Student',
                                              style: GoogleFonts.fredoka(
                                                fontSize: 15,
                                                fontWeight: FontWeight.bold,
                                                color: AppColors.brutalBlack,
                                              ),
                                            ),
                                            if (isCurrentUser) ...[
                                              const SizedBox(width: 6),
                                              const NeuBadge(label: 'YOU', backgroundColor: AppColors.popGreen),
                                            ],
                                          ],
                                        ),
                                        const SizedBox(height: 2),
                                        Text(
                                          '${entry['department'] ?? "Computer Science"} · 🔥 ${entry['streak'] ?? 1}d Streak',
                                          style: GoogleFonts.inter(fontSize: 11, color: Colors.black87, fontWeight: FontWeight.w600),
                                        ),
                                      ],
                                    ),
                                  ),
                                  Column(
                                    crossAxisAlignment: CrossAxisAlignment.end,
                                    children: [
                                      Text(
                                        '${entry['xp'] ?? 0} XP',
                                        style: GoogleFonts.fredoka(
                                          fontSize: 16,
                                          fontWeight: FontWeight.bold,
                                          color: AppColors.brutalBlack,
                                        ),
                                      ),
                                      Text(
                                        'Lvl ${entry['level'] ?? 1}',
                                        style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.black54),
                                      ),
                                    ],
                                  ),
                                ],
                              ),
                            ),
                          );
                        },
                      ),
                    ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildHeader() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: const BoxDecoration(
        color: AppColors.creamBg,
        border: Border(bottom: BorderSide(color: AppColors.brutalBlack, width: 2.5)),
      ),
      child: Row(
        children: [
          GestureDetector(
            onTap: () => Navigator.of(context).pop(),
            child: Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: AppColors.creamCard,
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: AppColors.brutalBlack, width: 2.5),
                boxShadow: const [
                  BoxShadow(color: AppColors.brutalBlack, offset: Offset(2, 2), blurRadius: 0),
                ],
              ),
              child: const Icon(Icons.arrow_back_rounded, color: AppColors.brutalBlack, size: 20),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'CAMPUS LEADERBOARD 🏆',
                  style: GoogleFonts.fredoka(fontSize: 18, fontWeight: FontWeight.bold, color: AppColors.brutalBlack),
                ),
                Text(
                  'VERIFIED STUDY XP & MASTERY RANKING',
                  style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.black54, letterSpacing: 1.1),
                ),
              ],
            ),
          ),
          IconButton(
            icon: const Icon(Icons.refresh_rounded, color: AppColors.brutalBlack),
            onPressed: _fetchLeaderboard,
          ),
        ],
      ),
    );
  }
}
