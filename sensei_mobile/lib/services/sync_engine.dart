import 'dart:async';
import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:hive/hive.dart';
import 'api_service.dart';

class SyncAction {
  final String id;
  final String endpoint;
  final String method;
  final Map<String, dynamic> data;
  final DateTime timestamp;

  SyncAction({
    required this.id,
    required this.endpoint,
    required this.method,
    required this.data,
    required this.timestamp,
  });

  Map<String, dynamic> toJson() => {
        'id': id,
        'endpoint': endpoint,
        'method': method,
        'data': data,
        'timestamp': timestamp.toIso8601String(),
      };

  factory SyncAction.fromJson(Map<dynamic, dynamic> json) {
    return SyncAction(
      id: json['id'],
      endpoint: json['endpoint'],
      method: json['method'],
      data: Map<String, dynamic>.from(json['data'] ?? {}),
      timestamp: DateTime.parse(json['timestamp']),
    );
  }
}

class SyncEngine {
  static final SyncEngine _instance = SyncEngine._internal();
  factory SyncEngine() => _instance;
  SyncEngine._internal();

  final _api = ApiService();
  final _connectivity = Connectivity();
  StreamSubscription<List<ConnectivityResult>>? _subscription;
  
  bool _isOnline = true;
  bool get isOnline => _isOnline;
  
  Box<dynamic>? _actionQueue;
  
  final _statusController = StreamController<bool>.broadcast();
  Stream<bool> get onStatusChanged => _statusController.stream;

  Future<void> init() async {
    _actionQueue = await Hive.openBox('offline_actions');
    
    final results = await _connectivity.checkConnectivity();
    _updateStatus(results);

    _subscription = _connectivity.onConnectivityChanged.listen(_updateStatus);
  }

  void _updateStatus(List<ConnectivityResult> results) {
    final wasOnline = _isOnline;
    _isOnline = !results.contains(ConnectivityResult.none);
    
    if (_isOnline != wasOnline) {
      _statusController.add(_isOnline);
      if (_isOnline) {
        _syncPendingActions();
      }
    }
  }

  Future<void> queueAction(String endpoint, String method, Map<String, dynamic> data) async {
    if (_isOnline) {
      // Try immediate execution if online
      try {
        if (method == 'POST') await _api.post(endpoint, data: data);
        if (method == 'PUT') await _api.put(endpoint, data: data);
        if (method == 'DELETE') await _api.delete(endpoint);
        return;
      } catch (e) {
        // Fall through to queue on failure
      }
    }

    final action = SyncAction(
      id: DateTime.now().millisecondsSinceEpoch.toString(),
      endpoint: endpoint,
      method: method,
      data: data,
      timestamp: DateTime.now(),
    );

    await _actionQueue?.put(action.id, action.toJson());
  }

  Future<void> _syncPendingActions() async {
    if (_actionQueue == null || _actionQueue!.isEmpty) return;

    final keys = _actionQueue!.keys.toList();
    for (final key in keys) {
      try {
        final json = _actionQueue!.get(key);
        if (json != null) {
          final action = SyncAction.fromJson(json);
          
          if (action.method == 'POST') await _api.post(action.endpoint, data: action.data);
          else if (action.method == 'PUT') await _api.put(action.endpoint, data: action.data);
          else if (action.method == 'DELETE') await _api.delete(action.endpoint);
          
          await _actionQueue!.delete(key);
        }
      } catch (e) {
        // Stop syncing on first error to maintain order, will retry on next connection
        break;
      }
    }
  }

  void dispose() {
    _subscription?.cancel();
    _statusController.close();
  }
}
