import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../services/api_service.dart';
import '../../theme/app_colors.dart';
import '../../theme/neubrutalist_widgets.dart';

class StudentDetailScreen extends ConsumerStatefulWidget {
  final String id;
  const StudentDetailScreen({super.key, required this.id});

  @override
  ConsumerState<StudentDetailScreen> createState() => _StudentDetailScreenState();
}

class _StudentDetailScreenState extends ConsumerState<StudentDetailScreen> {
  Map<String, dynamic>? _data;
  bool _isLoading = true;
  String? _fetchError;

  @override
  void initState() {
    super.initState();
    _fetchStudent();
  }

  Future<void> _fetchStudent() async {
    setState(() {
      _isLoading = true;
      _fetchError = null;
    });
    try {
      final response = await ApiService().get('/api/teacher/students/${widget.id}');
      if (mounted) {
        setState(() {
          _data = response.data;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _data = null;
          _fetchError = 'Failed to load student details. Check your connection and try again.';
          _isLoading = false;
        });
      }
    }
  }

  void _showInterventionModal() {
    String selectedDomain = 'academic';
    String selectedUrgency = 'medium';
    final msgController = TextEditingController();
    bool isSubmitting = false;
    bool isDrafting = false;

    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (context, setDialogState) {
          return AlertDialog(
            backgroundColor: Colors.white,
            shape: const RoundedRectangleBorder(
              side: BorderSide(color: AppColors.brutalBlack, width: 4),
              borderRadius: BorderRadius.zero,
            ),
            title: Text('NEW INTERVENTION', style: GoogleFonts.inter(fontWeight: FontWeight.w900, color: Colors.black)),
            content: SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Support Domain:', style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 12, color: Colors.black)),
                  const SizedBox(height: 8),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: ['academic', 'attendance', 'behavioral', 'wellness'].map((domain) {
                      final isSelected = selectedDomain == domain;
                      return GestureDetector(
                        onTap: () => setDialogState(() => selectedDomain = domain),
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                          decoration: BoxDecoration(
                            color: isSelected ? AppColors.senseiPurple : Colors.white,
                            border: Border.all(color: Colors.black, width: 2),
                          ),
                          child: Text(
                            domain.toUpperCase(),
                            style: GoogleFonts.spaceMono(
                              fontSize: 10,
                              fontWeight: FontWeight.bold,
                              color: isSelected ? Colors.white : Colors.black,
                            ),
                          ),
                        ),
                      );
                    }).toList(),
                  ),
                  const SizedBox(height: 16),
                  Text('Urgency Priority:', style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 12, color: Colors.black)),
                  const SizedBox(height: 8),
                  Row(
                    children: ['low', 'medium', 'high'].map((urgency) {
                      final isSelected = selectedUrgency == urgency;
                      return Padding(
                        padding: const EdgeInsets.only(right: 8),
                        child: GestureDetector(
                          onTap: () => setDialogState(() => selectedUrgency = urgency),
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                            decoration: BoxDecoration(
                              color: isSelected ? AppColors.senseiCoral : Colors.white,
                              border: Border.all(color: Colors.black, width: 2),
                            ),
                            child: Text(
                              urgency.toUpperCase(),
                              style: GoogleFonts.spaceMono(
                                fontSize: 10,
                                fontWeight: FontWeight.bold,
                                color: isSelected ? Colors.white : Colors.black,
                              ),
                            ),
                          ),
                        ),
                      );
                    }).toList(),
                  ),
                  const SizedBox(height: 16),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text('Intervention Message:', style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 12, color: Colors.black)),
                      GestureDetector(
                        onTap: isDrafting
                            ? null
                            : () async {
                                setDialogState(() => isDrafting = true);
                                try {
                                  final response = await ApiService().get(
                                    '/api/teacher/alerts/draft',
                                    queryParameters: {
                                      'studentId': widget.id,
                                      'subject': selectedDomain,
                                    },
                                  );
                                  if (response.data != null && response.data['body'] != null) {
                                    msgController.text = response.data['body'];
                                  }
                                } catch (e) {
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    SnackBar(content: Text('AI Draft failed: $e')),
                                  );
                                } finally {
                                  setDialogState(() => isDrafting = false);
                                }
                              },
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                          decoration: BoxDecoration(
                            color: AppColors.brutalistCyan,
                            border: Border.all(color: Colors.black, width: 2),
                            boxShadow: const [BoxShadow(color: Colors.black, offset: Offset(2, 2))],
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              if (isDrafting)
                                const SizedBox(
                                  height: 10,
                                  width: 10,
                                  child: CircularProgressIndicator(strokeWidth: 2, color: Colors.black),
                                )
                              else
                                const Icon(Icons.auto_awesome, size: 12, color: Colors.black),
                              const SizedBox(width: 4),
                              Text(
                                isDrafting ? 'DRAFTING...' : 'AI DRAFT',
                                style: GoogleFonts.spaceMono(
                                  fontSize: 9,
                                  fontWeight: FontWeight.bold,
                                  color: Colors.black,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  TextField(
                    controller: msgController,
                    maxLines: 4,
                    style: const TextStyle(color: Colors.black),
                    decoration: InputDecoration(
                      hintText: 'Message to ${_data?['user']?['name']}...',
                      border: const OutlineInputBorder(borderSide: BorderSide(color: Colors.black, width: 2), borderRadius: BorderRadius.zero),
                      focusedBorder: const OutlineInputBorder(borderSide: BorderSide(color: AppColors.brutalCyan, width: 2), borderRadius: BorderRadius.zero),
                    ),
                  ),
                ],
              ),
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(ctx),
                child: Text('CANCEL', style: GoogleFonts.inter(color: Colors.black, fontWeight: FontWeight.bold)),
              ),
              ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.brutalBlue,
                  foregroundColor: Colors.white,
                  shape: const RoundedRectangleBorder(side: BorderSide(color: Colors.black, width: 2), borderRadius: BorderRadius.zero),
                ),
                onPressed: isSubmitting ? null : () async {
                  if (msgController.text.trim().isEmpty) return;
                  setDialogState(() => isSubmitting = true);
                  try {
                    await ApiService().post('/api/teacher/interventions', data: {
                      'studentId': widget.id,
                      'message': msgController.text.trim(),
                      'triggerType': 'manual',
                      'urgency': selectedUrgency,
                      'type': selectedDomain,
                      'tags': [selectedDomain],
                    });
                    if (mounted) {
                      Navigator.pop(ctx);
                      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Intervention sent')));
                      _fetchStudent();
                    }
                  } catch (e) {
                    setDialogState(() => isSubmitting = false);
                    if (mounted) {
                      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
                    }
                  }
                },
                child: Text(isSubmitting ? 'SENDING...' : 'SEND', style: GoogleFonts.inter(fontWeight: FontWeight.bold)),
              ),
            ],
          );
        }
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return Scaffold(
        backgroundColor: AppColors.brutalBg,
        body: const Center(child: CircularProgressIndicator(color: AppColors.teacherAccent)),
      );
    }

    if (_fetchError != null) {
      return Scaffold(
        backgroundColor: AppColors.brutalBg,
        appBar: AppBar(backgroundColor: AppColors.brutalBg, title: const Text('Student Detail')),
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(32),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(_fetchError!, textAlign: TextAlign.center, style: GoogleFonts.inter(fontWeight: FontWeight.bold, color: Colors.black)),
                const SizedBox(height: 16),
                BrutalistButton(text: 'Retry', backgroundColor: AppColors.brutalistCyan, onTap: _fetchStudent),
              ],
            ),
          ),
        ),
      );
    }

    if (_data == null || _data!['user'] == null) {
      return Scaffold(
        backgroundColor: AppColors.brutalBg,
        appBar: AppBar(backgroundColor: AppColors.brutalBg, title: const Text('Student Detail')),
        body: const Center(child: Text('Student not found', style: TextStyle(color: Colors.black))),
      );
    }

    final user = _data!['user'];
    final insight = _data!['insight'];
    final interventions = _data!['interventions'] ?? [];
    final risk = insight?['riskLevel'] ?? 'unknown';
    final latestCgpa = insight?['cgpa'];
    final avgAtt = insight?['attendance'];

    return Scaffold(
      backgroundColor: AppColors.brutalBg,
      appBar: AppBar(
        backgroundColor: AppColors.brutalBg,
        elevation: 0,
        scrolledUnderElevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          color: AppColors.brutalBlack,
          onPressed: () {
            if (context.canPop()) {
              context.pop();
            } else {
              context.go('/teacher/students');
            }
          },
        ),
        title: Text(
          'Student Detail',
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
          // Profile Card
          BrutalistCard(
            backgroundColor: AppColors.brutalistYellow,
            child: Column(
              children: [
                CircleAvatar(
                  radius: 40,
                  backgroundColor: AppColors.brutalistBlue,
                  child: Text(user['name'].substring(0, 2).toUpperCase(), style: GoogleFonts.spaceGrotesk(fontSize: 32, fontWeight: FontWeight.bold, color: Colors.white)),
                ),
                const SizedBox(height: 16),
                Text(user['name'], style: GoogleFonts.spaceGrotesk(fontSize: 24, fontWeight: FontWeight.bold, color: Colors.black)),
                Text('${user['studentId'] ?? 'ID_UNKNOWN'} • ${user['department'] ?? 'CS'}', style: GoogleFonts.inter(fontSize: 14, color: Colors.grey.shade700)),
                const SizedBox(height: 12),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                  decoration: BoxDecoration(
                    color: risk == 'high' ? AppColors.brutalistRed : risk == 'medium' ? AppColors.brutalistOrange : AppColors.brutalistLime,
                    border: Border.all(color: AppColors.brutalBlack),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text(
                    risk.toString().toUpperCase(),
                    style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.bold, color: risk == 'high' ? Colors.white : Colors.black),
                  ),
                ),
                const SizedBox(height: 16),
                const Divider(color: AppColors.brutalBlack),
                const SizedBox(height: 16),
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Icon(Icons.email, size: 16, color: Colors.black54),
                    const SizedBox(width: 8),
                    Text(user['email'], style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.bold, color: Colors.black)),
                  ],
                ),
                const SizedBox(height: 24),
                BrutalistButton(
                  text: 'Message Student',
                  backgroundColor: AppColors.brutalistBlue,
                  textColor: Colors.white,
                  onTap: _showInterventionModal,
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),

          // Stats
          BrutalistCard(
            backgroundColor: AppColors.senseiPurple,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Overall Stats', style: GoogleFonts.spaceGrotesk(fontSize: 24, fontWeight: FontWeight.bold, color: Colors.white)),
                const SizedBox(height: 16),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceAround,
                  children: [
                    _buildStatGauge('CGPA', latestCgpa?.toString() ?? 'N/A', 0.8),
                    _buildStatGauge('Attendance', avgAtt != null ? '${(avgAtt as num).toInt()}%' : 'N/A', avgAtt != null ? (avgAtt as num) / 100 : 0),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),

          // AI Insights
          BrutalistCard(
            backgroundColor: AppColors.brutalistBlue,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('AI Insights', style: GoogleFonts.spaceGrotesk(fontSize: 24, fontWeight: FontWeight.bold, color: Colors.white)),
                const SizedBox(height: 16),
                if (insight != null) ...[
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha: 0.9),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: AppColors.brutalBlack, width: 2),
                    ),
                    child: Text('Analysis: ${insight['riskReason'] ?? 'Performing adequately.'}', style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w600, color: Colors.black)),
                  ),
                  const SizedBox(height: 16),
                  Text('Recommendations', style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white)),
                  const SizedBox(height: 8),
                  if (insight['recommendations'] != null)
                    ...List.generate((insight['recommendations'] as List).length, (i) {
                      return Padding(
                        padding: const EdgeInsets.only(bottom: 4),
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text('•', style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white)),
                            const SizedBox(width: 8),
                            Expanded(child: Text(insight['recommendations'][i], style: GoogleFonts.inter(fontSize: 14, color: Colors.white))),
                          ],
                        ),
                      );
                    }),
                ] else
                  const Text('No AI insights generated yet.', style: TextStyle(color: Colors.white)),
              ],
            ),
          ),
          const SizedBox(height: 24),

          // Interventions
          BrutalistCard(
            backgroundColor: AppColors.brutalistLime,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Recent Interventions', style: GoogleFonts.spaceGrotesk(fontSize: 24, fontWeight: FontWeight.bold, color: Colors.black)),
                const SizedBox(height: 16),
                if (interventions.isNotEmpty)
                  ...interventions.map<Widget>((inv) {
                    return Padding(
                      padding: const EdgeInsets.only(bottom: 12),
                      child: Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: AppColors.brutalBlack, width: 2),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text(inv['createdAt'] ?? 'Today', style: GoogleFonts.spaceGrotesk(fontSize: 14, fontWeight: FontWeight.bold, color: Colors.black)),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                  decoration: BoxDecoration(
                                    color: inv['status'] == 'resolved' ? AppColors.brutalistLime : AppColors.brutalistCyan,
                                    border: Border.all(color: AppColors.brutalBlack),
                                    borderRadius: BorderRadius.circular(12),
                                  ),
                                  child: Text(inv['status'].toString().toUpperCase(), style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.black)),
                                ),
                              ],
                            ),
                            const SizedBox(height: 8),
                            Text(inv['message'], style: GoogleFonts.inter(fontSize: 14, color: Colors.black)),
                          ],
                        ),
                      ),
                    );
                  }).toList()
                else
                  const Text('No interventions logged.', style: TextStyle(color: Colors.black)),
              ],
            ),
          ),
          const SizedBox(height: 32),
        ],
      ),
    );
  }

  Widget _buildStatGauge(String label, String value, double progress) {
    return Column(
      children: [
        Stack(
          alignment: Alignment.center,
          children: [
            SizedBox(
              width: 80, height: 80,
              child: CircularProgressIndicator(
                value: progress,
                strokeWidth: 8,
                color: Colors.white,
                backgroundColor: Colors.white.withValues(alpha: 0.2),
              ),
            ),
            Text(value, style: GoogleFonts.spaceGrotesk(fontSize: 20, fontWeight: FontWeight.bold, color: Colors.white)),
          ],
        ),
        const SizedBox(height: 12),
        Text(label.toUpperCase(), style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.white70)),
      ],
    );
  }
}


