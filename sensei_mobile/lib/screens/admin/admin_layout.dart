import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../providers/auth_provider.dart';
import '../../theme/admin_theme.dart';

class _AdminNavItem {
  final String label;
  final IconData icon;
  final String route;

  const _AdminNavItem(this.label, this.icon, this.route);
}

final _adminNavItems = [
  const _AdminNavItem('Overview', Icons.dashboard_rounded, '/admin'),
  const _AdminNavItem('Warnings', Icons.warning_rounded, '/admin/dropout-warning'),
  const _AdminNavItem('Interventions', Icons.handshake_rounded, '/admin/interventions'),
  const _AdminNavItem('Admin AI', Icons.smart_toy_rounded, '/admin/ai-chatbot'),
  const _AdminNavItem('Settings', Icons.settings_rounded, '/admin/settings'),
];

class AdminLayout extends ConsumerStatefulWidget {
  final Widget child;

  const AdminLayout({super.key, required this.child});

  @override
  ConsumerState<AdminLayout> createState() => _AdminLayoutState();
}

class _AdminLayoutState extends ConsumerState<AdminLayout> {
  int _currentIndex = 0;

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authProvider);
    final userName = authState.user?.name ?? 'Admin';
    final location = GoRouterState.of(context).matchedLocation;
    final t = AdminTheme.of(context);
    final isDark = AdminTheme.isDark(context);

    int activeIndex = _adminNavItems.indexWhere((item) => item.route == location);
    if (activeIndex == -1) activeIndex = 0;
    if (activeIndex != _currentIndex) {
      _currentIndex = activeIndex;
    }

    return Scaffold(
      backgroundColor: t.admBg,
      body: SafeArea(
        child: Column(
          children: [
            _buildHeader(userName, t, isDark),
            Expanded(child: widget.child),
          ],
        ),
      ),
      bottomNavigationBar: _buildBottomNav(t, isDark),
    );
  }

  Widget _buildHeader(String name, AdminThemeColors t, bool isDark) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
      decoration: BoxDecoration(
        color: t.admSurface,
        border: Border(bottom: BorderSide(color: t.admBorderSolid.withValues(alpha: 0.5))),
      ),
      child: Row(
        children: [
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: AdminTheme.accentGradient(context),
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.circular(14),
              boxShadow: [
                BoxShadow(
                  color: t.admAccent.withValues(alpha: 0.25),
                  blurRadius: 8,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: Center(
              child: Text(
                name.isNotEmpty ? name[0].toUpperCase() : 'A',
                style: GoogleFonts.spaceGrotesk(
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                  color: Colors.white,
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
                  'Welcome, $name',
                  style: GoogleFonts.spaceGrotesk(
                    fontSize: 17,
                    fontWeight: FontWeight.bold,
                    color: t.admText,
                  ),
                ),
                Text(
                  'UNIVERSITY COMMAND CENTER',
                  style: GoogleFonts.spaceGrotesk(
                    fontSize: 9,
                    fontWeight: FontWeight.w600,
                    letterSpacing: 1.5,
                    color: t.admTextMuted,
                  ),
                ),
              ],
            ),
          ),
          // Theme toggle
          GestureDetector(
            onTap: () => ref.read(themeProvider.notifier).toggleTheme(),
            child: Container(
              width: 36,
              height: 36,
              decoration: BoxDecoration(
                color: t.admAccentLight,
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: t.admAccent.withValues(alpha: 0.15)),
              ),
              child: Icon(
                isDark ? Icons.light_mode_rounded : Icons.dark_mode_rounded,
                size: 18,
                color: t.admAccent,
              ),
            ),
          ),
          const SizedBox(width: 8),
          // Logout
          GestureDetector(
            onTap: () => _showLogoutDialog(),
            child: Container(
              width: 36,
              height: 36,
              decoration: BoxDecoration(
                color: t.danger.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: t.danger.withValues(alpha: 0.2)),
              ),
              child: Icon(Icons.logout, size: 18, color: t.danger),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBottomNav(AdminThemeColors t, bool isDark) {
    return Container(
      decoration: BoxDecoration(
        color: t.admSurface,
        border: Border(top: BorderSide(color: t.admBorderSolid.withValues(alpha: 0.5))),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: isDark ? 0.3 : 0.05),
            blurRadius: 10,
            offset: const Offset(0, -2),
          ),
        ],
      ),
      child: SafeArea(
        top: false,
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: List.generate(_adminNavItems.length, (index) {
              final item = _adminNavItems[index];
              final isActive = index == _currentIndex;

              return Expanded(
                child: GestureDetector(
                  onTap: () {
                    setState(() => _currentIndex = index);
                    context.go(item.route);
                  },
                  behavior: HitTestBehavior.opaque,
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 200),
                    padding: const EdgeInsets.symmetric(vertical: 8),
                    margin: const EdgeInsets.symmetric(horizontal: 2),
                    decoration: BoxDecoration(
                      color: isActive ? t.admAccentLight : Colors.transparent,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(
                          item.icon,
                          size: isActive ? 22 : 20,
                          color: isActive ? t.admAccent : t.admTextMuted,
                        ),
                        const SizedBox(height: 4),
                        Text(
                          item.label,
                          style: GoogleFonts.spaceGrotesk(
                            fontSize: 10,
                            fontWeight: isActive ? FontWeight.bold : FontWeight.w500,
                            color: isActive ? t.admAccent : t.admTextMuted,
                          ),
                          textAlign: TextAlign.center,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ],
                    ),
                  ),
                ),
              );
            }),
          ),
        ),
      ),
    );
  }

  void _showLogoutDialog() {
    final t = AdminTheme.of(context);

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: t.admSurface,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: BorderSide(color: t.admBorderSolid),
        ),
        title: Text('Logout', style: GoogleFonts.spaceGrotesk(fontWeight: FontWeight.bold, color: t.admText)),
        content: Text('Are you sure you want to logout?', style: GoogleFonts.inter(color: t.admTextMuted)),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: Text('Cancel', style: GoogleFonts.inter(color: t.admTextMuted)),
          ),
          TextButton(
            onPressed: () {
              Navigator.pop(ctx);
              ref.read(authProvider.notifier).logout();
              context.go('/login');
            },
            child: Text('Logout', style: GoogleFonts.inter(color: t.danger, fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }
}
