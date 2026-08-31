import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:go_router/go_router.dart';
import '../../services/api_service.dart';
import '../../theme/app_colors.dart';
import '../../theme/neubrutalist_widgets.dart';
import '../../config/env.dart';

class InterviewSetupScreen extends StatefulWidget {
  final String company;
  const InterviewSetupScreen({super.key, required this.company});

  @override
  State<InterviewSetupScreen> createState() => _InterviewSetupScreenState();
}

class _InterviewSetupScreenState extends State<InterviewSetupScreen> {
  final _roleController = TextEditingController(text: 'Software Engineer');
  bool _starting = false;

  Future<void> _startInterview() async {
    final role = _roleController.text.trim();
    if (role.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Please enter a role')));
      return;
    }

    setState(() => _starting = true);
    try {
      final res = await ApiService().post('/api/interview/start', data: {
        'jobRole': role,
        'company': widget.company,
        'mode': 'technical',
        'difficulty': 1
      });
      final sessionId = res.data['sessionId'];
      if (mounted) {
        context.push('/student/interview/session', extra: {
          'sessionId': sessionId,
          'company': widget.company,
          'role': role,
        });
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Failed to start interview.')));
      }
    } finally {
      if (mounted) setState(() => _starting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.brutalBg,
      appBar: AppBar(
        title: Text('Setup Interview', style: GoogleFonts.spaceGrotesk(fontWeight: FontWeight.w900, color: AppColors.brutalBlack)),
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: AppColors.brutalBlack),
          onPressed: () => context.pop(),
        ),
      ),
      body: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            BrutalistCard(
              backgroundColor: Colors.white,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('🎯 Choose Your Role', style: GoogleFonts.fredoka(fontSize: 24, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 8),
                  Text('What position are you interviewing for at ${widget.company}?', style: GoogleFonts.fredoka(color: Colors.grey.shade600)),
                  const SizedBox(height: 16),
                  TextField(
                    controller: _roleController,
                    style: GoogleFonts.fredoka(fontSize: 18),
                    decoration: InputDecoration(
                      filled: true,
                      fillColor: Colors.white,
                      enabledBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: const BorderSide(color: AppColors.brutalBlack, width: 2),
                      ),
                      focusedBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: const BorderSide(color: AppColors.brutalBlack, width: 3),
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const Spacer(),
            BrutalistButton(
              text: _starting ? 'Starting...' : '🚀 Start Session',
              backgroundColor: AppColors.senseiGreen,
              onTap: _starting ? () {} : _startInterview,
            ),
          ],
        ),
      ),
    );
  }
}
