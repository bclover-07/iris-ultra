import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../providers/auth_provider.dart';
import '../screens/auth/login_screen.dart';
import '../screens/auth/register_screen.dart';
import '../screens/landing/landing_screen.dart';
import '../screens/student/student_layout.dart';
import '../screens/student/dashboard_screen.dart';
import '../screens/student/ultra_study_screen.dart';
import '../screens/student/virtual_beyond_screen.dart';
import '../screens/student/world_screen.dart';
import '../screens/student/focus_guardian_screen.dart';
import '../screens/student/career_simulator_screen.dart';
import '../screens/student/chatbot_screen.dart';
import '../screens/student/doubt_solver_screen.dart';
import '../screens/student/interview_screen.dart';
import '../screens/student/debate_screen.dart';
import '../screens/student/study_plan_screen.dart';
import '../screens/student/quiz_screen.dart';
import '../screens/student/notes_screen.dart';
import '../screens/student/overcome_screen.dart';
import '../screens/student/polls_screen.dart';
import '../screens/student/help_desk_screen.dart';
import '../screens/student/leaderboard_screen.dart';
import '../screens/student/profile_screen.dart';
import '../screens/student/social_screen.dart';
import '../screens/student/ai_avatar_screen.dart';
import '../screens/student/ultra_keeper_screen.dart';
import '../screens/student/student_interventions_screen.dart';
import '../screens/student/debate_setup_screen.dart';
import '../screens/student/debate_session_screen.dart';
import '../screens/student/interview_setup_screen.dart';
import '../screens/student/interview_session_screen.dart';
import '../screens/student/quiz_camo_screen.dart';
import '../screens/student/quiz_standard_screen.dart';
import '../screens/teacher/teacher_layout.dart';
import '../screens/teacher/teacher_dashboard_screen.dart';
import '../screens/teacher/effectiveness_screen.dart';
import '../screens/teacher/teacher_profile_screen.dart';
import '../screens/teacher/social_desk_screen.dart';
import '../screens/teacher/student_detail_screen.dart';
import '../screens/teacher/ai_insights_screen.dart';
import '../screens/teacher/assessments_screen.dart';
import '../screens/teacher/behavior_analyzer_screen.dart';
import '../screens/teacher/ai_content_screen.dart';
import '../screens/teacher/teacher_interventions_screen.dart';
import '../screens/teacher/reports_screen.dart';
import '../screens/teacher/students_list_screen.dart';
import '../screens/admin/admin_layout.dart';
import '../screens/admin/admin_dashboard_screen.dart';
import '../screens/admin/dropout_warning_screen.dart';
import '../screens/admin/resource_optimizer_screen.dart';
import '../screens/admin/analytics_screen.dart';
import '../screens/admin/bulk_import_screen.dart';
import '../screens/admin/curriculum_screen.dart';
import '../screens/admin/faculty_screen.dart';
import '../screens/admin/admin_reports_screen.dart';
import '../screens/admin/system_screen.dart';
import '../screens/admin/users_screen.dart';
import '../screens/admin/admin_interventions_screen.dart';
import '../screens/admin/admin_settings_screen.dart';
import '../screens/admin/admin_chatbot_screen.dart';

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
      if (isLoggedIn && (state.matchedLocation == '/login' || state.matchedLocation == '/register' || state.matchedLocation == '/')) {
        final role = auth.user?.role ?? 'student';
        return '/$role';
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
              GoRoute(path: 'quiz', builder: (_, __) => const QuizScreen()),
              GoRoute(path: 'study-plan', builder: (_, __) => const StudyPlanScreen()),
              GoRoute(path: 'chatbot', builder: (_, __) => const ChatbotScreen()),
              GoRoute(path: 'doubt-solver', builder: (_, __) => const DoubtSolverScreen()),
              GoRoute(path: 'focus-guardian', builder: (_, __) => const FocusGuardianScreen()),
              GoRoute(path: 'career-simulator', builder: (_, __) => const CareerSimulatorScreen()),
              GoRoute(path: 'polls', builder: (_, __) => const PollsScreen()),
              GoRoute(path: 'help-desk', builder: (_, __) => const HelpDeskScreen()),
              GoRoute(path: 'leaderboard', builder: (_, __) => const LeaderboardScreen()),
              GoRoute(path: 'profile', builder: (_, __) => const ProfileScreen()),
              GoRoute(path: 'notes', builder: (_, __) => const NotesScreen()),
              GoRoute(path: 'overcome', builder: (_, __) => const OvercomeScreen()),
              GoRoute(path: 'ultra-study', builder: (_, __) => const UltraStudyScreen()),
              GoRoute(path: 'virtual-beyond', builder: (_, __) => const VirtualBeyondScreen()),
              GoRoute(path: 'world', builder: (_, __) => const WorldScreen()),
              GoRoute(path: 'social', builder: (_, __) => const SocialScreen()),
              GoRoute(path: 'interview', builder: (_, __) => const InterviewScreen()),
              GoRoute(path: 'debate', builder: (_, __) => const DebateScreen()),
              GoRoute(path: 'ai-avatar', builder: (_, __) => const AiAvatarScreen()),
              GoRoute(path: 'ultra-keeper', builder: (_, __) => const UltraKeeperScreen()),
              GoRoute(path: 'interventions', builder: (_, __) => const StudentInterventionsScreen()),
              GoRoute(path: 'debate/setup', builder: (_, __) => const DebateSetupScreen()),
              GoRoute(
                path: 'debate/session',
                builder: (context, state) {
                  final extra = state.extra as Map<String, dynamic>? ?? {};
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
                  company: state.uri.queryParameters['company'] ?? 'Unknown',
                ),
              ),
              GoRoute(
                path: 'interview/session',
                builder: (context, state) {
                  final extra = state.extra as Map<String, dynamic>? ?? {};
                  return InterviewSessionScreen(
                    sessionId: extra['sessionId'] ?? '',
                    company: extra['company'] ?? 'Unknown',
                    role: extra['role'] ?? 'Software Engineer',
                  );
                },
              ),
              GoRoute(path: 'quiz/camo', builder: (_, __) => const QuizCamoScreen()),
              GoRoute(path: 'quiz/standard', builder: (_, __) => const QuizStandardScreen()),
            ],
          ),
        ],
      ),
      ShellRoute(
        builder: (context, state, child) => TeacherLayout(child: child),
        routes: [
          GoRoute(
            path: '/teacher',
            builder: (context, state) => const TeacherDashboardScreen(),
            routes: [
              GoRoute(path: 'ai-insights', builder: (_, __) => const AiInsightsScreen()),
              GoRoute(path: 'students', builder: (_, __) => const StudentsListScreen()),
              GoRoute(path: 'assessments', builder: (_, __) => const AssessmentsScreen()),
              GoRoute(path: 'behavior-analyzer', builder: (_, __) => const BehaviorAnalyzerScreen()),
              GoRoute(path: 'ai-content', builder: (_, __) => const AiContentScreen()),
              GoRoute(path: 'interventions', builder: (_, __) => const TeacherInterventionsScreen()),
              GoRoute(path: 'reports', builder: (_, __) => const ReportsScreen()),
              GoRoute(path: 'effectiveness', builder: (_, __) => const EffectivenessScreen()),
              GoRoute(path: 'profile', builder: (_, __) => const TeacherProfileScreen()),
              GoRoute(path: 'social-desk', builder: (_, __) => const SocialDeskScreen()),
              GoRoute(path: 'students/:id', builder: (context, state) => StudentDetailScreen(id: state.pathParameters['id']!)),
            ],
          ),
        ],
      ),
      ShellRoute(
        builder: (context, state, child) => AdminLayout(child: child),
        routes: [
          GoRoute(
            path: '/admin',
            builder: (context, state) => const AdminDashboardScreen(),
            routes: [
              GoRoute(path: 'dropout-warning', builder: (_, __) => const DropoutWarningScreen()),
              GoRoute(path: 'resource-optimizer', builder: (_, __) => const ResourceOptimizerScreen()),
              GoRoute(path: 'ai-chatbot', builder: (_, __) => const AdminChatbotScreen()),
              GoRoute(path: 'settings', builder: (_, __) => const AdminSettingsScreen()),
              GoRoute(path: 'analytics', builder: (_, __) => const AnalyticsScreen()),
              GoRoute(path: 'bulk-import', builder: (_, __) => const BulkImportScreen()),
              GoRoute(path: 'curriculum', builder: (_, __) => const CurriculumScreen()),
              GoRoute(path: 'faculty', builder: (_, __) => const FacultyScreen()),
              GoRoute(path: 'reports', builder: (_, __) => const AdminReportsScreen()),
              GoRoute(path: 'interventions', builder: (_, __) => const AdminInterventionsScreen()),
              GoRoute(path: 'system', builder: (_, __) => const SystemScreen()),
              GoRoute(path: 'users', builder: (_, __) => const UsersScreen()),
            ],
          ),
        ],
      ),
    ],
  );
}
