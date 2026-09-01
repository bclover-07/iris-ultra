import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../services/vision_service.dart';
import '../models/quiz_question.dart';

class QuizState {
  final List<QuizQuestion> questions;
  final int currentIndex;
  final int score;
  final int totalAnswered;
  final HandGesture? detectedGesture;
  final bool isDetecting;
  final bool isAnswerLocked;
  final String? feedback;
  final String selectedTopic;

  const QuizState({
    this.questions = const [],
    this.currentIndex = 0,
    this.score = 0,
    this.totalAnswered = 0,
    this.detectedGesture,
    this.isDetecting = false,
    this.isAnswerLocked = false,
    this.feedback,
    this.selectedTopic = 'Computer Science',
  });

  QuizQuestion? get currentQuestion =>
      questions.isNotEmpty && currentIndex < questions.length
          ? questions[currentIndex]
          : null;

  QuizState copyWith({
    List<QuizQuestion>? questions,
    int? currentIndex,
    int? score,
    int? totalAnswered,
    HandGesture? detectedGesture,
    bool? isDetecting,
    bool? isAnswerLocked,
    String? feedback,
    String? selectedTopic,
  }) {
    return QuizState(
      questions: questions ?? this.questions,
      currentIndex: currentIndex ?? this.currentIndex,
      score: score ?? this.score,
      totalAnswered: totalAnswered ?? this.totalAnswered,
      detectedGesture: detectedGesture ?? this.detectedGesture,
      isDetecting: isDetecting ?? this.isDetecting,
      isAnswerLocked: isAnswerLocked ?? this.isAnswerLocked,
      feedback: feedback ?? this.feedback,
      selectedTopic: selectedTopic ?? this.selectedTopic,
    );
  }
}

class QuizNotifier extends StateNotifier<QuizState> {
  final VisionService _vision = VisionService();

  QuizNotifier() : super(const QuizState());

  void loadQuestions(List<QuizQuestion> questions) {
    state = state.copyWith(
      questions: questions,
      currentIndex: 0,
      score: 0,
      totalAnswered: 0,
    );
  }

  Future<void> detectGesture() async {
    state = state.copyWith(isDetecting: true);

    final gesture = await _vision.detectHandLandmarks(null);

    state = state.copyWith(
      detectedGesture: gesture,
      isDetecting: false,
    );
  }

  void submitAnswer(int answerIndex) {
    final question = state.currentQuestion;
    if (question == null || state.isAnswerLocked) return;

    final isCorrect = answerIndex == question.correctIndex;
    final newScore = state.score + (isCorrect ? 1 : 0);

    state = state.copyWith(
      score: newScore,
      totalAnswered: state.totalAnswered + 1,
      isAnswerLocked: true,
      feedback: isCorrect ? '✅ Correct!' : '❌ Wrong — Answer: ${question.correctAnswer}',
    );
  }

  void nextQuestion() {
    if (state.currentIndex + 1 < state.questions.length) {
      state = state.copyWith(
        currentIndex: state.currentIndex + 1,
        isAnswerLocked: false,
        feedback: null,
        detectedGesture: null,
      );
    }
  }

  void setTopic(String topic) {
    state = state.copyWith(selectedTopic: topic);
  }
}

final quizProvider = StateNotifierProvider<QuizNotifier, QuizState>((ref) {
  return QuizNotifier();
});
