import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:go_router/go_router.dart';
import '../../services/api_service.dart';
import '../../services/socket_service.dart';
import '../../providers/auth_provider.dart';
import '../../theme/app_colors.dart';
import '../../theme/neubrutalist_widgets.dart';
import '../../utils/socket_namespace.dart';

class TeacherDashboardScreen extends ConsumerStatefulWidget {
  const TeacherDashboardScreen({super.key});

  @override
  ConsumerState<TeacherDashboardScreen> createState() => _TeacherDashboardScreenState();
}

class _TeacherDashboardScreenState extends ConsumerState<TeacherDashboardScreen> {
  bool _isLoading = true;
  String? _error;
  Map<String, dynamic>? _dashData;
  List<dynamic> _classes = [];
  int _helpCount = 0;
  int _pollCount = 0;

  @override
  void initState() {
    super.initState();
    _fetchDashboardData();
    _setupSocketListener();
  }

  void _setupSocketListener() {
    final user = ref.read(authProvider).user;
    if (user == null) return;
    final namespace = socketNamespaceForRole(user.role);
    SocketService().connect(namespace: namespace, userId: user.id);
    SocketService().on(namespace, 'help:new_ticket', (_) {
      if (mounted) {
        setState(() => _helpCount++);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('New help ticket received!'), behavior: SnackBarBehavior.floating),
        );
        _fetchDashboardData();
      }
    });
  }

  @override
  void dispose() {
    final user = ref.read(authProvider).user;
    if (user != null) {
      SocketService().off(socketNamespaceForRole(user.role), 'help:new_ticket');
    }
    super.dispose();
  }

  Future<void> _fetchDashboardData() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });
    try {
      final api = ApiService();
      final responses = await Future.wait([
        api.get('/api/teacher/dashboard'),
        api.get('/api/teacher/classes'),
      ]);

      if (mounted) {
        final dash = responses[0].data as Map<String, dynamic>?;
        final classData = responses[1].data;
        setState(() {
          _dashData = dash;
          _classes = classData is Map
              ? (classData['classes'] ?? [])
              : (classData is List ? classData : []);
          _helpCount = dash?['pendingHelpTickets'] ?? 0;
          _pollCount = dash?['pollActivity']?['active'] ?? 0;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = 'Failed to load dashboard. Check your connection and try again.';
          _isLoading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator(color: AppColors.brutalBlack));
    }

    if (_error != null) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text(_error!, textAlign: TextAlign.center, style: GoogleFonts.inter(fontWeight: FontWeight.bold)),
              const SizedBox(height: 16),
              ComicButton(label: 'Retry', backgroundColor: AppColors.brutalistCyan, onPressed: _fetchDashboardData),
            ],
          ),
        ),
      );
    }

    final totalStudents = _dashData?['totalStudents'] ?? 0;
    final atRiskCount = _dashData?['atRiskCount'] ?? 0;
    final criticalCount = _dashData?['criticalCount'] ?? 0;
    final effectivenessScore = _dashData?['effectivenessScore'] ?? 0;
    final classPassRate = _dashData?['classPassRate'] ?? 0;
    final recentInterventions = _dashData?['recentInterventions'] as List<dynamic>? ?? [];
    final teachingRecommendations = _dashData?['teachingRecommendations'] as List<dynamic>? ?? [];
    final teacherName = _dashData?['name']?.toString().split(' ').first ?? 'Faculty';
    final isDesktop = MediaQuery.of(context).size.width >= 1024;

    return RefreshIndicator(
      onRefresh: _fetchDashboardData,
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.all(32),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Welcome, $teacherName! ✦',
                        style: GoogleFonts.inter(
                          fontSize: isDesktop ? 48 : 32,
                          fontWeight: FontWeight.w900,
                          color: AppColors.brutalBlack,
                          letterSpacing: -1,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'Your AI copilot for smarter teaching',
                        style: GoogleFonts.patrickHand(fontSize: 24, color: Colors.grey.shade800),
                      ),
                    ],
                  ),
                ),
                if (isDesktop)
                  ComicButton(
                    label: '📅 ${DateTime.now().toString().split(' ')[0]}',
                    backgroundColor: Colors.white,
                  ),
              ],
            ),
            const SizedBox(height: 32),
            Wrap(
              spacing: 16,
              runSpacing: 16,
              children: [
                _buildKpiCard('My Classes', '${_classes.length}', 'Active Classes', AppColors.brutalWhite, rotation: -0.5, onTap: () => context.go('/teacher/students')),
                _buildKpiCard('Students', '$totalStudents', 'Across all classes', AppColors.brutalistCyan, rotation: 0.5, onTap: () => context.go('/teacher/students')),
                _buildKpiCard('At Risk', '$atRiskCount', '$criticalCount critical', AppColors.brutalWhite, urgent: atRiskCount > 0, rotation: -0.5, onTap: () => context.go('/teacher/interventions')),
                _buildKpiCard('Effectiveness', '$effectivenessScore%', '$classPassRate% pass rate', AppColors.brutalistCyan, rotation: 0.5, onTap: () => context.go('/teacher/effectiveness')),
                _buildKpiCard('Help Tickets', '$_helpCount', 'Pending responses', AppColors.brutalistCyan, rotation: -0.5, onTap: () => context.go('/teacher/social-desk')),
              ],
            ),
            const SizedBox(height: 32),
            if (isDesktop)
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(flex: 8, child: _buildMainContent(recentInterventions)),
                  const SizedBox(width: 24),
                  Expanded(flex: 4, child: _buildRightPanel(teachingRecommendations, recentInterventions.length)),
                ],
              )
            else
              Column(
                children: [
                  _buildMainContent(recentInterventions),
                  const SizedBox(height: 32),
                  _buildRightPanel(teachingRecommendations, recentInterventions.length),
                ],
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildKpiCard(String title, String value, String subtitle, Color color, {bool urgent = false, double rotation = 0.0, VoidCallback? onTap}) {
    final screenWidth = MediaQuery.of(context).size.width;
    final isDesktop = screenWidth >= 1024;
    final cardWidth = isDesktop ? 220.0 : (screenWidth < 450 ? screenWidth - 70 : screenWidth / 2 - 44);

    return GestureDetector(
      onTap: onTap,
      child: Transform.rotate(
        angle: rotation * 3.14159 / 180,
        child: Container(
          width: cardWidth,
          constraints: const BoxConstraints(minHeight: 120),
          decoration: BoxDecoration(
            color: color,
            border: Border.all(color: AppColors.brutalBlack, width: 4),
            boxShadow: const [BoxShadow(color: AppColors.brutalBlack, offset: Offset(4, 4))],
          ),
          padding: const EdgeInsets.all(12),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(
                    child: FittedBox(
                      fit: BoxFit.scaleDown,
                      alignment: Alignment.centerLeft,
                      child: Text(value, style: GoogleFonts.inter(fontSize: 48, fontWeight: FontWeight.w900, color: AppColors.brutalBlack, height: 1)),
                    ),
                  ),
                  if (urgent)
                    Container(
                      width: 12,
                      height: 12,
                      margin: const EdgeInsets.only(left: 8),
                      decoration: const BoxDecoration(color: Colors.redAccent, shape: BoxShape.circle),
                    ),
                ],
              ),
              const SizedBox(height: 12),
              Container(width: double.infinity, height: 2, color: AppColors.brutalBlack, margin: const EdgeInsets.only(bottom: 8)),
              Text(title.toUpperCase(), style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w900, letterSpacing: 1)),
              const SizedBox(height: 4),
              Text(subtitle, style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.bold), maxLines: 2, overflow: TextOverflow.ellipsis),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildMainContent(List<dynamic> recentInterventions) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        BrutalistCard(
          backgroundColor: AppColors.brutalWhite,
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('My Classes Overview', style: GoogleFonts.inter(fontSize: 24, fontWeight: FontWeight.w900)),
                      Text('${_classes.length} active classes this semester', style: GoogleFonts.inter(fontSize: 12, color: Colors.grey.shade700)),
                    ],
                  ),
                  ComicButton(label: 'View All →', backgroundColor: Colors.white, onPressed: () => context.go('/teacher/students')),
                ],
              ),
              const SizedBox(height: 24),
              if (_classes.isEmpty)
                const Center(child: Padding(padding: EdgeInsets.all(32), child: Text('No classes yet. Add a class from the Students screen.', style: TextStyle(fontWeight: FontWeight.bold))))
              else
                LayoutBuilder(
                  builder: (context, constraints) {
                    final crossAxisCount = constraints.maxWidth > 600 ? 2 : 1;
                    return GridView.builder(
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                        crossAxisCount: crossAxisCount,
                        crossAxisSpacing: 16,
                        mainAxisSpacing: 16,
                        childAspectRatio: 2.5,
                      ),
                      itemCount: _classes.length > 4 ? 4 : _classes.length,
                      itemBuilder: (context, index) {
                        final cls = _classes[index];
                        return BrutalistCard(
                          backgroundColor: AppColors.brutalistCyan,
                          padding: const EdgeInsets.all(16),
                          onTap: () => context.go('/teacher/students'),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Text(cls['name'] ?? 'Class', style: GoogleFonts.inter(fontSize: 18, fontWeight: FontWeight.w900), maxLines: 1, overflow: TextOverflow.ellipsis),
                              const SizedBox(height: 8),
                              Text('${cls['studentCount'] ?? 0} students', style: const TextStyle(fontWeight: FontWeight.bold)),
                            ],
                          ),
                        );
                      },
                    );
                  },
                ),
            ],
          ),
        ),
        if (recentInterventions.isNotEmpty) ...[
          const SizedBox(height: 32),
          Text('Recent Interventions', style: GoogleFonts.inter(fontSize: 24, fontWeight: FontWeight.w900)),
          const SizedBox(height: 16),
          ...recentInterventions.take(3).map((inv) => Padding(
            padding: const EdgeInsets.only(bottom: 12),
            child: BrutalistCard(
              backgroundColor: Colors.white,
              padding: const EdgeInsets.all(16),
              onTap: () => context.go('/teacher/interventions'),
              child: Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(inv['message'] ?? 'Intervention', style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.w900), maxLines: 1, overflow: TextOverflow.ellipsis),
                        Text('${inv['status']?.toString().toUpperCase()} · ${inv['createdAt']?.toString().split('T').first ?? ''}', style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.grey.shade600)),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          )),
        ],
      ],
    );
  }

  Widget _buildRightPanel(List<dynamic> recommendations, int interventionCount) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        BrutalistCard(
          backgroundColor: AppColors.brutalistCyan,
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text('AI Feed', style: GoogleFonts.inter(fontSize: 20, fontWeight: FontWeight.w900)),
                  if (recommendations.isNotEmpty)
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                      color: AppColors.brutalBlack,
                      child: Text('${recommendations.length} tips', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 10)),
                    ),
                ],
              ),
              const SizedBox(height: 16),
              if (recommendations.isEmpty)
                Text('No AI recommendations yet. Visit My Coaching to generate insights.', style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.bold))
              else
                ...recommendations.take(3).map((rec) => Padding(
                  padding: const EdgeInsets.only(bottom: 12),
                  child: Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(color: Colors.white, border: Border.all(color: AppColors.brutalBlack, width: 3)),
                    child: Text(rec.toString(), style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.bold)),
                  ),
                )),
              const SizedBox(height: 16),
              ComicButton(label: 'VIEW ALL AI FEED →', backgroundColor: Colors.white, onPressed: () => context.go('/teacher/ai-insights')),
            ],
          ),
        ),
        const SizedBox(height: 24),
        BrutalistCard(
          backgroundColor: AppColors.brutalistCyan,
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Quick Actions', style: GoogleFonts.inter(fontSize: 20, fontWeight: FontWeight.w900)),
              const SizedBox(height: 16),
              GridView.count(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                crossAxisCount: MediaQuery.of(context).size.width > 400 ? 2 : 1,
                crossAxisSpacing: 12,
                mainAxisSpacing: 12,
                childAspectRatio: MediaQuery.of(context).size.width < 400 ? 2.5 : 1.5,
                children: [
                  _buildActionBtn('Upload CSV', Icons.upload, () => context.go('/teacher/assessments')),
                  _buildActionBtn('Help Queue', Icons.help_outline, () => context.go('/teacher/social-desk')),
                  _buildActionBtn('View Students', Icons.people_outline, () => context.go('/teacher/students')),
                  _buildActionBtn('Behavior Analysis', Icons.show_chart, () => context.go('/teacher/behavior-analyzer')),
                  _buildActionBtn('Create Poll', Icons.bar_chart, () => context.go('/teacher/social-desk')),
                  _buildActionBtn('Interventions', Icons.chat_bubble_outline, () => context.go('/teacher/interventions')),
                ],
              ),
            ],
          ),
        ),
        const SizedBox(height: 24),
        BrutalistCard(
          backgroundColor: AppColors.brutalistRed,
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Activity', style: GoogleFonts.inter(fontSize: 20, fontWeight: FontWeight.w900)),
              const SizedBox(height: 16),
              _buildActivityItem('$_helpCount', 'Pending Help Tickets', 'Students need your help'),
              const SizedBox(height: 12),
              _buildActivityItem('$_pollCount', 'Active Polls', 'Live student surveys'),
              const SizedBox(height: 12),
              _buildActivityItem('$interventionCount', 'Recent Actions', 'Interventions logged'),
              const SizedBox(height: 16),
              ComicButton(label: 'VIEW HELP QUEUE →', backgroundColor: Colors.white, onPressed: () => context.go('/teacher/social-desk')),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildActionBtn(String label, IconData icon, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          border: Border.all(color: AppColors.brutalBlack, width: 3),
          boxShadow: const [BoxShadow(color: AppColors.brutalBlack, offset: Offset(4, 4))],
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, size: 24, color: AppColors.brutalistCyan),
            const SizedBox(height: 8),
            Text(label, style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w900), textAlign: TextAlign.center),
          ],
        ),
      ),
    );
  }

  Widget _buildActivityItem(String count, String title, String subtitle) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(8),
      decoration: BoxDecoration(
        color: Colors.white,
        border: Border.all(color: AppColors.brutalBlack, width: 3),
      ),
      child: Row(
        children: [
          Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(border: Border.all(color: AppColors.brutalBlack, width: 2)),
            child: Center(child: Text(count, style: GoogleFonts.inter(fontSize: 20, fontWeight: FontWeight.w900, color: AppColors.brutalistCyan))),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w900)),
                Text(subtitle, style: GoogleFonts.inter(fontSize: 12, color: Colors.grey.shade600)),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
