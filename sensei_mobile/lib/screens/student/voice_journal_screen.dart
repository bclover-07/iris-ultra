import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../theme/app_colors.dart';
import '../../theme/neubrutalist_widgets.dart';
import '../../theme/animations.dart';

class VoiceJournalScreen extends StatefulWidget {
  const VoiceJournalScreen({super.key});

  @override
  State<VoiceJournalScreen> createState() => _VoiceJournalScreenState();
}

class _VoiceJournalScreenState extends State<VoiceJournalScreen> {
  bool _isRecording = false;
  final List<_JournalEntry> _entries = [
    _JournalEntry(
      transcript: "Feeling pretty good about today's study session. Managed to cover all the DS topics I planned.",
      sentiment: 'positive',
      duration: const Duration(seconds: 42),
      timestamp: DateTime.now().subtract(const Duration(hours: 3)),
    ),
    _JournalEntry(
      transcript: "Struggled with graph theory today. Need to revisit BFS vs DFS implementations.",
      sentiment: 'neutral',
      duration: const Duration(seconds: 28),
      timestamp: DateTime.now().subtract(const Duration(days: 1)),
    ),
  ];

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
            onTap: () => Navigator.of(context).pop(),
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
            child: Text(
              'VOICE JOURNAL',
              style: GoogleFonts.fredoka(fontSize: 20, fontWeight: FontWeight.bold, color: AppColors.brutalBlack),
            ),
          ),
          NeuBadge(
            label: '${_entries.length} ENTRIES',
            backgroundColor: AppColors.popPink,
          ),
        ],
      ),
    );
  }

  Widget _buildRecordCard() {
    return NeuCard(
      backgroundColor: _isRecording ? AppColors.popCoral.withOpacity(0.1) : Colors.white,
      child: Column(
        children: [
          Text(
            _isRecording ? 'RECORDING...' : 'TAP TO RECORD',
            style: GoogleFonts.fredoka(fontSize: 14, fontWeight: FontWeight.bold, letterSpacing: 1.2, color: Colors.black54),
          ),
          const SizedBox(height: 16),
          GestureDetector(
            onTap: () => setState(() => _isRecording = !_isRecording),
            child: _isRecording
                ? PulsingBadge(
                    child: _buildRecordButton(),
                  )
                : _buildRecordButton(),
          ),
          const SizedBox(height: 12),
          Text(
            _isRecording ? '0:00 — Tap to stop' : 'Record a 30-60s voice memo about your day',
            style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w600, color: Colors.black45),
          ),
        ],
      ),
    );
  }

  Widget _buildRecordButton() {
    return Container(
      width: 80,
      height: 80,
      decoration: BoxDecoration(
        color: _isRecording ? AppColors.popCoral : AppColors.popViolet,
        shape: BoxShape.circle,
        border: Border.all(color: AppColors.brutalBlack, width: 3),
        boxShadow: const [
          BoxShadow(color: AppColors.brutalBlack, offset: Offset(4, 4), blurRadius: 0),
        ],
      ),
      child: Icon(
        _isRecording ? Icons.stop_rounded : Icons.mic,
        color: Colors.white,
        size: 36,
      ),
    );
  }

  Widget _buildEntryCard(_JournalEntry entry) {
    final sentimentColor = entry.sentiment == 'positive'
        ? AppColors.popGreen
        : entry.sentiment == 'negative'
            ? AppColors.popCoral
            : AppColors.popYellow;
    final sentimentIcon = entry.sentiment == 'positive'
        ? Icons.sentiment_satisfied_alt
        : entry.sentiment == 'negative'
            ? Icons.sentiment_dissatisfied
            : Icons.sentiment_neutral;

    return NeuCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.play_circle_filled_rounded, color: AppColors.popViolet, size: 20),
              const SizedBox(width: 6),
              Text(
                '${entry.duration.inSeconds}s',
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
          Text(
            _formatDate(entry.timestamp),
            style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w500, color: Colors.black38),
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

class _JournalEntry {
  final String transcript;
  final String sentiment;
  final Duration duration;
  final DateTime timestamp;

  _JournalEntry({
    required this.transcript,
    required this.sentiment,
    required this.duration,
    required this.timestamp,
  });
}
