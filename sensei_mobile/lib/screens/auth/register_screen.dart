import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../services/auth_service.dart';
import '../../theme/app_colors.dart';
import '../../theme/neubrutalist_widgets.dart';

class RegisterScreen extends StatefulWidget {
  const RegisterScreen({super.key});

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _deptController = TextEditingController(text: 'Computer Science');
  bool _isLoading = false;
  String? _error;

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    _deptController.dispose();
    super.dispose();
  }

  Future<void> _handleRegister() async {
    if (_nameController.text.trim().isEmpty ||
        _emailController.text.trim().isEmpty ||
        _passwordController.text.isEmpty) {
      setState(() => _error = 'Please fill in all required fields.');
      return;
    }

    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      await AuthService().register(
        name: _nameController.text.trim(),
        email: _emailController.text.trim(),
        password: _passwordController.text,
        department: _deptController.text.trim(),
        role: 'student',
      );
      if (mounted) {
        context.go('/login');
      }
    } catch (e) {
      if (mounted) {
        setState(() => _error = 'Registration failed. Please try a different email.');
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
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
                    onTap: () => context.go('/login'),
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
                    label: 'NEW STUDENT REGISTRATION',
                    backgroundColor: AppColors.popPink,
                    textColor: Colors.white,
                  ),
                ],
              ),
              const SizedBox(height: 28),

              // Form Card
              NeuCard(
                backgroundColor: Colors.white,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Join SENSEI Ultra 🎓',
                      style: GoogleFonts.fredoka(
                        fontSize: 26,
                        fontWeight: FontWeight.bold,
                        color: AppColors.brutalBlack,
                      ),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      'Set up your student profile and connect your on-device NPU hardware.',
                      style: GoogleFonts.inter(
                        fontSize: 13,
                        color: Colors.black54,
                        height: 1.4,
                      ),
                    ),
                    const SizedBox(height: 20),

                    // Full Name
                    Text(
                      'FULL NAME',
                      style: GoogleFonts.fredoka(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.brutalBlack, letterSpacing: 1),
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
                        controller: _nameController,
                        style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w600),
                        decoration: const InputDecoration(border: InputBorder.none, hintText: 'e.g. Alex Rivera'),
                      ),
                    ),
                    const SizedBox(height: 14),

                    // Email
                    Text(
                      'STUDENT EMAIL',
                      style: GoogleFonts.fredoka(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.brutalBlack, letterSpacing: 1),
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
                        decoration: const InputDecoration(border: InputBorder.none, hintText: 'alex@student.univ.edu'),
                      ),
                    ),
                    const SizedBox(height: 14),

                    // Department
                    Text(
                      'DEPARTMENT / MAJOR',
                      style: GoogleFonts.fredoka(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.brutalBlack, letterSpacing: 1),
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
                        controller: _deptController,
                        style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w600),
                        decoration: const InputDecoration(border: InputBorder.none, hintText: 'Computer Science & AI'),
                      ),
                    ),
                    const SizedBox(height: 14),

                    // Password
                    Text(
                      'PASSWORD',
                      style: GoogleFonts.fredoka(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.brutalBlack, letterSpacing: 1),
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
                        decoration: const InputDecoration(border: InputBorder.none, hintText: '••••••••'),
                      ),
                    ),
                    const SizedBox(height: 20),

                    if (_error != null) ...[
                      Container(
                        padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(
                          color: AppColors.popCoral.withValues(alpha: 0.15),
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(color: AppColors.popCoral, width: 1.5),
                        ),
                        child: Text(
                          _error!,
                          style: GoogleFonts.inter(fontSize: 12, color: AppColors.popCoral, fontWeight: FontWeight.bold),
                        ),
                      ),
                      const SizedBox(height: 16),
                    ],

                    NeuButton(
                      text: _isLoading ? 'CREATING ACCOUNT...' : 'REGISTER STUDENT ACCOUNT ⚡',
                      backgroundColor: AppColors.popGreen,
                      isLoading: _isLoading,
                      onPressed: _isLoading ? null : _handleRegister,
                    ),
                    const SizedBox(height: 12),

                    Center(
                      child: GestureDetector(
                        onTap: () => context.go('/login'),
                        child: Text(
                          'Already registered? Sign In',
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
            ],
          ),
        ),
      ),
    );
  }
}
