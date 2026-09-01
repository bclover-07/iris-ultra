import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:go_router/go_router.dart';
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
    } catch (_) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authProvider);
    final user = _profile?['user'] ?? authState.user;
    final profile = _profile?['profile'];
    final initial = (user?.name as String?)?.isNotEmpty == true ? user!.name![0].toUpperCase() : 'S';

    return Scaffold(
      backgroundColor: AppColors.creamBg,
      body: SafeArea(
        child: _isLoading
            ? const Center(child: CircularProgressIndicator())
            : Column(
                children: [
                  _buildHeader(),
                  Expanded(
                    child: SingleChildScrollView(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          NeuCard(
                            backgroundColor: Colors.white,
                            child: Column(
                              children: [
                                Container(
                                  width: 76,
                                  height: 76,
                                  decoration: BoxDecoration(
                                    color: AppColors.popYellow,
                                    shape: BoxShape.circle,
                                    border: Border.all(color: AppColors.brutalBlack, width: 3),
                                    boxShadow: const [
                                      BoxShadow(color: AppColors.brutalBlack, offset: Offset(3, 3), blurRadius: 0),
                                    ],
                                  ),
                                  alignment: Alignment.center,
                                  child: Text(
                                    initial,
                                    style: GoogleFonts.fredoka(fontSize: 32, fontWeight: FontWeight.bold, color: AppColors.brutalBlack),
                                  ),
                                ),
                                const SizedBox(height: 12),
                                Text(
                                  user?.name ?? 'Alex Rivera',
                                  style: GoogleFonts.fredoka(fontSize: 20, fontWeight: FontWeight.bold, color: AppColors.brutalBlack),
                                ),
                                Text(
                                  user?.email ?? 'alex.rivera@sensei.ai',
                                  style: GoogleFonts.inter(fontSize: 12, color: Colors.black54),
                                ),
                                const SizedBox(height: 16),
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    NeuBadge(label: 'LVL ${profile?['level'] ?? 1}', backgroundColor: AppColors.popYellow),
                                    const SizedBox(width: 8),
                                    NeuBadge(label: '${profile?['xp'] ?? 250} XP', backgroundColor: AppColors.popPink),
                                    const SizedBox(width: 8),
                                    NeuBadge(label: '🔥 ${profile?['streak'] ?? 3} DAYS', backgroundColor: AppColors.popCoral, textColor: Colors.white),
                                  ],
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(height: 16),
                          NeuCard(
                            backgroundColor: Colors.white,
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  '5-AXIS VERIFIED OBSERVED SIGNALS',
                                  style: GoogleFonts.fredoka(fontSize: 13, fontWeight: FontWeight.bold, color: AppColors.brutalBlack, letterSpacing: 1),
                                ),
                                const SizedBox(height: 12),
                                _buildProfileRow(Icons.visibility_rounded, 'Presence Score', '${profile?['presenceConsistency']?['score'] ?? 92}% (Pose Verified)'),
                                _buildProfileRow(Icons.front_hand_rounded, 'Quiz Mastery', '${profile?['quizMastery']?['score'] ?? 86}% (Camo Quizo)'),
                                _buildProfileRow(Icons.checklist_rounded, 'Plan Progress', '${profile?['studyPlanProgress']?['score'] ?? 78}% (Self-Managed)'),
                                _buildProfileRow(Icons.favorite_rounded, 'Wellness Score', '${profile?['wellness']?['score'] ?? 90}% (4-7-8 Sync)'),
                                _buildProfileRow(Icons.record_voice_over_rounded, 'Engagement', '${profile?['engagement']?['score'] ?? 88}% (On-Device Turns)'),
                              ],
                            ),
                          ),
                          const SizedBox(height: 16),
                          NeuButton(
                            text: 'LOGOUT OF SENSEI',
                            icon: Icons.logout_rounded,
                            backgroundColor: AppColors.popCoral,
                            textColor: Colors.white,
                            onPressed: () {
                              ref.read(authProvider.notifier).logout();
                              context.go('/login');
                            },
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
      ),
    );
  }

  Widget _buildHeader() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: const BoxDecoration(
        color: AppColors.creamBg,
        border: Border(bottom: BorderSide(color: AppColors.brutalBlack, width: 2.5)),
      ),
      child: Row(
        children: [
          GestureDetector(
            onTap: () => context.pop(),
            child: Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: AppColors.creamCard,
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: AppColors.brutalBlack, width: 2.5),
                boxShadow: const [
                  BoxShadow(color: AppColors.brutalBlack, offset: Offset(2, 2), blurRadius: 0),
                ],
              ),
              child: const Icon(Icons.arrow_back_rounded, color: AppColors.brutalBlack, size: 20),
            ),
          ),
          const SizedBox(width: 12),
          Text(
            'STUDENT PROFILE',
            style: GoogleFonts.fredoka(fontSize: 18, fontWeight: FontWeight.bold, color: AppColors.brutalBlack),
          ),
        ],
      ),
    );
  }

  Widget _buildProfileRow(IconData icon, String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Row(
        children: [
          Icon(icon, size: 18, color: AppColors.popViolet),
          const SizedBox(width: 10),
          SizedBox(
            width: 110,
            child: Text(label, style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.black54)),
          ),
          Expanded(
            child: Text(value, style: GoogleFonts.fredoka(fontSize: 14, fontWeight: FontWeight.bold, color: AppColors.brutalBlack)),
          ),
        ],
      ),
    );
  }
}
