import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../services/api_service.dart';
import '../../theme/app_colors.dart';
import '../../providers/auth_provider.dart';
import '../../theme/neubrutalist_widgets.dart';

class TeacherProfileScreen extends ConsumerStatefulWidget {
  const TeacherProfileScreen({super.key});

  @override
  ConsumerState<TeacherProfileScreen> createState() => _TeacherProfileScreenState();
}

class _TeacherProfileScreenState extends ConsumerState<TeacherProfileScreen> {
  bool _isEditing = false;
  bool _isLoading = false;
  bool _isFetching = true;
  int _totalStudents = 0;
  late TextEditingController _nameController;
  late TextEditingController _deptController;
  late TextEditingController _bioController;

  @override
  void initState() {
    super.initState();
    final user = ref.read(authProvider).user;
    _nameController = TextEditingController(text: user?.name ?? '');
    _deptController = TextEditingController(text: user?.department ?? '');
    _bioController = TextEditingController(text: '');
    _loadProfileData();
  }

  Future<void> _loadProfileData() async {
    try {
      final dash = await ApiService().get('/api/teacher/dashboard');
      if (mounted) {
        setState(() {
          _totalStudents = dash.data?['totalStudents'] ?? 0;
          _isFetching = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _isFetching = false);
    }
  }

  @override
  void dispose() {
    _nameController.dispose();
    _deptController.dispose();
    _bioController.dispose();
    super.dispose();
  }

  Future<void> _handleSave() async {
    setState(() => _isLoading = true);
    try {
      await ApiService().put(
        '/api/teacher/profile',
        data: {
          'name': _nameController.text,
          'department': _deptController.text,
          'bio': _bioController.text,
        },
      );
      await ref.read(authProvider.notifier).refreshUser();
      if (mounted) {
        setState(() {
          _isEditing = false;
          _isLoading = false;
        });
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Profile updated successfully')));
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isLoading = false);
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed to update profile: $e')));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final user = ref.watch(authProvider).user;
    final initials = user?.name.isNotEmpty == true ? user!.name.substring(0, 2).toUpperCase() : 'T';

    return Scaffold(
      backgroundColor: AppColors.brutalBg,
      appBar: AppBar(
        backgroundColor: AppColors.brutalBg,
        elevation: 0,
        title: Text('Faculty Profile', style: GoogleFonts.spaceGrotesk(fontWeight: FontWeight.w900, fontSize: 24)),
        bottom: PreferredSize(preferredSize: const Size.fromHeight(2), child: Container(color: AppColors.brutalBlack, height: 2)),
      ),
      body: _isFetching
          ? const Center(child: CircularProgressIndicator())
          : ListView(
              padding: const EdgeInsets.all(20),
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('Manage Profile', style: GoogleFonts.spaceGrotesk(fontSize: 28, fontWeight: FontWeight.w900)),
                          Text('Manage your professional credentials', style: GoogleFonts.inter(fontSize: 14, color: Colors.grey.shade700)),
                        ],
                      ),
                    ),
                    BrutalistButton(
                      text: _isLoading ? 'Saving...' : _isEditing ? 'Save Profile' : 'Edit',
                      onTap: () {
                        if (_isEditing) {
                          _handleSave();
                        } else {
                          setState(() => _isEditing = true);
                        }
                      },
                      backgroundColor: AppColors.senseiPurple,
                    ),
                  ],
                ),
                const SizedBox(height: 24),
                Container(
                  padding: const EdgeInsets.all(32),
                  decoration: BoxDecoration(
                    color: AppColors.senseiPurple.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: AppColors.brutalBlack, width: 2),
                  ),
                  child: Column(
                    children: [
                      Text(initials, style: GoogleFonts.spaceGrotesk(fontSize: 36, fontWeight: FontWeight.bold)),
                      const SizedBox(height: 8),
                      Text(user?.name ?? 'Faculty', style: GoogleFonts.spaceGrotesk(fontSize: 24, fontWeight: FontWeight.bold)),
                      Text(user?.email ?? '', style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.grey.shade700)),
                    ],
                  ),
                ),
                const SizedBox(height: 24),
                Container(
                  padding: const EdgeInsets.all(24),
                  decoration: BoxDecoration(
                    color: AppColors.brutalistCyan.withValues(alpha: 0.2),
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: AppColors.brutalBlack, width: 2),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('PROFESSIONAL INFORMATION', style: GoogleFonts.spaceGrotesk(fontSize: 18, fontWeight: FontWeight.bold)),
                      const SizedBox(height: 16),
                      _buildInputField('Full Display Name', _nameController, Icons.person, enabled: _isEditing),
                      const SizedBox(height: 16),
                      _buildInputField('Primary Department', _deptController, Icons.business, enabled: _isEditing),
                      const SizedBox(height: 16),
                      _buildInputField('Institutional Email', TextEditingController(text: user?.email), Icons.email, enabled: false),
                      const SizedBox(height: 16),
                      _buildInputField('Total Enrolled Students', TextEditingController(text: '$_totalStudents'), Icons.people, enabled: false),
                      const SizedBox(height: 24),
                      Text('PROFESSIONAL BIO', style: GoogleFonts.spaceGrotesk(fontSize: 14, fontWeight: FontWeight.bold)),
                      const SizedBox(height: 8),
                      _isEditing
                          ? TextField(
                              controller: _bioController,
                              maxLines: 4,
                              decoration: InputDecoration(
                                filled: true,
                                fillColor: Colors.white,
                                border: OutlineInputBorder(borderSide: const BorderSide(color: AppColors.brutalBlack, width: 2)),
                              ),
                            )
                          : Text(_bioController.text.isEmpty ? 'No bio added yet.' : _bioController.text),
                    ],
                  ),
                ),
              ],
            ),
    );
  }

  Widget _buildInputField(String label, TextEditingController controller, IconData icon, {bool enabled = true}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label.toUpperCase(), style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.bold)),
        const SizedBox(height: 8),
        TextField(
          controller: controller,
          enabled: enabled,
          decoration: InputDecoration(
            prefixIcon: Icon(icon),
            filled: true,
            fillColor: enabled ? Colors.white : Colors.grey.shade200,
            border: OutlineInputBorder(borderSide: const BorderSide(color: AppColors.brutalBlack, width: 2)),
          ),
        ),
      ],
    );
  }
}
