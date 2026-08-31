import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../services/api_service.dart';
import '../../theme/app_colors.dart';
import '../../theme/neubrutalist_widgets.dart';

class AiAvatarScreen extends ConsumerStatefulWidget {
  const AiAvatarScreen({super.key});

  @override
  ConsumerState<AiAvatarScreen> createState() => _AiAvatarScreenState();
}

class _AiAvatarScreenState extends ConsumerState<AiAvatarScreen> with TickerProviderStateMixin {
  final TextEditingController _msgController = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  
  List<Map<String, dynamic>> _messages = [];
  bool _isLoading = false;
  bool _isListening = false;
  bool _isSpeaking = true;
  String _avatarMood = 'idle';

  late AnimationController _pulseController;

  @override
  void initState() {
    super.initState();
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 2),
    )..repeat(reverse: true);
    
    // Add initial welcome message
    _messages.add({
      'role': 'assistant',
      'content': 'Hello! I am your AI Mentor. How can I assist you today?',
    });
  }

  @override
  void dispose() {
    _msgController.dispose();
    _scrollController.dispose();
    _pulseController.dispose();
    super.dispose();
  }

  void _scrollToBottom() {
    if (_scrollController.hasClients) {
      _scrollController.animateTo(
        _scrollController.position.maxScrollExtent + 100,
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeOut,
      );
    }
  }

  Future<void> _sendMessage() async {
    final text = _msgController.text.trim();
    if (text.isEmpty || _isLoading) return;

    setState(() {
      _messages.add({'role': 'user', 'content': text});
      _isLoading = true;
      _avatarMood = 'thinking';
    });
    _msgController.clear();
    _scrollToBottom();

    try {
      final response = await ApiService().post(
        '/api/chatbot/chat',
        data: {'message': text},
      );

      if (mounted) {
        setState(() {
          _messages.add({'role': 'assistant', 'content': response.data['reply']});
          _isLoading = false;
          _avatarMood = 'talking';
        });
        _scrollToBottom();
        
        Future.delayed(const Duration(seconds: 3), () {
          if (mounted) setState(() => _avatarMood = 'happy');
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _messages.add({
            'role': 'assistant',
            'content': "I'm having trouble connecting right now. Can you try again?",
          });
          _isLoading = false;
          _avatarMood = 'idle';
        });
        _scrollToBottom();
      }
    }
  }

  void _clearChat() {
    setState(() {
      _messages.clear();
      _messages.add({
        'role': 'assistant',
        'content': 'Chat history cleared. How can I help you now?',
      });
      _avatarMood = 'waving';
    });
    Future.delayed(const Duration(seconds: 2), () {
      if (mounted) setState(() => _avatarMood = 'idle');
    });
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
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: AppColors.senseiPurple,
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: AppColors.brutalBlack, width: 2),
              ),
              child: const Text('🤖', style: TextStyle(fontSize: 16)),
            ),
            const SizedBox(width: 12),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  '3D Avatar Mentor',
                  style: GoogleFonts.spaceGrotesk(
                    color: AppColors.brutalBlack,
                    fontWeight: FontWeight.w900,
                    fontSize: 20,
                  ),
                ),
                Text(
                  'INTERACTIVE AI • VOICE ENABLED',
                  style: GoogleFonts.inter(
                    color: Colors.grey.shade600,
                    fontWeight: FontWeight.bold,
                    fontSize: 10,
                    letterSpacing: 1,
                  ),
                ),
              ],
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: Icon(
              _isSpeaking ? Icons.volume_up : Icons.volume_off,
              color: _isSpeaking ? AppColors.senseiGreen : Colors.grey,
            ),
            onPressed: () => setState(() => _isSpeaking = !_isSpeaking),
          ),
          IconButton(
            icon: const Icon(Icons.delete_outline, color: AppColors.senseiRed),
            onPressed: _clearChat,
          ),
        ],
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(2),
          child: Container(color: AppColors.brutalBlack, height: 2),
        ),
      ),
      body: Column(
        children: [
          // Avatar Viewer
          Container(
            height: 250,
            width: double.infinity,
            margin: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [Color(0xFFE0E7FF), Color(0xFFF3E8FF), Color(0xFFFCE7F3)],
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
              ),
              borderRadius: BorderRadius.circular(24),
              border: Border.all(color: AppColors.brutalBlack, width: 3),
              boxShadow: const [BoxShadow(color: AppColors.brutalBlack, offset: Offset(4, 4))],
            ),
            child: Stack(
              children: [
                // Top Badges
                Positioned(
                  top: 12, left: 12,
                  child: Row(
                    children: [
                      _buildBadge('Live 2D', AppColors.senseiGreen, true),
                      if (_avatarMood == 'talking') ...[
                        const SizedBox(width: 8),
                        _buildBadge('Speaking', AppColors.senseiYellow, false, icon: Icons.volume_up),
                      ],
                      if (_avatarMood == 'thinking') ...[
                        const SizedBox(width: 8),
                        _buildBadge('Thinking...', AppColors.senseiBlue, true, icon: Icons.auto_awesome),
                      ],
                    ],
                  ),
                ),
                
                // Avatar Center
                Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      AnimatedBuilder(
                        animation: _pulseController,
                        builder: (context, child) {
                          double scale = _avatarMood == 'talking' 
                              ? 1.0 + (_pulseController.value * 0.1) 
                              : 1.0;
                          return Transform.scale(
                            scale: scale,
                            child: Container(
                              width: 100, height: 100,
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                color: AppColors.senseiPurple,
                                border: Border.all(color: Colors.white, width: 4),
                                boxShadow: const [BoxShadow(color: AppColors.brutalBlack, offset: Offset(4, 4))],
                              ),
                              alignment: Alignment.center,
                              child: Text(
                                _avatarMood == 'talking' ? '🗣️' :
                                _avatarMood == 'thinking' ? '🤔' :
                                _avatarMood == 'happy' ? '😄' :
                                _avatarMood == 'waving' ? '👋' : '😊',
                                style: const TextStyle(fontSize: 48),
                              ),
                            ),
                          );
                        },
                      ),
                    ],
                  ),
                ),

                // Mood Indicator Bottom
                Positioned(
                  bottom: 12, left: 12,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha: 0.9),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: AppColors.brutalBlack, width: 2),
                    ),
                    child: Text(
                      'Mood: ${_avatarMood.toUpperCase()}',
                      style: GoogleFonts.spaceGrotesk(fontSize: 12, fontWeight: FontWeight.bold),
                    ),
                  ),
                ),
              ],
            ),
          ),

          // Chat Messages
          Expanded(
            child: Container(
              margin: const EdgeInsets.symmetric(horizontal: 16),
              decoration: BoxDecoration(
                color: const Color(0xFFFFFDF5),
                borderRadius: BorderRadius.circular(24),
                border: Border.all(color: AppColors.brutalBlack, width: 3),
              ),
              child: ListView.builder(
                controller: _scrollController,
                padding: const EdgeInsets.all(16),
                itemCount: _messages.length + (_isLoading ? 1 : 0),
                itemBuilder: (context, index) {
                  if (index == _messages.length && _isLoading) {
                    return _buildMessageBubble(true, '...', isTyping: true);
                  }
                  final msg = _messages[index];
                  final isUser = msg['role'] == 'user';
                  return _buildMessageBubble(!isUser, msg['content']);
                },
              ),
            ),
          ),

          // Input Area
          Container(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                GestureDetector(
                  onTap: () {
                    setState(() => _isListening = !_isListening);
                  },
                  child: Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: _isListening ? AppColors.senseiRed : Colors.white,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: AppColors.brutalBlack, width: 2),
                      boxShadow: const [BoxShadow(color: AppColors.brutalBlack, offset: Offset(2, 2))],
                    ),
                    child: Icon(
                      _isListening ? Icons.mic_off : Icons.mic,
                      color: _isListening ? Colors.white : AppColors.brutalBlack,
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: TextField(
                    controller: _msgController,
                    onSubmitted: (_) => _sendMessage(),
                    style: GoogleFonts.inter(fontWeight: FontWeight.w600),
                    decoration: InputDecoration(
                      hintText: _isListening ? 'Listening...' : 'Talk to your mentor...',
                      filled: true,
                      fillColor: Colors.white,
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: const BorderSide(color: AppColors.brutalBlack, width: 2),
                      ),
                      enabledBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: const BorderSide(color: AppColors.brutalBlack, width: 2),
                      ),
                      focusedBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: const BorderSide(color: AppColors.senseiPurple, width: 2),
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                GestureDetector(
                  onTap: _sendMessage,
                  child: Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: AppColors.senseiPurple,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: AppColors.brutalBlack, width: 2),
                      boxShadow: const [BoxShadow(color: AppColors.brutalBlack, offset: Offset(2, 2))],
                    ),
                    child: const Icon(Icons.send, color: Colors.white),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBadge(String text, Color color, bool animate, {IconData? icon}) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: AppColors.brutalBlack, width: 2),
        boxShadow: const [BoxShadow(color: AppColors.brutalBlack, offset: Offset(2, 2))],
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (icon != null) ...[
            Icon(icon, size: 12, color: color),
            const SizedBox(width: 4),
          ] else ...[
            Container(
              width: 8, height: 8,
              decoration: BoxDecoration(color: color, shape: BoxShape.circle),
            ),
            const SizedBox(width: 4),
          ],
          Text(text, style: GoogleFonts.spaceGrotesk(fontSize: 10, fontWeight: FontWeight.bold)),
        ],
      ),
    );
  }

  Widget _buildMessageBubble(bool isBot, String text, {bool isTyping = false}) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Row(
        mainAxisAlignment: isBot ? MainAxisAlignment.start : MainAxisAlignment.end,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (isBot) ...[
            Container(
              width: 32, height: 32,
              decoration: BoxDecoration(
                color: AppColors.senseiPurple,
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: AppColors.brutalBlack, width: 2),
              ),
              child: const Icon(Icons.auto_awesome, color: Colors.white, size: 16),
            ),
            const SizedBox(width: 12),
          ],
          Flexible(
            child: Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: isBot ? Colors.white : AppColors.senseiYellow.withValues(alpha: 0.3),
                borderRadius: BorderRadius.only(
                  topLeft: Radius.circular(isBot ? 0 : 16),
                  topRight: Radius.circular(isBot ? 16 : 0),
                  bottomLeft: const Radius.circular(16),
                  bottomRight: const Radius.circular(16),
                ),
                border: Border.all(color: AppColors.brutalBlack, width: 2),
              ),
              child: isTyping
                  ? Row(
                      mainAxisSize: MainAxisSize.min,
                      children: const [
                        Icon(Icons.more_horiz, color: AppColors.brutalBlack),
                      ],
                    )
                  : Text(
                      text,
                      style: GoogleFonts.inter(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                        color: AppColors.brutalBlack,
                      ),
                    ),
            ),
          ),
          if (!isBot) ...[
            const SizedBox(width: 12),
            Container(
              width: 32, height: 32,
              decoration: BoxDecoration(
                color: AppColors.senseiYellow,
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: AppColors.brutalBlack, width: 2),
              ),
              child: const Icon(Icons.person, color: AppColors.brutalBlack, size: 16),
            ),
          ],
        ],
      ),
    );
  }
}
