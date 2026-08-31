import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../providers/auth_provider.dart';
import '../../components/shared/notification_panel.dart';
import '../../components/teacher/teacher_ai_chatbot.dart';
import '../../theme/app_colors.dart';

class _TeacherNavItem {
  final String label;
  final String route;

  const _TeacherNavItem(this.label, this.route);
}

final _workspaceLinks = [
  const _TeacherNavItem('Dashboard', '/teacher'),
  const _TeacherNavItem('Students', '/teacher/students'),
  const _TeacherNavItem('Social Hub', '/teacher/social-desk'),
  const _TeacherNavItem('Assessments', '/teacher/assessments'),
  const _TeacherNavItem('Reports', '/teacher/reports'),
];

final _aiLinks = [
  const _TeacherNavItem('My Coaching', '/teacher/ai-insights'),
  const _TeacherNavItem('Student Analytics', '/teacher/behavior-analyzer'),
  const _TeacherNavItem('Risk Center', '/teacher/interventions'),
  const _TeacherNavItem('AI Content', '/teacher/ai-content'),
];

class TeacherLayout extends ConsumerStatefulWidget {
  final Widget child;

  const TeacherLayout({super.key, required this.child});

  @override
  ConsumerState<TeacherLayout> createState() => _TeacherLayoutState();
}

class _TeacherLayoutState extends ConsumerState<TeacherLayout> {
  bool _isAiMode = false;
  final ScrollController _scrollController = ScrollController();

  @override
  void dispose() {
    _scrollController.dispose();
    super.dispose();
  }

  void _showProfileMenu() {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (ctx) => Container(
        margin: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          border: Border.all(color: Colors.black, width: 4),
          boxShadow: const [BoxShadow(color: Colors.black, offset: Offset(4, 4))],
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Padding(
              padding: const EdgeInsets.all(16),
              child: Text(
                'Menu',
                style: GoogleFonts.spaceGrotesk(fontSize: 24, fontWeight: FontWeight.bold),
              ),
            ),
            const Divider(height: 1, thickness: 2, color: Colors.black),
            _buildMenuItem(Icons.person, 'My Profile', () {
              Navigator.pop(ctx);
              context.push('/teacher/profile');
            }),
            const Divider(height: 1, thickness: 2, color: Colors.black),
            _buildMenuItem(Icons.star, 'Teaching Effectiveness', () {
              Navigator.pop(ctx);
              context.push('/teacher/effectiveness');
            }),
            const Divider(height: 1, thickness: 2, color: Colors.black),
            _buildMenuItem(Icons.assignment, 'Coaching Report', () {
              Navigator.pop(ctx);
              context.push('/teacher/ai-insights');
            }),
            const Divider(height: 1, thickness: 2, color: Colors.black),
            _buildMenuItem(Icons.settings, 'Settings', () {
              Navigator.pop(ctx);
              context.push('/teacher/profile');
            }),
            const Divider(height: 1, thickness: 2, color: Colors.black),
            InkWell(
              onTap: () {
                Navigator.pop(ctx);
                ref.read(authProvider.notifier).logout();
                context.go('/login');
              },
              child: Container(
                padding: const EdgeInsets.all(16),
                color: AppColors.senseiPink.withValues(alpha: 0.2),
                child: Row(
                  children: [
                    const Icon(Icons.logout, color: Colors.red),
                    const SizedBox(width: 16),
                    Text('Logout', style: GoogleFonts.spaceGrotesk(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.red)),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildMenuItem(IconData icon, String title, VoidCallback onTap) {
    return InkWell(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          children: [
            Icon(icon, color: Colors.black),
            const SizedBox(width: 16),
            Text(title, style: GoogleFonts.spaceGrotesk(fontSize: 18, fontWeight: FontWeight.bold)),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authProvider);
    final userName = authState.user?.name ?? 'Faculty';
    final location = GoRouterState.of(context).matchedLocation;

    if (!_isAiMode && _aiLinks.any((l) => l.route == location)) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted) setState(() => _isAiMode = true);
      });
    } else if (_isAiMode && _workspaceLinks.any((l) => l.route == location)) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted) setState(() => _isAiMode = false);
      });
    }

    final currentLinks = _isAiMode ? _aiLinks : _workspaceLinks;

    return Scaffold(
      backgroundColor: AppColors.brutalBg,
      body: SafeArea(
        child: Stack(
          children: [
            Column(
              children: [
                _buildHeader(userName, authState.user?.role ?? 'teacher'),
                _buildTopNav(currentLinks, location),
                Expanded(child: widget.child),
              ],
            ),
            const TeacherAiChatbot(),
          ],
        ),
      ),
    );
  }

  Widget _buildHeader(String name, String userRole) {
    final initials = name.split(' ').map((w) => w.isNotEmpty ? w[0] : '').join('').take(2).toUpperCase();

    return Container(
      decoration: const BoxDecoration(
        color: AppColors.brutalBg,
        border: Border(bottom: BorderSide(color: AppColors.brutalBlack, width: 4)),
      ),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      child: Row(
        children: [
          GestureDetector(
            onTap: () => context.go('/teacher'),
            child: Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                color: AppColors.brutalistCyan,
                border: Border.all(color: AppColors.brutalBlack, width: 2),
                boxShadow: const [BoxShadow(color: AppColors.brutalBlack, offset: Offset(2, 2))],
              ),
              child: const Icon(Icons.menu_book, color: AppColors.brutalBlack, size: 20),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'SENSEI',
                  style: GoogleFonts.inter(
                    fontSize: 20,
                    fontWeight: FontWeight.w900,
                    color: AppColors.brutalBlack,
                    letterSpacing: 1,
                  ),
                ),
                Text(
                  'FACULTY PORTAL',
                  style: GoogleFonts.inter(
                    fontSize: 10,
                    fontWeight: FontWeight.bold,
                    letterSpacing: 2,
                    color: AppColors.brutalistCyan,
                  ),
                ),
              ],
            ),
          ),
          Expanded(
            child: Container(
              decoration: BoxDecoration(
                color: Colors.white,
                border: Border.all(color: AppColors.brutalBlack, width: 2),
                boxShadow: const [BoxShadow(color: AppColors.brutalBlack, offset: Offset(2, 2))],
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Expanded(
                    child: GestureDetector(
                      onTap: () => setState(() {
                        _isAiMode = false;
                        context.go('/teacher');
                      }),
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 8),
                        color: !_isAiMode ? AppColors.brutalistCyan : Colors.transparent,
                        child: FittedBox(
                          fit: BoxFit.scaleDown,
                          child: Text(
                            'WORKSPACE',
                            style: GoogleFonts.inter(
                              fontSize: 12,
                              fontWeight: FontWeight.w900,
                              color: AppColors.brutalBlack,
                            ),
                          ),
                        ),
                      ),
                    ),
                  ),
                  Expanded(
                    child: GestureDetector(
                      onTap: () => setState(() {
                        _isAiMode = true;
                        context.go('/teacher/ai-insights');
                      }),
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 8),
                        color: _isAiMode ? AppColors.brutalistCyan : Colors.transparent,
                        child: FittedBox(
                          fit: BoxFit.scaleDown,
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(Icons.auto_awesome, size: 14, color: AppColors.brutalBlack),
                              const SizedBox(width: 4),
                              Text(
                                'AI MODE',
                                style: GoogleFonts.inter(
                                  fontSize: 12,
                                  fontWeight: FontWeight.w900,
                                  color: AppColors.brutalBlack,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
          if (MediaQuery.of(context).size.width >= 600) ...[
            const SizedBox(width: 8),
            NotificationPanel(userRole: userRole),
            const SizedBox(width: 8),
          ],
          if (MediaQuery.of(context).size.width < 600) ...[
            const SizedBox(width: 8),
            NotificationPanel(userRole: userRole),
          ],
          GestureDetector(
            onTap: _showProfileMenu,
            child: Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                color: Colors.white,
                border: Border.all(color: AppColors.brutalBlack, width: 2),
                boxShadow: const [BoxShadow(color: AppColors.brutalBlack, offset: Offset(2, 2))],
              ),
              child: Center(
                child: Text(
                  initials.isEmpty ? 'F' : initials,
                  style: GoogleFonts.inter(fontWeight: FontWeight.w900, fontSize: 16, color: AppColors.brutalBlack),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTopNav(List<_TeacherNavItem> links, String location) {
    return Container(
      decoration: const BoxDecoration(
        color: AppColors.brutalBg, // Light blue/white bg
        border: Border(bottom: BorderSide(color: AppColors.brutalBlack, width: 4)),
      ),
      child: SizedBox(
        height: 64,
        child: ListView.builder(
          controller: _scrollController,
          scrollDirection: Axis.horizontal,
          itemCount: links.length,
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
          itemBuilder: (context, index) {
            final item = links[index];
            final isActive = location == item.route || location.startsWith('${item.route}/');

            return GestureDetector(
              onTap: () => context.go(item.route),
              child: Container(
                margin: const EdgeInsets.only(right: 12),
                padding: const EdgeInsets.symmetric(horizontal: 16),
                decoration: BoxDecoration(
                  color: isActive ? AppColors.brutalistCyan : Colors.white,
                  border: Border.all(color: AppColors.brutalBlack, width: 3),
                  boxShadow: const [BoxShadow(color: AppColors.brutalBlack, offset: Offset(2, 2))],
                ),
                alignment: Alignment.center,
                child: Text(
                  item.label.toUpperCase(),
                  style: GoogleFonts.inter(
                    fontSize: 14,
                    fontWeight: FontWeight.w900,
                    letterSpacing: 1,
                    color: AppColors.brutalBlack,
                  ),
                ),
              ),
            );
          },
        ),
      ),
    );
  }
}

extension StringExtension on String {
  String take(int length) {
    if (this.length <= length) return this;
    return substring(0, length);
  }
}
