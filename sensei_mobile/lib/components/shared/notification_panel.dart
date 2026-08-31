import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:sensei_mobile/services/api_service.dart';
import 'package:sensei_mobile/services/socket_service.dart';
import 'package:sensei_mobile/theme/app_colors.dart';
import 'package:sensei_mobile/theme/neubrutalist_widgets.dart';
import 'package:sensei_mobile/utils/socket_namespace.dart';

class NotificationItem {
  final String id;
  final String type;
  final String title;
  final String message;
  final bool isRead;
  final DateTime createdAt;

  NotificationItem({
    required this.id,
    required this.type,
    required this.title,
    required this.message,
    required this.isRead,
    required this.createdAt,
  });

  factory NotificationItem.fromJson(Map<String, dynamic> json) {
    return NotificationItem(
      id: json['_id']?.toString() ?? '',
      type: json['type']?.toString() ?? 'info',
      title: json['title']?.toString() ?? '',
      message: json['message']?.toString() ?? '',
      isRead: json['isRead'] == true,
      createdAt: DateTime.tryParse(json['createdAt']?.toString() ?? '') ?? DateTime.now(),
    );
  }
}

class NotificationPanel extends StatefulWidget {
  final String userRole;

  const NotificationPanel({super.key, required this.userRole});

  @override
  State<NotificationPanel> createState() => _NotificationPanelState();
}

class _NotificationPanelState extends State<NotificationPanel> with SingleTickerProviderStateMixin {
  bool _isOpen = false;
  bool _isLoading = false;
  String? _error;
  List<NotificationItem> _notifications = [];
  int _unreadCount = 0;

  late AnimationController _animController;
  late Animation<double> _scaleAnimation;
  late Animation<double> _opacityAnimation;

  @override
  void initState() {
    super.initState();
    _animController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 200),
    );
    _scaleAnimation = Tween<double>(begin: 0.95, end: 1.0).animate(
      CurvedAnimation(parent: _animController, curve: Curves.easeOut),
    );
    _opacityAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(parent: _animController, curve: Curves.easeOut),
    );
    _setupSocketListener();
    _fetchNotifications();
  }

  void _setupSocketListener() {
    final namespace = socketNamespaceForRole(widget.userRole);
    SocketService().on(namespace, 'notification:new', (data) {
      if (!mounted || data == null) return;
      try {
        final item = NotificationItem.fromJson(Map<String, dynamic>.from(data as Map));
        setState(() {
          _notifications = [item, ..._notifications].take(50).toList();
          _unreadCount = _notifications.where((n) => !n.isRead).length;
        });
      } catch (_) {}
    });
  }

  @override
  void dispose() {
    SocketService().off(socketNamespaceForRole(widget.userRole), 'notification:new');
    _animController.dispose();
    super.dispose();
  }

  Future<void> _fetchNotifications() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });
    try {
      final response = await ApiService().get('/api/notifications');
      final raw = response.data;
      final list = raw is List ? raw : [];
      if (mounted) {
        setState(() {
          _notifications = list
              .map((n) => NotificationItem.fromJson(Map<String, dynamic>.from(n as Map)))
              .toList();
          _unreadCount = _notifications.where((n) => !n.isRead).length;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _notifications = [];
          _unreadCount = 0;
          _error = 'Failed to load notifications';
          _isLoading = false;
        });
      }
    }
  }

  Future<void> _markAsRead(String id) async {
    try {
      await ApiService().put('/api/notifications/$id/read');
    } catch (_) {}
    setState(() {
      final idx = _notifications.indexWhere((n) => n.id == id);
      if (idx != -1 && !_notifications[idx].isRead) {
        _notifications[idx] = NotificationItem(
          id: _notifications[idx].id,
          type: _notifications[idx].type,
          title: _notifications[idx].title,
          message: _notifications[idx].message,
          isRead: true,
          createdAt: _notifications[idx].createdAt,
        );
        _unreadCount = _notifications.where((n) => !n.isRead).length;
      }
    });
  }

  void _togglePanel() {
    setState(() {
      _isOpen = !_isOpen;
      if (_isOpen) {
        _animController.forward();
        _fetchNotifications();
      } else {
        _animController.reverse();
      }
    });
  }

  String _timeAgo(DateTime date) {
    final diff = DateTime.now().difference(date);
    if (diff.inMinutes < 1) return 'Just now';
    if (diff.inMinutes < 60) return '${diff.inMinutes}m ago';
    if (diff.inHours < 24) return '${diff.inHours}h ago';
    return '${diff.inDays}d ago';
  }

  Widget _getIcon(String type) {
    switch (type) {
      case 'warning':
        return const Icon(Icons.warning_amber_rounded, color: Colors.orange, size: 16);
      case 'info':
        return const Icon(Icons.info_outline_rounded, color: Colors.blue, size: 16);
      case 'message':
        return const Icon(Icons.chat_bubble_outline_rounded, color: Colors.green, size: 16);
      default:
        return const Icon(Icons.notifications_none_rounded, color: Colors.grey, size: 16);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Stack(
      clipBehavior: Clip.none,
      children: [
        GestureDetector(
          onTap: _togglePanel,
          child: Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: Colors.white,
              border: Border.all(color: AppColors.brutalBlack, width: 2),
              boxShadow: const [BoxShadow(color: AppColors.brutalBlack, offset: Offset(2, 2))],
            ),
            child: Stack(
              alignment: Alignment.center,
              children: [
                const Icon(Icons.notifications_none, color: AppColors.brutalBlack, size: 20),
                if (_unreadCount > 0)
                  Positioned(
                    top: -2,
                    right: -2,
                    child: Container(
                      width: 18,
                      height: 18,
                      decoration: BoxDecoration(
                        color: AppColors.comicRed,
                        shape: BoxShape.circle,
                        border: Border.all(color: AppColors.brutalBlack, width: 2),
                      ),
                      child: Center(
                        child: Text(
                          _unreadCount > 9 ? '9+' : '$_unreadCount',
                          style: const TextStyle(color: Colors.white, fontSize: 8, fontWeight: FontWeight.w900),
                        ),
                      ),
                    ),
                  ),
              ],
            ),
          ),
        ),
        if (_isOpen)
          Positioned(
            top: 48,
            right: 0,
            width: 340,
            child: AnimatedBuilder(
              animation: _animController,
              builder: (context, child) {
                return Opacity(
                  opacity: _opacityAnimation.value,
                  child: Transform.scale(
                    scale: _scaleAnimation.value,
                    alignment: Alignment.topRight,
                    child: BrutalistCard(
                      padding: EdgeInsets.zero,
                      backgroundColor: Colors.white,
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                            decoration: const BoxDecoration(
                              color: AppColors.comicYellow,
                              border: Border(bottom: BorderSide(color: AppColors.brutalBlack, width: 2)),
                            ),
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text(
                                  'Notifications${_unreadCount > 0 ? " ($_unreadCount)" : ""}',
                                  style: GoogleFonts.fredoka(fontSize: 14, fontWeight: FontWeight.bold),
                                ),
                                GestureDetector(
                                  onTap: _togglePanel,
                                  child: const Icon(Icons.close, size: 16),
                                ),
                              ],
                            ),
                          ),
                          Container(
                            constraints: const BoxConstraints(maxHeight: 350),
                            child: _isLoading && _notifications.isEmpty
                                ? const Padding(
                                    padding: EdgeInsets.all(24),
                                    child: Center(child: CircularProgressIndicator(color: AppColors.brutalBlack)),
                                  )
                                : _error != null
                                    ? Padding(
                                        padding: const EdgeInsets.all(24),
                                        child: Column(
                                          children: [
                                            Text(_error!, style: GoogleFonts.inter(fontSize: 12, color: Colors.red)),
                                            TextButton(onPressed: _fetchNotifications, child: const Text('Retry')),
                                          ],
                                        ),
                                      )
                                    : _notifications.isEmpty
                                        ? Padding(
                                            padding: const EdgeInsets.all(32),
                                            child: Text(
                                              'No notifications yet',
                                              style: GoogleFonts.inter(fontSize: 12, color: Colors.grey.shade600),
                                            ),
                                          )
                                        : ListView.builder(
                                            shrinkWrap: true,
                                            itemCount: _notifications.length,
                                            itemBuilder: (context, index) {
                                              final notif = _notifications[index];
                                              return GestureDetector(
                                                onTap: () => _markAsRead(notif.id),
                                                child: Container(
                                                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                                                  color: notif.isRead ? Colors.transparent : Colors.yellow.shade50,
                                                  child: Row(
                                                    crossAxisAlignment: CrossAxisAlignment.start,
                                                    children: [
                                                      _getIcon(notif.type),
                                                      const SizedBox(width: 12),
                                                      Expanded(
                                                        child: Column(
                                                          crossAxisAlignment: CrossAxisAlignment.start,
                                                          children: [
                                                            Text(
                                                              notif.title,
                                                              style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.bold),
                                                              maxLines: 1,
                                                              overflow: TextOverflow.ellipsis,
                                                            ),
                                                            Text(
                                                              notif.message,
                                                              style: TextStyle(fontSize: 11, color: Colors.grey.shade600),
                                                              maxLines: 2,
                                                              overflow: TextOverflow.ellipsis,
                                                            ),
                                                            Text(
                                                              _timeAgo(notif.createdAt),
                                                              style: TextStyle(fontSize: 10, color: Colors.grey.shade400),
                                                            ),
                                                          ],
                                                        ),
                                                      ),
                                                    ],
                                                  ),
                                                ),
                                              );
                                            },
                                          ),
                          ),
                        ],
                      ),
                    ),
                  ),
                );
              },
            ),
          ),
      ],
    );
  }
}
