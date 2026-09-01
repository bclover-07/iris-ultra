import 'package:socket_io_client/socket_io_client.dart' as sio;
import '../config/env.dart';

class SocketService {
  static final SocketService _instance = SocketService._internal();
  factory SocketService() => _instance;
  SocketService._internal();

  final Map<String, sio.Socket> _sockets = {};

  sio.Socket connect({
    required String namespace,
    required String userId,
  }) {
    final key = namespace.startsWith('/') ? namespace : '/$namespace';

    if (_sockets.containsKey(key) && _sockets[key]!.connected) {
      return _sockets[key]!;
    }

    final socket = sio.io(
      '${Env.socketUrl}$key',
      sio.OptionBuilder()
          .setTransports(['websocket', 'polling'])
          .enableReconnection()
          .setReconnectionAttempts(Env.socketReconnectAttempts)
          .setReconnectionDelay(Env.socketReconnectDelay.inMilliseconds)
          .setAuth({'userId': userId})
          .build(),
    );

    _sockets[key] = socket;
    return socket;
  }

  sio.Socket? getSocket(String namespace) {
    final key = namespace.startsWith('/') ? namespace : '/$namespace';
    return _sockets[key];
  }

  void disconnect(String namespace) {
    final key = namespace.startsWith('/') ? namespace : '/$namespace';
    _sockets[key]?.disconnect();
    _sockets.remove(key);
  }

  void disconnectAll() {
    for (final socket in _sockets.values) {
      socket.disconnect();
    }
    _sockets.clear();
  }

  void on(String namespace, String event, Function(dynamic) callback) {
    final key = namespace.startsWith('/') ? namespace : '/$namespace';
    _sockets[key]?.on(event, callback);
  }

  void off(String namespace, String event) {
    final key = namespace.startsWith('/') ? namespace : '/$namespace';
    _sockets[key]?.off(event);
  }

  void emit(String event, [dynamic data]) {
    // Default broadcast to active socket or /world namespace
    for (final s in _sockets.values) {
      s.emit(event, data);
    }
  }

  void emitToNamespace(String namespace, String event, [dynamic data]) {
    final key = namespace.startsWith('/') ? namespace : '/$namespace';
    _sockets[key]?.emit(event, data);
  }

  bool isConnected(String namespace) {
    final key = namespace.startsWith('/') ? namespace : '/$namespace';
    return _sockets[key]?.connected ?? false;
  }
}
