import 'dart:async';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../services/vision_service.dart';
import '../services/sensor_service.dart';
import '../services/api_service.dart';
import '../models/feature_models.dart';

class FocusState {
  final bool isSessionActive;
  final FocusSessionModel? currentSession;
  final PoseResult? latestPose;
  final AmbientEnvironmentScore? ambientScore;
  final int distractionCount;
  final int elapsedSeconds;
  final bool isBreathingMode;
  final int breathingPhase;
  final bool isBiometricVerified;

  const FocusState({
    this.isSessionActive = false,
    this.currentSession,
    this.latestPose,
    this.ambientScore,
    this.distractionCount = 0,
    this.elapsedSeconds = 0,
    this.isBreathingMode = false,
    this.breathingPhase = 0,
    this.isBiometricVerified = false,
  });

  FocusState copyWith({
    bool? isSessionActive,
    FocusSessionModel? currentSession,
    PoseResult? latestPose,
    AmbientEnvironmentScore? ambientScore,
    int? distractionCount,
    int? elapsedSeconds,
    bool? isBreathingMode,
    int? breathingPhase,
    bool? isBiometricVerified,
  }) {
    return FocusState(
      isSessionActive: isSessionActive ?? this.isSessionActive,
      currentSession: currentSession ?? this.currentSession,
      latestPose: latestPose ?? this.latestPose,
      ambientScore: ambientScore ?? this.ambientScore,
      distractionCount: distractionCount ?? this.distractionCount,
      elapsedSeconds: elapsedSeconds ?? this.elapsedSeconds,
      isBreathingMode: isBreathingMode ?? this.isBreathingMode,
      breathingPhase: breathingPhase ?? this.breathingPhase,
      isBiometricVerified: isBiometricVerified ?? this.isBiometricVerified,
    );
  }
}

class FocusNotifier extends StateNotifier<FocusState> {
  final VisionService _vision = VisionService();
  final SensorService _sensor = SensorService();
  Timer? _sessionTimer;
  Timer? _poseTimer;
  StreamSubscription? _ambientSub;

  FocusNotifier() : super(const FocusState());

  Future<void> startSession({bool biometricGated = false}) async {
    final session = FocusSessionModel(
      startTime: DateTime.now(),
    );

    state = state.copyWith(
      isSessionActive: true,
      currentSession: session,
      distractionCount: 0,
      elapsedSeconds: 0,
      isBiometricVerified: biometricGated,
    );

    _sessionTimer = Timer.periodic(const Duration(seconds: 1), (_) {
      state = state.copyWith(elapsedSeconds: state.elapsedSeconds + 1);
    });

    _poseTimer = Timer.periodic(const Duration(seconds: 3), (_) async {
      final pose = await _vision.detectPose(null);
      state = state.copyWith(latestPose: pose);

      if (pose.isDistracted) {
        state = state.copyWith(distractionCount: state.distractionCount + 1);
        if (state.distractionCount % 3 == 0) {
          await _sensor.triggerHapticNudge();
        }
      }
    });

    await _sensor.startMonitoring();
    _ambientSub = _sensor.scoreStream.listen((score) {
      state = state.copyWith(ambientScore: score);
    });
  }

  Future<FocusSessionModel> endSession() async {
    _sessionTimer?.cancel();
    _poseTimer?.cancel();
    _ambientSub?.cancel();
    _sensor.stopMonitoring();

    final session = FocusSessionModel(
      startTime: state.currentSession?.startTime ?? DateTime.now(),
      endTime: DateTime.now(),
      distractionCount: state.distractionCount,
      ambientScore: state.ambientScore?.compositeScore ?? 0,
      ambientSummary: state.ambientScore?.summary ?? '',
      verifiedMinutes: state.elapsedSeconds ~/ 60,
      isActive: false,
    );

    state = const FocusState();
    return session;
  }

  void toggleBreathingMode() {
    state = state.copyWith(isBreathingMode: !state.isBreathingMode);
  }

  @override
  void dispose() {
    _sessionTimer?.cancel();
    _poseTimer?.cancel();
    _ambientSub?.cancel();
    super.dispose();
  }
}

final focusProvider = StateNotifierProvider<FocusNotifier, FocusState>((ref) {
  return FocusNotifier();
});
