class FocusSessionModel {
  final String? id;
  final DateTime startTime;
  DateTime? endTime;
  int distractionCount;
  double breathingCompliance;
  double ambientScore;
  String ambientSummary;
  int verifiedMinutes;
  bool isActive;

  FocusSessionModel({
    this.id,
    required this.startTime,
    this.endTime,
    this.distractionCount = 0,
    this.breathingCompliance = 0.0,
    this.ambientScore = 0.0,
    this.ambientSummary = '',
    this.verifiedMinutes = 0,
    this.isActive = true,
  });

  Duration get duration => (endTime ?? DateTime.now()).difference(startTime);

  Map<String, dynamic> toJson() => {
    'startTime': startTime.toIso8601String(),
    'endTime': endTime?.toIso8601String(),
    'distractionCount': distractionCount,
    'breathingCompliance': breathingCompliance,
    'ambientScore': ambientScore,
    'ambientSummary': ambientSummary,
    'verifiedMinutes': verifiedMinutes,
  };

  factory FocusSessionModel.fromJson(Map<String, dynamic> json) {
    return FocusSessionModel(
      id: json['_id'],
      startTime: DateTime.tryParse(json['startTime'] ?? '') ?? DateTime.now(),
      endTime: json['endTime'] != null ? DateTime.tryParse(json['endTime']) : null,
      distractionCount: json['distractionCount'] ?? 0,
      breathingCompliance: (json['breathingCompliance'] ?? 0.0).toDouble(),
      ambientScore: (json['ambientScore'] ?? 0.0).toDouble(),
      ambientSummary: json['ambientSummary'] ?? '',
      verifiedMinutes: json['verifiedMinutes'] ?? 0,
      isActive: json['isActive'] ?? false,
    );
  }
}

class VoiceJournalEntry {
  final String? id;
  final String transcript;
  final String sentiment;
  final int duration;
  final DateTime timestamp;

  VoiceJournalEntry({
    this.id,
    required this.transcript,
    required this.sentiment,
    required this.duration,
    required this.timestamp,
  });

  Map<String, dynamic> toJson() => {
    'transcript': transcript,
    'sentiment': sentiment,
    'duration': duration,
  };

  factory VoiceJournalEntry.fromJson(Map<String, dynamic> json) {
    return VoiceJournalEntry(
      id: json['_id'],
      transcript: json['transcript'] ?? '',
      sentiment: json['sentiment'] ?? 'neutral',
      duration: json['duration'] ?? 30,
      timestamp: DateTime.tryParse(json['createdAt'] ?? '') ?? DateTime.now(),
    );
  }
}

class DoubtSessionModel {
  final String? id;
  final String question;
  final String subject;
  final String inputMode;
  final String difficulty;
  final String? summary;
  final List<DoubtStep> steps;
  final String? finalAnswer;
  final String? keyTakeaway;

  DoubtSessionModel({
    this.id,
    required this.question,
    required this.subject,
    required this.inputMode,
    required this.difficulty,
    this.summary,
    required this.steps,
    this.finalAnswer,
    this.keyTakeaway,
  });

  factory DoubtSessionModel.fromJson(Map<String, dynamic> json) {
    return DoubtSessionModel(
      id: json['doubtId'] ?? json['_id'],
      question: json['question'] ?? '',
      subject: json['subject'] ?? json['detectedTopic'] ?? 'STEM',
      inputMode: json['inputMode'] ?? 'text',
      difficulty: json['difficulty'] ?? 'Medium',
      summary: json['summary'],
      steps: (json['steps'] as List? ?? []).map((s) => DoubtStep.fromJson(s)).toList(),
      finalAnswer: json['finalAnswer'],
      keyTakeaway: json['keyTakeaway'],
    );
  }
}

class DoubtStep {
  final int stepNumber;
  final String title;
  final String explanation;

  DoubtStep({required this.stepNumber, required this.title, required this.explanation});

  factory DoubtStep.fromJson(Map<String, dynamic> json) {
    return DoubtStep(
      stepNumber: json['stepNumber'] ?? 1,
      title: json['title'] ?? '',
      explanation: json['explanation'] ?? '',
    );
  }
}
