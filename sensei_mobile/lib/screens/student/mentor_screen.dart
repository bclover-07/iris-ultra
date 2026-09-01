import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../theme/app_colors.dart';
import '../../theme/neubrutalist_widgets.dart';
import '../../theme/animations.dart';
import '../../providers/mentor_provider.dart';
import '../../services/speech_service.dart';

class MentorScreen extends ConsumerStatefulWidget {
  const MentorScreen({super.key});

  @override
  ConsumerState<MentorScreen> createState() => _MentorScreenState();
}

class _MentorScreenState extends ConsumerState<MentorScreen> {
  final TextEditingController _messageController = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  final SpeechService _speech = SpeechService();

  @override
  void initState() {
    super.initState();
    Future.microtask(() => ref.read(mentorProvider.notifier).initialize());
  }

  @override
  void dispose() {
    _messageController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  void _sendMessage() {
    final text = _messageController.text.trim();
    if (text.isEmpty) return;

    _messageController.clear();
    ref.read(mentorProvider.notifier).sendMessage(text);
    _scrollToBottom();
  }

  Future<void> _toggleMic() async {
    final state = ref.read(mentorProvider);
    if (state.isListening) {
      ref.read(mentorProvider.notifier).setListening(false);
      final text = await _speech.stopListening();
      if (text.isNotEmpty) {
        _messageController.text = text;
        _sendMessage();
      }
    } else {
      ref.read(mentorProvider.notifier).setListening(true);
      await _speech.startListening(
        onResult: (text) {
          if (mounted && text.isNotEmpty) {
            _messageController.text = text;
          }
        },
      );
    }
  }

  void _scrollToBottom() {
    Future.delayed(const Duration(milliseconds: 150), () {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final mentorState = ref.watch(mentorProvider);

    return Scaffold(
      backgroundColor: AppColors.creamBg,
      body: SafeArea(
        child: Column(
          children: [
            _buildHeader(mentorState),
            Expanded(child: _buildMessageList(mentorState)),
            if (mentorState.isLoading) _buildTypingIndicator(),
            _buildInputBar(mentorState),
          ],
        ),
      ),
    );
  }

  Widget _buildHeader(MentorState state) {
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
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'AI STUDY MENTOR',
                  style: GoogleFonts.fredoka(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: AppColors.brutalBlack,
                  ),
                ),
                const SizedBox(height: 2),
                NeuBadge(
                  label: state.isOfflineMode ? 'OFFLINE · HEXAGON NPU' : 'ON-DEVICE · NPU ACTIVE',
                  backgroundColor: state.isOfflineMode ? AppColors.popOrange : AppColors.npuTeal,
                  isLive: true,
                ),
              ],
            ),
          ),
          GestureDetector(
            onTap: () => ref.read(mentorProvider.notifier).toggleOfflineMode(),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              decoration: BoxDecoration(
                color: state.isOfflineMode ? AppColors.popOrange : AppColors.popGreen,
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: AppColors.brutalBlack, width: 2.5),
                boxShadow: const [
                  BoxShadow(color: AppColors.brutalBlack, offset: Offset(2, 2), blurRadius: 0),
                ],
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(
                    state.isOfflineMode ? Icons.airplanemode_active : Icons.bolt,
                    size: 16,
                    color: AppColors.brutalBlack,
                  ),
                  const SizedBox(width: 4),
                  Text(
                    state.isOfflineMode ? 'OFF' : 'NPU',
                    style: GoogleFonts.fredoka(
                      fontSize: 11,
                      fontWeight: FontWeight.bold,
                      color: AppColors.brutalBlack,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMessageList(MentorState state) {
    if (state.messages.isEmpty) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: AppColors.popYellow,
                  shape: BoxShape.circle,
                  border: Border.all(color: AppColors.brutalBlack, width: 3),
                  boxShadow: const [
                    BoxShadow(color: AppColors.brutalBlack, offset: Offset(4, 4), blurRadius: 0),
                  ],
                ),
                child: const Icon(Icons.psychology_rounded, size: 48, color: AppColors.brutalBlack),
              ),
              const SizedBox(height: 16),
              Text(
                'YOUR NPU STUDY MENTOR',
                style: GoogleFonts.fredoka(fontSize: 18, fontWeight: FontWeight.bold, color: AppColors.brutalBlack),
              ),
              const SizedBox(height: 8),
              Text(
                'Ask questions, request study plans, or review complex concepts offline powered by Gemma 3n on Hexagon NPU.',
                textAlign: TextAlign.center,
                style: GoogleFonts.inter(fontSize: 13, color: Colors.black54, height: 1.4),
              ),
            ],
          ),
        ),
      );
    }

    return ListView.builder(
      controller: _scrollController,
      padding: const EdgeInsets.symmetric(vertical: 12),
      itemCount: state.messages.length,
      itemBuilder: (context, index) {
        final msg = state.messages[index];
        return StaggeredFadeSlide(
          index: index,
          child: NeuSpeechBubble(
            text: msg.text,
            isUser: msg.isUser,
            modelEngine: msg.modelEngine,
            timeString: _formatTime(msg.timestamp),
          ),
        );
      },
    );
  }

  Widget _buildTypingIndicator() {
    return Padding(
      padding: const EdgeInsets.only(left: 16, bottom: 8),
      child: Align(
        alignment: Alignment.centerLeft,
        child: PulsingBadge(
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
            decoration: BoxDecoration(
              color: AppColors.creamCard,
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: AppColors.brutalBlack, width: 2.5),
              boxShadow: const [
                BoxShadow(color: AppColors.brutalBlack, offset: Offset(3, 3), blurRadius: 0),
              ],
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(Icons.memory, size: 14, color: AppColors.popViolet),
                const SizedBox(width: 6),
                Text(
                  'INFERRING ON HEXAGON NPU...',
                  style: GoogleFonts.fredoka(
                    fontSize: 11,
                    fontWeight: FontWeight.bold,
                    letterSpacing: 1,
                    color: AppColors.popViolet,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildInputBar(MentorState state) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: const BoxDecoration(
        color: AppColors.creamBg,
        border: Border(top: BorderSide(color: AppColors.brutalBlack, width: 2.5)),
      ),
      child: Row(
        children: [
          GestureDetector(
            onTap: _toggleMic,
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 200),
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: state.isListening ? AppColors.popCoral : AppColors.popPink,
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: AppColors.brutalBlack, width: 2.5),
                boxShadow: const [
                  BoxShadow(color: AppColors.brutalBlack, offset: Offset(2, 2), blurRadius: 0),
                ],
              ),
              child: Icon(
                state.isListening ? Icons.mic_off_rounded : Icons.mic_rounded,
                color: AppColors.brutalBlack,
                size: 22,
              ),
            ),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Container(
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: AppColors.brutalBlack, width: 2.5),
                boxShadow: const [
                  BoxShadow(color: AppColors.brutalBlack, offset: Offset(3, 3), blurRadius: 0),
                ],
              ),
              child: TextField(
                controller: _messageController,
                onSubmitted: (_) => _sendMessage(),
                style: GoogleFonts.inter(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  color: AppColors.brutalBlack,
                ),
                decoration: InputDecoration(
                  hintText: state.isListening ? 'Listening via offline STT...' : 'Ask your NPU mentor...',
                  hintStyle: GoogleFonts.inter(color: Colors.black38),
                  border: InputBorder.none,
                  contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                ),
              ),
            ),
          ),
          const SizedBox(width: 8),
          GestureDetector(
            onTap: _sendMessage,
            child: Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: AppColors.popYellow,
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: AppColors.brutalBlack, width: 2.5),
                boxShadow: const [
                  BoxShadow(color: AppColors.brutalBlack, offset: Offset(2, 2), blurRadius: 0),
                ],
              ),
              child: const Icon(Icons.send_rounded, color: AppColors.brutalBlack, size: 22),
            ),
          ),
        ],
      ),
    );
  }

  String _formatTime(DateTime dt) {
    final h = dt.hour.toString().padLeft(2, '0');
    final m = dt.minute.toString().padLeft(2, '0');
    return '$h:$m';
  }
}
