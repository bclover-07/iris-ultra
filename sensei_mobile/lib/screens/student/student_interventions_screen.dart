import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../services/api_service.dart';
import '../../theme/app_colors.dart';

class StudentInterventionsScreen extends ConsumerStatefulWidget {
  const StudentInterventionsScreen({super.key});

  @override
  ConsumerState<StudentInterventionsScreen> createState() => _StudentInterventionsScreenState();
}

class _StudentInterventionsScreenState extends ConsumerState<StudentInterventionsScreen> {
  bool _isLoading = true;
  List<dynamic> _interventions = [];

  @override
  void initState() {
    super.initState();
    _fetchInterventions();
  }

  Future<void> _fetchInterventions() async {
    try {
      final response = await ApiService().get('/api/student/interventions');
      if (mounted) {
        setState(() {
          _interventions = response.data['interventions'] ?? [];
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          // Mock data
          _interventions = [
            {
              '_id': '1',
              'message': 'Hi Rahul, I noticed you missed the last two quizzes. Let me know if you need help catching up.',
              'teacherId': {'name': 'Prof. Karan Gupta'},
              'status': 'pending',
              'urgency': 'medium',
              'createdAt': '2026-05-15',
            },
            {
              '_id': '2',
              'message': 'Your mid-term performance in Data Structures dropped. Please schedule a meeting this week.',
              'teacherId': {'name': 'Prof. Priya Singh'},
              'status': 'resolved',
              'urgency': 'high',
              'createdAt': '2026-04-10',
            }
          ];
          _isLoading = false;
        });
      }
    }
  }

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
          'Personalized Support Plans',
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
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: AppColors.brutalBlack))
          : _interventions.isEmpty
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(Icons.check_circle, size: 64, color: AppColors.senseiGreen),
                      const SizedBox(height: 16),
                      Text(
                        'No active support plans!',
                        style: GoogleFonts.spaceGrotesk(fontSize: 20, fontWeight: FontWeight.bold),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'You\'re on track and doing great! 🎉',
                        style: GoogleFonts.inter(fontSize: 14, color: Colors.grey.shade600),
                      ),
                    ],
                  ),
                )
              : ListView.builder(
                  padding: const EdgeInsets.all(20),
                  itemCount: _interventions.length,
                  itemBuilder: (context, index) {
                    final item = _interventions[index];
                    final isHighUrgency = item['urgency'] == 'high';
                    final isResolved = item['status'] == 'resolved';

                    return Opacity(
                      opacity: isResolved ? 0.6 : 1.0,
                      child: Padding(
                        padding: const EdgeInsets.only(bottom: 16),
                        child: Container(
                          padding: const EdgeInsets.all(20),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(
                              color: isHighUrgency ? AppColors.senseiRed : AppColors.brutalBlack,
                              width: 3,
                            ),
                            boxShadow: [
                              BoxShadow(
                                color: isHighUrgency ? AppColors.senseiRed : AppColors.brutalBlack,
                                offset: const Offset(4, 4),
                              )
                            ],
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                    decoration: BoxDecoration(
                                      color: isHighUrgency ? AppColors.senseiRed.withValues(alpha: 0.1) : AppColors.senseiYellow.withValues(alpha: 0.2),
                                      borderRadius: BorderRadius.circular(8),
                                      border: Border.all(color: isHighUrgency ? AppColors.senseiRed : AppColors.senseiOrange),
                                    ),
                                    child: Text(
                                      'Priority: ${item['urgency'] ?? 'medium'}'.toUpperCase(),
                                      style: GoogleFonts.inter(
                                        fontSize: 10,
                                        fontWeight: FontWeight.bold,
                                        color: isHighUrgency ? AppColors.senseiRed : AppColors.senseiOrange,
                                      ),
                                    ),
                                  ),
                                  Text(
                                    item['createdAt'] ?? '',
                                    style: GoogleFonts.inter(fontSize: 12, color: Colors.grey.shade600, fontWeight: FontWeight.bold),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 12),
                              Text(
                                item['message'] ?? '',
                                style: GoogleFonts.inter(fontSize: 14, height: 1.5),
                              ),
                              if (item['teacherId'] != null) ...[
                                const SizedBox(height: 12),
                                const Divider(color: AppColors.brutalBlack),
                                const SizedBox(height: 8),
                                Text(
                                  'From: ${item['teacherId']['name']}',
                                  style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.grey.shade700),
                                ),
                              ],
                            ],
                          ),
                        ),
                      ),
                    );
                  },
                ),
    );
  }
}
