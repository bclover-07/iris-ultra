import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:fl_chart/fl_chart.dart';

import '../../providers/student_dashboard_provider.dart';
import '../../theme/app_colors.dart';
import '../../theme/neubrutalist_widgets.dart';

class DashboardScreen extends ConsumerStatefulWidget {
  const DashboardScreen({super.key});

  @override
  ConsumerState<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends ConsumerState<DashboardScreen> {
  int? _expandedRec;

  final Map<Color, Color> darkColors = {
    AppColors.comicBlue: const Color(0xFF60A5FA), // blue
    AppColors.comicGreen: const Color(0xFF4ADE80), // green
    AppColors.comicYellow: const Color(0xFFFBBF24), // amber
    const Color(0xFFCA8A04): const Color(0xFFFACC15), // yellow
    const Color(0xFF854D0E): const Color(0xFFFACC15), // yellow
    AppColors.comicPurple: const Color(0xFFA78BFA), // purple
    AppColors.comicOrange: const Color(0xFFFBBF24), // amber
    AppColors.comicRed: const Color(0xFFF87171), // red
  };

  Color _getDarkColor(Color color, bool isDark) {
    if (!isDark) return color;
    return darkColors[color] ?? color;
  }

  @override
  void initState() {
    super.initState();
    Future.microtask(() {
      ref.read(studentDashboardProvider.notifier).fetchDashboard();
    });
  }

  @override
  Widget build(BuildContext context) {
    final dashState = ref.watch(studentDashboardProvider);
    final isDark = Theme.of(context).brightness == Brightness.dark;

    if (dashState.isLoading) return _buildLoadingSkeleton(isDark);
    if (dashState.error != null) return _buildError(dashState.error!, isDark);
    if (dashState.data == null) return const SizedBox.shrink();

    final data = dashState.data!;

    return Container(
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF0F172A) : AppColors.pageYellow,
        borderRadius: BorderRadius.circular(40),
      ),
      margin: const EdgeInsets.all(8),
      child: RefreshIndicator(
        color: AppColors.gold,
        onRefresh: () => ref.read(studentDashboardProvider.notifier).fetchDashboard(),
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _buildHeaderSection(data, isDark),
              const SizedBox(height: 24),
              _buildStatsGrid(data, isDark),
              const SizedBox(height: 24),
              _buildRiskBanner(data, isDark),
              const SizedBox(height: 24),
              _buildActionCards(data, isDark),
              const SizedBox(height: 24),
              _buildChartsSection(data, isDark),
              const SizedBox(height: 24),
              _buildStreakAndAttendance(data, isDark),
              const SizedBox(height: 24),
              if (data.subjectMarks.isNotEmpty) ...[
                _buildDetailedMarksTable(data, isDark),
                const SizedBox(height: 24),
              ],
              if (data.recommendations.isNotEmpty) ...[
                _buildRecommendations(data, isDark),
                const SizedBox(height: 24),
              ],
              const SizedBox(height: 20),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildHeaderSection(data, bool isDark) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Transform.rotate(
          angle: -0.0174533, // -1 degree
          child: BrutalistCard(
            backgroundColor: isDark ? const Color(0xFF1E293B) : Colors.white,
            padding: const EdgeInsets.all(24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      'MY PROGRESS',
                      style: GoogleFonts.fredoka(
                        fontSize: 28,
                        fontWeight: FontWeight.bold,
                        color: isDark ? Colors.white : AppColors.brutalBlack,
                        letterSpacing: -0.5,
                      ),
                    ),
                    const SizedBox(width: 8),
                    Text('📈', style: TextStyle(fontSize: 28)),
                  ],
                ),
                const SizedBox(height: 4),
                Text(
                  'STATUS: CRUSHING IT!',
                  style: GoogleFonts.fredoka(
                    fontSize: 10,
                    fontWeight: FontWeight.bold,
                    letterSpacing: 2,
                    color: Colors.grey,
                  ),
                ),
              ],
            ),
          ),
        ),
        Transform.scale(
          scale: 1.25,
          child: PowBurst(
            text: 'LVL ${data.level}',
            backgroundColor: isDark ? const Color(0xFF334155) : AppColors.gold,
            textColor: isDark ? Colors.white : AppColors.brutalBlack,
            rotation: 0,
          ),
        ),
      ],
    );
  }

  Widget _buildStatsGrid(data, bool isDark) {
    final stats = [
      {'label': 'CGPA', 'value': data.cgpa.toStringAsFixed(2), 'icon': Icons.trending_up, 'color': AppColors.comicBlue, 'bg': AppColors.statBlue, 'border': AppColors.comicBlue},
      {'label': 'Attend.', 'value': '${data.avgAttendance.round()}%', 'icon': Icons.calendar_today, 'color': data.avgAttendance >= 75 ? AppColors.comicGreen : AppColors.comicOrange, 'bg': AppColors.statGreen, 'border': AppColors.comicGreen},
      {'label': 'Rank', 'value': data.leaderboardPosition != null ? '#${data.leaderboardPosition!.rank}' : '-', 'icon': Icons.emoji_events, 'color': const Color(0xFF854D0E), 'bg': AppColors.statYellow, 'border': const Color(0xFFCA8A04), 'route': '/student/leaderboard'},
      {'label': 'XP', 'value': '${data.totalXP}', 'icon': Icons.bolt, 'color': AppColors.comicPurple, 'bg': AppColors.statPurple, 'border': AppColors.comicPurple, 'route': '/student/leaderboard'},
      {'label': 'Polls', 'value': '${data.activePolls}', 'icon': Icons.bar_chart, 'color': AppColors.comicOrange, 'bg': AppColors.statAmber, 'border': AppColors.comicOrange, 'route': '/student/polls'},
      {'label': 'Tickets', 'value': '${data.pendingHelpTickets}', 'icon': Icons.help_outline, 'color': AppColors.comicRed, 'bg': AppColors.statRed, 'border': AppColors.comicRed, 'route': '/student/help-desk'},
    ];

    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        childAspectRatio: 1.4,
        crossAxisSpacing: 16,
        mainAxisSpacing: 16,
      ),
      itemCount: stats.length,
      itemBuilder: (context, index) {
        final stat = stats[index];
        final statBg = isDark ? const Color(0xFF1E293B) : (stat['bg'] as Color);
        final statBorder = isDark ? const Color(0xFF334155) : (stat['border'] as Color);
        final activeColor = _getDarkColor(stat['color'] as Color, isDark);

        return Stack(
          clipBehavior: Clip.none,
          children: [
            StatCard(
              label: stat['label'] as String,
              value: stat['value'] as String,
              icon: stat['icon'] as IconData,
              iconColor: activeColor,
              backgroundColor: statBg,
              borderColor: statBorder,
              onTap: () {
                if (stat['label'] == 'CGPA') {
                  _showCGPAModal(context, data);
                } else if (stat['label'] == 'Attend.') {
                  _showAttendanceModal(context, data);
                } else if (stat.containsKey('route')) {
                  context.go(stat['route'] as String);
                }
              },
            ),
            Positioned(
              top: -6,
              left: 16,
              child: Transform.rotate(
                angle: -0.0523599, // -3 degrees
                child: Container(
                  width: 40,
                  height: 12,
                  decoration: BoxDecoration(
                    color: isDark ? Colors.white.withValues(alpha: 0.05) : (stat['bg'] as Color).withValues(alpha: 0.8),
                    boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.05), blurRadius: 2)],
                  ),
                ),
              ),
            ),
          ],
        );
      },
    );
  }

  void _showCGPAModal(BuildContext context, data) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => Container(
        height: MediaQuery.of(context).size.height * 0.85,
        decoration: BoxDecoration(
          color: Theme.of(context).brightness == Brightness.dark ? const Color(0xFF1E293B) : Colors.white,
          borderRadius: const BorderRadius.vertical(top: Radius.circular(32)),
          border: Border.all(color: Theme.of(context).brightness == Brightness.dark ? const Color(0xFF334155) : AppColors.brutalBlack, width: 3),
        ),
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text('📈 CGPA Breakdown', style: GoogleFonts.fredoka(fontSize: 24, fontWeight: FontWeight.bold)),
                IconButton(icon: const Icon(Icons.close), onPressed: () => Navigator.pop(context)),
              ],
            ),
            const SizedBox(height: 16),
            Expanded(
              child: ListView(
                children: [
                  BrutalistCard(
                    backgroundColor: Theme.of(context).brightness == Brightness.dark ? const Color(0xFF0F172A) : AppColors.statBlue,
                    child: Column(
                      children: [
                        Text(data.cgpa.toStringAsFixed(2), style: GoogleFonts.fredoka(fontSize: 48, fontWeight: FontWeight.bold, color: AppColors.comicBlue)),
                        Text('CURRENT CGPA', style: GoogleFonts.fredoka(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.grey.shade800)),
                      ],
                    ),
                  ),
                  const SizedBox(height: 24),
                  Text('Semester-wise GPA', style: GoogleFonts.fredoka(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.grey)),
                  const SizedBox(height: 8),
                  ...(data.semesterGPAs ?? []).map<Widget>((s) {
                    final gpaVal = double.tryParse(s['gpa'].toString()) ?? 0.0;
                    return Container(
                      margin: const EdgeInsets.only(bottom: 8),
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: Theme.of(context).brightness == Brightness.dark ? const Color(0xFF0F172A) : Colors.grey.shade50,
                        border: Border.all(color: Theme.of(context).brightness == Brightness.dark ? const Color(0xFF334155) : AppColors.brutalBlack),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(s['sem'].toString(), style: GoogleFonts.fredoka(fontWeight: FontWeight.bold)),
                          Text(s['gpa'].toString(), style: GoogleFonts.fredoka(fontWeight: FontWeight.bold, color: AppColors.comicBlue, fontSize: 18)),
                        ],
                      ),
                    );
                  }).toList(),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _showAttendanceModal(BuildContext context, data) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => Container(
        height: MediaQuery.of(context).size.height * 0.85,
        decoration: BoxDecoration(
          color: Theme.of(context).brightness == Brightness.dark ? const Color(0xFF1E293B) : Colors.white,
          borderRadius: const BorderRadius.vertical(top: Radius.circular(32)),
          border: Border.all(color: Theme.of(context).brightness == Brightness.dark ? const Color(0xFF334155) : AppColors.brutalBlack, width: 3),
        ),
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text('📅 Attendance', style: GoogleFonts.fredoka(fontSize: 24, fontWeight: FontWeight.bold)),
                IconButton(icon: const Icon(Icons.close), onPressed: () => Navigator.pop(context)),
              ],
            ),
            const SizedBox(height: 16),
            Expanded(
              child: ListView(
                children: [
                  BrutalistCard(
                    backgroundColor: Theme.of(context).brightness == Brightness.dark ? const Color(0xFF0F172A) : AppColors.statGreen,
                    child: Column(
                      children: [
                        Text('${data.avgAttendance.round()}%', style: GoogleFonts.fredoka(fontSize: 48, fontWeight: FontWeight.bold, color: AppColors.comicGreen)),
                        Text('OVERALL ATTENDANCE', style: GoogleFonts.fredoka(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.grey.shade800)),
                      ],
                    ),
                  ),
                  const SizedBox(height: 24),
                  if (data.avgAttendance >= 75)
                    Text('✅ You meet the 75% minimum requirement!', style: GoogleFonts.fredoka(color: Colors.green.shade700, fontWeight: FontWeight.bold))
                  else
                    Text('⚠️ Below 75% requirement. Attend more classes!', style: GoogleFonts.fredoka(color: Colors.red.shade700, fontWeight: FontWeight.bold)),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildRiskBanner(data, bool isDark) {
    final riskColor = AppColors.riskColor(data.riskLevel);
    final emoji = AppColors.riskEmoji(data.riskLevel);

    return Container(
      width: double.infinity,
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF1E293B) : riskColor,
        borderRadius: BorderRadius.circular(0), // torn edge equivalent
        border: Border.all(color: isDark ? riskColor : AppColors.brutalBlack, width: 3),
        boxShadow: [
          BoxShadow(
            color: isDark ? Colors.black.withValues(alpha: 0.3) : AppColors.brutalBlack,
            offset: const Offset(0, 8),
            blurRadius: 16,
          ),
        ],
      ),
      child: Stack(
        children: [
          Positioned(
            bottom: 10,
            right: 40,
            child: Opacity(
              opacity: 0.1,
              child: Text('⚡', style: TextStyle(fontSize: 120)),
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(32),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      width: 80,
                      height: 80,
                      decoration: BoxDecoration(
                        color: isDark ? const Color(0xFF0F172A) : Colors.white,
                        shape: BoxShape.circle,
                        border: Border.all(color: AppColors.brutalBlack, width: 3),
                        boxShadow: [
                          BoxShadow(color: AppColors.brutalBlack, offset: const Offset(4, 4)),
                        ],
                      ),
                      child: Icon(Icons.warning_amber_rounded, size: 40, color: riskColor),
                    ),
                    const SizedBox(width: 24),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'AI RISK ASSESSMENT',
                            style: GoogleFonts.fredoka(
                              fontSize: 28,
                              fontWeight: FontWeight.bold,
                              color: Colors.white,
                            ),
                          ),
                          const SizedBox(height: 12),
                          Wrap(
                            spacing: 12.0,
                            runSpacing: 8.0,
                            children: [
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
                                decoration: BoxDecoration(
                                  color: Colors.black.withValues(alpha: 0.3),
                                  borderRadius: BorderRadius.circular(24),
                                  border: Border.all(color: Colors.white.withValues(alpha: 0.2), width: 2),
                                ),
                                child: Text(
                                  'Dropout: ${data.dropoutProbability}%',
                                  style: GoogleFonts.fredoka(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white),
                                ),
                              ),
                              Text(
                                '$emoji ${data.riskLevel.toUpperCase()} RISK',
                                style: GoogleFonts.fredoka(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 24),
                Align(
                  alignment: Alignment.centerRight,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      Transform.rotate(
                        angle: 0.0523599, // 3 degrees
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 16),
                          decoration: BoxDecoration(
                            color: isDark ? const Color(0xFF0F172A) : Colors.white,
                            borderRadius: BorderRadius.circular(24),
                            border: Border.all(color: isDark ? const Color(0xFF334155) : AppColors.brutalBlack, width: 3),
                            boxShadow: [
                              BoxShadow(color: isDark ? Colors.black.withValues(alpha: 0.5) : AppColors.brutalBlack, offset: const Offset(4, 4)),
                            ],
                          ),
                          child: Text(
                            'KEEP IT UP!',
                            style: GoogleFonts.fredoka(
                              fontSize: 24,
                              fontWeight: FontWeight.bold,
                              color: riskColor,
                            ),
                          ),
                        ),
                      ),
                      if (data.riskReason.isNotEmpty) ...[
                        const SizedBox(height: 16),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                          decoration: BoxDecoration(
                            color: Colors.black.withValues(alpha: 0.1),
                            borderRadius: BorderRadius.circular(24),
                            border: Border.all(color: Colors.white.withValues(alpha: 0.1)),
                          ),
                          child: Text(
                            '"${data.riskReason}" — Sensei AI',
                            style: GoogleFonts.inter(
                              fontSize: 14,
                              fontWeight: FontWeight.bold,
                              fontStyle: FontStyle.italic,
                              color: Colors.white,
                            ),
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildActionCards(data, bool isDark) {
    return Column(
      children: [
        if (data.activePolls > 0)
          Padding(
            padding: const EdgeInsets.only(bottom: 16),
            child: ComicCard(
              backgroundColor: isDark ? const Color(0xFF1E293B) : AppColors.comicYellow.withValues(alpha: 0.2),
              onTap: () => context.go('/student/polls'),
              padding: const EdgeInsets.all(24),
              child: Row(
                children: [
                  Container(
                    width: 64,
                    height: 64,
                    decoration: BoxDecoration(
                      color: AppColors.comicYellow.withValues(alpha: 0.3),
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: isDark ? AppColors.comicYellow : AppColors.brutalBlack, width: 2),
                    ),
                    child: const Icon(Icons.bar_chart, size: 32, color: AppColors.comicYellow),
                  ),
                  const SizedBox(width: 24),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Transform.rotate(
                          angle: -0.0349066, // -2 degrees
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                            decoration: BoxDecoration(
                              color: isDark ? const Color(0xFF334155) : AppColors.comicYellow,
                              border: Border.all(color: isDark ? const Color(0xFF475569) : AppColors.brutalBlack, width: 2),
                            ),
                            child: Text(
                              'LIVE!',
                              style: GoogleFonts.fredoka(fontSize: 10, fontWeight: FontWeight.w900, color: isDark ? Colors.white : Colors.black),
                            ),
                          ),
                        ),
                        const SizedBox(height: 8),
                        Text('Active Class Poll', style: GoogleFonts.fredoka(fontSize: 24, fontWeight: FontWeight.bold, color: isDark ? Colors.white : Colors.black)),
                        Text(
                          'Tap to participate & see results',
                          style: GoogleFonts.fredoka(fontSize: 12, fontWeight: FontWeight.bold, letterSpacing: 2, color: isDark ? Colors.grey.shade400 : Colors.grey.shade700),
                        ),
                      ],
                    ),
                  ),
                  Icon(Icons.arrow_forward, size: 28, color: isDark ? Colors.white : Colors.black),
                ],
              ),
            ),
          ),
        if (data.pendingHelpTickets > 0)
          ComicCard(
            backgroundColor: isDark ? const Color(0xFF1E293B) : AppColors.comicRed.withValues(alpha: 0.1),
            onTap: () => context.go('/student/help-desk'),
            padding: const EdgeInsets.all(24),
            child: Row(
              children: [
                Container(
                  width: 64,
                  height: 64,
                  decoration: BoxDecoration(
                    color: AppColors.comicRed.withValues(alpha: 0.2),
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: isDark ? AppColors.comicRed : AppColors.brutalBlack, width: 2),
                  ),
                  child: const Icon(Icons.help_outline, size: 32, color: AppColors.comicRed),
                ),
                const SizedBox(width: 24),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Transform.rotate(
                        angle: 0.0349066, // 2 degrees
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                          decoration: BoxDecoration(
                            color: isDark ? const Color(0xFF334155) : AppColors.comicRed,
                            border: Border.all(color: isDark ? const Color(0xFF475569) : AppColors.brutalBlack, width: 2),
                          ),
                          child: Text(
                            'UPDATE!',
                            style: GoogleFonts.fredoka(fontSize: 10, fontWeight: FontWeight.w900, color: Colors.white),
                          ),
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text('Help Ticket Status', style: GoogleFonts.fredoka(fontSize: 24, fontWeight: FontWeight.bold, color: isDark ? Colors.white : Colors.black)),
                      Text(
                        'You have ${data.pendingHelpTickets} open ticket${data.pendingHelpTickets > 1 ? "s" : ""}',
                        style: GoogleFonts.fredoka(fontSize: 12, fontWeight: FontWeight.bold, letterSpacing: 2, color: isDark ? Colors.grey.shade400 : Colors.grey.shade700),
                      ),
                    ],
                  ),
                ),
                Icon(Icons.arrow_forward, size: 28, color: isDark ? Colors.white : Colors.black),
              ],
            ),
          ),
      ],
    );
  }

  Widget _buildChartsSection(data, bool isDark) {
    return Column(
      children: [
        _buildMarksTrendChart(data, isDark),
        const SizedBox(height: 16),
        _buildSubjectRadarChart(data, isDark),
      ],
    );
  }

  Widget _buildMarksTrendChart(data, bool isDark) {
    final marksTrend = data.marksTrend;
    if (marksTrend == null || marksTrend.labels.isEmpty) {
      return BrutalistCard(
        backgroundColor: isDark ? const Color(0xFF1E293B) : Colors.white,
        shadowOffset: 8,
        borderRadius: BorderRadius.circular(24),
        padding: const EdgeInsets.all(24),
        child: Column(
          children: [
            _buildSectionLabel('📈 MARKS TREND', AppColors.comicBlue, isDark),
            const SizedBox(height: 24),
            Text('No marks data yet ✏️', style: GoogleFonts.fredoka(fontSize: 16, color: Colors.grey)),
          ],
        ),
      );
    }

    return BrutalistCard(
      backgroundColor: isDark ? const Color(0xFF1E293B) : Colors.white,
      shadowOffset: 8,
      borderRadius: BorderRadius.circular(24),
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildSectionLabel('📈 MARKS TREND', AppColors.comicBlue, isDark),
          const SizedBox(height: 16),
          SizedBox(
            height: 220,
            child: LineChart(
              LineChartData(
                gridData: FlGridData(show: true, drawVerticalLine: false,
                  getDrawingHorizontalLine: (value) => FlLine(color: Colors.grey.withValues(alpha: 0.15), strokeWidth: 1)),
                titlesData: FlTitlesData(
                  bottomTitles: AxisTitles(
                    sideTitles: SideTitles(
                      showTitles: true,
                      reservedSize: 30,
                      getTitlesWidget: (value, meta) {
                        final idx = value.toInt();
                        if (idx >= 0 && idx < marksTrend.labels.length) {
                          return Padding(
                            padding: const EdgeInsets.only(top: 8),
                            child: Text(
                              marksTrend.labels[idx].length > 6 ? marksTrend.labels[idx].substring(0, 6) : marksTrend.labels[idx],
                              style: GoogleFonts.fredoka(fontSize: 9, color: Colors.grey),
                            ),
                          );
                        }
                        return const Text('');
                      },
                    ),
                  ),
                  leftTitles: AxisTitles(
                    sideTitles: SideTitles(
                      showTitles: true,
                      reservedSize: 32,
                      getTitlesWidget: (value, meta) => Text(
                        '${value.toInt()}',
                        style: GoogleFonts.fredoka(fontSize: 10, color: Colors.grey),
                      ),
                    ),
                  ),
                  topTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                  rightTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                ),
                borderData: FlBorderData(show: false),
                lineBarsData: marksTrend.datasets.asMap().entries.map((entry) {
                  final color = AppColors.chartPalette[entry.key % AppColors.chartPalette.length];
                  return LineChartBarData(
                    spots: entry.value.data.asMap().entries.map<FlSpot>((e) => FlSpot(e.key.toDouble(), e.value.toDouble())).toList(),
                    isCurved: true,
                    color: color,
                    barWidth: 3,
                    dotData: FlDotData(show: true, getDotPainter: (spot, percent, barData, index) => FlDotCirclePainter(radius: 3, color: color, strokeWidth: 0)),
                    belowBarData: BarAreaData(show: true, color: color.withValues(alpha: 0.1)),
                  );
                }).toList().cast<LineChartBarData>(),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSubjectRadarChart(data, bool isDark) {
    if (data.subjectMarks.isEmpty) {
      return BrutalistCard(
        backgroundColor: isDark ? const Color(0xFF1E293B) : Colors.white,
        shadowOffset: 8,
        borderRadius: BorderRadius.circular(24),
        padding: const EdgeInsets.all(24),
        child: Column(
          children: [
            _buildSectionLabel('🎯 SUBJECT RADAR', AppColors.comicYellow, isDark),
            const SizedBox(height: 24),
            Text('No subject data yet 📚', style: GoogleFonts.fredoka(fontSize: 16, color: Colors.grey)),
          ],
        ),
      );
    }

    return BrutalistCard(
      backgroundColor: isDark ? const Color(0xFF1E293B) : Colors.white,
      shadowOffset: 8,
      borderRadius: BorderRadius.circular(24),
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildSectionLabel('🎯 SUBJECT RADAR', AppColors.comicYellow, isDark),
          const SizedBox(height: 16),
          SizedBox(
            height: 240,
            child: RadarChart(
              RadarChartData(
                dataSets: [
                  RadarDataSet(
                    dataEntries: data.subjectMarks.map<RadarEntry>((m) => RadarEntry(value: m.percentage)).toList(),
                    fillColor: AppColors.comicBlue.withValues(alpha: 0.2),
                    borderColor: AppColors.comicBlue,
                    borderWidth: 2,
                  ),
                ],
                radarShape: RadarShape.polygon,
                radarBorderData: BorderSide(color: Colors.grey.withValues(alpha: 0.2)),
                tickBorderData: BorderSide(color: Colors.grey.withValues(alpha: 0.1)),
                gridBorderData: BorderSide(color: Colors.grey.withValues(alpha: 0.1)),
                tickCount: 4,
                ticksTextStyle: GoogleFonts.fredoka(fontSize: 8, color: Colors.grey),
                titleTextStyle: GoogleFonts.fredoka(fontSize: 10, fontWeight: FontWeight.bold, color: isDark ? Colors.white70 : AppColors.brutalBlack),
                getTitle: (index, angle) {
                  final subject = data.subjectMarks[index].subject;
                  return RadarChartTitle(text: subject.length > 8 ? '${subject.substring(0, 8)}…' : subject);
                },
                titlePositionPercentageOffset: 0.18,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStreakAndAttendance(data, bool isDark) {
    return Row(
      children: [
        Expanded(
          child: BrutalistCard(
            backgroundColor: isDark ? const Color(0xFF1E293B) : AppColors.comicYellow,
            padding: const EdgeInsets.all(20),
            borderRadius: BorderRadius.circular(24),
            child: Column(
              children: [
                const Icon(Icons.local_fire_department, size: 40, color: AppColors.comicRed),
                const SizedBox(height: 8),
                Text(
                  '${data.streakDays}',
                  style: GoogleFonts.fredoka(fontSize: 48, fontWeight: FontWeight.bold, height: 1, color: isDark ? Colors.white : Colors.black),
                ),
                Text(
                  'DAY STREAK',
                  style: GoogleFonts.fredoka(fontSize: 9, fontWeight: FontWeight.bold, letterSpacing: 2, color: isDark ? Colors.grey : Colors.brown.shade700),
                ),
                const SizedBox(height: 12),
                SizedBox(
                  height: 60,
                  width: 60,
                  child: PieChart(
                    PieChartData(
                      sections: [
                        PieChartSectionData(
                          value: data.avgAttendance.toDouble(),
                          color: AppColors.comicGreen,
                          radius: 16,
                          showTitle: false,
                        ),
                        PieChartSectionData(
                          value: (100 - data.avgAttendance).toDouble(),
                          color: AppColors.comicRed,
                          radius: 16,
                          showTitle: false,
                        ),
                      ],
                      centerSpaceRadius: 12,
                      sectionsSpace: 2,
                    ),
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  'ATTENDANCE',
                  style: GoogleFonts.fredoka(fontSize: 8, fontWeight: FontWeight.bold, letterSpacing: 2, color: Colors.brown.shade700),
                ),
              ],
            ),
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          flex: 2,
          child: _buildSubjectBreakdown(data, isDark),
        ),
      ],
    );
  }

  Widget _buildSubjectBreakdown(data, bool isDark) {
    return BrutalistCard(
      backgroundColor: isDark ? const Color(0xFF1E293B) : Colors.white,
      shadowOffset: 8,
      borderRadius: BorderRadius.circular(24),
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Text('📊 ', style: GoogleFonts.fredoka(fontSize: 18)),
              Expanded(
                child: Text(
                  'SUBJECT BREAKDOWN',
                  style: GoogleFonts.fredoka(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    color: isDark ? Colors.white : AppColors.brutalBlack,
                  ),
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          ...data.subjectMarks.take(5).map((m) {
            final pct = m.percentage.clamp(0.0, 100.0);
            final color = pct >= 80
                ? AppColors.comicBlue
                : pct >= 60
                    ? AppColors.comicYellow
                    : AppColors.comicRed;

            return Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: Column(
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        m.subject.toUpperCase(),
                        style: GoogleFonts.fredoka(
                          fontSize: 12,
                          fontWeight: FontWeight.bold,
                          color: isDark ? Colors.white70 : AppColors.brutalBlack,
                        ),
                      ),
                      Text(
                        '${m.percentage.round()}%',
                        style: GoogleFonts.fredoka(fontSize: 14, fontWeight: FontWeight.bold, color: color),
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),
                  BrutalistProgressBar(percentage: pct, fillColor: color),
                ],
              ),
            );
          }),
          if (data.subjectMarks.isEmpty)
            Text('No marks recorded yet ✏️', style: GoogleFonts.fredoka(fontSize: 14, color: Colors.grey)),
        ],
      ),
    );
  }

  Widget _buildDetailedMarksTable(data, bool isDark) {
    return BrutalistCard(
      backgroundColor: isDark ? const Color(0xFF1E293B) : Colors.white,
      shadowOffset: 8,
      borderRadius: BorderRadius.circular(24),
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            '📋 DETAILED MARKS',
            style: GoogleFonts.fredoka(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: isDark ? Colors.white : AppColors.brutalBlack,
            ),
          ),
          const SizedBox(height: 16),
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: DataTable(
              headingTextStyle: GoogleFonts.fredoka(
                fontSize: 10,
                fontWeight: FontWeight.bold,
                letterSpacing: 1,
                color: Colors.grey,
              ),
              dataTextStyle: GoogleFonts.fredoka(
                fontSize: 13,
                color: isDark ? Colors.white : AppColors.brutalBlack,
              ),
              columns: const [
                DataColumn(label: Text('SUBJECT')),
                DataColumn(label: Text('UT1'), numeric: true),
                DataColumn(label: Text('MID'), numeric: true),
                DataColumn(label: Text('UT2'), numeric: true),
                DataColumn(label: Text('END'), numeric: true),
                DataColumn(label: Text('TOTAL'), numeric: true),
                DataColumn(label: Text('%'), numeric: true),
              ],
              rows: data.subjectMarks.map<DataRow>((m) {
                final color = m.percentage >= 80
                    ? AppColors.comicBlue
                    : m.percentage >= 60
                        ? AppColors.comicYellow
                        : AppColors.comicRed;
                return DataRow(cells: [
                  DataCell(Text(m.subject, style: GoogleFonts.fredoka(fontWeight: FontWeight.bold))),
                  DataCell(Text('${m.ut1}')),
                  DataCell(Text('${m.midSem}')),
                  DataCell(Text('${m.ut2}')),
                  DataCell(Text('${m.endSem}')),
                  DataCell(Text('${m.total}', style: GoogleFonts.fredoka(fontWeight: FontWeight.bold))),
                  DataCell(
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(
                        color: color.withValues(alpha: 0.15),
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: color, width: 1.5),
                      ),
                      child: Text(
                        '${m.percentage.round()}%',
                        style: GoogleFonts.fredoka(fontSize: 11, fontWeight: FontWeight.bold, color: color),
                      ),
                    ),
                  ),
                ]);
              }).toList(),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildRecommendations(data, bool isDark) {
    return BrutalistCard(
      backgroundColor: isDark ? const Color(0xFF1E293B) : Colors.white,
      shadowOffset: 6,
      borderRadius: BorderRadius.circular(24),
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'AI RECOMMENDATIONS',
            style: GoogleFonts.fredoka(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: isDark ? Colors.white : AppColors.brutalBlack,
            ),
          ),
          const SizedBox(height: 16),
          ...data.recommendations.asMap().entries.map((entry) {
            final i = entry.key;
            final r = entry.value;
            final isExpanded = _expandedRec == i;

            return GestureDetector(
              onTap: () => setState(() => _expandedRec = isExpanded ? null : i),
              child: Container(
                margin: const EdgeInsets.only(bottom: 8),
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: isDark ? const Color(0xFF0F172A) : AppColors.comicBlue.withValues(alpha: 0.06),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: isDark ? const Color(0xFF334155) : AppColors.brutalBlack, width: 2),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Text('${i + 1}.', style: GoogleFonts.fredoka(fontSize: 14, fontWeight: FontWeight.bold, color: Colors.grey)),
                        const SizedBox(width: 8),
                        Expanded(child: Text(r, style: GoogleFonts.fredoka(fontSize: 13, fontWeight: FontWeight.w500, color: isDark ? Colors.white : Colors.black))),
                        Icon(isExpanded ? Icons.keyboard_arrow_up : Icons.keyboard_arrow_down, size: 20, color: isDark ? Colors.white : Colors.black),
                      ],
                    ),
                    if (isExpanded) ...[
                      const SizedBox(height: 12),
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: isDark ? const Color(0xFF0F172A) : Colors.white,
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(color: AppColors.comicBlue.withValues(alpha: 0.2)),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            _recDetail('🎯', 'Why focus here?', 'Based on your recent performance metrics, this area shows improvement potential.'),
                            const SizedBox(height: 8),
                            _recDetail('🛠️', 'What to do:', 'Use Sensei AI tools like Quiz Generator, Doubt Solver, and Study Plans.'),
                            const SizedBox(height: 8),
                            _recDetail('📈', 'Expected:', '20-30 mins daily can boost mastery significantly!'),
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
    );
  }

  Widget _recDetail(String icon, String title, String desc) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(icon, style: const TextStyle(fontSize: 14)),
        const SizedBox(width: 6),
        Expanded(
          child: RichText(
            text: TextSpan(
              children: [
                TextSpan(text: '$title ', style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.comicBlue)),
                TextSpan(text: desc, style: GoogleFonts.inter(fontSize: 12, color: Colors.grey.shade700)),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildSectionLabel(String text, Color color, bool isDark) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
      decoration: BoxDecoration(
        color: color,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: isDark ? Colors.white : AppColors.brutalBlack, width: 2),
      ),
      child: Text(
        text,
        style: GoogleFonts.fredoka(
          fontSize: 14,
          fontWeight: FontWeight.bold,
          color: color == AppColors.comicYellow ? AppColors.brutalBlack : Colors.white,
        ),
      ),
    );
  }

  Widget _buildLoadingSkeleton(bool isDark) {
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          Row(
            children: [
              const Expanded(child: LoadingSkeleton(height: 80)),
              const SizedBox(width: 12),
              const LoadingSkeleton(width: 80, height: 60),
            ],
          ),
          const SizedBox(height: 20),
          GridView.count(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            crossAxisCount: 2,
            childAspectRatio: 1.4,
            crossAxisSpacing: 12,
            mainAxisSpacing: 12,
            children: List.generate(6, (_) => const LoadingSkeleton(height: 100)),
          ),
          const SizedBox(height: 20),
          const LoadingSkeleton(height: 120),
        ],
      ),
    );
  }

  Widget _buildError(String error, bool isDark) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: BrutalistCard(
          backgroundColor: AppColors.comicRed,
          padding: const EdgeInsets.all(32),
          borderRadius: BorderRadius.circular(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.warning_amber_rounded, size: 48, color: Colors.white),
              const SizedBox(height: 16),
              Text(
                '⚠️ $error',
                style: GoogleFonts.fredoka(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.white),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 16),
              ComicButton(
                label: 'Retry',
                backgroundColor: Colors.white,
                textColor: AppColors.comicRed,
                onPressed: () => ref.read(studentDashboardProvider.notifier).fetchDashboard(),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
