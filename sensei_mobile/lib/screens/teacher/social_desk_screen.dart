import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../services/api_service.dart';
import '../../services/socket_service.dart';
import '../../providers/auth_provider.dart';
import '../../utils/socket_namespace.dart';
import '../../theme/app_colors.dart';
import '../../theme/neubrutalist_widgets.dart';
import 'create_poll_dialog.dart';

class SocialDeskScreen extends ConsumerStatefulWidget {
  const SocialDeskScreen({super.key});

  @override
  ConsumerState<SocialDeskScreen> createState() => _SocialDeskScreenState();
}

class _SocialDeskScreenState extends ConsumerState<SocialDeskScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  bool _isLoading = true;
  String? _fetchError;
  List<dynamic> _polls = [];
  List<dynamic> _queue = [];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _fetchData();
    _setupSocketListener();
  }

  void _setupSocketListener() {
    final authState = ref.read(authProvider);
    final user = authState.user;
    if (user != null) {
      SocketService().connect(
        namespace: socketNamespaceForRole(user.role),
        userId: user.id,
      );
      SocketService().on(socketNamespaceForRole(user.role), 'help:new_ticket', (data) {
        if (mounted && data != null) {
          _fetchData();
          final studentName = data['studentId'] is Map
              ? (data['studentId']['name'] ?? 'Student')
              : 'Student';
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('🙋 New help ticket from $studentName!'),
              behavior: SnackBarBehavior.floating,
              backgroundColor: AppColors.brutalBlue,
            ),
          );
        }
      });
      SocketService().on(socketNamespaceForRole(user.role), 'help:ticket_updated', (data) {
        if (mounted) {
          _fetchData();
        }
      });
      SocketService().on(socketNamespaceForRole(user.role), 'poll:new', (data) {
        if (mounted) {
          _fetchData();
        }
      });
      SocketService().on(socketNamespaceForRole(user.role), 'poll:update_results', (data) {
        if (mounted) {
          _fetchData();
        }
      });
      SocketService().on(socketNamespaceForRole(user.role), 'poll:closed', (data) {
        if (mounted) {
          _fetchData();
        }
      });
    }
  }

  List<dynamic> _parseListData(dynamic data, String mapKey) {
    if (data == null) return [];
    if (data is String) {
      try {
        final decoded = jsonDecode(data);
        return _parseListData(decoded, mapKey);
      } catch (e) {
        debugPrint('Failed to decode JSON string: $e');
        return [];
      }
    }
    if (data is Map) {
      return data[mapKey] ?? [];
    }
    if (data is List) {
      return data;
    }
    return [];
  }

  Future<void> _fetchData() async {
    setState(() {
      _isLoading = true;
      _fetchError = null;
    });
    try {
      final api = ApiService();
      final results = await Future.wait([
        api.get('/api/teacher/polls'),
        api.get('/api/help-ticket'),
      ]);

      if (mounted) {
        setState(() {
          _polls = _parseListData(results[0].data, 'polls');
          _queue = _parseListData(results[1].data, 'tickets');
          _isLoading = false;
        });
      }
    } catch (e) {
      debugPrint('Fetch Data Main Catch Error: $e');
      if (mounted) {
        setState(() {
          _fetchError = 'Failed to load social desk data. Check your connection and try again.';
          _isLoading = false;
        });
      }
    }
  }

  @override
  void dispose() {
    final user = ref.read(authProvider).user;
    if (user != null) {
      final ns = socketNamespaceForRole(user.role);
      SocketService().off(ns, 'help:new_ticket');
      SocketService().off(ns, 'help:ticket_updated');
      SocketService().off(ns, 'poll:new');
      SocketService().off(ns, 'poll:update_results');
      SocketService().off(ns, 'poll:closed');
    }
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _resolveTicket(String? ticketId) async {
    if (ticketId == null) return;
    try {
      await ApiService().patch('/api/help-ticket/$ticketId/resolve');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Ticket resolved!')));
        _fetchData();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed to resolve ticket: $e')));
      }
    }
  }

  void _showReplyBottomSheet(Map<String, dynamic> ticket) {
    final replyCtrl = TextEditingController();
    bool isDrafting = false;
    bool isSending = false;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => StatefulBuilder(
        builder: (context, setModalState) {
          final studentName = ticket['studentId'] is Map
              ? (ticket['studentId']['name'] ?? 'Student')
              : 'Student';
          return Container(
            margin: EdgeInsets.only(
              top: 64,
              left: 16,
              right: 16,
              bottom: MediaQuery.of(context).viewInsets.bottom + 16,
            ),
            decoration: BoxDecoration(
              color: Colors.white,
              border: Border.all(color: AppColors.brutalBlack, width: 4),
              boxShadow: const [BoxShadow(color: AppColors.brutalBlack, offset: Offset(6, 6))],
            ),
            padding: const EdgeInsets.all(24),
            child: SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'REPLY TO TICKET',
                        style: GoogleFonts.inter(
                          fontWeight: FontWeight.w900,
                          fontSize: 20,
                          color: AppColors.brutalBlack,
                        ),
                      ),
                      IconButton(
                        icon: const Icon(Icons.close, color: AppColors.brutalBlack, size: 28),
                        onPressed: () => Navigator.pop(ctx),
                      ),
                    ],
                  ),
                  const Divider(color: AppColors.brutalBlack, thickness: 3),
                  const SizedBox(height: 16),
                  Text(
                    'Student: $studentName',
                    style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 16),
                  ),
                  const SizedBox(height: 8),
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: Colors.grey.shade100,
                      border: Border.all(color: AppColors.brutalBlack, width: 2),
                    ),
                    child: Text(
                      ticket['message'] ?? ticket['question'] ?? 'No description',
                      style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w500),
                    ),
                  ),
                  const SizedBox(height: 24),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'YOUR REPLY',
                        style: GoogleFonts.inter(fontWeight: FontWeight.w900, fontSize: 14),
                      ),
                      if (isDrafting)
                        const SizedBox(
                          height: 16,
                          width: 16,
                          child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.brutalBlack),
                        )
                      else
                        GestureDetector(
                          onTap: () async {
                            setModalState(() => isDrafting = true);
                            try {
                              final res = await ApiService().post('/api/help-ticket/${ticket['_id']}/ai-draft');
                              if (res.data != null && res.data['draft'] != null) {
                                replyCtrl.text = res.data['draft'].toString();
                              }
                            } catch (e) {
                              ScaffoldMessenger.of(context).showSnackBar(
                                SnackBar(content: Text('Failed to generate draft: $e')),
                              );
                            } finally {
                              setModalState(() => isDrafting = false);
                            }
                          },
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                            decoration: BoxDecoration(
                              color: AppColors.brutalistCyan,
                              border: Border.all(color: AppColors.brutalBlack, width: 2),
                              boxShadow: const [BoxShadow(color: AppColors.brutalBlack, offset: Offset(2, 2))],
                            ),
                            child: Row(
                              children: [
                                const Icon(Icons.auto_awesome, size: 14, color: AppColors.brutalBlack),
                                const SizedBox(width: 4),
                                Text(
                                  'AI DRAFT',
                                  style: GoogleFonts.inter(fontWeight: FontWeight.w900, fontSize: 10),
                                ),
                              ],
                            ),
                          ),
                        ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: replyCtrl,
                    maxLines: 5,
                    decoration: const InputDecoration(
                      hintText: 'Type your reply here...',
                      border: OutlineInputBorder(
                        borderSide: BorderSide(color: AppColors.brutalBlack, width: 2),
                      ),
                      focusedBorder: OutlineInputBorder(
                        borderSide: BorderSide(color: AppColors.brutalistCyan, width: 3),
                      ),
                    ),
                  ),
                  const SizedBox(height: 24),
                  Row(
                    children: [
                      Expanded(
                        child: ComicButton(
                          label: 'RESOLVE DIRECTLY',
                          backgroundColor: AppColors.comicYellow,
                          onPressed: () async {
                            Navigator.pop(ctx);
                            _resolveTicket(ticket['_id']);
                          },
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: ComicButton(
                          label: isSending ? 'SENDING...' : 'SEND REPLY',
                          backgroundColor: AppColors.brutalCyan,
                          onPressed: isSending
                              ? null
                              : () async {
                                  final text = replyCtrl.text.trim();
                                  if (text.isEmpty) return;
                                  setModalState(() => isSending = true);
                                  try {
                                    await ApiService().patch(
                                      '/api/help-ticket/${ticket['_id']}/respond',
                                      data: {'response': text},
                                    );
                                    if (mounted) {
                                      Navigator.pop(ctx);
                                      ScaffoldMessenger.of(context).showSnackBar(
                                        const SnackBar(content: Text('Reply sent successfully!')),
                                      );
                                      _fetchData();
                                    }
                                  } catch (e) {
                                    ScaffoldMessenger.of(context).showSnackBar(
                                      SnackBar(content: Text('Failed to send reply: $e')),
                                    );
                                  } finally {
                                    setModalState(() => isSending = false);
                                  }
                                },
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  Future<void> _showCreatePollDialog() async {
    final result = await showDialog<Map<String, dynamic>>(
      context: context,
      builder: (ctx) => const CreatePollDialog(),
    );

    if (result == null) return;

    try {
      await ApiService().post('/api/teacher/polls', data: result);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Poll created!')));
        _fetchData();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Failed to create poll')));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.brutalBg,
      body: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Container(
            padding: const EdgeInsets.only(top: 48, left: 32, right: 32, bottom: 24),
            decoration: const BoxDecoration(
              color: AppColors.brutalistCyan,
              border: Border(bottom: BorderSide(color: AppColors.brutalBlack, width: 4)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'SOCIAL DESK',
                  style: GoogleFonts.inter(
                    color: AppColors.brutalBlack,
                    fontWeight: FontWeight.w900,
                    fontSize: 42,
                    letterSpacing: -1,
                  ),
                ),
                Text(
                  'Manage communications, polls, and help tickets',
                  style: GoogleFonts.inter(
                    color: Colors.grey.shade800,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 24),
                TabBar(
                  controller: _tabController,
                  labelColor: Colors.white,
                  unselectedLabelColor: AppColors.brutalBlack,
                  indicator: BoxDecoration(
                    color: AppColors.brutalBlue,
                    border: Border.all(color: AppColors.brutalBlack, width: 3),
                  ),
                  labelStyle: GoogleFonts.inter(fontWeight: FontWeight.w900, fontSize: 14),
                  unselectedLabelStyle: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 14),
                  tabs: [
                    Tab(
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 16),
                        child: Row(mainAxisAlignment: MainAxisAlignment.center, children: [const Icon(Icons.help_center), const SizedBox(width: 8), const Text('HELP QUEUE'), if (_queue.isNotEmpty) ...[const SizedBox(width: 8), Container(padding: const EdgeInsets.all(4), decoration: const BoxDecoration(color: AppColors.comicRed, shape: BoxShape.circle), child: Text('${_queue.length}', style: const TextStyle(color: Colors.white, fontSize: 10)))]]),
                      ),
                    ),
                    Tab(
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 16),
                        child: const Row(mainAxisAlignment: MainAxisAlignment.center, children: [Icon(Icons.bar_chart), SizedBox(width: 8), Text('LIVE POLLS')]),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator(color: AppColors.brutalBlack))
                : _fetchError != null
                    ? Center(
                        child: Padding(
                          padding: const EdgeInsets.all(32),
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Text(_fetchError!, textAlign: TextAlign.center, style: GoogleFonts.inter(fontWeight: FontWeight.bold)),
                              const SizedBox(height: 16),
                              ComicButton(label: 'RETRY', backgroundColor: AppColors.brutalistCyan, onPressed: _fetchData),
                            ],
                          ),
                        ),
                      )
                    : TabBarView(
                    controller: _tabController,
                    children: [
                      _buildHelpQueueTab(),
                      _buildPollsTab(),
                    ],
                  ),
          ),
        ],
      ),
    );
  }


  Widget _buildHelpQueueTab() {
    if (_queue.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.check_circle_outline, size: 64, color: AppColors.brutalBlue),
            const SizedBox(height: 16),
            Text('No pending help tickets!', style: GoogleFonts.inter(fontSize: 24, fontWeight: FontWeight.w900)),
          ],
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(32),
      itemCount: _queue.length,
      itemBuilder: (context, index) {
        final t = _queue[index];
        final studentName = t['studentId'] is Map ? (t['studentId']['name'] ?? 'Unknown') : 'Student';
        final isResolved = t['status']?.toString().toLowerCase() == 'resolved';
        final isResponded = t['status']?.toString().toLowerCase() == 'responded';
        return Padding(
          padding: const EdgeInsets.only(bottom: 16),
          child: BrutalistCard(
            backgroundColor: isResolved ? Colors.grey.shade100 : (isResponded ? AppColors.senseiBlue : AppColors.brutalistCyan),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                            decoration: BoxDecoration(color: Colors.white, border: Border.all(color: Colors.black, width: 2)),
                            child: Text(t['status']?.toString().toUpperCase() ?? 'OPEN', style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w900)),
                          ),
                          Text(t['createdAt']?.split('T')[0] ?? '', style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.bold)),
                        ],
                      ),
                      const SizedBox(height: 12),
                      Text('From: $studentName', style: GoogleFonts.inter(fontWeight: FontWeight.w900, fontSize: 18)),
                      const SizedBox(height: 8),
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(color: Colors.white, border: Border.all(color: Colors.black, width: 2)),
                        child: Text(t['message'] ?? t['question'] ?? t['issue'] ?? 'No description', style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.bold)),
                      ),
                      if (t['response'] != null && t['response'].toString().trim().isNotEmpty) ...[
                        const SizedBox(height: 12),
                        Text('Reply Sent:', style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 12, color: Colors.grey.shade700)),
                        const SizedBox(height: 4),
                        Container(
                          padding: const EdgeInsets.all(8),
                          width: double.infinity,
                          decoration: BoxDecoration(
                            color: Colors.grey.shade50,
                            border: Border.all(color: AppColors.brutalBlack, width: 1),
                          ),
                          child: Text(
                            t['response'].toString(),
                            style: GoogleFonts.inter(fontSize: 12, fontStyle: FontStyle.italic, fontWeight: FontWeight.bold),
                          ),
                        ),
                      ],
                      if (!isResolved) ...[
                        const SizedBox(height: 16),
                        Row(
                          children: [
                            Expanded(
                              child: ComicButton(
                                label: 'REPLY',
                                backgroundColor: Colors.white,
                                onPressed: () => _showReplyBottomSheet(t),
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: ComicButton(
                                label: 'RESOLVE',
                                backgroundColor: AppColors.comicRed,
                                onPressed: () => _resolveTicket(t['_id']),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ],
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildPollsTab() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Padding(
          padding: const EdgeInsets.all(16),
          child: ComicButton(
            label: '+ CREATE NEW POLL',
            backgroundColor: Colors.white,
            onPressed: () => _showCreatePollDialog(),
          ),
        ),
        Expanded(
          child: _polls.isEmpty
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(Icons.bar_chart, size: 64, color: AppColors.brutalCyan),
                      const SizedBox(height: 16),
                      Text('No Active Polls', style: GoogleFonts.inter(fontSize: 24, fontWeight: FontWeight.w900)),
                    ],
                  ),
                )
              : ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: _polls.length,
                  itemBuilder: (context, index) {
                    final p = _polls[index];
                    final isOpen = p['isOpen'] == true;
                    return Padding(
                      padding: const EdgeInsets.only(bottom: 16),
                      child: BrutalistCard(
                        backgroundColor: isOpen ? AppColors.senseiBlue : Colors.grey.shade300,
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                  decoration: BoxDecoration(color: Colors.white, border: Border.all(color: Colors.black, width: 2)),
                                  child: Text(isOpen ? 'LIVE' : 'CLOSED', style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w900)),
                                ),
                                Text(p['createdAt']?.split('T')[0] ?? '', style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.bold)),
                              ],
                            ),
                            const SizedBox(height: 12),
                            Text(p['question'] ?? 'Poll Question', style: GoogleFonts.inter(fontWeight: FontWeight.w900, fontSize: 18)),
                            const SizedBox(height: 16),
                            ...(() {
                              final List<dynamic> options = p['options'] ?? [];
                              final List<dynamic> responses = p['responses'] ?? [];
                              final total = responses.length;
                              return options.map((opt) {
                                final optionText = opt.toString();
                                final count = responses.where((r) => r['option'] == optionText).length;
                                final percentage = total > 0 ? (count / total) * 100 : 0.0;
                                return Padding(
                                  padding: const EdgeInsets.only(bottom: 8),
                                  child: Row(
                                    children: [
                                      Expanded(
                                        flex: 4,
                                        child: Text(optionText, style: GoogleFonts.inter(fontWeight: FontWeight.bold)),
                                      ),
                                      Expanded(
                                        flex: 6,
                                        child: Stack(
                                          children: [
                                            Container(
                                              height: 20,
                                              decoration: BoxDecoration(
                                                color: Colors.white,
                                                border: Border.all(color: Colors.black, width: 1),
                                              ),
                                            ),
                                            if (percentage > 0)
                                              FractionallySizedBox(
                                                widthFactor: percentage / 100,
                                                child: Container(
                                                  height: 20,
                                                  color: AppColors.brutalistCyan,
                                                  child: Center(
                                                    child: Text('$count', style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold)),
                                                  ),
                                                ),
                                              )
                                            else
                                              Container(
                                                height: 20,
                                                alignment: Alignment.centerLeft,
                                                padding: const EdgeInsets.only(left: 8),
                                                child: Text('0', style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.grey)),
                                              ),
                                          ],
                                        ),
                                      ),
                                    ],
                                  ),
                                );
                              });
                            })(),
                            if (isOpen) ...[
                              const SizedBox(height: 16),
                              SizedBox(
                                width: double.infinity,
                                child: ComicButton(
                                  label: 'CLOSE POLL',
                                  backgroundColor: AppColors.comicRed,
                                  onPressed: () async {
                                    try {
                                      await ApiService().patch('/api/teacher/polls/${p['_id']}/close');
                                      _fetchData();
                                    } catch (e) {
                                      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Error closing poll')));
                                    }
                                  },
                                ),
                              ),
                            ],
                          ],
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
