import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../providers/auth_provider.dart';
import '../../theme/app_colors.dart';
import '../../theme/neubrutalist_widgets.dart';

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final _emailController = TextEditingController(text: 'alex.rivera@sensei.ai');
  final _passwordController = TextEditingController(text: 'password123');

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  void _handleLogin() async {
    final success = await ref.read(authProvider.notifier).login(
      _emailController.text.trim(),
      _passwordController.text,
    );

    if (success && mounted) {
      context.go('/student');
    }
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authProvider);

    return Scaffold(
      backgroundColor: AppColors.creamBg,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Top Back / Brand
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  GestureDetector(
                    onTap: () => context.go('/'),
                    child: Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(color: AppColors.brutalBlack, width: 2),
                        boxShadow: const [
                          BoxShadow(color: AppColors.brutalBlack, offset: Offset(2, 2), blurRadius: 0),
                        ],
                      ),
                      child: const Icon(Icons.arrow_back_rounded, color: AppColors.brutalBlack, size: 20),
                    ),
                  ),
                  NeuBadge(
                    label: 'STUDENT PORTAL',
                    backgroundColor: AppColors.popYellow,
                  ),
                ],
              ),
              const SizedBox(height: 28),

              // Title Card
              NeuCard(
                backgroundColor: Colors.white,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Welcome Back! ⚡',
                      style: GoogleFonts.fredoka(
                        fontSize: 26,
                        fontWeight: FontWeight.bold,
                        color: AppColors.brutalBlack,
                      ),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      'Sign in to access your verified 5-signal radar, on-device Gemma mentor, and multiplayer 3D campus.',
                      style: GoogleFonts.inter(
                        fontSize: 13,
                        color: Colors.black54,
                        height: 1.4,
                      ),
                    ),
                    const SizedBox(height: 24),

                    // Email Field
                    Text(
                      'STUDENT EMAIL',
                      style: GoogleFonts.fredoka(
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                        color: AppColors.brutalBlack,
                        letterSpacing: 1,
                      ),
                    ),
                    const SizedBox(height: 6),
                    Container(
                      decoration: BoxDecoration(
                        color: AppColors.creamBg,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: AppColors.brutalBlack, width: 2),
                      ),
                      padding: const EdgeInsets.symmetric(horizontal: 14),
                      child: TextField(
                        controller: _emailController,
                        style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w600),
                        decoration: const InputDecoration(
                          border: InputBorder.none,
                          hintText: 'student@sensei.ai',
                        ),
                      ),
                    ),
                    const SizedBox(height: 16),

                    // Password Field
                    Text(
                      'PASSWORD',
                      style: GoogleFonts.fredoka(
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                        color: AppColors.brutalBlack,
                        letterSpacing: 1,
                      ),
                    ),
                    const SizedBox(height: 6),
                    Container(
                      decoration: BoxDecoration(
                        color: AppColors.creamBg,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: AppColors.brutalBlack, width: 2),
                      ),
                      padding: const EdgeInsets.symmetric(horizontal: 14),
                      child: TextField(
                        controller: _passwordController,
                        obscureText: true,
                        style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w600),
                        decoration: const InputDecoration(
                          border: InputBorder.none,
                          hintText: '••••••••',
                        ),
                      ),
                    ),
                    const SizedBox(height: 24),

                    if (authState.error != null) ...[
                      Container(
                        padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(
                          color: AppColors.popCoral.withValues(alpha: 0.15),
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(color: AppColors.popCoral, width: 1.5),
                        ),
                        child: Row(
                          children: [
                            const Icon(Icons.error_outline_rounded, color: AppColors.popCoral, size: 18),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Text(
                                authState.error!,
                                style: GoogleFonts.inter(fontSize: 12, color: AppColors.popCoral, fontWeight: FontWeight.bold),
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 16),
                    ],

                    NeuButton(
                      text: authState.isLoading ? 'SIGNING IN...' : 'LOGIN TO SENSEI 🚀',
                      backgroundColor: AppColors.popYellow,
                      isLoading: authState.isLoading,
                      onPressed: authState.isLoading ? null : _handleLogin,
                    ),
                    const SizedBox(height: 12),

                    Center(
                      child: GestureDetector(
                        onTap: () => context.go('/register'),
                        child: Text(
                          "Don't have an account? Create one",
                          style: GoogleFonts.inter(
                            fontSize: 13,
                            fontWeight: FontWeight.bold,
                            color: AppColors.brutalBlack,
                            decoration: TextDecoration.underline,
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 20),

              const SizedBox(height: 16),

              // 1-Click Mock Demo Login Account Card
              NeuCard(
                backgroundColor: AppColors.popYellow,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        const Icon(Icons.stars_rounded, color: AppColors.brutalBlack, size: 20),
                        const SizedBox(width: 6),
                        Text(
                          '1-CLICK MOCK DEMO ACCOUNT',
                          style: GoogleFonts.fredoka(fontSize: 13, fontWeight: FontWeight.bold, color: AppColors.brutalBlack, letterSpacing: 1),
                        ),
                      ],
                    ),
                    const SizedBox(height: 6),
                    Text(
                      'Bypass login and enter student portal instantly with pre-loaded mock student signals & NPU status.',
                      style: GoogleFonts.inter(fontSize: 11, color: Colors.black87),
                    ),
                    const SizedBox(height: 12),
                    NeuButton(
                      text: '⚡ ENTER DEMO PORTAL INSTANTLY',
                      backgroundColor: Colors.white,
                      onPressed: () async {
                        await ref.read(authProvider.notifier).mockLogin(
                          name: 'Shreshta Junjuru',
                          email: 'priya.patel.it@sensei.edu',
                        );
                        if (mounted) context.go('/student');
                      },
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
