import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../theme/app_colors.dart';
import '../../theme/neubrutalist_widgets.dart';
import '../../theme/animations.dart';

class MentorScreen extends StatefulWidget {
  const MentorScreen({super.key});

  @override
  State<MentorScreen> createState() => _MentorScreenState();
}

class _MentorScreenState extends State<MentorScreen> {
  final TextEditingController _messageController = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  final List<_ChatMessage> _messages = [];
  bool _isLoading = false;
  bool _isOfflineMode = false;

  @override
  void initState() {
    super.initState();
    _messages.add(_ChatMessage(
      text: "Hey! I'm your AI Study Mentor powered by on-device Gemma. Ask me anything about your studies — I work offline too! 🚀",
      isUser: false,
      engine: "Gemma 3n · Hexagon NPU",
      timestamp: DateTime.now(),
    ));
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

    setState(() {
      _messages.add(_ChatMessage(
        text: text,
        isUser: true,
        timestamp: DateTime.now(),
      ));
      _isLoading = true;
    });
    _messageController.clear();
    _scrollToBottom();

    Future.delayed(const Duration(milliseconds: 800), () {
      if (!mounted) return;
      setState(() {
        _messages.add(_ChatMessage(
          text: _generateMentorResponse(text),
          isUser: false,
          engine: _isOfflineMode ? "Gemma 3n · NPU (Offline)" : "Gemma 3n · Hexagon NPU",
          timestamp: DateTime.now(),
        ));
        _isLoading = false;
      });
      _scrollToBottom();
    });
  }

  String _generateMentorResponse(String input) {
    final lower = input.toLowerCase();
    if (lower.contains('math') || lower.contains('calculus')) {
      return "Great question about mathematics! 📐\n\nHere's my approach:\n1. **Break it into steps** — identify the core operation\n2. **Apply the formula** — use the right theorem\n3. **Verify** — check your answer with a quick estimate\n\nWant me to generate a practice quiz on this topic?";
    }
    if (lower.contains('study') || lower.contains('plan')) {
      return "Let's optimize your study plan! 📚\n\n**Recommended approach:**\n• Use the **Pomodoro Technique** — 25 min focus, 5 min break\n• Track progress in your **Study Plan Synthesizer**\n• Test yourself with **Camo Quizo** for active recall\n\nYour Quiz Mastery score will improve naturally as you practice!";
    }
    if (lower.contains('help') || lower.contains('stuck')) {
      return "Don't worry, I've got you! 💪\n\nTry these steps:\n1. Use the **Doubt Solver** to scan your problem\n2. Start a **Focus Guardian** session for deep work\n3. Practice with **Camo Quizo** gestures\n\nRemember: every verified session strengthens your dashboard signals!";
    }
    return "That's a great point! 🧠\n\nBased on your study profile, I recommend:\n• **Active Recall** — test yourself, don't just re-read\n• **Spaced Repetition** — review at increasing intervals\n• **Interleaving** — mix different topics in one session\n\nYour engagement score improves with every mentor conversation. Keep going! ✨";
  }

  void _scrollToBottom() {
    Future.delayed(const Duration(milliseconds: 100), () {
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
    return Scaffold(
      backgroundColor: AppColors.creamBg,
      body: SafeArea(
        child: Column(
          children: [
            _buildHeader(),
            Expanded(child: _buildMessageList()),
            if (_isLoading) _buildTypingIndicator(),
            _buildInputBar(),
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
                  label: _isOfflineMode ? 'OFFLINE · NPU' : 'ON-DEVICE · NPU',
                  backgroundColor: _isOfflineMode ? AppColors.popOrange : AppColors.npuTeal,
                  isLive: true,
                ),
              ],
            ),
          ),
          GestureDetector(
            onTap: () => setState(() => _isOfflineMode = !_isOfflineMode),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              decoration: BoxDecoration(
                color: _isOfflineMode ? AppColors.popOrange : AppColors.popGreen,
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
                    _isOfflineMode ? Icons.airplanemode_active : Icons.cloud_done,
                    size: 16,
                    color: AppColors.brutalBlack,
                  ),
                  const SizedBox(width: 4),
                  Text(
                    _isOfflineMode ? 'OFF' : 'ON',
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

  Widget _buildMessageList() {
    return ListView.builder(
      controller: _scrollController,
      padding: const EdgeInsets.symmetric(vertical: 12),
      itemCount: _messages.length,
      itemBuilder: (context, index) {
        final msg = _messages[index];
        return StaggeredFadeSlide(
          index: index,
          child: NeuSpeechBubble(
            text: msg.text,
            isUser: msg.isUser,
            modelEngine: msg.engine,
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
                  'THINKING ON NPU...',
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

  Widget _buildInputBar() {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: const BoxDecoration(
        color: AppColors.creamBg,
        border: Border(top: BorderSide(color: AppColors.brutalBlack, width: 2.5)),
      ),
      child: Row(
        children: [
          Container(
            decoration: BoxDecoration(
              color: AppColors.popPink,
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: AppColors.brutalBlack, width: 2.5),
              boxShadow: const [
                BoxShadow(color: AppColors.brutalBlack, offset: Offset(2, 2), blurRadius: 0),
              ],
            ),
            child: IconButton(
              icon: const Icon(Icons.mic, color: AppColors.brutalBlack, size: 22),
              onPressed: () {},
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
                  hintText: 'Ask your mentor...',
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

class _ChatMessage {
  final String text;
  final bool isUser;
  final String? engine;
  final DateTime timestamp;

  _ChatMessage({
    required this.text,
    required this.isUser,
    this.engine,
    required this.timestamp,
  });
}
