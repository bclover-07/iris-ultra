import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:fl_chart/fl_chart.dart';
import '../../services/api_service.dart';
import '../../theme/neubrutalist_widgets.dart';
import '../../theme/app_colors.dart';

class AiInsightsScreen extends ConsumerStatefulWidget {
  const AiInsightsScreen({super.key});

  @override
  ConsumerState<AiInsightsScreen> createState() => _AiInsightsScreenState();
}

class _AiInsightsScreenState extends ConsumerState<AiInsightsScreen> {
  int _effectivenessScore = 0;
  List<dynamic> _teachingRecs = [];
  List<Map<String, dynamic>> _coachingInsights = [];
  Map<String, dynamic>? _coachingReport;
  List<FlSpot> _trendSpots = [];
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _fetchData();
  }

  List<FlSpot> _buildTrendSpots(int score, List<dynamic>? history) {
    if (history != null && history.length >= 2) {
      final spots = <FlSpot>[];
      for (var i = 0; i < history.length && i < 4; i++) {
        final item = history[i];
        final value = (item is Map ? item['score'] : null);
        spots.add(FlSpot(i.toDouble(), (value is num ? value : score).toDouble()));
      }
      if (spots.isNotEmpty) return spots;
    }
    return [
      FlSpot(0, (score - 10).clamp(0, 100).toDouble()),
      FlSpot(1, (score - 5).clamp(0, 100).toDouble()),
      FlSpot(2, (score - 2).clamp(0, 100).toDouble()),
      FlSpot(3, score.toDouble()),
    ];
  }

  Future<void> _fetchData() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });
    try {
      final effResponse = await ApiService().get(
        '/api/teacher/effectiveness',
        queryParameters: {'forceRefresh': 'true'},
      );
      final dashResponse = await ApiService().get('/api/teacher/dashboard');

      if (mounted) {
        final effData = effResponse.data is Map ? effResponse.data as Map<String, dynamic> : null;
        final dashData = dashResponse.data is Map ? dashResponse.data as Map<String, dynamic> : null;

        final score = (effData?['effectivenessScore'] ?? dashData?['effectivenessScore'] ?? 0) as num;
        final recs = effData?['recommendations'] ?? dashData?['teachingRecommendations'] ?? [];
        final insightsRaw = effData?['coachingInsights'] ?? [];
        final report = effData?['coachingReport'];

        setState(() {
          _effectivenessScore = score.toInt();
          _teachingRecs = recs is List ? recs : [];
          _coachingInsights = insightsRaw is List
              ? insightsRaw.map((e) => Map<String, dynamic>.from(e as Map)).toList()
              : [];
          _coachingReport = report is Map ? Map<String, dynamic>.from(report) : null;
          _trendSpots = _buildTrendSpots(_effectivenessScore, effData?['scoreHistory']);
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = 'Failed to load coaching insights from the server.';
          _isLoading = false;
        });
      }
    }
  }

  Color _getTypeColor(String type) {
    switch (type) {
      case 'strength':
        return AppColors.senseiGreen;
      case 'weakness':
        return Colors.orange;
      case 'observation':
        return AppColors.senseiBlue;
      default:
        return Colors.grey;
    }
  }

  IconData _getTypeIcon(String type) {
    switch (type) {
      case 'strength':
        return Icons.auto_awesome;
      case 'weakness':
        return Icons.track_changes;
      default:
        return Icons.visibility;
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: isDark ? const Color(0xFF050508) : AppColors.brutalBg,
      appBar: AppBar(
        title: Text('MY COACHING 🧠', style: GoogleFonts.fredoka(fontWeight: FontWeight.bold)),
        backgroundColor: Colors.transparent,
        elevation: 0,
        actions: [
          IconButton(icon: const Icon(Icons.refresh), onPressed: _fetchData),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? Center(
                  child: Padding(
                    padding: const EdgeInsets.all(24),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text(_error!, textAlign: TextAlign.center),
                        const SizedBox(height: 16),
                        ElevatedButton(onPressed: _fetchData, child: const Text('Retry')),
                      ],
                    ),
                  ),
                )
              : RefreshIndicator(
                  onRefresh: _fetchData,
                  child: SingleChildScrollView(
                    physics: const AlwaysScrollableScrollPhysics(),
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        BrutalistCard(
                          backgroundColor: isDark ? const Color(0xFF1E293B) : AppColors.brutalistCyan,
                          child: Column(
                            children: [
                              Text('OVERALL SCORE', style: GoogleFonts.spaceMono(fontSize: 14, fontWeight: FontWeight.bold)),
                              const SizedBox(height: 16),
                              Stack(
                                alignment: Alignment.center,
                                children: [
                                  SizedBox(
                                    width: 140,
                                    height: 140,
                                    child: CircularProgressIndicator(
                                      value: _effectivenessScore / 100,
                                      strokeWidth: 12,
                                      backgroundColor: isDark ? const Color(0xFF0F172A) : Colors.white,
                                      color: AppColors.senseiGreen,
                                    ),
                                  ),
                                  Text('$_effectivenessScore%', style: GoogleFonts.fredoka(fontSize: 32, fontWeight: FontWeight.bold)),
                                ],
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 24),
                        Text('4-WEEK TREND', style: GoogleFonts.fredoka(fontSize: 20, fontWeight: FontWeight.bold)),
                        const SizedBox(height: 16),
                        BrutalistCard(
                          backgroundColor: isDark ? const Color(0xFF1E293B) : Colors.white,
                          child: SizedBox(
                            height: 200,
                            child: LineChart(
                              LineChartData(
                                gridData: const FlGridData(show: false),
                                titlesData: FlTitlesData(
                                  bottomTitles: AxisTitles(
                                    sideTitles: SideTitles(
                                      showTitles: true,
                                      getTitlesWidget: (value, meta) {
                                        const titles = ['W1', 'W2', 'W3', 'W4'];
                                        if (value.toInt() >= 0 && value.toInt() < titles.length) {
                                          return Text(titles[value.toInt()], style: GoogleFonts.spaceMono(fontSize: 10, fontWeight: FontWeight.bold));
                                        }
                                        return const Text('');
                                      },
                                      reservedSize: 22,
                                    ),
                                  ),
                                  leftTitles: AxisTitles(
                                    sideTitles: SideTitles(
                                      showTitles: true,
                                      reservedSize: 28,
                                      getTitlesWidget: (value, meta) => Text(value.toInt().toString(), style: GoogleFonts.spaceMono(fontSize: 10)),
                                    ),
                                  ),
                                  topTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                                  rightTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                                ),
                                minX: 0,
                                maxX: 3,
                                minY: 0,
                                maxY: 100,
                                lineBarsData: [
                                  LineChartBarData(
                                    spots: _trendSpots,
                                    isCurved: true,
                                    color: AppColors.senseiGreen,
                                    barWidth: 4,
                                    dotData: const FlDotData(show: true),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(height: 32),
                        Text('TEACHING OBSERVATIONS', style: GoogleFonts.fredoka(fontSize: 20, fontWeight: FontWeight.bold)),
                        const SizedBox(height: 16),
                        if (_coachingInsights.isEmpty)
                          BrutalistCard(
                            child: Text(
                              'No insights available yet. Pull to refresh to generate AI coaching insights.',
                              style: GoogleFonts.inter(fontWeight: FontWeight.bold),
                            ),
                          )
                        else
                          ..._coachingInsights.map((insight) {
                            final type = insight['type']?.toString() ?? 'observation';
                            return Padding(
                              padding: const EdgeInsets.only(bottom: 16),
                              child: BrutalistCard(
                                backgroundColor: _getTypeColor(type).withValues(alpha: isDark ? 0.2 : 0.8),
                                child: Row(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Icon(_getTypeIcon(type)),
                                    const SizedBox(width: 16),
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          Text(type.toUpperCase(), style: GoogleFonts.spaceMono(fontSize: 10, fontWeight: FontWeight.bold)),
                                          const SizedBox(height: 8),
                                          Text(insight['title']?.toString() ?? '', style: GoogleFonts.fredoka(fontSize: 16, fontWeight: FontWeight.bold)),
                                          if (insight['actionLabel'] != null)
                                            Padding(
                                              padding: const EdgeInsets.only(top: 8),
                                              child: Text(insight['actionLabel'].toString(), style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.bold)),
                                            ),
                                        ],
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            );
                          }),
                        if (_coachingReport != null && (_coachingReport!['bullets'] as List?)?.isNotEmpty == true) ...[
                          const SizedBox(height: 32),
                          Text('WEEKLY COACHING REPORT', style: GoogleFonts.fredoka(fontSize: 20, fontWeight: FontWeight.bold)),
                          const SizedBox(height: 16),
                          BrutalistCard(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text('TREND: ${(_coachingReport!['trend'] ?? 'stable').toString().toUpperCase()}', style: GoogleFonts.spaceMono(fontWeight: FontWeight.bold)),
                                const SizedBox(height: 16),
                                ...(_coachingReport!['bullets'] as List).map((bullet) => Padding(
                                  padding: const EdgeInsets.only(bottom: 8),
                                  child: Text('• $bullet', style: GoogleFonts.inter(fontSize: 14)),
                                )),
                              ],
                            ),
                          ),
                        ],
                        if (_teachingRecs.isNotEmpty) ...[
                          const SizedBox(height: 32),
                          Text('RECOMMENDATIONS', style: GoogleFonts.fredoka(fontSize: 20, fontWeight: FontWeight.bold)),
                          const SizedBox(height: 16),
                          ..._teachingRecs.map((rec) => Padding(
                            padding: const EdgeInsets.only(bottom: 12),
                            child: BrutalistCard(
                              child: Text(rec.toString(), style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.bold)),
                            ),
                          )),
                        ],
                      ],
                    ),
                  ),
                ),
    );
  }
}
