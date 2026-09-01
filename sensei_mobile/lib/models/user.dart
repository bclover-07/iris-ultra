class User {
  final String id;
  final String name;
  final String email;
  final String role;
  final String? avatar;
  final int xp;
  final String debateRank;
  final Map<String, dynamic>? profile;

  User({
    required this.id,
    required this.name,
    required this.email,
    this.role = 'student',
    this.avatar,
    this.xp = 0,
    this.debateRank = 'Unranked',
    this.profile,
  });

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['_id'] ?? json['id'] ?? '',
      name: json['name'] ?? '',
      email: json['email'] ?? '',
      role: json['role'] ?? 'student',
      avatar: json['avatar'],
      xp: json['xp'] ?? 0,
      debateRank: json['debateRank'] ?? 'Unranked',
      profile: json['profile'],
    );
  }

  Map<String, dynamic> toJson() => {
    '_id': id,
    'name': name,
    'email': email,
    'role': role,
    'avatar': avatar,
    'xp': xp,
    'debateRank': debateRank,
  };

  User copyWith({
    String? name,
    String? email,
    String? avatar,
    int? xp,
    String? debateRank,
    Map<String, dynamic>? profile,
  }) {
    return User(
      id: id,
      name: name ?? this.name,
      email: email ?? this.email,
      role: role,
      avatar: avatar ?? this.avatar,
      xp: xp ?? this.xp,
      debateRank: debateRank ?? this.debateRank,
      profile: profile ?? this.profile,
    );
  }
}
