import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:dio/dio.dart';
import '../../services/api_service.dart';
import '../../theme/neubrutalist_widgets.dart';
import '../../theme/app_colors.dart';
import '../../config/env.dart';

class CareerSimulatorScreen extends ConsumerStatefulWidget {
  const CareerSimulatorScreen({super.key});

  @override
  ConsumerState<CareerSimulatorScreen> createState() => _CareerSimulatorScreenState();
}

class _CareerSimulatorScreenState extends ConsumerState<CareerSimulatorScreen> {
  final _interestsController = TextEditingController();
  final _cgpaController = TextEditingController(text: '8.5');
  final _skillsController = TextEditingController();
  final _targetFirmsController = TextEditingController();

  bool _isLoading = false;
  Map<String, dynamic>? _simulationResult;

  @override
  void dispose() {
    _interestsController.dispose();
    _cgpaController.dispose();
    _skillsController.dispose();
    _targetFirmsController.dispose();
    super.dispose();
  }

  Future<void> _runSimulation() async {
    if (_interestsController.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Enter your interests first!')),
      );
      return;
    }

    setState(() {
      _isLoading = true;
      _simulationResult = null;
    });

    try {
      final response = await ApiService().post(
        '/api/career/simulate',
        data: {
          'interests': _interestsController.text.split(',').map((e) => e.trim()).toList(),
          'cgpa': double.tryParse(_cgpaController.text) ?? 8.5,
          'skills': _skillsController.text.split(',').map((e) => e.trim()).toList(),
          'targetCompanies': _targetFirmsController.text.split(',').map((e) => e.trim()).toList(),
        },
      );

      setState(() {
        _simulationResult = response.data;
      });
    } catch (e) {
      String errorMsg = 'Simulation failed. Please try again.';
      if (e is DioException && e.response?.data != null) {
        errorMsg = e.response?.data['error']?.toString() ?? errorMsg;
      }
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(errorMsg)),
        );
      }
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  Widget _buildInput(String label, String hint, TextEditingController controller, {bool isNumber = false}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: GoogleFonts.fredoka(fontSize: 16, fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 8),
        TextField(
          controller: controller,
          keyboardType: isNumber ? const TextInputType.numberWithOptions(decimal: true) : TextInputType.text,
          style: GoogleFonts.fredoka(fontSize: 16),
          decoration: InputDecoration(
            hintText: hint,
            hintStyle: GoogleFonts.fredoka(color: Colors.grey),
            filled: true,
            fillColor: Colors.white,
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(8),
              borderSide: const BorderSide(color: AppColors.brutalBlack, width: 2),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(8),
              borderSide: const BorderSide(color: AppColors.brutalBlack, width: 3),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildTrajectoryCard(Map<String, dynamic> path) {
    final type = path['type']?.toString() ?? 'Path';
    final probability = path['probability']?.toString() ?? '50';
    final title = path['title']?.toString() ?? 'Career Path';
    final narrative = path['narrative']?.toString() ?? '';
    final targetRole = path['targetRole']?.toString() ?? '';
    final expectedSalary = path['expectedSalary']?.toString() ?? '';
    
    final isDark = Theme.of(context).brightness == Brightness.dark;
    
    Color cardColor;
    if (isDark) {
      if (type.toLowerCase() == 'conservative') {
        cardColor = const Color(0xFF0F2D1D);
      } else if (type.toLowerCase() == 'ambitious') {
        cardColor = const Color(0xFF3B1D24);
      } else {
        cardColor = const Color(0xFF3A2D0F);
      }
    } else {
      if (type.toLowerCase() == 'conservative') {
        cardColor = AppColors.statGreen;
      } else if (type.toLowerCase() == 'ambitious') {
        cardColor = AppColors.statRed;
      } else {
        cardColor = AppColors.statAmber;
      }
    }

    final textColor = isDark ? Colors.white : Colors.black;
    final subTextColor = isDark ? Colors.white70 : Colors.black87;

    return Padding(
      padding: const EdgeInsets.only(bottom: 16.0),
      child: BrutalistCard(
        backgroundColor: cardColor,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    border: Border.all(color: AppColors.brutalBlack, width: 2),
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Text(
                    type.toUpperCase(),
                    style: GoogleFonts.spaceMono(
                      fontWeight: FontWeight.bold,
                      fontSize: 12,
                      color: Colors.black,
                    ),
                  ),
                ),
                Text(
                  '$probability%',
                  style: GoogleFonts.fredoka(
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                    color: AppColors.senseiBlue,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Text(
              title,
              style: GoogleFonts.fredoka(
                fontSize: 20,
                fontWeight: FontWeight.bold,
                color: textColor,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              '"$narrative"',
              style: GoogleFonts.fredoka(
                fontSize: 14,
                fontStyle: FontStyle.italic,
                color: subTextColor,
              ),
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Icon(Icons.track_changes, size: 16, color: subTextColor),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    targetRole,
                    style: GoogleFonts.fredoka(
                      fontWeight: FontWeight.bold,
                      color: subTextColor,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 4),
            Row(
              children: [
                Icon(Icons.trending_up, size: 16, color: subTextColor),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    expectedSalary,
                    style: GoogleFonts.fredoka(
                      fontWeight: FontWeight.bold,
                      color: subTextColor,
                    ),
                  ),
                ),
              ],
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
          'CAREER SIMULATOR 🚀',
          style: GoogleFonts.fredoka(fontWeight: FontWeight.bold),
        ),
        backgroundColor: Colors.transparent,
        elevation: 0,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            BrutalistCard(
              backgroundColor: isDark ? const Color(0xFF1E293B) : Colors.white,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  _buildInput('⚡ Interests', 'e.g. AI, Space Tech, Finance', _interestsController),
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      Expanded(child: _buildInput('🎯 CGPA', '8.5', _cgpaController, isNumber: true)),
                      const SizedBox(width: 16),
                      Expanded(child: _buildInput('🏢 Target Firms', 'Google, SpaceX', _targetFirmsController)),
                    ],
                  ),
                  const SizedBox(height: 16),
                  _buildInput('🎯 Current Skills', 'e.g. Python, React', _skillsController),
                  const SizedBox(height: 24),
                  ComicCard(
                    onTap: _isLoading ? null : _runSimulation,
                    backgroundColor: AppColors.senseiBlue,
                    child: Center(
                      child: _isLoading
                          ? const CircularProgressIndicator(color: Colors.white)
                          : Text(
                              'RUN MONTE CARLO SIMULATION',
                              style: GoogleFonts.fredoka(
                                fontSize: 18,
                                fontWeight: FontWeight.bold,
                                color: Colors.white,
                              ),
                            ),
                    ),
                  ),
                ],
              ),
            ),
            if (_simulationResult != null) ...[
              const SizedBox(height: 32),
              Text(
                'YOUR TRAJECTORIES 📈',
                style: GoogleFonts.fredoka(fontSize: 24, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 16),
              ...(_simulationResult!['trajectories'] as List<dynamic>? ?? []).map(
                (path) => _buildTrajectoryCard(path as Map<String, dynamic>),
              ),
              const SizedBox(height: 16),
              BrutalistCard(
                backgroundColor: isDark ? const Color(0xFF1E293B) : Colors.white,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        const Icon(Icons.trending_up, color: AppColors.senseiCoral),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            'Market Insights & Skill Gaps',
                            style: GoogleFonts.fredoka(fontSize: 20, fontWeight: FontWeight.bold),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    Text('Trending Skills', style: GoogleFonts.fredoka(fontWeight: FontWeight.bold, fontSize: 16)),
                    const SizedBox(height: 8),
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: ((_simulationResult!['marketInsights']?['trendingSkills'] as List<dynamic>?) ?? []).map((skill) {
                        return Container(
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                          decoration: BoxDecoration(
                            color: AppColors.senseiCoral,
                            border: Border.all(color: AppColors.brutalBlack, width: 2),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Text(
                            skill.toString(),
                            style: GoogleFonts.fredoka(color: Colors.black, fontWeight: FontWeight.bold),
                          ),
                        );
                      }).toList(),
                    ),
                    const SizedBox(height: 16),
                    Text('Your Skill Gaps', style: GoogleFonts.fredoka(fontWeight: FontWeight.bold, fontSize: 16, color: Colors.red)),
                    const SizedBox(height: 8),
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: ((_simulationResult!['resumeMatch']?['gaps'] as List<dynamic>?) ?? []).map((gap) {
                        return Container(
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                          decoration: BoxDecoration(
                            color: Colors.red.shade50,
                            border: Border.all(color: Colors.red.shade200, width: 2),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Text(
                            '❌ ${gap.toString()}',
                            style: GoogleFonts.fredoka(color: Colors.red.shade700, fontWeight: FontWeight.bold),
                          ),
                        );
                      }).toList(),
                    ),
                  ],
                ),
              ),
            ]
          ],
        ),
      ),
    );
  }
}
