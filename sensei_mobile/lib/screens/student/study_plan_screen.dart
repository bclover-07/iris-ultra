import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:go_router/go_router.dart';
import '../../services/api_service.dart';
import '../../theme/neubrutalist_widgets.dart';
import '../../theme/app_colors.dart';
import '../../models/study_plan.dart';

class StudyPlanScreen extends ConsumerStatefulWidget {
  const StudyPlanScreen({super.key});

  @override
  ConsumerState<StudyPlanScreen> createState() => _StudyPlanScreenState();
}

class _StudyPlanScreenState extends ConsumerState<StudyPlanScreen> {
  final _topicController = TextEditingController();
  final _videoUrlController = TextEditingController();
  int _targetDays = 7;
  double _hoursPerDay = 2.5;

  bool _isGenerating = false;
  bool _isLoadingActive = true;
  StudyPlanModel? _activePlan;

  @override
  void initState() {
    super.initState();
    _fetchActivePlan();
  }

  @override
  void dispose() {
    _topicController.dispose();
    _videoUrlController.dispose();
    super.dispose();
  }

  StudyPlanModel _generateLocalFallbackPlan(String topic, int daysCount, double hours) {
    final cleanTopic = topic.isNotEmpty ? topic : 'Data Structures & STEM Basics';
    final modules = [
      'Foundations & Core Principles of $cleanTopic',
      'Worked Examples & Key Equations',
      'Intermediate Concepts & Problem Solving',
      'Advanced Applications & Real-World Use Cases',
      'Comprehensive Practice & Self-Assessment',
      'Revision of Key Formulas & Diagrams',
      'Final Sprint & Exam Mastery Check'
    ];

    final days = List.generate(daysCount, (i) {
      final modTopic = modules[i % modules.length];
      return StudyDay(
        dayNumber: i + 1,
        topic: modTopic,
        tasks: [
          StudyTask(title: 'Review $cleanTopic core theory & notes', durationMinutes: (hours * 20).round()),
          StudyTask(title: 'Solve 3 practice problems on Doubt Solver', durationMinutes: (hours * 25).round()),
          StudyTask(title: 'Active recall drill in Camo Quizo', durationMinutes: (hours * 15).round()),
        ],
      );
    });

    final totalTasks = days.fold<int>(0, (sum, d) => sum + d.tasks.length);

    return StudyPlanModel(
      id: 'local_plan_${DateTime.now().millisecondsSinceEpoch}',
      title: '$cleanTopic Mastery Sprint',
      subject: cleanTopic,
      durationDays: daysCount,
      estimatedHoursPerDay: hours,
      days: days,
      totalTasks: totalTasks,
      completedTasks: 0,
      isActive: true,
    );
  }

  Future<void> _fetchActivePlan() async {
    setState(() => _isLoadingActive = true);
    try {
      final response = await ApiService().get('/api/study-plan/active');
      if (response.data != null) {
        setState(() {
          _activePlan = StudyPlanModel.fromJson(response.data);
        });
      }
    } catch (_) {
      if (_activePlan == null) {
        setState(() {
          _activePlan = _generateLocalFallbackPlan('Data Structures & Algorithms', 7, 2.5);
        });
      }
    } finally {
      if (mounted) setState(() => _isLoadingActive = false);
    }
  }

  Future<void> _generatePlan() async {
    final topic = _topicController.text.trim();
    if (topic.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter a syllabus topic or subject!')),
      );
      return;
    }

    setState(() => _isGenerating = true);

    try {
      final response = await ApiService().post('/api/study-plan/generate', data: {
        'focusSubject': topic,
        'targetDays': _targetDays,
        'hoursPerDay': _hoursPerDay,
        'youtubeUrl': _videoUrlController.text.trim(),
        'syllabusText': topic,
      });

      setState(() {
        _activePlan = StudyPlanModel.fromJson(response.data);
      });

      _topicController.clear();
      _videoUrlController.clear();
    } catch (e) {
      // Standalone On-Device Fallback Generator
      setState(() {
        _activePlan = _generateLocalFallbackPlan(topic, _targetDays, _hoursPerDay);
      });
      _topicController.clear();
      _videoUrlController.clear();

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Plan synthesized locally for "$topic"!'),
          backgroundColor: AppColors.popGreen,
        ),
      );
    } finally {
      if (mounted) setState(() => _isGenerating = false);
    }
  }

  Future<void> _toggleTask(int dayNumber, int taskIndex) async {
    if (_activePlan == null) return;

    final day = _activePlan!.days.firstWhere((d) => d.dayNumber == dayNumber);
    final task = day.tasks[taskIndex];

    setState(() {
      task.completed = !task.completed;
    });

    try {
      await ApiService().patch('/api/study-plan/toggle-task', data: {
        'planId': _activePlan!.id,
        'dayNumber': dayNumber,
        'taskIndex': taskIndex,
      });
    } catch (_) {}
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.creamBg,
      body: SafeArea(
        child: Column(
          children: [
            _buildHeader(),
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _buildGenerateFormCard(),
                    const SizedBox(height: 20),
                    if (_isLoadingActive)
                      const Center(child: CircularProgressIndicator(color: AppColors.brutalBlack))
                    else if (_activePlan != null)
                      _buildActivePlanTimeline(_activePlan!),
                  ],
                ),
              ),
            ),
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
                  'STUDY PLAN SYNTHESIZER',
                  style: GoogleFonts.fredoka(fontSize: 18, fontWeight: FontWeight.bold, color: AppColors.brutalBlack),
                ),
                Text(
                  'AI CURRICULUM & CHECKLIST GENERATOR §6.3',
                  style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.black54, letterSpacing: 1.1),
                ),
              ],
            ),
          ),
          const NeuBadge(
            label: 'CLOUD SYNTH',
            backgroundColor: AppColors.popBlue,
          ),
        ],
      ),
    );
  }

  Widget _buildGenerateFormCard() {
    return NeuCard(
      backgroundColor: Colors.white,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'SYNTHESIZE NEW PLAN',
            style: GoogleFonts.fredoka(fontSize: 14, fontWeight: FontWeight.bold, color: AppColors.brutalBlack, letterSpacing: 1),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _topicController,
            style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w600),
            decoration: InputDecoration(
              hintText: 'Enter syllabus topic (e.g. Distributed Systems)',
              hintStyle: GoogleFonts.inter(color: Colors.black38),
              filled: true,
              fillColor: AppColors.creamBg,
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: const BorderSide(color: AppColors.brutalBlack, width: 2),
              ),
            ),
          ),
          const SizedBox(height: 10),
          TextField(
            controller: _videoUrlController,
            style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w600),
            decoration: InputDecoration(
              hintText: 'Optional: Paste YouTube lecture / playlist URL',
              hintStyle: GoogleFonts.inter(color: Colors.black38),
              filled: true,
              fillColor: AppColors.creamBg,
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: const BorderSide(color: AppColors.brutalBlack, width: 2),
              ),
            ),
          ),
          const SizedBox(height: 14),
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Target Days: $_targetDays', style: GoogleFonts.fredoka(fontSize: 12, fontWeight: FontWeight.bold)),
                    Slider(
                      value: _targetDays.toDouble(),
                      min: 3,
                      max: 30,
                      divisions: 27,
                      activeColor: AppColors.popViolet,
                      onChanged: (v) => setState(() => _targetDays = v.round()),
                    ),
                  ],
                ),
              ),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Hours/Day: ${_hoursPerDay.toStringAsFixed(1)}h', style: GoogleFonts.fredoka(fontSize: 12, fontWeight: FontWeight.bold)),
                    Slider(
                      value: _hoursPerDay,
                      min: 1.0,
                      max: 8.0,
                      divisions: 14,
                      activeColor: AppColors.popYellow,
                      onChanged: (v) => setState(() => _hoursPerDay = v),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          NeuButton(
            text: _isGenerating ? 'SYNTHESIZING CURRICULUM...' : 'GENERATE STUDY PLAN →',
            icon: Icons.auto_awesome_rounded,
            backgroundColor: AppColors.popYellow,
            isLoading: _isGenerating,
            onPressed: _generatePlan,
          ),
        ],
      ),
    );
  }

  Widget _buildActivePlanTimeline(StudyPlanModel plan) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Expanded(
              child: Text(
                'ACTIVE PLAN: ${plan.title.toUpperCase()}',
                style: GoogleFonts.fredoka(fontSize: 14, fontWeight: FontWeight.bold, color: AppColors.brutalBlack, letterSpacing: 1),
                overflow: TextOverflow.ellipsis,
              ),
            ),
            const SizedBox(width: 8),
            NeuBadge(
              label: '${plan.progressPercent.round()}% COMPLETED',
              backgroundColor: AppColors.popGreen,
            ),
          ],
        ),
        const SizedBox(height: 10),
        NeuProgressBar(percentage: plan.progressPercent, fillColor: AppColors.popGreen),
        const SizedBox(height: 16),
        ...plan.days.map((day) => _buildDayCard(day)),
      ],
    );
  }

  Widget _buildDayCard(StudyDay day) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: NeuCard(
        backgroundColor: Colors.white,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                NeuBadge(
                  label: 'DAY ${day.dayNumber}',
                  backgroundColor: AppColors.popPink,
                ),
                Text(
                  day.topic,
                  style: GoogleFonts.fredoka(fontSize: 14, fontWeight: FontWeight.bold, color: AppColors.brutalBlack),
                ),
              ],
            ),
            const SizedBox(height: 12),
            ...day.tasks.asMap().entries.map((taskEntry) {
              final taskIndex = taskEntry.key;
              final task = taskEntry.value;

              return GestureDetector(
                onTap: () => _toggleTask(day.dayNumber, taskIndex),
                child: Padding(
                  padding: const EdgeInsets.symmetric(vertical: 4),
                  child: Row(
                    children: [
                      Container(
                        width: 22,
                        height: 22,
                        decoration: BoxDecoration(
                          color: task.completed ? AppColors.popGreen : Colors.white,
                          borderRadius: BorderRadius.circular(6),
                          border: Border.all(color: AppColors.brutalBlack, width: 2),
                        ),
                        child: task.completed
                            ? const Icon(Icons.check_rounded, size: 16, color: AppColors.brutalBlack)
                            : null,
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Text(
                          task.title,
                          style: GoogleFonts.inter(
                            fontSize: 13,
                            fontWeight: FontWeight.w600,
                            color: task.completed ? Colors.black38 : AppColors.brutalBlack,
                            decoration: task.completed ? TextDecoration.lineThrough : null,
                          ),
                        ),
                      ),
                      Text(
                        '${task.durationMinutes}m',
                        style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.black45),
                      ),
                    ],
                  ),
                ),
              );
            }),
          ],
        ),
      ),
    );
  }
}
