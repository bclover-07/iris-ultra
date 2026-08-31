import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../theme/admin_theme.dart';
import '../../theme/admin_glass_widgets.dart';
import '../../services/api_service.dart';

class AnalyticsScreen extends ConsumerStatefulWidget {
  const AnalyticsScreen({super.key});

  @override
  ConsumerState<AnalyticsScreen> createState() => _AnalyticsScreenState();
}

class _AnalyticsScreenState extends ConsumerState<AnalyticsScreen> {
  List<dynamic> _overview = [];
  bool _isLoading = true;
  String? _selectedDept;
  List<dynamic> _deptStudents = [];
  bool _fetchingStudents = false;

  final List<Color> _deptColors = [
    const Color(0xFF7C3AED),
    const Color(0xFF3B82F6),
    const Color(0xFF10B981),
    const Color(0xFFF59E0B),
    const Color(0xFFF43F5E),
    const Color(0xFF8B5CF6),
  ];

  @override
  void initState() {
    super.initState();
    _fetchOverview();
  }

  Future<void> _fetchOverview() async {
    try {
      final api = ApiService();
      final data = await api.authenticatedGet('/api/admin/analytics/overview');
      if (mounted) {
        setState(() {
          _overview = data?['overview'] ?? [];
          if (_overview.isEmpty) _overview = _mockOverview;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _overview = _mockOverview;
          _isLoading = false;
        });
      }
    }
  }

  Future<void> _fetchDeptStudents(String dept) async {
    setState(() {
      _selectedDept = dept;
      _fetchingStudents = true;
      _deptStudents = [];
    });
    try {
      final api = ApiService();
      final data = await api.authenticatedGet('/api/admin/users?department=$dept&role=student&limit=100');
      if (mounted) {
        setState(() {
          _deptStudents = data?['users'] ?? [];
          if (_deptStudents.isEmpty) _deptStudents = _mockDeptStudents;
          _fetchingStudents = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _deptStudents = _mockDeptStudents;
          _fetchingStudents = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final t = AdminTheme.of(context);

    return _isLoading
        ? Center(child: CircularProgressIndicator(color: t.admAccent))
        : Stack(
            children: [
              RefreshIndicator(
                onRefresh: _fetchOverview,
                color: t.admAccent,
                child: ListView(
                  physics: const AlwaysScrollableScrollPhysics(),
                  padding: const EdgeInsets.all(20),
                  children: [
                    // Header back button
                    const Align(
                      alignment: Alignment.centerLeft,
                      child: AdminBackButton(),
                    ),
                    const SizedBox(height: 16),

                    // Title
                    AdminSectionTitle(
                      title: 'University Analytics',
                      subtitle: 'Cross-department performance insights',
                      icon: Icons.bar_chart_rounded,
                      iconColor: t.admAccent,
                    ),
                    const SizedBox(height: 24),

                    // Department Grid
                    GridView.builder(
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                        crossAxisCount: 2,
                        crossAxisSpacing: 14,
                        mainAxisSpacing: 14,
                        childAspectRatio: 0.85,
                      ),
                      itemCount: _overview.length,
                      itemBuilder: (context, index) {
                        final dept = _overview[index];
                        final color = _deptColors[index % _deptColors.length];
                        return GestureDetector(
                          onTap: () => _fetchDeptStudents(dept['department']),
                          child: AdminGlassContainer(
                            padding: const EdgeInsets.all(16),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  children: [
                                    Container(
                                      width: 36,
                                      height: 36,
                                      decoration: BoxDecoration(
                                        color: color.withValues(alpha: 0.15),
                                        borderRadius: BorderRadius.circular(10),
                                        border: Border.all(color: color.withValues(alpha: 0.3)),
                                      ),
                                      alignment: Alignment.center,
                                      child: Text(
                                        dept['department'].toString().substring(0, 1).toUpperCase(),
                                        style: GoogleFonts.spaceGrotesk(
                                          color: color,
                                          fontWeight: FontWeight.bold,
                                          fontSize: 16,
                                        ),
                                      ),
                                    ),
                                    const Spacer(),
                                    Icon(Icons.arrow_forward_ios_rounded, color: t.admTextMuted, size: 14),
                                  ],
                                ),
                                const Spacer(),
                                Text(
                                  dept['department'] ?? '',
                                  style: GoogleFonts.spaceGrotesk(
                                    fontWeight: FontWeight.bold,
                                    color: t.admText,
                                    fontSize: 15,
                                  ),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                                const SizedBox(height: 12),
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          'STUDENTS',
                                          style: GoogleFonts.inter(
                                            fontSize: 9,
                                            color: t.admTextMuted,
                                            fontWeight: FontWeight.bold,
                                          ),
                                        ),
                                        const SizedBox(height: 2),
                                        Text(
                                          '${dept['students']}',
                                          style: GoogleFonts.spaceGrotesk(
                                            fontSize: 18,
                                            fontWeight: FontWeight.bold,
                                            color: t.admText,
                                          ),
                                        ),
                                      ],
                                    ),
                                    Column(
                                      crossAxisAlignment: CrossAxisAlignment.end,
                                      children: [
                                        Text(
                                          'AVG CGPA',
                                          style: GoogleFonts.inter(
                                            fontSize: 9,
                                            color: t.admTextMuted,
                                            fontWeight: FontWeight.bold,
                                          ),
                                        ),
                                        const SizedBox(height: 2),
                                        Text(
                                          '${dept['avgCgpa']}',
                                          style: GoogleFonts.spaceGrotesk(
                                            fontSize: 18,
                                            fontWeight: FontWeight.bold,
                                            color: color,
                                          ),
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
                    const SizedBox(height: 20),

                    // CGPA Chart Alternative (Bar visualization using containers)
                    AdminGlassContainer(
                      padding: const EdgeInsets.all(20),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'CGPA Comparison',
                            style: GoogleFonts.spaceGrotesk(
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                              color: t.admText,
                            ),
                          ),
                          const SizedBox(height: 24),
                          SizedBox(
                            height: 200,
                            child: Row(
                              crossAxisAlignment: CrossAxisAlignment.end,
                              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                              children: _overview.asMap().entries.map((entry) {
                                final i = entry.key;
                                final dept = entry.value;
                                final color = _deptColors[i % _deptColors.length];
                                const maxCgpa = 10.0;
                                final heightFactor = (dept['avgCgpa'] as num) / maxCgpa;

                                return Column(
                                  mainAxisAlignment: MainAxisAlignment.end,
                                  children: [
                                    Text(
                                      '${dept['avgCgpa']}',
                                      style: GoogleFonts.inter(
                                        fontSize: 10,
                                        fontWeight: FontWeight.bold,
                                        color: t.admText,
                                      ),
                                    ),
                                    const SizedBox(height: 4),
                                    Container(
                                      width: 28,
                                      height: 140 * heightFactor,
                                      decoration: BoxDecoration(
                                        gradient: LinearGradient(
                                          colors: [color, color.withValues(alpha: 0.7)],
                                          begin: Alignment.topCenter,
                                          end: Alignment.bottomCenter,
                                        ),
                                        borderRadius: const BorderRadius.vertical(top: Radius.circular(6)),
                                        boxShadow: [
                                          BoxShadow(
                                            color: color.withValues(alpha: 0.25),
                                            blurRadius: 4,
                                            offset: const Offset(0, 1),
                                          ),
                                        ],
                                      ),
                                    ),
                                    const SizedBox(height: 8),
                                    Text(
                                      dept['department'].toString().substring(0, 3).toUpperCase(),
                                      style: GoogleFonts.inter(fontSize: 10, color: t.admTextMuted),
                                    ),
                                  ],
                                );
                              }).toList(),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 60),
                  ],
                ),
              ),

              // Student Modal Overlay
              if (_selectedDept != null)
                Positioned.fill(
                  child: Container(
                    color: Colors.black54,
                    alignment: Alignment.center,
                    child: Padding(
                      padding: const EdgeInsets.all(24),
                      child: AdminGlassContainer(
                        padding: EdgeInsets.zero,
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Padding(
                              padding: const EdgeInsets.all(16),
                              child: Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          _selectedDept!,
                                          style: GoogleFonts.spaceGrotesk(
                                            fontSize: 18,
                                            fontWeight: FontWeight.bold,
                                            color: t.admText,
                                          ),
                                          maxLines: 1,
                                          overflow: TextOverflow.ellipsis,
                                        ),
                                        Text(
                                          'Department Registry',
                                          style: GoogleFonts.inter(
                                            fontSize: 12,
                                            color: t.admTextMuted,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                  IconButton(
                                    icon: Icon(Icons.close_rounded, color: t.admText),
                                    onPressed: () => setState(() => _selectedDept = null),
                                  ),
                                ],
                              ),
                            ),
                            Divider(height: 1, color: t.admBorderSolid.withValues(alpha: 0.5)),
                            SizedBox(
                              height: 300,
                              child: _fetchingStudents
                                  ? Center(child: CircularProgressIndicator(color: t.admAccent))
                                  : _deptStudents.isEmpty
                                      ? Center(
                                          child: Text(
                                            'No students found.',
                                            style: GoogleFonts.inter(color: t.admTextMuted),
                                          ),
                                        )
                                      : ListView.builder(
                                          padding: const EdgeInsets.all(16),
                                          itemCount: _deptStudents.length,
                                          itemBuilder: (context, i) {
                                            final s = _deptStudents[i];
                                            return Container(
                                              margin: const EdgeInsets.only(bottom: 12),
                                              padding: const EdgeInsets.all(12),
                                              decoration: BoxDecoration(
                                                color: t.admInputBg,
                                                borderRadius: BorderRadius.circular(12),
                                                border: Border.all(
                                                  color: t.admInputBorder.withValues(alpha: 0.3),
                                                ),
                                              ),
                                              child: Row(
                                                children: [
                                                  CircleAvatar(
                                                    backgroundColor: t.admAccentLight,
                                                    child: Text(
                                                      s['name']?[0]?.toUpperCase() ?? 'S',
                                                      style: TextStyle(color: t.admAccent, fontWeight: FontWeight.bold),
                                                    ),
                                                  ),
                                                  const SizedBox(width: 12),
                                                  Expanded(
                                                    child: Column(
                                                      crossAxisAlignment: CrossAxisAlignment.start,
                                                      children: [
                                                        Text(
                                                          s['name'] ?? '',
                                                          style: GoogleFonts.inter(
                                                            fontWeight: FontWeight.bold,
                                                            color: t.admText,
                                                          ),
                                                        ),
                                                        Text(
                                                          '${s['studentId'] ?? ''} • ${s['email'] ?? ''}',
                                                          style: GoogleFonts.inter(
                                                            fontSize: 10,
                                                            color: t.admTextMuted,
                                                          ),
                                                        ),
                                                      ],
                                                    ),
                                                  ),
                                                ],
                                              ),
                                            );
                                          },
                                        ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                ),
            ],
          );
  }
}

final List<Map<String, dynamic>> _mockOverview = [
  {'department': 'Computer Science', 'students': 342, 'avgCgpa': 8.4},
  {'department': 'Mechanical', 'students': 210, 'avgCgpa': 7.6},
  {'department': 'Civil', 'students': 150, 'avgCgpa': 7.2},
  {'department': 'Electronics', 'students': 280, 'avgCgpa': 8.1},
];

final List<Map<String, dynamic>> _mockDeptStudents = [
  {'_id': '1', 'name': 'John Doe', 'studentId': 'CS001', 'email': 'john.doe@university.edu'},
  {'_id': '2', 'name': 'Jane Smith', 'studentId': 'CS002', 'email': 'jane.smith@university.edu'},
];
