import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:fluttertoast/fluttertoast.dart';
import '../../services/auth_service.dart';
import '../../theme/app_colors.dart';

class RegisterScreen extends StatefulWidget {
  const RegisterScreen({super.key});

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _showPassword = false;
  bool _loading = false;
  String _selectedRole = 'student';

  final _roles = [
    {'id': 'student', 'label': 'Student', 'icon': Icons.school, 'color': const Color(0xFFFFD93D)},
    {'id': 'teacher', 'label': 'Faculty', 'icon': Icons.menu_book, 'color': const Color(0xFF4ADE80)},
    {'id': 'admin', 'label': 'Admin', 'icon': Icons.shield, 'color': const Color(0xFF00F5FF)},
  ];

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _handleRegister() async {
    if (_nameController.text.isEmpty || _emailController.text.isEmpty || _passwordController.text.isEmpty) {
      Fluttertoast.showToast(msg: 'Please fill in all fields', backgroundColor: Colors.red);
      return;
    }

    setState(() => _loading = true);
    try {
      await AuthService().register(
        name: _nameController.text.trim(),
        email: _emailController.text.trim(),
        password: _passwordController.text,
        role: _selectedRole,
      );
      if (mounted) {
        Fluttertoast.showToast(msg: 'Registration successful! Please login.', backgroundColor: Colors.green);
        context.go('/login');
      }
    } catch (e) {
      Fluttertoast.showToast(msg: 'Registration failed', backgroundColor: Colors.red);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF050508),
      body: Stack(
        children: [
          _buildAmbientGradient(),
          SafeArea(
            child: Center(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(24),
                child: Container(
                  constraints: const BoxConstraints(maxWidth: 480),
                  padding: const EdgeInsets.all(28),
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.04),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: AppColors.gold.withValues(alpha: 0.2)),
                    boxShadow: [
                      BoxShadow(color: AppColors.gold.withValues(alpha: 0.08), blurRadius: 80),
                      BoxShadow(color: Colors.black.withValues(alpha: 0.6), blurRadius: 64, offset: const Offset(0, 32)),
                    ],
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      _buildLogo(),
                      const SizedBox(height: 24),
                      _buildRoleSelector(),
                      const SizedBox(height: 24),
                      _buildInputField(
                        label: 'Full Name',
                        controller: _nameController,
                        placeholder: 'Arjun Sharma',
                        prefixIcon: Icons.person,
                      ),
                      const SizedBox(height: 16),
                      _buildInputField(
                        label: 'Email Address',
                        controller: _emailController,
                        placeholder: 'user@sensei.edu',
                        keyboardType: TextInputType.emailAddress,
                      ),
                      const SizedBox(height: 16),
                      _buildPasswordField(),
                      const SizedBox(height: 24),
                      _buildSubmitButton(),
                      const SizedBox(height: 20),
                      Center(
                        child: GestureDetector(
                          onTap: () => context.go('/login'),
                          child: Text(
                            'Already have an identity? Login',
                            style: GoogleFonts.inter(
                              fontSize: 12,
                              color: const Color(0xFFA09080),
                              letterSpacing: 1.5,
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildAmbientGradient() {
    return Positioned.fill(
      child: Stack(
        children: [
          Positioned(
            top: MediaQuery.of(context).size.height * 0.2,
            right: MediaQuery.of(context).size.width * 0.1,
            child: Container(
              width: MediaQuery.of(context).size.width * 0.4,
              height: MediaQuery.of(context).size.width * 0.4,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: RadialGradient(colors: [AppColors.gold.withValues(alpha: 0.1), Colors.transparent]),
              ),
            ),
          ),
          Positioned(
            bottom: MediaQuery.of(context).size.height * 0.1,
            left: MediaQuery.of(context).size.width * 0.2,
            child: Container(
              width: MediaQuery.of(context).size.width * 0.5,
              height: MediaQuery.of(context).size.width * 0.5,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: RadialGradient(colors: [const Color(0xFFFF4500).withValues(alpha: 0.1), Colors.transparent]),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildLogo() {
    return Column(
      children: [
        GestureDetector(
          onTap: () => context.go('/login'),
          child: ShaderMask(
            shaderCallback: (bounds) => const LinearGradient(
              colors: [Color(0xFFFFD700), Color(0xFFFFF176), Color(0xFFFF8C00)],
            ).createShader(bounds),
            child: Text(
              'SENSEI',
              style: GoogleFonts.cinzelDecorative(fontSize: 40, fontWeight: FontWeight.w900, color: Colors.white, letterSpacing: 5),
            ),
          ),
        ),
        const SizedBox(height: 4),
        Text(
          'INITIATE NEW IDENTITY',
          style: GoogleFonts.shareTechMono(fontSize: 10, letterSpacing: 4, color: AppColors.gold.withValues(alpha: 0.7)),
        ),
      ],
    );
  }

  Widget _buildRoleSelector() {
    return Row(
      children: _roles.map((role) {
        final isSelected = _selectedRole == role['id'];
        final roleColor = role['color'] as Color;

        return Expanded(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 4),
            child: GestureDetector(
              onTap: () => setState(() => _selectedRole = role['id'] as String),
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 250),
                padding: const EdgeInsets.symmetric(vertical: 14),
                decoration: BoxDecoration(
                  color: isSelected ? Colors.white.withValues(alpha: 0.1) : Colors.black.withValues(alpha: 0.2),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(
                    color: isSelected ? roleColor : Colors.white.withValues(alpha: 0.1),
                  ),
                  boxShadow: isSelected
                      ? [BoxShadow(color: Colors.white.withValues(alpha: 0.1), blurRadius: 15)]
                      : null,
                ),
                child: Column(
                  children: [
                    Icon(role['icon'] as IconData, size: 24, color: isSelected ? roleColor : const Color(0xFF8B9BB4)),
                    const SizedBox(height: 6),
                    Text(
                      (role['label'] as String).toUpperCase(),
                      style: GoogleFonts.inter(
                        fontSize: 9,
                        fontWeight: FontWeight.w700,
                        letterSpacing: 1.5,
                        color: isSelected ? Colors.white : const Color(0xFF8B9BB4),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        );
      }).toList(),
    );
  }

  Widget _buildInputField({
    required String label,
    required TextEditingController controller,
    required String placeholder,
    IconData? prefixIcon,
    TextInputType keyboardType = TextInputType.text,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label.toUpperCase(),
          style: GoogleFonts.inter(
            fontSize: 9,
            fontWeight: FontWeight.w800,
            letterSpacing: 2,
            color: AppColors.gold.withValues(alpha: 0.7),
          ),
        ),
        const SizedBox(height: 8),
        TextField(
          controller: controller,
          keyboardType: keyboardType,
          style: GoogleFonts.shareTechMono(fontSize: 14, color: Colors.white),
          decoration: InputDecoration(
            hintText: placeholder,
            hintStyle: GoogleFonts.shareTechMono(color: Colors.white.withValues(alpha: 0.2)),
            prefixIcon: prefixIcon != null ? Icon(prefixIcon, color: AppColors.gold.withValues(alpha: 0.5), size: 18) : null,
            filled: true,
            fillColor: Colors.white.withValues(alpha: 0.04),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: BorderSide(color: AppColors.gold.withValues(alpha: 0.15)),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: BorderSide(color: AppColors.gold.withValues(alpha: 0.15)),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: const BorderSide(color: AppColors.gold),
            ),
            contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
          ),
        ),
      ],
    );
  }

  Widget _buildPasswordField() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'PASSCODE',
          style: GoogleFonts.inter(
            fontSize: 9,
            fontWeight: FontWeight.w800,
            letterSpacing: 2,
            color: AppColors.gold.withValues(alpha: 0.7),
          ),
        ),
        const SizedBox(height: 8),
        TextField(
          controller: _passwordController,
          obscureText: !_showPassword,
          style: GoogleFonts.shareTechMono(fontSize: 14, color: Colors.white),
          decoration: InputDecoration(
            hintText: '••••••••',
            hintStyle: GoogleFonts.shareTechMono(color: Colors.white.withValues(alpha: 0.2)),
            filled: true,
            fillColor: Colors.white.withValues(alpha: 0.04),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: BorderSide(color: AppColors.gold.withValues(alpha: 0.15)),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: BorderSide(color: AppColors.gold.withValues(alpha: 0.15)),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: const BorderSide(color: AppColors.gold),
            ),
            contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
            suffixIcon: IconButton(
              icon: Icon(
                _showPassword ? Icons.visibility_off : Icons.visibility,
                color: AppColors.gold.withValues(alpha: 0.5),
                size: 18,
              ),
              onPressed: () => setState(() => _showPassword = !_showPassword),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildSubmitButton() {
    return GestureDetector(
      onTap: _loading ? null : _handleRegister,
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 16),
        decoration: BoxDecoration(
          color: _loading ? AppColors.gold.withValues(alpha: 0.5) : AppColors.gold,
          borderRadius: BorderRadius.circular(12),
          boxShadow: _loading ? null : [BoxShadow(color: Colors.black.withValues(alpha: 0.5), blurRadius: 20)],
        ),
        child: Center(
          child: _loading
              ? Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: List.generate(3, (i) => Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 3),
                    child: Container(width: 6, height: 6, decoration: const BoxDecoration(color: Colors.black, shape: BoxShape.circle)),
                  )),
                )
              : Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(
                      'ESTABLISH LINK',
                      style: GoogleFonts.inter(
                        fontSize: 12,
                        fontWeight: FontWeight.w800,
                        letterSpacing: 3,
                        color: const Color(0xFF050508),
                      ),
                    ),
                    const SizedBox(width: 8),
                    const Icon(Icons.person_add, size: 18, color: Color(0xFF050508)),
                  ],
                ),
        ),
      ),
    );
  }
}
