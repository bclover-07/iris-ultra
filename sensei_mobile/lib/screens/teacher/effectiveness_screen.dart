import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../services/api_service.dart';
import '../../theme/app_colors.dart';

class EffectivenessScreen extends ConsumerStatefulWidget {
  const EffectivenessScreen({super.key});

  @override
  ConsumerState<EffectivenessScreen> createState() => _EffectivenessScreenState();
}

class _EffectivenessScreenState extends ConsumerState<EffectivenessScreen> {
  Map<String, dynamic>? _data;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _fetchEffectiveness();
  }

  Future<void> _fetchEffectiveness() async {
    try {
      final api = ApiService();
      final effResponse = await api.get('/api/teacher/effectiveness');
      final dashResponse = await api.get('/api/teacher/dashboard');
      if (mounted) {
        setState(() {
          _data = {
            'eff': effResponse.data ?? {},
            'dash': dashResponse.data ?? {},
          };
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _data = {};
          _isLoading = false;
        });
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to load effectiveness data: $e')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return Scaffold(
        backgroundColor: AppColors.brutalBg,
        body: const Center(child: CircularProgressIndicator(color: AppColors.teacherAccent)),
      );
    }

    final score = _data?['eff']?['effectivenessScore'] ?? 0;
    final passRate = _data?['eff']?['classPassRate'] ?? _data?['dash']?['classPassRate'] ?? 0;
    final recommendations = _data?['eff']?['recommendations'] ?? _data?['dash']?['teachingRecommendations'] ?? [];
    final summary = _data?['eff']?['summary'] ?? _data?['dash']?['effectivenessSummary'] ?? '';

    return Scaffold(
      backgroundColor: AppColors.brutalBg,
      appBar: AppBar(
        backgroundColor: AppColors.brutalBg,
        elevation: 0,
        scrolledUnderElevation: 0,
        title: Text(
          'Effectiveness',
          style: GoogleFonts.spaceGrotesk(
            color: AppColors.brutalBlack,
            fontWeight: FontWeight.w900,
            fontSize: 24,
            letterSpacing: -1,
          ),
        ),
        iconTheme: const IconThemeData(color: AppColors.brutalBlack),
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(2),
          child: Container(color: AppColors.brutalBlack, height: 2),
        ),
      ),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          Row(
            children: [
              Container(
                width: 50, height: 50,
                decoration: BoxDecoration(
                  gradient: const LinearGradient(colors: [AppColors.senseiPurple, Colors.indigo]),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: AppColors.brutalBlack, width: 2),
                  boxShadow: const [BoxShadow(color: AppColors.brutalBlack, offset: Offset(2, 2))],
                ),
                child: const Icon(Icons.star, color: Colors.white),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Teaching Effectiveness',
                      style: GoogleFonts.spaceGrotesk(
                        fontSize: 24,
                        fontWeight: FontWeight.w900,
                        color: AppColors.brutalBlack,
                        height: 1.1,
                      ),
                    ),
                    Text(
                      'AI-powered analysis of your teaching impact',
                      style: GoogleFonts.inter(
                        fontSize: 12,
                        color: Colors.grey.shade700,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 24),

          // Stats Grid
          GridView.count(
            crossAxisCount: MediaQuery.of(context).size.width > 400 ? 2 : 1,
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            crossAxisSpacing: 16,
            mainAxisSpacing: 16,
            childAspectRatio: 1.3,
            children: [
              _buildStatCard('Effectiveness', '$score%', Icons.stars, AppColors.senseiPurple),
              _buildStatCard('Pass Rate', '$passRate%', Icons.trending_up, AppColors.senseiGreen),
              _buildStatCard('At-Risk', '${_data?['dash']?['atRiskCount'] ?? 0}', Icons.people_outline, AppColors.senseiPink),
              _buildStatCard('Students', '${_data?['dash']?['totalStudents'] ?? 0}', Icons.bar_chart, AppColors.senseiBlue),
            ],
          ),
          const SizedBox(height: 24),

          // Overall Score Card
          Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: AppColors.senseiPurple.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: AppColors.brutalBlack, width: 2),
              boxShadow: const [BoxShadow(color: AppColors.brutalBlack, offset: Offset(4, 4))],
            ),
            child: Column(
              children: [
                Text('Overall Score', style: GoogleFonts.spaceGrotesk(fontSize: 20, fontWeight: FontWeight.bold)),
                const SizedBox(height: 16),
                Stack(
                  alignment: Alignment.center,
                  children: [
                    SizedBox(
                      width: 150, height: 150,
                      child: CircularProgressIndicator(
                        value: score / 100,
                        strokeWidth: 12,
                        backgroundColor: AppColors.brutalBlack.withValues(alpha: 0.1),
                        color: AppColors.senseiPurple,
                        strokeCap: StrokeCap.round,
                      ),
                    ),
                    Column(
                      children: [
                        Text('$score', style: GoogleFonts.spaceGrotesk(fontSize: 48, fontWeight: FontWeight.bold, color: AppColors.senseiPurple)),
                        Text('/100', style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.grey.shade600)),
                      ],
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                if (summary.isNotEmpty)
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      border: Border.all(color: AppColors.brutalBlack),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      summary,
                      style: GoogleFonts.inter(fontSize: 14, color: AppColors.senseiPurple.withValues(alpha: 0.8), fontWeight: FontWeight.w600),
                    ),
                  ),
              ],
            ),
          ),
          const SizedBox(height: 24),

          // Recommendations
          if (recommendations.isNotEmpty)
            Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: AppColors.senseiGreen.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: AppColors.brutalBlack, width: 2),
                boxShadow: const [BoxShadow(color: AppColors.brutalBlack, offset: Offset(4, 4))],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      const Icon(Icons.lightbulb, color: Colors.amber),
                      const SizedBox(width: 8),
                      Text('AI Recommendations', style: GoogleFonts.spaceGrotesk(fontSize: 20, fontWeight: FontWeight.bold)),
                    ],
                  ),
                  const SizedBox(height: 16),
                  ...List.generate(recommendations.length, (i) {
                    return Padding(
                      padding: const EdgeInsets.only(bottom: 12),
                      child: Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: Colors.white.withValues(alpha: 0.8),
                          border: Border.all(color: AppColors.brutalBlack),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Container(
                              width: 24, height: 24,
                              decoration: BoxDecoration(color: Colors.amber, borderRadius: BorderRadius.circular(6)),
                              alignment: Alignment.center,
                              child: Text('${i + 1}', style: GoogleFonts.spaceGrotesk(color: Colors.white, fontWeight: FontWeight.bold)),
                            ),
                            const SizedBox(width: 12),
                            Expanded(child: Text(recommendations[i], style: GoogleFonts.inter(fontSize: 14, color: Colors.grey.shade800))),
                          ],
                        ),
                      ),
                    );
                  }),
                ],
              ),
            ),
            
          const SizedBox(height: 32),
        ],
      ),
    );
  }

  Widget _buildStatCard(String label, String value, IconData icon, Color color) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.brutalBlack, width: 2),
        boxShadow: const [BoxShadow(color: AppColors.brutalBlack, offset: Offset(2, 2))],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(icon, color: color, size: 20),
          const Spacer(),
          Text(value, style: GoogleFonts.spaceGrotesk(fontSize: 24, fontWeight: FontWeight.bold, color: AppColors.brutalBlack)),
          Text(label.toUpperCase(), style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.grey.shade700)),
        ],
      ),
    );
  }
}
