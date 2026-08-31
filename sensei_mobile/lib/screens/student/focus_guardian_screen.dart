import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:camera/camera.dart';
import 'package:google_mlkit_face_detection/google_mlkit_face_detection.dart';
import 'package:vibration/vibration.dart';

import '../../theme/app_colors.dart';
import '../../theme/neubrutalist_widgets.dart';

class FocusGuardianScreen extends ConsumerStatefulWidget {
  const FocusGuardianScreen({super.key});

  @override
  ConsumerState<FocusGuardianScreen> createState() => _FocusGuardianScreenState();
}

class _FocusGuardianScreenState extends ConsumerState<FocusGuardianScreen> {
  bool _isActive = false;
  int _focusScore = 100;
  int _distractions = 0;

  CameraController? _cameraController;
  late FaceDetector _faceDetector;
  bool _isProcessing = false;
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    _faceDetector = FaceDetector(
      options: FaceDetectorOptions(
        enableClassification: true,
        enableTracking: true,
      ),
    );
  }

  @override
  void dispose() {
    _stopGuardian();
    _faceDetector.close();
    super.dispose();
  }

  Future<void> _initCamera() async {
    try {
      final cameras = await availableCameras();
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

      if (mounted) {
        setState(() {});
        _timer = Timer.periodic(const Duration(seconds: 2), (timer) {
          _captureAndProcess();
        });
      }
    } catch (e) {
      debugPrint('Camera error: $e');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Failed to access camera. Please grant permissions.')),
        );
        setState(() {
          _isActive = false;
        });
      }
    }
  }

  Future<void> _captureAndProcess() async {
    if (_isProcessing || !_isActive || _cameraController == null) return;
    _isProcessing = true;

    try {
      final XFile picture = await _cameraController!.takePicture();
      final inputImage = InputImage.fromFilePath(picture.path);
      final faces = await _faceDetector.processImage(inputImage);
      
      bool distracted = false;
      if (faces.isEmpty) {
        distracted = true;
      } else {
        final face = faces.first;
        if (face.headEulerAngleY != null && face.headEulerAngleY!.abs() > 25) {
           distracted = true;
        } else if (face.headEulerAngleX != null && face.headEulerAngleX!.abs() > 25) {
           distracted = true;
        } else if (face.leftEyeOpenProbability != null && face.leftEyeOpenProbability! < 0.2) {
           distracted = true;
        }
      }

      if (distracted) {
        _handleDistraction();
      }

    } catch (e) {
      debugPrint('Face detection error: $e');
    }

    _isProcessing = false;
  }

  DateTime _lastDistractionTime = DateTime.now();

  void _handleDistraction() async {
    final now = DateTime.now();
    if (now.difference(_lastDistractionTime).inSeconds > 3) {
      _lastDistractionTime = now;
      if (mounted) {
        setState(() {
          _distractions++;
          _focusScore = (_focusScore - 5).clamp(0, 100);
        });
      }
      if (await Vibration.hasVibrator() ?? false) {
        Vibration.vibrate(duration: 500);
      }
    }
  }

  void _toggleGuardian() {
    setState(() {
      _isActive = !_isActive;
      if (_isActive) {
        _focusScore = 100;
        _distractions = 0;
        _initCamera();
      } else {
        _stopGuardian();
      }
    });
  }

  void _stopGuardian() {
    _timer?.cancel();
    _cameraController?.dispose();
    _cameraController = null;
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: isDark ? AppColors.darkBg : AppColors.pageYellow,
      appBar: AppBar(
        title: Text(
          'FOCUS GUARDIAN 👁️',
          style: GoogleFonts.fredoka(fontWeight: FontWeight.bold, color: isDark ? Colors.white : Colors.black),
        ),
        backgroundColor: Colors.transparent,
        elevation: 0,
        iconTheme: IconThemeData(color: isDark ? Colors.white : Colors.black),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          children: [
            BrutalistCard(
              backgroundColor: isDark ? AppColors.darkCard : Colors.white,
              padding: const EdgeInsets.all(24),
              child: Column(
                children: [
                  Icon(
                    _isActive ? Icons.visibility : Icons.visibility_off,
                    size: 80,
                    color: _isActive ? AppColors.comicGreen : Colors.grey,
                  ),
                  const SizedBox(height: 16),
                  Text(
                    _isActive ? 'GUARDIAN ACTIVE' : 'GUARDIAN INACTIVE',
                    style: GoogleFonts.fredoka(
                      fontSize: 24,
                      fontWeight: FontWeight.bold,
                      color: _isActive ? AppColors.comicGreen : Colors.grey,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Uses on-device AI to track your focus. Your phone will vibrate if you get distracted. You will be monitored periodically.',
                    textAlign: TextAlign.center,
                    style: GoogleFonts.inter(
                      color: isDark ? Colors.white70 : Colors.grey.shade700,
                    ),
                  ),
                  const SizedBox(height: 24),
                  if (_isActive && _cameraController != null && _cameraController!.value.isInitialized)
                    Container(
                      height: 120,
                      width: 120,
                      decoration: BoxDecoration(
                        border: Border.all(color: AppColors.brutalBlack, width: 3),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: ClipRRect(
                        borderRadius: BorderRadius.circular(9),
                        child: CameraPreview(_cameraController!),
                      ),
                    ),
                  if (_isActive && _cameraController != null) const SizedBox(height: 24),
                  ComicButton(
                    label: _isActive ? 'STOP SESSION' : 'START SESSION',
                    backgroundColor: _isActive ? AppColors.comicRed : AppColors.comicGreen,
                    onPressed: _toggleGuardian,
                  ),
                ],
              ),
            ),
            if (_isActive) ...[
              const SizedBox(height: 24),
              Row(
                children: [
                  Expanded(
                    child: StatCard(
                      label: 'Focus Score',
                      value: '$_focusScore%',
                      icon: Icons.track_changes,
                      iconColor: AppColors.comicBlue,
                      backgroundColor: AppColors.statBlue,
                      borderColor: AppColors.comicBlue,
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: StatCard(
                      label: 'Distractions',
                      value: '$_distractions',
                      icon: Icons.warning_amber_rounded,
                      iconColor: AppColors.comicOrange,
                      backgroundColor: AppColors.statAmber,
                      borderColor: AppColors.comicOrange,
                    ),
                  ),
                ],
              ),
            ]
          ],
        ),
      ),
    );
  }
}
