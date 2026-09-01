import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../services/npu_event_service.dart';

class NpuConsoleState {
  final String activeEngine;
  final String activeRuntime;
  final String activeBackend;
  final int totalInferences;
  final int npuCount;
  final int gpuCount;
  final int cpuCount;
  final int cloudCount;
  final double fallbackRate;
  final double avgTokPerSec;
  final Map<String, int> inferencesByFeature;
  final List<NpuEvent> recentEvents;

  const NpuConsoleState({
    this.activeEngine = 'Gemma 3n E2B',
    this.activeRuntime = 'LiteRT-LM',
    this.activeBackend = 'NPU',
    this.totalInferences = 0,
    this.npuCount = 0,
    this.gpuCount = 0,
    this.cpuCount = 0,
    this.cloudCount = 0,
    this.fallbackRate = 0.0,
    this.avgTokPerSec = 0.0,
    this.inferencesByFeature = const {},
    this.recentEvents = const [],
  });
}

class NpuConsoleNotifier extends StateNotifier<NpuConsoleState> {
  final NpuEventService _service = NpuEventService();

  NpuConsoleNotifier() : super(const NpuConsoleState()) {
    _service.addListener(_onUpdate);
    _onUpdate();
  }

  void _onUpdate() {
    state = NpuConsoleState(
      activeEngine: _service.activeEngine,
      activeRuntime: _service.activeRuntime,
      activeBackend: _service.activeBackend.name.toUpperCase(),
      totalInferences: _service.totalInferences,
      npuCount: _service.npuCount,
      gpuCount: _service.gpuCount,
      cpuCount: _service.cpuCount,
      cloudCount: _service.cloudCount,
      fallbackRate: _service.fallbackRate,
      avgTokPerSec: _service.avgTokPerSec,
      inferencesByFeature: _service.inferencesByFeature,
      recentEvents: _service.events.take(20).toList(),
    );
  }

  @override
  void dispose() {
    _service.removeListener(_onUpdate);
    super.dispose();
  }
}

final npuConsoleProvider = StateNotifierProvider<NpuConsoleNotifier, NpuConsoleState>((ref) {
  return NpuConsoleNotifier();
});
