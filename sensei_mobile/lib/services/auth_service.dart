import '../services/api_service.dart';

class AuthService {
  final ApiService _api = ApiService();

  Future<Map<String, dynamic>> login(String email, String password) async {
    final response = await _api.post('/api/auth/login', data: {
      'email': email,
      'password': password,
    });
    final data = response.data;
    if (data['accessToken'] != null) {
      await _api.setToken(data['accessToken']);
    }
    if (data['refreshToken'] != null) {
      await _api.setRefreshToken(data['refreshToken']);
    }
    return data;
  }

  Future<Map<String, dynamic>> register({
    required String name,
    required String email,
    required String password,
    required String role,
    String? department,
    String? studentId,
    int? semester,
    List<String>? subjects,
  }) async {
    final response = await _api.post('/api/auth/register', data: {
      'name': name,
      'email': email,
      'password': password,
      'role': role,
      if (department != null) 'department': department,
      if (studentId != null) 'studentId': studentId,
      if (semester != null) 'semester': semester,
      if (subjects != null) 'subjects': subjects,
    });
    return response.data;
  }

  Future<void> logout() async {
    try {
      await _api.post('/api/auth/logout');
    } catch (_) {}
    await _api.clearToken();
  }

  Future<Map<String, dynamic>> getMe() async {
    final response = await _api.get('/api/auth/me');
    return response.data;
  }

  Future<void> changePassword(String currentPassword, String newPassword) async {
    await _api.post('/api/auth/change-password', data: {
      'currentPassword': currentPassword,
      'newPassword': newPassword,
    });
  }

  Future<void> forgotPassword(String email) async {
    await _api.post('/api/auth/forgot-password', data: {'email': email});
  }

  Future<void> resetPassword(String token, String newPassword) async {
    await _api.post('/api/auth/reset-password/$token', data: {
      'newPassword': newPassword,
    });
  }

  Future<List<String>> getDepartments() async {
    final response = await _api.get('/api/auth/departments');
    return List<String>.from(response.data['departments'] ?? []);
  }
}
