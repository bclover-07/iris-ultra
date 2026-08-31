import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:fl_chart/fl_chart.dart';
import '../../theme/neubrutalist_widgets.dart';
import '../../theme/app_colors.dart';
import '../../services/api_service.dart';
import 'package:share_plus/share_plus.dart';

class ReportsScreen extends StatefulWidget {
  const ReportsScreen({super.key});

  @override
  State<ReportsScreen> createState() => _ReportsScreenState();
}

class _ReportsScreenState extends State<ReportsScreen> {
  String? _generating;
  bool _isLoading = true;
  String? _error;
  Map<String, dynamic> _distribution = {};
  List<dynamic> _recentReports = [];

  int _distValue(String key) => (_distribution[key] is num) ? (_distribution[key] as num).toInt() : 0;

  @override
  void initState() {
    super.initState();
    _fetchReports();
  }

  Future<void> _fetchReports() async {
    try {
      final res = await ApiService().get('/api/teacher/reports');
      if (mounted) {
        setState(() {
          if (res.data is Map) {
            _distribution = Map<String, dynamic>.from(res.data['distribution'] ?? {});
            _recentReports = res.data['recentReports'] ?? [];
          }
          _error = null;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _distribution = {};
          _recentReports = [];
          _error = 'Failed to load reports from server';
          _isLoading = false;
        });
      }
    }
  }

  final List<Map<String, dynamic>> _reportTypes = [
    { 'title': 'Class Performance', 'desc': 'Comprehensive summary of class grades and trends', 'emoji': '📊', 'color': AppColors.brutalistCyan },
    { 'title': 'At-Risk Students', 'desc': 'List of students needing intervention this term', 'emoji': '⚠️', 'color': AppColors.senseiCoral },
    { 'title': 'Intervention Effectiveness', 'desc': 'Success rate of interventions this term', 'emoji': '⚡', 'color': AppColors.senseiGreen },
    { 'title': 'Attendance Summary', 'desc': 'Monthly attendance report by class and student', 'emoji': '📅', 'color': AppColors.senseiBlue },
    { 'title': 'Subject Analysis', 'desc': 'Per-subject breakdown with student averages', 'emoji': '📚', 'color': AppColors.senseiPurple },
    { 'title': 'NAAC Documentation', 'desc': 'Standardised accreditation and audit report', 'emoji': '📋', 'color': Colors.orange },
  ];



  Future<void> _handleGenerate(String type) async {
    setState(() => _generating = type);
    try {
      await ApiService().post('/api/teacher/reports/generate', data: {'type': type});
      await _fetchReports();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$type report generated!')));
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Failed to generate report')));
      }
    } finally {
      if (mounted) setState(() => _generating = null);
    }
  }

  Future<void> _shareReport(Map<String, dynamic> report) async {
    final title = report['title']?.toString() ?? 'Report';
    final type = report['type']?.toString() ?? '';
    final created = report['createdAt']?.toString().split('T').first ?? '';
    await Share.share('Sensei Report\nTitle: $title\nType: $type\nGenerated: $created');
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: isDark ? const Color(0xFF050508) : AppColors.brutalBg,
      body: Column(
        children: [
          Container(
            padding: const EdgeInsets.only(top: 48, left: 32, right: 32, bottom: 24),
            decoration: const BoxDecoration(
              color: AppColors.senseiBlue,
              border: Border(bottom: BorderSide(color: AppColors.brutalBlack, width: 4)),
            ),
            child: Row(
              children: [
                GestureDetector(
                  onTap: () => Navigator.pop(context),
                  child: Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      border: Border.all(color: AppColors.brutalBlack, width: 2),
                      boxShadow: const [BoxShadow(color: AppColors.brutalBlack, offset: Offset(2, 2))],
                    ),
                    child: const Icon(Icons.arrow_back, color: AppColors.brutalBlack),
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'REPORTS',
                        style: GoogleFonts.inter(
                          fontSize: 32,
                          fontWeight: FontWeight.w900,
                          color: Colors.white,
                          letterSpacing: -1,
                          shadows: const [Shadow(color: AppColors.brutalBlack, offset: Offset(2, 2))],
                        ),
                      ),
                      Text(
                        'DATA & ANALYTICS',
                        style: GoogleFonts.inter(
                          fontSize: 12,
                          fontWeight: FontWeight.bold,
                          color: AppColors.brutalistCyan,
                          letterSpacing: 2,
                        ),
                      ),
                    ],
                  ),
                ),
                const Text('📄', style: TextStyle(fontSize: 40)),
              ],
            ),
          ),
          Expanded(
            child: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(_error!),
                      TextButton(onPressed: _fetchReports, child: const Text('Retry')),
                    ],
                  ),
                )
              : SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            BrutalistCard(
              backgroundColor: AppColors.senseiCoral,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('At-Risk Distribution', style: GoogleFonts.fredoka(fontSize: 20, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 16),
                  if (_distribution.isEmpty || (_distValue('low') == 0 && _distValue('medium') == 0 && _distValue('high') == 0 && _distValue('critical') == 0))
                    Text('No risk distribution data yet.', style: GoogleFonts.inter(fontWeight: FontWeight.bold))
                  else
                    SizedBox(
                      height: 220,
                      child: PieChart(
                        PieChartData(
                          sectionsSpace: 0,
                          centerSpaceRadius: 50,
                          sections: [
                            if (_distValue('low') > 0)
                              PieChartSectionData(value: _distValue('low').toDouble(), color: Colors.green, title: 'Low', radius: 25, titleStyle: GoogleFonts.spaceMono(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.black)),
                            if (_distValue('medium') > 0)
                              PieChartSectionData(value: _distValue('medium').toDouble(), color: Colors.amber, title: 'Med', radius: 25, titleStyle: GoogleFonts.spaceMono(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.black)),
                            if (_distValue('high') > 0)
                              PieChartSectionData(value: _distValue('high').toDouble(), color: Colors.orange, title: 'High', radius: 25, titleStyle: GoogleFonts.spaceMono(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.black)),
                            if (_distValue('critical') > 0)
                              PieChartSectionData(value: _distValue('critical').toDouble(), color: Colors.red, title: 'Crit', radius: 25, titleStyle: GoogleFonts.spaceMono(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.black)),
                          ],
                        ),
                      ),
                    ),
                ],
              ),
            ),
            const SizedBox(height: 32),
            
            Text('AVAILABLE REPORTS', style: GoogleFonts.fredoka(fontSize: 20, fontWeight: FontWeight.bold)),
            const SizedBox(height: 16),
            GridView.builder(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: MediaQuery.of(context).size.width > 600 ? 3 : (MediaQuery.of(context).size.width > 400 ? 2 : 1),
                crossAxisSpacing: 16,
                mainAxisSpacing: 16,
                childAspectRatio: MediaQuery.of(context).size.width > 400 ? 0.8 : 1.2,
              ),
              itemCount: _reportTypes.length,
              itemBuilder: (context, index) {
                final rt = _reportTypes[index];
                final isGenerating = _generating == rt['title'];

                return BrutalistCard(
                  backgroundColor: rt['color'],
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(rt['emoji'], style: const TextStyle(fontSize: 32)),
                      const SizedBox(height: 8),
                      Text(rt['title'], style: GoogleFonts.fredoka(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.black)),
                      const SizedBox(height: 4),
                      Expanded(
                        child: Text(rt['desc'], style: GoogleFonts.spaceMono(fontSize: 10, color: Colors.black87), maxLines: 3, overflow: TextOverflow.ellipsis),
                      ),
                      const SizedBox(height: 8),
                      SizedBox(
                        width: double.infinity,
                        child: ElevatedButton(
                          style: ElevatedButton.styleFrom(
                            backgroundColor: Colors.white,
                            foregroundColor: Colors.black,
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(0), side: const BorderSide(color: Colors.black, width: 2)),
                            padding: const EdgeInsets.symmetric(vertical: 8),
                          ),
                          onPressed: isGenerating ? null : () => _handleGenerate(rt['title']),
                          child: isGenerating
                              ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.black))
                              : Row(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    const Icon(Icons.download, size: 14),
                                    const SizedBox(width: 4),
                                    Text('PDF', style: GoogleFonts.fredoka(fontWeight: FontWeight.bold, fontSize: 12)),
                                  ],
                                ),
                        ),
                      ),
                    ],
                  ),
                );
              },
            ),

            const SizedBox(height: 32),
            Text('RECENT REPORTS', style: GoogleFonts.fredoka(fontSize: 20, fontWeight: FontWeight.bold)),
            const SizedBox(height: 16),
            if (_recentReports.isEmpty)
              Text('No reports generated yet.', style: GoogleFonts.inter(fontWeight: FontWeight.bold))
            else
              ..._recentReports.map((r) {
              return Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: BrutalistCard(
                backgroundColor: isDark ? const Color(0xFF1E293B) : Colors.white,
                child: Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(color: AppColors.senseiBlue, borderRadius: BorderRadius.circular(12), border: Border.all(color: Colors.black)),
                      child: const Icon(Icons.description, color: Colors.white),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(r['title'] ?? r['name'] ?? 'Report', style: GoogleFonts.fredoka(fontSize: 16, fontWeight: FontWeight.bold)),
                          Text(r['createdAt'] != null ? r['createdAt'].toString().substring(0, 10) : 'Recently', style: GoogleFonts.spaceMono(fontSize: 12, color: Colors.grey)),
                        ],
                      ),
                    ),
                    IconButton(
                      icon: const Icon(Icons.share),
                      onPressed: () => _shareReport(Map<String, dynamic>.from(r as Map)),
                    ),
                  ],
                ),
              ),
            );
            }),
          ],
        ),
      ),
          ),
        ],
      ),
    );
  }
}
