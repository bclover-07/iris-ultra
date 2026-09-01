import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../theme/app_colors.dart';
import '../../theme/neubrutalist_widgets.dart';
import '../../theme/animations.dart';

class NpuConsoleScreen extends StatefulWidget {
  const NpuConsoleScreen({super.key});

  @override
  State<NpuConsoleScreen> createState() => _NpuConsoleScreenState();
}

class _NpuConsoleScreenState extends State<NpuConsoleScreen> {
  final List<_NpuLogEntry> _logs = [
    _NpuLogEntry(feature: 'Mentor', engine: 'Gemma 3n E2B', backend: 'NPU', tokPerSec: 72.4, latencyMs: 180, time: DateTime.now().subtract(const Duration(minutes: 2))),
    _NpuLogEntry(feature: 'Camo Quizo', engine: 'HandLandmarker', backend: 'GPU', tokPerSec: null, latencyMs: 12, time: DateTime.now().subtract(const Duration(minutes: 5))),
    _NpuLogEntry(feature: 'Focus Guardian', engine: 'PoseDetection', backend: 'NPU', tokPerSec: null, latencyMs: 8, time: DateTime.now().subtract(const Duration(minutes: 8))),
    _NpuLogEntry(feature: 'Doubt Solver', engine: 'ML Kit OCR', backend: 'CPU', tokPerSec: null, latencyMs: 45, time: DateTime.now().subtract(const Duration(minutes: 12))),
    _NpuLogEntry(feature: 'Mentor', engine: 'Gemma 3n E2B', backend: 'NPU', tokPerSec: 68.1, latencyMs: 210, time: DateTime.now().subtract(const Duration(minutes: 15))),
    _NpuLogEntry(feature: 'Notebook Scanner', engine: 'DocLayout-YOLO', backend: 'GPU', tokPerSec: null, latencyMs: 95, time: DateTime.now().subtract(const Duration(minutes: 20))),
  ];

  @override
  Widget build(BuildContext context) {
    final npuCount = _logs.where((l) => l.backend == 'NPU').length;
    final gpuCount = _logs.where((l) => l.backend == 'GPU').length;
    final cpuCount = _logs.where((l) => l.backend == 'CPU').length;
    final fallbackRate = _logs.isEmpty ? 0.0 : (cpuCount / _logs.length) * 100;

    return Scaffold(
      backgroundColor: AppColors.creamBg,
      body: SafeArea(
        child: Column(
          children: [
            _buildHeader(),
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    StaggeredFadeSlide(
                      index: 0,
                      child: _buildActiveModelCard(),
                    ),
                    const SizedBox(height: 16),
                    StaggeredFadeSlide(
                      index: 1,
                      child: _buildInferenceStats(npuCount, gpuCount, cpuCount),
                    ),
                    const SizedBox(height: 16),
                    StaggeredFadeSlide(
                      index: 2,
                      child: _buildFallbackRate(fallbackRate),
                    ),
                    const SizedBox(height: 16),
                    StaggeredFadeSlide(
                      index: 3,
                      child: _buildRecentLogs(),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildHeader() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: const BoxDecoration(
        color: AppColors.creamBg,
        border: Border(bottom: BorderSide(color: AppColors.brutalBlack, width: 2.5)),
      ),
      child: Row(
        children: [
          GestureDetector(
            onTap: () => Navigator.of(context).pop(),
            child: Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: AppColors.creamCard,
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: AppColors.brutalBlack, width: 2.5),
                boxShadow: const [
                  BoxShadow(color: AppColors.brutalBlack, offset: Offset(2, 2), blurRadius: 0),
                ],
              ),
              child: const Icon(Icons.arrow_back_rounded, color: AppColors.brutalBlack, size: 20),
            ),
          ),
          const SizedBox(width: 12),
          Text(
            'NPU CONSOLE',
            style: GoogleFonts.fredoka(fontSize: 20, fontWeight: FontWeight.bold, color: AppColors.brutalBlack),
          ),
          const Spacer(),
          PulsingBadge(
            child: NeuBadge(
              label: 'LIVE',
              backgroundColor: AppColors.npuTeal,
              isLive: false,
              icon: Icons.memory,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildActiveModelCard() {
    return NeuCard(
      backgroundColor: const Color(0xFF1A1A2E),
      borderColor: AppColors.npuTeal,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: AppColors.npuTeal.withOpacity(0.2),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppColors.npuTeal, width: 2),
                ),
                child: const Icon(Icons.memory, color: AppColors.npuTeal, size: 22),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'ACTIVE ENGINE',
                      style: GoogleFonts.fredoka(fontSize: 10, fontWeight: FontWeight.bold, letterSpacing: 1.5, color: AppColors.npuTeal),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'Gemma 3n E2B',
                      style: GoogleFonts.fredoka(fontSize: 20, fontWeight: FontWeight.bold, color: Colors.white),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              _buildMiniStat('RUNTIME', 'LiteRT-LM', AppColors.npuTeal),
              const SizedBox(width: 12),
              _buildMiniStat('BACKEND', 'Hexagon NPU', AppColors.popGreen),
              const SizedBox(width: 12),
              _buildMiniStat('TOK/S', '72.4', AppColors.popYellow),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildMiniStat(String label, String value, Color color) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 10),
        decoration: BoxDecoration(
          color: color.withOpacity(0.15),
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: color.withOpacity(0.5), width: 1.5),
        ),
        child: Column(
          children: [
            Text(label, style: GoogleFonts.fredoka(fontSize: 9, fontWeight: FontWeight.bold, letterSpacing: 1, color: color)),
            const SizedBox(height: 4),
            Text(value, style: GoogleFonts.fredoka(fontSize: 13, fontWeight: FontWeight.bold, color: Colors.white)),
          ],
        ),
      ),
    );
  }

  Widget _buildInferenceStats(int npu, int gpu, int cpu) {
    final total = npu + gpu + cpu;
    return NeuCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('INFERENCE COUNT', style: GoogleFonts.fredoka(fontSize: 12, fontWeight: FontWeight.bold, letterSpacing: 1.2, color: Colors.black54)),
          const SizedBox(height: 12),
          _buildBarRow('NPU', npu, total, AppColors.npuTeal),
          const SizedBox(height: 8),
          _buildBarRow('GPU', gpu, total, AppColors.gpuPurple),
          const SizedBox(height: 8),
          _buildBarRow('CPU', cpu, total, AppColors.cpuOrange),
          const SizedBox(height: 12),
          Text(
            'Total: $total inferences this session',
            style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w600, color: Colors.black45),
          ),
        ],
      ),
    );
  }

  Widget _buildBarRow(String label, int count, int total, Color color) {
    final pct = total > 0 ? (count / total) : 0.0;
    return Row(
      children: [
        SizedBox(
          width: 36,
          child: Text(label, style: GoogleFonts.fredoka(fontSize: 11, fontWeight: FontWeight.bold, color: AppColors.brutalBlack)),
        ),
        const SizedBox(width: 8),
        Expanded(
          child: Container(
            height: 18,
            decoration: BoxDecoration(
              color: Colors.grey.shade200,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: AppColors.brutalBlack, width: 1.5),
            ),
            child: FractionallySizedBox(
              widthFactor: pct.clamp(0.05, 1.0),
              alignment: Alignment.centerLeft,
              child: Container(
                decoration: BoxDecoration(
                  color: color,
                  borderRadius: BorderRadius.circular(10),
                ),
              ),
            ),
          ),
        ),
        const SizedBox(width: 8),
        SizedBox(
          width: 24,
          child: Text('$count', style: GoogleFonts.fredoka(fontSize: 13, fontWeight: FontWeight.bold, color: AppColors.brutalBlack)),
        ),
      ],
    );
  }

  Widget _buildFallbackRate(double rate) {
    return NeuCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text('FALLBACK RATE', style: GoogleFonts.fredoka(fontSize: 12, fontWeight: FontWeight.bold, letterSpacing: 1.2, color: Colors.black54)),
              NeuBadge(
                label: rate < 20 ? 'HEALTHY' : 'HIGH',
                backgroundColor: rate < 20 ? AppColors.popGreen : AppColors.popOrange,
              ),
            ],
          ),
          const SizedBox(height: 10),
          NeuProgressBar(
            percentage: rate,
            fillColor: rate < 20 ? AppColors.popGreen : AppColors.popOrange,
          ),
          const SizedBox(height: 6),
          Text(
            '${rate.toStringAsFixed(1)}% of calls fell back to CPU',
            style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w600, color: Colors.black45),
          ),
        ],
      ),
    );
  }

  Widget _buildRecentLogs() {
    return NeuCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('RECENT INFERENCES', style: GoogleFonts.fredoka(fontSize: 12, fontWeight: FontWeight.bold, letterSpacing: 1.2, color: Colors.black54)),
          const SizedBox(height: 12),
          ..._logs.map((log) => Padding(
            padding: const EdgeInsets.only(bottom: 8),
            child: Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: AppColors.creamBg,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: AppColors.brutalBlack.withOpacity(0.2), width: 1.5),
              ),
              child: Row(
                children: [
                  Container(
                    width: 8, height: 8,
                    decoration: BoxDecoration(
                      color: log.backend == 'NPU' ? AppColors.npuTeal : log.backend == 'GPU' ? AppColors.gpuPurple : AppColors.cpuOrange,
                      shape: BoxShape.circle,
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(log.feature, style: GoogleFonts.fredoka(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.brutalBlack)),
                        Text('${log.engine} · ${log.backend}', style: GoogleFonts.inter(fontSize: 10, color: Colors.black45)),
                      ],
                    ),
                  ),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      if (log.tokPerSec != null)
                        Text('${log.tokPerSec!.toStringAsFixed(1)} tok/s', style: GoogleFonts.fredoka(fontSize: 11, fontWeight: FontWeight.bold, color: AppColors.npuTeal)),
                      Text('${log.latencyMs}ms', style: GoogleFonts.inter(fontSize: 10, color: Colors.black38)),
                    ],
                  ),
                ],
              ),
            ),
          )),
        ],
      ),
    );
  }
}

class _NpuLogEntry {
  final String feature, engine, backend;
  final double? tokPerSec;
  final int latencyMs;
  final DateTime time;

  _NpuLogEntry({required this.feature, required this.engine, required this.backend, this.tokPerSec, required this.latencyMs, required this.time});
}
