import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:file_picker/file_picker.dart';
import 'package:dio/dio.dart';
import '../../services/api_service.dart';
import '../../services/socket_service.dart';
import '../../theme/app_colors.dart';
import '../../theme/neubrutalist_widgets.dart';

class UploadCsvDialog extends StatefulWidget {
  const UploadCsvDialog({super.key});

  @override
  State<UploadCsvDialog> createState() => _UploadCsvDialogState();
}

class _UploadCsvDialogState extends State<UploadCsvDialog> {
  List<dynamic> _classes = [];
  String? _selectedClassId;
  PlatformFile? _selectedFile;
  bool _isLoadingClasses = true;
  bool _isUploading = false;
  bool _isDone = false;
  String? _uploadId;

  final List<Map<String, dynamic>> _pipelineStages = [
    {'label': 'Column Normaliser', 'status': 'waiting', 'pct': 0, 'emoji': '📋'},
    {'label': 'Performance Analyser', 'status': 'waiting', 'pct': 0, 'emoji': '📊'},
    {'label': 'Risk Detector', 'status': 'waiting', 'pct': 0, 'emoji': '⚠️'},
    {'label': 'AI Insight Generator', 'status': 'waiting', 'pct': 0, 'emoji': '🤖'},
    {'label': 'Auto Interventions', 'status': 'waiting', 'pct': 0, 'emoji': '📧'},
    {'label': 'Leaderboard Update', 'status': 'waiting', 'pct': 0, 'emoji': '🏆'},
  ];

  @override
  void initState() {
    super.initState();
    _fetchClasses();
    _setupSocket();
  }

  Future<void> _fetchClasses() async {
    try {
      final res = await ApiService().get('/api/teacher/classes');
      if (mounted) {
        setState(() {
          _classes = res.data is Map ? (res.data['classes'] ?? []) : (res.data is List ? res.data : []);
          if (_classes.isNotEmpty) {
            _selectedClassId = _classes[0]['_id']?.toString();
          }
          _isLoadingClasses = false;
        });
      }
    } catch (e) {
      if (mounted) setState(() => _isLoadingClasses = false);
    }
  }

  void _setupSocket() {
    SocketService().on('/teacher', 'pipeline:progress', (data) {
      if (!mounted || data == null || data['uploadId'] != _uploadId) return;
      setState(() {
        final step = data['step'] as int;
        if (step >= 0 && step < _pipelineStages.length) {
          _pipelineStages[step]['status'] = data['status'];
          _pipelineStages[step]['pct'] = data['progress'] ?? 0;
          _pipelineStages[step]['count'] = data['count'];
        }
      });
    });
    SocketService().on('/teacher', 'pipeline:done', (data) {
      if (!mounted || data == null || data['uploadId'] != _uploadId) return;
      setState(() => _isDone = true);
    });
  }

  @override
  void dispose() {
    SocketService().off('/teacher', 'pipeline:progress');
    SocketService().off('/teacher', 'pipeline:done');
    super.dispose();
  }

  Future<void> _pickFile() async {
    final result = await FilePicker.platform.pickFiles(
      type: FileType.custom,
      allowedExtensions: ['csv'],
      withData: true,
    );
    if (result != null && result.files.isNotEmpty) {
      setState(() => _selectedFile = result.files.first);
    }
  }

  Future<void> _startUpload() async {
    if (_selectedFile == null || _selectedClassId == null) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Select class and file first')));
      return;
    }
    setState(() => _isUploading = true);

    try {
      MultipartFile csvFile;
      if (_selectedFile!.bytes != null) {
        csvFile = MultipartFile.fromBytes(_selectedFile!.bytes!, filename: _selectedFile!.name);
      } else if (_selectedFile!.path != null) {
        csvFile = await MultipartFile.fromFile(_selectedFile!.path!, filename: _selectedFile!.name);
      } else {
        throw Exception('No file data available');
      }

      final formData = FormData.fromMap({
        'csv': csvFile,
        'classId': _selectedClassId,
      });

      final res = await ApiService().post('/api/teacher/upload', data: formData);
      final newUploadId = res.data['uploadId'];

      setState(() {
        _uploadId = newUploadId;
      });

      SocketService().emit('/teacher', 'pipeline:start', {'uploadId': newUploadId});
    } catch (e) {
      setState(() => _isUploading = false);
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Upload failed')));
    }
  }

  @override
  Widget build(BuildContext context) {
    return Dialog(
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        side: BorderSide(color: Colors.black, width: 4),
        borderRadius: BorderRadius.zero,
      ),
      child: Container(
        width: 400,
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text('📎 UPLOAD CSV', style: GoogleFonts.inter(fontSize: 20, fontWeight: FontWeight.w900)),
                IconButton(
                  icon: const Icon(Icons.close),
                  onPressed: () {
                    if (_isDone) {
                      Navigator.pop(context, true); // return true if finished
                    } else {
                      Navigator.pop(context);
                    }
                  },
                ),
              ],
            ),
            const SizedBox(height: 16),
            if (!_isUploading && !_isDone) ...[
              Text('Target Class *', style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w900)),
              const SizedBox(height: 4),
              if (_isLoadingClasses)
                const LinearProgressIndicator(color: AppColors.brutalBlack)
              else
                DropdownButtonFormField<String>(
                  value: _selectedClassId,
                  decoration: const InputDecoration(
                    border: OutlineInputBorder(borderSide: BorderSide(color: Colors.black, width: 2), borderRadius: BorderRadius.zero),
                    isDense: true,
                  ),
                  items: _classes.map((c) => DropdownMenuItem<String>(
                    value: c['_id'].toString(),
                    child: Text(c['name']?.toString() ?? 'Class'),
                  )).toList(),
                  onChanged: (val) => setState(() => _selectedClassId = val),
                ),
              const SizedBox(height: 16),
              GestureDetector(
                onTap: _pickFile,
                child: Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(24),
                  decoration: BoxDecoration(
                    color: AppColors.lightCyan,
                    border: Border.all(color: Colors.black, width: 2),
                  ),
                  child: Column(
                    children: [
                      const Icon(Icons.upload_file, size: 48),
                      const SizedBox(height: 8),
                      Text(
                        _selectedFile != null ? _selectedFile!.name : 'Click to select CSV',
                        style: GoogleFonts.inter(fontWeight: FontWeight.bold),
                        textAlign: TextAlign.center,
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 24),
              Row(
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  TextButton(
                    onPressed: () => Navigator.pop(context),
                    child: Text('CANCEL', style: GoogleFonts.inter(color: Colors.black, fontWeight: FontWeight.bold)),
                  ),
                  const SizedBox(width: 8),
                  ComicButton(
                    label: 'START ANALYSIS',
                    backgroundColor: AppColors.comicYellow,
                    onPressed: _startUpload,
                  ),
                ],
              ),
            ] else ...[
              Text(_isDone ? '✅ Analysis Complete!' : '🤖 AI Pipeline Running...', style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 16)),
              const SizedBox(height: 16),
              ..._pipelineStages.map((stage) {
                final isDone = stage['status'] == 'done';
                final isRunning = stage['status'] == 'running';
                return Container(
                  margin: const EdgeInsets.only(bottom: 8),
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: isDone ? AppColors.comicGreen : (isRunning ? AppColors.comicYellow : Colors.grey.shade200),
                    border: Border.all(color: Colors.black, width: 2),
                  ),
                  child: Row(
                    children: [
                      Text(stage['emoji'], style: const TextStyle(fontSize: 20)),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(stage['label'], style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 12)),
                            if (stage['count'] != null)
                              Text(stage['count'].toString(), style: GoogleFonts.inter(fontSize: 10)),
                          ],
                        ),
                      ),
                      if (isDone) const Icon(Icons.check_circle, size: 16),
                      if (isRunning) const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.black)),
                    ],
                  ),
                );
              }),
              if (_isDone) ...[
                const SizedBox(height: 16),
                Center(
                  child: ComicButton(
                    label: 'CLOSE & VIEW',
                    backgroundColor: AppColors.brutalBlue,
                    onPressed: () => Navigator.pop(context, true),
                  ),
                ),
              ],
            ],
          ],
        ),
      ),
    );
  }
}
