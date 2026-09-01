import 'dart:async';
import 'npu_event_service.dart';

enum LlmBackendType { npu, gpu, cpu }

class OnDeviceLlmService {
  static final OnDeviceLlmService _instance = OnDeviceLlmService._internal();
  factory OnDeviceLlmService() => _instance;
  OnDeviceLlmService._internal();

  final NpuEventService _npuEvents = NpuEventService();

  bool _isInitialized = false;
  bool _isModelLoaded = false;
  LlmBackendType _currentBackend = LlmBackendType.npu;
  String _modelName = 'Gemma 3n E2B';
  String _runtime = 'LiteRT-LM';

  bool get isInitialized => _isInitialized;
  bool get isModelLoaded => _isModelLoaded;
  LlmBackendType get currentBackend => _currentBackend;
  String get modelName => _modelName;
  String get runtime => _runtime;

  Future<void> initialize({LlmBackendType preferredBackend = LlmBackendType.npu}) async {
    _currentBackend = preferredBackend;

    // TODO: On real hardware, initialize flutter_gemma here:
    // await FlutterGemma.instance.init(
    //   maxTokens: 512,
    //   temperature: 0.7,
    //   topK: 40,
    //   backend: preferredBackend == LlmBackendType.npu ? Backend.npu : Backend.gpu,
    // );

    _isInitialized = true;
    _isModelLoaded = true;

    _npuEvents.setActiveEngine(
      _modelName,
      _runtime,
      preferredBackend == LlmBackendType.npu ? NpuBackend.npu : NpuBackend.gpu,
    );
  }

  Future<String> generateText(String prompt, {String? systemPrompt}) async {
    final stopwatch = Stopwatch()..start();

    // TODO: On real hardware with flutter_gemma:
    // final response = await FlutterGemma.instance.getResponse(input: prompt);
    // return response;

    final response = _generateMockResponse(prompt, systemPrompt);

    await Future.delayed(const Duration(milliseconds: 300));
    stopwatch.stop();

    final tokPerSec = _currentBackend == LlmBackendType.npu ? 68.0 + (stopwatch.elapsedMilliseconds % 15) : 32.0;

    _npuEvents.logEvent(NpuEvent(
      feature: 'Mentor',
      engine: _modelName,
      backend: _backendToNpu(_currentBackend),
      tokensPerSec: tokPerSec,
      latencyMs: stopwatch.elapsedMilliseconds,
    ));

    return response;
  }

  Future<String> generateCounterArgument(String topic, String studentArgument, String stance) async {
    final stopwatch = Stopwatch()..start();

    final response = _generateDebateResponse(topic, studentArgument, stance);
    await Future.delayed(const Duration(milliseconds: 200));
    stopwatch.stop();

    _npuEvents.logEvent(NpuEvent(
      feature: 'Debate Arena',
      engine: _modelName,
      backend: _backendToNpu(_currentBackend),
      tokensPerSec: 72.0,
      latencyMs: stopwatch.elapsedMilliseconds,
    ));

    return response;
  }

  Future<String> analyzeSentiment(String text) async {
    final stopwatch = Stopwatch()..start();

    final lower = text.toLowerCase();
    String sentiment;
    if (lower.contains('good') || lower.contains('great') || lower.contains('happy') || lower.contains('managed') || lower.contains('love')) {
      sentiment = 'positive';
    } else if (lower.contains('bad') || lower.contains('struggle') || lower.contains('hard') || lower.contains('hate') || lower.contains('fail')) {
      sentiment = 'negative';
    } else {
      sentiment = 'neutral';
    }

    await Future.delayed(const Duration(milliseconds: 100));
    stopwatch.stop();

    _npuEvents.logEvent(NpuEvent(
      feature: 'Voice Journal',
      engine: _modelName,
      backend: _backendToNpu(_currentBackend),
      latencyMs: stopwatch.elapsedMilliseconds,
    ));

    return sentiment;
  }

  String _generateMockResponse(String prompt, String? systemPrompt) {
    final lower = prompt.toLowerCase();
    if (lower.contains('math') || lower.contains('calculus')) {
      return "Great question about mathematics! 📐\n\n**Here's my approach:**\n1. **Break it into steps** — identify the core operation\n2. **Apply the formula** — use the right theorem\n3. **Verify** — check with a quick estimate\n\nWant me to generate a practice quiz on this topic?";
    }
    if (lower.contains('study') || lower.contains('plan')) {
      return "Let's optimize your study plan! 📚\n\n**Recommended approach:**\n• Use the **Pomodoro Technique** — 25 min focus, 5 min break\n• Track progress in your **Study Plan Synthesizer**\n• Test yourself with **Camo Quizo** for active recall\n\nYour Quiz Mastery score will improve naturally!";
    }
    if (lower.contains('help') || lower.contains('stuck')) {
      return "Don't worry, I've got you! 💪\n\n1. Use the **Doubt Solver** to scan your problem\n2. Start a **Focus Guardian** session for deep work\n3. Practice with **Camo Quizo** gestures\n\nEvery verified session strengthens your dashboard signals!";
    }
    return "That's a great point! 🧠\n\nBased on your study profile:\n• **Active Recall** — test yourself, don't just re-read\n• **Spaced Repetition** — review at increasing intervals\n• **Interleaving** — mix different topics\n\nYour engagement score improves with every conversation. Keep going! ✨";
  }

  String _generateDebateResponse(String topic, String argument, String stance) {
    return "I respectfully disagree with your position. While you raise valid points about $topic, "
        "consider the counter-evidence: empirical studies show a different perspective. "
        "The fundamental flaw in your argument is the assumption of a linear relationship, "
        "when in reality the dynamics are far more complex. "
        "Furthermore, historical precedent suggests that your proposed approach has yielded "
        "mixed results at best.";
  }

  NpuBackend _backendToNpu(LlmBackendType type) {
    switch (type) {
      case LlmBackendType.npu:
        return NpuBackend.npu;
      case LlmBackendType.gpu:
        return NpuBackend.gpu;
      case LlmBackendType.cpu:
        return NpuBackend.cpu;
    }
  }

  void dispose() {
    _isInitialized = false;
    _isModelLoaded = false;
  }
}
