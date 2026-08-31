import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/user.dart';
import '../services/auth_service.dart';
import '../services/api_service.dart';
import '../services/socket_service.dart';
import '../utils/socket_namespace.dart';

class AuthState {
  final User? user;
  final String? accessToken;
  final bool isAuthenticated;
  final bool isLoading;
  final String? error;

  const AuthState({
    this.user,
    this.accessToken,
    this.isAuthenticated = false,
    this.isLoading = false,
    this.error,
  });

  AuthState copyWith({
    User? user,
    String? accessToken,
    bool? isAuthenticated,
    bool? isLoading,
    String? error,
  }) {
    return AuthState(
      user: user ?? this.user,
      accessToken: accessToken ?? this.accessToken,
      isAuthenticated: isAuthenticated ?? this.isAuthenticated,
      isLoading: isLoading ?? this.isLoading,
      error: error,
    );
  }
}

class AuthNotifier extends StateNotifier<AuthState> {
  final AuthService _authService = AuthService();

  AuthNotifier() : super(const AuthState());

  Future<bool> login(String email, String password, String expectedRole) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final data = await _authService.login(email, password);
      final user = User.fromJson(data['user']);

      if (user.role != expectedRole) {
        state = state.copyWith(
          isLoading: false,
          error: 'Account is registered as "${user.role}", not "$expectedRole".',
        );
        return false;
      }

      state = AuthState(
        user: user,
        accessToken: data['accessToken'],
        isAuthenticated: true,
        isLoading: false,
      );

      SocketService().connect(
        namespace: socketNamespaceForRole(user.role),
        userId: user.id,
      );

      return true;
    } catch (e) {
      String errorMsg = 'Login failed';
      if (e.toString().contains('SocketException') || e.toString().contains('Connection refused')) {
        errorMsg = 'Network Error. Server might be starting — please try again.';
      } else if (e.toString().contains('401')) {
        errorMsg = 'Invalid email or password';
      }
      state = state.copyWith(isLoading: false, error: errorMsg);
      return false;
    }
  }

  Future<void> logout() async {
    SocketService().disconnectAll();
    await _authService.logout();
    state = const AuthState();
  }

  Future<void> refreshUser() async {
    try {
      final data = await _authService.getMe();
      final user = User.fromJson(data['user']);
      state = state.copyWith(user: user);
    } catch (_) {}
  }

  Future<void> checkAuth() async {
    final token = await ApiService().getToken();
    if (token == null) {
      state = const AuthState();
      return;
    }

    state = state.copyWith(isLoading: true);
    try {
      final data = await _authService.getMe();
      final user = User.fromJson(data['user']);
      state = AuthState(
        user: user,
        accessToken: token,
        isAuthenticated: true,
      );

      SocketService().connect(
        namespace: socketNamespaceForRole(user.role),
        userId: user.id,
      );
    } catch (_) {
      await ApiService().clearToken();
      state = const AuthState();
    }
  }

  void updateUser(User user) {
    state = state.copyWith(user: user);
  }
}

final authProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  return AuthNotifier();
});

final themeProvider = StateNotifierProvider<ThemeNotifier, ThemeMode>((ref) {
  return ThemeNotifier();
});

class ThemeNotifier extends StateNotifier<ThemeMode> {
  ThemeNotifier() : super(ThemeMode.light);

  void toggleTheme() {
    state = state == ThemeMode.light ? ThemeMode.dark : ThemeMode.light;
  }

  void setTheme(ThemeMode mode) {
    state = mode;
  }
}
