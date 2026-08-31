import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:flutter_markdown/flutter_markdown.dart';
import 'package:speech_to_text/speech_to_text.dart';
import '../../theme/neubrutalist_widgets.dart';
import '../../theme/app_colors.dart';
import '../../config/env.dart';
import '../../services/api_service.dart';

class ChatbotScreen extends ConsumerStatefulWidget {
  const ChatbotScreen({super.key});

  @override
  ConsumerState<ChatbotScreen> createState() => _ChatbotScreenState();
}

class _ChatbotScreenState extends ConsumerState<ChatbotScreen> {
  final _inputController = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  final SpeechToText _speechToText = SpeechToText();
  
  List<Map<String, dynamic>> _messages = [];
  bool _isLoading = false;
  bool _speechEnabled = false;
  bool _isListening = false;

  @override
  void initState() {
    super.initState();
    _initSpeech();
    _fetchHistory();
  }

  void _initSpeech() async {
    _speechEnabled = await _speechToText.initialize();
    setState(() {});
  }

  @override
  void dispose() {
    _inputController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  Future<void> _fetchHistory() async {
    try {
      final response = await ApiService().get('/api/chatbot/history');
      if (response.data['messages'] != null) {
        setState(() {
          _messages = List<Map<String, dynamic>>.from(response.data['messages']);
        });
        _scrollToBottom();
      }
    } catch (e) {
      // Ignore if no history or error
    }
  }

  Future<void> _clearHistory() async {
    try {
      await ApiService().delete('/api/chatbot/history');
      setState(() {
        _messages = [];
      });
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Failed to clear history')),
        );
      }
    }
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

    final userMsg = {
      'role': 'user',
      'content': text,
      'timestamp': DateTime.now().toIso8601String(),
    };

    setState(() {
      _messages.add(userMsg);
      _inputController.clear();
      _isLoading = true;
    });
    _scrollToBottom();

    try {
      final response = await ApiService().post(
        '/api/chatbot/chat',
        data: {
          'message': text,
        },
      );
      
      final replyText = response.data['reply'] ?? '...';

      setState(() {
        _messages.add({
          'role': 'assistant',
          'content': replyText,
          'timestamp': DateTime.now().toIso8601String(),
        });
      });
    } catch (e) {
      setState(() {
        _messages.add({
          'role': 'assistant',
          'content': 'Sorry, please try again.',
          'timestamp': DateTime.now().toIso8601String(),
        });
      });
    } finally {
      setState(() {
        _isLoading = false;
      });
      _scrollToBottom();
    }
  }

  void _toggleListening() async {
    if (_isListening) {
      await _speechToText.stop();
      setState(() {
        _isListening = false;
      });
    } else {
      if (_speechEnabled) {
        setState(() {
          _isListening = true;
        });
        await _speechToText.listen(
          onResult: (result) {
            setState(() {
              _inputController.text = result.recognizedWords;
              if (result.hasConfidenceRating && result.confidence > 0) {
                // Speech finished correctly
              }
            });
          },
        );
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Microphone permissions denied or not available.')),
        );
      }
    }
  }

  Widget _buildMessageBubble(Map<String, dynamic> msg) {
    final isUser = msg['role'] == 'user';
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Padding(
      padding: const EdgeInsets.only(bottom: 12.0),
      child: Row(
        mainAxisAlignment: isUser ? MainAxisAlignment.end : MainAxisAlignment.start,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (!isUser)
            Container(
              margin: const EdgeInsets.only(right: 8),
              width: 32,
              height: 32,
              decoration: BoxDecoration(
                color: AppColors.senseiPurple,
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Icon(Icons.auto_awesome, color: Colors.white, size: 16),
            ),
          Flexible(
            child: BrutalistCard(
              backgroundColor: isUser 
                  ? AppColors.senseiYellow 
                  : (isDark ? AppColors.darkCard : Colors.white),
              padding: const EdgeInsets.all(12),
              borderRadius: BorderRadius.circular(16).copyWith(
                bottomRight: isUser ? const Radius.circular(0) : const Radius.circular(16),
                bottomLeft: !isUser ? const Radius.circular(0) : const Radius.circular(16),
              ),
              child: isUser 
                  ? Text(
                      msg['content'] ?? '',
                      style: GoogleFonts.fredoka(
                        fontSize: 16,
                        color: Colors.black,
                      ),
                    )
                  : MarkdownBody(
                      data: msg['content'] ?? '',
                      styleSheet: MarkdownStyleSheet(
                        p: GoogleFonts.fredoka(
                          fontSize: 16,
                          color: isDark ? Colors.white : Colors.black,
                        ),
                      ),
                    ),
            ),
          ),
          if (isUser)
            Container(
              margin: const EdgeInsets.only(left: 8),
              width: 32,
              height: 32,
              decoration: BoxDecoration(
                color: AppColors.senseiYellow,
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: AppColors.brutalBlack, width: 2),
              ),
              child: const Icon(Icons.person, color: Colors.black, size: 16),
            ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: isDark ? const Color(0xFF050508) : const Color(0xFFFEF9C3),
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              '🤖 AI Study Mentor',
              style: GoogleFonts.fredoka(fontWeight: FontWeight.bold),
            ),
            Text(
              'Powered by Gemini 2.0 Flash',
              style: GoogleFonts.spaceMono(fontSize: 10, color: Colors.grey),
            ),
          ],
        ),
        backgroundColor: Colors.transparent,
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.delete_outline, color: Colors.red),
            onPressed: _clearHistory,
          ),
        ],
      ),
      body: Column(
        children: [
          Expanded(
            child: Container(
              margin: const EdgeInsets.all(16),
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: isDark ? const Color(0xFF1E293B) : Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: AppColors.brutalBlack, width: 4),
              ),
              child: _messages.isEmpty
                  ? Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const Icon(Icons.chat_bubble_outline, size: 48, color: Colors.grey),
                          const SizedBox(height: 16),
                          Text(
                            'Ask me anything!',
                            style: GoogleFonts.fredoka(fontSize: 20, color: Colors.grey),
                          ),
                        ],
                      ),
                    )
                  : ListView.builder(
                      controller: _scrollController,
                      itemCount: _messages.length + (_isLoading ? 1 : 0),
                      itemBuilder: (context, index) {
                        if (index == _messages.length) {
                          return Padding(
                            padding: const EdgeInsets.all(8.0),
                            child: Row(
                              children: [
                                const CircularProgressIndicator(),
                                const SizedBox(width: 16),
                                Text('Thinking...', style: GoogleFonts.fredoka()),
                              ],
                            ),
                          );
                        }
                        return _buildMessageBubble(_messages[index]);
                      },
                    ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
            child: Row(
              children: [
                IconButton(
                  icon: Icon(_isListening ? Icons.mic_off : Icons.mic),
                  style: IconButton.styleFrom(
                    backgroundColor: _isListening ? Colors.red.shade400 : Colors.grey.shade200,
                    foregroundColor: _isListening ? Colors.white : Colors.black,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                      side: const BorderSide(color: AppColors.brutalBlack, width: 2),
                    ),
                  ),
                  onPressed: _toggleListening,
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: TextField(
                    controller: _inputController,
                    onSubmitted: (_) => _sendMessage(),
                    style: GoogleFonts.fredoka(),
                    decoration: InputDecoration(
                      hintText: _isListening ? 'Listening...' : 'Ask about study tips...',
                      filled: true,
                      fillColor: isDark ? const Color(0xFF1E293B) : Colors.white,
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
                        borderSide: const BorderSide(color: AppColors.brutalBlack, width: 3),
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                ComicCard(
                  onTap: _sendMessage,
                  backgroundColor: AppColors.senseiYellow,
                  padding: const EdgeInsets.all(12),
                  child: const Icon(Icons.send, color: AppColors.brutalBlack),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
