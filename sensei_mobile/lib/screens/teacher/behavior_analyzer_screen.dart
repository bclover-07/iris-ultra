import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../services/api_service.dart';
import '../../theme/neubrutalist_widgets.dart';
import '../../theme/app_colors.dart';
import 'package:go_router/go_router.dart';

class BehaviorAnalyzerScreen extends ConsumerStatefulWidget {
  const BehaviorAnalyzerScreen({super.key});

  @override
  ConsumerState<BehaviorAnalyzerScreen> createState() => _BehaviorAnalyzerScreenState();
}

class _BehaviorAnalyzerScreenState extends ConsumerState<BehaviorAnalyzerScreen> {
  List<dynamic> _classes = [];
  String? _selectedClass;
  bool _isLoadingClasses = true;
  bool _isAnalyzing = false;
  String? _fetchError;
  Map<String, dynamic>? _data;
  Map<String, dynamic>? _existingAlerts;
  int? _expandedCluster;

  @override
  void initState() {
    super.initState();
    _fetchInitialData();
  }

  Future<void> _fetchInitialData() async {
    setState(() {
      _isLoadingClasses = true;
      _fetchError = null;
    });
    try {
      final api = ApiService();
      final classesResponse = await api.get('/api/teacher/classes');
      final alertsResponse = await api.get('/api/behavior/alerts');

      if (mounted) {
        setState(() {
          final cls = classesResponse.data is Map ? (classesResponse.data['classes'] ?? []) : (classesResponse.data is List ? classesResponse.data : []);
          _classes = cls;
          if (_classes.isNotEmpty) {
            _selectedClass = _classes.first['_id'];
          }
          _existingAlerts = alertsResponse.data;
          _isLoadingClasses = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _fetchError = 'Failed to load behavior data. Check your connection and try again.';
          _isLoadingClasses = false;
        });
      }
    }
  }

  Future<void> _runAnalysis() async {
    if (_selectedClass == null) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Select a class first')));
      return;
    }
    setState(() => _isAnalyzing = true);
    try {
      final locale = Localizations.localeOf(context).languageCode;
      final response = await ApiService().post(
        '/api/behavior/analyze/$_selectedClass',
        data: {'language': locale},
      );
      if (mounted) {
        setState(() {
          _data = response.data['fingerprint'];
          _isAnalyzing = false;
        });
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Behavioral analysis complete!')));
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isAnalyzing = false);
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Analysis failed: $e')));
      }
    }
  }

  Color _getAlertColor(String severity) {
    switch (severity) {
      case 'critical': return AppColors.senseiCoral;
      case 'warning': return AppColors.brutalistCyan;
      case 'info': return AppColors.senseiBlue;
      default: return AppColors.senseiBlue;
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    final List<dynamic> alerts = _data?['alerts'] ?? _existingAlerts?['alerts'] ?? [];
    final List<dynamic> correlations = _data?['correlations'] ?? _existingAlerts?['correlations'] ?? [];
    final List<dynamic> clusters = _data?['clusters'] ?? _existingAlerts?['clusters'] ?? [];

    return Scaffold(
      backgroundColor: AppColors.brutalBg,
      appBar: AppBar(
        title: Text('BEHAVIOR ANALYZER 🧠', style: GoogleFonts.fredoka(fontWeight: FontWeight.bold)),
        backgroundColor: Colors.transparent,
        elevation: 0,
      ),
      body: _isLoadingClasses
          ? const Center(child: CircularProgressIndicator())
          : _fetchError != null
              ? Center(
                  child: Padding(
                    padding: const EdgeInsets.all(32),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text(_fetchError!, textAlign: TextAlign.center, style: GoogleFonts.inter(fontWeight: FontWeight.bold)),
                        const SizedBox(height: 16),
                        ComicButton(label: 'RETRY', backgroundColor: AppColors.comicCyan, onPressed: _fetchInitialData),
                      ],
                    ),
                  ),
                )
              : SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  BrutalistCard(
                    backgroundColor: AppColors.comicCyan,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        Text('SELECT CLASS', style: GoogleFonts.spaceMono(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.grey)),
                        const SizedBox(height: 4),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 12),
                          decoration: BoxDecoration(
                            color: isDark ? const Color(0xFF0F172A) : Colors.white,
                            border: Border.all(color: AppColors.brutalBlack, width: 2),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: DropdownButtonHideUnderline(
                            child: DropdownButton<String>(
                              value: _selectedClass,
                              isExpanded: true,
                              dropdownColor: isDark ? const Color(0xFF1E293B) : Colors.white,
                              hint: Text('Select Class', style: GoogleFonts.fredoka()),
                              items: _classes.map((c) => DropdownMenuItem(value: c['_id'].toString(), child: Text(c['name'] ?? 'Class', style: GoogleFonts.fredoka()))).toList(),
                              onChanged: (v) => setState(() => _selectedClass = v),
                            ),
                          ),
                        ),
                        const SizedBox(height: 16),
                        ComicCard(
                          onTap: _isAnalyzing ? null : _runAnalysis,
                          backgroundColor: AppColors.senseiPurple,
                          child: Padding(
                            padding: const EdgeInsets.symmetric(vertical: 12),
                            child: Center(
                              child: _isAnalyzing
                                  ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                                  : Text('ANALYZE', style: GoogleFonts.fredoka(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.white)),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 32),
                  
                  Row(
                    children: [
                      const Icon(Icons.warning_amber, color: AppColors.senseiCoral),
                      const SizedBox(width: 8),
                      Text('PROACTIVE ALERTS', style: GoogleFonts.fredoka(fontSize: 20, fontWeight: FontWeight.bold)),
                    ],
                  ),
                  const SizedBox(height: 16),
                  if (alerts.isEmpty)
                    Padding(
                      padding: const EdgeInsets.symmetric(vertical: 24),
                      child: Text('No alerts yet. Run analysis on a class to generate insights.', style: GoogleFonts.inter(fontWeight: FontWeight.bold), textAlign: TextAlign.center),
                    )
                  else
                  ...alerts.map((alert) {
                    final color = _getAlertColor(alert['severity'] ?? 'info');
                    return Padding(
                      padding: const EdgeInsets.only(bottom: 16),
                      child: BrutalistCard(
                        backgroundColor: color,
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                              color: Colors.black,
                              child: Text((alert['severity'] ?? 'info').toString().toUpperCase(), style: GoogleFonts.spaceMono(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.white)),
                            ),
                            const SizedBox(height: 12),
                            Text(alert['message'] ?? '', style: GoogleFonts.fredoka(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.black)),
                            if (alert['matchedStudents'] != null && (alert['matchedStudents'] as List).isNotEmpty) ...[
                              const SizedBox(height: 12),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                decoration: BoxDecoration(color: Colors.white, border: Border.all(color: Colors.black)),
                                child: Text('IMPACTED: ${(alert['matchedStudents'] as List).join(', ')}', style: GoogleFonts.spaceMono(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.black)),
                              ),
                            ],
                            if (alert['actionSuggestion'] != null) ...[
                              const SizedBox(height: 12),
                              Container(
                                padding: const EdgeInsets.all(8),
                                color: Colors.white.withValues(alpha: 0.5),
                                child: Text('💡 ${alert['actionSuggestion']}', style: GoogleFonts.fredoka(fontWeight: FontWeight.bold, color: Colors.black)),
                              ),
                            ],
                            const SizedBox(height: 16),
                            SizedBox(
                              width: double.infinity,
                              child: ElevatedButton(
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: Colors.white,
                                  foregroundColor: Colors.black,
                                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(0), side: const BorderSide(color: Colors.black, width: 2)),
                                ),
                                onPressed: () {
                                  context.push('/teacher/interventions');
                                },
                                child: Text('TAKE ACTION', style: GoogleFonts.fredoka(fontWeight: FontWeight.bold)),
                              ),
                            ),
                          ],
                        ),
                      ),
                    );
                  }),

                  const SizedBox(height: 32),
                  Text('DEEP CORRELATIONS', style: GoogleFonts.fredoka(fontSize: 20, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 16),
                  ...correlations.map((corr) => Padding(
                    padding: const EdgeInsets.only(bottom: 16),
                    child: BrutalistCard(
                      backgroundColor: AppColors.brutalistCyan,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                            color: Colors.black,
                            child: Text((corr['pattern'] ?? '').toString().toUpperCase(), style: GoogleFonts.spaceMono(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.white)),
                          ),
                          const SizedBox(height: 12),
                          Text(corr['impactDescription'] ?? '', style: GoogleFonts.fredoka(fontSize: 16, fontWeight: FontWeight.bold)),
                          if (corr['pedagogyRecommendation'] != null) ...[
                            const SizedBox(height: 12),
                            Container(
                              padding: const EdgeInsets.all(12),
                              decoration: BoxDecoration(color: AppColors.brutalistCyan, border: Border.all(color: Colors.black)),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text('RECOMMENDATION', style: GoogleFonts.spaceMono(fontSize: 10, fontWeight: FontWeight.bold)),
                                  const SizedBox(height: 4),
                                  Text(corr['pedagogyRecommendation'], style: GoogleFonts.fredoka(fontWeight: FontWeight.bold)),
                                ],
                              ),
                            ),
                          ],
                          if (corr['affectedCount'] != null && corr['affectedCount'] > 0) ...[
                            const SizedBox(height: 12),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                              decoration: BoxDecoration(color: Colors.white, border: Border.all(color: Colors.black)),
                              child: Text('${corr['affectedCount']} students affected', style: GoogleFonts.spaceMono(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.black)),
                            ),
                          ],
                        ],
                      ),
                    ),
                  )),

                  const SizedBox(height: 32),
                  Text('AI COHORT CLUSTERS', style: GoogleFonts.fredoka(fontSize: 20, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 16),
                  ...clusters.asMap().entries.map((entry) {
                    final idx = entry.key;
                    final cluster = entry.value;
                    final isExpanded = _expandedCluster == idx;

                    return Padding(
                      padding: const EdgeInsets.only(bottom: 8),
                      child: BrutalistCard(
                        backgroundColor: AppColors.brutalistCyan,
                        child: Column(
                          children: [
                            InkWell(
                              onTap: () => setState(() => _expandedCluster = isExpanded ? null : idx),
                              child: Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Row(
                                    children: [
                                      Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                        color: Colors.black,
                                        child: Text(cluster['clusterId'] ?? 'C-?', style: GoogleFonts.spaceMono(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.white)),
                                      ),
                                      const SizedBox(width: 12),
                                      Text('${cluster['size'] ?? 0} Students', style: GoogleFonts.fredoka(fontSize: 18, fontWeight: FontWeight.bold)),
                                    ],
                                  ),
                                  Icon(isExpanded ? Icons.expand_less : Icons.expand_more),
                                ],
                              ),
                            ),
                            if (isExpanded) ...[
                              const SizedBox(height: 16),
                              Container(
                                padding: const EdgeInsets.all(12),
                                color: isDark ? const Color(0xFF0F172A) : Colors.grey.shade100,
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text('MEMBERS', style: GoogleFonts.spaceMono(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.grey)),
                                    const SizedBox(height: 8),
                                    Wrap(
                                      spacing: 8,
                                      runSpacing: 8,
                                      children: ((cluster['members'] as List?) ?? []).map((m) => Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                        decoration: BoxDecoration(color: Colors.white, border: Border.all(color: Colors.black)),
                                        child: Text(m.toString(), style: GoogleFonts.spaceMono(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.black)),
                                      )).toList(),
                                    ),
                                    const SizedBox(height: 16),
                                    Container(
                                      padding: const EdgeInsets.all(12),
                                      decoration: BoxDecoration(color: AppColors.senseiBlue, border: Border.all(color: Colors.black)),
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          Text('EXPLAINABLE AI', style: GoogleFonts.spaceMono(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.black)),
                                          const SizedBox(height: 4),
                                          Text(cluster['impactDescription'] ?? 'Consistent pattern identified.', style: GoogleFonts.fredoka(fontWeight: FontWeight.bold, color: Colors.black)),
                                        ],
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ],
                        ),
                      ),
                    );
                  }),
                ],
              ),
            ),
    );
  }
}
