import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../services/api_service.dart';
import '../../theme/neubrutalist_widgets.dart';
import '../../theme/app_colors.dart';
import 'package:go_router/go_router.dart';
import 'upload_csv_dialog.dart';

class StudentsListScreen extends ConsumerStatefulWidget {
  const StudentsListScreen({super.key});

  @override
  ConsumerState<StudentsListScreen> createState() => _StudentsListScreenState();
}

class _StudentsListScreenState extends ConsumerState<StudentsListScreen> {
  List<dynamic> _students = [];
  bool _isLoading = true;
  String _searchQuery = '';
  String _filter = 'all';

  final List<Map<String, String>> _filterTabs = [
    { 'key': 'all', 'label': 'ALL' },
    { 'key': 'critical', 'label': 'CRITICAL' },
    { 'key': 'high', 'label': 'HIGH RISK' },
    { 'key': 'medium', 'label': 'MEDIUM RISK' },
    { 'key': 'low', 'label': 'LOW RISK' },
    { 'key': 'improving', 'label': 'IMPROVING' },
  ];

  @override
  void initState() {
    super.initState();
    _fetchStudents();
  }

  Future<void> _fetchStudents() async {
    setState(() => _isLoading = true);
    try {
      final response = await ApiService().get('/api/teacher/students');
      if (mounted) {
        setState(() {
          _students = response.data is Map ? (response.data['students'] ?? []) : (response.data is List ? response.data : []);
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _students = [];
          _isLoading = false;
        });
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed to load students: $e')));
      }
    }
  }

  Color _getRiskColor(String risk) {
    switch (risk.toLowerCase()) {
      case 'high':
      case 'critical': return AppColors.comicRed;
      case 'medium': return AppColors.comicBlue;
      case 'low': return AppColors.comicCyan;
      case 'improving': return AppColors.lightCyan;
      default: return Colors.white;
    }
  }

  Future<void> _uploadCSV() async {
    final result = await showDialog(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => const UploadCsvDialog(),
    );
    if (result == true) {
      _fetchStudents();
    }
  }

  void _showCreateClassDialog() {
    final nameCtrl = TextEditingController();
    final deptCtrl = TextEditingController();
    final semCtrl = TextEditingController(text: '1');
    final yearCtrl = TextEditingController(text: '${DateTime.now().year}-${DateTime.now().year + 1}');
    bool isCreating = false;

    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (context, setDialogState) => AlertDialog(
          backgroundColor: Colors.white,
          shape: const RoundedRectangleBorder(side: BorderSide(color: Colors.black, width: 4)),
          title: Text('+ CREATE CLASS', style: GoogleFonts.inter(fontWeight: FontWeight.w900)),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                _buildDialogTextField('Class Name *', nameCtrl),
                const SizedBox(height: 12),
                _buildDialogTextField('Department *', deptCtrl),
                const SizedBox(height: 12),
                _buildDialogTextField('Semester', semCtrl, isNumber: true),
                const SizedBox(height: 12),
                _buildDialogTextField('Academic Year', yearCtrl),
              ],
            ),
          ),
          actions: [
            TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('CANCEL')),
            ElevatedButton(
              onPressed: isCreating
                  ? null
                  : () async {
                      if (nameCtrl.text.trim().isEmpty || deptCtrl.text.trim().isEmpty) {
                        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Name and department are required')));
                        return;
                      }
                      setDialogState(() => isCreating = true);
                      try {
                        await ApiService().post('/api/teacher/classes', data: {
                          'name': nameCtrl.text,
                          'department': deptCtrl.text,
                          'semester': int.tryParse(semCtrl.text) ?? 1,
                          'academicYear': yearCtrl.text,
                        });
                        if (mounted) {
                          Navigator.pop(ctx);
                          ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Class created successfully')));
                        }
                      } catch (e) {
                        setDialogState(() => isCreating = false);
                        if (mounted) {
                          ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed to create class: $e')));
                        }
                      }
                    },
              child: Text(isCreating ? 'CREATING...' : 'CREATE'),
            ),
          ],
        ),
      ),
    );
  }

  void _showAddStudentDialog() {
    final nameCtrl = TextEditingController();
    final emailCtrl = TextEditingController();
    final studentIdCtrl = TextEditingController();
    final deptCtrl = TextEditingController();
    final semCtrl = TextEditingController(text: '1');
    final cgpaCtrl = TextEditingController();
    final attCtrl = TextEditingController();
    bool isAdding = false;

    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (context, setDialogState) {
          return AlertDialog(
            backgroundColor: Colors.white,
            shape: const RoundedRectangleBorder(
              side: BorderSide(color: Colors.black, width: 4),
              borderRadius: BorderRadius.zero,
            ),
            title: Text('+ ADD STUDENT', style: GoogleFonts.inter(fontWeight: FontWeight.w900, color: Colors.black)),
            content: SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  _buildDialogTextField('Full Name *', nameCtrl),
                  const SizedBox(height: 12),
                  _buildDialogTextField('Email Address *', emailCtrl),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(child: _buildDialogTextField('Student ID', studentIdCtrl)),
                      const SizedBox(width: 12),
                      Expanded(child: _buildDialogTextField('Department', deptCtrl)),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(child: _buildDialogTextField('Semester', semCtrl)),
                      const SizedBox(width: 12),
                      Expanded(child: _buildDialogTextField('CGPA', cgpaCtrl, isNumber: true)),
                      const SizedBox(width: 12),
                      Expanded(child: _buildDialogTextField('Attendance %', attCtrl, isNumber: true)),
                    ],
                  ),
                ],
              ),
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(ctx),
                child: Text('CANCEL', style: GoogleFonts.inter(color: Colors.black, fontWeight: FontWeight.bold)),
              ),
              ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.brutalBlue,
                  foregroundColor: Colors.white,
                  shape: const RoundedRectangleBorder(side: BorderSide(color: Colors.black, width: 2), borderRadius: BorderRadius.zero),
                ),
                onPressed: isAdding ? null : () async {
                  if (nameCtrl.text.isEmpty || emailCtrl.text.isEmpty) return;
                  setDialogState(() => isAdding = true);
                  try {
                    await ApiService().post('/api/teacher/students', data: {
                      'name': nameCtrl.text,
                      'email': emailCtrl.text,
                      if (studentIdCtrl.text.isNotEmpty) 'studentId': studentIdCtrl.text,
                      if (deptCtrl.text.isNotEmpty) 'department': deptCtrl.text,
                      'semester': int.tryParse(semCtrl.text) ?? 1,
                      if (cgpaCtrl.text.isNotEmpty) 'cgpa': double.tryParse(cgpaCtrl.text),
                      if (attCtrl.text.isNotEmpty) 'attendance': double.tryParse(attCtrl.text),
                    });
                    if (mounted) {
                      Navigator.pop(ctx);
                      _fetchStudents();
                    }
                  } catch (e) {
                    setDialogState(() => isAdding = false);
                    if (mounted) {
                      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed to add student: $e')));
                    }
                  }
                },
                child: Text(isAdding ? 'ADDING...' : 'ADD STUDENT', style: GoogleFonts.inter(fontWeight: FontWeight.bold)),
              ),
            ],
          );
        }
      ),
    );
  }

  Widget _buildDialogTextField(String label, TextEditingController controller, {bool isNumber = false}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w900, color: Colors.black)),
        const SizedBox(height: 4),
        TextField(
          controller: controller,
          keyboardType: isNumber ? const TextInputType.numberWithOptions(decimal: true) : TextInputType.text,
          style: const TextStyle(color: Colors.black),
          decoration: const InputDecoration(
            isDense: true,
            border: OutlineInputBorder(borderSide: BorderSide(color: Colors.black, width: 2), borderRadius: BorderRadius.zero),
            focusedBorder: OutlineInputBorder(borderSide: BorderSide(color: AppColors.brutalCyan, width: 2), borderRadius: BorderRadius.zero),
          ),
        ),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    final filteredStudents = _students.where((s) {
      final matchesSearch = (s['name'] ?? '').toString().toLowerCase().contains(_searchQuery.toLowerCase()) ||
                            (s['department'] ?? '').toString().toLowerCase().contains(_searchQuery.toLowerCase());
      if (!matchesSearch) return false;
      if (_filter == 'all') return true;
      if (_filter == 'high') return s['riskLevel'] == 'high';
      if (_filter == 'medium') return s['riskLevel'] == 'medium';
      if (_filter == 'low') return s['riskLevel'] == 'low';
      if (_filter == 'improving') return s['riskLevel'] == 'improving';
      if (_filter == 'critical') return s['riskLevel'] == 'high' && ((s['cgpa'] is num) ? (s['cgpa'] as num).toDouble() : 10.0) < 4.0;
      return true;
    }).toList();

    final totalStudents = _students.length;
    final atRisk = _students.where((s) => s['riskLevel'] == 'high' || s['riskLevel'] == 'medium').length;
    final critical = _students.where((s) => s['riskLevel'] == 'high' && ((s['cgpa'] is num) ? (s['cgpa'] as num).toDouble() : 10.0) < 4.0).length;
    final improving = _students.where((s) => s['riskLevel'] == 'improving').length;

    final isDesktop = MediaQuery.of(context).size.width >= 1024;
    final int crossAxisCount = isDesktop ? 4 : (MediaQuery.of(context).size.width >= 600 ? 2 : 1);

    return _isLoading
        ? const Center(child: CircularProgressIndicator(color: AppColors.brutalBlack))
        : SingleChildScrollView(
            padding: const EdgeInsets.all(32),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Text(
                  'Students Directory',
                  style: GoogleFonts.inter(
                    fontSize: 42,
                    fontWeight: FontWeight.w900,
                    color: AppColors.brutalBlack,
                    letterSpacing: -1,
                  ),
                ),
                Text(
                  'Manage student progress and risk tracking',
                  style: GoogleFonts.inter(
                    fontSize: 16,
                    color: Colors.grey.shade800,
                  ),
                ),
                const SizedBox(height: 32),

                // KPI Cards
                LayoutBuilder(
                  builder: (context, constraints) {
                    final cardCrossAxis = constraints.maxWidth > 800 ? 4 : (constraints.maxWidth > 500 ? 2 : 1);
                    return GridView.count(
                      crossAxisCount: cardCrossAxis,
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      childAspectRatio: 2.0,
                      crossAxisSpacing: 16,
                      mainAxisSpacing: 16,
                      children: [
                        _buildTopKpiCard('Total Students', totalStudents.toString(), Colors.white),
                        _buildTopKpiCard('At Risk', atRisk.toString(), Colors.white),
                        _buildTopKpiCard('Critical', critical.toString(), AppColors.brutalBlue),
                        _buildTopKpiCard('Improving', improving.toString(), AppColors.brutalCyan),
                      ],
                    );
                  }
                ),
                const SizedBox(height: 24),
                
                // Filters
                SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  child: Row(
                    children: _filterTabs.map((tab) => Padding(
                      padding: const EdgeInsets.only(right: 8),
                      child: GestureDetector(
                        onTap: () => setState(() => _filter = tab['key']!),
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                          decoration: BoxDecoration(
                            color: _filter == tab['key'] ? AppColors.brutalBlue : Colors.white,
                            border: Border.all(color: Colors.black, width: 2),
                          ),
                          child: Text(
                            tab['label']!,
                            style: GoogleFonts.inter(
                              fontSize: 12,
                              fontWeight: FontWeight.bold,
                              color: _filter == tab['key'] ? Colors.white : Colors.black,
                              letterSpacing: 1,
                            ),
                          ),
                        ),
                      ),
                    )).toList(),
                  ),
                ),
                const SizedBox(height: 24),
                
                // Search & Actions
                Wrap(
                  spacing: 16,
                  runSpacing: 16,
                  children: [
                    SizedBox(
                      width: MediaQuery.of(context).size.width > 600 ? 300 : MediaQuery.of(context).size.width - 32,
                      child: Container(
                        decoration: BoxDecoration(
                          color: Colors.white,
                          border: Border.all(color: Colors.black, width: 2),
                        ),
                        child: TextField(
                          onChanged: (val) => setState(() => _searchQuery = val),
                          decoration: InputDecoration(
                            hintText: 'Search students...',
                            hintStyle: GoogleFonts.inter(color: Colors.grey, fontWeight: FontWeight.bold),
                            prefixIcon: const Icon(Icons.search, color: Colors.black),
                            border: InputBorder.none,
                            contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                          ),
                          style: GoogleFonts.inter(color: Colors.black, fontWeight: FontWeight.bold),
                        ),
                      ),
                    ),
                    ComicButton(
                      label: '+ CREATE CLASS',
                      backgroundColor: AppColors.brutalistCyan,
                      onPressed: _showCreateClassDialog,
                    ),
                    ComicButton(
                      label: '+ ADD STUDENT',
                      backgroundColor: Colors.white,
                      onPressed: _showAddStudentDialog,
                    ),
                    ComicButton(
                      label: '↑ UPLOAD CSV',
                      backgroundColor: Colors.white,
                      onPressed: _uploadCSV,
                    ),
                  ],
                ),
                const SizedBox(height: 32),
                
                // Students Grid
                GridView.builder(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: crossAxisCount,
                    crossAxisSpacing: 16,
                    mainAxisSpacing: 16,
                    childAspectRatio: 1.1,
                  ),
                  itemCount: filteredStudents.length,
                  itemBuilder: (context, index) {
                    final s = filteredStudents[index];
                    final String sId = (s['_id'] ?? s['id'] ?? '').toString();
                    final color = _getRiskColor(s['riskLevel'] ?? 'low');
                    final att = (s['attendance'] is num) ? (s['attendance'] as num).toDouble() : 0.0;
                    
                    return BrutalistCard(
                      backgroundColor: color,
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              CircleAvatar(
                                radius: 24,
                                backgroundColor: Colors.white,
                                child: Text((s['name'] ?? '?')[0].toString().toUpperCase(), style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 20, color: Colors.black)),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(s['name'] ?? 'Unknown', style: GoogleFonts.inter(fontSize: 18, fontWeight: FontWeight.w900), maxLines: 1, overflow: TextOverflow.ellipsis),
                                    Text('${s['department'] ?? 'General'}${((s['sem'] ?? s['semester']) != null) ? ' · Sem ${s['sem'] ?? s['semester']}' : ''}', style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.bold, letterSpacing: 1)),
                                  ],
                                ),
                              ),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                decoration: BoxDecoration(color: color, border: Border.all(color: Colors.black)),
                                child: Text((s['riskLevel'] ?? 'low').toString().toUpperCase(), style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w900, color: Colors.black)),
                              ),
                            ],
                          ),
                          const SizedBox(height: 16),
                          Container(
                            padding: const EdgeInsets.all(8),
                            decoration: BoxDecoration(color: color, border: Border.all(color: Colors.black, width: 2)),
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Row(
                                  children: [
                                    Text('CGPA:', style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w900)),
                                    const SizedBox(width: 4),
                                    Text(((s['cgpa'] is num) ? (s['cgpa'] as num).toDouble() : 0.0).toStringAsFixed(1), style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.bold)),
                                  ],
                                ),
                                Row(
                                  children: [
                                    Text('ATT:', style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w900)),
                                    const SizedBox(width: 4),
                                    Text('${att.toInt()}%', style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.bold)),
                                  ],
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(height: 12),
                          Expanded(
                            child: Text(
                              s['performanceNote'] ?? s['riskReason'] ?? 'Performing well',
                              style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.bold),
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis
                            ),
                          ),
                          const SizedBox(height: 12),
                          Container(
                            height: 12,
                            width: double.infinity,
                            decoration: BoxDecoration(color: Colors.white, border: Border.all(color: Colors.black, width: 2)),
                            child: FractionallySizedBox(
                              alignment: Alignment.centerLeft,
                              widthFactor: att / 100,
                              child: Container(decoration: BoxDecoration(color: AppColors.brutalWhite, border: const Border(right: BorderSide(color: Colors.black, width: 2)))),
                            ),
                          ),
                          const SizedBox(height: 16),
                          ComicButton(
                            label: 'VIEW PROFILE',
                            backgroundColor: Colors.white,
                            onPressed: () {
                                if (sId.isNotEmpty) {
                                  context.go('/teacher/students/$sId');
                                } else {
                                  ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Student ID is missing')));
                                }
                            },
                          ),
                        ],
                      ),
                    );
                  },
                ),
              ],
            ),
          );
  }

  Widget _buildTopKpiCard(String title, String value, Color color) {
    return Container(
      decoration: BoxDecoration(
        color: color,
        border: Border.all(color: Colors.black, width: 4),
        boxShadow: const [BoxShadow(color: Colors.black, offset: Offset(6, 6))],
      ),
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(value, style: GoogleFonts.inter(fontSize: 42, fontWeight: FontWeight.w900, color: Colors.black, height: 1)),
          const Spacer(),
          Container(
            width: double.infinity,
            height: 2,
            color: Colors.black,
            margin: const EdgeInsets.only(bottom: 8),
          ),
          Text(title.toUpperCase(), style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w900, color: Colors.black, letterSpacing: 1)),
        ],
      ),
    );
  }
}
