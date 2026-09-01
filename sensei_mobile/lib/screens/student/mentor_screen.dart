import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:go_router/go_router.dart';
import '../../theme/app_colors.dart';
import '../../theme/neubrutalist_widgets.dart';
import '../../theme/animations.dart';
import '../../providers/mentor_provider.dart';
import '../../services/speech_service.dart';
import '../../components/three_js_avatar_view.dart';

class MentorScreen extends ConsumerStatefulWidget {
  const MentorScreen({super.key});

  @override
  ConsumerState<MentorScreen> createState() => _MentorScreenState();
}

class _MentorScreenState extends ConsumerState<MentorScreen> {
  final TextEditingController _messageController = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  final SpeechService _speech = SpeechService();
  final GlobalKey<ThreeJsAvatarViewState> _avatarKey = GlobalKey<ThreeJsAvatarViewState>();
  bool _show3dAvatar = true;

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
    _avatarKey.currentState?.setMood('thinking');
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
      _avatarKey.currentState?.setMood('talking');
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

    if (mentorState.isLoading) {
      _avatarKey.currentState?.setMood('thinking');
    } else if (mentorState.messages.isNotEmpty && !mentorState.messages.last.isUser) {
      _avatarKey.currentState?.setMood('talking');
    }

    return Scaffold(
      backgroundColor: AppColors.creamBg,
      body: SafeArea(
        child: Column(
          children: [
            _buildHeader(mentorState),
            if (_show3dAvatar)
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                child: ThreeJsAvatarView(
                  key: _avatarKey,
                  height: 180,
                  initialMood: 'idle',
                ),
              ),
            Expanded(child: _buildMessageList(mentorState)),
            if (mentorState.isLoading) _buildTypingIndicator(),
            _buildQuickPrompts(),
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
            onTap: () => context.canPop() ? context.pop() : context.go('/student'),
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
            onTap: () => setState(() => _show3dAvatar = !_show3dAvatar),
            child: Container(
              padding: const EdgeInsets.all(8),
              margin: const EdgeInsets.only(right: 6),
              decoration: BoxDecoration(
                color: _show3dAvatar ? AppColors.popViolet : Colors.white,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: AppColors.brutalBlack, width: 2),
                boxShadow: const [
                  BoxShadow(color: AppColors.brutalBlack, offset: Offset(2, 2), blurRadius: 0),
                ],
              ),
              child: Icon(
                Icons.view_in_ar_rounded,
                size: 18,
                color: _show3dAvatar ? Colors.white : AppColors.brutalBlack,
              ),
            ),
          ),
          GestureDetector(
            onTap: () => ref.read(mentorProvider.notifier).toggleOfflineMode(),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
              decoration: BoxDecoration(
                color: state.isOfflineMode ? AppColors.popOrange : AppColors.popGreen,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: AppColors.brutalBlack, width: 2),
                boxShadow: const [
                  BoxShadow(color: AppColors.brutalBlack, offset: Offset(2, 2), blurRadius: 0),
                ],
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(
                    state.isOfflineMode ? Icons.airplanemode_active : Icons.bolt,
                    size: 14,
                    color: AppColors.brutalBlack,
                  ),
                  const SizedBox(width: 4),
                  Text(
                    state.isOfflineMode ? 'AIRPLANE' : 'NPU',
                    style: GoogleFonts.fredoka(
                      fontSize: 10,
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
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              padding: const EdgeInsets.all(18),
              decoration: BoxDecoration(
                color: AppColors.popYellow,
                shape: BoxShape.circle,
                border: Border.all(color: AppColors.brutalBlack, width: 2.5),
                boxShadow: const [
                  BoxShadow(color: AppColors.brutalBlack, offset: Offset(3, 3), blurRadius: 0),
                ],
              ),
              child: const Icon(Icons.psychology_rounded, size: 40, color: AppColors.brutalBlack),
            ),
            const SizedBox(height: 12),
            Text(
              'ASK SENSEI ANYTHING',
              style: GoogleFonts.fredoka(fontSize: 18, fontWeight: FontWeight.bold, color: AppColors.brutalBlack),
            ),
            const SizedBox(height: 4),
            Text(
              'Gemma 3n running locally on your Hexagon NPU',
              style: GoogleFonts.inter(fontSize: 12, color: Colors.black54, fontWeight: FontWeight.w600),
            ),
          ],
        ),
      );
    }

    return ListView.builder(
      controller: _scrollController,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      itemCount: state.messages.length,
      itemBuilder: (context, index) {
        final msg = state.messages[index];
        return StaggeredFadeSlide(
          index: index % 6,
          child: NeuSpeechBubble(
            text: msg.text,
            isUser: msg.isUser,
            modelEngine: msg.modelEngine,
            timeString: '${msg.timestamp.hour.toString().padLeft(2, '0')}:${msg.timestamp.minute.toString().padLeft(2, '0')}',
          ),
        );
      },
    );
  }

  Widget _buildTypingIndicator() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 6),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: AppColors.brutalBlack, width: 2),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                const SizedBox(
                  width: 12,
                  height: 12,
                  child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.popViolet),
                ),
                const SizedBox(width: 8),
                Text(
                  'Gemma 3n inferring on NPU...',
                  style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.black54),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildQuickPrompts() {
    final prompts = [
      'Explain Dynamic Programming',
      'Optimize my study schedule',
      'How does Hexagon NPU work?',
      'Prepare for an AI interview',
    ];

    return SizedBox(
      height: 36,
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 16),
        itemCount: prompts.length,
        itemBuilder: (context, index) {
          return Padding(
            padding: const EdgeInsets.only(right: 8),
            child: GestureDetector(
              onTap: () {
                _messageController.text = prompts[index];
                _sendMessage();
              },
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppColors.brutalBlack, width: 1.8),
                ),
                alignment: Alignment.center,
                child: Text(
                  prompts[index],
                  style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.bold, color: AppColors.brutalBlack),
                ),
              ),
            ),
          );
        },
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
            child: Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: state.isListening ? AppColors.popCoral : AppColors.popYellow,
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: AppColors.brutalBlack, width: 2.5),
                boxShadow: const [
                  BoxShadow(color: AppColors.brutalBlack, offset: Offset(2, 2), blurRadius: 0),
                ],
              ),
              child: Icon(
                state.isListening ? Icons.mic_rounded : Icons.mic_none_rounded,
                color: AppColors.brutalBlack,
                size: 20,
              ),
            ),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: NeuTextField(
              controller: _messageController,
              hintText: state.isListening ? 'Listening via Sherpa-ONNX...' : 'Ask your NPU mentor...',
              onSubmitted: (_) => _sendMessage(),
            ),
          ),
          const SizedBox(width: 8),
          GestureDetector(
            onTap: _sendMessage,
            child: Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: AppColors.popGreen,
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: AppColors.brutalBlack, width: 2.5),
                boxShadow: const [
                  BoxShadow(color: AppColors.brutalBlack, offset: Offset(2, 2), blurRadius: 0),
                ],
              ),
              child: const Icon(Icons.send_rounded, color: AppColors.brutalBlack, size: 20),
            ),
          ),
        ],
      ),
    );
  }
}
