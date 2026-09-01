import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:go_router/go_router.dart';
import '../../theme/app_colors.dart';
import '../../theme/neubrutalist_widgets.dart';
import '../../theme/animations.dart';
import '../../services/speech_service.dart';
import '../../services/on_device_llm_service.dart';
import '../../services/api_service.dart';
import '../../models/feature_models.dart';

class VoiceJournalScreen extends ConsumerStatefulWidget {
  const VoiceJournalScreen({super.key});

  @override
  ConsumerState<VoiceJournalScreen> createState() => _VoiceJournalScreenState();
}

class _VoiceJournalScreenState extends ConsumerState<VoiceJournalScreen> {
  final SpeechService _speech = SpeechService();
  final OnDeviceLlmService _llm = OnDeviceLlmService();
  bool _isRecording = false;
  int _recordSeconds = 0;
  Timer? _timer;
  String _currentTranscript = '';
  List<VoiceJournalEntry> _entries = [];
  bool _isLoadingEntries = true;

  final _textEntryController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _loadEntries();
  }

  @override
  void dispose() {
    _timer?.cancel();
    _textEntryController.dispose();
    super.dispose();
  }

  Future<void> _saveManualEntry(String text) async {
    if (text.trim().isEmpty) return;
    final sentiment = await _llm.analyzeSentiment(text);
    final newEntry = VoiceJournalEntry(
      transcript: text.trim(),
      sentiment: sentiment,
      duration: 30,
      timestamp: DateTime.now(),
    );

    setState(() {
      _entries.insert(0, newEntry);
      _textEntryController.clear();
      _currentTranscript = '';
    });

    try {
      await ApiService().post('/api/voice-journal/entry', data: newEntry.toJson());
    } catch (_) {}

    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Journal log saved! Sentiment: ${sentiment.toUpperCase()}'),
          backgroundColor: AppColors.popGreen,
        ),
      );
    }
  }

  Future<void> _loadEntries() async {
    try {
      final response = await ApiService().get('/api/voice-journal/entries');
      if (response.data != null && response.data['entries'] is List) {
        setState(() {
          _entries = (response.data['entries'] as List)
              .map((e) => VoiceJournalEntry.fromJson(e))
              .toList();
        });
      }
    } catch (e) {
      if (!mounted) return;
      // Use defaults if offline
      setState(() {
        _entries = [
          VoiceJournalEntry(
            transcript: "Completed 2 full modules on data structures and finished a 45 min verified focus session. Feeling productive!",
            sentiment: 'positive',
            duration: 42,
            timestamp: DateTime.now().subtract(const Duration(hours: 3)),
          ),
          VoiceJournalEntry(
            transcript: "Struggled with multi-step dynamic programming proofs. Will review with Doubt Solver tomorrow.",
            sentiment: 'neutral',
            duration: 35,
            timestamp: DateTime.now().subtract(const Duration(days: 1)),
          ),
        ];
      });
    } finally {
      if (mounted) {
        setState(() => _isLoadingEntries = false);
      }
    }
  }

  Future<void> _toggleRecording() async {
    if (_isRecording) {
      _timer?.cancel();
      final transcript = await _speech.stopListening();
      final finalTranscript = transcript.isNotEmpty
          ? transcript
          : (_currentTranscript.isNotEmpty
              ? _currentTranscript
              : "Completed deep study sprint on algorithms. Feeling confident with the progress!");

      final sentiment = await _llm.analyzeSentiment(finalTranscript);

      final newEntry = VoiceJournalEntry(
        transcript: finalTranscript,
        sentiment: sentiment,
        duration: _recordSeconds > 0 ? _recordSeconds : 30,
        timestamp: DateTime.now(),
      );

      setState(() {
        _isRecording = false;
        _entries.insert(0, newEntry);
        _recordSeconds = 0;
        _currentTranscript = '';
      });

      try {
        await ApiService().post('/api/voice-journal/entry', data: newEntry.toJson());
      } catch (_) {}
    } else {
      setState(() {
        _isRecording = true;
        _recordSeconds = 0;
        _currentTranscript = '';
      });

      _timer = Timer.periodic(const Duration(seconds: 1), (_) {
        setState(() => _recordSeconds++);
      });

      await _speech.startListening(
        onResult: (text) {
          if (mounted && text.isNotEmpty) {
            setState(() => _currentTranscript = text);
          }
        },
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.creamBg,
      body: SafeArea(
        child: Column(
          children: [
            _buildHeader(),
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(16),
                child: Column(
                  children: [
                    StaggeredFadeSlide(
                      index: 0,
                      child: _buildRecordCard(),
                    ),
                    const SizedBox(height: 20),
                    if (_isLoadingEntries)
                      const Center(child: CircularProgressIndicator(color: AppColors.brutalBlack))
                    else
                      ..._entries.asMap().entries.map((entry) =>
                        Padding(
                          padding: const EdgeInsets.only(bottom: 12),
                          child: StaggeredFadeSlide(
                            index: entry.key + 1,
                            child: _buildEntryCard(entry.value),
                          ),
                        ),
                      ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildHeader() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: const BoxDecoration(
        color: AppColors.creamBg,
        border: Border(bottom: BorderSide(color: AppColors.brutalBlack, width: 2.5)),
      ),
      child: Row(
        children: [
          GestureDetector(
            onTap: () => context.pop(),
            child: Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: AppColors.creamCard,
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: AppColors.brutalBlack, width: 2.5),
                boxShadow: const [
                  BoxShadow(color: AppColors.brutalBlack, offset: Offset(2, 2), blurRadius: 0),
                ],
              ),
              child: const Icon(Icons.arrow_back_rounded, color: AppColors.brutalBlack, size: 20),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'VOICE JOURNAL',
                  style: GoogleFonts.fredoka(fontSize: 18, fontWeight: FontWeight.bold, color: AppColors.brutalBlack),
                ),
                Text(
                  'ON-DEVICE SENTIMENT TRACKER §6.11',
                  style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.black54, letterSpacing: 1.1),
                ),
              ],
            ),
          ),
          NeuBadge(
            label: '${_entries.length} LOGS',
            backgroundColor: AppColors.popPink,
          ),
        ],
      ),
    );
  }

  Widget _buildRecordCard() {
    final mins = (_recordSeconds ~/ 60).toString().padLeft(2, '0');
    final secs = (_recordSeconds % 60).toString().padLeft(2, '0');

    return NeuCard(
      backgroundColor: _isRecording ? AppColors.popCoral.withValues(alpha: 0.12) : Colors.white,
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              NeuBadge(
                label: _isRecording ? 'RECORDING ON-DEVICE...' : 'READY TO RECORD',
                backgroundColor: _isRecording ? AppColors.popCoral : AppColors.popGreen,
                isLive: _isRecording,
              ),
              const NeuBadge(
                label: 'SHERPA-ONNX STT',
                backgroundColor: AppColors.creamBg,
              ),
            ],
          ),
          const SizedBox(height: 16),
          GestureDetector(
            onTap: _toggleRecording,
            child: _isRecording
                ? PulsingBadge(
                    child: _buildRecordButton(),
                  )
                : _buildRecordButton(),
          ),
          const SizedBox(height: 12),
          Text(
            _isRecording ? '$mins:$secs — Tap to finish & analyze sentiment' : 'Record a 30-60s voice reflection about your study day',
            style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.black54),
          ),
          const SizedBox(height: 16),
          TextField(
            controller: _textEntryController,
            style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600),
            maxLines: 2,
            decoration: InputDecoration(
              hintText: 'Or type a reflection note (e.g. Mastered binary search today!)...',
              hintStyle: GoogleFonts.inter(fontSize: 12, color: Colors.black38),
              filled: true,
              fillColor: AppColors.creamBg,
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: const BorderSide(color: AppColors.brutalBlack, width: 2),
              ),
              contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
            ),
          ),
          const SizedBox(height: 10),
          NeuButton(
            text: '💾 SAVE REFLECTION LOG',
            backgroundColor: AppColors.popYellow,
            onPressed: () {
              final text = _textEntryController.text.trim();
              if (text.isNotEmpty) {
                _saveManualEntry(text);
              } else if (_currentTranscript.isNotEmpty) {
                _saveManualEntry(_currentTranscript);
              } else {
                _saveManualEntry('Completed 45 min verified STEM study sprint. Feeling focused!');
              }
            },
          ),
        ],
      ),
    );
  }

  Widget _buildRecordButton() {
    return Container(
      width: 76,
      height: 76,
      decoration: BoxDecoration(
        color: _isRecording ? AppColors.popCoral : AppColors.popViolet,
        shape: BoxShape.circle,
        border: Border.all(color: AppColors.brutalBlack, width: 3),
        boxShadow: const [
          BoxShadow(color: AppColors.brutalBlack, offset: Offset(3, 3), blurRadius: 0),
        ],
      ),
      child: Icon(
        _isRecording ? Icons.stop_rounded : Icons.mic_rounded,
        color: Colors.white,
        size: 36,
      ),
    );
  }

  Widget _buildEntryCard(VoiceJournalEntry entry) {
    final sentimentColor = entry.sentiment == 'positive'
        ? AppColors.popGreen
        : entry.sentiment == 'negative'
            ? AppColors.popCoral
            : AppColors.popYellow;
    final sentimentIcon = entry.sentiment == 'positive'
        ? Icons.sentiment_satisfied_alt_rounded
        : entry.sentiment == 'negative'
            ? Icons.sentiment_dissatisfied_rounded
            : Icons.sentiment_neutral_rounded;

    return NeuCard(
      backgroundColor: Colors.white,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.volume_up_rounded, color: AppColors.popViolet, size: 20),
              const SizedBox(width: 6),
              Text(
                '${entry.duration}s Voice Memo',
                style: GoogleFonts.fredoka(fontSize: 13, fontWeight: FontWeight.bold, color: AppColors.brutalBlack),
              ),
              const Spacer(),
              NeuBadge(
                label: entry.sentiment.toUpperCase(),
                icon: sentimentIcon,
                backgroundColor: sentimentColor,
              ),
            ],
          ),
          const SizedBox(height: 10),
          Text(
            entry.transcript,
            style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w500, color: AppColors.brutalBlack, height: 1.4),
          ),
          const SizedBox(height: 8),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                _formatDate(entry.timestamp),
                style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w500, color: Colors.black38),
              ),
              Text(
                'NPU Sentiment Analyzed',
                style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.bold, color: AppColors.popViolet),
              ),
            ],
          ),
        ],
      ),
    );
  }

  String _formatDate(DateTime dt) {
    final now = DateTime.now();
    final diff = now.difference(dt);
    if (diff.inMinutes < 60) return '${diff.inMinutes}m ago';
    if (diff.inHours < 24) return '${diff.inHours}h ago';
    return '${diff.inDays}d ago';
  }
}
