import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../providers/auth_provider.dart';
import '../../theme/app_colors.dart';

class _NavItem {
  final String label;
  final IconData icon;
  final String route;

  const _NavItem(this.label, this.icon, this.route);
}

final _navItems = [
  const _NavItem('Dashboard', Icons.dashboard_rounded, '/student'),
  const _NavItem('Mentor', Icons.psychology_rounded, '/student/mentor'),
  const _NavItem('Quizo', Icons.front_hand_rounded, '/student/quiz/camo'),
  const _NavItem('Focus', Icons.visibility_rounded, '/student/focus-guardian'),
  const _NavItem('Doubts', Icons.crop_free_rounded, '/student/doubt-solver'),
  const _NavItem('Plan', Icons.checklist_rounded, '/student/study-plan'),
  const _NavItem('Practice', Icons.gavel_rounded, '/student/practice-area'),
  const _NavItem('World', Icons.public_rounded, '/student/world'),
  const _NavItem('NPU', Icons.memory_rounded, '/student/npu-console'),
  const _NavItem('Journal', Icons.mic_rounded, '/student/voice-journal'),
  const _NavItem('Profile', Icons.person_rounded, '/student/profile'),
];

class StudentLayout extends ConsumerStatefulWidget {
  final Widget child;

  const StudentLayout({super.key, required this.child});

  @override
  ConsumerState<StudentLayout> createState() => _StudentLayoutState();
}

class _StudentLayoutState extends ConsumerState<StudentLayout> {
  int _currentIndex = 0;
  final ScrollController _scrollController = ScrollController();

  @override
  void dispose() {
    _scrollController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authProvider);
    final userName = authState.user?.name ?? 'Student';
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final location = GoRouterState.of(context).matchedLocation;

    int activeIndex = _navItems.indexWhere((item) => item.route == location);
    if (activeIndex == -1) activeIndex = 0;
    if (activeIndex != _currentIndex) {
      _currentIndex = activeIndex;
    }

    return Scaffold(
      backgroundColor: isDark ? AppColors.darkBg : AppColors.creamBg,
      body: SafeArea(
        child: Column(
          children: [
            _buildHeader(userName, isDark),
            Expanded(child: widget.child),
          ],
        ),
      ),
      bottomNavigationBar: _buildBottomNav(isDark),
    );
  }

  Widget _buildHeader(String name, bool isDark) {
    final theme = ref.watch(themeProvider);

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      child: Row(
        children: [
          Container(
            width: 46,
            height: 46,
            decoration: BoxDecoration(
              color: AppColors.popYellow,
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: isDark ? Colors.white : AppColors.brutalBlack, width: 2.5),
              boxShadow: [
                BoxShadow(
                  color: isDark ? Colors.white : AppColors.brutalBlack,
                  offset: const Offset(2.5, 2.5),
                  blurRadius: 0,
                ),
              ],
            ),
            child: Center(
              child: Text(
                name.isNotEmpty ? name[0].toUpperCase() : 'S',
                style: GoogleFonts.fredoka(
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                  color: AppColors.brutalBlack,
                ),
              ),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Hey, $name! 👋',
                  style: GoogleFonts.fredoka(
                    fontSize: 19,
                    fontWeight: FontWeight.bold,
                    color: isDark ? Colors.white : AppColors.brutalBlack,
                  ),
                ),
                Text(
                  'OBSERVED SIGNALS ACTIVE · NPU LIVE',
                  style: GoogleFonts.inter(
                    fontSize: 11,
                    fontWeight: FontWeight.bold,
                    letterSpacing: 1.1,
                    color: isDark ? Colors.white70 : Colors.black87,
                  ),
                ),
              ],
            ),
          ),
          GestureDetector(
            onTap: () => ref.read(themeProvider.notifier).toggleTheme(),
            child: Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                color: isDark ? AppColors.darkCard : Colors.white,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: isDark ? Colors.white : AppColors.brutalBlack, width: 2),
                boxShadow: const [
                  BoxShadow(color: AppColors.brutalBlack, offset: Offset(2, 2), blurRadius: 0),
                ],
              ),
              child: Icon(
                theme == ThemeMode.dark ? Icons.light_mode_rounded : Icons.dark_mode_rounded,
                size: 20,
                color: isDark ? AppColors.popYellow : AppColors.brutalBlack,
              ),
            ),
          ),
          const SizedBox(width: 8),
          GestureDetector(
            onTap: () => _showLogoutDialog(),
            child: Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                color: isDark ? AppColors.darkCard : Colors.white,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: AppColors.popCoral, width: 2),
                boxShadow: const [
                  BoxShadow(color: AppColors.brutalBlack, offset: Offset(2, 2), blurRadius: 0),
                ],
              ),
              child: const Icon(Icons.logout_rounded, size: 20, color: AppColors.popCoral),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBottomNav(bool isDark) {
    return Container(
      decoration: BoxDecoration(
        color: isDark ? AppColors.darkCard : Colors.white,
        border: Border(top: BorderSide(color: isDark ? Colors.white : AppColors.brutalBlack, width: 2.5)),
      ),
      child: SizedBox(
        height: 74,
        child: ListView.builder(
          controller: _scrollController,
          scrollDirection: Axis.horizontal,
          itemCount: _navItems.length,
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
          itemBuilder: (context, index) {
            final item = _navItems[index];
            final isActive = index == _currentIndex;

            return GestureDetector(
              onTap: () {
                setState(() => _currentIndex = index);
                context.go(item.route);
              },
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 200),
                width: 72,
                margin: const EdgeInsets.symmetric(horizontal: 3),
                padding: const EdgeInsets.symmetric(vertical: 4),
                decoration: BoxDecoration(
                  color: isActive ? AppColors.popYellow : Colors.transparent,
                  borderRadius: BorderRadius.circular(14),
                  border: isActive
                      ? Border.all(color: isDark ? Colors.white : AppColors.brutalBlack, width: 2.5)
                      : null,
                  boxShadow: isActive
                      ? [
                          BoxShadow(
                            color: isDark ? Colors.white : AppColors.brutalBlack,
                            offset: const Offset(2.5, 2.5),
                            blurRadius: 0,
                          )
                        ]
                      : null,
                ),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(
                      item.icon,
                      size: isActive ? 22 : 20,
                      color: isActive
                          ? AppColors.brutalBlack
                          : (isDark ? Colors.white70 : Colors.black87),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      item.label,
                      style: GoogleFonts.fredoka(
                        fontSize: 11,
                        fontWeight: isActive ? FontWeight.bold : FontWeight.w600,
                        color: isActive
                            ? AppColors.brutalBlack
                            : (isDark ? Colors.white70 : Colors.black87),
                      ),
                      textAlign: TextAlign.center,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ),
              ),
            );
          },
        ),
      ),
    );
  }

  void _showLogoutDialog() {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppColors.creamCard,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(20),
          side: const BorderSide(color: AppColors.brutalBlack, width: 3),
        ),
        title: Text('Logout', style: GoogleFonts.fredoka(fontWeight: FontWeight.bold, color: AppColors.brutalBlack)),
        content: Text('Are you sure you want to log out of SENSEI Ultra?', style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: Text('Cancel', style: GoogleFonts.fredoka(color: Colors.grey.shade700)),
          ),
          TextButton(
            onPressed: () {
              Navigator.pop(ctx);
              ref.read(authProvider.notifier).logout();
              context.go('/login');
            },
            child: Text('Logout', style: GoogleFonts.fredoka(color: AppColors.popCoral, fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }
}
