import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:go_router/go_router.dart';
import '../../services/api_service.dart';
import '../../theme/app_colors.dart';
import '../../theme/neubrutalist_widgets.dart';

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
      final sessionId = res.data['sessionId'] ?? 'sess_${DateTime.now().millisecondsSinceEpoch}';
      if (mounted) {
        context.push('/student/interview/session', extra: {
          'sessionId': sessionId,
          'company': widget.company,
          'role': role,
        });
      }
    } catch (e) {
      if (mounted) {
        context.push('/student/interview/session', extra: {
          'sessionId': 'sess_${DateTime.now().millisecondsSinceEpoch}',
          'company': widget.company,
          'role': role,
        });
      }
    } finally {
      if (mounted) setState(() => _starting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.creamBg,
      appBar: AppBar(
        title: Text('SETUP INTERVIEW', style: GoogleFonts.fredoka(fontWeight: FontWeight.bold, color: AppColors.brutalBlack)),
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_rounded, color: AppColors.brutalBlack),
          onPressed: () => context.pop(),
        ),
      ),
      body: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            NeuCard(
              backgroundColor: Colors.white,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('🎯 Target Position', style: GoogleFonts.fredoka(fontSize: 20, fontWeight: FontWeight.bold, color: AppColors.brutalBlack)),
                  const SizedBox(height: 6),
                  Text('What role are you interviewing for at ${widget.company}?', style: GoogleFonts.inter(color: Colors.black54, fontSize: 13)),
                  const SizedBox(height: 16),
                  TextField(
                    controller: _roleController,
                    style: GoogleFonts.inter(fontSize: 15, fontWeight: FontWeight.w600),
                    decoration: InputDecoration(
                      filled: true,
                      fillColor: AppColors.creamBg,
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: const BorderSide(color: AppColors.brutalBlack, width: 2),
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const Spacer(),
            NeuButton(
              text: _starting ? 'STARTING SESSION...' : 'START 10-TURN INTERVIEW →',
              backgroundColor: AppColors.popGreen,
              isLoading: _starting,
              onPressed: _startInterview,
            ),
          ],
        ),
      ),
    );
  }
}
