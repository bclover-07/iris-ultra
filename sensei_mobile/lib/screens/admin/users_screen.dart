import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../theme/admin_theme.dart';
import '../../theme/admin_glass_widgets.dart';
import '../../services/api_service.dart';

class UsersScreen extends ConsumerStatefulWidget {
  const UsersScreen({super.key});

  @override
  ConsumerState<UsersScreen> createState() => _UsersScreenState();
}

class _UsersScreenState extends ConsumerState<UsersScreen> {
  List<dynamic> _users = [];
  int _total = 0;
  int _page = 1;
  String _search = '';
  String _roleFilter = 'All Roles';
  String _deptFilter = 'All Depts';
  bool _isLoading = true;
  bool _showModal = false;

  final List<String> _departments = ['CSE', 'IT', 'BTECH', 'AI'];
  final List<String> _roles = ['student', 'teacher', 'admin'];

  // Form State
  String _formName = '';
  String _formEmail = '';
  String _formPassword = '';
  String _formRole = 'student';
  String _formDept = 'CSE';
  String _formStudentId = '';
  int _formSemester = 1;
  bool _creating = false;

  @override
  void initState() {
    super.initState();
    _fetchUsers();
  }

  Future<void> _fetchUsers() async {
    setState(() => _isLoading = true);
    try {
      final roleQuery = _roleFilter == 'All Roles' ? '' : '&role=${_roleFilter.toLowerCase()}';
      final deptQuery = _deptFilter == 'All Depts' ? '' : '&department=$_deptFilter';
      final searchQuery = _search.isEmpty ? '' : '&search=$_search';

      final api = ApiService();
      final data = await api.authenticatedGet(
        '/api/admin/users?page=$_page&limit=20$searchQuery$roleQuery$deptQuery',
      );
      if (mounted && data != null) {
        setState(() {
          _users = data['users'] ?? [];
          _total = data['total'] ?? 0;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _users = _mockUsers;
          _total = _mockUsers.length;
          _isLoading = false;
        });
      }
    }
  }

  Future<void> _createUser() async {
    if (_formName.isEmpty || _formEmail.isEmpty || _formPassword.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Fill all required fields', style: GoogleFonts.inter()),
          backgroundColor: AdminTheme.of(context).danger,
        ),
      );
      return;
    }
    setState(() => _creating = true);
    try {
      final api = ApiService();
      await api.authenticatedPost('/api/auth/register', data: {
        'name': _formName,
        'email': _formEmail,
        'password': _formPassword,
        'role': _formRole,
        'department': _formDept,
        'semester': _formRole == 'student' ? _formSemester : null,
        'studentId': _formRole == 'student' ? _formStudentId : null,
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('$_formRole registered!', style: GoogleFonts.inter()),
            backgroundColor: AdminTheme.of(context).success,
          ),
        );
        setState(() {
          _showModal = false;
          _creating = false;
          _formName = '';
          _formEmail = '';
          _formPassword = '';
          _formStudentId = '';
        });
        _fetchUsers();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to create user', style: GoogleFonts.inter()),
            backgroundColor: AdminTheme.of(context).danger,
          ),
        );
        setState(() => _creating = false);
      }
    }
  }

  Future<void> _toggleActive(String id, bool isActive) async {
    try {
      final api = ApiService();
      await api.authenticatedPut('/api/admin/users/$id', data: {'isActive': !isActive});
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(isActive ? 'User deactivated' : 'User activated', style: GoogleFonts.inter()),
            backgroundColor: AdminTheme.of(context).success,
          ),
        );
        _fetchUsers();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to update user status', style: GoogleFonts.inter()),
            backgroundColor: AdminTheme.of(context).danger,
          ),
        );
      }
    }
  }

  Color _getRoleColor(String role, AdminThemeColors t) {
    if (role == 'student') return t.admAccent;
    if (role == 'teacher') return t.stat2Accent;
    if (role == 'admin') return t.danger;
    return t.admTextMuted;
  }

  @override
  Widget build(BuildContext context) {
    final t = AdminTheme.of(context);

    return Stack(
      children: [
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header with Back Button and Add User Button
            Padding(
              padding: const EdgeInsets.only(left: 20, right: 20, top: 20, bottom: 12),
              child: Row(
                children: [
                  const AdminBackButton(),
                  const Spacer(),
                  GestureDetector(
                    onTap: () => setState(() => _showModal = true),
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                      decoration: BoxDecoration(
                        gradient: LinearGradient(colors: AdminTheme.accentGradient(context)),
                        borderRadius: BorderRadius.circular(12),
                        boxShadow: [
                          BoxShadow(
                            color: t.admAccent.withValues(alpha: 0.25),
                            blurRadius: 8,
                            offset: const Offset(0, 2),
                          ),
                        ],
                      ),
                      child: Row(
                        children: [
                          const Icon(Icons.person_add_rounded, color: Colors.white, size: 16),
                          const SizedBox(width: 6),
                          Text(
                            'Add User',
                            style: GoogleFonts.inter(
                              fontSize: 13,
                              fontWeight: FontWeight.w600,
                              color: Colors.white,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),

            // Page Title
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: AdminSectionTitle(
                title: 'User Management',
                subtitle: 'Total: $_total users registered',
                icon: Icons.people_alt_rounded,
                iconColor: t.admAccent,
              ),
            ),
            const SizedBox(height: 16),

            // Search Bar
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                decoration: BoxDecoration(
                  color: t.admInputBg,
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: t.admInputBorder.withValues(alpha: 0.5)),
                ),
                child: TextField(
                  decoration: InputDecoration(
                    icon: Icon(Icons.search_rounded, size: 20, color: t.admTextMuted),
                    hintText: 'Search by name or email...',
                    hintStyle: GoogleFonts.inter(color: t.admTextMuted),
                    border: InputBorder.none,
                  ),
                  style: GoogleFonts.inter(color: t.admText),
                  onChanged: (v) {
                    _search = v;
                    if (v.isEmpty || v.length > 2) {
                      _page = 1;
                      _fetchUsers();
                    }
                  },
                ),
              ),
            ),
            const SizedBox(height: 12),

            // Filter Row (Role and Department Dropdowns)
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: Row(
                children: [
                  Expanded(
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12),
                      decoration: BoxDecoration(
                        color: t.admSurface,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: t.admBorderSolid.withValues(alpha: 0.5)),
                      ),
                      child: DropdownButtonHideUnderline(
                        child: DropdownButton<String>(
                          isExpanded: true,
                          value: _roleFilter,
                          dropdownColor: t.admSurface,
                          style: GoogleFonts.inter(color: t.admText, fontSize: 13, fontWeight: FontWeight.w500),
                          items: ['All Roles', ..._roles].map((r) {
                            return DropdownMenuItem(
                              value: r,
                              child: Text(r[0].toUpperCase() + r.substring(1)),
                            );
                          }).toList(),
                          onChanged: (v) {
                            if (v != null) {
                              setState(() {
                                _roleFilter = v;
                                _page = 1;
                              });
                              _fetchUsers();
                            }
                          },
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12),
                      decoration: BoxDecoration(
                        color: t.admSurface,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: t.admBorderSolid.withValues(alpha: 0.5)),
                      ),
                      child: DropdownButtonHideUnderline(
                        child: DropdownButton<String>(
                          isExpanded: true,
                          value: _deptFilter,
                          dropdownColor: t.admSurface,
                          style: GoogleFonts.inter(color: t.admText, fontSize: 13, fontWeight: FontWeight.w500),
                          items: ['All Depts', ..._departments].map((d) {
                            return DropdownMenuItem(value: d, child: Text(d));
                          }).toList(),
                          onChanged: (v) {
                            if (v != null) {
                              setState(() {
                                _deptFilter = v;
                                _page = 1;
                              });
                              _fetchUsers();
                            }
                          },
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // Users List
            Expanded(
              child: _isLoading
                  ? Center(child: CircularProgressIndicator(color: t.admAccent))
                  : _users.isEmpty
                      ? Center(
                          child: Text(
                            'No users found',
                            style: GoogleFonts.inter(color: t.admTextMuted),
                          ),
                        )
                      : RefreshIndicator(
                          onRefresh: _fetchUsers,
                          color: t.admAccent,
                          child: ListView.builder(
                            physics: const AlwaysScrollableScrollPhysics(),
                            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
                            itemCount: _users.length,
                            itemBuilder: (context, i) {
                              final u = _users[i];
                              final roleColor = _getRoleColor(u['role'] ?? 'student', t);
                              final isActive = u['isActive'] == true;

                              return Padding(
                                padding: const EdgeInsets.only(bottom: 12),
                                child: AdminGlassContainer(
                                  child: Padding(
                                    padding: const EdgeInsets.all(12),
                                    child: Row(
                                      children: [
                                        Container(
                                          width: 44,
                                          height: 44,
                                          decoration: BoxDecoration(
                                            color: roleColor.withValues(alpha: 0.15),
                                            borderRadius: BorderRadius.circular(12),
                                            border: Border.all(color: roleColor.withValues(alpha: 0.25)),
                                          ),
                                          alignment: Alignment.center,
                                          child: Text(
                                            u['name'].toString().substring(0, 1).toUpperCase(),
                                            style: GoogleFonts.spaceGrotesk(
                                              color: roleColor,
                                              fontWeight: FontWeight.bold,
                                              fontSize: 18,
                                            ),
                                          ),
                                        ),
                                        const SizedBox(width: 12),
                                        Expanded(
                                          child: Column(
                                            crossAxisAlignment: CrossAxisAlignment.start,
                                            children: [
                                              Text(
                                                u['name'] ?? '',
                                                style: GoogleFonts.spaceGrotesk(
                                                  fontWeight: FontWeight.bold,
                                                  color: t.admText,
                                                  fontSize: 15,
                                                ),
                                                maxLines: 1,
                                                overflow: TextOverflow.ellipsis,
                                              ),
                                              const SizedBox(height: 2),
                                              Text(
                                                '${u['email']} • ${u['department'] ?? 'General'}',
                                                style: GoogleFonts.inter(
                                                  fontSize: 11,
                                                  color: t.admTextMuted,
                                                ),
                                                maxLines: 1,
                                                overflow: TextOverflow.ellipsis,
                                              ),
                                            ],
                                          ),
                                        ),
                                        Column(
                                          crossAxisAlignment: CrossAxisAlignment.end,
                                          children: [
                                            Container(
                                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                              decoration: BoxDecoration(
                                                color: roleColor.withValues(alpha: 0.1),
                                                borderRadius: BorderRadius.circular(12),
                                                border: Border.all(color: roleColor.withValues(alpha: 0.2)),
                                              ),
                                              child: Text(
                                                u['role'].toString().toUpperCase(),
                                                style: GoogleFonts.inter(
                                                  fontSize: 9,
                                                  fontWeight: FontWeight.bold,
                                                  color: roleColor,
                                                ),
                                              ),
                                            ),
                                            const SizedBox(height: 6),
                                            GestureDetector(
                                              onTap: () => _toggleActive(u['_id'], isActive),
                                              child: Container(
                                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                                decoration: BoxDecoration(
                                                  color: isActive
                                                      ? t.success.withValues(alpha: 0.1)
                                                      : t.danger.withValues(alpha: 0.1),
                                                  borderRadius: BorderRadius.circular(12),
                                                  border: Border.all(
                                                    color: isActive
                                                        ? t.success.withValues(alpha: 0.2)
                                                        : t.danger.withValues(alpha: 0.2),
                                                  ),
                                                ),
                                                child: Text(
                                                  isActive ? 'Active' : 'Inactive',
                                                  style: GoogleFonts.inter(
                                                    fontSize: 9,
                                                    fontWeight: FontWeight.bold,
                                                    color: isActive ? t.success : t.danger,
                                                  ),
                                                ),
                                              ),
                                            ),
                                          ],
                                        ),
                                      ],
                                    ),
                                  ),
                                ),
                              );
                            },
                          ),
                        ),
            ),

            // Pagination Controls
            if (_total > 20)
              Container(
                padding: const EdgeInsets.symmetric(vertical: 12),
                decoration: BoxDecoration(
                  color: t.admSurface,
                  border: Border(top: BorderSide(color: t.admBorderSolid.withValues(alpha: 0.5))),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    if (_page > 1)
                      TextButton(
                        onPressed: () {
                          setState(() => _page--);
                          _fetchUsers();
                        },
                        child: Text('Prev', style: GoogleFonts.inter(color: t.admAccent)),
                      ),
                    Text(
                      ' Page $_page of ${(_total / 20).ceil()} ',
                      style: GoogleFonts.inter(color: t.admText, fontWeight: FontWeight.bold),
                    ),
                    if (_page * 20 < _total)
                      TextButton(
                        onPressed: () {
                          setState(() => _page++);
                          _fetchUsers();
                        },
                        child: Text('Next', style: GoogleFonts.inter(color: t.admAccent)),
                      ),
                  ],
                ),
              ),
          ],
        ),

        // Create User Modal Overlay
        if (_showModal)
          Positioned.fill(
            child: Container(
              color: Colors.black54,
              alignment: Alignment.center,
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: AdminGlassContainer(
                  padding: const EdgeInsets.all(24),
                  child: SingleChildScrollView(
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              'Register User',
                              style: GoogleFonts.spaceGrotesk(
                                fontSize: 20,
                                fontWeight: FontWeight.bold,
                                color: t.admText,
                              ),
                            ),
                            IconButton(
                              icon: Icon(Icons.close_rounded, color: t.admText),
                              onPressed: () => setState(() => _showModal = false),
                            ),
                          ],
                        ),
                        const SizedBox(height: 16),
                        _buildInputField(
                          label: 'Full Name',
                          hint: 'John Doe',
                          onChanged: (v) => _formName = v,
                          t: t,
                        ),
                        const SizedBox(height: 12),
                        _buildInputField(
                          label: 'Email Address',
                          hint: 'john.doe@university.edu',
                          onChanged: (v) => _formEmail = v,
                          t: t,
                        ),
                        const SizedBox(height: 12),
                        _buildInputField(
                          label: 'Password',
                          hint: '••••••••',
                          obscureText: true,
                          onChanged: (v) => _formPassword = v,
                          t: t,
                        ),
                        const SizedBox(height: 12),
                        Row(
                          children: [
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    'Role',
                                    style: GoogleFonts.inter(
                                      fontSize: 11,
                                      fontWeight: FontWeight.bold,
                                      color: t.admTextMuted,
                                    ),
                                  ),
                                  const SizedBox(height: 6),
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 12),
                                    decoration: BoxDecoration(
                                      color: t.admInputBg,
                                      borderRadius: BorderRadius.circular(10),
                                      border: Border.all(color: t.admInputBorder.withValues(alpha: 0.5)),
                                    ),
                                    child: DropdownButtonHideUnderline(
                                      child: DropdownButton<String>(
                                        value: _formRole,
                                        isExpanded: true,
                                        dropdownColor: t.admSurface,
                                        style: GoogleFonts.inter(color: t.admText, fontSize: 13),
                                        items: _roles.map((r) {
                                          return DropdownMenuItem(
                                            value: r,
                                            child: Text(r[0].toUpperCase() + r.substring(1)),
                                          );
                                        }).toList(),
                                        onChanged: (v) => setState(() => _formRole = v!),
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    'Department',
                                    style: GoogleFonts.inter(
                                      fontSize: 11,
                                      fontWeight: FontWeight.bold,
                                      color: t.admTextMuted,
                                    ),
                                  ),
                                  const SizedBox(height: 6),
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 12),
                                    decoration: BoxDecoration(
                                      color: t.admInputBg,
                                      borderRadius: BorderRadius.circular(10),
                                      border: Border.all(color: t.admInputBorder.withValues(alpha: 0.5)),
                                    ),
                                    child: DropdownButtonHideUnderline(
                                      child: DropdownButton<String>(
                                        value: _formDept,
                                        isExpanded: true,
                                        dropdownColor: t.admSurface,
                                        style: GoogleFonts.inter(color: t.admText, fontSize: 13),
                                        items: _departments.map((d) {
                                          return DropdownMenuItem(value: d, child: Text(d));
                                        }).toList(),
                                        onChanged: (v) => setState(() => _formDept = v!),
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                        if (_formRole == 'student') ...[
                          const SizedBox(height: 12),
                          Row(
                            children: [
                              Expanded(
                                child: _buildInputField(
                                  label: 'Roll Number',
                                  hint: 'CS2024-001',
                                  onChanged: (v) => _formStudentId = v,
                                  t: t,
                                ),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      'Semester',
                                      style: GoogleFonts.inter(
                                        fontSize: 11,
                                        fontWeight: FontWeight.bold,
                                        color: t.admTextMuted,
                                      ),
                                    ),
                                    const SizedBox(height: 6),
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 12),
                                      decoration: BoxDecoration(
                                        color: t.admInputBg,
                                        borderRadius: BorderRadius.circular(10),
                                        border: Border.all(color: t.admInputBorder.withValues(alpha: 0.5)),
                                      ),
                                      child: DropdownButtonHideUnderline(
                                        child: DropdownButton<int>(
                                          value: _formSemester,
                                          isExpanded: true,
                                          dropdownColor: t.admSurface,
                                          style: GoogleFonts.inter(color: t.admText, fontSize: 13),
                                          items: [1, 2, 3, 4, 5, 6, 7, 8].map((s) {
                                            return DropdownMenuItem(value: s, child: Text('Sem $s'));
                                          }).toList(),
                                          onChanged: (v) => setState(() => _formSemester = v!),
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                        ],
                        const SizedBox(height: 24),
                        AdminButton(
                          onTap: _creating ? () {} : _createUser,
                          isLoading: _creating,
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              const Icon(Icons.person_add_rounded, color: Colors.white, size: 18),
                              const SizedBox(width: 8),
                              Text(
                                _creating ? 'CREATING...' : 'REGISTER ${_formRole.toUpperCase()}',
                                style: GoogleFonts.spaceGrotesk(),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ),
      ],
    );
  }

  Widget _buildInputField({
    required String label,
    required String hint,
    required ValueChanged<String> onChanged,
    required AdminThemeColors t,
    bool obscureText = false,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label.toUpperCase(),
          style: GoogleFonts.inter(
            fontSize: 10,
            fontWeight: FontWeight.bold,
            color: t.admTextMuted,
            letterSpacing: 0.5,
          ),
        ),
        const SizedBox(height: 6),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          decoration: BoxDecoration(
            color: t.admInputBg,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: t.admInputBorder.withValues(alpha: 0.5)),
          ),
          child: TextField(
            onChanged: onChanged,
            obscureText: obscureText,
            decoration: InputDecoration(
              hintText: hint,
              hintStyle: GoogleFonts.inter(color: t.admTextMuted, fontSize: 13),
              border: InputBorder.none,
            ),
            style: GoogleFonts.inter(fontSize: 14, color: t.admText),
          ),
        ),
      ],
    );
  }
}

final List<Map<String, dynamic>> _mockUsers = [
  {'_id': '1', 'name': 'Alice Smith', 'email': 'alice.smith@university.edu', 'role': 'student', 'department': 'CSE', 'isActive': true},
  {'_id': '2', 'name': 'Dr. Bob Johnson', 'email': 'bob.johnson@university.edu', 'role': 'teacher', 'department': 'IT', 'isActive': false},
  {'_id': '3', 'name': 'Charlie Administrator', 'email': 'charlie.admin@university.edu', 'role': 'admin', 'department': 'CSE', 'isActive': true},
];
