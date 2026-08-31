import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../services/api_service.dart';
import '../../theme/neubrutalist_widgets.dart';
import '../../theme/app_colors.dart';

class TeacherInterventionsScreen extends ConsumerStatefulWidget {
  const TeacherInterventionsScreen({super.key});

  @override
  ConsumerState<TeacherInterventionsScreen> createState() => _TeacherInterventionsScreenState();
}

class _TeacherInterventionsScreenState extends ConsumerState<TeacherInterventionsScreen> {
  List<dynamic> _interventions = [];
  bool _isLoading = true;
  String? _fetchError;
  String _filter = 'all';
  String _searchQuery = '';
  List<dynamic> _studentsList = [];

  final List<Map<String, String>> _filterTabs = [
    { 'key': 'all', 'label': 'All' },
    { 'key': 'sent', 'label': 'SENT' },
    { 'key': 'in_progress', 'label': 'IN PROGRESS' },
    { 'key': 'resolved', 'label': 'RESOLVED' },
  ];

  @override
  void initState() {
    super.initState();
    _fetchData();
  }

  Future<void> _fetchData() async {
    setState(() {
      _isLoading = true;
      _fetchError = null;
    });
    try {
      final response = await ApiService().get('/api/teacher/interventions');
      if (mounted) {
        setState(() {
          final raw = response.data is Map ? (response.data['interventions'] ?? []) : (response.data is List ? response.data : []);
          _interventions = (raw as List).map((item) {
            final sid = item['studentId'];
            String studentName = 'Class-level';
            if (sid != null && sid is Map && sid['name'] != null) {
              studentName = sid['name'];
            } else if (item['student'] != null && item['student'] is Map) {
              studentName = item['student']['name'] ?? 'Class-level';
            }
            final tags = item['tags'];
            final domainTag = tags is List && tags.isNotEmpty ? tags.first.toString() : null;
            return {
              '_id': item['_id'],
              'student': { 'name': studentName },
              'type': domainTag ?? item['type'] ?? 'academic',
              'urgency': item['urgency'] ?? 'medium',
              'status': item['status'] ?? 'sent',
              'message': item['message'] ?? '',
              'date': item['createdAt'] != null ? _formatDate(item['createdAt']) : 'recently',
            };
          }).toList();
          _isLoading = false;
        });

        try {
          final studentRes = await ApiService().get('/api/teacher/students');
          if (mounted) {
            setState(() {
              _studentsList = studentRes.data is Map ? (studentRes.data['students'] ?? []) : (studentRes.data is List ? studentRes.data : []);
            });
          }
        } catch (_) {}
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _fetchError = 'Failed to load interventions. Check your connection and try again.';
          _isLoading = false;
        });
      }
    }
  }

  String _formatDate(String dateStr) {
    try {
      final d = DateTime.parse(dateStr);
      final now = DateTime.now();
      final diff = now.difference(d);
      if (diff.inDays == 0) return 'Today';
      if (diff.inDays == 1) return 'Yesterday';
      if (diff.inDays < 7) return '${diff.inDays} days ago';
      return '${d.month}/${d.day}';
    } catch (_) {
      return 'recently';
    }
  }

  Future<void> _updateStatus(String id, String newStatus) async {
    try {
      await ApiService().patch('/api/teacher/interventions/$id/status', data: {'status': newStatus});
      _fetchData();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed to update status: $e')));
      }
    }
  }

  Color _getStatusColor(String status) {
    switch (status) {
      case 'sent': return AppColors.senseiCoral;
      case 'in_progress': return AppColors.brutalistCyan;
      case 'resolved': return AppColors.senseiGreen;
      default: return Colors.white;
    }
  }

  void _showAddInterventionDialog() {
    String? selectedStudentId;
    String selectedDomain = 'academic';
    String selectedUrgency = 'medium';
    final messageCtrl = TextEditingController();
    bool isSubmitting = false;
    bool isDrafting = false;
    bool isFetchingStudentsLocal = _studentsList.isEmpty;
    List<dynamic> localStudentsList = List.from(_studentsList);

    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (context, setDialogState) {
          if (isFetchingStudentsLocal && localStudentsList.isEmpty) {
            ApiService().get('/api/teacher/students').then((res) {
              if (mounted) {
                setDialogState(() {
                  localStudentsList = res.data is Map ? (res.data['students'] ?? []) : (res.data is List ? res.data : []);
                  if (localStudentsList.isNotEmpty) {
                    selectedStudentId = localStudentsList.first['_id']?.toString();
                  }
                  isFetchingStudentsLocal = false;
                });
                setState(() {
                  _studentsList = localStudentsList;
                });
              }
            }).catchError((e) {
              setDialogState(() {
                isFetchingStudentsLocal = false;
              });
            });
          } else if (selectedStudentId == null && localStudentsList.isNotEmpty) {
            selectedStudentId = localStudentsList.first['_id']?.toString();
          }

          return AlertDialog(
            backgroundColor: Colors.white,
            shape: const RoundedRectangleBorder(
              side: BorderSide(color: Colors.black, width: 4),
              borderRadius: BorderRadius.zero,
            ),
            title: Text('NEW INTERVENTION', style: GoogleFonts.inter(fontWeight: FontWeight.w900, color: Colors.black)),
              content: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Select Student:', style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 12, color: Colors.black)),
                    const SizedBox(height: 8),
                    if (isFetchingStudentsLocal)
                      const Center(child: CircularProgressIndicator(color: AppColors.brutalBlack))
                    else if (localStudentsList.isEmpty)
                      const Text('No students found', style: TextStyle(color: Colors.red))
                    else
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12),
                        decoration: BoxDecoration(
                          border: Border.all(color: Colors.black, width: 2),
                        ),
                        child: DropdownButton<String>(
                          value: selectedStudentId,
                          isExpanded: true,
                          underline: const SizedBox(),
                          items: localStudentsList.map<DropdownMenuItem<String>>((s) {
                            return DropdownMenuItem<String>(
                              value: s['_id']?.toString(),
                              child: Text(s['name']?.toString() ?? 'Unknown', style: GoogleFonts.inter(color: Colors.black)),
                            );
                          }).toList(),
                          onChanged: (val) => setDialogState(() => selectedStudentId = val),
                        ),
                      ),
                    const SizedBox(height: 16),
                    Text('Support Domain:', style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 12, color: Colors.black)),
                    const SizedBox(height: 8),
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: ['academic', 'attendance', 'behavioral', 'wellness'].map((domain) {
                        final isSelected = selectedDomain == domain;
                        return GestureDetector(
                          onTap: () => setDialogState(() => selectedDomain = domain),
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                            decoration: BoxDecoration(
                              color: isSelected ? AppColors.senseiPurple : Colors.white,
                              border: Border.all(color: Colors.black, width: 2),
                            ),
                            child: Text(
                              domain.toUpperCase(),
                              style: GoogleFonts.spaceMono(
                                fontSize: 10,
                                fontWeight: FontWeight.bold,
                                color: isSelected ? Colors.white : Colors.black,
                              ),
                            ),
                          ),
                        );
                      }).toList(),
                    ),
                    const SizedBox(height: 16),
                    Text('Urgency Priority:', style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 12, color: Colors.black)),
                    const SizedBox(height: 8),
                    Row(
                      children: ['low', 'medium', 'high'].map((urgency) {
                        final isSelected = selectedUrgency == urgency;
                        return Padding(
                          padding: const EdgeInsets.only(right: 8),
                          child: GestureDetector(
                            onTap: () => setDialogState(() => selectedUrgency = urgency),
                            child: Container(
                              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                              decoration: BoxDecoration(
                                color: isSelected ? AppColors.senseiCoral : Colors.white,
                                border: Border.all(color: Colors.black, width: 2),
                              ),
                              child: Text(
                                urgency.toUpperCase(),
                                style: GoogleFonts.spaceMono(
                                  fontSize: 10,
                                  fontWeight: FontWeight.bold,
                                  color: isSelected ? Colors.white : Colors.black,
                                ),
                              ),
                            ),
                          ),
                        );
                      }).toList(),
                    ),
                    const SizedBox(height: 16),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text('Intervention Message:', style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 12, color: Colors.black)),
                        GestureDetector(
                          onTap: isDrafting
                              ? null
                              : () async {
                                  if (selectedStudentId == null) return;
                                  setDialogState(() => isDrafting = true);
                                  try {
                                    final response = await ApiService().get(
                                      '/api/teacher/alerts/draft',
                                      queryParameters: {
                                        'studentId': selectedStudentId,
                                        'subject': selectedDomain,
                                      },
                                    );
                                    if (response.data != null && response.data['body'] != null) {
                                      messageCtrl.text = response.data['body'];
                                    }
                                  } catch (e) {
                                    ScaffoldMessenger.of(context).showSnackBar(
                                      SnackBar(content: Text('AI Draft failed: $e')),
                                    );
                                  } finally {
                                    setDialogState(() => isDrafting = false);
                                  }
                                },
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                            decoration: BoxDecoration(
                              color: AppColors.brutalistCyan,
                              border: Border.all(color: Colors.black, width: 2),
                              boxShadow: const [BoxShadow(color: Colors.black, offset: Offset(2, 2))],
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                if (isDrafting)
                                  const SizedBox(
                                    height: 10,
                                    width: 10,
                                    child: CircularProgressIndicator(strokeWidth: 2, color: Colors.black),
                                  )
                                else
                                  const Icon(Icons.auto_awesome, size: 12, color: Colors.black),
                                const SizedBox(width: 4),
                                Text(
                                  isDrafting ? 'DRAFTING...' : 'AI DRAFT',
                                  style: GoogleFonts.spaceMono(
                                    fontSize: 9,
                                    fontWeight: FontWeight.bold,
                                    color: Colors.black,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    TextField(
                      controller: messageCtrl,
                      maxLines: 4,
                      style: const TextStyle(color: Colors.black),
                      decoration: const InputDecoration(
                        border: OutlineInputBorder(borderSide: BorderSide(color: Colors.black, width: 2), borderRadius: BorderRadius.zero),
                        focusedBorder: OutlineInputBorder(borderSide: BorderSide(color: AppColors.brutalCyan, width: 2), borderRadius: BorderRadius.zero),
                      ),
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
                  onPressed: isSubmitting ? null : () async {
                    if (selectedStudentId == null || messageCtrl.text.isEmpty) return;
                    setDialogState(() => isSubmitting = true);
                    try {
                      await ApiService().post('/api/teacher/interventions', data: {
                        'studentId': selectedStudentId,
                        'message': messageCtrl.text,
                        'triggerType': 'manual',
                        'urgency': selectedUrgency,
                        'type': selectedDomain,
                        'tags': [selectedDomain],
                      });
                      if (mounted) {
                        Navigator.pop(ctx);
                        _fetchData();
                        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Intervention created successfully')));
                      }
                    } catch (e) {
                      setDialogState(() => isSubmitting = false);
                      if (mounted) {
                        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
                      }
                    }
                  },
                  child: Text(isSubmitting ? 'CREATING...' : 'CREATE', style: GoogleFonts.inter(fontWeight: FontWeight.bold)),
                ),
              ],
            );
          }
        ),
      );
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    final filtered = _interventions.where((i) {
      final matchesFilter = _filter == 'all' || i['status'] == _filter;
      final studentName = (i['student']?['name'] ?? '').toString().toLowerCase();
      final message = (i['message'] ?? '').toString().toLowerCase();
      final matchesSearch = studentName.contains(_searchQuery.toLowerCase()) || message.contains(_searchQuery.toLowerCase());
      return matchesFilter && matchesSearch;
    }).toList();

    return Scaffold(
      backgroundColor: isDark ? const Color(0xFF050508) : AppColors.brutalBg,
      appBar: AppBar(
        title: Text('INTERVENTIONS 🎯', style: GoogleFonts.fredoka(fontWeight: FontWeight.bold)),
        backgroundColor: Colors.transparent,
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.add_circle_outline, color: Colors.black, size: 28),
            onPressed: _showAddInterventionDialog,
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _fetchError != null
              ? Center(
                  child: Padding(
                    padding: const EdgeInsets.all(32),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text(_fetchError!, textAlign: TextAlign.center, style: GoogleFonts.inter(fontWeight: FontWeight.bold)),
                        const SizedBox(height: 16),
                        ComicButton(label: 'RETRY', backgroundColor: AppColors.senseiPurple, onPressed: _fetchData),
                      ],
                    ),
                  ),
                )
              : SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // ── STATS GRID ──
                  if (_interventions.isNotEmpty)
                    Padding(
                      padding: const EdgeInsets.only(bottom: 24),
                      child: GridView.count(
                        crossAxisCount: 2,
                        crossAxisSpacing: 16,
                        mainAxisSpacing: 16,
                        shrinkWrap: true,
                        physics: const NeverScrollableScrollPhysics(),
                        childAspectRatio: 1.5,
                        children: [
                          _buildStatCard('Total Active', _interventions.length, AppColors.senseiBlue),
                          _buildStatCard('Successful', _interventions.where((i) => i['status'] == 'resolved').length, AppColors.senseiGreen),
                          _buildStatCard('In Progress', _interventions.where((i) => i['status'] == 'in_progress').length, AppColors.senseiOrange),
                          _buildStatCard('High Urgency', _interventions.where((i) => i['urgency'] == 'high').length, AppColors.senseiPink),
                        ],
                      ),
                    ),

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
                              color: _filter == tab['key'] ? AppColors.senseiPurple : Colors.white,
                              border: Border.all(color: Colors.black, width: 2),
                            ),
                            child: Text(
                              tab['label']!,
                              style: GoogleFonts.spaceMono(
                                fontSize: 12,
                                fontWeight: FontWeight.bold,
                                color: _filter == tab['key'] ? Colors.white : Colors.black,
                              ),
                            ),
                          ),
                        ),
                      )).toList(),
                    ),
                  ),
                  const SizedBox(height: 16),
                  
                  Container(
                    decoration: BoxDecoration(
                      color: Colors.white,
                      border: Border.all(color: Colors.black, width: 2),
                    ),
                    child: TextField(
                      onChanged: (val) => setState(() => _searchQuery = val),
                      decoration: InputDecoration(
                        hintText: 'Search interventions...',
                        hintStyle: GoogleFonts.fredoka(color: Colors.grey),
                        prefixIcon: const Icon(Icons.search, color: Colors.black),
                        border: InputBorder.none,
                        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                      ),
                      style: GoogleFonts.fredoka(color: Colors.black),
                    ),
                  ),
                  const SizedBox(height: 24),

                  ...filtered.map((item) {
                    final status = item['status'] as String? ?? 'sent';
                    final color = _getStatusColor(status);
                    
                    return Padding(
                      padding: const EdgeInsets.only(bottom: 16),
                      child: BrutalistCard(
                        backgroundColor: color,
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Row(
                                  children: [
                                    CircleAvatar(
                                      radius: 16,
                                      backgroundColor: Colors.white,
                                      child: Text((item['student']?['name'] ?? '?')[0].toString().toUpperCase(), style: GoogleFonts.fredoka(fontWeight: FontWeight.bold, color: Colors.black)),
                                    ),
                                    const SizedBox(width: 8),
                                    Text(item['student']?['name'] ?? 'Unknown', style: GoogleFonts.fredoka(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.black)),
                                  ],
                                ),
                                Text(item['date'] ?? '', style: GoogleFonts.spaceMono(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.black87)),
                              ],
                            ),
                            const SizedBox(height: 12),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                              color: Colors.black,
                              child: Text((item['type'] ?? 'Academic').toString().toUpperCase(), style: GoogleFonts.spaceMono(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.white)),
                            ),
                            const SizedBox(height: 8),
                            Text(item['message'] ?? '', style: GoogleFonts.fredoka(fontSize: 14, color: Colors.black)),
                            const SizedBox(height: 16),
                            const Divider(color: Colors.black, thickness: 2),
                            const SizedBox(height: 8),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.end,
                              children: [
                                if (status == 'sent')
                                  ComicButton(
                                    onPressed: () => _updateStatus(item['_id'], 'in_progress'),
                                    backgroundColor: AppColors.senseiCyan,
                                    label: 'START',
                                    icon: Icons.play_arrow,
                                  ),
                                if (status == 'in_progress')
                                  ComicButton(
                                    onPressed: () => _updateStatus(item['_id'], 'resolved'),
                                    backgroundColor: AppColors.senseiGreen,
                                    label: 'RESOLVE',
                                    icon: Icons.check,
                                  ),
                                if (status == 'resolved')
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                                    decoration: BoxDecoration(color: Colors.white, border: Border.all(color: Colors.black, width: 2)),
                                    child: Text('RESOLVED 🌟', style: GoogleFonts.spaceMono(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.black)),
                                  ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    );
                  }),
                ],
              ),
            ),
    );
  }

  Widget _buildStatCard(String label, int value, Color color) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.2),
        border: Border.all(color: AppColors.brutalBlack, width: 2),
        boxShadow: const [BoxShadow(color: AppColors.brutalBlack, offset: Offset(2, 2))],
      ),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Text(
            value.toString(),
            style: GoogleFonts.fredoka(fontSize: 32, fontWeight: FontWeight.w900, color: AppColors.brutalBlack),
          ),
          const SizedBox(height: 4),
          Text(
            label.toUpperCase(),
            style: GoogleFonts.spaceMono(fontSize: 10, fontWeight: FontWeight.bold, color: AppColors.brutalBlack),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }
}
