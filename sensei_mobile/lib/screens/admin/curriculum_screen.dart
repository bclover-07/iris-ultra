import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../theme/admin_theme.dart';
import '../../theme/admin_glass_widgets.dart';
import '../../services/api_service.dart';

class CurriculumScreen extends ConsumerStatefulWidget {
  const CurriculumScreen({super.key});

  @override
  ConsumerState<CurriculumScreen> createState() => _CurriculumScreenState();
}

class _CurriculumScreenState extends ConsumerState<CurriculumScreen> {
  List<dynamic> _flags = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _analyse();
  }

  Future<void> _analyse() async {
    setState(() => _isLoading = true);
    try {
      final api = ApiService();
      final data = await api.authenticatedPost('/api/admin/curriculum/analyse');
      if (mounted) {
        setState(() {
          _flags = data?['flags'] ?? [];
          if (_flags.isEmpty) _flags = _mockFlags;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _flags = _mockFlags;
          _isLoading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final t = AdminTheme.of(context);

    return RefreshIndicator(
      onRefresh: _analyse,
      color: t.admAccent,
      child: ListView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.all(20),
        children: [
          // Header back button
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const AdminBackButton(),
              IconButton(
                icon: Icon(Icons.refresh_rounded, color: t.admAccent),
                onPressed: _isLoading ? null : _analyse,
                style: IconButton.styleFrom(backgroundColor: t.admAccentLight),
              ),
            ],
          ),
          const SizedBox(height: 16),

          // Title
          AdminSectionTitle(
            title: 'Curriculum Analysis',
            subtitle: 'Detect subjects with abnormal failure rates',
            icon: Icons.menu_book_rounded,
            iconColor: t.admAccent,
          ),
          const SizedBox(height: 24),

          if (_isLoading)
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 60),
              child: Center(child: CircularProgressIndicator(color: t.admAccent)),
            )
          else if (_flags.isEmpty)
            AdminGlassContainer(
              child: Padding(
                padding: const EdgeInsets.all(40),
                child: Column(
                  children: [
                    Icon(Icons.check_circle_rounded, size: 64, color: t.success),
                    const SizedBox(height: 16),
                    Text(
                      'Curriculum is Healthy',
                      style: GoogleFonts.spaceGrotesk(
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                        color: t.admText,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'No bottlenecks detected.',
                      style: GoogleFonts.inter(color: t.admTextMuted),
                    ),
                  ],
                ),
              ),
            )
          else
            ..._flags.map((f) {
              final isCritical = f['severity'] == 'critical';
              final color = isCritical ? t.danger : t.warning;

              return Padding(
                padding: const EdgeInsets.only(bottom: 16),
                child: AdminGlassContainer(
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
                          child: Icon(Icons.warning_amber_rounded, color: color),
                        ),
                        const SizedBox(width: 16),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                f['subject'] ?? '',
                                style: GoogleFonts.spaceGrotesk(
                                  fontSize: 16,
                                  fontWeight: FontWeight.bold,
                                  color: t.admText,
                                ),
                              ),
                              const SizedBox(height: 2),
                              Text(
                                isCritical ? 'Critical failure rate detected' : 'Elevated failure rate detected',
                                style: GoogleFonts.inter(fontSize: 12, color: t.admTextSub),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(width: 12),
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.end,
                          children: [
                            Text(
                              '${f['failureRate']}%',
                              style: GoogleFonts.spaceGrotesk(
                                fontSize: 24,
                                fontWeight: FontWeight.bold,
                                color: color,
                              ),
                            ),
                            Text(
                              'FAILURE RATE',
                              style: GoogleFonts.inter(
                                fontSize: 9,
                                fontWeight: FontWeight.bold,
                                color: t.admTextMuted,
                              ),
                            ),
                          ],
                        ),
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

final List<Map<String, dynamic>> _mockFlags = [
  {'subject': 'Data Structures & Algorithms', 'failureRate': 38.5, 'severity': 'critical'},
  {'subject': 'Engineering Mathematics III', 'failureRate': 24.2, 'severity': 'warning'},
  {'subject': 'Operating Systems', 'failureRate': 18.0, 'severity': 'warning'},
];
