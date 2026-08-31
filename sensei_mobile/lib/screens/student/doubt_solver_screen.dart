import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:dio/dio.dart';
import '../../services/api_service.dart';
import '../../theme/neubrutalist_widgets.dart';
import '../../theme/app_colors.dart';
import '../../config/env.dart';

class DoubtSolverScreen extends ConsumerStatefulWidget {
  const DoubtSolverScreen({super.key});

  @override
  ConsumerState<DoubtSolverScreen> createState() => _DoubtSolverScreenState();
}

class _DoubtSolverScreenState extends ConsumerState<DoubtSolverScreen> {
  final _queryController = TextEditingController();
  String _inputType = 'text'; // text, voice, image
  bool _isLoading = false;
  Map<String, dynamic>? _solutionData;

  @override
  void dispose() {
    _queryController.dispose();
    super.dispose();
  }

  Future<void> _handleSolve() async {
    if (_queryController.text.trim().isEmpty && _inputType == 'text') {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Enter your doubt first!')),
      );
      return;
    }

    setState(() {
      _isLoading = true;
      _solutionData = null;
    });

    try {
      final response = await ApiService().post(
        '/api/doubt/solve',
        data: {
          'inputType': _inputType,
          'originalQuery': _queryController.text,
          'transcription': _inputType == 'voice' ? _queryController.text : '',
          'ocrText': _inputType == 'image' ? 'Handwritten question from image...' : '',
        },
      );

      setState(() {
        _solutionData = response.data;
      });
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Failed to solve doubt')),
      );
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  Widget _buildTypeButton(String type, IconData icon, String label, Color activeColor) {
    final isActive = _inputType == type;
    final isDark = Theme.of(context).brightness == Brightness.dark;
    
    return Expanded(
      child: ComicCard(
        onTap: () {
          setState(() {
            _inputType = type;
            if (type == 'image') {
              _queryController.text = '[Image Attached]';
            } else if (type == 'voice') {
              _queryController.text = '[Voice Recording Simulated]';
            } else {
              _queryController.clear();
            }
          });
        },
        backgroundColor: isActive ? activeColor : (isDark ? const Color(0xFF1E293B) : Colors.grey.shade100),
        padding: const EdgeInsets.symmetric(vertical: 12),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, color: isActive ? Colors.white : (isDark ? Colors.grey.shade400 : Colors.black), size: 18),
            const SizedBox(width: 8),
            Text(
              label,
              style: GoogleFonts.fredoka(
                fontWeight: FontWeight.bold,
                color: isActive ? Colors.white : (isDark ? Colors.grey.shade400 : Colors.black),
              ),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: isDark ? const Color(0xFF050508) : const Color(0xFFFEF9C3),
      appBar: AppBar(
        title: Text(
          'DOUBT SOLVER 🔍',
          style: GoogleFonts.fredoka(fontWeight: FontWeight.bold),
        ),
        backgroundColor: Colors.transparent,
        elevation: 0,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            BrutalistCard(
              backgroundColor: isDark ? const Color(0xFF1E293B) : Colors.white,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Row(
                    children: [
                      _buildTypeButton('text', Icons.send, 'Type', AppColors.senseiGold),
                      const SizedBox(width: 8),
                      _buildTypeButton('voice', Icons.mic, 'Voice', AppColors.senseiCoral),
                      const SizedBox(width: 8),
                      _buildTypeButton('image', Icons.camera_alt, 'Camera', AppColors.senseiBlue),
                    ],
                  ),
                  const SizedBox(height: 16),
                  TextField(
                    controller: _queryController,
                    maxLines: 4,
                    style: GoogleFonts.fredoka(fontSize: 18),
                    decoration: InputDecoration(
                      hintText: 'Type your math, science or coding doubt...',
                      filled: true,
                      fillColor: isDark ? const Color(0xFF0F172A) : Colors.white,
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: const BorderSide(color: AppColors.brutalBlack, width: 2),
                      ),
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
                  const SizedBox(height: 16),
                  ComicCard(
                    onTap: _isLoading ? null : _handleSolve,
                    backgroundColor: AppColors.senseiGold,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    child: Center(
                      child: _isLoading
                          ? const CircularProgressIndicator(color: AppColors.brutalBlack)
                          : Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                const Icon(Icons.auto_awesome, color: AppColors.brutalBlack),
                                const SizedBox(width: 8),
                                Text(
                                  'SOLVE NOW',
                                  style: GoogleFonts.fredoka(
                                    fontSize: 20,
                                    fontWeight: FontWeight.bold,
                                    color: AppColors.brutalBlack,
                                  ),
                                ),
                                const SizedBox(width: 8),
                                const Icon(Icons.auto_awesome, color: AppColors.brutalBlack),
                              ],
                            ),
                    ),
                  ),
                ],
              ),
            ),
            
            if (_solutionData != null) ...[
              const SizedBox(height: 24),
              if (_solutionData!['fallbackActive'] == true) ...[
                BrutalistCard(
                  backgroundColor: Colors.orange.shade50,
                  borderColor: Colors.orange.shade400,
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('⚠️', style: TextStyle(fontSize: 24)),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Human-in-the-Loop Fallback Activated',
                              style: GoogleFonts.fredoka(fontWeight: FontWeight.bold, fontSize: 16, color: Colors.orange.shade800),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              'Confidence level is ${_solutionData!['confidenceScore'] ?? 100}% (below 70%). This query was routed to the Teacher Help Queue.',
                              style: GoogleFonts.fredoka(fontSize: 14, color: Colors.orange.shade900),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),
              ],

              if (_solutionData!['solution'] != null) ...[
                BrutalistCard(
                  backgroundColor: isDark ? const Color(0xFF0F172A) : AppColors.statPurple,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          const Icon(Icons.psychology, color: AppColors.senseiCoral),
                          const SizedBox(width: 8),
                          Text(
                            'Sensei\'s Explanation',
                            style: GoogleFonts.fredoka(
                              fontSize: 20,
                              fontWeight: FontWeight.bold,
                              color: isDark ? Colors.white : Colors.black,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      Text(
                        _solutionData!['solution']['explanation'] ?? '',
                        style: GoogleFonts.fredoka(
                          fontSize: 16,
                          color: isDark ? Colors.white70 : Colors.black87,
                        ),
                      ),
                      if (_solutionData!['solution']['narration'] != null) ...[
                        const SizedBox(height: 16),
                        Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: isDark ? const Color(0xFF1E293B) : Colors.white.withOpacity(0.5),
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: AppColors.brutalBlack, width: 2),
                          ),
                          child: Row(
                            children: [
                              const Icon(Icons.volume_up, color: AppColors.senseiBlue),
                              const SizedBox(width: 8),
                              Expanded(
                                child: Text(
                                  'Click to hear the narrated walkthrough',
                                  style: GoogleFonts.fredoka(fontStyle: FontStyle.italic, fontWeight: FontWeight.bold),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
                const SizedBox(height: 16),

                ...((_solutionData!['solution']['steps'] as List<dynamic>?) ?? []).map((step) {
                  return Padding(
                    padding: const EdgeInsets.only(bottom: 16.0),
                    child: BrutalistCard(
                      backgroundColor: isDark ? const Color(0xFF1E293B) : Colors.white,
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Container(
                            width: 40,
                            height: 40,
                            decoration: BoxDecoration(
                              color: AppColors.senseiGold,
                              shape: BoxShape.circle,
                              border: Border.all(color: AppColors.brutalBlack, width: 2),
                            ),
                            alignment: Alignment.center,
                            child: Text(
                              step['stepNumber']?.toString() ?? '',
                              style: GoogleFonts.fredoka(fontSize: 18, fontWeight: FontWeight.bold, color: AppColors.brutalBlack),
                            ),
                          ),
                          const SizedBox(width: 16),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  step['title'] ?? '',
                                  style: GoogleFonts.fredoka(fontSize: 18, fontWeight: FontWeight.bold),
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  step['content'] ?? '',
                                  style: GoogleFonts.fredoka(fontSize: 16, color: Colors.grey.shade700),
                                ),
                                if (step['latex'] != null) ...[
                                  const SizedBox(height: 8),
                                  Container(
                                    padding: const EdgeInsets.all(8),
                                    decoration: BoxDecoration(
                                      color: isDark ? const Color(0xFF0F172A) : Colors.grey.shade100,
                                      borderRadius: BorderRadius.circular(8),
                                      border: Border.all(color: Colors.grey.shade400),
                                    ),
                                    child: Text(
                                      step['latex'],
                                      style: GoogleFonts.spaceMono(color: AppColors.senseiCoral),
                                    ),
                                  ),
                                ],
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  );
                }).toList(),

                if (_solutionData!['solution']['summary'] != null)
                  ComicCard(
                    backgroundColor: AppColors.senseiYellow,
                    padding: const EdgeInsets.all(20),
                    child: Text(
                      'SUMMARY: ${_solutionData!['solution']['summary']}',
                      style: GoogleFonts.fredoka(fontSize: 22, fontWeight: FontWeight.bold, color: AppColors.brutalBlack),
                      textAlign: TextAlign.center,
                    ),
                  ),
              ],
            ]
          ],
        ),
      ),
    );
  }
}
