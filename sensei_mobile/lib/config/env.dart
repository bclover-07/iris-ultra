import 'package:flutter/foundation.dart';

class Env {
  static String get apiBaseUrl => kIsWeb ? 'http://localhost:5000' : 'http://10.0.2.2:5000';
  static String get webBaseUrl => apiBaseUrl;
  static String get wsUrl => kIsWeb ? 'http://localhost:5000' : 'http://10.0.2.2:5000';
  static String get socketUrl => kIsWeb ? 'http://localhost:5000' : 'http://10.0.2.2:5000';
  static const int socketReconnectAttempts = 5;
  static const Duration socketReconnectDelay = Duration(seconds: 3);
  static const Duration connectTimeout = Duration(seconds: 15);
  static const Duration receiveTimeout = Duration(seconds: 15);
}
