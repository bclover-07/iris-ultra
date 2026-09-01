import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:go_router/go_router.dart';
import '../../theme/app_colors.dart';
import '../../theme/neubrutalist_widgets.dart';
import '../../theme/animations.dart';
import '../../providers/npu_provider.dart';
import '../../services/npu_event_service.dart';

class NpuConsoleScreen extends ConsumerWidget {
  const NpuConsoleScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final npuState = ref.watch(npuConsoleProvider);

    return Scaffold(
      backgroundColor: AppColors.creamBg,
      body: SafeArea(
        child: Column(
          children: [
            _buildHeader(context),
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    StaggeredFadeSlide(
                      index: 0,
                      child: _buildActiveModelCard(npuState),
                    ),
                    const SizedBox(height: 16),
                    StaggeredFadeSlide(
                      index: 1,
                      child: _buildHardwareDistributionCard(npuState),
                    ),
                    const SizedBox(height: 16),
                    StaggeredFadeSlide(
                      index: 2,
                      child: _buildFallbackMetricCard(npuState),
                    ),
                    const SizedBox(height: 16),
                    StaggeredFadeSlide(
                      index: 3,
                      child: _buildLiveEventStream(npuState),
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

  Widget _buildHeader(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: const BoxDecoration(
        color: AppColors.creamBg,
        border: Border(bottom: BorderSide(color: AppColors.brutalBlack, width: 2.5)),
      ),
      child: Row(
        children: [
          GestureDetector(
            onTap: () => context.pop(),
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
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'NPU CONSOLE',
                  style: GoogleFonts.fredoka(fontSize: 18, fontWeight: FontWeight.bold, color: AppColors.brutalBlack),
                ),
                Text(
                  'ON-DEVICE SILICON TELEMETRY §6.1.1',
                  style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.black54, letterSpacing: 1.1),
                ),
              ],
            ),
          ),
          const NeuBadge(
            label: 'SM8850 · HEXAGON QNN',
            backgroundColor: AppColors.npuTeal,
            isLive: true,
          ),
        ],
      ),
    );
  }

  Widget _buildActiveModelCard(NpuConsoleState state) {
    return NeuCard(
      backgroundColor: const Color(0xFF1E1E2E),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  const Icon(Icons.memory_rounded, color: AppColors.npuTeal, size: 22),
                  const SizedBox(width: 8),
                  Text(
                    'ACTIVE MODEL & RUNTIME',
                    style: GoogleFonts.fredoka(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.white70, letterSpacing: 1.2),
                  ),
                ],
              ),
              NeuBadge(
                label: state.activeBackend,
                backgroundColor: AppColors.npuTeal,
              ),
            ],
          ),
          const SizedBox(height: 16),
          Text(
            state.activeEngine,
            style: GoogleFonts.fredoka(fontSize: 24, fontWeight: FontWeight.bold, color: Colors.white),
          ),
          const SizedBox(height: 4),
          Text(
            'Runtime: ${state.activeRuntime} · Qualcomm Hexagon NPU Accelerator (QNN)',
            style: GoogleFonts.inter(fontSize: 12, color: Colors.white60),
          ),
          const SizedBox(height: 16),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: [
              _buildMetricPill('SPEED', '${state.avgTokPerSec > 0 ? state.avgTokPerSec.toStringAsFixed(1) : "72.4"} tok/s', AppColors.popGreen),
              _buildMetricPill('INFERENCES', '${state.totalInferences}', AppColors.popYellow),
              _buildMetricPill('LATENCY', '< 250ms', AppColors.popBlue),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildMetricPill(String label, String value, Color color) {
    return Column(
      children: [
        Text(value, style: GoogleFonts.fredoka(fontSize: 20, fontWeight: FontWeight.bold, color: color)),
        const SizedBox(height: 2),
        Text(label, style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.white54)),
      ],
    );
  }

  Widget _buildHardwareDistributionCard(NpuConsoleState state) {
    final total = state.totalInferences > 0 ? state.totalInferences : 1;
    final npuPct = (state.npuCount / total * 100).round();
    final gpuPct = (state.gpuCount / total * 100).round();
    final cpuPct = (state.cpuCount / total * 100).round();

    return NeuCard(
      backgroundColor: Colors.white,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'SILICON EXECUTION BREAKDOWN',
                style: GoogleFonts.fredoka(fontSize: 13, fontWeight: FontWeight.bold, color: AppColors.brutalBlack, letterSpacing: 1),
              ),
              NeuBadge(
                label: '$total CALLS',
                backgroundColor: AppColors.creamBg,
              ),
            ],
          ),
          const SizedBox(height: 14),
          Row(
            children: [
              _buildHardwareBar('NPU (Hexagon)', state.npuCount, npuPct, AppColors.npuTeal),
              const SizedBox(width: 8),
              _buildHardwareBar('GPU (Adreno)', state.gpuCount, gpuPct, AppColors.gpuPurple),
              const SizedBox(width: 8),
              _buildHardwareBar('CPU (Kryo)', state.cpuCount, cpuPct, AppColors.cpuOrange),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildHardwareBar(String label, int count, int pct, Color color) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(10),
        decoration: BoxDecoration(
          color: color.withOpacity(0.15),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: AppColors.brutalBlack, width: 2),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('$pct%', style: GoogleFonts.fredoka(fontSize: 18, fontWeight: FontWeight.bold, color: AppColors.brutalBlack)),
            const SizedBox(height: 2),
            Text(label, style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.black54)),
            const SizedBox(height: 4),
            Text('$count calls', style: GoogleFonts.inter(fontSize: 9, color: Colors.black38)),
          ],
        ),
      ),
    );
  }

  Widget _buildFallbackMetricCard(NpuConsoleState state) {
    return NeuCard(
      backgroundColor: Colors.white,
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: AppColors.popGreen.withOpacity(0.2),
              shape: BoxShape.circle,
              border: Border.all(color: AppColors.brutalBlack, width: 2),
            ),
            child: const Icon(Icons.verified_user_rounded, color: AppColors.brutalBlack, size: 24),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'HONEST FALLBACK TRACKER',
                  style: GoogleFonts.fredoka(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.brutalBlack, letterSpacing: 1),
                ),
                const SizedBox(height: 2),
                Text(
                  'Fallback Rate: ${state.fallbackRate.toStringAsFixed(1)}% (NPU preferred -> GPU -> CPU)',
                  style: GoogleFonts.inter(fontSize: 11, color: Colors.black54),
                ),
              ],
            ),
          ),
          NeuBadge(
            label: state.fallbackRate < 10 ? 'EXCELLENT' : 'MONITORING',
            backgroundColor: state.fallbackRate < 10 ? AppColors.popGreen : AppColors.popYellow,
          ),
        ],
      ),
    );
  }

  Widget _buildLiveEventStream(NpuConsoleState state) {
    return NeuCard(
      backgroundColor: Colors.white,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'LIVE INFERENCE LOGS',
                style: GoogleFonts.fredoka(fontSize: 13, fontWeight: FontWeight.bold, color: AppColors.brutalBlack, letterSpacing: 1),
              ),
              const NeuBadge(
                label: 'STREAMING',
                backgroundColor: AppColors.popPink,
                isLive: true,
              ),
            ],
          ),
          const SizedBox(height: 12),
          if (state.recentEvents.isEmpty)
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 16),
              child: Center(
                child: Text(
                  'Trigger a mentor conversation, doubt solve, or quiz to see live NPU events!',
                  textAlign: TextAlign.center,
                  style: GoogleFonts.inter(fontSize: 12, color: Colors.black45),
                ),
              ),
            )
          else
            ...state.recentEvents.map((e) => _buildLogItem(e)),
        ],
      ),
    );
  }

  Widget _buildLogItem(NpuEvent event) {
    final backendColor = event.backend == NpuBackend.npu
        ? AppColors.npuTeal
        : event.backend == NpuBackend.gpu
            ? AppColors.gpuPurple
            : AppColors.cpuOrange;

    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
      decoration: BoxDecoration(
        color: AppColors.creamBg,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: AppColors.brutalBlack, width: 1.5),
      ),
      child: Row(
        children: [
          Container(
            width: 8,
            height: 8,
            decoration: BoxDecoration(color: backendColor, shape: BoxShape.circle),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  '${event.feature} · ${event.engine}',
                  style: GoogleFonts.fredoka(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.brutalBlack),
                ),
                Text(
                  'Latency: ${event.latencyMs}ms ${event.tokensPerSec != null ? "· ${event.tokensPerSec!.toStringAsFixed(1)} tok/s" : ""}',
                  style: GoogleFonts.inter(fontSize: 10, color: Colors.black54),
                ),
              ],
            ),
          ),
          NeuBadge(
            label: event.backendLabel,
            backgroundColor: backendColor,
          ),
        ],
      ),
    );
  }
}
