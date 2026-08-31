import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../providers/auth_provider.dart';
import '../../theme/marketing_widgets.dart';

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  String _selectedRole = 'student';

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  void _handleLogin() async {
    final success = await ref.read(authProvider.notifier).login(
      _emailController.text,
      _passwordController.text,
      _selectedRole,
    );

    if (success && mounted) {
      if (_selectedRole == 'admin') {
        context.go('/admin');
      } else if (_selectedRole == 'teacher') {
        context.go('/teacher');
      } else {
        context.go('/student');
      }
    }
  }

  void _loadDemo(String role, String email, String password) {
    setState(() {
      _selectedRole = role;
      _emailController.text = email;
      _passwordController.text = password;
    });
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authProvider);

    return Scaffold(
      body: PolkaDotBackground(
        child: SafeArea(
          child: SingleChildScrollView(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 32),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Container(
                        width: 32,
                        height: 32,
                        decoration: BoxDecoration(
                          gradient: const LinearGradient(
                            colors: [MarketingColors.purple, MarketingColors.purpleDark],
                          ),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: const Icon(Icons.psychology, color: Colors.white, size: 20),
                      ),
                      const SizedBox(width: 8),
                      Text(
                        'SENSEI',
                        style: GoogleFonts.cinzel(
                          fontWeight: FontWeight.w900,
                          fontSize: 18,
                          letterSpacing: 2,
                          color: MarketingColors.navy,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 40),

                  Text(
                    'Welcome Back',
                    style: GoogleFonts.raleway(
                      fontSize: 32,
                      fontWeight: FontWeight.w900,
                      color: MarketingColors.navy,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Select your persona to continue.',
                    style: GoogleFonts.raleway(
                      fontSize: 16,
                      color: Colors.grey.shade600,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                  const SizedBox(height: 32),

                  // Roles via Sticky Notes
                  SizedBox(
                    height: 120,
                    child: ListView(
                      scrollDirection: Axis.horizontal,
                      children: [
                        _buildRoleNote('student', 'STUDENT', MarketingColors.noteLavender, -2),
                        const SizedBox(width: 16),
                        _buildRoleNote('teacher', 'FACULTY', MarketingColors.noteBlue, 1.5),
                        const SizedBox(width: 16),
                        _buildRoleNote('admin', 'ADMIN', MarketingColors.noteGreen, -1),
                      ],
                    ),
                  ),
                  const SizedBox(height: 40),

                  // Login Form
                  Container(
                    padding: const EdgeInsets.all(24),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(24),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withValues(alpha: 0.05),
                          blurRadius: 20,
                          offset: const Offset(0, 10),
                        )
                      ],
                    ),
                    child: Column(
                      children: [
                        TextField(
                          controller: _emailController,
                          decoration: InputDecoration(
                            labelText: 'Email Address',
                            labelStyle: GoogleFonts.raleway(fontWeight: FontWeight.bold),
                            filled: true,
                            fillColor: MarketingColors.bgPage,
                            border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(12),
                              borderSide: BorderSide.none,
                            ),
                          ),
                        ),
                        const SizedBox(height: 16),
                        TextField(
                          controller: _passwordController,
                          obscureText: true,
                          decoration: InputDecoration(
                            labelText: 'Password',
                            labelStyle: GoogleFonts.raleway(fontWeight: FontWeight.bold),
                            filled: true,
                            fillColor: MarketingColors.bgPage,
                            border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(12),
                              borderSide: BorderSide.none,
                            ),
                          ),
                        ),
                        const SizedBox(height: 24),
                        SizedBox(
                          width: double.infinity,
                          child: MarketingButton(
                            label: authState.isLoading ? 'SIGNING IN...' : 'SIGN IN',
                            onTap: authState.isLoading ? () {} : _handleLogin,
                          ),
                        ),
                        if (authState.error != null) ...[
                          const SizedBox(height: 16),
                          Text(
                            authState.error!,
                            style: GoogleFonts.raleway(color: Colors.red, fontWeight: FontWeight.bold),
                            textAlign: TextAlign.center,
                          ),
                        ],
                      ],
                    ),
                  ),

                  const SizedBox(height: 40),
                  Text(
                    'Demo Quick Access:',
                    style: GoogleFonts.raleway(fontWeight: FontWeight.bold, color: Colors.grey),
                  ),
                  const SizedBox(height: 12),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: [
                      _buildDemoBtn('Student', 'aarav.sharma.cse@sensei.edu', 'student123', 'student'),
                      _buildDemoBtn('Faculty', 'teacher.cse@sensei.edu', 'teacher123', 'teacher'),
                      _buildDemoBtn('Admin', 'shivam77@gmail.com', '9082249120', 'admin'),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildRoleNote(String id, String label, Color color, double rotation) {
    final isSelected = _selectedRole == id;
    return GestureDetector(
      onTap: () => setState(() => _selectedRole = id),
      child: AnimatedScale(
        scale: isSelected ? 1.05 : 1.0,
        duration: const Duration(milliseconds: 200),
        child: Opacity(
          opacity: isSelected ? 1.0 : 0.6,
          child: StickyNote(
            color: color,
            rotateDegrees: rotation,
            width: 110,
            child: Center(
              child: Text(
                label,
                style: GoogleFonts.raleway(
                  fontWeight: FontWeight.w900,
                  fontSize: 14,
                  color: MarketingColors.navy,
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildDemoBtn(String label, String email, String password, String role) {
    return ActionChip(
      label: Text(label, style: GoogleFonts.raleway(fontWeight: FontWeight.bold)),
      backgroundColor: MarketingColors.bgPage,
      onPressed: () => _loadDemo(role, email, password),
    );
  }
}
