import 'dart:async';
import 'npu_event_service.dart';

class SpeechService {
  static final SpeechService _instance = SpeechService._internal();
  factory SpeechService() => _instance;
  SpeechService._internal();

  final NpuEventService _npuEvents = NpuEventService();

  bool _isListening = false;
  bool _isSpeaking = false;
  bool _isInitialized = false;

  bool get isListening => _isListening;
  bool get isSpeaking => _isSpeaking;
  bool get isInitialized => _isInitialized;

  final StreamController<String> _transcriptionController = StreamController<String>.broadcast();
  Stream<String> get transcriptionStream => _transcriptionController.stream;

  Future<void> initialize() async {
    // TODO: On real hardware, initialize sherpa_onnx here:
    // await SherpaOnnx.init(
    //   modelPath: 'assets/models/sherpa-onnx-whisper-tiny',
    //   sampleRate: 16000,
    // );
    _isInitialized = true;
  }

  Future<void> startListening({Function(String)? onResult, Function(String)? onPartial}) async {
    if (_isListening) return;
    _isListening = true;

    final stopwatch = Stopwatch()..start();

    // TODO: On real hardware with sherpa_onnx:
    // final recognizer = SherpaOnnx.createOnlineRecognizer(...);
    // recognizer.start();
    // recognizer.onResult = (text) { onResult?.call(text); };

    _npuEvents.logEvent(NpuEvent(
      feature: 'STT',
      engine: 'Sherpa-ONNX Whisper',
      backend: NpuBackend.cpu,
      latencyMs: 0,
    ));
  }

  Future<String> stopListening() async {
    if (!_isListening) return '';
    _isListening = false;

    // TODO: On real hardware, stop sherpa_onnx recognizer and get final text
    return '';
  }

  Future<void> speak(String text) async {
    if (_isSpeaking) return;
    _isSpeaking = true;

    final stopwatch = Stopwatch()..start();

    // TODO: On real hardware with sherpa_onnx TTS:
    // await SherpaOnnx.tts(text);

    await Future.delayed(Duration(milliseconds: (text.length * 30).clamp(500, 5000)));

    stopwatch.stop();
    _isSpeaking = false;

    _npuEvents.logEvent(NpuEvent(
      feature: 'TTS',
      engine: 'Sherpa-ONNX TTS',
      backend: NpuBackend.cpu,
      latencyMs: stopwatch.elapsedMilliseconds,
    ));
  }

  Future<void> stopSpeaking() async {
    _isSpeaking = false;
  }

  void dispose() {
    _transcriptionController.close();
    _isInitialized = false;
  }
}
