import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:go_router/go_router.dart';
import '../../theme/app_colors.dart';
import '../../theme/neubrutalist_widgets.dart';

class QuizStandardScreen extends StatefulWidget {
  const QuizStandardScreen({super.key});

  @override
  State<QuizStandardScreen> createState() => _QuizStandardScreenState();
}

class _QuizStandardScreenState extends State<QuizStandardScreen> {
  int _currentQuestionIndex = 0;
  String? _selectedAnswer;
  bool _isAnswerChecked = false;

  final List<Map<String, dynamic>> _questions = [
    {
      'question': 'What is the time complexity of binary search?',
      'options': ['O(1)', 'O(log n)', 'O(n)', 'O(n^2)'],
      'correct': 'O(log n)',
      'explanation': 'Binary search halves the search space at each step.',
    },
    {
      'question': 'Which of the following is not a stable sorting algorithm?',
      'options': ['Merge Sort', 'Insertion Sort', 'Quick Sort', 'Bubble Sort'],
      'correct': 'Quick Sort',
      'explanation': 'Quick Sort swaps non-adjacent elements, which can change the relative order of equal elements.',
    },
  ];

  void _checkAnswer() {
    if (_selectedAnswer == null) return;
    setState(() {
      _isAnswerChecked = true;
    });
  }

  void _nextQuestion() {
    if (_currentQuestionIndex < _questions.length - 1) {
      setState(() {
        _currentQuestionIndex++;
        _selectedAnswer = null;
        _isAnswerChecked = false;
      });
    } else {
      // Finish quiz
      showDialog(
        context: context,
        builder: (context) => AlertDialog(
          backgroundColor: AppColors.senseiYellow,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
            side: const BorderSide(color: AppColors.brutalBlack, width: 2),
          ),
          title: Text('Quiz Completed!', style: GoogleFonts.spaceGrotesk(fontWeight: FontWeight.bold)),
          content: Text('You have finished the quiz.', style: GoogleFonts.inter()),
          actions: [
            BrutalistButton(
              text: 'Finish',
              backgroundColor: AppColors.senseiPurple,
              onTap: () {
                Navigator.pop(context);
                context.pop();
              },
            ),
          ],
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final q = _questions[_currentQuestionIndex];
    final progress = (_currentQuestionIndex + 1) / _questions.length;

    return Scaffold(
      backgroundColor: AppColors.brutalBg,
      appBar: AppBar(
        backgroundColor: AppColors.brutalBg,
        elevation: 0,
        scrolledUnderElevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.close, color: AppColors.brutalBlack),
          onPressed: () => context.pop(),
        ),
        title: Text(
          'Standard Quiz',
          style: GoogleFonts.spaceGrotesk(
            color: AppColors.brutalBlack,
            fontWeight: FontWeight.w900,
            fontSize: 20,
          ),
        ),
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(6),
          child: Column(
            children: [
              Container(color: AppColors.brutalBlack, height: 2),
              LinearProgressIndicator(
                value: progress,
                backgroundColor: Colors.white,
                color: AppColors.senseiGreen,
                minHeight: 4,
              ),
            ],
          ),
        ),
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text(
                'Question ${_currentQuestionIndex + 1} of ${_questions.length}',
                style: GoogleFonts.inter(fontWeight: FontWeight.bold, color: Colors.grey.shade600),
              ),
              const SizedBox(height: 16),
              Container(
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(24),
                  border: Border.all(color: AppColors.brutalBlack, width: 4),
                  boxShadow: const [BoxShadow(color: AppColors.brutalBlack, offset: Offset(6, 6))],
                ),
                child: Text(
                  q['question'],
                  style: GoogleFonts.spaceGrotesk(fontSize: 24, fontWeight: FontWeight.bold),
                ),
              ),
              const SizedBox(height: 32),
              Expanded(
                child: ListView.separated(
                  itemCount: (q['options'] as List).length,
                  separatorBuilder: (context, index) => const SizedBox(height: 12),
                  itemBuilder: (context, index) {
                    final option = q['options'][index];
                    final isSelected = _selectedAnswer == option;
                    final isCorrect = option == q['correct'];
                    
                    Color bgColor = Colors.white;
                    if (_isAnswerChecked) {
                      if (isCorrect) {
                        bgColor = AppColors.senseiGreen;
                      } else if (isSelected) {
                        bgColor = AppColors.senseiRed;
                      }
                    } else if (isSelected) {
                      bgColor = AppColors.senseiYellow;
                    }

                    return GestureDetector(
                      onTap: _isAnswerChecked ? null : () => setState(() => _selectedAnswer = option),
                      child: Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: bgColor,
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: AppColors.brutalBlack, width: 3),
                          boxShadow: [
                            BoxShadow(
                              color: AppColors.brutalBlack,
                              offset: Offset(isSelected && !_isAnswerChecked ? 2 : 4, isSelected && !_isAnswerChecked ? 2 : 4),
                            ),
                          ],
                        ),
                        child: Row(
                          children: [
                            Container(
                              width: 32, height: 32,
                              decoration: BoxDecoration(
                                color: Colors.white,
                                shape: BoxShape.circle,
                                border: Border.all(color: AppColors.brutalBlack, width: 2),
                              ),
                              alignment: Alignment.center,
                              child: Text(
                                String.fromCharCode(65 + index),
                                style: GoogleFonts.spaceGrotesk(fontWeight: FontWeight.bold),
                              ),
                            ),
                            const SizedBox(width: 16),
                            Expanded(
                              child: Text(
                                option,
                                style: GoogleFonts.inter(
                                  fontSize: 16,
                                  fontWeight: FontWeight.w600,
                                  color: (_isAnswerChecked && (isCorrect || (isSelected && !isCorrect))) ? Colors.white : AppColors.brutalBlack,
                                ),
                              ),
                            ),
                            if (_isAnswerChecked && isCorrect)
                              const Icon(Icons.check_circle, color: Colors.white),
                            if (_isAnswerChecked && isSelected && !isCorrect)
                              const Icon(Icons.cancel, color: Colors.white),
                          ],
                        ),
                      ),
                    );
                  },
                ),
              ),
              if (_isAnswerChecked) ...[
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: AppColors.senseiBlue.withValues(alpha: 0.2),
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: AppColors.brutalBlack, width: 2),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          const Icon(Icons.lightbulb, color: AppColors.senseiBlue),
                          const SizedBox(width: 8),
                          Text('Explanation', style: GoogleFonts.spaceGrotesk(fontWeight: FontWeight.bold)),
                        ],
                      ),
                      const SizedBox(height: 8),
                      Text(q['explanation'], style: GoogleFonts.inter(fontSize: 14)),
                    ],
                  ),
                ),
                const SizedBox(height: 16),
              ],
              BrutalistButton(
                text: _isAnswerChecked ? 'Next Question' : 'Check Answer',
                backgroundColor: _isAnswerChecked ? AppColors.senseiPurple : (_selectedAnswer != null ? AppColors.senseiGreen : Colors.grey.shade300),
                onTap: _selectedAnswer == null 
                    ? () {} 
                    : (_isAnswerChecked ? _nextQuestion : _checkAnswer),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
