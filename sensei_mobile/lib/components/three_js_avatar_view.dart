import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:webview_flutter/webview_flutter.dart';
import 'package:google_fonts/google_fonts.dart';
import '../theme/app_colors.dart';
import '../theme/neubrutalist_widgets.dart';

class ThreeJsAvatarView extends StatefulWidget {
  final double height;
  final String initialMood;
  final Function(String event, dynamic data)? onEvent;

  const ThreeJsAvatarView({
    super.key,
    this.height = 220,
    this.initialMood = 'idle',
    this.onEvent,
  });

  @override
  State<ThreeJsAvatarView> createState() => ThreeJsAvatarViewState();
}

class ThreeJsAvatarViewState extends State<ThreeJsAvatarView> {
  WebViewController? _controller;
  bool _isLoading = true;
  String _currentMood = 'idle';

  @override
  void initState() {
    super.initState();
    _currentMood = widget.initialMood;
    _initWebView();
  }

  void _initWebView() {
    try {
      final controller = WebViewController()
        ..setJavaScriptMode(JavaScriptMode.unrestricted)
        ..setBackgroundColor(AppColors.creamBg)
        ..setNavigationDelegate(
          NavigationDelegate(
            onPageFinished: (_) {
              if (mounted) {
                setState(() => _isLoading = false);
                setMood(_currentMood);
              }
            },
          ),
        )
        ..addJavaScriptChannel(
          'FlutterBridge',
          onMessageReceived: (JavaScriptMessage message) {
            try {
              final parsed = jsonDecode(message.message);
              widget.onEvent?.call(parsed['event'] ?? '', parsed['data']);
            } catch (_) {}
          },
        );

      controller.loadFlutterAsset('assets/web/3d_avatar.html');
      _controller = controller;
    } catch (_) {
      setState(() => _isLoading = false);
    }
  }

  /// Change 3D avatar animation/mood: 'idle', 'talking', 'thinking', 'celebrating', 'debate', 'interview'
  Future<void> setMood(String mood) async {
    _currentMood = mood;
    if (_controller != null && !_isLoading) {
      try {
        await _controller!.runJavaScript("window.setMood('$mood');");
      } catch (_) {}
    }
  }

  /// Move avatar in 3D coordinate space
  Future<void> movePlayer(double x, double y, double z) async {
    if (_controller != null && !_isLoading) {
      try {
        await _controller!.runJavaScript("window.movePlayer($x, $y, $z);");
      } catch (_) {}
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      height: widget.height,
      decoration: BoxDecoration(
        color: AppColors.creamCard,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColors.brutalBlack, width: 2.5),
        boxShadow: const [
          BoxShadow(
            color: AppColors.brutalBlack,
            offset: Offset(3.5, 3.5),
            blurRadius: 0,
          ),
        ],
      ),
      clipBehavior: Clip.antiAlias,
      child: Stack(
        children: [
          if (_controller != null)
            WebViewWidget(controller: _controller!)
          else
            _buildProceduralFallback(),
          if (_isLoading)
            Container(
              color: AppColors.creamCard,
              child: Center(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const SizedBox(
                      width: 24,
                      height: 24,
                      child: CircularProgressIndicator(color: AppColors.popViolet, strokeWidth: 2.5),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'INITIALIZING 3D NPU RIG...',
                      style: GoogleFonts.fredoka(fontSize: 10, fontWeight: FontWeight.bold, letterSpacing: 1),
                    ),
                  ],
                ),
              ),
            ),
          Positioned(
            top: 10,
            right: 10,
            child: NeuBadge(
              label: _currentMood.toUpperCase(),
              backgroundColor: _currentMood == 'talking'
                  ? AppColors.popGreen
                  : _currentMood == 'debate'
                      ? AppColors.popCoral
                      : _currentMood == 'interview'
                          ? AppColors.popBlue
                          : AppColors.popYellow,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildProceduralFallback() {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: AppColors.popYellow,
              shape: BoxShape.circle,
              border: Border.all(color: AppColors.brutalBlack, width: 2.5),
            ),
            child: const Icon(Icons.smart_toy_rounded, size: 40, color: AppColors.brutalBlack),
          ),
          const SizedBox(height: 8),
          Text(
            'SENSEI 3D AVATAR RIG',
            style: GoogleFonts.fredoka(fontSize: 12, fontWeight: FontWeight.bold),
          ),
        ],
      ),
    );
  }
}
