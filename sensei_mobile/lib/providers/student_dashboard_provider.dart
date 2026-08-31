import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/student_dashboard.dart';
import '../services/api_service.dart';

class StudentDashboardState {
  final StudentDashboard? data;
  final bool isLoading;
  final String? error;

  const StudentDashboardState({
    this.data,
    this.isLoading = false,
    this.error,
  });

  StudentDashboardState copyWith({
    StudentDashboard? data,
    bool? isLoading,
    String? error,
  }) {
    return StudentDashboardState(
      data: data ?? this.data,
      isLoading: isLoading ?? this.isLoading,
      error: error,
    );
  }
}

class StudentDashboardNotifier extends StateNotifier<StudentDashboardState> {
  final ApiService _api = ApiService();

  StudentDashboardNotifier() : super(const StudentDashboardState());

  Future<void> fetchDashboard() async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final response = await _api.get('/api/student/dashboard');
      final dashboard = StudentDashboard.fromJson(response.data);
      state = StudentDashboardState(data: dashboard);
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: 'Failed to load dashboard',
      );
    }
  }

  void updatePolls(int delta) {
    if (state.data != null) {
      final current = state.data!.activePolls + delta;
      state = state.copyWith(
        data: state.data!.copyWith(activePolls: current.clamp(0, 999)),
      );
    }
  }

  void updateHelpTickets(int delta) {
    if (state.data != null) {
      final current = state.data!.pendingHelpTickets + delta;
      state = state.copyWith(
        data: state.data!.copyWith(pendingHelpTickets: current.clamp(0, 999)),
      );
    }
  }
}

final studentDashboardProvider =
    StateNotifierProvider<StudentDashboardNotifier, StudentDashboardState>((ref) {
  return StudentDashboardNotifier();
});
