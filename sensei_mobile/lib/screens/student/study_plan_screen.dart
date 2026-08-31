import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:dio/dio.dart';
import '../../services/api_service.dart';
import '../../theme/neubrutalist_widgets.dart';
import '../../theme/app_colors.dart';
import '../../config/env.dart';

class StudyPlanScreen extends ConsumerStatefulWidget {
  const StudyPlanScreen({super.key});

  @override
  ConsumerState<StudyPlanScreen> createState() => _StudyPlanScreenState();
}

class _StudyPlanScreenState extends ConsumerState<StudyPlanScreen> {
  int _activeTabIndex = 0; // 0 = Generator, 1 = History
  
  // Generator State
  String _planType = 'normal'; // 'normal' or 'advanced'
  final _topicController = TextEditingController();
  final _videoUrlController = TextEditingController();
  bool _isGenerating = false;
  Map<String, dynamic>? _currentPlan;

  // History State
  bool _isHistoryLoading = false;
  List<dynamic> _historyPlans = [];
  Map<String, dynamic>? _stats;

  @override
  void initState() {
    super.initState();
    _fetchHistory();
  }

  @override
  void dispose() {
    _topicController.dispose();
    _videoUrlController.dispose();
    super.dispose();
  }

  Future<void> _fetchHistory() async {
    setState(() => _isHistoryLoading = true);
    try {
      final responses = await Future.wait([
        ApiService().get('/api/study-plan/my-plans?limit=50').catchError((_) => Response(requestOptions: RequestOptions(path: ''), data: {'plans': []})),
        ApiService().get('/api/study-plan/history/stats').catchError((_) => Response(requestOptions: RequestOptions(path: ''), data: null)),
      ]);

      if (mounted) {
        setState(() {
          _historyPlans = responses[0].data['plans'] ?? [];
          _stats = responses[1].data;
          _isHistoryLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isHistoryLoading = false);
      }
    }
  }

  Future<void> _generatePlan() async {
    if (_topicController.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Enter a topic')));
      return;
    }

    setState(() {
      _isGenerating = true;
      _currentPlan = null;
    });

    try {
      final response = await ApiService().post(
        '/api/study-plan/generate',
        data: {
          'planType': _planType,
          'mode': 'topic',
          'topic': _topicController.text.trim(),
          if (_planType == 'advanced') 'videoUrl': _videoUrlController.text.trim(),
        },
      );

      setState(() {
        _currentPlan = response.data;
      });
      _fetchHistory();
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Failed to generate plan')));
    } finally {
      setState(() {
        _isGenerating = false;
      });
    }
  }

  Widget _buildGeneratorTab() {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    if (_currentPlan != null) {
      return _buildPlanDetails(_currentPlan!);
    }

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              Expanded(
                child: ComicCard(
                  onTap: () => setState(() => _planType = 'normal'),
                  backgroundColor: _planType == 'normal' ? AppColors.senseiGreen : (isDark ? const Color(0xFF1E293B) : Colors.white),
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  child: Center(
                    child: Text('Standard Plan', style: GoogleFonts.fredoka(fontWeight: FontWeight.bold, color: _planType == 'normal' ? Colors.black : (isDark ? Colors.white : Colors.black))),
                  ),
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: ComicCard(
                  onTap: () => setState(() => _planType = 'advanced'),
                  backgroundColor: _planType == 'advanced' ? AppColors.senseiPurple : (isDark ? const Color(0xFF1E293B) : Colors.white),
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  child: Center(
                    child: Text('Advanced Plan', style: GoogleFonts.fredoka(fontWeight: FontWeight.bold, color: _planType == 'advanced' ? Colors.white : (isDark ? Colors.white : Colors.black))),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 24),
          BrutalistCard(
            backgroundColor: _planType == 'advanced' ? AppColors.senseiPurple.withValues(alpha: 0.1) : AppColors.senseiYellow.withValues(alpha: 0.1),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Text('What do you want to master?', style: GoogleFonts.fredoka(fontWeight: FontWeight.bold, fontSize: 18)),
                const SizedBox(height: 8),
                TextField(
                  controller: _topicController,
                  decoration: InputDecoration(
                    hintText: 'e.g., Quantum Physics, React Native',
                    filled: true,
                    fillColor: isDark ? const Color(0xFF0F172A) : Colors.white,
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: const BorderSide(color: AppColors.brutalBlack, width: 2)),
                    enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: const BorderSide(color: AppColors.brutalBlack, width: 2)),
                  ),
                ),
                if (_planType == 'advanced') ...[
                  const SizedBox(height: 16),
                  Text('Include Video Context (Optional)', style: GoogleFonts.fredoka(fontWeight: FontWeight.bold, fontSize: 18)),
                  const SizedBox(height: 8),
                  TextField(
                    controller: _videoUrlController,
                    decoration: InputDecoration(
                      hintText: 'Paste a YouTube URL...',
                      filled: true,
                      fillColor: isDark ? const Color(0xFF0F172A) : Colors.white,
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: const BorderSide(color: AppColors.brutalBlack, width: 2)),
                      enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: const BorderSide(color: AppColors.brutalBlack, width: 2)),
                    ),
                  ),
                ],
                const SizedBox(height: 24),
                ComicCard(
                  onTap: _isGenerating ? null : _generatePlan,
                  backgroundColor: AppColors.brutalBlack,
                  child: Center(
                    child: _isGenerating
                        ? const CircularProgressIndicator(color: Colors.white)
                        : Text('GENERATE AWESOME PLAN', style: GoogleFonts.fredoka(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 18)),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPlanDetails(Map<String, dynamic> plan) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final dailySessions = plan['dailySessions'] as List<dynamic>? ?? [];

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              IconButton(
                icon: const Icon(Icons.arrow_back),
                onPressed: () => setState(() => _currentPlan = null),
              ),
              Expanded(
                child: Text(
                  plan['title'] ?? 'Study Plan',
                  style: GoogleFonts.fredoka(fontSize: 24, fontWeight: FontWeight.bold),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Text('Action Plan', style: GoogleFonts.fredoka(fontSize: 20, fontWeight: FontWeight.bold)),
          const SizedBox(height: 16),
          ...dailySessions.map((day) {
            final isCompleted = day['completed'] == true;
            return Padding(
              padding: const EdgeInsets.only(bottom: 16),
              child: BrutalistCard(
                backgroundColor: isCompleted ? AppColors.senseiGreen.withValues(alpha: 0.2) : (isDark ? const Color(0xFF1E293B) : Colors.white),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text('Day ${day['day']}', style: GoogleFonts.fredoka(fontWeight: FontWeight.bold, fontSize: 18)),
                        if (isCompleted)
                          const Icon(Icons.check_circle, color: AppColors.senseiGreen)
                      ],
                    ),
                    const SizedBox(height: 8),
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: (day['topics'] as List<dynamic>? ?? []).map((t) => Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(
                          border: Border.all(color: AppColors.brutalBlack),
                          borderRadius: BorderRadius.circular(8),
                          color: isDark ? const Color(0xFF0F172A) : Colors.white,
                        ),
                        child: Text(t.toString(), style: GoogleFonts.fredoka(fontSize: 12)),
                      )).toList(),
                    ),
                  ],
                ),
              ),
            );
          }).toList(),
        ],
      ),
    );
  }

  Widget _buildHistoryTab() {
    if (_isHistoryLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    if (_historyPlans.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.history, size: 64, color: Colors.grey),
            const SizedBox(height: 16),
            Text('No Study Plans Yet', style: GoogleFonts.fredoka(fontSize: 20, color: Colors.grey)),
          ],
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: _historyPlans.length,
      itemBuilder: (context, index) {
        final plan = _historyPlans[index];
        final isDark = Theme.of(context).brightness == Brightness.dark;
        return Padding(
          padding: const EdgeInsets.only(bottom: 16),
          child: BrutalistCard(
            backgroundColor: isDark ? const Color(0xFF1E293B) : Colors.white,
            onTap: () async {
              setState(() => _isHistoryLoading = true);
              try {
                final response = await ApiService().get('/api/study-plan/${plan['planId'] ?? plan['_id']}');
                if (mounted) {
                  setState(() {
                    _currentPlan = response.data;
                    _activeTabIndex = 0;
                    _isHistoryLoading = false;
                  });
                }
              } catch (e) {
                if (mounted) {
                  setState(() => _isHistoryLoading = false);
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Failed to load plan details')),
                  );
                }
              }
            },
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: plan['planType'] == 'advanced' ? AppColors.senseiPurple.withValues(alpha: 0.2) : AppColors.senseiGreen.withValues(alpha: 0.2),
                        border: Border.all(color: AppColors.brutalBlack),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Text(
                        (plan['planType'] ?? 'Standard').toString().toUpperCase(),
                        style: GoogleFonts.fredoka(fontSize: 10, fontWeight: FontWeight.bold),
                      ),
                    ),
                    IconButton(
                      icon: const Icon(Icons.delete_outline, color: Colors.red),
                      onPressed: () {
                        // Normally we would call DELETE /api/study-plan/:id
                        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Delete not implemented yet')));
                      },
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Text(
                  plan['title'] ?? 'Untitled Plan',
                  style: GoogleFonts.fredoka(fontSize: 18, fontWeight: FontWeight.bold),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 16),
                Row(
                  children: [
                    const Text('Progress: '),
                    Expanded(
                      child: LinearProgressIndicator(
                        value: (plan['progress'] ?? 0) / 100,
                        backgroundColor: Colors.grey.shade300,
                        color: AppColors.senseiGreen,
                      ),
                    ),
                    const SizedBox(width: 8),
                    Text('${plan['progress'] ?? 0}%', style: GoogleFonts.fredoka(fontWeight: FontWeight.bold)),
                  ],
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: isDark ? const Color(0xFF050508) : const Color(0xFFFEF9C3),
      appBar: AppBar(
        title: Text('STUDY PLANS 📅', style: GoogleFonts.fredoka(fontWeight: FontWeight.bold)),
        backgroundColor: Colors.transparent,
        elevation: 0,
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Row(
              children: [
                Expanded(
                  child: GestureDetector(
                    onTap: () => setState(() => _activeTabIndex = 0),
                    child: Container(
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      decoration: BoxDecoration(
                        color: _activeTabIndex == 0 ? AppColors.senseiYellow : (isDark ? const Color(0xFF1E293B) : Colors.white),
                        border: Border.all(color: AppColors.brutalBlack, width: 2),
                        borderRadius: const BorderRadius.horizontal(left: Radius.circular(12)),
                      ),
                      child: Center(child: Text('Generator', style: GoogleFonts.fredoka(fontWeight: FontWeight.bold, color: _activeTabIndex == 0 ? Colors.black : (isDark ? Colors.white : Colors.black)))),
                    ),
                  ),
                ),
                Expanded(
                  child: GestureDetector(
                    onTap: () => setState(() => _activeTabIndex = 1),
                    child: Container(
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      decoration: BoxDecoration(
                        color: _activeTabIndex == 1 ? AppColors.senseiPurple : (isDark ? const Color(0xFF1E293B) : Colors.white),
                        border: Border.all(color: AppColors.brutalBlack, width: 2),
                        borderRadius: const BorderRadius.horizontal(right: Radius.circular(12)),
                      ),
                      child: Center(child: Text('My Plans', style: GoogleFonts.fredoka(fontWeight: FontWeight.bold, color: _activeTabIndex == 1 ? Colors.white : (isDark ? Colors.white : Colors.black)))),
                    ),
                  ),
                ),
              ],
            ),
          ),
          Expanded(
            child: _activeTabIndex == 0 ? _buildGeneratorTab() : _buildHistoryTab(),
          ),
        ],
      ),
    );
  }
}
