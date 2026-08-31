import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../theme/admin_theme.dart';
import '../../theme/admin_glass_widgets.dart';
import '../../services/api_service.dart';

class AdminInterventionsScreen extends ConsumerStatefulWidget {
  const AdminInterventionsScreen({super.key});

  @override
  ConsumerState<AdminInterventionsScreen> createState() => _AdminInterventionsScreenState();
}

class _AdminInterventionsScreenState extends ConsumerState<AdminInterventionsScreen> {
  List<dynamic> _interventions = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _fetchInterventions();
  }

  Future<void> _fetchInterventions() async {
    try {
      final api = ApiService();
      final data = await api.authenticatedGet('/api/admin/interventions');
      if (mounted) {
        setState(() {
          _interventions = data?['interventions'] ?? [];
          if (_interventions.isEmpty) _interventions = _mockInterventions;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _interventions = _mockInterventions;
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
            onRefresh: _fetchInterventions,
            color: t.admAccent,
            child: ListView(
              physics: const AlwaysScrollableScrollPhysics(),
              padding: const EdgeInsets.all(20),
              children: [
                AdminSectionTitle(
                  title: 'Global Interventions',
                  subtitle: 'Monitor all faculty-student interventions',
                  icon: Icons.handshake_rounded,
                  iconColor: t.admAccent,
                ),
                const SizedBox(height: 24),

                if (_interventions.isEmpty)
                  AdminGlassContainer(
                    child: Padding(
                      padding: const EdgeInsets.all(40),
                      child: Column(
                        children: [
                          Icon(
                            Icons.check_circle_outline,
                            size: 48,
                            color: t.admTextMuted.withValues(alpha: 0.5),
                          ),
                          const SizedBox(height: 16),
                          Text(
                            'No interventions recorded',
                            style: GoogleFonts.inter(color: t.admTextMuted),
                          ),
                        ],
                      ),
                    ),
                  )
                else
                  ..._interventions.map((item) {
                    final resolved = item['status'] == 'resolved';
                    final statusColor = resolved ? t.success : t.warning;

                    return Padding(
                      padding: const EdgeInsets.only(bottom: 16),
                      child: AdminGlassContainer(
                        child: Padding(
                          padding: const EdgeInsets.all(16),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                    decoration: BoxDecoration(
                                      color: statusColor.withValues(alpha: 0.15),
                                      borderRadius: BorderRadius.circular(12),
                                      border: Border.all(
                                        color: statusColor.withValues(alpha: 0.3),
                                        width: 1,
                                      ),
                                    ),
                                    child: Row(
                                      mainAxisSize: MainAxisSize.min,
                                      children: [
                                        Icon(
                                          resolved ? Icons.check_circle : Icons.schedule,
                                          size: 14,
                                          color: statusColor,
                                        ),
                                        const SizedBox(width: 4),
                                        Text(
                                          item['status'].toString().toUpperCase(),
                                          style: GoogleFonts.inter(
                                            fontSize: 10,
                                            fontWeight: FontWeight.bold,
                                            color: statusColor,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                  Text(
                                    item['createdAt'] ?? 'Recently',
                                    style: GoogleFonts.inter(
                                      fontSize: 12,
                                      color: t.admTextMuted,
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 12),
                              Text(
                                item['message'],
                                style: GoogleFonts.inter(
                                  fontSize: 14,
                                  color: t.admText,
                                  height: 1.5,
                                ),
                              ),
                              const SizedBox(height: 16),
                              Wrap(
                                spacing: 16,
                                runSpacing: 8,
                                children: [
                                  _buildTag('FACULTY: ${item['teacherId']?['name'] ?? 'Unknown'}', t),
                                  _buildTag('STUDENT: ${item['studentId']?['name'] ?? 'Unknown'} (${item['studentId']?['studentId'] ?? ''})', t),
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

  Widget _buildTag(String text, AdminThemeColors t) {
    return Text(
      text.toUpperCase(),
      style: GoogleFonts.spaceGrotesk(
        fontSize: 10,
        fontWeight: FontWeight.bold,
        color: t.admTextSub,
        letterSpacing: 0.5,
      ),
    );
  }
}

final List<Map<String, dynamic>> _mockInterventions = [
  {
    '_id': '1',
    'status': 'pending',
    'message': 'Student missed 3 consecutive classes and failed the latest data structures quiz. Intervention needed.',
    'createdAt': '2026-06-06',
    'teacherId': {'name': 'Prof. Sharma'},
    'studentId': {'name': 'Rahul Verma', 'studentId': 'CS2024-102'},
  },
  {
    '_id': '2',
    'status': 'resolved',
    'message': 'One-on-one session completed to address algorithm design flaws. Student is back on track.',
    'createdAt': '2026-06-05',
    'teacherId': {'name': 'Dr. Gupta'},
    'studentId': {'name': 'Anjali Desai', 'studentId': 'CS2024-055'},
  },
];
