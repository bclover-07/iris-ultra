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
  const _NavItem('Mentor', Icons.smart_toy_rounded, '/student/chatbot'),
  const _NavItem('Beyond', Icons.rocket_launch_rounded, '/student/virtual-beyond'),
  const _NavItem('Study', Icons.auto_awesome_rounded, '/student/ultra-study'),
  const _NavItem('Overcome', Icons.fitness_center_rounded, '/student/overcome'),
  const _NavItem('Focus', Icons.visibility_rounded, '/student/focus-guardian'),
  const _NavItem('Career', Icons.trending_up_rounded, '/student/career-simulator'),
  const _NavItem('Social', Icons.people_rounded, '/student/social'),
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
      backgroundColor: isDark ? AppColors.darkBg : AppColors.pageYellow,
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
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              color: AppColors.gold,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: isDark ? Colors.white : AppColors.brutalBlack, width: 3),
              boxShadow: [
                BoxShadow(
                  color: isDark ? Colors.white : AppColors.brutalBlack,
                  offset: const Offset(3, 3),
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
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: isDark ? Colors.white : AppColors.brutalBlack,
                  ),
                ),
                Text(
                  'TIME TO CRUSH IT!',
                  style: GoogleFonts.fredoka(
                    fontSize: 9,
                    fontWeight: FontWeight.bold,
                    letterSpacing: 3,
                    color: isDark ? Colors.white54 : Colors.grey.shade500,
                  ),
                ),
              ],
            ),
          ),
          GestureDetector(
            onTap: () => ref.read(themeProvider.notifier).toggleTheme(),
            child: Container(
              width: 36,
              height: 36,
              decoration: BoxDecoration(
                color: isDark ? AppColors.darkCard : Colors.white,
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: isDark ? Colors.white : AppColors.brutalBlack, width: 2),
              ),
              child: Icon(
                theme == ThemeMode.dark ? Icons.light_mode : Icons.dark_mode,
                size: 16,
                color: isDark ? AppColors.gold : AppColors.brutalBlack,
              ),
            ),
          ),
          const SizedBox(width: 8),
          GestureDetector(
            onTap: () => _showLogoutDialog(),
            child: Container(
              width: 36,
              height: 36,
              decoration: BoxDecoration(
                color: isDark ? AppColors.darkCard : Colors.white,
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: AppColors.comicRed, width: 2),
              ),
              child: const Icon(Icons.logout, size: 16, color: AppColors.comicRed),
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
        border: Border(top: BorderSide(color: isDark ? Colors.white : AppColors.brutalBlack, width: 3)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          SizedBox(
            height: 72,
            child: ListView.builder(
              controller: _scrollController,
              scrollDirection: Axis.horizontal,
              itemCount: _navItems.length,
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
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
                    margin: const EdgeInsets.symmetric(horizontal: 4),
                    padding: const EdgeInsets.symmetric(vertical: 6),
                    transform: isActive
                        ? Matrix4.translationValues(0, -4, 0)
                        : Matrix4.identity(),
                    decoration: BoxDecoration(
                      color: isActive
                          ? const Color(0xFFFACC15)
                          : Colors.transparent,
                      borderRadius: BorderRadius.circular(12),
                      border: isActive
                          ? Border.all(color: isDark ? Colors.white : AppColors.brutalBlack, width: 2.5)
                          : null,
                      boxShadow: isActive
                          ? [BoxShadow(
                              color: isDark ? Colors.white : AppColors.brutalBlack,
                              offset: const Offset(3, 3),
                              blurRadius: 0,
                            )]
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
                              : (isDark ? Colors.white54 : Colors.grey.shade500),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          item.label,
                          style: GoogleFonts.fredoka(
                            fontSize: 8,
                            fontWeight: isActive ? FontWeight.bold : FontWeight.w500,
                            color: isActive
                                ? AppColors.brutalBlack
                                : (isDark ? Colors.white54 : Colors.grey.shade500),
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
          Padding(
            padding: const EdgeInsets.only(bottom: 4),
            child: Text(
              'Swipe for more →',
              style: GoogleFonts.fredoka(
                fontSize: 8,
                color: isDark ? Colors.white24 : Colors.grey.shade400,
              ),
            ),
          ),
        ],
      ),
    );
  }

  void _showLogoutDialog() {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(20),
          side: const BorderSide(color: AppColors.brutalBlack, width: 3),
        ),
        title: Text('Logout', style: GoogleFonts.fredoka(fontWeight: FontWeight.bold)),
        content: Text('Are you sure you want to logout?', style: GoogleFonts.inter()),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: Text('Cancel', style: GoogleFonts.fredoka(color: Colors.grey)),
          ),
          TextButton(
            onPressed: () {
              Navigator.pop(ctx);
              ref.read(authProvider.notifier).logout();
              context.go('/login');
            },
            child: Text('Logout', style: GoogleFonts.fredoka(color: AppColors.comicRed, fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }
}
