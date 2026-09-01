import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../providers/auth_provider.dart';
import '../screens/auth/login_screen.dart';
import '../screens/auth/register_screen.dart';
import '../screens/landing/landing_screen.dart';
import '../screens/student/student_layout.dart';
import '../screens/student/dashboard_screen.dart';
import '../screens/student/world_screen.dart';
import '../screens/student/focus_guardian_screen.dart';
import '../screens/student/career_simulator_screen.dart';
import '../screens/student/doubt_solver_screen.dart';
import '../screens/student/interview_screen.dart';
import '../screens/student/debate_screen.dart';
import '../screens/student/study_plan_screen.dart';
import '../screens/student/leaderboard_screen.dart';
import '../screens/student/profile_screen.dart';
import '../screens/student/social_screen.dart';
import '../screens/student/debate_setup_screen.dart';
import '../screens/student/debate_session_screen.dart';
import '../screens/student/interview_setup_screen.dart';
import '../screens/student/interview_session_screen.dart';
import '../screens/student/quiz_camo_screen.dart';
import '../screens/student/mentor_screen.dart';
import '../screens/student/npu_console_screen.dart';
import '../screens/student/practice_area_screen.dart';
import '../screens/student/voice_journal_screen.dart';

final _rootNavigatorKey = GlobalKey<NavigatorState>();
final _studentShellKey = GlobalKey<NavigatorState>();

GoRouter createRouter(WidgetRef ref) {
  return GoRouter(
    navigatorKey: _rootNavigatorKey,
    initialLocation: '/',
    redirect: (context, state) {
      final auth = ref.read(authProvider);
      final isLoggedIn = auth.isAuthenticated;
      final isPublicRoute = state.matchedLocation == '/login' ||
          state.matchedLocation == '/register' ||
          state.matchedLocation == '/';

      if (!isLoggedIn && !isPublicRoute) return '/login';
      if (isLoggedIn &&
          (state.matchedLocation == '/login' ||
              state.matchedLocation == '/register' ||
              state.matchedLocation == '/')) {
        return '/student';
      }
      return null;
    },
    routes: [
      GoRoute(
        path: '/',
        builder: (context, state) => const LandingScreen(),
      ),
      GoRoute(
        path: '/login',
        builder: (context, state) => const LoginScreen(),
      ),
      GoRoute(
        path: '/register',
        builder: (context, state) => const RegisterScreen(),
      ),
      ShellRoute(
        navigatorKey: _studentShellKey,
        builder: (context, state, child) => StudentLayout(child: child),
        routes: [
          GoRoute(
            path: '/student',
            builder: (context, state) => const DashboardScreen(),
            routes: [
              GoRoute(
                  path: 'mentor',
                  builder: (_, __) => const MentorScreen()),
              GoRoute(
                  path: 'study-plan',
                  builder: (_, __) => const StudyPlanScreen()),
              GoRoute(
                  path: 'doubt-solver',
                  builder: (_, __) => const DoubtSolverScreen()),
              GoRoute(
                  path: 'focus-guardian',
                  builder: (_, __) => const FocusGuardianScreen()),
              GoRoute(
                  path: 'career-simulator',
                  builder: (_, __) => const CareerSimulatorScreen()),
              GoRoute(
                  path: 'leaderboard',
                  builder: (_, __) => const LeaderboardScreen()),
              GoRoute(
                  path: 'profile',
                  builder: (_, __) => const ProfileScreen()),
              GoRoute(
                  path: 'world',
                  builder: (_, __) => const WorldScreen()),
              GoRoute(
                  path: 'social',
                  builder: (_, __) => const SocialScreen()),
              GoRoute(
                  path: 'interview',
                  builder: (_, __) => const InterviewScreen()),
              GoRoute(
                  path: 'debate',
                  builder: (_, __) => const DebateScreen()),
              GoRoute(
                  path: 'npu-console',
                  builder: (_, __) => const NpuConsoleScreen()),
              GoRoute(
                  path: 'practice-area',
                  builder: (_, __) => const PracticeAreaScreen()),
              GoRoute(
                  path: 'voice-journal',
                  builder: (_, __) => const VoiceJournalScreen()),
              GoRoute(
                  path: 'quiz/camo',
                  builder: (_, __) => const QuizCamoScreen()),
              GoRoute(
                path: 'debate/setup',
                builder: (_, __) => const DebateSetupScreen(),
              ),
              GoRoute(
                path: 'debate/session',
                builder: (context, state) {
                  final extra =
                      state.extra as Map<String, dynamic>? ?? {};
                  return DebateSessionScreen(
                    sessionId: extra['sessionId'] ?? '',
                    topic: extra['topic'] ?? 'Unknown',
                    aiPersonality: extra['aiPersonality'] ?? 'Unknown',
                  );
                },
              ),
              GoRoute(
                path: 'interview/setup',
                builder: (context, state) => InterviewSetupScreen(
                  company:
                      state.uri.queryParameters['company'] ?? 'Unknown',
                ),
              ),
              GoRoute(
                path: 'interview/session',
                builder: (context, state) {
                  final extra =
                      state.extra as Map<String, dynamic>? ?? {};
                  return InterviewSessionScreen(
                    sessionId: extra['sessionId'] ?? '',
                    company: extra['company'] ?? 'Unknown',
                    role: extra['role'] ?? 'Software Engineer',
                  );
                },
              ),
            ],
          ),
        ],
      ),
    ],
  );
}
