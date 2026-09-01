import 'package:flutter/material.dart';
import 'package:webview_flutter/webview_flutter.dart';
import '../../config/env.dart';

class Avatar3DView extends StatefulWidget {
  final String mood;
  final double width;
  final double height;

  const Avatar3DView({
    super.key,
    this.mood = 'idle',
    this.width = double.infinity,
    this.height = 300,
  });

  @override
  State<Avatar3DView> createState() => _Avatar3DViewState();
}

class _Avatar3DViewState extends State<Avatar3DView> {
  late final WebViewController _controller;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();

    final url = '${Env.webBaseUrl}/3d_bridge/avatar?mood=${widget.mood}';

    _controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setBackgroundColor(Colors.transparent)
      ..setNavigationDelegate(
        NavigationDelegate(
          onPageFinished: (String url) {
            if (mounted) setState(() => _isLoading = false);
          },
        ),
      )
      ..loadRequest(Uri.parse(url));
  }

  @override
  void didUpdateWidget(covariant Avatar3DView oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.mood != widget.mood) {
      _controller.runJavaScript('window.setMood("${widget.mood}");');
    }
  }

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: widget.width,
      height: widget.height,
      child: Stack(
        children: [
          WebViewWidget(controller: _controller),
          if (_isLoading)
            const Center(
              child: CircularProgressIndicator(color: Colors.black),
            ),
        ],
      ),
    );
  }
}
