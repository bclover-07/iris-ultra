import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:flutter_markdown/flutter_markdown.dart';
import '../../theme/admin_theme.dart';
import '../../theme/admin_glass_widgets.dart';
import '../../services/api_service.dart';

class AdminChatbotScreen extends ConsumerStatefulWidget {
  const AdminChatbotScreen({super.key});

  @override
  ConsumerState<AdminChatbotScreen> createState() => _AdminChatbotScreenState();
}

class _AdminChatbotScreenState extends ConsumerState<AdminChatbotScreen> {
  final TextEditingController _messageController = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  final List<Map<String, String>> _messages = [];
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    _messages.add({
      'role': 'assistant',
      'content': 'Hello Admin. I am your Executive AI Assistant. How can I help you manage the campus today?'
    });
  }

  @override
  void dispose() {
    _messageController.dispose();
    _scrollController.dispose();
    super.dispose();
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
    if (_messageController.text.trim().isEmpty) return;

    final userMessage = _messageController.text.trim();
    setState(() {
      _messages.add({'role': 'user', 'content': userMessage});
      _messageController.clear();
      _isLoading = true;
    });
    _scrollToBottom();

    try {
      final api = ApiService();
      final response = await api.authenticatedPost(
        '/api/chatbot/admin/chat',
        data: {'message': userMessage},
      );
      if (mounted) {
        setState(() {
          _messages.add({'role': 'assistant', 'content': response?['reply'] ?? 'Received.'});
          _isLoading = false;
        });
        _scrollToBottom();
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _messages.add({
            'role': 'assistant',
            'content': 'Oops! Something went wrong connecting to the assistant. Please try again later.'
          });
          _isLoading = false;
        });
        _scrollToBottom();
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final t = AdminTheme.of(context);

    return Column(
      children: [
        // Screen Header
        Padding(
          padding: const EdgeInsets.all(16.0),
          child: Row(
            children: [
              Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: AdminTheme.accentGradient(context),
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.circular(14),
                  boxShadow: [
                    BoxShadow(
                      color: t.admAccent.withValues(alpha: 0.2),
                      blurRadius: 8,
                      offset: const Offset(0, 2),
                    ),
                  ],
                ),
                child: const Icon(Icons.smart_toy_rounded, color: Colors.white, size: 24),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Executive AI Assistant',
                      style: GoogleFonts.spaceGrotesk(
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                        color: t.admText,
                      ),
                    ),
                    Text(
                      'Always online',
                      style: GoogleFonts.inter(
                        fontSize: 12,
                        color: t.success,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
        Divider(color: t.admBorderSolid.withValues(alpha: 0.5), height: 1),

        // Chat History List
        Expanded(
          child: ListView.builder(
            controller: _scrollController,
            padding: const EdgeInsets.all(16),
            itemCount: _messages.length + (_isLoading ? 1 : 0),
            itemBuilder: (context, index) {
              if (index == _messages.length && _isLoading) {
                return Padding(
                  padding: const EdgeInsets.only(bottom: 16),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.start,
                    children: [
                      AdminGlassContainer(
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                        child: SizedBox(
                          width: 16,
                          height: 16,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            color: t.admAccent,
                          ),
                        ),
                      ),
                    ],
                  ),
                );
              }

              final message = _messages[index];
              final isUser = message['role'] == 'user';

              return Padding(
                padding: const EdgeInsets.only(bottom: 16),
                child: Row(
                  mainAxisAlignment: isUser ? MainAxisAlignment.end : MainAxisAlignment.start,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    if (!isUser) ...[
                      Container(
                        margin: const EdgeInsets.only(right: 8, top: 4),
                        width: 32,
                        height: 32,
                        decoration: BoxDecoration(
                          gradient: LinearGradient(colors: AdminTheme.accentGradient(context)),
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(Icons.smart_toy_rounded, color: Colors.white, size: 16),
                      ),
                    ],
                    Flexible(
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                        decoration: BoxDecoration(
                          gradient: isUser
                              ? LinearGradient(
                                  colors: AdminTheme.accentGradient(context),
                                  begin: Alignment.topLeft,
                                  end: Alignment.bottomRight,
                                )
                              : null,
                          color: isUser ? null : t.admSurface,
                          borderRadius: BorderRadius.circular(16).copyWith(
                            bottomRight: isUser ? const Radius.circular(0) : const Radius.circular(16),
                            bottomLeft: !isUser ? const Radius.circular(0) : const Radius.circular(16),
                          ),
                          border: isUser
                              ? null
                              : Border.all(color: t.admBorderSolid.withValues(alpha: 0.5)),
                          boxShadow: isUser
                              ? [
                                  BoxShadow(
                                    color: t.admAccent.withValues(alpha: 0.25),
                                    blurRadius: 6,
                                    offset: const Offset(0, 2),
                                  ),
                                ]
                              : [
                                  BoxShadow(
                                    color: t.admShadow.withValues(alpha: 0.05),
                                    blurRadius: 4,
                                    offset: const Offset(0, 1),
                                  ),
                                ],
                        ),
                        child: isUser
                            ? Text(
                                message['content']!,
                                style: GoogleFonts.inter(
                                  color: Colors.white,
                                  fontSize: 14.5,
                                  height: 1.4,
                                ),
                              )
                            : MarkdownBody(
                                data: message['content']!,
                                styleSheet: MarkdownStyleSheet(
                                  p: GoogleFonts.inter(
                                    color: t.admText,
                                    fontSize: 14.5,
                                    height: 1.4,
                                  ),
                                  h1: GoogleFonts.spaceGrotesk(color: t.admText, fontWeight: FontWeight.bold),
                                  h2: GoogleFonts.spaceGrotesk(color: t.admText, fontWeight: FontWeight.bold),
                                  listBullet: GoogleFonts.inter(color: t.admText),
                                ),
                              ),
                      ),
                    ),
                    if (isUser) const SizedBox(width: 40),
                  ],
                ),
              );
            },
          ),
        ),

        // Message Input Panel
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: t.admSurface,
            border: Border(top: BorderSide(color: t.admBorderSolid.withValues(alpha: 0.5))),
          ),
          child: Row(
            children: [
              Expanded(
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  decoration: BoxDecoration(
                    color: t.admInputBg,
                    borderRadius: BorderRadius.circular(24),
                    border: Border.all(color: t.admInputBorder.withValues(alpha: 0.5)),
                  ),
                  child: TextField(
                    controller: _messageController,
                    decoration: InputDecoration(
                      hintText: 'Ask for system insights...',
                      hintStyle: GoogleFonts.inter(color: t.admTextMuted),
                      border: InputBorder.none,
                    ),
                    style: GoogleFonts.inter(color: t.admText),
                    onSubmitted: (_) => _sendMessage(),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              GestureDetector(
                onTap: _sendMessage,
                child: Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    gradient: LinearGradient(colors: AdminTheme.accentGradient(context)),
                    shape: BoxShape.circle,
                    boxShadow: [
                      BoxShadow(
                        color: t.admAccent.withValues(alpha: 0.25),
                        blurRadius: 8,
                        offset: const Offset(0, 2),
                      ),
                    ],
                  ),
                  child: const Icon(Icons.send_rounded, color: Colors.white, size: 20),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}
