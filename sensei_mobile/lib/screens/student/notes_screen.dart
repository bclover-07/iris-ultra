import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../services/api_service.dart';
import '../../theme/neubrutalist_widgets.dart';
import '../../theme/app_colors.dart';

class NotesScreen extends ConsumerStatefulWidget {
  const NotesScreen({super.key});

  @override
  ConsumerState<NotesScreen> createState() => _NotesScreenState();
}

class _NotesScreenState extends ConsumerState<NotesScreen> {
  List<dynamic> _notes = [];
  bool _isLoading = true;
  bool _showForm = false;
  
  final _titleController = TextEditingController();
  final _contentController = TextEditingController();
  final _folderController = TextEditingController(text: 'General');

  @override
  void initState() {
    super.initState();
    _fetchNotes();
  }

  @override
  void dispose() {
    _titleController.dispose();
    _contentController.dispose();
    _folderController.dispose();
    super.dispose();
  }

  Future<void> _fetchNotes() async {
    setState(() => _isLoading = true);
    try {
      final response = await ApiService().get('/api/notes');
      if (mounted) {
        setState(() {
          _notes = response.data['notes'] ?? [];
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  Future<void> _createNote() async {
    if (_titleController.text.trim().isEmpty || _contentController.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Fill in both fields')));
      return;
    }
    
    try {
      await ApiService().post(
        '/api/notes',
        data: {
          'title': _titleController.text,
          'content': _contentController.text,
          'folder': _folderController.text,
        },
      );
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Note saved!')));
      _titleController.clear();
      _contentController.clear();
      _folderController.text = 'General';
      setState(() => _showForm = false);
      _fetchNotes();
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Failed to save note')));
    }
  }

  Future<void> _deleteNote(String id) async {
    try {
      await ApiService().delete('/api/notes/$id');
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Note deleted')));
      _fetchNotes();
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Failed to delete')));
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: isDark ? const Color(0xFF050508) : const Color(0xFFFEF9C3),
      appBar: AppBar(
        title: Text('ULTRA KEEPER 📓', style: GoogleFonts.fredoka(fontWeight: FontWeight.bold)),
        backgroundColor: Colors.transparent,
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.add_circle, color: AppColors.senseiYellow, size: 28),
            onPressed: () => setState(() => _showForm = !_showForm),
          ),
          IconButton(
            icon: const Icon(Icons.psychology, color: AppColors.senseiPurple, size: 28),
            onPressed: () {
              ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Auto-Generate from file not implemented on mobile yet')));
            },
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  if (_showForm) ...[
                    BrutalistCard(
                      backgroundColor: isDark ? const Color(0xFF1E293B) : Colors.white,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          Row(
                            children: [
                              Expanded(
                                flex: 2,
                                child: TextField(
                                  controller: _titleController,
                                  decoration: InputDecoration(
                                    hintText: 'Note Title',
                                    filled: true,
                                    fillColor: isDark ? const Color(0xFF0F172A) : Colors.grey.shade100,
                                    border: const OutlineInputBorder(),
                                  ),
                                ),
                              ),
                              const SizedBox(width: 8),
                              Expanded(
                                child: TextField(
                                  controller: _folderController,
                                  decoration: InputDecoration(
                                    hintText: 'Folder',
                                    filled: true,
                                    fillColor: isDark ? const Color(0xFF0F172A) : Colors.grey.shade100,
                                    border: const OutlineInputBorder(),
                                  ),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 8),
                          TextField(
                            controller: _contentController,
                            maxLines: 5,
                            decoration: InputDecoration(
                              hintText: 'Write your notes here...',
                              filled: true,
                              fillColor: isDark ? const Color(0xFF0F172A) : Colors.grey.shade100,
                              border: const OutlineInputBorder(),
                            ),
                          ),
                          const SizedBox(height: 16),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.end,
                            children: [
                              TextButton(
                                onPressed: () => setState(() => _showForm = false),
                                child: Text('Cancel', style: GoogleFonts.fredoka(color: Colors.red)),
                              ),
                              const SizedBox(width: 8),
                              ComicCard(
                                onTap: _createNote,
                                backgroundColor: AppColors.senseiGreen,
                                child: Padding(
                                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                                  child: Text('SAVE NOTE', style: GoogleFonts.fredoka(fontWeight: FontWeight.bold, color: Colors.black)),
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 24),
                  ],

                  if (_notes.isEmpty)
                    Center(
                      child: Padding(
                        padding: const EdgeInsets.symmetric(vertical: 48),
                        child: Column(
                          children: [
                            const Icon(Icons.description, size: 64, color: Colors.grey),
                            const SizedBox(height: 16),
                            Text('NO NOTES FOUND', style: GoogleFonts.fredoka(fontSize: 24, fontWeight: FontWeight.bold, color: Colors.grey)),
                          ],
                        ),
                      ),
                    )
                  else
                    ..._notes.map((note) {
                      final isAiNote = note['isAiNote'] == true;
                      return Padding(
                        padding: const EdgeInsets.only(bottom: 16),
                        child: BrutalistCard(
                          backgroundColor: isAiNote ? AppColors.senseiPurple.withValues(alpha: 0.1) : (isDark ? const Color(0xFF1E293B) : Colors.white),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Row(
                                    children: [
                                      if (isAiNote) ...[
                                        Container(
                                          padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 2),
                                          decoration: BoxDecoration(color: AppColors.senseiPurple, border: Border.all(color: AppColors.brutalBlack)),
                                          child: Row(
                                            children: [
                                              const Icon(Icons.psychology, size: 12, color: Colors.white),
                                              const SizedBox(width: 4),
                                              Text('AI', style: GoogleFonts.spaceMono(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.white)),
                                            ],
                                          ),
                                        ),
                                        const SizedBox(width: 8),
                                      ],
                                      Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 2),
                                        decoration: BoxDecoration(color: Colors.white, border: Border.all(color: AppColors.brutalBlack)),
                                        child: Row(
                                          children: [
                                            const Icon(Icons.folder, size: 12, color: Colors.black),
                                            const SizedBox(width: 4),
                                            Text(note['folder'] ?? 'General', style: GoogleFonts.spaceMono(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.black)),
                                          ],
                                        ),
                                      ),
                                    ],
                                  ),
                                  IconButton(
                                    icon: const Icon(Icons.delete, color: Colors.red),
                                    onPressed: () => _deleteNote(note['_id']),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 8),
                              Text(note['title'] ?? 'Untitled', style: GoogleFonts.fredoka(fontSize: 20, fontWeight: FontWeight.bold)),
                              const SizedBox(height: 12),
                              Container(
                                padding: const EdgeInsets.all(12),
                                decoration: BoxDecoration(
                                  color: isDark ? const Color(0xFF0F172A) : Colors.grey.shade50,
                                  border: Border.all(color: AppColors.brutalBlack.withValues(alpha: 0.1)),
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: Text(
                                  note['content'] ?? '',
                                  style: GoogleFonts.fredoka(fontSize: 14),
                                  maxLines: 10,
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                              if (note['tags'] != null && (note['tags'] as List).isNotEmpty) ...[
                                const SizedBox(height: 12),
                                Wrap(
                                  spacing: 4,
                                  children: (note['tags'] as List).map((tag) => Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                    decoration: BoxDecoration(color: Colors.black, borderRadius: BorderRadius.circular(4)),
                                    child: Text('#$tag', style: GoogleFonts.spaceMono(fontSize: 10, color: Colors.white)),
                                  )).toList(),
                                ),
                              ],
                            ],
                          ),
                        ),
                      );
                    }).toList(),
                ],
              ),
            ),
    );
  }
}
