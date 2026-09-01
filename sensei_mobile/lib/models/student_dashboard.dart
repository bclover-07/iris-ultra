class SubjectMark {
  final String subject;
  final int ut1;
  final int midSem;
  final int ut2;
  final int endSem;
  final int total;
  final double percentage;

  SubjectMark({
    required this.subject,
    required this.ut1,
    required this.midSem,
    required this.ut2,
    required this.endSem,
    required this.total,
    required this.percentage,
  });

  factory SubjectMark.fromJson(Map<String, dynamic> json) {
    return SubjectMark(
      subject: json['subject'] ?? '',
      ut1: json['ut1'] ?? 0,
      midSem: json['midSem'] ?? 0,
      ut2: json['ut2'] ?? 0,
      endSem: json['endSem'] ?? 0,
      total: json['total'] ?? 0,
      percentage: (json['percentage'] ?? 0).toDouble(),
    );
  }
}

class MarksTrend {
  final List<String> labels;
  final List<MarksTrendDataset> datasets;

  MarksTrend({required this.labels, required this.datasets});

  factory MarksTrend.fromJson(Map<String, dynamic> json) {
    return MarksTrend(
      labels: List<String>.from(json['labels'] ?? []),
      datasets: (json['datasets'] as List?)
              ?.map((d) => MarksTrendDataset.fromJson(d))
              .toList() ??
          [],
    );
  }
}

class MarksTrendDataset {
  final String label;
  final List<double> data;

  MarksTrendDataset({required this.label, required this.data});

  factory MarksTrendDataset.fromJson(Map<String, dynamic> json) {
    return MarksTrendDataset(
      label: json['label'] ?? '',
      data: (json['data'] as List?)?.map<double>((v) => (v is num ? v.toDouble() : 0.0)).toList() ?? [],
    );
  }
}

class LeaderboardPosition {
  final int rank;
  final int score;
  final double percentile;

  LeaderboardPosition({required this.rank, required this.score, required this.percentile});

  factory LeaderboardPosition.fromJson(Map<String, dynamic> json) {
    return LeaderboardPosition(
      rank: json['rank'] ?? 0,
      score: json['score'] ?? 0,
      percentile: (json['percentile'] ?? 0).toDouble(),
    );
  }
}

class AttendanceMonth {
  final String month;
  final double percentage;
  final List<bool> days;

  AttendanceMonth({required this.month, required this.percentage, required this.days});

  factory AttendanceMonth.fromJson(Map<String, dynamic> json) {
    return AttendanceMonth(
      month: json['month'] ?? '',
      percentage: (json['percentage'] ?? 0).toDouble(),
      days: (json['days'] as List?)?.map((d) => d == true).toList() ?? [],
    );
  }
}

class SemesterGPA {
  final String sem;
  final String gpa;
  final int credits;

  SemesterGPA({required this.sem, required this.gpa, required this.credits});

  factory SemesterGPA.fromJson(Map<String, dynamic> json) {
    return SemesterGPA(
      sem: json['sem'] ?? '',
      gpa: json['gpa']?.toString() ?? '0',
      credits: json['credits'] ?? 0,
    );
  }
}

class AppNotification {
  final String id;
  final String userId;
  final String type;
  final String title;
  final String message;
  final String? link;
  final bool isRead;
  final String createdAt;

  AppNotification({
    required this.id,
    required this.userId,
    required this.type,
    required this.title,
    required this.message,
    this.link,
    required this.isRead,
    required this.createdAt,
  });

  factory AppNotification.fromJson(Map<String, dynamic> json) {
    return AppNotification(
      id: json['_id'] ?? '',
      userId: json['userId'] ?? '',
      type: json['type'] ?? '',
      title: json['title'] ?? '',
      message: json['message'] ?? '',
      link: json['link'],
      isRead: json['isRead'] ?? false,
      createdAt: json['createdAt'] ?? '',
    );
  }
}

class StudentDashboard {
  final String name;
  final double cgpa;
  final double avgAttendance;
  final int classRank;
  final int totalStudents;
  final double dropoutProbability;
  final String dropoutTier;
  final String riskLevel;
  final String riskReason;
  final List<String> recommendations;
  final MarksTrend? marksTrend;
  final List<SubjectMark> subjectMarks;
  final List<AppNotification> recentNotifications;
  final LeaderboardPosition? leaderboardPosition;
  final int activeInterventions;
  final int streakDays;
  final int totalXP;
  final List<String> badges;
  final int level;
  final int activePolls;
  final int pendingHelpTickets;
  final List<AttendanceMonth> attendanceHistory;
  final List<SemesterGPA> semesterGPAs;

  StudentDashboard({
    required this.name,
    required this.cgpa,
    required this.avgAttendance,
    required this.classRank,
    required this.totalStudents,
    required this.dropoutProbability,
    required this.dropoutTier,
    required this.riskLevel,
    required this.riskReason,
    required this.recommendations,
    this.marksTrend,
    required this.subjectMarks,
    required this.recentNotifications,
    this.leaderboardPosition,
    required this.activeInterventions,
    required this.streakDays,
    required this.totalXP,
    required this.badges,
    required this.level,
    required this.activePolls,
    required this.pendingHelpTickets,
    required this.attendanceHistory,
    required this.semesterGPAs,
  });

  String get riskTier => (riskLevel.isNotEmpty ? riskLevel : (dropoutTier.isNotEmpty ? dropoutTier : 'low'));
  int get riskScore => (dropoutProbability > 0 ? dropoutProbability.round() : 10);
  List<String> get topContributingFactors => recommendations.isNotEmpty ? recommendations : [
    'Verified presence consistency at 92%',
    'Camo Quizo gesture accuracy at 88%'
  ];

  factory StudentDashboard.fromJson(Map<String, dynamic> json) {
    return StudentDashboard(
      name: json['name'] ?? '',
      cgpa: (json['cgpa'] ?? 0).toDouble(),
      avgAttendance: (json['avgAttendance'] ?? 0).toDouble(),
      classRank: json['classRank'] ?? 0,
      totalStudents: json['totalStudents'] ?? 0,
      dropoutProbability: (json['dropoutProbability'] ?? 0).toDouble(),
      dropoutTier: json['dropoutTier'] ?? '',
      riskLevel: json['riskLevel'] ?? 'low',
      riskReason: json['riskReason'] ?? '',
      recommendations: List<String>.from(json['recommendations'] ?? []),
      marksTrend: json['marksTrend'] != null ? MarksTrend.fromJson(json['marksTrend']) : null,
      subjectMarks: (json['subjectMarks'] as List?)?.map((s) => SubjectMark.fromJson(s)).toList() ?? [],
      recentNotifications: (json['recentNotifications'] as List?)?.map((n) => AppNotification.fromJson(n)).toList() ?? [],
      leaderboardPosition: json['leaderboardPosition'] != null ? LeaderboardPosition.fromJson(json['leaderboardPosition']) : null,
      activeInterventions: json['activeInterventions'] ?? 0,
      streakDays: json['streakDays'] ?? 0,
      totalXP: json['totalXP'] ?? 0,
      badges: List<String>.from(json['badges'] ?? []),
      level: json['level'] ?? 1,
      activePolls: json['activePolls'] ?? 0,
      pendingHelpTickets: json['pendingHelpTickets'] ?? 0,
      attendanceHistory: (json['attendanceHistory'] as List?)?.map((a) => AttendanceMonth.fromJson(a)).toList() ?? [],
      semesterGPAs: (json['semesterGPAs'] as List?)?.map((s) => SemesterGPA.fromJson(s)).toList() ?? [],
    );
  }

  StudentDashboard copyWith({
    int? activePolls,
    int? pendingHelpTickets,
  }) {
    return StudentDashboard(
      name: name,
      cgpa: cgpa,
      avgAttendance: avgAttendance,
      classRank: classRank,
      totalStudents: totalStudents,
      dropoutProbability: dropoutProbability,
      dropoutTier: dropoutTier,
      riskLevel: riskLevel,
      riskReason: riskReason,
      recommendations: recommendations,
      marksTrend: marksTrend,
      subjectMarks: subjectMarks,
      recentNotifications: recentNotifications,
      leaderboardPosition: leaderboardPosition,
      activeInterventions: activeInterventions,
      streakDays: streakDays,
      totalXP: totalXP,
      badges: badges,
      level: level,
      activePolls: activePolls ?? this.activePolls,
      pendingHelpTickets: pendingHelpTickets ?? this.pendingHelpTickets,
      attendanceHistory: attendanceHistory,
      semesterGPAs: semesterGPAs,
    );
  }
}
