import 'dart:typed_data';
import 'dart:convert';
import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_markdown/flutter_markdown.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:just_audio/just_audio.dart';
import '../../services/api_service.dart';
import '../../theme/app_colors.dart';
import '../../config/env.dart';

class TeacherAiChatbot extends StatefulWidget {
  const TeacherAiChatbot({super.key});

  @override
  State<TeacherAiChatbot> createState() => _TeacherAiChatbotState();
}

class _TeacherAiChatbotState extends State<TeacherAiChatbot> {
  bool _isOpen = false;
  bool _isLoading = false;
  final _inputController = TextEditingController();
  final _scrollController = ScrollController();
  final List<Map<String, String>> _messages = [];
  final _audioPlayer = AudioPlayer();
  bool _isSpeaking = false;
  bool _isPlayingAudio = false;

  @override
  void dispose() {
    _inputController.dispose();
    _scrollController.dispose();
    _audioPlayer.dispose();
    super.dispose();
  }

  Future<void> _playTTS(String text, {bool forcePlay = false}) async {
    if (!_isSpeaking && !forcePlay) return;
    try {
      setState(() => _isPlayingAudio = true);
      final token = await ApiService().getToken();
      final uri = '${Env.apiBaseUrl}/api/tts/generate?text=${Uri.encodeComponent(text)}${token != null ? '&token=$token' : ''}';
      await _audioPlayer.setUrl(
        uri,
      );
      await _audioPlayer.play();
    } catch (e) {
      debugPrint('TTS Error: $e');
    } finally {
      if (mounted) setState(() => _isPlayingAudio = false);
    }
  }

  void _openChat() {
    setState(() {
      _isOpen = true;
      if (_messages.isEmpty) {
        _messages.add({
          'role': 'assistant',
          'content':
              'Hello Professor. I am your Faculty AI Assistant. How can I assist you with your classes today?',
        });
      }
    });
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  Future<void> _sendMessage() async {
    final text = _inputController.text.trim();
    if (text.isEmpty || _isLoading) return;

    setState(() {
      _messages.add({'role': 'user', 'content': text});
      _inputController.clear();
      _isLoading = true;
    });
    _scrollToBottom();

    try {
      final response = await ApiService().post(
        '/api/chatbot/teacher/chat',
        data: {'message': text},
      );
      if (!mounted) return;
      setState(() {
        _messages.add({
          'role': 'assistant',
          'content': response.data['reply']?.toString() ??
              'Sorry, I could not generate a response.',
        });
      });
      if (_isSpeaking && response.data['reply'] != null) {
        _playTTS(response.data['reply']);
      }
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _messages.add({
          'role': 'assistant',
          'content':
              'Oops! Something went wrong while connecting to the assistant. Please try again.',
        });
      });
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
        _scrollToBottom();
      }
    }
  }

  Widget _buildMessage(Map<String, String> msg) {
    final isUser = msg['role'] == 'user';
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Align(
        alignment: isUser ? Alignment.centerRight : Alignment.centerLeft,
        child: Container(
          constraints: const BoxConstraints(maxWidth: 280),
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: isUser ? AppColors.senseiPurple : Colors.white,
            border: Border.all(color: AppColors.brutalBlack, width: 2),
            boxShadow: const [BoxShadow(color: AppColors.brutalBlack, offset: Offset(3, 3))],
          ),
          child: isUser
              ? Text(
                  msg['content'] ?? '',
                  style: GoogleFonts.inter(
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                    fontSize: 14,
                  ),
                )
              : Stack(
                  clipBehavior: Clip.none,
                  children: [
                    MarkdownBody(
                      data: msg['content'] ?? '',
                      styleSheet: MarkdownStyleSheet(
                        p: GoogleFonts.inter(
                          fontWeight: FontWeight.w600,
                          color: AppColors.brutalBlack,
                          fontSize: 14,
                        ),
                      ),
                    ),
                    Positioned(
                      bottom: -8,
                      right: -8,
                      child: GestureDetector(
                        onTap: () => _playTTS(msg['content'] ?? '', forcePlay: true),
                        child: Container(
                          padding: const EdgeInsets.all(4),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            shape: BoxShape.circle,
                            border: Border.all(color: AppColors.brutalBlack, width: 1),
                          ),
                          child: const Icon(Icons.volume_up, size: 14, color: AppColors.senseiPurple),
                        ),
                      ),
                    ),
                  ],
                ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Stack(
      clipBehavior: Clip.none,
      children: [
        if (!_isOpen)
          Positioned(
            right: 16,
            bottom: 16,
            child: GestureDetector(
              onTap: _openChat,
              child: Container(
                width: 56,
                height: 56,
                decoration: BoxDecoration(
                  color: AppColors.senseiPurple,
                  shape: BoxShape.circle,
                  border: Border.all(color: AppColors.brutalBlack, width: 3),
                  boxShadow: const [BoxShadow(color: AppColors.brutalBlack, offset: Offset(4, 4))],
                ),
                child: const Icon(Icons.smart_toy, color: Colors.white, size: 28),
              ),
            ),
          ),
        if (_isOpen)
          Positioned(
            right: 16,
            bottom: 16,
            child: Material(
              elevation: 0,
              color: Colors.transparent,
              child: Container(
                width: MediaQuery.of(context).size.width > 420 ? 380 : MediaQuery.of(context).size.width - 32,
                height: MediaQuery.of(context).size.height * 0.65,
                constraints: const BoxConstraints(maxHeight: 560),
                decoration: BoxDecoration(
                  color: AppColors.brutalBg,
                  border: Border.all(color: AppColors.brutalBlack, width: 4),
                  boxShadow: const [BoxShadow(color: AppColors.brutalBlack, offset: Offset(6, 6))],
                ),
                child: Column(
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                      color: AppColors.senseiPurple,
                      child: Row(
                        children: [
                          Container(
                            width: 36,
                            height: 36,
                            decoration: BoxDecoration(
                              color: Colors.white.withValues(alpha: 0.2),
                              border: Border.all(color: Colors.white.withValues(alpha: 0.4), width: 2),
                            ),
                            child: const Icon(Icons.smart_toy, color: Colors.white, size: 20),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Text(
                              'FACULTY AI',
                              style: GoogleFonts.inter(
                                fontWeight: FontWeight.w900,
                                fontSize: 18,
                                color: Colors.white,
                                letterSpacing: 1,
                              ),
                            ),
                          ),
                          IconButton(
                            icon: Icon(_isSpeaking ? Icons.volume_up : Icons.volume_off, color: Colors.white),
                            onPressed: () => setState(() => _isSpeaking = !_isSpeaking),
                          ),
                          IconButton(
                            icon: const Icon(Icons.close, color: Colors.white),
                            onPressed: () => setState(() => _isOpen = false),
                          ),
                        ],
                      ),
                    ),
                    Expanded(
                      child: ListView.builder(
                        controller: _scrollController,
                        padding: const EdgeInsets.all(16),
                        itemCount: _messages.length + (_isLoading ? 1 : 0),
                        itemBuilder: (context, index) {
                          if (index == _messages.length) {
                            return Padding(
                              padding: const EdgeInsets.all(8),
                              child: Row(
                                children: [
                                  const SizedBox(
                                    width: 16,
                                    height: 16,
                                    child: CircularProgressIndicator(strokeWidth: 2),
                                  ),
                                  const SizedBox(width: 12),
                                  Text('Thinking...', style: GoogleFonts.inter(fontWeight: FontWeight.bold)),
                                ],
                              ),
                            );
                          }
                          return _buildMessage(_messages[index]);
                        },
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: const BoxDecoration(
                        color: Colors.white,
                        border: Border(top: BorderSide(color: AppColors.brutalBlack, width: 3)),
                      ),
                      child: Row(
                        children: [
                          Expanded(
                            child: TextField(
                              controller: _inputController,
                              decoration: InputDecoration(
                                hintText: 'Ask for insights...',
                                hintStyle: GoogleFonts.inter(color: Colors.grey),
                                border: const OutlineInputBorder(
                                  borderSide: BorderSide(color: AppColors.brutalBlack, width: 2),
                                ),
                                focusedBorder: const OutlineInputBorder(
                                  borderSide: BorderSide(color: AppColors.senseiPurple, width: 2),
                                ),
                                contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                              ),
                              onSubmitted: (_) => _sendMessage(),
                            ),
                          ),
                          const SizedBox(width: 8),
                          GestureDetector(
                            onTap: _isLoading ? null : _sendMessage,
                            child: Container(
                              width: 44,
                              height: 44,
                              decoration: BoxDecoration(
                                color: AppColors.senseiPurple,
                                border: Border.all(color: AppColors.brutalBlack, width: 2),
                                boxShadow: const [BoxShadow(color: AppColors.brutalBlack, offset: Offset(2, 2))],
                              ),
                              child: _isLoading
                                  ? const Padding(
                                      padding: EdgeInsets.all(10),
                                      child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                                    )
                                  : const Icon(Icons.send, color: Colors.white, size: 20),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
      ],
    );
  }
}
