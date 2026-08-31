import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../theme/admin_theme.dart';
import '../../theme/admin_glass_widgets.dart';
import '../../services/api_service.dart';

class DropoutWarningScreen extends ConsumerStatefulWidget {
  const DropoutWarningScreen({super.key});

  @override
  ConsumerState<DropoutWarningScreen> createState() => _DropoutWarningScreenState();
}

class _DropoutWarningScreenState extends ConsumerState<DropoutWarningScreen> {
  List<dynamic> _queue = [];
  bool _isLoading = true;
  bool _isProcessing = false;
  Map<String, dynamic>? _selected;

  @override
  void initState() {
    super.initState();
    _fetchQueue();
  }

  Future<void> _fetchQueue() async {
    setState(() => _isLoading = true);
    try {
      final api = ApiService();
      final response = await api.authenticatedGet('/api/dropout/queue');
      if (mounted && response != null) {
        setState(() {
          _queue = response['queue'] ?? [];
          if (_queue.isEmpty) _queue = _mockQueue;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _queue = _mockQueue;
          _isLoading = false;
        });
      }
    }
  }

  Future<void> _runPrediction() async {
    final t = AdminTheme.of(context);
    setState(() => _isProcessing = true);
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('Analyzing cross-modal risk signals...', style: GoogleFonts.inter()),
        backgroundColor: t.admAccent,
      ),
    );
    try {
      final api = ApiService();
      await api.authenticatedPost('/api/dropout/predict', data: {});
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Risk fusion analysis complete!', style: GoogleFonts.inter()),
            backgroundColor: t.success,
          ),
        );
        _fetchQueue();
      }
    } catch (e) {
      if (mounted) _fetchQueue();
    } finally {
      if (mounted) setState(() => _isProcessing = false);
    }
  }

  Future<void> _handleIntervene(String id) async {
    final t = AdminTheme.of(context);
    try {
      final api = ApiService();
      await api.authenticatedPost('/api/dropout/intervene/$id', data: {});
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Intervention sent!', style: GoogleFonts.inter()), backgroundColor: t.success),
        );
        setState(() => _selected = null);
        _fetchQueue();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Intervention emulated.', style: GoogleFonts.inter()), backgroundColor: t.warning),
        );
        setState(() {
          _queue.removeWhere((item) => item['_id'] == id);
          _selected = null;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final t = AdminTheme.of(context);

    return RefreshIndicator(
      color: t.admAccent,
      onRefresh: _fetchQueue,
      child: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          // Header
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Row(
                  children: [
                    Icon(Icons.shield_outlined, color: t.danger, size: 26),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Dropout Warning',
                            style: GoogleFonts.spaceGrotesk(
                              fontSize: 24,
                              fontWeight: FontWeight.w900,
                              color: t.admText,
                              letterSpacing: -0.3,
                            ),
                          ),
                          Text(
                            'RAG-enhanced cross-modal risk fusion',
                            style: GoogleFonts.inter(fontSize: 12, color: t.admTextMuted),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              IconButton(
                icon: Icon(Icons.refresh, color: t.admTextMuted),
                onPressed: _fetchQueue,
              ),
            ],
          ),
          const SizedBox(height: 16),

          // Run Analysis Button
          AdminButton(
            onTap: _runPrediction,
            isLoading: _isProcessing,
            gradient: AdminTheme.dangerGradient(context),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.analytics, color: Colors.white, size: 18),
                const SizedBox(width: 8),
                Text('RUN GLOBAL RISK ANALYSIS', style: GoogleFonts.spaceGrotesk(fontSize: 13, fontWeight: FontWeight.bold)),
              ],
            ),
          ),
          const SizedBox(height: 20),

          // Queue
          if (_isLoading)
            Center(child: Padding(
              padding: const EdgeInsets.all(40),
              child: CircularProgressIndicator(color: t.admAccent),
            ))
          else if (_queue.isEmpty)
            Center(
              child: Padding(
                padding: const EdgeInsets.all(40),
                child: Column(
                  children: [
                    Icon(Icons.check_circle_outline, size: 56, color: t.success),
                    const SizedBox(height: 16),
                    Text('Queue empty. Great work!', style: GoogleFonts.inter(color: t.admTextMuted, fontSize: 14)),
                  ],
                ),
              ),
            )
          else
            ...List.generate(_queue.length, (index) {
              final item = _queue[index];
              final isSelected = _selected?['_id'] == item['_id'];
              return Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: GestureDetector(
                  onTap: () => setState(() => _selected = isSelected ? null : item),
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 200),
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: t.admSurface,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(
                        color: isSelected ? t.admAccent : t.admBorderSolid,
                        width: isSelected ? 1.5 : 1,
                      ),
                      boxShadow: [
                        BoxShadow(
                          color: isSelected ? t.admAccent.withValues(alpha: 0.1) : t.admShadow,
                          blurRadius: isSelected ? 12 : 6,
                          offset: const Offset(0, 2),
                        ),
                      ],
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  item['studentId']?['name'] ?? 'Unknown',
                                  style: GoogleFonts.spaceGrotesk(fontSize: 17, fontWeight: FontWeight.bold, color: t.admText),
                                ),
                                Text(
                                  item['studentId']?['department'] ?? '',
                                  style: GoogleFonts.inter(fontSize: 12, color: t.admTextMuted),
                                ),
                              ],
                            ),
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.end,
                              children: [
                                Text(
                                  '${item['riskScore']}%',
                                  style: GoogleFonts.spaceGrotesk(
                                    fontSize: 22,
                                    fontWeight: FontWeight.bold,
                                    color: (item['riskScore'] ?? 0) > 80 ? t.danger : t.warning,
                                  ),
                                ),
                                Text(
                                  'RISK',
                                  style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.bold, color: t.admTextMuted),
                                ),
                              ],
                            ),
                          ],
                        ),
                        if (isSelected) ...[
                          const SizedBox(height: 16),
                          Divider(color: t.admBorderSolid),
                          const SizedBox(height: 8),
                          Text('PRIMARY TRIGGERS', style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.bold, color: t.admTextMuted, letterSpacing: 1)),
                          const SizedBox(height: 8),
                          ...((item['riskDrivers'] as List?) ?? []).map((d) {
                            return Padding(
                              padding: const EdgeInsets.only(bottom: 8),
                              child: Container(
                                padding: const EdgeInsets.all(10),
                                decoration: BoxDecoration(
                                  color: t.danger.withValues(alpha: 0.06),
                                  borderRadius: BorderRadius.circular(10),
                                  border: Border.all(color: t.danger.withValues(alpha: 0.1)),
                                ),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Row(
                                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                      children: [
                                        Text(d['driver'] ?? '', style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.bold, color: t.admText)),
                                        Text('${((d['weight'] ?? 0) * 100).toInt()}%', style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.bold, color: t.danger)),
                                      ],
                                    ),
                                    const SizedBox(height: 4),
                                    Text(d['description'] ?? '', style: GoogleFonts.inter(fontSize: 11, color: t.admTextSub)),
                                  ],
                                ),
                              ),
                            );
                          }),
                          const SizedBox(height: 12),
                          Container(
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              color: t.admAccent.withValues(alpha: 0.06),
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(color: t.admAccent.withValues(alpha: 0.15)),
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  children: [
                                    Icon(Icons.chat_bubble_outline, color: t.admAccent, size: 16),
                                    const SizedBox(width: 8),
                                    Text('RAG-Retrieved Intervention', style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.bold, color: t.admAccent)),
                                  ],
                                ),
                                const SizedBox(height: 8),
                                Text(
                                  '"${item['intervention']?['message'] ?? ''}"',
                                  style: GoogleFonts.inter(fontSize: 13, fontStyle: FontStyle.italic, color: t.admText, height: 1.5),
                                ),
                                const SizedBox(height: 14),
                                Align(
                                  alignment: Alignment.centerRight,
                                  child: AdminButton(
                                    onTap: () => _handleIntervene(item['_id']),
                                    gradient: AdminTheme.dangerGradient(context),
                                    child: Row(
                                      mainAxisSize: MainAxisSize.min,
                                      children: [
                                        const Icon(Icons.send, color: Colors.white, size: 14),
                                        const SizedBox(width: 8),
                                        Text('Send', style: GoogleFonts.spaceGrotesk(fontSize: 12, fontWeight: FontWeight.bold)),
                                      ],
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ],
                    ),
                  ),
                ),
              );
            }),

          const SizedBox(height: 40),
        ],
      ),
    );
  }
}

final List<Map<String, dynamic>> _mockQueue = [
  {
    '_id': '1',
    'studentId': {'name': 'John Doe', 'studentId': 'CS2021001', 'department': 'Computer Science'},
    'riskScore': 89,
    'confidence': 92,
    'intervention': {'message': 'Schedule 1:1 meeting with academic advisor to discuss recent drop in attendance and mid-term performance.'},
    'riskDrivers': [
      {'driver': 'Attendance Drop', 'weight': 0.45, 'description': 'Missed 4 consecutive classes in DS Algo.'},
      {'driver': 'Low Quiz Scores', 'weight': 0.35, 'description': 'Average score dropped by 20% in last 3 weeks.'},
    ]
  },
  {
    '_id': '2',
    'studentId': {'name': 'Sarah Smith', 'studentId': 'EC2021045', 'department': 'Electronics'},
    'riskScore': 75,
    'confidence': 85,
    'intervention': {'message': 'Send a check-in email and offer tutoring resources for upcoming exams.'},
    'riskDrivers': [
      {'driver': 'Incomplete Assignments', 'weight': 0.60, 'description': 'Missed 2 major assignments.'},
    ]
  }
];
