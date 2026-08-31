import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../theme/neubrutalist_widgets.dart';
import '../../theme/app_colors.dart';
import '../../services/api_service.dart';
import 'upload_csv_dialog.dart';

class AssessmentsScreen extends ConsumerStatefulWidget {
  const AssessmentsScreen({super.key});

  @override
  ConsumerState<AssessmentsScreen> createState() => _AssessmentsScreenState();
}

class _AssessmentsScreenState extends ConsumerState<AssessmentsScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  bool _isLoading = true;
  String? _fetchError;
  List<dynamic> _exams = [];
  List<dynamic> _assignments = [];
  List<dynamic> _classes = [];
  String? _actionId;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _fetchData();
  }

  List<dynamic> _parseListData(dynamic data, String mapKey) {
    if (data == null) return [];
    if (data is String) {
      try {
        final decoded = jsonDecode(data);
        return _parseListData(decoded, mapKey);
      } catch (e) {
        debugPrint('Failed to decode JSON string: $e');
        return [];
      }
    }
    if (data is Map) {
      return data[mapKey] ?? [];
    }
    if (data is List) {
      return data;
    }
    return [];
  }

  Future<void> _fetchData() async {
    if (!mounted) return;
    setState(() {
      _isLoading = true;
      _fetchError = null;
    });
    try {
      final api = ApiService();

      final results = await Future.wait([
        api.get('/api/teacher/exams'),
        api.get('/api/teacher/assessments'),
        api.get('/api/teacher/classes'),
      ]);

      if (mounted) {
        setState(() {
          _exams = _parseListData(results[0].data, 'exams');
          _assignments = _parseListData(results[1].data, 'assignments');
          _classes = _parseListData(results[2].data, 'classes');
          _isLoading = false;
        });
      }
    } catch (e) {
      debugPrint('Main fetch assessments error: $e');
      if (mounted) {
        setState(() {
          _fetchError = 'Failed to load assessments. Check your connection and try again.';
          _isLoading = false;
        });
      }
    }
  }

  Future<void> _uploadCSV() async {
    final result = await showDialog<bool>(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => const UploadCsvDialog(),
    );
    if (result == true) {
      _fetchData();
    }
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _publishExam(String id) async {
    setState(() => _actionId = id);
    try {
      await ApiService().patch('/api/teacher/exams/$id/publish');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Exam published successfully!')));
        _fetchData();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed to publish: $e')));
      }
    } finally {
      if (mounted) setState(() => _actionId = null);
    }
  }

  Future<void> _autoGradeAssignment(String id) async {
    setState(() => _actionId = id);
    try {
      await ApiService().post('/api/teacher/assessments/$id/grade');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('AI Auto-Grading complete!')));
        _fetchData();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Grading failed: $e')));
      }
    } finally {
      if (mounted) setState(() => _actionId = null);
    }
  }

  void _showCreateExamDialog() {
    final titleCtrl = TextEditingController();
    final subjectCtrl = TextEditingController();
    final dateCtrl = TextEditingController();
    final timeCtrl = TextEditingController();
    final durationCtrl = TextEditingController(text: '2 hrs');
    final maxMarksCtrl = TextEditingController(text: '100');
    String? selectedClassId;

    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (context, setDialogState) => AlertDialog(
          backgroundColor: Colors.white,
          shape: const RoundedRectangleBorder(
            side: BorderSide(color: Colors.black, width: 4),
            borderRadius: BorderRadius.zero,
          ),
          title: Text(
            'SCHEDULE NEW EXAM',
            style: GoogleFonts.fredoka(fontWeight: FontWeight.bold, fontSize: 20, color: AppColors.brutalBlack),
          ),
          content: Scrollbar(
            child: SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  if (_classes.isNotEmpty) ...[
                    Text('Select Class *', style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 12, color: Colors.black)),
                    const SizedBox(height: 4),
                    DropdownButtonFormField<String>(
                      value: selectedClassId,
                      hint: const Text('Select Class'),
                      decoration: const InputDecoration(
                        border: OutlineInputBorder(borderRadius: BorderRadius.zero, borderSide: BorderSide(color: Colors.black, width: 2)),
                        focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.zero, borderSide: BorderSide(color: AppColors.brutalCyan, width: 2)),
                        filled: true,
                        fillColor: Colors.white,
                        isDense: true,
                      ),
                      items: _classes.map((c) {
                        return DropdownMenuItem<String>(
                          value: c['_id']?.toString(),
                          child: Text(c['name']?.toString() ?? 'Class'),
                        );
                      }).toList(),
                      onChanged: (val) => setDialogState(() => selectedClassId = val),
                    ),
                    const SizedBox(height: 12),
                  ],
                  Text('Title *', style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 12, color: Colors.black)),
                  const SizedBox(height: 4),
                  TextField(
                    controller: titleCtrl,
                    decoration: const InputDecoration(
                      hintText: 'Enter title',
                      border: OutlineInputBorder(borderRadius: BorderRadius.zero, borderSide: BorderSide(color: Colors.black, width: 2)),
                      focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.zero, borderSide: BorderSide(color: AppColors.brutalCyan, width: 2)),
                      filled: true,
                      fillColor: Colors.white,
                    ),
                  ),
                  const SizedBox(height: 12),
                  Text('Subject *', style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 12, color: Colors.black)),
                  const SizedBox(height: 4),
                  TextField(
                    controller: subjectCtrl,
                    decoration: const InputDecoration(
                      hintText: 'Enter subject',
                      border: OutlineInputBorder(borderRadius: BorderRadius.zero, borderSide: BorderSide(color: Colors.black, width: 2)),
                      focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.zero, borderSide: BorderSide(color: AppColors.brutalCyan, width: 2)),
                      filled: true,
                      fillColor: Colors.white,
                    ),
                  ),
                  const SizedBox(height: 12),
                  Text('Date (YYYY-MM-DD) *', style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 12, color: Colors.black)),
                  const SizedBox(height: 4),
                  TextField(
                    controller: dateCtrl,
                    readOnly: true,
                    decoration: const InputDecoration(
                      hintText: 'Select date',
                      suffixIcon: Icon(Icons.calendar_today, color: Colors.black),
                      border: OutlineInputBorder(borderRadius: BorderRadius.zero, borderSide: BorderSide(color: Colors.black, width: 2)),
                      focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.zero, borderSide: BorderSide(color: AppColors.brutalCyan, width: 2)),
                      filled: true,
                      fillColor: Colors.white,
                    ),
                    onTap: () async {
                      final date = await showDatePicker(
                        context: context,
                        initialDate: DateTime.now().add(const Duration(days: 1)),
                        firstDate: DateTime.now(),
                        lastDate: DateTime.now().add(const Duration(days: 365)),
                      );
                      if (date != null) {
                        setDialogState(() {
                          dateCtrl.text = date.toString().split(' ')[0];
                        });
                      }
                    },
                  ),
                  const SizedBox(height: 12),
                  Text('Time (HH:MM) *', style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 12, color: Colors.black)),
                  const SizedBox(height: 4),
                  TextField(
                    controller: timeCtrl,
                    readOnly: true,
                    decoration: const InputDecoration(
                      hintText: 'Select time',
                      suffixIcon: Icon(Icons.access_time, color: Colors.black),
                      border: OutlineInputBorder(borderRadius: BorderRadius.zero, borderSide: BorderSide(color: Colors.black, width: 2)),
                      focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.zero, borderSide: BorderSide(color: AppColors.brutalCyan, width: 2)),
                      filled: true,
                      fillColor: Colors.white,
                    ),
                    onTap: () async {
                      final time = await showTimePicker(
                        context: context,
                        initialTime: const TimeOfDay(hour: 10, minute: 0),
                      );
                      if (time != null) {
                        setDialogState(() {
                          timeCtrl.text = '${time.hour.toString().padLeft(2, '0')}:${time.minute.toString().padLeft(2, '0')}';
                        });
                      }
                    },
                  ),
                  const SizedBox(height: 12),
                  Text('Duration', style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 12, color: Colors.black)),
                  const SizedBox(height: 4),
                  TextField(
                    controller: durationCtrl,
                    decoration: const InputDecoration(
                      hintText: 'e.g. 2 hrs',
                      border: OutlineInputBorder(borderRadius: BorderRadius.zero, borderSide: BorderSide(color: Colors.black, width: 2)),
                      focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.zero, borderSide: BorderSide(color: AppColors.brutalCyan, width: 2)),
                      filled: true,
                      fillColor: Colors.white,
                    ),
                  ),
                  const SizedBox(height: 12),
                  Text('Max Marks', style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 12, color: Colors.black)),
                  const SizedBox(height: 4),
                  TextField(
                    controller: maxMarksCtrl,
                    keyboardType: TextInputType.number,
                    decoration: const InputDecoration(
                      hintText: 'e.g. 100',
                      border: OutlineInputBorder(borderRadius: BorderRadius.zero, borderSide: BorderSide(color: Colors.black, width: 2)),
                      focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.zero, borderSide: BorderSide(color: AppColors.brutalCyan, width: 2)),
                      filled: true,
                      fillColor: Colors.white,
                    ),
                  ),
                ],
              ),
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx),
              child: const Text('CANCEL', style: TextStyle(color: Colors.black, fontWeight: FontWeight.bold)),
            ),
            ElevatedButton(
              style: ElevatedButton.styleFrom(backgroundColor: AppColors.comicCyan, side: const BorderSide(color: Colors.black, width: 2), shape: const RoundedRectangleBorder(borderRadius: BorderRadius.zero)),
              onPressed: () async {
                final title = titleCtrl.text.trim();
                final subject = subjectCtrl.text.trim();
                final date = dateCtrl.text.trim();
                final time = timeCtrl.text.trim();

                if (title.isEmpty || subject.isEmpty || date.isEmpty || time.isEmpty || selectedClassId == null) {
                  ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Please fill all required (*) fields')));
                  return;
                }

                try {
                  await ApiService().post('/api/teacher/exams/schedule', data: {
                    'title': title,
                    'classId': selectedClassId,
                    'subject': subject,
                    'date': date,
                    'time': time,
                    'duration': durationCtrl.text.trim(),
                    'maxMarks': int.tryParse(maxMarksCtrl.text.trim()) ?? 100,
                  });
                  if (mounted) {
                    Navigator.pop(ctx);
                    ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Exam scheduled!')));
                    _fetchData();
                  }
                } catch (e) {
                  if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed to create exam: $e')));
                }
              },
              child: const Text('CREATE', style: TextStyle(color: Colors.black, fontWeight: FontWeight.bold)),
            ),
          ],
        ),
      ),
    );
  }

  void _showCreateAssignmentDialog() {
    final titleCtrl = TextEditingController();
    final subjectCtrl = TextEditingController();
    final dateCtrl = TextEditingController();
    final briefCtrl = TextEditingController();
    String? selectedClassId;

    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (context, setDialogState) => AlertDialog(
          backgroundColor: Colors.white,
          shape: const RoundedRectangleBorder(
            side: BorderSide(color: Colors.black, width: 4),
            borderRadius: BorderRadius.zero,
          ),
          title: Text(
            'CREATE NEW ASSIGNMENT',
            style: GoogleFonts.fredoka(fontWeight: FontWeight.bold, fontSize: 20, color: AppColors.brutalBlack),
          ),
          content: Scrollbar(
            child: SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  if (_classes.isNotEmpty) ...[
                    Text('Select Class *', style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 12, color: Colors.black)),
                    const SizedBox(height: 4),
                    DropdownButtonFormField<String>(
                      value: selectedClassId,
                      hint: const Text('Select Class'),
                      decoration: const InputDecoration(
                        border: OutlineInputBorder(borderRadius: BorderRadius.zero, borderSide: BorderSide(color: Colors.black, width: 2)),
                        focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.zero, borderSide: BorderSide(color: AppColors.brutalCyan, width: 2)),
                        filled: true,
                        fillColor: Colors.white,
                        isDense: true,
                      ),
                      items: _classes.map((c) {
                        return DropdownMenuItem<String>(
                          value: c['_id']?.toString(),
                          child: Text(c['name']?.toString() ?? 'Class'),
                        );
                      }).toList(),
                      onChanged: (val) => setDialogState(() => selectedClassId = val),
                    ),
                    const SizedBox(height: 12),
                  ],
                  Text('Title *', style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 12, color: Colors.black)),
                  const SizedBox(height: 4),
                  TextField(
                    controller: titleCtrl,
                    decoration: const InputDecoration(
                      hintText: 'Enter title',
                      border: OutlineInputBorder(borderRadius: BorderRadius.zero, borderSide: BorderSide(color: Colors.black, width: 2)),
                      focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.zero, borderSide: BorderSide(color: AppColors.brutalCyan, width: 2)),
                      filled: true,
                      fillColor: Colors.white,
                    ),
                  ),
                  const SizedBox(height: 12),
                  Text('Subject *', style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 12, color: Colors.black)),
                  const SizedBox(height: 4),
                  TextField(
                    controller: subjectCtrl,
                    decoration: const InputDecoration(
                      hintText: 'Enter subject',
                      border: OutlineInputBorder(borderRadius: BorderRadius.zero, borderSide: BorderSide(color: Colors.black, width: 2)),
                      focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.zero, borderSide: BorderSide(color: AppColors.brutalCyan, width: 2)),
                      filled: true,
                      fillColor: Colors.white,
                    ),
                  ),
                  const SizedBox(height: 12),
                  Text('Due Date *', style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 12, color: Colors.black)),
                  const SizedBox(height: 4),
                  TextField(
                    controller: dateCtrl,
                    readOnly: true,
                    decoration: const InputDecoration(
                      hintText: 'Select date',
                      suffixIcon: Icon(Icons.calendar_today, color: Colors.black),
                      border: OutlineInputBorder(borderRadius: BorderRadius.zero, borderSide: BorderSide(color: Colors.black, width: 2)),
                      focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.zero, borderSide: BorderSide(color: AppColors.brutalCyan, width: 2)),
                      filled: true,
                      fillColor: Colors.white,
                    ),
                    onTap: () async {
                      final date = await showDatePicker(
                        context: context,
                        initialDate: DateTime.now().add(const Duration(days: 1)),
                        firstDate: DateTime.now(),
                        lastDate: DateTime.now().add(const Duration(days: 365)),
                      );
                      if (date != null) {
                        setDialogState(() {
                          dateCtrl.text = date.toString().split(' ')[0];
                        });
                      }
                    },
                  ),
                  const SizedBox(height: 12),
                  Text('Instructions / Brief *', style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 12, color: Colors.black)),
                  const SizedBox(height: 4),
                  TextField(
                    controller: briefCtrl,
                    maxLines: 3,
                    decoration: const InputDecoration(
                      hintText: 'Enter instructions',
                      border: OutlineInputBorder(borderRadius: BorderRadius.zero, borderSide: BorderSide(color: Colors.black, width: 2)),
                      focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.zero, borderSide: BorderSide(color: AppColors.brutalCyan, width: 2)),
                      filled: true,
                      fillColor: Colors.white,
                    ),
                  ),
                ],
              ),
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx),
              child: const Text('CANCEL', style: TextStyle(color: Colors.black, fontWeight: FontWeight.bold)),
            ),
            ElevatedButton(
              style: ElevatedButton.styleFrom(backgroundColor: AppColors.comicCyan, side: const BorderSide(color: Colors.black, width: 2), shape: const RoundedRectangleBorder(borderRadius: BorderRadius.zero)),
              onPressed: () async {
                final title = titleCtrl.text.trim();
                final subject = subjectCtrl.text.trim();
                final date = dateCtrl.text.trim();
                final brief = briefCtrl.text.trim();

                if (title.isEmpty || subject.isEmpty || date.isEmpty || brief.isEmpty || selectedClassId == null) {
                  ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Please fill all required (*) fields')));
                  return;
                }

                try {
                  await ApiService().post('/api/teacher/assessments', data: {
                    'title': title,
                    'classId': selectedClassId,
                    'subject': subject,
                    'dueDate': date,
                    'brief': brief,
                  });
                  if (mounted) {
                    Navigator.pop(ctx);
                    ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Assignment created!')));
                    _fetchData();
                  }
                } catch (e) {
                  if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed to create assignment: $e')));
                }
              },
              child: const Text('CREATE', style: TextStyle(color: Colors.black, fontWeight: FontWeight.bold)),
            ),
          ],
        ),
      ),
    );
  }

  void _showAiExplainabilityReport(Map<String, dynamic> sub) {
    final name = sub['studentId'] is Map ? (sub['studentId']['name'] ?? 'Student') : 'Student';
    final aiScore = sub['aiScore'] ?? 0;
    final rationale = sub['historyContext'] is Map ? (sub['historyContext']['aiMemory'] ?? sub['rationale'] ?? 'AI evaluation complete.') : (sub['rationale'] ?? 'AI evaluation complete.');

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: const Color(0xFFFFFAF0),
        shape: const RoundedRectangleBorder(
          side: BorderSide(color: Colors.black, width: 4),
          borderRadius: BorderRadius.zero,
        ),
        title: Row(
          children: [
            const Icon(Icons.psychology, color: AppColors.brutalCyan, size: 28),
            const SizedBox(width: 8),
            Expanded(
              child: Text(
                'AI EXPLAINABILITY REPORT',
                style: GoogleFonts.spaceMono(fontWeight: FontWeight.bold, fontSize: 16),
              ),
            ),
          ],
        ),
        content: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(color: Colors.white, border: Border.all(color: Colors.black, width: 2)),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text('Student: $name', style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 14)),
                    Text('Score: $aiScore%', style: GoogleFonts.inter(fontWeight: FontWeight.w900, fontSize: 16, color: AppColors.brutalCyan)),
                  ],
                ),
              ),
              const SizedBox(height: 16),
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(color: AppColors.brutalistCyan, border: Border.all(color: Colors.black, width: 2)),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('RATIONALE STATEMENT', style: GoogleFonts.spaceMono(fontWeight: FontWeight.bold, fontSize: 12, color: Colors.white)),
                    const SizedBox(height: 8),
                    Text(rationale.toString(), style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.bold, color: Colors.black)),
                  ],
                ),
              ),
              const SizedBox(height: 16),
              if (sub['confidence'] != null || sub['auditStatus'] != null)
                Row(
                  children: [
                    if (sub['confidence'] != null)
                      Expanded(
                        child: Container(
                          padding: const EdgeInsets.all(8),
                          decoration: BoxDecoration(color: Colors.white, border: Border.all(color: Colors.black, width: 2)),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text('CONFIDENCE', style: GoogleFonts.spaceMono(fontSize: 10, fontWeight: FontWeight.bold)),
                              Text('${sub['confidence']}%', style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 14)),
                            ],
                          ),
                        ),
                      ),
                    if (sub['confidence'] != null && sub['auditStatus'] != null) const SizedBox(width: 8),
                    if (sub['auditStatus'] != null)
                      Expanded(
                        child: Container(
                          padding: const EdgeInsets.all(8),
                          decoration: BoxDecoration(color: Colors.white, border: Border.all(color: Colors.black, width: 2)),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text('AUDIT STATUS', style: GoogleFonts.spaceMono(fontSize: 10, fontWeight: FontWeight.bold)),
                              Text(sub['auditStatus'].toString(), style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 14)),
                            ],
                          ),
                        ),
                      ),
                  ],
                ),
            ],
          ),
        ),
        actions: [
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: Colors.white, side: const BorderSide(color: Colors.black, width: 2), shape: const RoundedRectangleBorder(borderRadius: BorderRadius.zero)),
            onPressed: () => Navigator.pop(ctx),
            child: const Text('CLOSE', style: TextStyle(color: Colors.black, fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }

  void _showAssignmentResults(Map<String, dynamic> assignment) {
    final subs = _parseListData(assignment['submissions'], 'submissions');
    final title = assignment['title'] ?? 'Assignment';

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => StatefulBuilder(
        builder: (context, setModalState) => Container(
          margin: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.white,
            border: Border.all(color: Colors.black, width: 4),
            boxShadow: const [BoxShadow(color: Colors.black, offset: Offset(4, 4))],
          ),
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(
                    child: Text(
                      'RESULTS: ${title.toUpperCase()}',
                      style: GoogleFonts.fredoka(fontWeight: FontWeight.bold, fontSize: 18),
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.close, color: Colors.black),
                    onPressed: () => Navigator.pop(ctx),
                  ),
                ],
              ),
              const Divider(color: Colors.black, thickness: 3),
              const SizedBox(height: 12),
              if (subs.isEmpty)
                const Padding(
                  padding: EdgeInsets.symmetric(vertical: 32),
                  child: Center(child: Text('No submissions yet.', style: TextStyle(fontWeight: FontWeight.bold))),
                )
              else
                Expanded(
                  child: ListView.builder(
                    itemCount: subs.length,
                    itemBuilder: (context, idx) {
                      final sub = subs[idx];
                      final studentName = sub['studentId'] is Map ? (sub['studentId']['name'] ?? 'Unknown') : 'Student';
                      final score = sub['aiScore'] ?? 0;
                      final feedback = sub['feedback'] ?? 'Reviewed successfully.';
                      final flags = _parseListData(sub['flags'], 'flags');

                      return Container(
                        margin: const EdgeInsets.only(bottom: 12),
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(color: AppColors.brutalBg, border: Border.all(color: Colors.black, width: 2)),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text(studentName, style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 16)),
                                Text('Score: $score%', style: GoogleFonts.inter(fontWeight: FontWeight.w900, fontSize: 16)),
                              ],
                            ),
                            const SizedBox(height: 8),
                            Text('Feedback: $feedback', style: GoogleFonts.inter(fontSize: 13, color: Colors.grey.shade800)),
                            if (flags.isNotEmpty) ...[
                              const SizedBox(height: 8),
                              Wrap(
                                spacing: 6,
                                children: flags.map<Widget>((f) {
                                  final type = f['type']?.toString().toUpperCase() ?? 'FLAG';
                                  return Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                    decoration: BoxDecoration(color: AppColors.comicYellow, border: Border.all(color: Colors.black, width: 1.5)),
                                    child: Text(type, style: const TextStyle(fontSize: 9, fontWeight: FontWeight.bold)),
                                  );
                                }).toList(),
                              ),
                            ],
                            const SizedBox(height: 12),
                            ComicButton(
                              label: 'AI RATIONALE',
                              backgroundColor: Colors.white,
                              onPressed: () {
                                _showAiExplainabilityReport(sub);
                              },
                            ),
                          ],
                        ),
                      );
                    },
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: AppColors.brutalBg,
      appBar: AppBar(
        title: Text('ASSESSMENTS 📝', style: GoogleFonts.fredoka(fontWeight: FontWeight.bold)),
        backgroundColor: Colors.transparent,
        elevation: 0,
        bottom: TabBar(
          controller: _tabController,
          labelColor: Colors.black,
          unselectedLabelColor: Colors.grey,
          labelStyle: GoogleFonts.spaceMono(fontWeight: FontWeight.bold, fontSize: 12),
          indicator: BoxDecoration(
            color: AppColors.comicCyan,
            border: Border.all(color: Colors.black, width: 2),
          ),
          tabs: const [
            Tab(text: 'SCHEDULE EXAMS'),
            Tab(text: 'GRADE SUBMISSIONS'),
          ],
        ),
      ),
      body: _fetchError != null
          ? Center(
              child: Padding(
                padding: const EdgeInsets.all(32),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(_fetchError!, textAlign: TextAlign.center, style: GoogleFonts.inter(fontWeight: FontWeight.bold)),
                    const SizedBox(height: 16),
                    ComicButton(label: 'RETRY', backgroundColor: AppColors.comicCyan, onPressed: _fetchData),
                  ],
                ),
              ),
            )
          : TabBarView(
        controller: _tabController,
        children: [
          _buildScheduleTab(isDark),
          _buildGradingTab(isDark),
        ],
      ),
    );
  }

  Widget _buildScheduleTab(bool isDark) {
    if (_isLoading) return const Center(child: CircularProgressIndicator());
    final upcoming = _exams.where((a) => a['status'] != 'graded').toList();

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text('UPCOMING EXAMS', style: GoogleFonts.fredoka(fontSize: 20, fontWeight: FontWeight.bold)),
              Row(
                children: [
                  BrutalistButton(
                    text: '↑ CSV',
                    onTap: _uploadCSV,
                    backgroundColor: Colors.white,
                  ),
                  const SizedBox(width: 8),
                  BrutalistButton(
                    text: '+ NEW',
                    onTap: () => _showCreateExamDialog(),
                    backgroundColor: AppColors.comicCyan,
                  ),
                ],
              ),
            ],
          ),
          const SizedBox(height: 16),
          if (upcoming.isEmpty)
            Padding(
              padding: const EdgeInsets.all(24),
              child: Text('No upcoming exams.', style: GoogleFonts.spaceMono(fontWeight: FontWeight.bold), textAlign: TextAlign.center),
            ),
          ...upcoming.map((a) {
            final dateStr = a['date'] != null ? a['date'].toString() : 'TBD';
            final className = a['className'] ?? 'All Classes';
            final statusStr = (a['status'] ?? 'draft').toString().toUpperCase();
            final isDraft = statusStr == 'DRAFT';
            
            return Padding(
              padding: const EdgeInsets.only(bottom: 16),
              child: BrutalistCard(
                backgroundColor: AppColors.brutalistCyan,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                      color: Colors.black,
                      child: Text(statusStr, style: GoogleFonts.spaceMono(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.white)),
                    ),
                    const SizedBox(height: 12),
                    Text(a['title'] ?? 'Untitled', style: GoogleFonts.fredoka(fontSize: 18, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 4),
                    Text('Class: $className · Subject: ${a['subject'] ?? 'General'}', style: GoogleFonts.spaceMono(fontSize: 12, color: Colors.grey.shade800)),
                    const SizedBox(height: 12),
                    Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(color: Colors.white, border: Border.all(color: Colors.black)),
                      child: Row(
                        children: [
                          const Icon(Icons.calendar_today, size: 16),
                          const SizedBox(width: 8),
                          Text('$dateStr · ${a['time'] ?? '10:00'} · ${a['duration'] ?? '2 hrs'}', style: GoogleFonts.fredoka(fontWeight: FontWeight.bold)),
                        ],
                      ),
                    ),
                    if (isDraft) ...[
                      const SizedBox(height: 16),
                      ComicButton(
                        label: 'PUBLISH EXAM',
                        onPressed: _actionId == a['_id'] ? null : () => _publishExam(a['_id']),
                        backgroundColor: AppColors.comicYellow,
                        isLoading: _actionId == a['_id'],
                      ),
                    ],
                  ],
                ),
              ),
            );
          }),
        ],
      ),
    );
  }

  Widget _buildGradingTab(bool isDark) {
    if (_isLoading) return const Center(child: CircularProgressIndicator());
    final assignmentsList = _assignments;

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text('MY ASSIGNMENTS', style: GoogleFonts.fredoka(fontSize: 20, fontWeight: FontWeight.bold)),
              BrutalistButton(
                text: '+ NEW',
                onTap: () => _showCreateAssignmentDialog(),
                backgroundColor: AppColors.comicCyan,
              ),
            ],
          ),
          const SizedBox(height: 16),
          if (assignmentsList.isEmpty)
            Padding(
              padding: const EdgeInsets.all(24),
              child: Text('No assignments yet.', style: GoogleFonts.spaceMono(fontWeight: FontWeight.bold), textAlign: TextAlign.center),
            ),
          ...assignmentsList.map((a) {
            final subs = _parseListData(a['submissions'], 'submissions');
            final subsCount = subs.length;
            final isGraded = a['status']?.toString().toLowerCase() == 'graded';
            final dueDateStr = a['dueDate'] != null ? a['dueDate'].toString().split('T')[0] : 'TBD';

            return Padding(
              padding: const EdgeInsets.only(bottom: 16),
              child: BrutalistCard(
                backgroundColor: AppColors.brutalistCyan,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Expanded(child: Text(a['title'] ?? 'Untitled', style: GoogleFonts.fredoka(fontSize: 18, fontWeight: FontWeight.bold))),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                          color: Colors.black,
                          child: Text(
                            isGraded ? 'GRADED' : 'ACTIVE',
                            style: GoogleFonts.spaceMono(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.white),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Subject: ${a['subject'] ?? 'General'} · Submissions: $subsCount · Due: $dueDateStr',
                      style: GoogleFonts.spaceMono(fontSize: 12, color: Colors.grey.shade800),
                    ),
                    const SizedBox(height: 16),
                    Row(
                      children: [
                        if (!isGraded && subsCount > 0) ...[
                          Expanded(
                            child: ComicButton(
                              label: _actionId == a['_id'] ? 'GRADING...' : 'GRADE ALL',
                              backgroundColor: AppColors.comicYellow,
                              onPressed: _actionId == a['_id'] ? null : () => _autoGradeAssignment(a['_id']),
                              isLoading: _actionId == a['_id'],
                            ),
                          ),
                          const SizedBox(width: 12),
                        ],
                        Expanded(
                          child: ComicButton(
                            label: 'RESULTS',
                            backgroundColor: Colors.white,
                            onPressed: () => _showAssignmentResults(a),
                          ),
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
    );
  }
}
