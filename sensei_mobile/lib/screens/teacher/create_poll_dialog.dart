import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../theme/app_colors.dart';
import '../../services/api_service.dart';

class CreatePollDialog extends StatefulWidget {
  const CreatePollDialog({super.key});

  @override
  State<CreatePollDialog> createState() => _CreatePollDialogState();
}

class _CreatePollDialogState extends State<CreatePollDialog> {
  final TextEditingController _questionController = TextEditingController();
  final List<TextEditingController> _optionControllers = [
    TextEditingController(text: ''),
    TextEditingController(text: ''),
  ];
  String? _selectedClassId;
  DateTime? _selectedExpiry;
  List<dynamic> _classes = [];
  bool _isLoadingClasses = true;

  @override
  void initState() {
    super.initState();
    _fetchClasses();
  }

  Future<void> _fetchClasses() async {
    try {
      final res = await ApiService().get('/api/teacher/classes');
      if (mounted) {
        setState(() {
          _classes = res.data is Map ? (res.data['classes'] ?? []) : (res.data is List ? res.data : []);
          _isLoadingClasses = false;
        });
      }
    } catch (e) {
      if (mounted) setState(() => _isLoadingClasses = false);
    }
  }

  void _addOption() {
    if (_optionControllers.length < 5) {
      setState(() {
        _optionControllers.add(TextEditingController(text: ''));
      });
    }
  }

  void _removeOption(int index) {
    if (_optionControllers.length > 2) {
      setState(() {
        _optionControllers.removeAt(index);
      });
    }
  }

  @override
  void dispose() {
    _questionController.dispose();
    for (var c in _optionControllers) {
      c.dispose();
    }
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        side: BorderSide(color: Colors.black, width: 4),
        borderRadius: BorderRadius.zero,
      ),
      title: Text('CREATE NEW POLL', style: GoogleFonts.inter(fontWeight: FontWeight.w900, color: Colors.black)),
      content: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: _questionController,
              maxLines: 2,
              decoration: const InputDecoration(
                hintText: 'Enter poll question...',
                border: OutlineInputBorder(borderSide: BorderSide(color: AppColors.brutalBlack, width: 2), borderRadius: BorderRadius.zero),
                focusedBorder: OutlineInputBorder(borderSide: BorderSide(color: AppColors.brutalCyan, width: 2), borderRadius: BorderRadius.zero),
              ),
            ),
            const SizedBox(height: 16),
            Text('Target Class (Optional)', style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 12, color: Colors.black)),
            const SizedBox(height: 8),
            if (_isLoadingClasses)
              const Center(child: CircularProgressIndicator(color: AppColors.brutalBlack))
            else if (_classes.isNotEmpty) ...[
              DropdownButtonFormField<String>(
                value: _selectedClassId,
                hint: const Text('Select Class'),
                decoration: const InputDecoration(
                  border: OutlineInputBorder(borderSide: BorderSide(color: AppColors.brutalBlack, width: 2), borderRadius: BorderRadius.zero),
                  focusedBorder: OutlineInputBorder(borderSide: BorderSide(color: AppColors.brutalCyan, width: 2), borderRadius: BorderRadius.zero),
                  isDense: true,
                ),
                items: _classes.map((c) {
                  return DropdownMenuItem<String>(
                    value: c['_id']?.toString(),
                    child: Text(c['name']?.toString() ?? 'Class'),
                  );
                }).toList(),
                onChanged: (val) => setState(() => _selectedClassId = val),
              ),
              const SizedBox(height: 16),
            ],
            ListTile(
              contentPadding: EdgeInsets.zero,
              title: Text(_selectedExpiry == null ? 'Set Expiry (Optional)' : 'Expiry: ${_selectedExpiry.toString().split('.')[0]}'),
              trailing: const Icon(Icons.calendar_today),
              onTap: () async {
                final date = await showDatePicker(
                  context: context,
                  initialDate: DateTime.now().add(const Duration(days: 1)),
                  firstDate: DateTime.now(),
                  lastDate: DateTime.now().add(const Duration(days: 365)),
                );
                if (date != null && mounted) {
                  final time = await showTimePicker(
                    context: context,
                    initialTime: TimeOfDay.now(),
                  );
                  if (time != null) {
                    setState(() {
                      _selectedExpiry = DateTime(date.year, date.month, date.day, time.hour, time.minute);
                    });
                  }
                }
              },
            ),
            const SizedBox(height: 16),
            ..._optionControllers.asMap().entries.map((entry) {
              final idx = entry.key;
              final ctrl = entry.value;
              return Padding(
                padding: const EdgeInsets.only(bottom: 8),
                child: Row(
                  children: [
                    Expanded(
                      child: TextField(
                        controller: ctrl,
                        decoration: InputDecoration(
                          hintText: 'Option ${idx + 1}',
                          isDense: true,
                          border: const OutlineInputBorder(borderSide: BorderSide(color: AppColors.brutalBlack, width: 2), borderRadius: BorderRadius.zero),
                          focusedBorder: const OutlineInputBorder(borderSide: BorderSide(color: AppColors.brutalCyan, width: 2), borderRadius: BorderRadius.zero),
                        ),
                      ),
                    ),
                    if (_optionControllers.length > 2)
                      IconButton(
                        icon: const Icon(Icons.remove_circle, color: Colors.red),
                        onPressed: () => _removeOption(idx),
                      ),
                  ],
                ),
              );
            }),
            if (_optionControllers.length < 5)
              TextButton.icon(
                onPressed: _addOption,
                icon: const Icon(Icons.add),
                label: const Text('Add Option'),
              ),
          ],
        ),
      ),
      actions: [
        TextButton(onPressed: () => Navigator.pop(context), child: Text('CANCEL', style: GoogleFonts.inter(fontWeight: FontWeight.bold, color: Colors.black))),
        ElevatedButton(
          style: ElevatedButton.styleFrom(
            backgroundColor: AppColors.brutalistCyan,
            shape: const RoundedRectangleBorder(side: BorderSide(color: Colors.black, width: 2), borderRadius: BorderRadius.zero),
          ),
          onPressed: () {
            final q = _questionController.text.trim();
            final opts = _optionControllers.map((c) => c.text.trim()).where((t) => t.isNotEmpty).toList();
            if (q.isEmpty || opts.length < 2) return;
            Navigator.pop(context, {
              'question': q,
              'options': opts,
              if (_selectedClassId != null) 'classId': _selectedClassId,
              if (_selectedExpiry != null) 'expiry': _selectedExpiry!.toIso8601String(),
            });
          },
          child: const Text('CREATE', style: TextStyle(color: Colors.black, fontWeight: FontWeight.bold)),
        ),
      ],
    );
  }
}
