class StudyPlanModel {
  final String id;
  final String title;
  final String subject;
  final int durationDays;
  final double estimatedHoursPerDay;
  final List<StudyDay> days;
  final int totalTasks;
  final int completedTasks;
  final bool isActive;

  StudyPlanModel({
    required this.id,
    required this.title,
    required this.subject,
    required this.durationDays,
    required this.estimatedHoursPerDay,
    required this.days,
    required this.totalTasks,
    required this.completedTasks,
    required this.isActive,
  });

  double get progressPercent => totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  factory StudyPlanModel.fromJson(Map<String, dynamic> json) {
    return StudyPlanModel(
      id: json['_id'] ?? '',
      title: json['title'] ?? 'Study Plan',
      subject: json['subject'] ?? 'General',
      durationDays: json['durationDays'] ?? 7,
      estimatedHoursPerDay: (json['estimatedHoursPerDay'] ?? 2.5).toDouble(),
      days: (json['days'] as List? ?? []).map((d) => StudyDay.fromJson(d)).toList(),
      totalTasks: json['totalTasks'] ?? 0,
      completedTasks: json['completedTasks'] ?? 0,
      isActive: json['isActive'] ?? true,
    );
  }
}

class StudyDay {
  final int dayNumber;
  final String topic;
  final List<StudyTask> tasks;

  StudyDay({required this.dayNumber, required this.topic, required this.tasks});

  factory StudyDay.fromJson(Map<String, dynamic> json) {
    return StudyDay(
      dayNumber: json['dayNumber'] ?? 1,
      topic: json['topic'] ?? '',
      tasks: (json['tasks'] as List? ?? []).map((t) => StudyTask.fromJson(t)).toList(),
    );
  }
}

class StudyTask {
  final String title;
  final int durationMinutes;
  bool completed;

  StudyTask({required this.title, required this.durationMinutes, this.completed = false});

  factory StudyTask.fromJson(Map<String, dynamic> json) {
    return StudyTask(
      title: json['title'] ?? '',
      durationMinutes: json['durationMinutes'] ?? 45,
      completed: json['completed'] ?? false,
    );
  }
}
