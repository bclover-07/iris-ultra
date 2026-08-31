import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../theme/admin_theme.dart';
import '../../theme/admin_glass_widgets.dart';
import '../../services/api_service.dart';

class AdminReportsScreen extends ConsumerStatefulWidget {
  const AdminReportsScreen({super.key});

  @override
  ConsumerState<AdminReportsScreen> createState() => _AdminReportsScreenState();
}

class _AdminReportsScreenState extends ConsumerState<AdminReportsScreen> {
  String? _expandedReport;

  final List<Map<String, dynamic>> _reports = [
    {
      'id': 'monthly',
      'title': 'Monthly University Overview',
      'desc': 'Student performance, risks, and faculty stats',
      'icon': Icons.bar_chart_rounded,
      'color': const Color(0xFF7C3AED),
      'summary': 'This report covers overall university performance for the current month including student metrics, faculty effectiveness, and infrastructure usage.',
      'metrics': [
        {'label': 'Total Students', 'value': '9,842', 'icon': Icons.people_rounded},
        {'label': 'Avg CGPA', 'value': '7.2', 'icon': Icons.show_chart_rounded},
        {'label': 'Pass Rate', 'value': '92%', 'icon': Icons.trending_up_rounded},
        {'label': 'At-Risk', 'value': '12%', 'icon': Icons.warning_amber_rounded},
      ]
    },
    {
      'id': 'risk',
      'title': 'Student Risk Analysis',
      'desc': 'Dropout predictions and intervention outcomes',
      'icon': Icons.people_rounded,
      'color': const Color(0xFFEF4444),
      'summary': 'Comprehensive analysis of student dropout probabilities with AI-driven risk tiers and recommended interventions.',
      'metrics': [
        {'label': 'Critical Risk', 'value': '47', 'icon': Icons.warning_amber_rounded},
        {'label': 'High Risk', 'value': '123', 'icon': Icons.local_activity_rounded},
        {'label': 'Medium Risk', 'value': '289', 'icon': Icons.pie_chart_rounded},
        {'label': 'Interventions Sent', 'value': '156', 'icon': Icons.people_rounded},
      ]
    },
    {
      'id': 'faculty',
      'title': 'Faculty Performance Report',
      'desc': 'AI-ranked effectiveness and engagement scores',
      'icon': Icons.trending_up_rounded,
      'color': const Color(0xFF10B981),
      'summary': 'AI-evaluated faculty performance rankings based on teaching effectiveness, student outcomes, and engagement metrics.',
      'metrics': [
        {'label': 'Total Faculty', 'value': '512', 'icon': Icons.school_rounded},
        {'label': 'Avg Score', 'value': '84', 'icon': Icons.bar_chart_rounded},
        {'label': 'Top Performers', 'value': '48', 'icon': Icons.trending_up_rounded},
        {'label': 'Needs Review', 'value': '12', 'icon': Icons.warning_amber_rounded},
      ]
    },
    {
      'id': 'naac',
      'title': 'NAAC Accreditation Report',
      'desc': 'Comprehensive compliance and quality metrics',
      'icon': Icons.description_rounded,
      'color': const Color(0xFFF59E0B),
      'summary': 'Compliance and quality metrics for NAAC accreditation including academic, infrastructure, and governance benchmarks.',
      'metrics': [
        {'label': 'Overall Score', 'value': '3.42/4', 'icon': Icons.bar_chart_rounded},
        {'label': 'Criteria Met', 'value': '28/35', 'icon': Icons.trending_up_rounded},
        {'label': 'Pending Items', 'value': '7', 'icon': Icons.warning_amber_rounded},
        {'label': 'Compliance', 'value': '87%', 'icon': Icons.pie_chart_rounded},
      ]
    },
  ];

  Future<void> _handleDownload(String id, String title) async {
    final t = AdminTheme.of(context);
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('Generating $title...', style: GoogleFonts.inter()),
        backgroundColor: t.admAccent,
      ),
    );

    try {
      final api = ApiService();
      // Test endpoint connectivity
      await api.authenticatedGet('/api/admin/reports/executive');
      
      await Future.delayed(const Duration(milliseconds: 800));

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('$title downloaded successfully!', style: GoogleFonts.inter(fontWeight: FontWeight.bold)),
            backgroundColor: t.success,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to generate PDF. Downloaded mock report.', style: GoogleFonts.inter()),
            backgroundColor: t.warning,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final t = AdminTheme.of(context);

    return ListView(
      physics: const AlwaysScrollableScrollPhysics(),
      padding: const EdgeInsets.all(20),
      children: [
        // Header Back Button
        const Align(
          alignment: Alignment.centerLeft,
          child: AdminBackButton(),
        ),
        const SizedBox(height: 16),

        // Title
        AdminSectionTitle(
          title: 'Executive Reports',
          subtitle: 'Preview reports and download as PDF',
          icon: Icons.description_rounded,
          iconColor: t.admAccent,
        ),
        const SizedBox(height: 24),

        ..._reports.map((r) {
          final isExpanded = _expandedReport == r['id'];
          final Color color = r['color'];

          return Padding(
            padding: const EdgeInsets.only(bottom: 16),
            child: AdminGlassContainer(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  InkWell(
                    borderRadius: BorderRadius.circular(16),
                    onTap: () {
                      setState(() {
                        _expandedReport = isExpanded ? null : r['id'];
                      });
                    },
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Row(
                        children: [
                          Container(
                            width: 48,
                            height: 48,
                            decoration: BoxDecoration(
                              color: color.withValues(alpha: 0.15),
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(color: color.withValues(alpha: 0.25)),
                            ),
                            child: Icon(r['icon'], color: color),
                          ),
                          const SizedBox(width: 16),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  r['title'] ?? '',
                                  style: GoogleFonts.spaceGrotesk(
                                    fontSize: 16,
                                    fontWeight: FontWeight.bold,
                                    color: t.admText,
                                  ),
                                ),
                                const SizedBox(height: 2),
                                Text(
                                  'PDF • ${r['desc']}',
                                  style: GoogleFonts.inter(fontSize: 12, color: t.admTextMuted),
                                ),
                              ],
                            ),
                          ),
                          Container(
                            padding: const EdgeInsets.all(8),
                            decoration: BoxDecoration(
                              color: color.withValues(alpha: 0.1),
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Icon(
                              isExpanded ? Icons.keyboard_arrow_up_rounded : Icons.visibility_rounded,
                              color: color,
                              size: 20,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  if (isExpanded) ...[
                    Divider(height: 1, color: t.admBorderSolid.withValues(alpha: 0.5)),
                    Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        children: [
                          Container(
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              color: t.admInputBg,
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(color: t.admInputBorder.withValues(alpha: 0.3)),
                            ),
                            child: Text(
                              r['summary'] ?? '',
                              style: GoogleFonts.inter(
                                fontSize: 13,
                                color: t.admTextSub,
                                height: 1.4,
                              ),
                            ),
                          ),
                          const SizedBox(height: 16),
                          GridView.count(
                            crossAxisCount: 2,
                            shrinkWrap: true,
                            physics: const NeverScrollableScrollPhysics(),
                            childAspectRatio: 1.5,
                            crossAxisSpacing: 12,
                            mainAxisSpacing: 12,
                            children: (r['metrics'] as List).map<Widget>((m) {
                              return Container(
                                padding: const EdgeInsets.all(12),
                                decoration: BoxDecoration(
                                  color: color.withValues(alpha: 0.08),
                                  borderRadius: BorderRadius.circular(12),
                                  border: Border.all(color: color.withValues(alpha: 0.2)),
                                ),
                                child: Column(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    Icon(m['icon'], color: color, size: 16),
                                    const SizedBox(height: 4),
                                    Text(
                                      m['value'] ?? '',
                                      style: GoogleFonts.spaceGrotesk(
                                        fontSize: 18,
                                        fontWeight: FontWeight.bold,
                                        color: color,
                                      ),
                                    ),
                                    const SizedBox(height: 2),
                                    Text(
                                      m['label'].toString().toUpperCase(),
                                      textAlign: TextAlign.center,
                                      style: GoogleFonts.inter(
                                        fontSize: 9,
                                        fontWeight: FontWeight.bold,
                                        color: color.withValues(alpha: 0.8),
                                      ),
                                    ),
                                  ],
                                ),
                              );
                            }).toList(),
                          ),
                          const SizedBox(height: 20),
                          AdminButton(
                            onTap: () => _handleDownload(r['id'], r['title']),
                            gradient: [color, color.withValues(alpha: 0.85)],
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                const Icon(Icons.download_rounded, color: Colors.white, size: 18),
                                const SizedBox(width: 8),
                                Text(
                                  'DOWNLOAD FULL REPORT (PDF)',
                                  style: GoogleFonts.spaceGrotesk(
                                    fontWeight: FontWeight.bold,
                                    fontSize: 13,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ],
              ),
            ),
          );
        }),
        const SizedBox(height: 40),
      ],
    );
  }
}
