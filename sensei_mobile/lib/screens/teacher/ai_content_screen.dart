import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:share_plus/share_plus.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../services/api_service.dart';
import '../../theme/neubrutalist_widgets.dart';
import '../../theme/app_colors.dart';

class AiContentScreen extends ConsumerStatefulWidget {
  const AiContentScreen({super.key});

  @override
  ConsumerState<AiContentScreen> createState() => _AiContentScreenState();
}

class _AiContentScreenState extends ConsumerState<AiContentScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final TextEditingController _topicController = TextEditingController();
  String _selectedStyle = 'standard';
  String? _selectedClass;
  List<dynamic> _classes = [];
  bool _isGenerating = false;
  String? _output;

  final List<Map<String, dynamic>> _tabs = [
    { 'key': 'quiz', 'label': 'Quiz Builder', 'icon': Icons.quiz, 'color': AppColors.brutalistCyan, 'emoji': '📝' },
    { 'key': 'notes', 'label': 'Lecture Notes', 'icon': Icons.menu_book, 'color': AppColors.senseiBlue, 'emoji': '📚' },
    { 'key': 'summary', 'label': 'Topic Summary', 'icon': Icons.summarize, 'color': AppColors.senseiGreen, 'emoji': '📋' },
    { 'key': 'assignment', 'label': 'Assignment', 'icon': Icons.assignment, 'color': AppColors.senseiCoral, 'emoji': '📝' },
  ];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 4, vsync: this);
    _tabController.addListener(() {
      setState(() => _output = null);
    });
    _fetchClasses();
  }

  @override
  void dispose() {
    _tabController.dispose();
    _topicController.dispose();
    super.dispose();
  }

  Future<void> _fetchClasses() async {
    try {
      final response = await ApiService().get('/api/teacher/classes');
      if (mounted) {
        setState(() {
          final cls = response.data is Map ? (response.data['classes'] ?? []) : (response.data is List ? response.data : []);
          _classes = cls;
          if (_classes.isNotEmpty) _selectedClass = _classes.first['_id'];
        });
      }
    } catch (e) {
      debugPrint('Failed to fetch classes: $e');
    }
  }

  Future<void> _generateContent() async {
    if (_topicController.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Enter a topic')));
      return;
    }
    setState(() {
      _isGenerating = true;
      _output = null;
    });

    final activeTabKey = _tabs[_tabController.index]['key'];

    try {
      final response = await ApiService().post(
        '/api/teacher/content-ai/generate',
        data: {
          'type': activeTabKey,
          'topic': _topicController.text.trim(),
          'style': _selectedStyle,
        },
      );
      if (mounted) {
        setState(() {
          _output = response.data['content'] ?? 'Generated content successfully.';
          _isGenerating = false;
        });
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Content generated!')));
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isGenerating = false);
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Generation failed')));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: isDark ? const Color(0xFF050508) : AppColors.brutalBg,
      appBar: AppBar(
        title: Text('AI CONTENT 🤖', style: GoogleFonts.fredoka(fontWeight: FontWeight.bold)),
        backgroundColor: Colors.transparent,
        elevation: 0,
        bottom: TabBar(
          controller: _tabController,
          isScrollable: true,
          labelColor: Colors.black,
          unselectedLabelColor: Colors.grey,
          labelStyle: GoogleFonts.spaceMono(fontWeight: FontWeight.bold, fontSize: 12),
          indicator: BoxDecoration(
            color: AppColors.senseiPurple,
            border: Border.all(color: Colors.black, width: 2),
          ),
          tabs: _tabs.map((t) => Tab(text: t['label'])).toList(),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            AnimatedBuilder(
              animation: _tabController,
              builder: (context, child) {
                final tab = _tabs[_tabController.index];
                return BrutalistCard(
                  backgroundColor: tab['color'],
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Text(tab['emoji'], style: const TextStyle(fontSize: 24)),
                          const SizedBox(width: 12),
                          Expanded(child: Text('Create ${tab['label']}', style: GoogleFonts.fredoka(fontSize: 20, fontWeight: FontWeight.bold, color: Colors.black))),
                        ],
                      ),
                      const SizedBox(height: 24),
                      
                      Text('TOPIC', style: GoogleFonts.spaceMono(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.black)),
                      const SizedBox(height: 4),
                      Container(
                        decoration: BoxDecoration(color: Colors.white, border: Border.all(color: Colors.black, width: 2)),
                        child: TextField(
                          controller: _topicController,
                          decoration: InputDecoration(
                            hintText: 'e.g. Binary Trees',
                            hintStyle: GoogleFonts.fredoka(color: Colors.grey),
                            border: InputBorder.none,
                            contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                          ),
                          style: GoogleFonts.fredoka(color: Colors.black),
                        ),
                      ),
                      const SizedBox(height: 16),

                      Text('PEDAGOGICAL STYLE', style: GoogleFonts.spaceMono(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.black)),
                      const SizedBox(height: 4),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12),
                        decoration: BoxDecoration(color: Colors.white, border: Border.all(color: Colors.black, width: 2)),
                        child: DropdownButtonHideUnderline(
                          child: DropdownButton<String>(
                            value: _selectedStyle,
                            isExpanded: true,
                            dropdownColor: Colors.white,
                            items: const [
                              DropdownMenuItem(value: 'standard', child: Text('Standard / Default')),
                              DropdownMenuItem(value: 'socratic', child: Text('Socratic Method')),
                              DropdownMenuItem(value: 'feynman', child: Text('Feynman Technique')),
                              DropdownMenuItem(value: 'eli5', child: Text('Explain Like I\'m 5')),
                              DropdownMenuItem(value: 'case_study', child: Text('Case Study Based')),
                              DropdownMenuItem(value: 'project', child: Text('Project Based')),
                            ],
                            onChanged: (v) => setState(() => _selectedStyle = v!),
                            style: GoogleFonts.fredoka(color: Colors.black),
                          ),
                        ),
                      ),
                      const SizedBox(height: 16),

                      Text('CLASS', style: GoogleFonts.spaceMono(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.black)),
                      const SizedBox(height: 4),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12),
                        decoration: BoxDecoration(color: Colors.white, border: Border.all(color: Colors.black, width: 2)),
                        child: DropdownButtonHideUnderline(
                          child: DropdownButton<String>(
                            value: _selectedClass,
                            isExpanded: true,
                            dropdownColor: Colors.white,
                            hint: const Text('Select class...'),
                            items: _classes.map((c) => DropdownMenuItem(value: c['_id'].toString(), child: Text(c['name'] ?? 'Class'))).toList(),
                            onChanged: (v) => setState(() => _selectedClass = v),
                            style: GoogleFonts.fredoka(color: Colors.black),
                          ),
                        ),
                      ),
                      const SizedBox(height: 24),

                      BrutalistButton(
                        text: _isGenerating ? 'GENERATING...' : 'GENERATE',
                        onTap: _isGenerating ? () {} : () { _generateContent(); },
                        backgroundColor: Colors.white,
                      ),
                    ],
                  ),
                );
              },
            ),
            
            if (_output != null) ...[
              const SizedBox(height: 24),
              BrutalistCard(
                backgroundColor: isDark ? const Color(0xFF1E293B) : Colors.white,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text('RESULT', style: GoogleFonts.spaceMono(fontSize: 10, fontWeight: FontWeight.bold)),
                        Row(
                          children: [
                            IconButton(
                              icon: const Icon(Icons.copy, size: 20),
                              onPressed: () {
                                Clipboard.setData(ClipboardData(text: _output!));
                                ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Copied!')));
                              },
                            ),
                            IconButton(
                              icon: const Icon(Icons.share, size: 20),
                              onPressed: () => Share.share(_output!),
                            ),
                          ],
                        ),
                      ],
                    ),
                    const Divider(color: Colors.black, thickness: 2),
                    const SizedBox(height: 12),
                    Text(_output!, style: GoogleFonts.fredoka(fontSize: 16)),
                  ],
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
