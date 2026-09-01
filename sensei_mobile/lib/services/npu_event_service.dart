import 'dart:async';
import 'package:flutter/foundation.dart';

enum NpuBackend { npu, gpu, cpu, cloud }

class NpuEvent {
  final String feature;
  final String engine;
  final NpuBackend backend;
  final double? tokensPerSec;
  final int latencyMs;
  final DateTime timestamp;

  NpuEvent({
    required this.feature,
    required this.engine,
    required this.backend,
    this.tokensPerSec,
    required this.latencyMs,
    DateTime? timestamp,
  }) : timestamp = timestamp ?? DateTime.now();

  String get backendLabel {
    switch (backend) {
      case NpuBackend.npu:
        return 'NPU';
      case NpuBackend.gpu:
        return 'GPU';
      case NpuBackend.cpu:
        return 'CPU';
      case NpuBackend.cloud:
        return 'Cloud';
    }
  }

  Map<String, dynamic> toJson() => {
    'feature': feature,
    'engine': engine,
    'backend': backendLabel,
    'tokensPerSec': tokensPerSec,
    'latencyMs': latencyMs,
    'timestamp': timestamp.toIso8601String(),
  };
}

class NpuEventService extends ChangeNotifier {
  static final NpuEventService _instance = NpuEventService._internal();
  factory NpuEventService() => _instance;
  NpuEventService._internal();

  static const int _maxEvents = 500;
  final List<NpuEvent> _events = [];
  String _activeEngine = 'Gemma 3n E2B';
  String _activeRuntime = 'LiteRT-LM';
  NpuBackend _activeBackend = NpuBackend.npu;

  List<NpuEvent> get events => List.unmodifiable(_events);
  String get activeEngine => _activeEngine;
  String get activeRuntime => _activeRuntime;
  NpuBackend get activeBackend => _activeBackend;

  void logEvent(NpuEvent event) {
    _events.insert(0, event);
    if (_events.length > _maxEvents) {
      _events.removeLast();
    }
    _activeEngine = event.engine;
    _activeBackend = event.backend;
    notifyListeners();
  }

  void setActiveEngine(String engine, String runtime, NpuBackend backend) {
    _activeEngine = engine;
    _activeRuntime = runtime;
    _activeBackend = backend;
    notifyListeners();
  }

  int get totalInferences => _events.length;

  int get npuCount => _events.where((e) => e.backend == NpuBackend.npu).length;
  int get gpuCount => _events.where((e) => e.backend == NpuBackend.gpu).length;
  int get cpuCount => _events.where((e) => e.backend == NpuBackend.cpu).length;
  int get cloudCount => _events.where((e) => e.backend == NpuBackend.cloud).length;

  double get fallbackRate {
    if (_events.isEmpty) return 0.0;
    return (cpuCount + cloudCount) / _events.length * 100;
  }

  double get avgTokPerSec {
    final tokEvents = _events.where((e) => e.tokensPerSec != null).toList();
    if (tokEvents.isEmpty) return 0.0;
    return tokEvents.map((e) => e.tokensPerSec!).reduce((a, b) => a + b) / tokEvents.length;
  }

  List<NpuEvent> getEventsByFeature(String feature) {
    return _events.where((e) => e.feature == feature).toList();
  }

  Map<String, int> get inferencesByFeature {
    final map = <String, int>{};
    for (final e in _events) {
      map[e.feature] = (map[e.feature] ?? 0) + 1;
    }
    return map;
  }

  void clear() {
    _events.clear();
    notifyListeners();
  }
}
