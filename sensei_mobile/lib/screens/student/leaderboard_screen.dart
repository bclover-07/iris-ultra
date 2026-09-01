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
      final response = await ApiService().get('/api/student/leaderboard');
      if (mounted) {
        setState(() {
          _entries = response.data['entries'] ?? [];
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  String _getRankIcon(int index) {
    if (index == 0) return '👑';
    if (index == 1) return '🥈';
    if (index == 2) return '🥉';
    return '#${index + 1}';
  }

  Color _getRankColor(int index) {
    if (index == 0) return const Color(0xFFFFD700);
    if (index == 1) return const Color(0xFFC0C0C0);
    if (index == 2) return const Color(0xFFCD7F32);
    return Colors.grey.shade200;
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: isDark ? const Color(0xFF050508) : const Color(0xFFFEF9C3),
      appBar: AppBar(
        title: Text('CLASS LEADERBOARD 🏆', style: GoogleFonts.fredoka(fontWeight: FontWeight.bold)),
        backgroundColor: Colors.transparent,
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _fetchLeaderboard,
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _entries.isEmpty
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(Icons.emoji_events, size: 64, color: Colors.grey),
                      const SizedBox(height: 16),
                      Text('No leaderboard data yet', style: GoogleFonts.fredoka(fontSize: 20, color: Colors.grey)),
                    ],
                  ),
                )
              : ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: _entries.length,
                  itemBuilder: (context, index) {
                    final entry = _entries[index];
                    final isCurrentUser = entry['isCurrentUser'] == true;
                    final change = entry['change'] as num? ?? 0;

                    return Padding(
                      padding: const EdgeInsets.only(bottom: 12),
                      child: Container(
                        decoration: BoxDecoration(
                          color: isCurrentUser
                              ? (isDark ? const Color(0xFF334155) : AppColors.popYellow.withValues(alpha: 0.2))
                              : (isDark ? const Color(0xFF1E293B) : Colors.white),
                          border: Border.all(
                            color: isCurrentUser ? AppColors.popYellow : AppColors.brutalBlack,
                            width: isCurrentUser ? 3 : 2,
                          ),
                          borderRadius: BorderRadius.circular(16),
                          boxShadow: [
                            BoxShadow(
                              color: isCurrentUser ? AppColors.popYellow.withValues(alpha: 0.5) : AppColors.brutalBlack,
                              offset: const Offset(4, 4),
                            ),
                          ],
                        ),
                        padding: const EdgeInsets.all(16),
                        child: Row(
                          children: [
                            Container(
                              width: 48,
                              height: 48,
                              decoration: BoxDecoration(
                                color: _getRankColor(index).withValues(alpha: isDark ? 0.8 : 0.3),
                                borderRadius: BorderRadius.circular(12),
                                border: Border.all(color: AppColors.brutalBlack),
                              ),
                              alignment: Alignment.center,
                              child: Text(_getRankIcon(index), style: GoogleFonts.fredoka(fontSize: 20, fontWeight: FontWeight.bold)),
                            ),
                            const SizedBox(width: 16),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    children: [
                                      Text(entry['name'] ?? 'Student', style: GoogleFonts.fredoka(fontSize: 18, fontWeight: FontWeight.bold)),
                                      if (isCurrentUser) ...[
                                        const SizedBox(width: 8),
                                        Container(
                                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                          decoration: BoxDecoration(color: AppColors.popYellow, borderRadius: BorderRadius.circular(8)),
                                          child: Text('YOU', style: GoogleFonts.spaceMono(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.black)),
                                        ),
                                      ],
                                    ],
                                  ),
                                  const SizedBox(height: 4),
                                  Text('${entry['xp'] ?? 0} XP • ${(entry['badges'] as List?)?.length ?? 0} badges', style: GoogleFonts.spaceMono(fontSize: 12, color: Colors.grey)),
                                ],
                              ),
                            ),
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.end,
                              children: [
                                Text('${entry['score'] ?? 0}', style: GoogleFonts.fredoka(fontSize: 24, fontWeight: FontWeight.bold)),
                                const SizedBox(height: 4),
                                Row(
                                  children: [
                                    Icon(change > 0 ? Icons.trending_up : (change < 0 ? Icons.trending_down : Icons.remove), size: 16, color: change > 0 ? Colors.green : (change < 0 ? Colors.red : Colors.grey)),
                                    const SizedBox(width: 4),
                                    Text(
                                      change > 0 ? '+$change' : change.toString(),
                                      style: GoogleFonts.spaceMono(fontSize: 12, fontWeight: FontWeight.bold, color: change > 0 ? Colors.green : (change < 0 ? Colors.red : Colors.grey)),
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    );
                  },
                ),
    );
  }
}
