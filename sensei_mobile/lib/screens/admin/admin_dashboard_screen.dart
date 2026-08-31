import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:go_router/go_router.dart';
import '../../theme/admin_theme.dart';
import '../../theme/admin_glass_widgets.dart';
import '../../services/api_service.dart';

class AdminDashboardScreen extends ConsumerStatefulWidget {
  const AdminDashboardScreen({super.key});

  @override
  ConsumerState<AdminDashboardScreen> createState() => _AdminDashboardScreenState();
}

class _AdminDashboardScreenState extends ConsumerState<AdminDashboardScreen> {
  Map<String, dynamic> _stats = {
    'totalStudents': 9842,
    'totalTeachers': 512,
    'totalClasses': 642,
    'passRate': 92,
  };
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _fetchDashboard();
  }

  Future<void> _fetchDashboard() async {
    try {
      final api = ApiService();
      final data = await api.authenticatedGet('/api/admin/dashboard');
      if (mounted && data != null) {
        final u = data['university'] ?? {};
        final p = data['performance'] ?? {};
        setState(() {
          _stats = {
            'totalStudents': u['totalStudents'] ?? 9842,
            'totalTeachers': u['totalTeachers'] ?? 512,
            'totalClasses': u['totalClasses'] ?? 642,
            'passRate': p['passRate'] ?? 92,
          };
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final t = AdminTheme.of(context);

    return RefreshIndicator(
      color: t.admAccent,
      onRefresh: _fetchDashboard,
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Page header
            Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Text(
                            'Overview',
                            style: GoogleFonts.spaceGrotesk(
                              fontSize: 28,
                              fontWeight: FontWeight.w900,
                              color: t.admText,
                              letterSpacing: -0.5,
                            ),
                          ),
                          const SizedBox(width: 6),
                          const Text('👑', style: TextStyle(fontSize: 22)),
                        ],
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'University metrics and system health',
                        style: GoogleFonts.inter(fontSize: 13, color: t.admTextMuted),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 24),

            // Stat Cards Grid
            if (_isLoading)
              _buildLoadingGrid(t)
            else
              GridView.count(
                crossAxisCount: 2,
                crossAxisSpacing: 14,
                mainAxisSpacing: 14,
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                childAspectRatio: 0.9,
                children: [
                  _StatCard(
                    label: 'Total Students',
                    value: _stats['totalStudents'].toString(),
                    icon: Icons.people_alt_rounded,
                    bgColor: t.stat1Bg,
                    accentColor: t.stat1Accent,
                    trend: '6.2%',
                    trendUp: true,
                    onTap: () => context.push('/admin/users'),
                  ),
                  _StatCard(
                    label: 'Faculty Members',
                    value: _stats['totalTeachers'].toString(),
                    icon: Icons.school_rounded,
                    bgColor: t.stat2Bg,
                    accentColor: t.stat2Accent,
                    trend: '3.4%',
                    trendUp: true,
                    onTap: () => context.push('/admin/faculty'),
                  ),
                  _StatCard(
                    label: 'Active Courses',
                    value: _stats['totalClasses'].toString(),
                    icon: Icons.menu_book_rounded,
                    bgColor: t.stat3Bg,
                    accentColor: t.stat3Accent,
                    trend: '7.1%',
                    trendUp: true,
                    onTap: () => context.push('/admin/curriculum'),
                  ),
                  _StatCard(
                    label: 'System Health',
                    value: '${_stats['passRate']}%',
                    icon: Icons.monitor_heart_rounded,
                    bgColor: t.stat4Bg,
                    accentColor: t.stat4Accent,
                    trend: 'Stable',
                    trendUp: true,
                    onTap: () => context.push('/admin/system'),
                  ),
                ],
              ),

            const SizedBox(height: 24),

            // Campus Map Placeholder
            AdminGlassContainer(
              padding: const EdgeInsets.all(16),
              height: 220,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'Live Campus Map',
                        style: GoogleFonts.spaceGrotesk(
                          fontSize: 17,
                          fontWeight: FontWeight.bold,
                          color: t.admText,
                        ),
                      ),
                      Icon(Icons.map_outlined, color: t.admTextMuted, size: 20),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Expanded(
                    child: Container(
                      decoration: BoxDecoration(
                        color: t.admSurfaceRaised,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: t.admBorderSolid.withValues(alpha: 0.3)),
                      ),
                      child: Center(
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(Icons.satellite_alt_rounded, size: 36, color: t.admTextMuted.withValues(alpha: 0.5)),
                            const SizedBox(height: 8),
                            Text(
                              'Map Interface Rendering...',
                              style: GoogleFonts.inter(color: t.admTextMuted, fontSize: 12),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 28),

            // Quick Actions
            Text(
              'Quick Actions',
              style: GoogleFonts.spaceGrotesk(
                fontSize: 22,
                fontWeight: FontWeight.bold,
                color: t.admText,
              ),
            ),
            const SizedBox(height: 14),
            GridView.count(
              crossAxisCount: 2,
              crossAxisSpacing: 12,
              mainAxisSpacing: 12,
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              childAspectRatio: 2.6,
              children: [
                _QuickActionBtn(label: 'Users', icon: Icons.people, route: '/admin/users', color: t.stat1Accent, t: t),
                _QuickActionBtn(label: 'Faculty', icon: Icons.school, route: '/admin/faculty', color: t.stat2Accent, t: t),
                _QuickActionBtn(label: 'Curriculum', icon: Icons.menu_book, route: '/admin/curriculum', color: t.stat3Accent, t: t),
                _QuickActionBtn(label: 'Analytics', icon: Icons.bar_chart, route: '/admin/analytics', color: t.admAccent, t: t),
                _QuickActionBtn(label: 'Reports', icon: Icons.description, route: '/admin/reports', color: t.stat4Accent, t: t),
                _QuickActionBtn(label: 'Bulk Import', icon: Icons.upload_file, route: '/admin/bulk-import', color: t.stat2Accent, t: t),
                _QuickActionBtn(label: 'Resources', icon: Icons.bolt, route: '/admin/resource-optimizer', color: t.stat3Accent, t: t),
                _QuickActionBtn(label: 'System', icon: Icons.dns, route: '/admin/system', color: t.admAccent, t: t),
              ],
            ),
            const SizedBox(height: 32),
          ],
        ),
      ),
    );
  }

  Widget _buildLoadingGrid(AdminThemeColors t) {
    return GridView.count(
      crossAxisCount: 2,
      crossAxisSpacing: 14,
      mainAxisSpacing: 14,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      childAspectRatio: 0.9,
      children: List.generate(4, (_) => Container(
        decoration: BoxDecoration(
          color: t.admSurface,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: t.admBorderSolid),
        ),
        child: Center(
          child: CircularProgressIndicator(
            strokeWidth: 2,
            color: t.admAccent.withValues(alpha: 0.4),
          ),
        ),
      )),
    );
  }
}

class _StatCard extends StatelessWidget {
  final String label;
  final String value;
  final IconData icon;
  final Color bgColor;
  final Color accentColor;
  final String trend;
  final bool trendUp;
  final VoidCallback? onTap;

  const _StatCard({
    required this.label,
    required this.value,
    required this.icon,
    required this.bgColor,
    required this.accentColor,
    required this.trend,
    required this.trendUp,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final t = AdminTheme.of(context);

    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: t.admSurface,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: t.admBorderSolid),
          boxShadow: [
            BoxShadow(
              color: t.admShadow,
              blurRadius: 8,
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
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: bgColor,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Icon(icon, color: accentColor, size: 22),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: (trend == 'Stable' ? t.success : trendUp ? t.success : t.danger).withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    trend,
                    style: GoogleFonts.inter(
                      color: trend == 'Stable' ? t.success : trendUp ? t.success : t.danger,
                      fontSize: 11,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ],
            ),
            const Spacer(),
            Text(
              value,
              style: GoogleFonts.spaceGrotesk(
                fontSize: 28,
                fontWeight: FontWeight.bold,
                color: t.admText,
              ),
            ),
            const SizedBox(height: 2),
            Text(
              label,
              style: GoogleFonts.inter(
                fontSize: 12,
                color: t.admTextMuted,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _QuickActionBtn extends StatelessWidget {
  final String label;
  final IconData icon;
  final String route;
  final Color color;
  final AdminThemeColors t;

  const _QuickActionBtn({
    required this.label,
    required this.icon,
    required this.route,
    required this.color,
    required this.t,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () => context.push(route),
      child: Container(
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.08),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: color.withValues(alpha: 0.18)),
        ),
        padding: const EdgeInsets.symmetric(horizontal: 14),
        child: Row(
          children: [
            Icon(icon, color: color, size: 22),
            const SizedBox(width: 10),
            Expanded(
              child: Text(
                label,
                style: GoogleFonts.spaceGrotesk(
                  fontWeight: FontWeight.bold,
                  fontSize: 14,
                  color: t.admText,
                ),
              ),
            ),
            Icon(Icons.chevron_right, color: t.admTextMuted, size: 16),
          ],
        ),
      ),
    );
  }
}
