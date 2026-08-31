import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../services/api_service.dart';
import '../../theme/app_colors.dart';
import '../../theme/neubrutalist_widgets.dart';

class UltraKeeperScreen extends ConsumerStatefulWidget {
  const UltraKeeperScreen({super.key});

  @override
  ConsumerState<UltraKeeperScreen> createState() => _UltraKeeperScreenState();
}

class _UltraKeeperScreenState extends ConsumerState<UltraKeeperScreen> {
  bool _isLoading = true;
  List<dynamic> _notes = [];
  
  bool _showForm = false;
  final TextEditingController _titleController = TextEditingController();
  final TextEditingController _contentController = TextEditingController();
  String _folder = 'General';

  @override
  void initState() {
    super.initState();
    _fetchNotes();
  }

  @override
  void dispose() {
    _titleController.dispose();
    _contentController.dispose();
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
        setState(() {
          _notes = [];
          _isLoading = false;
        });
      }
    }
  }

  Future<void> _createNote() async {
    final title = _titleController.text.trim();
    final content = _contentController.text.trim();
    if (title.isEmpty || content.isEmpty) return;

    try {
      await ApiService().post(
        '/api/notes',
        data: {
          'title': title,
          'content': content,
          'folder': _folder,
        },
      );
      
      setState(() {
        _titleController.clear();
        _contentController.clear();
        _folder = 'General';
        _showForm = false;
      });
      _fetchNotes();
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Note saved!')));
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Failed to save note')));
    }
  }

  Future<void> _deleteNote(String id) async {
    try {
      await ApiService().delete('/api/notes/$id');
      _fetchNotes();
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Note deleted')));
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Failed to delete note')));
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.brutalBg,
      appBar: AppBar(
        backgroundColor: AppColors.brutalBg,
        elevation: 0,
        scrolledUnderElevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: AppColors.brutalBlack),
          onPressed: () => context.pop(),
        ),
        title: Text(
          'Ultra Keeper',
          style: GoogleFonts.spaceGrotesk(
            color: AppColors.brutalBlack,
            fontWeight: FontWeight.w900,
            fontSize: 24,
            letterSpacing: -1,
          ),
        ),
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(2),
          child: Container(color: AppColors.brutalBlack, height: 2),
        ),
      ),
      floatingActionButton: FloatingActionButton(
        backgroundColor: AppColors.senseiPurple,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: const BorderSide(color: AppColors.brutalBlack, width: 2),
        ),
        onPressed: () => setState(() => _showForm = true),
        child: const Icon(Icons.add, color: Colors.white, size: 32),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: AppColors.brutalBlack))
          : Stack(
              children: [
                if (_notes.isEmpty)
                  Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(Icons.folder_open, size: 64, color: Colors.grey),
                        const SizedBox(height: 16),
                        Text('No notes yet.', style: GoogleFonts.spaceGrotesk(fontSize: 24, fontWeight: FontWeight.bold, color: Colors.grey.shade600)),
                      ],
                    ),
                  )
                else
                  ListView.builder(
                    padding: const EdgeInsets.all(20),
                    itemCount: _notes.length,
                    itemBuilder: (context, index) {
                      final note = _notes[index];
                      return _buildNoteCard(note);
                    },
                  ),
                
                // Form Overlay
                if (_showForm)
                  Container(
                    color: Colors.black.withValues(alpha: 0.5),
                    alignment: Alignment.center,
                    padding: const EdgeInsets.all(20),
                    child: Container(
                      padding: const EdgeInsets.all(24),
                      decoration: BoxDecoration(
                        color: AppColors.senseiYellow,
                        borderRadius: BorderRadius.circular(24),
                        border: Border.all(color: AppColors.brutalBlack, width: 3),
                        boxShadow: const [BoxShadow(color: AppColors.brutalBlack, offset: Offset(6, 6))],
                      ),
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text('Create Note', style: GoogleFonts.spaceGrotesk(fontSize: 24, fontWeight: FontWeight.bold)),
                              IconButton(
                                icon: const Icon(Icons.close),
                                onPressed: () => setState(() => _showForm = false),
                              ),
                            ],
                          ),
                          const SizedBox(height: 16),
                          TextField(
                            controller: _titleController,
                            style: GoogleFonts.inter(fontWeight: FontWeight.bold),
                            decoration: InputDecoration(
                              hintText: 'Note Title',
                              filled: true,
                              fillColor: Colors.white,
                              border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: AppColors.brutalBlack, width: 2)),
                            ),
                          ),
                          const SizedBox(height: 16),
                          TextField(
                            controller: _contentController,
                            maxLines: 5,
                            style: GoogleFonts.inter(fontWeight: FontWeight.w600),
                            decoration: InputDecoration(
                              hintText: 'Start typing...',
                              filled: true,
                              fillColor: Colors.white,
                              border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: AppColors.brutalBlack, width: 2)),
                            ),
                          ),
                          const SizedBox(height: 24),
                          BrutalistButton(
                            text: 'Save Note',
                            backgroundColor: AppColors.senseiPurple,
                            onTap: _createNote,
                          ),
                        ],
                      ),
                    ),
                  ),
              ],
            ),
    );
  }

  Widget _buildNoteCard(dynamic note) {
    final isAi = note['isAiNote'] == true;
    final color = isAi ? AppColors.senseiBlue : Colors.white;

    return Padding(
      padding: const EdgeInsets.only(bottom: 20),
      child: Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: color,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppColors.brutalBlack, width: 3),
          boxShadow: const [BoxShadow(color: AppColors.brutalBlack, offset: Offset(4, 4))],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Text(
                    note['title'] ?? 'Untitled',
                    style: GoogleFonts.spaceGrotesk(fontSize: 20, fontWeight: FontWeight.bold),
                  ),
                ),
                if (isAi)
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: AppColors.senseiPurple,
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: AppColors.brutalBlack),
                    ),
                    child: Row(
                      children: [
                        const Icon(Icons.auto_awesome, color: Colors.white, size: 14),
                        const SizedBox(width: 4),
                        Text('AI Generated', style: GoogleFonts.inter(fontSize: 10, color: Colors.white, fontWeight: FontWeight.bold)),
                      ],
                    ),
                  ),
              ],
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                const Icon(Icons.folder, size: 16, color: AppColors.brutalBlack),
                const SizedBox(width: 8),
                Text(
                  note['folder'] ?? 'General',
                  style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.grey.shade800),
                ),
              ],
            ),
            const SizedBox(height: 16),
            const Divider(color: AppColors.brutalBlack),
            const SizedBox(height: 16),
            Text(
              note['content'] ?? '',
              style: GoogleFonts.inter(fontSize: 14, height: 1.5),
            ),
            if (note['hasChart'] == true) ...[
              const SizedBox(height: 16),
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.white,
                  border: Border.all(color: AppColors.brutalBlack),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Icon(Icons.bar_chart, color: AppColors.senseiPurple),
                    const SizedBox(width: 8),
                    Text('Data Visualization Available', style: GoogleFonts.spaceGrotesk(fontWeight: FontWeight.bold)),
                  ],
                ),
              ),
            ],
            const SizedBox(height: 16),
            Row(
              mainAxisAlignment: MainAxisAlignment.end,
              children: [
                IconButton(
                  icon: const Icon(Icons.delete_outline, color: AppColors.senseiRed),
                  onPressed: () => _deleteNote(note['_id']),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
