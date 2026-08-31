import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../theme/neubrutalist_widgets.dart';
import '../../theme/app_colors.dart';
import '../../services/api_service.dart';
import '../../providers/auth_provider.dart';

class ProfileScreen extends ConsumerStatefulWidget {
  const ProfileScreen({super.key});

  @override
  ConsumerState<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends ConsumerState<ProfileScreen> {
  Map<String, dynamic>? _profile;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _fetchProfile();
  }

  Future<void> _fetchProfile() async {
    setState(() => _isLoading = true);
    try {
      final response = await ApiService().get('/api/student/profile');
      if (mounted) {
        setState(() {
          _profile = response.data;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    if (_isLoading) {
      return Scaffold(
        backgroundColor: isDark ? const Color(0xFF050508) : const Color(0xFFFEF9C3),
        body: const Center(child: CircularProgressIndicator()),
      );
    }

    if (_profile == null) {
      return Scaffold(
        backgroundColor: isDark ? const Color(0xFF050508) : const Color(0xFFFEF9C3),
        body: Center(child: Text('Failed to load profile', style: GoogleFonts.fredoka())),
      );
    }

    final initial = (_profile!['name'] as String?)?.isNotEmpty == true ? _profile!['name'][0].toUpperCase() : 'U';

    final fields = [
      {'icon': Icons.person, 'label': 'Name', 'value': _profile!['name'] ?? '-'},
      {'icon': Icons.email, 'label': 'Email', 'value': _profile!['email'] ?? '-'},
      {'icon': Icons.tag, 'label': 'Student ID', 'value': _profile!['studentId'] ?? '-'},
      {'icon': Icons.school, 'label': 'Department', 'value': _profile!['department'] ?? '-'},
      {'icon': Icons.calendar_today, 'label': 'Semester', 'value': 'Semester ${_profile!['semester'] ?? '-'}', 'color': AppColors.senseiBlue},
      {'icon': Icons.bolt, 'label': 'XP', 'value': '${_profile!['xp'] ?? 0} XP', 'color': AppColors.senseiYellow},
      {'icon': Icons.emoji_events, 'label': 'Level', 'value': 'Level ${_profile!['level'] ?? 1}', 'color': AppColors.senseiPurple},
      {'icon': Icons.local_fire_department, 'label': 'Streak', 'value': '${_profile!['streakDays'] ?? 0} days', 'color': AppColors.senseiCoral},
    ];

    return Scaffold(
      backgroundColor: isDark ? const Color(0xFF050508) : const Color(0xFFFEF9C3),
      appBar: AppBar(
        title: Text('MY PROFILE 👤', style: GoogleFonts.fredoka(fontWeight: FontWeight.bold)),
        backgroundColor: Colors.transparent,
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.logout, color: Colors.red),
            onPressed: () {
              ref.read(authProvider.notifier).logout();
            },
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            BrutalistCard(
              backgroundColor: isDark ? const Color(0xFF1E293B) : Colors.white,
              child: Column(
                children: [
                  Container(
                    width: 80,
                    height: 80,
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(
                        colors: [AppColors.senseiYellow, AppColors.senseiCoral],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                      shape: BoxShape.circle,
                      border: Border.all(color: AppColors.brutalBlack, width: 3),
                    ),
                    alignment: Alignment.center,
                    child: Text(initial, style: GoogleFonts.fredoka(fontSize: 32, fontWeight: FontWeight.bold, color: Colors.black)),
                  ),
                  const SizedBox(height: 24),
                  ...fields.map((f) => Padding(
                    padding: const EdgeInsets.only(bottom: 12),
                    child: Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: isDark ? const Color(0xFF0F172A) : Colors.grey.shade50,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: AppColors.brutalBlack.withValues(alpha: 0.1)),
                      ),
                      child: Row(
                        children: [
                          Icon(f['icon'] as IconData, size: 20, color: f['color'] as Color? ?? Colors.grey),
                          const SizedBox(width: 12),
                          SizedBox(
                            width: 100,
                            child: Text(f['label'] as String, style: GoogleFonts.spaceMono(fontSize: 12, color: Colors.grey, fontWeight: FontWeight.bold)),
                          ),
                          Expanded(
                            child: Text(f['value'] as String, style: GoogleFonts.fredoka(fontSize: 16, fontWeight: FontWeight.bold)),
                          ),
                        ],
                      ),
                    ),
                  )),
                  const SizedBox(height: 16),
                  if (_profile!['badges'] != null && (_profile!['badges'] as List).isNotEmpty)
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: (_profile!['badges'] as List).map((b) => Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                        decoration: BoxDecoration(
                          color: AppColors.senseiYellow.withValues(alpha: 0.2),
                          border: Border.all(color: AppColors.senseiYellow),
                          borderRadius: BorderRadius.circular(16),
                        ),
                        child: Text('🏅 $b', style: GoogleFonts.fredoka(fontSize: 12, fontWeight: FontWeight.bold)),
                      )).toList(),
                    ),
                ],
              ),
            ),
            const SizedBox(height: 24),
            BrutalistCard(
              backgroundColor: isDark ? const Color(0xFF1E293B) : Colors.white,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('PREFERENCES', style: GoogleFonts.fredoka(fontSize: 18, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 16),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text('Language', style: GoogleFonts.spaceMono(fontWeight: FontWeight.bold)),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                        decoration: BoxDecoration(
                          color: isDark ? const Color(0xFF0F172A) : Colors.grey.shade200,
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Text('EN', style: GoogleFonts.fredoka(fontWeight: FontWeight.bold)),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text('Theme', style: GoogleFonts.spaceMono(fontWeight: FontWeight.bold)),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                        decoration: BoxDecoration(
                          color: isDark ? const Color(0xFF0F172A) : Colors.grey.shade200,
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Text(isDark ? 'DARK' : 'LIGHT', style: GoogleFonts.fredoka(fontWeight: FontWeight.bold)),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
