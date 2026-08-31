import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:go_router/go_router.dart';
import 'package:speech_to_text/speech_to_text.dart';
import 'package:socket_io_client/socket_io_client.dart' as IO;
import 'package:just_audio/just_audio.dart';
import 'package:dio/dio.dart';
import '../../theme/app_colors.dart';
import '../../config/env.dart';
import '../../providers/auth_provider.dart';
import '../../services/api_service.dart';

class DebateSessionScreen extends ConsumerStatefulWidget {
  final String sessionId;
  final String topic;
  final String aiPersonality;

  const DebateSessionScreen({
    super.key,
    required this.sessionId,
    required this.topic,
    required this.aiPersonality,
  });

  @override
  ConsumerState<DebateSessionScreen> createState() =>
      _DebateSessionScreenState();
}

class _DebateSessionScreenState extends ConsumerState<DebateSessionScreen>
    with TickerProviderStateMixin {
  final SpeechToText _speechToText = SpeechToText();
  final AudioPlayer _audioPlayer = AudioPlayer();
  final ScrollController _scrollController = ScrollController();
  IO.Socket? _socket;

  bool _speechEnabled = false;
  bool _isListening = false;
  bool _isProcessing = false;
  bool _isAISpeaking = false;
  bool _sessionStarted = false;
  bool _isConnecting = true;
  bool _topicConfirmed = false;
  bool _isKeyboardMode = false;
  bool _userWantsListening = false;
  bool _isSpeechRestarting = false;
  bool _isMuted = false;
  final TextEditingController _textController = TextEditingController();
  String _selectedSide = 'pro';

  String _committedTranscript = '';
  String _currentSpeechText = '';
  int _speechSessionCount = 0;
  String get _liveTranscript {
    final comm = _committedTranscript.trim();
    final curr = _currentSpeechText.trim();
    if (comm.isEmpty) return curr;
    if (curr.isEmpty) return comm;
    return '$comm $curr';
  }

  int _round = 0;
  int _totalRounds = 6;
  int _heatLevel = 1;
  int _crowdMood = 50;
  String _currentAIText = '';
  String? _coachingNudge;

  final List<Map<String, dynamic>> _messages = [];

  late AnimationController _pulseController;
  late Animation<double> _pulseAnimation;
  late AnimationController _fireController;
  late Animation<double> _fireAnimation;

  String get _personalityLabel {
    const labels = {
      'aggressive_politician': 'Aggressive Politician',
      'calm_professor': 'Calm Professor',
      'troll_debater': 'Troll Debater',
      'fast_thinker': 'Fast Thinker',
      'passive_opponent': 'Passive Opponent',
      'news_anchor': 'News Anchor',
      'startup_investor': 'Startup Investor',
      'toxic_opponent': 'Toxic Opponent',
    };
    return labels[widget.aiPersonality] ?? widget.aiPersonality;
  }

  String get _personalityEmoji {
    const emojis = {
      'aggressive_politician': '🎤',
      'calm_professor': '📚',
      'troll_debater': '😈',
      'fast_thinker': '⚡',
      'passive_opponent': '😶',
      'news_anchor': '📺',
      'startup_investor': '💰',
      'toxic_opponent': '☠️',
    };
    return emojis[widget.aiPersonality] ?? '⚔️';
  }

  @override
  void initState() {
    super.initState();
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1200),
    )..repeat(reverse: true);
    _pulseAnimation =
        Tween<double>(begin: 1.0, end: 1.15).animate(_pulseController);

    _fireController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 800),
    )..repeat(reverse: true);
    _fireAnimation =
        Tween<double>(begin: 0.8, end: 1.0).animate(_fireController);

    _audioPlayer.playerStateStream.listen((state) {
      if (state.processingState == ProcessingState.completed) {
        if (mounted) setState(() => _isAISpeaking = false);
      }
    });

    _initSpeech();
  }

  void _initSpeech() async {
    _speechEnabled = await _speechToText.initialize(
      onError: (error) {
        debugPrint('STT Error: $error');
        if (_userWantsListening) {
          _commitCurrentSpeech();
          _restartListening();
        } else {
          if (mounted) setState(() => _isListening = false);
        }
      },
      onStatus: (status) {
        debugPrint('STT Status: $status');
        if (status == 'done' || status == 'notListening') {
          if (_userWantsListening) {
            _commitCurrentSpeech();
            _restartListening();
          } else {
            if (mounted) setState(() => _isListening = false);
          }
        }
      },
    );
    if (mounted) setState(() {});
  }

  void _commitCurrentSpeech() {
    final curr = _currentSpeechText.trim();
    if (curr.isNotEmpty) {
      setState(() {
        if (_committedTranscript.trim().isEmpty) {
          _committedTranscript = curr;
        } else {
          _committedTranscript = '${_committedTranscript.trim()} $curr';
        }
        _currentSpeechText = '';
      });
    }
  }

  void _restartListening() {
    if (!_userWantsListening || !mounted || _isSpeechRestarting) return;
    _isSpeechRestarting = true;
    Future.delayed(const Duration(milliseconds: 300), () async {
      _isSpeechRestarting = false;
      if (_userWantsListening && mounted) {
        if (!_speechToText.isListening) {
          _startListening();
        }
      }
    });
  }

  void _confirmTopicAndStart() {
    setState(() => _topicConfirmed = true);
    _initSocket();
  }

  void _initSocket() {
    final user = ref.read(authProvider);
    if (user == null || !user.isAuthenticated) {
      setState(() => _isConnecting = false);
      _addSystemMessage('Authentication required. Please log in again.');
      return;
    }

    _socket = IO.io(
      '${Env.socketUrl}/debate',
      IO.OptionBuilder()
          .setTransports(['websocket'])
          .disableAutoConnect()
          .setExtraHeaders({'Authorization': 'Bearer ${user.accessToken}'})
          .build(),
    );

    _socket?.connect();

    _socket?.onConnect((_) {
      if (mounted) {
        setState(() {
          _isConnecting = false;
          _sessionStarted = true;
        });
      }
      _socket?.emit('debate:start', {
        'sessionId': widget.sessionId,
        'userId': user.user?.id,
        'topic': widget.topic,
        'aiPersonality': widget.aiPersonality,
        'side': _selectedSide,
      });
    });

    _socket?.onConnectError((data) {
      if (mounted) {
        setState(() => _isConnecting = false);
        _addSystemMessage('Connection failed. Please check your network.');
      }
    });

    _socket?.on('debate:ai_turn', _handleAITurn);
    _socket?.on('debate:thinking', _handleThinking);
    _socket?.on('debate:complete', _handleComplete);
    _socket?.on('debate:crowd_reaction', _handleCrowdReaction);
    _socket?.on('debate:error', (data) {
      if (mounted) {
        _addSystemMessage(data['message'] ?? 'An error occurred.');
        setState(() => _isProcessing = false);
      }
    });
  }

  void _handleAITurn(dynamic data) {
    if (!mounted) return;
    final payload = data is Map && data.containsKey('frontendPayload')
        ? data['frontendPayload'] ?? data
        : data;

    final aiText = payload['aiText'] ?? data['aiText'] ?? '';

    setState(() {
      _isProcessing = false;
      _currentAIText = aiText;
      _round = payload['round'] ?? data['round'] ?? _round;
      _totalRounds = payload['totalRounds'] ?? data['totalRounds'] ?? _totalRounds;
      _heatLevel = payload['heatLevel'] ?? data['heatLevel'] ?? _heatLevel;
      _crowdMood = payload['crowdMood'] ?? data['crowdMood'] ?? _crowdMood;
      _coachingNudge = payload['coachingNudge'] ?? data['coachingNudge'];
    });

    if (aiText.isNotEmpty) {
      _addMessage(aiText, isAI: true);
      _playTTS(aiText);
    }
  }

  void _handleThinking(dynamic data) {
    if (!mounted) return;
    setState(() => _isProcessing = true);
  }

  void _handleComplete(dynamic data) {
    if (!mounted) return;
    _showCompletionDialog(data);
  }

  void _handleCrowdReaction(dynamic data) {
    if (!mounted) return;
    setState(() {
      _crowdMood = data['mood'] ?? _crowdMood;
    });
  }

  void _showCompletionDialog(dynamic data) {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppColors.brutalBg,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(20),
          side: const BorderSide(color: AppColors.brutalBlack, width: 3),
        ),
        title: Text(
          '⚔️ Debate Complete!',
          style: GoogleFonts.spaceGrotesk(fontWeight: FontWeight.w900, fontSize: 22),
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              'Topic: "${widget.topic}"',
              style: GoogleFonts.inter(fontSize: 13, fontStyle: FontStyle.italic),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 12),
            Text(
              'vs $_personalityLabel $_personalityEmoji',
              style: GoogleFonts.spaceGrotesk(fontSize: 16, fontWeight: FontWeight.bold),
            ),
            if (data['xpEarned'] != null) ...[
              const SizedBox(height: 16),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                decoration: BoxDecoration(
                  color: AppColors.senseiGreen,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppColors.brutalBlack, width: 2),
                ),
                child: Text(
                  '+${data['xpEarned']} XP Earned!',
                  style: GoogleFonts.spaceGrotesk(fontWeight: FontWeight.bold, fontSize: 18),
                ),
              ),
            ],
          ],
        ),
        actions: [
          TextButton(
            onPressed: () {
              Navigator.of(ctx).pop();
              context.pop();
            },
            child: Text(
              'Done',
              style: GoogleFonts.spaceGrotesk(fontWeight: FontWeight.bold, color: AppColors.brutalBlack),
            ),
          ),
        ],
      ),
    );
  }

  void _addMessage(String text, {required bool isAI}) {
    if (text.isEmpty) return;
    setState(() {
      _messages.add({'text': text, 'isAI': isAI, 'time': DateTime.now()});
    });
    _scrollToBottom();
  }

  void _addSystemMessage(String text) {
    setState(() {
      _messages.add({'text': text, 'isSystem': true, 'time': DateTime.now()});
    });
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

  Future<void> _playTTS(String text) async {
    if (_isMuted) return;
    try {
      setState(() => _isAISpeaking = true);
      await _audioPlayer.stop();

      final response = await ApiService().post(
        '/api/tts/generate',
        data: {'text': text},
        options: Options(responseType: ResponseType.bytes),
      );

      final audioSource = _BytesAudioSource(response.data);
      await _audioPlayer.setAudioSource(audioSource);
      await _audioPlayer.play();
    } catch (e) {
      debugPrint('TTS Error: $e');
      if (mounted) setState(() => _isAISpeaking = false);
    }
  }

  void _replayCurrentQuestion() {
    if (_currentAIText.isNotEmpty) {
      _playTTS(_currentAIText);
    }
  }

  void _switchToKeyboardMode() {
    _commitCurrentSpeech();
    final fullTranscript = _liveTranscript.trim();
    if (fullTranscript.isNotEmpty) {
      _textController.text = fullTranscript;
    }
    setState(() {
      _isKeyboardMode = true;
      _userWantsListening = false;
      _isListening = false;
    });
    _speechToText.stop();
  }

  void _switchToVoiceMode() {
    final typedText = _textController.text.trim();
    setState(() {
      _isKeyboardMode = false;
      _committedTranscript = typedText;
      _currentSpeechText = '';
      _textController.clear();
    });
  }

  void _startListening() async {
    if (!_speechEnabled || _isAISpeaking || _isProcessing) return;

    setState(() {
      _userWantsListening = true;
      _isListening = true;
      _speechSessionCount++;
    });

    final currentSession = _speechSessionCount;
    _currentSpeechText = '';

    debugPrint('STT Debate: Starting session #$currentSession. Committed: "$_committedTranscript"');

    try {
      await _speechToText.listen(
        onResult: (result) {
          if (mounted && _userWantsListening && currentSession == _speechSessionCount) {
            setState(() {
              if (result.recognizedWords.isNotEmpty) {
                _currentSpeechText = result.recognizedWords;
              }
            });
          }
        },
        listenFor: const Duration(minutes: 5),
        pauseFor: const Duration(seconds: 10),
        listenMode: ListenMode.dictation,
      );
    } catch (e) {
      debugPrint('STT Debate listen error: $e');
      if (currentSession == _speechSessionCount) {
        _restartListening();
      }
    }
  }

  void _stopListening() async {
    setState(() {
      _userWantsListening = false;
      _isListening = false;
    });
    try {
      await _speechToText.stop();
    } catch (e) {
      debugPrint('STT Debate stop error: $e');
    }

    _commitCurrentSpeech();
    final fullAnswer = _liveTranscript.trim();
    if (fullAnswer.isNotEmpty) {
      _submitArgument(fullAnswer);
    }
    setState(() {
      _committedTranscript = '';
      _currentSpeechText = '';
    });
  }

  void _submitArgument(String text) {
    if (text.isEmpty) return;
    _addMessage(text, isAI: false);
    setState(() => _isProcessing = true);

    _socket?.emit('debate:argument', {
      'sessionId': widget.sessionId,
      'transcript': text,
    });
  }

  @override
  void dispose() {
    _pulseController.dispose();
    _fireController.dispose();
    _scrollController.dispose();
    _socket?.disconnect();
    _socket?.dispose();
    _audioPlayer.dispose();
    _textController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (!_topicConfirmed) {
      return _buildTopicConfirmation();
    }

    return Scaffold(
      backgroundColor: const Color(0xFF0A0A1A),
      body: SafeArea(
        child: Column(
          children: [
            _buildTopBar(),
            _buildHeatAndCrowd(),
            if (_currentAIText.isNotEmpty)
              _buildOpponentSpeaking(),
            if (_coachingNudge != null) _buildCoachingNudge(),
            Expanded(child: _buildConversation()),
            if (_isProcessing) _buildThinkingIndicator(),
            _buildBottomControls(),
          ],
        ),
      ),
    );
  }

  Widget _buildTopicConfirmation() {
    return Scaffold(
      backgroundColor: const Color(0xFF0A0A1A),
      body: SafeArea(
        child: Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text('⚔️', style: const TextStyle(fontSize: 64)),
                const SizedBox(height: 24),
                Text(
                  'DEBATE ARENA',
                  style: GoogleFonts.spaceGrotesk(
                    fontSize: 28,
                    fontWeight: FontWeight.w900,
                    color: Colors.white,
                    letterSpacing: 2,
                  ),
                ),
                const SizedBox(height: 32),
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    color: const Color(0xFF1A1A2E),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(
                      color: Colors.deepPurpleAccent.withValues(alpha: 0.4),
                      width: 2,
                    ),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.deepPurpleAccent.withValues(alpha: 0.1),
                        blurRadius: 20,
                      ),
                    ],
                  ),
                  child: Column(
                    children: [
                      Row(
                        children: [
                          const Icon(Icons.topic, color: Colors.deepPurpleAccent, size: 20),
                          const SizedBox(width: 8),
                          Text(
                            'DEBATE TOPIC',
                            style: GoogleFonts.spaceGrotesk(
                              color: Colors.deepPurpleAccent,
                              fontWeight: FontWeight.w700,
                              fontSize: 12,
                              letterSpacing: 1,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      Text(
                        '"${widget.topic}"',
                        style: GoogleFonts.inter(
                          color: Colors.white,
                          fontSize: 18,
                          fontWeight: FontWeight.w600,
                          fontStyle: FontStyle.italic,
                          height: 1.4,
                        ),
                        textAlign: TextAlign.center,
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 20),
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: const Color(0xFF1A1A2E),
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: Colors.white10),
                  ),
                  child: Row(
                    children: [
                      Text(_personalityEmoji, style: const TextStyle(fontSize: 32)),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'OPPONENT',
                              style: GoogleFonts.spaceGrotesk(
                                color: Colors.white54,
                                fontSize: 10,
                                letterSpacing: 1,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            Text(
                              _personalityLabel,
                              style: GoogleFonts.spaceGrotesk(
                                color: Colors.white,
                                fontSize: 18,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 20),
                Text(
                  'CHOOSE YOUR STANCE',
                  style: GoogleFonts.spaceGrotesk(
                    color: Colors.white70,
                    fontWeight: FontWeight.bold,
                    fontSize: 13,
                    letterSpacing: 1,
                  ),
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Expanded(
                      child: GestureDetector(
                        onTap: () => setState(() => _selectedSide = 'pro'),
                        child: AnimatedContainer(
                          duration: const Duration(milliseconds: 200),
                          padding: const EdgeInsets.symmetric(vertical: 16),
                          decoration: BoxDecoration(
                            color: _selectedSide == 'pro'
                                ? AppColors.senseiGreen
                                : const Color(0xFF1A1A2E),
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(
                              color: _selectedSide == 'pro'
                                  ? AppColors.brutalBlack
                                  : Colors.white10,
                              width: _selectedSide == 'pro' ? 3 : 1,
                            ),
                            boxShadow: _selectedSide == 'pro'
                                ? [
                                    const BoxShadow(
                                      color: AppColors.brutalBlack,
                                      offset: Offset(4, 4),
                                    )
                                  ]
                                : [],
                          ),
                          child: Column(
                            children: [
                              const Text('👍', style: TextStyle(fontSize: 24)),
                              const SizedBox(height: 6),
                              Text(
                                'Support Topic',
                                style: GoogleFonts.spaceGrotesk(
                                  color: _selectedSide == 'pro'
                                      ? AppColors.brutalBlack
                                      : Colors.white70,
                                  fontWeight: FontWeight.bold,
                                  fontSize: 14,
                                ),
                              ),
                              Text(
                                '(Pro Stance)',
                                style: GoogleFonts.inter(
                                  color: _selectedSide == 'pro'
                                      ? AppColors.brutalBlack.withValues(alpha: 0.6)
                                      : Colors.white38,
                                  fontSize: 10,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: GestureDetector(
                        onTap: () => setState(() => _selectedSide = 'con'),
                        child: AnimatedContainer(
                          duration: const Duration(milliseconds: 200),
                          padding: const EdgeInsets.symmetric(vertical: 16),
                          decoration: BoxDecoration(
                            color: _selectedSide == 'con'
                                ? AppColors.senseiCoral
                                : const Color(0xFF1A1A2E),
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(
                              color: _selectedSide == 'con'
                                  ? AppColors.brutalBlack
                                  : Colors.white10,
                              width: _selectedSide == 'con' ? 3 : 1,
                            ),
                            boxShadow: _selectedSide == 'con'
                                ? [
                                    const BoxShadow(
                                      color: AppColors.brutalBlack,
                                      offset: Offset(4, 4),
                                    )
                                  ]
                                : [],
                          ),
                          child: Column(
                            children: [
                              const Text('👎', style: TextStyle(fontSize: 24)),
                              const SizedBox(height: 6),
                              Text(
                                'Oppose Topic',
                                style: GoogleFonts.spaceGrotesk(
                                  color: _selectedSide == 'con'
                                      ? AppColors.brutalBlack
                                      : Colors.white70,
                                  fontWeight: FontWeight.bold,
                                  fontSize: 14,
                                ),
                              ),
                              Text(
                                '(Con Stance)',
                                style: GoogleFonts.inter(
                                  color: _selectedSide == 'con'
                                      ? AppColors.brutalBlack.withValues(alpha: 0.6)
                                      : Colors.white38,
                                  fontSize: 10,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 30),
                GestureDetector(
                  onTap: _confirmTopicAndStart,
                  child: Container(
                    width: double.infinity,
                    padding: const EdgeInsets.symmetric(vertical: 18),
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(
                        colors: [Color(0xFF6A1B9A), Color(0xFF4A148C)],
                      ),
                      borderRadius: BorderRadius.circular(16),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.deepPurpleAccent.withValues(alpha: 0.3),
                          blurRadius: 16,
                          offset: const Offset(0, 4),
                        ),
                      ],
                    ),
                    child: Center(
                      child: Text(
                        '⚔️  START DEBATE',
                        style: GoogleFonts.spaceGrotesk(
                          color: Colors.white,
                          fontWeight: FontWeight.w900,
                          fontSize: 18,
                          letterSpacing: 1,
                        ),
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                TextButton(
                  onPressed: () => context.pop(),
                  child: Text(
                    'Go Back',
                    style: GoogleFonts.inter(color: Colors.white38),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildTopBar() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: const Color(0xFF111122),
        border: Border(
          bottom: BorderSide(color: Colors.white.withValues(alpha: 0.08)),
        ),
      ),
      child: Row(
        children: [
          GestureDetector(
            onTap: () => _showExitConfirmation(),
            child: Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(12),
              ),
              child: const Icon(Icons.close, color: Colors.white, size: 20),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'vs $_personalityLabel',
                  style: GoogleFonts.spaceGrotesk(
                    color: Colors.white,
                    fontWeight: FontWeight.w700,
                    fontSize: 15,
                  ),
                ),
                Text(
                  widget.topic.length > 40
                      ? '${widget.topic.substring(0, 40)}...'
                      : widget.topic,
                  style: GoogleFonts.inter(color: Colors.white38, fontSize: 11),
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            decoration: BoxDecoration(
              color: Colors.deepPurple.withValues(alpha: 0.3),
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: Colors.deepPurpleAccent.withValues(alpha: 0.4)),
            ),
            child: Text(
              'R$_round/$_totalRounds',
              style: GoogleFonts.spaceMono(
                color: Colors.white,
                fontWeight: FontWeight.bold,
                fontSize: 13,
              ),
            ),
          ),
          const SizedBox(width: 8),
          GestureDetector(
            onTap: () {
              setState(() {
                _isMuted = !_isMuted;
                if (_isMuted) {
                  _audioPlayer.stop();
                  _isAISpeaking = false;
                }
              });
            },
            child: Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: _isMuted 
                    ? Colors.redAccent.withValues(alpha: 0.15) 
                    : Colors.white.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                  color: _isMuted 
                      ? Colors.redAccent.withValues(alpha: 0.3) 
                      : Colors.transparent,
                ),
              ),
              child: Icon(
                _isMuted ? Icons.volume_off : Icons.volume_up,
                color: _isMuted ? Colors.redAccent : Colors.white,
                size: 20,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildHeatAndCrowd() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: Column(
        children: [
          Row(
            children: [
              Text(
                'Heat ',
                style: GoogleFonts.inter(
                  color: Colors.white38,
                  fontSize: 11,
                  fontWeight: FontWeight.w600,
                ),
              ),
              ...List.generate(
                5,
                (index) => AnimatedBuilder(
                  animation: _fireAnimation,
                  builder: (context, child) => Transform.scale(
                    scale: index < _heatLevel ? _fireAnimation.value : 1.0,
                    child: Icon(
                      Icons.local_fire_department,
                      color: index < _heatLevel
                          ? Colors.deepOrange
                          : Colors.white12,
                      size: 18,
                    ),
                  ),
                ),
              ),
              const Spacer(),
              Text(
                'Crowd',
                style: GoogleFonts.inter(
                  color: Colors.white38,
                  fontSize: 11,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
          const SizedBox(height: 4),
          Row(
            children: [
              Text(
                'Hostile',
                style: GoogleFonts.inter(color: Colors.red.shade300, fontSize: 9),
              ),
              Expanded(
                child: Container(
                  margin: const EdgeInsets.symmetric(horizontal: 8),
                  height: 6,
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.08),
                    borderRadius: BorderRadius.circular(3),
                  ),
                  child: FractionallySizedBox(
                    alignment: Alignment.centerLeft,
                    widthFactor: _crowdMood / 100,
                    child: AnimatedContainer(
                      duration: const Duration(milliseconds: 500),
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          colors: _crowdMood > 60
                              ? [Colors.green.shade600, Colors.green.shade400]
                              : _crowdMood < 40
                                  ? [Colors.red.shade600, Colors.red.shade400]
                                  : [Colors.amber.shade600, Colors.amber.shade400],
                        ),
                        borderRadius: BorderRadius.circular(3),
                      ),
                    ),
                  ),
                ),
              ),
              Text(
                'Supportive',
                style: GoogleFonts.inter(color: Colors.green.shade300, fontSize: 9),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildOpponentSpeaking() {
    return GestureDetector(
      onTap: _replayCurrentQuestion,
      child: Container(
        margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: [
              Colors.deepPurple.withValues(alpha: 0.4),
              const Color(0xFF1A1A2E).withValues(alpha: 0.8),
            ],
          ),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: Colors.deepPurpleAccent.withValues(alpha: 0.3)),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Text(_personalityEmoji, style: const TextStyle(fontSize: 18)),
                const SizedBox(width: 8),
                Text(
                  _personalityLabel,
                  style: GoogleFonts.spaceGrotesk(
                    color: Colors.deepPurpleAccent.shade100,
                    fontWeight: FontWeight.w700,
                    fontSize: 13,
                  ),
                ),
                const Spacer(),
                if (_isAISpeaking)
                  Row(
                    children: [
                      const Icon(Icons.volume_up, color: Colors.deepPurpleAccent, size: 16),
                      const SizedBox(width: 4),
                      Text(
                        'Speaking...',
                        style: GoogleFonts.inter(
                          color: Colors.deepPurpleAccent.shade100,
                          fontSize: 11,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  )
                else
                  Row(
                    children: [
                      const Icon(Icons.volume_mute, color: Colors.white38, size: 16),
                      const SizedBox(width: 4),
                      Text(
                        'Tap to replay',
                        style: GoogleFonts.inter(
                          color: Colors.white38,
                          fontSize: 11,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ],
                  ),
              ],
            ),
            const SizedBox(height: 8),
            Text(
              _currentAIText,
              style: GoogleFonts.inter(
                color: Colors.white.withValues(alpha: 0.9),
                fontSize: 14,
                height: 1.4,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildCoachingNudge() {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: Colors.indigo.withValues(alpha: 0.2),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.indigo.withValues(alpha: 0.3)),
      ),
      child: Row(
        children: [
          const Icon(Icons.lightbulb_outline, color: Colors.yellow, size: 16),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              _coachingNudge!,
              style: GoogleFonts.inter(color: Colors.white70, fontSize: 12),
            ),
          ),
          GestureDetector(
            onTap: () => setState(() => _coachingNudge = null),
            child: const Icon(Icons.close, color: Colors.white38, size: 14),
          ),
        ],
      ),
    );
  }

  Widget _buildConversation() {
    if (_isConnecting) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const CircularProgressIndicator(color: Colors.deepPurpleAccent),
            const SizedBox(height: 16),
            Text(
              'Entering the arena...',
              style: GoogleFonts.inter(color: Colors.white54, fontSize: 14),
            ),
          ],
        ),
      );
    }

    if (_messages.isEmpty && _sessionStarted) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text('⚔️', style: const TextStyle(fontSize: 48)),
            const SizedBox(height: 16),
            Text(
              'Waiting for opponent...',
              style: GoogleFonts.inter(color: Colors.white38, fontSize: 14),
            ),
          ],
        ),
      );
    }

    return ListView.builder(
      controller: _scrollController,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      itemCount: _messages.length,
      itemBuilder: (context, index) {
        final msg = _messages[index];
        if (msg['isSystem'] == true) {
          return _buildSystemBubble(msg['text']);
        }
        return _buildChatBubble(msg['text'], isAI: msg['isAI'] == true);
      },
    );
  }

  Widget _buildSystemBubble(String text) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Center(
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          decoration: BoxDecoration(
            color: Colors.orange.withValues(alpha: 0.15),
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: Colors.orange.withValues(alpha: 0.3)),
          ),
          child: Text(
            text,
            style: GoogleFonts.inter(color: Colors.orange.shade200, fontSize: 12),
            textAlign: TextAlign.center,
          ),
        ),
      ),
    );
  }

  Widget _buildChatBubble(String text, {required bool isAI}) {
    return Align(
      alignment: isAI ? Alignment.centerLeft : Alignment.centerRight,
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.all(14),
        constraints:
            BoxConstraints(maxWidth: MediaQuery.of(context).size.width * 0.78),
        decoration: BoxDecoration(
          color: isAI
              ? Colors.deepPurple.withValues(alpha: 0.3)
              : Colors.indigo.withValues(alpha: 0.3),
          borderRadius: BorderRadius.only(
            topLeft: const Radius.circular(18),
            topRight: const Radius.circular(18),
            bottomLeft: Radius.circular(isAI ? 4 : 18),
            bottomRight: Radius.circular(isAI ? 18 : 4),
          ),
          border: Border.all(
            color: isAI
                ? Colors.deepPurpleAccent.withValues(alpha: 0.2)
                : Colors.indigoAccent.withValues(alpha: 0.2),
          ),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  isAI ? _personalityEmoji : '🗣️',
                  style: const TextStyle(fontSize: 12),
                ),
                const SizedBox(width: 6),
                Text(
                  isAI ? _personalityLabel : 'You',
                  style: GoogleFonts.spaceGrotesk(
                    fontSize: 11,
                    color: isAI ? Colors.deepPurpleAccent : Colors.indigoAccent,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 6),
            Text(
              text,
              style: GoogleFonts.inter(
                color: Colors.white.withValues(alpha: 0.9),
                fontSize: 14,
                height: 1.4,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildThinkingIndicator() {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          SizedBox(
            width: 16,
            height: 16,
            child: CircularProgressIndicator(
              strokeWidth: 2,
              color: Colors.deepPurpleAccent.withValues(alpha: 0.7),
            ),
          ),
          const SizedBox(width: 10),
          Text(
            'Opponent is formulating a response...',
            style: GoogleFonts.inter(color: Colors.white54, fontSize: 13),
          ),
        ],
      ),
    );
  }

  Widget _buildBottomControls() {
    return Container(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 16),
      decoration: BoxDecoration(
        color: const Color(0xFF111122),
        border: Border(
          top: BorderSide(color: Colors.white.withValues(alpha: 0.08)),
        ),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (_liveTranscript.isNotEmpty)
            Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: Container(
                width: double.infinity,
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: Colors.greenAccent.withValues(alpha: 0.08),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: Colors.greenAccent.withValues(alpha: 0.2)),
                ),
                child: Text(
                  '🎤 $_liveTranscript',
                  style: GoogleFonts.inter(
                    color: Colors.greenAccent,
                    fontStyle: FontStyle.italic,
                    fontSize: 13,
                  ),
                  textAlign: TextAlign.center,
                ),
              ),
            ),
          if (_isKeyboardMode)
            Row(
              children: [
                IconButton(
                  icon: const Icon(Icons.mic, color: Colors.white54),
                  onPressed: () {
                    _switchToVoiceMode();
                  },
                ),
                Expanded(
                  child: Container(
                    clipBehavior: Clip.antiAlias,
                    decoration: BoxDecoration(
                      color: const Color(0xFF0F172A),
                      borderRadius: BorderRadius.circular(24),
                      border: Border.all(color: Colors.white24, width: 2),
                    ),
                    child: Theme(
                      data: Theme.of(context).copyWith(
                        textSelectionTheme: const TextSelectionThemeData(
                          cursorColor: Colors.white,
                          selectionColor: Colors.deepPurpleAccent,
                          selectionHandleColor: Colors.white,
                        ),
                        inputDecorationTheme: const InputDecorationTheme(
                          filled: true,
                          fillColor: Color(0xFF0F172A),
                          border: InputBorder.none,
                          enabledBorder: InputBorder.none,
                          focusedBorder: InputBorder.none,
                          disabledBorder: InputBorder.none,
                        ),
                      ),
                      child: TextField(
                        controller: _textController,
                        style: GoogleFonts.inter(color: Colors.white),
                        decoration: InputDecoration(
                          hintText: 'Type your argument here...',
                          hintStyle: GoogleFonts.inter(color: Colors.white38),
                          border: InputBorder.none,
                          enabledBorder: InputBorder.none,
                          focusedBorder: InputBorder.none,
                          contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                          filled: true,
                          fillColor: const Color(0xFF0F172A),
                        ),
                        maxLines: null,
                        keyboardType: TextInputType.multiline,
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                IconButton(
                  icon: const Icon(Icons.send, color: AppColors.senseiBlue),
                  onPressed: () {
                    if (_textController.text.trim().isNotEmpty) {
                      _submitArgument(_textController.text.trim());
                      _textController.clear();
                    }
                  },
                ),
              ],
            )
          else
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const SizedBox(width: 48),
                ScaleTransition(
                  scale: _isListening
                      ? _pulseAnimation
                      : const AlwaysStoppedAnimation(1.0),
                  child: GestureDetector(
                    onTap: () {
                      if (_isListening) {
                        _stopListening();
                      } else {
                        _startListening();
                      }
                    },
                    child: Container(
                      width: 72,
                      height: 72,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        gradient: _getButtonGradient(),
                        boxShadow: _isListening
                            ? [
                                BoxShadow(
                                  color: Colors.greenAccent.withValues(alpha: 0.4),
                                  blurRadius: 24,
                                  spreadRadius: 2,
                                ),
                              ]
                            : [
                                BoxShadow(
                                  color: Colors.redAccent.withValues(alpha: 0.2),
                                  blurRadius: 12,
                                ),
                              ],
                      ),
                      child: Icon(
                        _getButtonIcon(),
                        color: Colors.white,
                        size: 30,
                      ),
                    ),
                  ),
                ),
                IconButton(
                  icon: const Icon(Icons.keyboard, color: Colors.white54),
                  onPressed: () {
                    _switchToKeyboardMode();
                  },
                ),
              ],
            ),
          const SizedBox(height: 8),
          Text(
            _getStatusText(),
            style: GoogleFonts.inter(
              color: Colors.white54,
              fontSize: 12,
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }

  LinearGradient _getButtonGradient() {
    if (_isProcessing || _isAISpeaking) {
      return LinearGradient(
        colors: [Colors.grey.shade700, Colors.grey.shade800],
      );
    }
    if (_isListening) {
      return const LinearGradient(
        colors: [Color(0xFF2E7D32), Color(0xFF1B5E20)],
      );
    }
    return const LinearGradient(
      colors: [Color(0xFFC62828), Color(0xFFB71C1C)],
    );
  }

  IconData _getButtonIcon() {
    if (_isProcessing) return Icons.hourglass_top;
    if (_isAISpeaking) return Icons.volume_up;
    if (_isListening) return Icons.mic;
    return Icons.mic_none;
  }

  String _getStatusText() {
    if (_isProcessing) return 'Opponent analyzing your argument...';
    if (_isAISpeaking) return 'Opponent is speaking';
    if (_isListening) return 'Listening... tap to stop and submit';
    return 'Tap the mic to make your argument';
  }

  void _showExitConfirmation() {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppColors.brutalBg,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: const BorderSide(color: AppColors.brutalBlack, width: 2),
        ),
        title: Text('Leave Debate?', style: GoogleFonts.spaceGrotesk(fontWeight: FontWeight.bold)),
        content: Text(
          'Your debate progress will be lost.',
          style: GoogleFonts.inter(),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(),
            child: Text('Stay', style: GoogleFonts.spaceGrotesk(fontWeight: FontWeight.bold)),
          ),
          TextButton(
            onPressed: () {
              Navigator.of(ctx).pop();
              context.pop();
            },
            child: Text('Leave', style: GoogleFonts.spaceGrotesk(fontWeight: FontWeight.bold, color: Colors.red)),
          ),
        ],
      ),
    );
  }
}

class _BytesAudioSource extends StreamAudioSource {
  final List<int> bytes;
  _BytesAudioSource(this.bytes);

  @override
  Future<StreamAudioResponse> request([int? start, int? end]) async {
    start ??= 0;
    end ??= bytes.length;
    return StreamAudioResponse(
      sourceLength: bytes.length,
      contentLength: end - start,
      offset: start,
      stream: Stream.value(bytes.sublist(start, end)),
      contentType: 'audio/mpeg',
    );
  }
}
