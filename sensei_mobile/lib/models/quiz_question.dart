class QuizQuestion {
  final String id;
  final String question;
  final List<String> options;
  final String correctAnswer;
  final String subject;
  final String difficulty;

  QuizQuestion({
    required this.id,
    required this.question,
    required this.options,
    required this.correctAnswer,
    required this.subject,
    required this.difficulty,
  });

  int get correctIndex => options.indexOf(correctAnswer);

  factory QuizQuestion.fromJson(Map<String, dynamic> json) {
    return QuizQuestion(
      id: json['_id'] ?? '',
      question: json['question'] ?? '',
      options: List<String>.from(json['options'] ?? []),
      correctAnswer: json['correctAnswer'] ?? '',
      subject: json['subject'] ?? 'General',
      difficulty: json['difficulty'] ?? 'Medium',
    );
  }
}

class QuizAttempt {
  final String id;
  final String quizId;
  final String selectedAnswer;
  final bool isCorrect;
  final String inputMode;
  final int timeTakenMs;
  final DateTime timestamp;

  QuizAttempt({
    required this.id,
    required this.quizId,
    required this.selectedAnswer,
    required this.isCorrect,
    required this.inputMode,
    required this.timeTakenMs,
    required this.timestamp,
  });

  factory QuizAttempt.fromJson(Map<String, dynamic> json) {
    return QuizAttempt(
      id: json['_id'] ?? '',
      quizId: json['quizId'] ?? '',
      selectedAnswer: json['selectedAnswer'] ?? '',
      isCorrect: json['isCorrect'] ?? false,
      inputMode: json['inputMode'] ?? 'gesture',
      timeTakenMs: json['timeTakenMs'] ?? 0,
      timestamp: DateTime.tryParse(json['createdAt'] ?? '') ?? DateTime.now(),
    );
  }
}
