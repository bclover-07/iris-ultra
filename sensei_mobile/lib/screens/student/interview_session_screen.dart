import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:go_router/go_router.dart';
import 'package:speech_to_text/speech_to_text.dart';
import 'package:socket_io_client/socket_io_client.dart' as IO;
import 'package:just_audio/just_audio.dart';
import 'package:dio/dio.dart';
import 'package:camera/camera.dart';
import '../../theme/app_colors.dart';
import '../../config/env.dart';
import '../../providers/auth_provider.dart';
import '../../services/api_service.dart';
import '../../services/on_device_llm_service.dart';

class InterviewSessionScreen extends ConsumerStatefulWidget {
  final String sessionId;
  final String company;
  final String role;

  const InterviewSessionScreen({
    super.key,
    required this.sessionId,
    required this.company,
    required this.role,
  });

  @override
  ConsumerState<InterviewSessionScreen> createState() =>
      _InterviewSessionScreenState();
}

class _InterviewSessionScreenState
    extends ConsumerState<InterviewSessionScreen> with TickerProviderStateMixin {
  final SpeechToText _speechToText = SpeechToText();
  final AudioPlayer _audioPlayer = AudioPlayer();
  final ScrollController _scrollController = ScrollController();
  CameraController? _cameraController;
  IO.Socket? _socket;

  bool _speechEnabled = false;
  bool _isListening = false;
  bool _isProcessing = false;
  bool _isAISpeaking = false;
  bool _cameraInitialized = false;
  bool _sessionStarted = false;
  bool _isConnecting = true;
  bool _isKeyboardMode = false;
  bool _userWantsListening = false;
  bool _isSpeechRestarting = false;
  bool _isMuted = false;
  final TextEditingController _textController = TextEditingController();

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

  int _questionIndex = 0;
  int _totalQuestions = 10;
  String _currentQuestion = '';
  String _currentAIText = '';
  String? _feedbackNote;
  String? _thinkingState;

  final List<Map<String, dynamic>> _messages = [];

  late AnimationController _pulseController;
  late Animation<double> _pulseAnimation;

  @override
  void initState() {
    super.initState();
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1200),
    )..repeat(reverse: true);
    _pulseAnimation =
        Tween<double>(begin: 1.0, end: 1.15).animate(_pulseController);

    _audioPlayer.playerStateStream.listen((state) {
      if (state.processingState == ProcessingState.completed) {
        if (mounted) setState(() => _isAISpeaking = false);
      }
    });

    _initSpeech();
    _initCamera();
    _initSocket();
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

  Future<void> _initCamera() async {
    try {
      final cameras = await availableCameras();
      if (cameras.isEmpty) return;
      final frontCamera = cameras.firstWhere(
        (c) => c.lensDirection == CameraLensDirection.front,
        orElse: () => cameras.first,
      );

      _cameraController = CameraController(
        frontCamera,
        ResolutionPreset.low,
        enableAudio: false,
      );
      await _cameraController!.initialize();
      if (mounted) setState(() => _cameraInitialized = true);
    } catch (e) {
      debugPrint('Camera Error: $e');
    }
  }

  void _initSocket() {
    final user = ref.read(authProvider);
    if (user == null || !user.isAuthenticated) {
      setState(() => _isConnecting = false);
      _addSystemMessage('Authentication required. Please log in again.');
      return;
    }

    _socket = IO.io(
      '${Env.socketUrl}/interview',
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
      _socket?.emit('interview:start', {
        'sessionId': widget.sessionId,
        'userId': user.user?.id,
        'jobRole': widget.role,
        'company': widget.company,
        'mode': 'technical',
      });
    });

    _socket?.onConnectError((data) {
      if (mounted) {
        setState(() => _isConnecting = false);
        _addSystemMessage('Connection failed. Please check your network.');
      }
    });

    _socket?.on('interview:ai_response', _handleAIResponse);
    _socket?.on('interview:thinking', _handleThinking);
    _socket?.on('interview:complete', _handleComplete);
    _socket?.on('interview:error', (data) {
      if (mounted) {
        _addSystemMessage(data['message'] ?? 'An error occurred.');
        setState(() => _isProcessing = false);
      }
    });
  }

  void _handleAIResponse(dynamic data) {
    if (!mounted) return;
    final text = data['text'] ?? '';
    final question = data['question'];
    final questionText = question?['text'] ?? '';

    setState(() {
      _isProcessing = false;
      _thinkingState = null;
      _currentAIText = text;
      _currentQuestion = questionText.isNotEmpty ? questionText : text;
      _questionIndex = data['questionIndex'] ?? _questionIndex;
      _totalQuestions = data['totalQuestions'] ?? _totalQuestions;
      _feedbackNote = data['feedbackNote'];
    });

    _addMessage(text, isAI: true);

    final speakText = questionText.isNotEmpty ? '$text. $questionText' : text;
    if (speakText.isNotEmpty) {
      _playTTS(speakText);
    }
  }

  void _handleThinking(dynamic data) {
    if (!mounted) return;
    setState(() {
      _isProcessing = true;
      _thinkingState = data['state'];
    });
  }

  void _handleComplete(dynamic data) {
    if (!mounted) return;
    final reportId = data['reportId'];
    if (reportId != null) {
      _showCompletionDialog(data);
    }
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
          '🎉 Interview Complete!',
          style: GoogleFonts.spaceGrotesk(
            fontWeight: FontWeight.w900,
            fontSize: 22,
          ),
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              'Great job completing your ${widget.role} interview at ${widget.company}!',
              style: GoogleFonts.inter(fontSize: 14),
            ),
            if (data['xpEarned'] != null) ...[
              const SizedBox(height: 16),
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                decoration: BoxDecoration(
                  color: AppColors.senseiGreen,
                  borderRadius: BorderRadius.circular(12),
                  border:
                      Border.all(color: AppColors.brutalBlack, width: 2),
                ),
                child: Text(
                  '+${data['xpEarned']} XP Earned!',
                  style: GoogleFonts.spaceGrotesk(
                    fontWeight: FontWeight.bold,
                    fontSize: 18,
                  ),
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
              style: GoogleFonts.spaceGrotesk(
                fontWeight: FontWeight.bold,
                color: AppColors.brutalBlack,
              ),
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
    final speakText = _currentQuestion.isNotEmpty && _currentQuestion != _currentAIText
        ? '$_currentAIText. $_currentQuestion'
        : _currentAIText;
    if (speakText.isNotEmpty) {
      _playTTS(speakText);
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

    debugPrint('STT: Starting session #$currentSession. Committed: "$_committedTranscript"');

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
      debugPrint('STT listen error: $e');
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
      debugPrint('STT stop error: $e');
    }

    _commitCurrentSpeech();
    final fullAnswer = _liveTranscript.trim();
    if (fullAnswer.isNotEmpty) {
      _submitAnswer(fullAnswer);
    }
    setState(() {
      _committedTranscript = '';
      _currentSpeechText = '';
    });
  }

  Future<void> _submitAnswer(String text) async {
    if (text.isEmpty) return;
    _addMessage(text, isAI: false);
    setState(() => _isProcessing = true);

    if (_socket != null && _socket!.connected) {
      _socket?.emit('interview:answer', {
        'sessionId': widget.sessionId,
        'transcript': text,
      });
    } else {
      // On-Device Gemma 3n Evaluation on Hexagon NPU (§6.10)
      try {
        final feedback = await OnDeviceLlmService().generateInterviewTurnFeedback(_currentQuestion, text, widget.role);
        await Future.delayed(const Duration(milliseconds: 300));
        if (mounted) {
          _handleAIResponse({
            'text': feedback['feedback'] ?? 'Answer acknowledged.',
            'question': {
              'text': feedback['followUpQuestion'] ?? 'Can you discuss performance optimizations for this solution?'
            },
            'questionIndex': _questionIndex + 1,
            'totalQuestions': _totalQuestions,
            'feedbackNote': 'NPU Evaluation Score: ${feedback['score']}% · Articulation verified'
          });
        }
      } catch (e) {
        if (mounted) {
          setState(() => _isProcessing = false);
          _addMessage('Answer logged. Moving to next evaluation step.', isAI: true);
        }
      }
    }
  }

  @override
  void dispose() {
    _pulseController.dispose();
    _scrollController.dispose();
    _socket?.disconnect();
    _socket?.dispose();
    _audioPlayer.dispose();
    _cameraController?.dispose();
    _textController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0A0E21),
      body: SafeArea(
        child: Column(
          children: [
            _buildTopBar(),
            if (_currentQuestion.isNotEmpty) _buildQuestionCard(),
            if (_feedbackNote != null) _buildFeedbackNudge(),
            Expanded(child: _buildConversation()),
            if (_isProcessing) _buildThinkingIndicator(),
            _buildBottomControls(),
          ],
        ),
      ),
    );
  }

  Widget _buildTopBar() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: const Color(0xFF111B30),
        border: Border(
          bottom: BorderSide(color: Colors.white.withValues(alpha: 0.1)),
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
              child: const Icon(Icons.arrow_back, color: Colors.white, size: 20),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  '${widget.company} Interview',
                  style: GoogleFonts.spaceGrotesk(
                    color: Colors.white,
                    fontWeight: FontWeight.w700,
                    fontSize: 16,
                  ),
                ),
                Text(
                  'Role: ${widget.role}',
                  style: GoogleFonts.inter(
                    color: Colors.white54,
                    fontSize: 12,
                  ),
                ),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            decoration: BoxDecoration(
              color: AppColors.senseiBlue.withValues(alpha: 0.3),
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: AppColors.senseiBlue.withValues(alpha: 0.5)),
            ),
            child: Text(
              'Q${_questionIndex + 1}/$_totalQuestions',
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
          const SizedBox(width: 8),
          if (_cameraInitialized && _cameraController != null)
            Container(
              width: 48,
              height: 64,
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                  color: _isListening ? Colors.redAccent : Colors.white24,
                  width: 2,
                ),
              ),
              clipBehavior: Clip.antiAlias,
              child: CameraPreview(_cameraController!),
            ),
        ],
      ),
    );
  }

  Widget _buildQuestionCard() {
    return GestureDetector(
      onTap: _replayCurrentQuestion,
      child: Container(
        margin: const EdgeInsets.all(12),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: [
              const Color(0xFF1A237E).withValues(alpha: 0.8),
              const Color(0xFF283593).withValues(alpha: 0.8),
            ],
          ),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: Colors.blueAccent.withValues(alpha: 0.3)),
          boxShadow: [
            BoxShadow(
              color: Colors.blueAccent.withValues(alpha: 0.1),
              blurRadius: 12,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(6),
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: const Icon(Icons.question_answer, color: Colors.white70, size: 18),
                ),
                const SizedBox(width: 10),
                Text(
                  'Current Question',
                  style: GoogleFonts.spaceGrotesk(
                    color: Colors.white70,
                    fontWeight: FontWeight.w600,
                    fontSize: 12,
                    letterSpacing: 1,
                  ),
                ),
                const Spacer(),
                if (_isAISpeaking)
                  Row(
                    children: [
                      const Icon(Icons.volume_up, color: Colors.lightBlueAccent, size: 16),
                      const SizedBox(width: 4),
                      Text(
                        'Speaking...',
                        style: GoogleFonts.inter(
                          color: Colors.lightBlueAccent,
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
            const SizedBox(height: 12),
            Text(
              _currentQuestion,
              style: GoogleFonts.inter(
                color: Colors.white,
                fontSize: 15,
                height: 1.5,
                fontWeight: FontWeight.w500,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildFeedbackNudge() {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 12),
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: Colors.amber.withValues(alpha: 0.15),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.amber.withValues(alpha: 0.3)),
      ),
      child: Row(
        children: [
          const Icon(Icons.lightbulb_outline, color: Colors.amber, size: 18),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              _feedbackNote!,
              style: GoogleFonts.inter(
                color: Colors.amber.shade200,
                fontSize: 12,
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
          GestureDetector(
            onTap: () => setState(() => _feedbackNote = null),
            child: const Icon(Icons.close, color: Colors.amber, size: 16),
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
            const CircularProgressIndicator(color: Colors.blueAccent),
            const SizedBox(height: 16),
            Text(
              'Connecting to interviewer...',
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
            const Icon(Icons.mic, color: Colors.white24, size: 48),
            const SizedBox(height: 16),
            Text(
              'Waiting for the interviewer...',
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
              ? const Color(0xFF1A237E).withValues(alpha: 0.6)
              : AppColors.senseiBlue.withValues(alpha: 0.3),
          borderRadius: BorderRadius.only(
            topLeft: const Radius.circular(18),
            topRight: const Radius.circular(18),
            bottomLeft: Radius.circular(isAI ? 4 : 18),
            bottomRight: Radius.circular(isAI ? 18 : 4),
          ),
          border: Border.all(
            color: isAI
                ? Colors.blueAccent.withValues(alpha: 0.2)
                : AppColors.senseiBlue.withValues(alpha: 0.3),
          ),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(
                  isAI ? Icons.smart_toy : Icons.person,
                  size: 14,
                  color: isAI ? Colors.blueAccent : Colors.lightBlueAccent,
                ),
                const SizedBox(width: 6),
                Text(
                  isAI ? 'Interviewer' : 'You',
                  style: GoogleFonts.spaceGrotesk(
                    fontSize: 11,
                    color: isAI ? Colors.blueAccent : Colors.lightBlueAccent,
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
              color: Colors.blueAccent.withValues(alpha: 0.7),
            ),
          ),
          const SizedBox(width: 10),
          Text(
            _thinkingState == 'generating_report'
                ? 'Generating your report...'
                : 'Analyzing your response...',
            style: GoogleFonts.inter(
              color: Colors.white54,
              fontSize: 13,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBottomControls() {
    return Container(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 16),
      decoration: BoxDecoration(
        color: const Color(0xFF111B30),
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
                  border: Border.all(
                      color: Colors.greenAccent.withValues(alpha: 0.2)),
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
                          selectionColor: Colors.blueAccent,
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
                          hintText: 'Type your answer here...',
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
                      _submitAnswer(_textController.text.trim());
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
                  scale: _isListening ? _pulseAnimation : const AlwaysStoppedAnimation(1.0),
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
                                )
                              ]
                            : [
                                BoxShadow(
                                  color: Colors.redAccent.withValues(alpha: 0.2),
                                  blurRadius: 12,
                                )
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
    if (_isProcessing) return 'Analyzing your answer...';
    if (_isAISpeaking) return 'Interviewer is speaking';
    if (_isListening) return 'Listening... tap to stop and submit';
    return 'Tap the mic to start speaking';
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
        title: Text('Leave Interview?', style: GoogleFonts.spaceGrotesk(fontWeight: FontWeight.bold)),
        content: Text(
          'We will save your progress, evaluate your responses, and award your partial XP and readiness score.',
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
              if (_socket != null && _socket!.connected) {
                setState(() {
                  _isProcessing = true;
                  _thinkingState = 'generating_report';
                });
                _socket!.emit('interview:end_early', {
                  'sessionId': widget.sessionId,
                });
              } else {
                context.pop();
              }
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
