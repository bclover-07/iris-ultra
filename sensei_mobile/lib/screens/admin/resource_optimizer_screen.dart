import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../theme/admin_theme.dart';
import '../../theme/admin_glass_widgets.dart';
import '../../services/api_service.dart';

class ResourceOptimizerScreen extends ConsumerStatefulWidget {
  const ResourceOptimizerScreen({super.key});

  @override
  ConsumerState<ResourceOptimizerScreen> createState() => _ResourceOptimizerScreenState();
}

class _ResourceOptimizerScreenState extends ConsumerState<ResourceOptimizerScreen> {
  Map<String, dynamic>? _data;
  bool _isLoading = false;

  Future<void> _runOptimization() async {
    final t = AdminTheme.of(context);
    setState(() => _isLoading = true);
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('Analyzing historical patterns...', style: GoogleFonts.inter()),
        backgroundColor: t.admAccent,
      ),
    );

    try {
      final api = ApiService();
      final responseData = await api.authenticatedPost('/api/resource/optimize');
      if (mounted) {
        setState(() {
          _data = responseData?['plan'] ?? {};
          _isLoading = false;
        });
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Optimization complete!', style: GoogleFonts.inter()),
            backgroundColor: t.success,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _data = _mockOptimizationPlan;
          _isLoading = false;
        });
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Optimization complete (simulated data).', style: GoogleFonts.inter()),
            backgroundColor: t.success,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final t = AdminTheme.of(context);
    final alerts = _data?['workloadAnalysis']?['alerts'] ?? [];
    final recs = _data?['budgetForecast']?['recommendations'] ?? [];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        // Header
        Padding(
          padding: const EdgeInsets.only(left: 20, right: 20, top: 20, bottom: 12),
          child: Row(
            children: [
              const AdminBackButton(),
              const Spacer(),
              if (_data != null)
                IconButton(
                  icon: Icon(Icons.refresh_rounded, color: t.admAccent),
                  onPressed: _isLoading ? null : _runOptimization,
                  style: IconButton.styleFrom(backgroundColor: t.admAccentLight),
                ),
            ],
          ),
        ),

        // Title
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20),
          child: AdminSectionTitle(
            title: 'Resource Optimizer',
            subtitle: 'AI predictive allocator and workload monitor',
            icon: Icons.bolt_rounded,
            iconColor: Colors.amber,
          ),
        ),
        const SizedBox(height: 16),

        // Primary Call to Action if no data is loaded yet
        if (_data == null)
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20.0),
            child: AdminButton(
              onTap: _runOptimization,
              isLoading: _isLoading,
              gradient: [Colors.amber, t.danger],
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.auto_awesome_rounded, color: Colors.white, size: 18),
                  const SizedBox(width: 8),
                  Text('RUN RESOURCE OPTIMIZATION', style: GoogleFonts.spaceGrotesk(fontSize: 14)),
                ],
              ),
            ),
          ),

        const SizedBox(height: 12),

        // Main Scrollable Area
        Expanded(
          child: _data == null
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.bolt_rounded, size: 64, color: t.admTextMuted.withValues(alpha: 0.3)),
                      const SizedBox(height: 12),
                      Text(
                        'Run AI optimization to view insights',
                        style: GoogleFonts.inter(color: t.admTextMuted),
                      ),
                    ],
                  ),
                )
              : SingleChildScrollView(
                  padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      // Alerts Section
                      AdminGlassContainer(
                        padding: const EdgeInsets.all(16),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Icon(Icons.people_outline_rounded, color: t.admAccent, size: 18),
                                const SizedBox(width: 8),
                                Text(
                                  'Faculty Workload Alerts',
                                  style: GoogleFonts.spaceGrotesk(
                                    fontSize: 14,
                                    fontWeight: FontWeight.bold,
                                    color: t.admText,
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 16),
                            if (alerts.isEmpty)
                              Text(
                                'No workload violations detected.',
                                style: GoogleFonts.inter(color: t.admTextMuted, fontSize: 13),
                              )
                            else
                              ...alerts.map<Widget>((alert) {
                                final isCritical = alert['severity'] == 'critical';
                                final alertColor = isCritical ? t.danger : t.warning;

                                return Container(
                                  margin: const EdgeInsets.only(bottom: 10),
                                  padding: const EdgeInsets.all(12),
                                  decoration: BoxDecoration(
                                    color: alertColor.withValues(alpha: 0.12),
                                    borderRadius: BorderRadius.circular(12),
                                    border: Border.all(color: alertColor.withValues(alpha: 0.25)),
                                  ),
                                  child: Row(
                                    children: [
                                      Icon(
                                        Icons.warning_amber_rounded,
                                        color: alertColor,
                                        size: 20,
                                      ),
                                      const SizedBox(width: 12),
                                      Expanded(
                                        child: Column(
                                          crossAxisAlignment: CrossAxisAlignment.start,
                                          children: [
                                            Text(
                                              alert['teacherName'] ?? '',
                                              style: GoogleFonts.inter(
                                                fontSize: 13,
                                                fontWeight: FontWeight.bold,
                                                color: t.admText,
                                              ),
                                            ),
                                            const SizedBox(height: 2),
                                            Text(
                                              alert['issue'] ?? '',
                                              style: GoogleFonts.inter(
                                                fontSize: 11,
                                                color: t.admTextSub,
                                              ),
                                            ),
                                          ],
                                        ),
                                      ),
                                    ],
                                  ),
                                );
                              }).toList(),
                          ],
                        ),
                      ),
                      const SizedBox(height: 16),

                      // Budget Forecast Section
                      AdminGlassContainer(
                        padding: const EdgeInsets.all(16),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Icon(Icons.analytics_outlined, color: t.success, size: 18),
                                const SizedBox(width: 8),
                                Text(
                                  'Budget Forecast',
                                  style: GoogleFonts.spaceGrotesk(
                                    fontSize: 14,
                                    fontWeight: FontWeight.bold,
                                    color: t.admText,
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 16),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text(
                                  'Projected Spend',
                                  style: GoogleFonts.inter(fontSize: 13, color: t.admTextSub),
                                ),
                                Text(
                                  '₹${_data?['budgetForecast']?['projectedSpend']}',
                                  style: GoogleFonts.spaceGrotesk(
                                    fontSize: 18,
                                    fontWeight: FontWeight.bold,
                                    color: t.admText,
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 8),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text(
                                  'Potential Savings',
                                  style: GoogleFonts.inter(fontSize: 13, color: t.admTextSub),
                                ),
                                Text(
                                  '+₹${_data?['budgetForecast']?['totalPotentialSavings']}',
                                  style: GoogleFonts.spaceGrotesk(
                                    fontSize: 18,
                                    fontWeight: FontWeight.bold,
                                    color: t.success,
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 16),

                      // Recommendations Section
                      AdminGlassContainer(
                        padding: const EdgeInsets.all(16),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Icon(Icons.star_outline_rounded, color: t.stat2Accent, size: 18),
                                const SizedBox(width: 8),
                                Text(
                                  'Prioritized Reallocations',
                                  style: GoogleFonts.spaceGrotesk(
                                    fontSize: 14,
                                    fontWeight: FontWeight.bold,
                                    color: t.admText,
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 16),
                            if (recs.isEmpty)
                              Text(
                                'No recommendations found.',
                                style: GoogleFonts.inter(color: t.admTextMuted, fontSize: 13),
                              )
                            else
                              ...recs.map<Widget>((rec) {
                                final isHigh = rec['priority'] == 'high';
                                final priorityColor = isHigh ? t.danger : t.warning;

                                return Container(
                                  margin: const EdgeInsets.only(bottom: 12),
                                  child: Row(
                                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                    children: [
                                      Expanded(
                                        child: Column(
                                          crossAxisAlignment: CrossAxisAlignment.start,
                                          children: [
                                            Text(
                                              rec['action'] ?? '',
                                              style: GoogleFonts.inter(
                                                fontSize: 13,
                                                fontWeight: FontWeight.w600,
                                                color: t.admText,
                                              ),
                                            ),
                                            const SizedBox(height: 2),
                                            Text(
                                              'Est. Savings: ₹${rec['estimatedSavings']}',
                                              style: GoogleFonts.inter(
                                                fontSize: 11,
                                                color: t.success,
                                                fontWeight: FontWeight.w500,
                                              ),
                                            ),
                                          ],
                                        ),
                                      ),
                                      Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                        decoration: BoxDecoration(
                                          color: priorityColor.withValues(alpha: 0.12),
                                          borderRadius: BorderRadius.circular(12),
                                          border: Border.all(color: priorityColor.withValues(alpha: 0.2)),
                                        ),
                                        child: Text(
                                          (rec['priority'] ?? '').toUpperCase(),
                                          style: GoogleFonts.inter(
                                            fontSize: 9,
                                            fontWeight: FontWeight.bold,
                                            color: priorityColor,
                                          ),
                                        ),
                                      ),
                                    ],
                                  ),
                                );
                              }).toList(),
                            const SizedBox(height: 16),
                            AdminButton(
                              onTap: () {
                                ScaffoldMessenger.of(context).showSnackBar(
                                  SnackBar(
                                    content: Text('Applying reallocation suggestions...', style: GoogleFonts.inter()),
                                    backgroundColor: t.success,
                                  ),
                                );
                              },
                              child: Row(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Text(
                                    'APPLY REALLOCATION',
                                    style: GoogleFonts.spaceGrotesk(fontSize: 13, fontWeight: FontWeight.bold),
                                  ),
                                  const SizedBox(width: 8),
                                  const Icon(Icons.arrow_forward_rounded, color: Colors.white, size: 16),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 40),
                    ],
                  ),
                ),
        ),
      ],
    );
  }
}

final Map<String, dynamic> _mockOptimizationPlan = {
  'demandForecast': {
    'predictions': [
      {'day': 'Mon', 'utilization': 40},
      {'day': 'Tue', 'utilization': 65},
      {'day': 'Wed', 'utilization': 85},
      {'day': 'Thu', 'utilization': 55},
      {'day': 'Fri', 'utilization': 30},
    ]
  },
  'workloadAnalysis': {
    'alerts': [
      {'teacherName': 'Dr. Mehta', 'issue': '6 consecutive morning sessions', 'severity': 'warning'},
      {'teacherName': 'Prof. Smith', 'issue': 'Lab overload (12h+ daily)', 'severity': 'critical'},
    ]
  },
  'budgetForecast': {
    'projectedSpend': 520000,
    'totalPotentialSavings': 50000,
    'recommendations': [
      {'action': 'Reschedule CS-101 Lab', 'estimatedSavings': 15000, 'priority': 'high'},
      {'action': 'Optimize Lighting in Block A', 'estimatedSavings': 5000, 'priority': 'medium'},
    ]
  }
};
