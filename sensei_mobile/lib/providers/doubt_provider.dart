import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../services/api_service.dart';
import '../models/feature_models.dart';

class DoubtState {
  final String inputMode;
  final String? ocrText;
  final List<dynamic> detectedRegions;
  final DoubtSessionModel? solution;
  final bool isLoading;
  final bool isCameraActive;
  final String? selectedSubject;

  const DoubtState({
    this.inputMode = 'text',
    this.ocrText,
    this.detectedRegions = const [],
    this.solution,
    this.isLoading = false,
    this.isCameraActive = false,
    this.selectedSubject,
  });

  DoubtState copyWith({
    String? inputMode,
    String? ocrText,
    List<dynamic>? detectedRegions,
    DoubtSessionModel? solution,
    bool? isLoading,
    bool? isCameraActive,
    String? selectedSubject,
  }) {
    return DoubtState(
      inputMode: inputMode ?? this.inputMode,
      ocrText: ocrText ?? this.ocrText,
      detectedRegions: detectedRegions ?? this.detectedRegions,
      solution: solution ?? this.solution,
      isLoading: isLoading ?? this.isLoading,
      isCameraActive: isCameraActive ?? this.isCameraActive,
      selectedSubject: selectedSubject ?? this.selectedSubject,
    );
  }
}

class DoubtNotifier extends StateNotifier<DoubtState> {
  DoubtNotifier() : super(const DoubtState());

  void setInputMode(String mode) {
    state = state.copyWith(inputMode: mode);
  }

  void setOcrText(String text) {
    state = state.copyWith(ocrText: text);
  }

  void setDetectedRegions(List<dynamic> regions) {
    state = state.copyWith(detectedRegions: regions);
  }

  void setSolution(DoubtSessionModel solution) {
    state = state.copyWith(solution: solution, isLoading: false);
  }

  void setLoading(bool loading) {
    state = state.copyWith(isLoading: loading);
  }

  void toggleCamera() {
    state = state.copyWith(isCameraActive: !state.isCameraActive);
  }

  void setSubject(String subject) {
    state = state.copyWith(selectedSubject: subject);
  }

  void clear() {
    state = const DoubtState();
  }
}

final doubtProvider = StateNotifierProvider<DoubtNotifier, DoubtState>((ref) {
  return DoubtNotifier();
});
