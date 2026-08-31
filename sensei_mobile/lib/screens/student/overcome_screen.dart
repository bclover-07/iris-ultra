import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../theme/neubrutalist_widgets.dart';
import '../../theme/app_colors.dart';
import '../../services/api_service.dart';

class OvercomeScreen extends ConsumerStatefulWidget {
  const OvercomeScreen({super.key});

  @override
  ConsumerState<OvercomeScreen> createState() => _OvercomeScreenState();
}

class _OvercomeScreenState extends ConsumerState<OvercomeScreen> {
  Map<String, dynamic>? _data;
  bool _isLoading = true;
  bool _isGenerating = false;

  @override
  void initState() {
    super.initState();
    _fetchOvercome();
  }

  Future<void> _fetchOvercome() async {
    setState(() => _isLoading = true);
    try {
      final response = await ApiService().get('/api/overcome');
      if (mounted) {
        setState(() {
          _data = response.data;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  Future<void> _generatePath() async {
    setState(() => _isGenerating = true);
    try {
      final response = await ApiService().post('/api/overcome/generate');
      if (mounted) {
        setState(() {
          _data?['overcome'] = response.data;
        });
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Overcome Learning Path Generated!')));
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Failed to generate path')));
      }
    } finally {
      if (mounted) {
        setState(() => _isGenerating = false);
      }
    }
  }

  Future<void> _verifyInternalTask(String taskId) async {
    try {
      await ApiService().post('/api/overcome/task/$taskId/verify-internal');
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Task automatically verified!')));
      _fetchOvercome();
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Failed to verify task')));
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

    final hasActivePath = _data?['overcome'] != null && _data!['overcome']['isActive'] == true && (_data!['overcome']['tasks'] as List?)?.isNotEmpty == true;

    return Scaffold(
      backgroundColor: isDark ? const Color(0xFF050508) : const Color(0xFFFEF9C3),
      appBar: AppBar(
        title: Text('OVERCOME 🎯', style: GoogleFonts.fredoka(fontWeight: FontWeight.bold)),
        backgroundColor: Colors.transparent,
        elevation: 0,
        actions: [
          Container(
            margin: const EdgeInsets.all(8),
            padding: const EdgeInsets.symmetric(horizontal: 12),
            decoration: BoxDecoration(
              border: Border.all(color: AppColors.brutalBlack, width: 2),
              borderRadius: BorderRadius.circular(12),
              color: isDark ? const Color(0xFF1E293B) : Colors.white,
            ),
            alignment: Alignment.center,
            child: Row(
              children: [
                const Icon(Icons.psychology, size: 16, color: AppColors.senseiPurple),
                const SizedBox(width: 4),
                Text('AI-Powered Growth', style: GoogleFonts.fredoka(fontSize: 12, fontWeight: FontWeight.bold)),
              ],
            ),
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: hasActivePath ? _buildActivePath(isDark) : _buildNoPath(isDark),
      ),
    );
  }

  Widget _buildNoPath(bool isDark) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        BrutalistCard(
          backgroundColor: isDark ? const Color(0xFF1E293B) : const Color(0xFFFFFDE7),
          child: Column(
            children: [
              const Icon(Icons.warning_amber_rounded, size: 64, color: AppColors.senseiYellow),
              const SizedBox(height: 16),
              Text(
                'You have unresolved weaknesses!',
                style: GoogleFonts.fredoka(fontSize: 24, fontWeight: FontWeight.bold),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 8),
              Text(
                'Our AI has analyzed your recent interventions and quiz performances. Click below to generate a highly personalized learning path.',
                style: GoogleFonts.fredoka(color: Colors.grey.shade600),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 24),
              ComicCard(
                onTap: _isGenerating ? null : _generatePath,
                backgroundColor: AppColors.senseiCoral,
                child: Center(
                  child: _isGenerating
                      ? const CircularProgressIndicator(color: Colors.white)
                      : Text('GENERATE OVERCOME PATH', style: GoogleFonts.fredoka(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16)),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildActivePath(bool isDark) {
    final overcome = _data!['overcome'];
    final tasks = overcome['tasks'] as List<dynamic>? ?? [];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        BrutalistCard(
          backgroundColor: isDark ? const Color(0xFF1E293B) : Colors.white,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('THE PROBLEM', style: GoogleFonts.fredoka(fontSize: 16, fontWeight: FontWeight.bold, color: AppColors.senseiCoral)),
              const SizedBox(height: 4),
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(color: AppColors.senseiCoral.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(8)),
                child: Text(overcome['pastSummary'] ?? '', style: GoogleFonts.fredoka()),
              ),
              const SizedBox(height: 16),
              Text('THE GOAL', style: GoogleFonts.fredoka(fontSize: 16, fontWeight: FontWeight.bold, color: AppColors.senseiGreen)),
              const SizedBox(height: 4),
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(color: AppColors.senseiGreen.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(8)),
                child: Text(overcome['futureProjection'] ?? '', style: GoogleFonts.fredoka()),
              ),
            ],
          ),
        ),
        const SizedBox(height: 24),
        Text('ACTIONABLE TASKS', style: GoogleFonts.fredoka(fontSize: 20, fontWeight: FontWeight.bold)),
        const SizedBox(height: 16),
        ...tasks.map((task) {
          final isCompleted = task['status'] == 'completed';
          final isInternal = task['type'] == 'internal';

          return Padding(
            padding: const EdgeInsets.only(bottom: 16),
            child: BrutalistCard(
              backgroundColor: isCompleted ? AppColors.senseiGreen.withValues(alpha: 0.2) : (isDark ? const Color(0xFF0F172A) : Colors.white),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        color: AppColors.brutalBlack,
                        child: Text('DAY ${task['day']}', style: GoogleFonts.spaceMono(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 12)),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(border: Border.all(color: AppColors.brutalBlack), borderRadius: BorderRadius.circular(4)),
                        child: Text('${task['type']} Task'.toUpperCase(), style: GoogleFonts.spaceMono(fontSize: 10, fontWeight: FontWeight.bold)),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Text(task['title'] ?? '', style: GoogleFonts.fredoka(fontSize: 18, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 4),
                  Text(task['description'] ?? '', style: GoogleFonts.fredoka(color: Colors.grey.shade600)),
                  const SizedBox(height: 16),
                  if (isCompleted)
                    Row(
                      children: [
                        const Icon(Icons.check_circle, color: AppColors.senseiGreen),
                        const SizedBox(width: 8),
                        Text('Verified & Completed', style: GoogleFonts.fredoka(color: AppColors.senseiGreen, fontWeight: FontWeight.bold)),
                      ],
                    )
                  else if (isInternal)
                    ComicCard(
                      onTap: () => _verifyInternalTask(task['_id']),
                      backgroundColor: AppColors.senseiBlue,
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      child: Center(
                        child: Text('AUTO-VERIFY', style: GoogleFonts.fredoka(color: Colors.white, fontWeight: FontWeight.bold)),
                      ),
                    )
                  else
                    ComicCard(
                      onTap: () {
                        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Upload proof not implemented on mobile yet')));
                      },
                      backgroundColor: AppColors.senseiYellow,
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      child: Center(
                        child: Text('UPLOAD PROOF', style: GoogleFonts.fredoka(fontWeight: FontWeight.bold)),
                      ),
                    ),
                ],
              ),
            ),
          );
        }),
      ],
    );
  }
}
