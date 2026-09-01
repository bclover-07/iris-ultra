import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:go_router/go_router.dart';
import '../../theme/app_colors.dart';
import '../../theme/neubrutalist_widgets.dart';
import '../../theme/animations.dart';
import '../../providers/quiz_provider.dart';
import '../../models/quiz_question.dart';
import '../../services/api_service.dart';

class QuizCamoScreen extends ConsumerStatefulWidget {
  const QuizCamoScreen({super.key});

  @override
  ConsumerState<QuizCamoScreen> createState() => _QuizCamoScreenState();
}

class _QuizCamoScreenState extends ConsumerState<QuizCamoScreen> {
  bool _isLoadingQuestions = true;

  @override
  void initState() {
    super.initState();
    _loadQuestions();
  }

  Future<void> _loadQuestions() async {
    try {
      final response = await ApiService().get('/api/quiz/all');
      if (response.data is List && (response.data as List).isNotEmpty) {
        final questions = (response.data as List)
            .map((q) => QuizQuestion.fromJson(q))
            .toList();
        ref.read(quizProvider.notifier).loadQuestions(questions);
      } else {
        _loadDefaultQuestions();
      }
    } catch (e) {
      _loadDefaultQuestions();
    } finally {
      if (mounted) {
        setState(() => _isLoadingQuestions = false);
      }
    }
  }

  void _loadDefaultQuestions() {
    final defaults = [
      QuizQuestion(
        id: 'q1',
        question: 'Which component accelerates on-device AI inference on Snapdragon 8 Elite?',
        options: ['Adreno GPU', 'Hexagon NPU', 'Kryo CPU', 'Modem-RF'],
        correctAnswer: 'Hexagon NPU',
        subject: 'Hardware Architecture',
        difficulty: 'Medium',
      ),
      QuizQuestion(
        id: 'q2',
        question: 'What is the time complexity of searching in a Balanced Binary Search Tree?',
        options: ['O(N)', 'O(log N)', 'O(1)', 'O(N^2)'],
        correctAnswer: 'O(log N)',
        subject: 'Data Structures',
        difficulty: 'Easy',
      ),
      QuizQuestion(
        id: 'q3',
        question: 'Which framework enables on-device LiteRT-LM execution in Flutter?',
        options: ['TensorFlow Serving', 'flutter_gemma', 'PyTorch Live', 'ONNX Cloud'],
        correctAnswer: 'flutter_gemma',
        subject: 'Mobile AI',
        difficulty: 'Hard',
      ),
      QuizQuestion(
        id: 'q4',
        question: 'What is the primary benefit of the 4-7-8 breathing technique?',
        options: ['Increases Heart Rate', 'Parasympathetic Nervous Activation', 'Sleep Deprivation', 'Adrenaline Spike'],
        correctAnswer: 'Parasympathetic Nervous Activation',
        subject: 'Wellness',
        difficulty: 'Easy',
      ),
    ];
    ref.read(quizProvider.notifier).loadQuestions(defaults);
  }

  Future<void> _handleAnswer(int optionIndex) async {
    final quizState = ref.read(quizProvider);
    final question = quizState.currentQuestion;
    if (question == null || quizState.isAnswerLocked) return;

    ref.read(quizProvider.notifier).submitAnswer(optionIndex);

    try {
      await ApiService().post('/api/quiz/attempt', data: {
        'quizId': question.id,
        'selectedAnswer': question.options[optionIndex],
        'inputMode': 'gesture_cam',
      });
    } catch (_) {}
  }

  Future<void> _detectLiveGesture() async {
    final notifier = ref.read(quizProvider.notifier);
    await notifier.detectGesture();

    final state = ref.read(quizProvider);
    if (state.detectedGesture != null && state.detectedGesture!.answerIndex != null) {
      _handleAnswer(state.detectedGesture!.answerIndex!);
    }
  }

  @override
  Widget build(BuildContext context) {
    final quizState = ref.watch(quizProvider);
    final currentQ = quizState.currentQuestion;

    return Scaffold(
      backgroundColor: AppColors.creamBg,
      body: SafeArea(
        child: Column(
          children: [
            _buildHeader(quizState),
            if (_isLoadingQuestions)
              const Expanded(
                child: Center(
                  child: CircularProgressIndicator(color: AppColors.brutalBlack),
                ),
              )
            else if (currentQ == null)
              Expanded(child: _buildFinishedView(quizState))
            else
              Expanded(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    children: [
                      _buildCameraGestureCard(quizState),
                      const SizedBox(height: 16),
                      _buildQuestionCard(currentQ, quizState),
                      const SizedBox(height: 16),
                      _buildOptionsGrid(currentQ, quizState),
                      if (quizState.isAnswerLocked) ...[
                        const SizedBox(height: 16),
                        _buildNextButton(quizState),
                      ],
                    ],
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildHeader(QuizState state) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: const BoxDecoration(
        color: AppColors.creamBg,
        border: Border(bottom: BorderSide(color: AppColors.brutalBlack, width: 2.5)),
      ),
      child: Row(
        children: [
          GestureDetector(
            onTap: () => context.pop(),
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
                  'CAMO QUIZO',
                  style: GoogleFonts.fredoka(fontSize: 18, fontWeight: FontWeight.bold, color: AppColors.brutalBlack),
                ),
                Text(
                  'HAND POSE QUIZ ARENA',
                  style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.black54, letterSpacing: 1.1),
                ),
              ],
            ),
          ),
          NeuBadge(
            label: 'SCORE: ${state.score}/${state.totalAnswered}',
            backgroundColor: AppColors.popYellow,
          ),
        ],
      ),
    );
  }

  Widget _buildCameraGestureCard(QuizState state) {
    return NeuCard(
      backgroundColor: Colors.black87,
      borderColor: AppColors.brutalBlack,
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const NeuBadge(
                label: 'HAND LANDMARKER · 21 POINTS',
                backgroundColor: AppColors.npuTeal,
                isLive: true,
              ),
              if (state.detectedGesture != null)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: AppColors.popGreen,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: Colors.white, width: 1.5),
                  ),
                  child: Text(
                    'GESTURE: ${state.detectedGesture!.gesture.toUpperCase()}',
                    style: GoogleFonts.fredoka(fontSize: 11, fontWeight: FontWeight.bold, color: AppColors.brutalBlack),
                  ),
                ),
            ],
          ),
          const SizedBox(height: 16),
          Container(
            height: 140,
            decoration: BoxDecoration(
              color: const Color(0xFF1E1E2E),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: Colors.white24, width: 2),
            ),
            child: Stack(
              alignment: Alignment.center,
              children: [
                Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(
                      state.isDetecting ? Icons.fingerprint : Icons.front_hand_rounded,
                      size: 48,
                      color: state.isDetecting ? AppColors.popYellow : AppColors.popGreen,
                    ),
                    const SizedBox(height: 8),
                    Text(
                      state.isDetecting ? 'CLASSIFYING HAND GESTURE...' : 'SHOW GESTURE TO CAMERA',
                      style: GoogleFonts.fredoka(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.white70, letterSpacing: 1),
                    ),
                  ],
                ),
                Positioned(
                  bottom: 8,
                  child: Wrap(
                    spacing: 8,
                    children: [
                      _buildGesturePill('✊ Fist = A', AppColors.popCoral),
                      _buildGesturePill('☝️ Index = B', AppColors.popBlue),
                      _buildGesturePill('✌️ Peace = C', AppColors.popGreen),
                      _buildGesturePill('✋ Palm = D', AppColors.popYellow),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),
          NeuButton(
            text: state.isDetecting ? 'DETECTING...' : 'TRIGGER GESTURE CAPTURE',
            icon: Icons.camera_alt_rounded,
            backgroundColor: AppColors.popViolet,
            textColor: Colors.white,
            isLoading: state.isDetecting,
            onPressed: state.isAnswerLocked ? null : _detectLiveGesture,
          ),
        ],
      ),
    );
  }

  Widget _buildGesturePill(String label, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
      decoration: BoxDecoration(
        color: color.withOpacity(0.3),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: color, width: 1),
      ),
      child: Text(
        label,
        style: GoogleFonts.inter(fontSize: 9, fontWeight: FontWeight.bold, color: Colors.white),
      ),
    );
  }

  Widget _buildQuestionCard(QuizQuestion q, QuizState state) {
    return NeuCard(
      backgroundColor: Colors.white,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              NeuBadge(
                label: 'QUESTION ${state.currentIndex + 1}/${state.questions.length}',
                backgroundColor: AppColors.popPink,
              ),
              NeuBadge(
                label: q.subject.toUpperCase(),
                backgroundColor: AppColors.creamBg,
              ),
            ],
          ),
          const SizedBox(height: 14),
          Text(
            q.question,
            style: GoogleFonts.fredoka(
              fontSize: 17,
              fontWeight: FontWeight.bold,
              color: AppColors.brutalBlack,
              height: 1.3,
            ),
          ),
          if (state.feedback != null) ...[
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: state.feedback!.contains('Correct') ? AppColors.popGreen.withOpacity(0.2) : AppColors.popCoral.withOpacity(0.2),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                  color: state.feedback!.contains('Correct') ? AppColors.popGreen : AppColors.popCoral,
                  width: 2,
                ),
              ),
              child: Row(
                children: [
                  Icon(
                    state.feedback!.contains('Correct') ? Icons.check_circle_rounded : Icons.cancel_rounded,
                    color: state.feedback!.contains('Correct') ? Colors.green.shade800 : Colors.red.shade800,
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      state.feedback!,
                      style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.bold, color: AppColors.brutalBlack),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildOptionsGrid(QuizQuestion q, QuizState state) {
    final gestureLabels = ['✊ A. ', '☝️ B. ', '✌️ C. ', '✋ D. '];

    return Column(
      children: List.generate(q.options.length, (index) {
        final option = q.options[index];
        final isSelected = state.isAnswerLocked && index == q.correctIndex;
        final isWrong = state.isAnswerLocked && index != q.correctIndex;

        return Padding(
          padding: const EdgeInsets.only(bottom: 10),
          child: NeuCard(
            backgroundColor: isSelected
                ? AppColors.popGreen.withOpacity(0.3)
                : isWrong
                    ? Colors.grey.shade100
                    : Colors.white,
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
            onTap: state.isAnswerLocked ? null : () => _handleAnswer(index),
            child: Row(
              children: [
                Container(
                  width: 36,
                  height: 36,
                  decoration: BoxDecoration(
                    color: isSelected
                        ? AppColors.popGreen
                        : AppColors.creamBg,
                    shape: BoxShape.circle,
                    border: Border.all(color: AppColors.brutalBlack, width: 2),
                  ),
                  child: Center(
                    child: Text(
                      gestureLabels[index].substring(0, 2),
                      style: const TextStyle(fontSize: 16),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    option,
                    style: GoogleFonts.inter(
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                      color: AppColors.brutalBlack,
                    ),
                  ),
                ),
                if (isSelected)
                  const Icon(Icons.check_circle_rounded, color: AppColors.popGreen, size: 22),
              ],
            ),
          ),
        );
      }),
    );
  }

  Widget _buildNextButton(QuizState state) {
    return NeuButton(
      text: state.currentIndex + 1 < state.questions.length ? 'NEXT QUESTION →' : 'VIEW FINAL RESULTS →',
      backgroundColor: AppColors.popYellow,
      onPressed: () => ref.read(quizProvider.notifier).nextQuestion(),
    );
  }

  Widget _buildFinishedView(QuizState state) {
    final pct = state.totalAnswered > 0 ? (state.score / state.totalAnswered * 100).round() : 0;

    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: NeuCard(
          backgroundColor: Colors.white,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: AppColors.popYellow,
                  shape: BoxShape.circle,
                  border: Border.all(color: AppColors.brutalBlack, width: 3),
                ),
                child: const Icon(Icons.emoji_events_rounded, size: 54, color: AppColors.brutalBlack),
              ),
              const SizedBox(height: 16),
              Text(
                'QUIZ MASTERY COMPLETE!',
                style: GoogleFonts.fredoka(fontSize: 22, fontWeight: FontWeight.bold, color: AppColors.brutalBlack),
              ),
              const SizedBox(height: 8),
              Text(
                'Accuracy: $pct% (${state.score}/${state.totalAnswered} Correct)',
                style: GoogleFonts.inter(fontSize: 15, fontWeight: FontWeight.w600, color: Colors.black54),
              ),
              const SizedBox(height: 16),
              const NeuBadge(
                label: '+50 XP LOGGED TO DASHBOARD',
                backgroundColor: AppColors.popGreen,
              ),
              const SizedBox(height: 20),
              NeuButton(
                text: 'RETURN TO DASHBOARD',
                backgroundColor: AppColors.popCoral,
                textColor: Colors.white,
                onPressed: () => context.pop(),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
