
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
    final key = namespace;

    if (_sockets.containsKey(key) && _sockets[key]!.connected) {
      return _sockets[key]!;
    }

    final socket = sio.io(
      '${Env.socketUrl}$namespace',
      sio.OptionBuilder()
          .setTransports(['websocket', 'polling'])
          .enableReconnection()
          .setReconnectionAttempts(Env.socketReconnectAttempts)
          .setReconnectionDelay(Env.socketReconnectDelay.inMilliseconds)
          .setAuth({'userId': userId})
          .build(),
    );

    socket.onConnect((_) {
      // Connected to $namespace
    });

    socket.onDisconnect((_) {
      // Disconnected from $namespace
    });

    socket.onError((data) {
      // Socket error on $namespace: $data
    });

    _sockets[key] = socket;
    return socket;
  }

  sio.Socket? getSocket(String namespace) {
    return _sockets[namespace];
  }

  void disconnect(String namespace) {
    _sockets[namespace]?.disconnect();
    _sockets.remove(namespace);
  }

  void disconnectAll() {
    for (final socket in _sockets.values) {
      socket.disconnect();
    }
    _sockets.clear();
  }

  void on(String namespace, String event, Function(dynamic) callback) {
    _sockets[namespace]?.on(event, callback);
  }

  void off(String namespace, String event) {
    _sockets[namespace]?.off(event);
  }

  void emit(String namespace, String event, [dynamic data]) {
    _sockets[namespace]?.emit(event, data);
  }

  bool isConnected(String namespace) {
    return _sockets[namespace]?.connected ?? false;
  }
}
