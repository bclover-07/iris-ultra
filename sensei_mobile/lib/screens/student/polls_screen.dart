import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:dio/dio.dart';
import '../../theme/neubrutalist_widgets.dart';
import '../../theme/app_colors.dart';
import '../../services/api_service.dart';

class PollsScreen extends ConsumerStatefulWidget {
  const PollsScreen({super.key});

  @override
  ConsumerState<PollsScreen> createState() => _PollsScreenState();
}

class _PollsScreenState extends ConsumerState<PollsScreen> {
  List<dynamic> _activePolls = [];
  List<dynamic> _archivedPolls = [];
  bool _isLoading = true;
  String? _submittingPollId;

  @override
  void initState() {
    super.initState();
    _fetchPolls();
  }

  Future<void> _fetchPolls() async {
    setState(() => _isLoading = true);
    try {
      final responses = await Future.wait([
        ApiService().get('/api/poll/student/active').catchError((_) => Response(requestOptions: RequestOptions(path: ''), data: [])),
        ApiService().get('/api/poll/student/archived').catchError((_) => Response(requestOptions: RequestOptions(path: ''), data: [])),
      ]);

      if (mounted) {
        setState(() {
          _activePolls = responses[0].data is List ? responses[0].data : [];
          _archivedPolls = responses[1].data is List ? responses[1].data : [];
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  Future<void> _submitVote(String pollId, String option) async {
    setState(() => _submittingPollId = pollId);
    try {
      await ApiService().post('/api/poll/$pollId/respond', data: {'option': option});
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Vote recorded! Thanks for participating! 🎉')));
      _fetchPolls();
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Failed to submit vote')));
    } finally {
      if (mounted) {
        setState(() => _submittingPollId = null);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: isDark ? const Color(0xFF050508) : const Color(0xFFFEF9C3),
      appBar: AppBar(
        title: Text('CLASSROOM POLLS 📊', style: GoogleFonts.fredoka(fontWeight: FontWeight.bold)),
        backgroundColor: Colors.transparent,
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _fetchPolls,
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Text('Your opinion matters in real-time!', style: GoogleFonts.fredoka(fontSize: 14, color: Colors.grey)),
                  const SizedBox(height: 24),
                  
                  if (_activePolls.isEmpty)
                    BrutalistCard(
                      backgroundColor: isDark ? const Color(0xFF1E293B) : Colors.white,
                      child: Column(
                        children: [
                          const Icon(Icons.info_outline, size: 64, color: AppColors.senseiYellow),
                          const SizedBox(height: 16),
                          Text('Silence in the Studio...', style: GoogleFonts.fredoka(fontSize: 24, fontWeight: FontWeight.bold)),
                          const SizedBox(height: 8),
                          Text(
                            'No live polls active right now. Your teachers might be plotting their next big question. Stay tuned! ⚡',
                            textAlign: TextAlign.center,
                            style: GoogleFonts.fredoka(color: Colors.grey.shade600),
                          ),
                        ],
                      ),
                    )
                  else
                    ..._activePolls.map((poll) {
                      final hasVoted = (poll['responses'] as List<dynamic>? ?? []).isNotEmpty; // Simplified check since studentId filter is complex without user store
                      final options = poll['options'] as List<dynamic>? ?? [];

                      return Padding(
                        padding: const EdgeInsets.only(bottom: 16),
                        child: BrutalistCard(
                          backgroundColor: isDark ? const Color(0xFF1E293B) : Colors.white,
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                    decoration: BoxDecoration(color: AppColors.senseiYellow, border: Border.all(color: AppColors.brutalBlack)),
                                    child: Text('LIVE!', style: GoogleFonts.spaceMono(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.black)),
                                  ),
                                  Text(
                                    'POLL #${(poll['code'] ?? poll['_id'].toString().substring(poll['_id'].toString().length - 4)).toString().toUpperCase()}',
                                    style: GoogleFonts.fredoka(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.grey),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 16),
                              Text(poll['question'] ?? '', style: GoogleFonts.fredoka(fontSize: 24, fontWeight: FontWeight.bold)),
                              const SizedBox(height: 16),
                              if (!hasVoted)
                                ...options.map((option) => Padding(
                                  padding: const EdgeInsets.only(bottom: 8),
                                  child: ComicCard(
                                    onTap: _submittingPollId == poll['_id'] ? null : () => _submitVote(poll['_id'], option),
                                    backgroundColor: isDark ? const Color(0xFF0F172A) : Colors.grey.shade100,
                                    child: Padding(
                                      padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 16),
                                      child: Row(
                                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                        children: [
                                          Text(option, style: GoogleFonts.fredoka(fontSize: 18, fontWeight: FontWeight.bold)),
                                          const Icon(Icons.send, size: 16, color: Colors.grey),
                                        ],
                                      ),
                                    ),
                                  ),
                                ))
                              else
                                Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Row(
                                      children: [
                                        const Icon(Icons.check_circle, color: AppColors.senseiGreen),
                                        const SizedBox(width: 8),
                                        Text('You voted!', style: GoogleFonts.fredoka(color: AppColors.senseiGreen, fontWeight: FontWeight.bold)),
                                      ],
                                    ),
                                    const SizedBox(height: 16),
                                    ...options.map((option) {
                                      final results = poll['results'] as List<dynamic>? ?? [];
                                      final result = results.firstWhere((r) => r['option'] == option, orElse: () => {'count': 0, 'percentage': 0});
                                      final percentage = result['percentage'] ?? 0;

                                      return Padding(
                                        padding: const EdgeInsets.only(bottom: 12),
                                        child: Column(
                                          crossAxisAlignment: CrossAxisAlignment.start,
                                          children: [
                                            Row(
                                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                              children: [
                                                Text(option, style: GoogleFonts.fredoka(fontWeight: FontWeight.bold)),
                                                Text('${result['count']} votes ($percentage%)', style: GoogleFonts.fredoka(fontSize: 12)),
                                              ],
                                            ),
                                            const SizedBox(height: 4),
                                            LinearProgressIndicator(
                                              value: percentage / 100,
                                              backgroundColor: isDark ? const Color(0xFF0F172A) : Colors.grey.shade200,
                                              color: AppColors.senseiBlue,
                                              minHeight: 8,
                                            ),
                                          ],
                                        ),
                                      );
                                    }),
                                  ],
                                ),
                            ],
                          ),
                        ),
                      );
                    }),

                  if (_archivedPolls.isNotEmpty) ...[
                    const SizedBox(height: 32),
                    Text('ARCHIVED POLLS', style: GoogleFonts.fredoka(fontSize: 20, fontWeight: FontWeight.bold, color: Colors.grey)),
                    const SizedBox(height: 16),
                    ..._archivedPolls.map((poll) => Padding(
                      padding: const EdgeInsets.only(bottom: 16),
                      child: BrutalistCard(
                        backgroundColor: isDark ? const Color(0xFF1E293B).withValues(alpha: 0.5) : Colors.grey.shade200,
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text('ENDED', style: GoogleFonts.spaceMono(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.red)),
                              ],
                            ),
                            const SizedBox(height: 8),
                            Text(poll['question'] ?? '', style: GoogleFonts.fredoka(fontSize: 16, fontWeight: FontWeight.bold)),
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
