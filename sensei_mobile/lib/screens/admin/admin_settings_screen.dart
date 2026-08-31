import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../providers/auth_provider.dart';
import '../../theme/admin_theme.dart';
import '../../theme/admin_glass_widgets.dart';

class AdminSettingsScreen extends ConsumerStatefulWidget {
  const AdminSettingsScreen({super.key});

  @override
  ConsumerState<AdminSettingsScreen> createState() => _AdminSettingsScreenState();
}

class _AdminSettingsScreenState extends ConsumerState<AdminSettingsScreen> {
  final TextEditingController _nameController = TextEditingController();
  final TextEditingController _emailController = TextEditingController();
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    final user = ref.read(authProvider).user;
    if (user != null) {
      _nameController.text = user.name ?? '';
      _emailController.text = user.email ?? '';
    }
  }

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    super.dispose();
  }

  Future<void> _saveSettings() async {
    setState(() => _isLoading = true);
    // Simulate API call
    await Future.delayed(const Duration(seconds: 1));
    if (mounted) {
      setState(() => _isLoading = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Settings saved successfully!', style: GoogleFonts.inter()),
          backgroundColor: AdminTheme.of(context).success,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final user = ref.watch(authProvider).user;
    final t = AdminTheme.of(context);
    final isDark = AdminTheme.isDark(context);

    return SingleChildScrollView(
      physics: const AlwaysScrollableScrollPhysics(),
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Header
          AdminSectionTitle(
            title: 'Settings',
            subtitle: 'Manage your account and preferences',
            icon: Icons.settings_rounded,
            iconColor: t.admAccent,
          ),
          const SizedBox(height: 24),

          // Profile Glass Card
          AdminGlassContainer(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Icon(Icons.person_outline_rounded, color: t.admAccent, size: 22),
                    const SizedBox(width: 8),
                    Text(
                      'Profile Information',
                      style: GoogleFonts.spaceGrotesk(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                        color: t.admText,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 20),
                Text(
                  'FULL NAME',
                  style: GoogleFonts.inter(
                    fontSize: 10,
                    fontWeight: FontWeight.bold,
                    color: t.admTextMuted,
                    letterSpacing: 0.5,
                  ),
                ),
                const SizedBox(height: 6),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  decoration: BoxDecoration(
                    color: t.admInputBg,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: t.admInputBorder.withValues(alpha: 0.5)),
                  ),
                  child: TextField(
                    controller: _nameController,
                    decoration: const InputDecoration(border: InputBorder.none),
                    style: GoogleFonts.inter(fontSize: 14, color: t.admText),
                  ),
                ),
                const SizedBox(height: 16),
                Text(
                  'EMAIL ADDRESS',
                  style: GoogleFonts.inter(
                    fontSize: 10,
                    fontWeight: FontWeight.bold,
                    color: t.admTextMuted,
                    letterSpacing: 0.5,
                  ),
                ),
                const SizedBox(height: 6),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  decoration: BoxDecoration(
                    color: t.admInputBg.withValues(alpha: 0.5),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: t.admInputBorder.withValues(alpha: 0.2)),
                  ),
                  child: TextField(
                    controller: _emailController,
                    enabled: false,
                    decoration: const InputDecoration(border: InputBorder.none),
                    style: GoogleFonts.inter(fontSize: 14, color: t.admTextSub),
                  ),
                ),
                const SizedBox(height: 24),
                AdminButton(
                  onTap: _saveSettings,
                  isLoading: _isLoading,
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(Icons.save_rounded, color: Colors.white, size: 18),
                      const SizedBox(width: 8),
                      Text('SAVE CHANGES', style: GoogleFonts.spaceGrotesk(fontSize: 14)),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),

          // Theme Settings Card
          AdminGlassContainer(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Icon(
                      isDark ? Icons.dark_mode_rounded : Icons.light_mode_rounded,
                      color: t.admAccent,
                      size: 22,
                    ),
                    const SizedBox(width: 8),
                    Text(
                      'Preferences',
                      style: GoogleFonts.spaceGrotesk(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                        color: t.admText,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Dark Mode',
                          style: GoogleFonts.spaceGrotesk(
                            fontSize: 15,
                            fontWeight: FontWeight.w600,
                            color: t.admText,
                          ),
                        ),
                        Text(
                          'Use dark theme interface',
                          style: GoogleFonts.inter(
                            fontSize: 12,
                            color: t.admTextMuted,
                          ),
                        ),
                      ],
                    ),
                    Switch.adaptive(
                      value: isDark,
                      activeColor: t.admAccent,
                      onChanged: (_) => ref.read(themeProvider.notifier).toggleTheme(),
                    ),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),

          // System Info Glass Card
          AdminGlassContainer(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Icon(Icons.monitor_rounded, color: t.admAccent, size: 22),
                    const SizedBox(width: 8),
                    Text(
                      'System Information',
                      style: GoogleFonts.spaceGrotesk(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                        color: t.admText,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 20),
                _buildSystemInfoRow('Platform', 'SENSEI AI Campus OS', t),
                _buildSystemInfoRow('Version', 'v2.4.1', t),
                _buildSystemInfoRow('Environment', 'Production', t),
                _buildSystemInfoRow('API Status', '✅ Healthy', t),
                _buildSystemInfoRow('License', 'Enterprise', t),
              ],
            ),
          ),
          const SizedBox(height: 24),

          // Sign Out Button
          AdminButton(
            onTap: () {
              ref.read(authProvider.notifier).logout();
            },
            gradient: AdminTheme.dangerGradient(context),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.logout_rounded, color: Colors.white, size: 18),
                const SizedBox(width: 8),
                Text('SIGN OUT', style: GoogleFonts.spaceGrotesk(fontSize: 14)),
              ],
            ),
          ),
          const SizedBox(height: 40),
        ],
      ),
    );
  }

  Widget _buildSystemInfoRow(String label, String value, AdminThemeColors t) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: t.admInputBg,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: t.admInputBorder.withValues(alpha: 0.3)),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              label.toUpperCase(),
              style: GoogleFonts.inter(
                fontSize: 10,
                fontWeight: FontWeight.bold,
                color: t.admTextMuted,
              ),
            ),
            Text(
              value,
              style: GoogleFonts.spaceGrotesk(
                fontSize: 14,
                fontWeight: FontWeight.bold,
                color: t.admText,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
