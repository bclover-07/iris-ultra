import 'dart:async';
import 'dart:math';
import 'npu_event_service.dart';

class AmbientEnvironmentScore {
  final double lightLevel;
  final String lightQuality;
  final double stabilityScore;
  final String stabilityLabel;
  final double noiseLevel;
  final String noiseLabel;
  final double compositeScore;

  AmbientEnvironmentScore({
    required this.lightLevel,
    required this.lightQuality,
    required this.stabilityScore,
    required this.stabilityLabel,
    required this.noiseLevel,
    required this.noiseLabel,
    required this.compositeScore,
  });

  String get summary {
    return '$lightQuality light · $stabilityLabel · $noiseLabel room';
  }
}

class SensorService {
  static final SensorService _instance = SensorService._internal();
  factory SensorService() => _instance;
  SensorService._internal();

  final NpuEventService _npuEvents = NpuEventService();
  final Random _random = Random();

  bool _isMonitoring = false;
  bool get isMonitoring => _isMonitoring;

  Timer? _sensorTimer;
  final StreamController<AmbientEnvironmentScore> _scoreController =
      StreamController<AmbientEnvironmentScore>.broadcast();

  Stream<AmbientEnvironmentScore> get scoreStream => _scoreController.stream;

  Future<void> startMonitoring() async {
    if (_isMonitoring) return;
    _isMonitoring = true;

    // TODO: On real hardware with sensors_plus:
    // _lightSubscription = lightEventStream().listen((event) { ... });
    // _accelSubscription = accelerometerEventStream().listen((event) { ... });

    _sensorTimer = Timer.periodic(const Duration(seconds: 5), (_) {
      final score = _computeEnvironmentScore();
      _scoreController.add(score);
    });

    _npuEvents.logEvent(NpuEvent(
      feature: 'Ambient Sensors',
      engine: 'sensors_plus',
      backend: NpuBackend.cpu,
      latencyMs: 1,
    ));
  }

  void stopMonitoring() {
    _isMonitoring = false;
    _sensorTimer?.cancel();
    _sensorTimer = null;
  }

  AmbientEnvironmentScore _computeEnvironmentScore() {
    final lightLux = 200.0 + _random.nextDouble() * 300;
    final accelVariance = _random.nextDouble() * 0.3;
    final micAmplitude = _random.nextDouble() * 0.4;

    final lightScore = lightLux > 300 ? 1.0 : lightLux > 100 ? 0.7 : 0.3;
    final stabilityScore = accelVariance < 0.1 ? 1.0 : accelVariance < 0.2 ? 0.6 : 0.2;
    final noiseScore = micAmplitude < 0.15 ? 1.0 : micAmplitude < 0.3 ? 0.6 : 0.2;

    final composite = (lightScore * 0.3 + stabilityScore * 0.4 + noiseScore * 0.3) * 100;

    return AmbientEnvironmentScore(
      lightLevel: lightLux,
      lightQuality: lightScore >= 0.7 ? 'Good' : lightScore >= 0.4 ? 'Fair' : 'Poor',
      stabilityScore: stabilityScore,
      stabilityLabel: stabilityScore >= 0.7 ? 'Stable desk' : 'Unstable',
      noiseLevel: micAmplitude,
      noiseLabel: noiseScore >= 0.7 ? 'Quiet' : noiseScore >= 0.4 ? 'Moderate' : 'Noisy',
      compositeScore: composite,
    );
  }

  Future<void> triggerHapticNudge() async {
    // TODO: On real hardware with vibration package:
    // Vibration.vibrate(pattern: [0, 100, 50, 100]); // Two short pulses

    _npuEvents.logEvent(NpuEvent(
      feature: 'Haptic Nudge',
      engine: 'Vibration Motor',
      backend: NpuBackend.cpu,
      latencyMs: 5,
    ));
  }

  void dispose() {
    stopMonitoring();
    _scoreController.close();
  }
}
