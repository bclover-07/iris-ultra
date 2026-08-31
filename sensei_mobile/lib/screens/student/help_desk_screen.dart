import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../theme/neubrutalist_widgets.dart';
import '../../theme/app_colors.dart';
import '../../services/api_service.dart';
import '../../services/socket_service.dart';
import '../../providers/auth_provider.dart';

class HelpDeskScreen extends ConsumerStatefulWidget {
  const HelpDeskScreen({super.key});

  @override
  ConsumerState<HelpDeskScreen> createState() => _HelpDeskScreenState();
}

class _HelpDeskScreenState extends ConsumerState<HelpDeskScreen> {
  List<dynamic> _tickets = [];
  bool _isLoading = true;
  bool _isSubmitting = false;

  List<dynamic> _teachers = [];
  String? _assignedTo;
  bool _isTeachersLoading = false;

  final _messageController = TextEditingController();
  String _category = 'Academic';
  String _urgency = 'medium';

  final List<String> _categories = ['Academic', 'Technical', 'Administrative', 'Other'];
  final List<String> _urgencies = ['low', 'medium', 'high'];

  @override
  void initState() {
    super.initState();
    _fetchTickets();
    _fetchTeachers();
    _setupSocketListener();
  }

  void _setupSocketListener() {
    final authState = ref.read(authProvider);
    final user = authState.user;
    if (user != null) {
      SocketService().connect(
        namespace: '/student',
        userId: user.id,
      );
      SocketService().on('/student', 'help:ticket_updated', (data) {
        if (mounted && data != null) {
          setState(() {
            _tickets = _tickets.map((t) {
              if (t['_id'] == data['_id']) {
                return data;
              }
              return t;
            }).toList();
          });
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('💬 Your help ticket has been responded!'),
              behavior: SnackBarBehavior.floating,
              backgroundColor: Colors.green,
            ),
          );
        }
      });
    }
  }

  @override
  void dispose() {
    SocketService().off('/student', 'help:ticket_updated');
    _messageController.dispose();
    super.dispose();
  }

  Future<void> _fetchTickets() async {
    setState(() => _isLoading = true);
    try {
      final response = await ApiService().get('/api/help-ticket');
      if (mounted) {
        setState(() {
          _tickets = response.data['tickets'] ?? [];
          _isLoading = false;
        });
      }
    } catch (e) {
      debugPrint('Fetch Tickets Error: $e');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error loading tickets: $e'),
            behavior: SnackBarBehavior.floating,
            backgroundColor: Colors.red,
          ),
        );
        setState(() => _isLoading = false);
      }
    }
  }

  Future<void> _fetchTeachers() async {
    if (!mounted) return;
    setState(() => _isTeachersLoading = true);
    try {
      final response = await ApiService().get('/api/help-ticket/faculty');
      if (mounted) {
        setState(() {
          _teachers = response.data['teachers'] ?? [];
          _isTeachersLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isTeachersLoading = false);
      }
    }
  }

  Future<void> _submitTicket() async {
    if (_messageController.text.trim().isEmpty) return;

    setState(() => _isSubmitting = true);
    try {
      await ApiService().post('/api/help-ticket', data: {
        'message': _messageController.text,
        'category': _category,
        'urgency': _urgency,
        if (_assignedTo != null) 'assignedTo': _assignedTo,
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Help ticket submitted!')));
      }
      _messageController.clear();
      setState(() => _assignedTo = null);
      _fetchTickets();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Failed to submit ticket')));
      }
    } finally {
      if (mounted) {
        setState(() => _isSubmitting = false);
      }
    }
  }

  Color _getUrgencyColor(String urgency) {
    switch (urgency) {
      case 'high': return Colors.red;
      case 'medium': return Colors.orange;
      case 'low': return Colors.blue;
      default: return Colors.blue;
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: isDark ? const Color(0xFF050508) : const Color(0xFFFEF9C3),
      appBar: AppBar(
        title: Text('STUDENT HELP DESK 🙋', style: GoogleFonts.fredoka(fontWeight: FontWeight.bold)),
        backgroundColor: Colors.transparent,
        elevation: 0,
        actions: [
          Container(
            margin: const EdgeInsets.all(8),
            padding: const EdgeInsets.symmetric(horizontal: 12),
            decoration: BoxDecoration(
              color: AppColors.senseiYellow.withValues(alpha: 0.2),
              border: Border.all(color: AppColors.senseiYellow),
              borderRadius: BorderRadius.circular(16),
            ),
            alignment: Alignment.center,
            child: Text('FAST SUPPORT', style: GoogleFonts.spaceMono(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.orange)),
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            BrutalistCard(
              backgroundColor: isDark ? const Color(0xFF1E293B) : Colors.white,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Text('New Ticket', style: GoogleFonts.fredoka(fontSize: 20, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 16),
                  Text('CATEGORY', style: GoogleFonts.spaceMono(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.grey)),
                  const SizedBox(height: 4),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12),
                    decoration: BoxDecoration(
                      color: isDark ? const Color(0xFF0F172A) : Colors.white,
                      border: Border.all(color: AppColors.brutalBlack, width: 2),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: DropdownButtonHideUnderline(
                      child: DropdownButton<String>(
                        value: _category,
                        isExpanded: true,
                        dropdownColor: isDark ? const Color(0xFF1E293B) : Colors.white,
                        items: _categories.map((c) => DropdownMenuItem(value: c, child: Text(c, style: GoogleFonts.fredoka()))).toList(),
                        onChanged: (v) => setState(() => _category = v!),
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                  Text('ASSIGN TO FACULTY', style: GoogleFonts.spaceMono(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.grey)),
                  const SizedBox(height: 4),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12),
                    decoration: BoxDecoration(
                      color: isDark ? const Color(0xFF0F172A) : Colors.white,
                      border: Border.all(color: AppColors.brutalBlack, width: 2),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: DropdownButtonHideUnderline(
                      child: DropdownButton<String?>(
                        value: _assignedTo,
                        isExpanded: true,
                        hint: _isTeachersLoading
                            ? Text('Loading Faculty...', style: GoogleFonts.fredoka(color: Colors.grey))
                            : Text('Select Faculty (Optional)', style: GoogleFonts.fredoka(color: Colors.grey)),
                        dropdownColor: isDark ? const Color(0xFF1E293B) : Colors.white,
                        items: [
                          DropdownMenuItem<String?>(
                            value: null,
                            child: Text('Any Available Faculty', style: GoogleFonts.fredoka()),
                          ),
                          ..._teachers.map((t) {
                            final String name = t['name'] ?? 'Unknown';
                            final String dept = t['department'] ?? '';
                            final String displayText = dept.isNotEmpty ? '$name ($dept)' : name;
                            return DropdownMenuItem<String?>(
                              value: t['_id']?.toString(),
                              child: Text(displayText, style: GoogleFonts.fredoka()),
                            );
                          }),
                        ],
                        onChanged: (v) => setState(() => _assignedTo = v),
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                  Text('URGENCY', style: GoogleFonts.spaceMono(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.grey)),
                  const SizedBox(height: 4),
                  Row(
                    children: _urgencies.map((u) => Expanded(
                      child: GestureDetector(
                        onTap: () => setState(() => _urgency = u),
                        child: Container(
                          margin: const EdgeInsets.only(right: 8),
                          padding: const EdgeInsets.symmetric(vertical: 8),
                          decoration: BoxDecoration(
                            color: _urgency == u ? _getUrgencyColor(u).withValues(alpha: 0.1) : Colors.transparent,
                            border: Border.all(color: _urgency == u ? _getUrgencyColor(u) : Colors.grey.withValues(alpha: 0.5), width: 2),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          alignment: Alignment.center,
                          child: Text(u.toUpperCase(), style: GoogleFonts.spaceMono(fontSize: 10, fontWeight: FontWeight.bold, color: _getUrgencyColor(u))),
                        ),
                      ),
                    )).toList(),
                  ),
                  const SizedBox(height: 16),
                  Text('ISSUE DESCRIPTION', style: GoogleFonts.spaceMono(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.grey)),
                  const SizedBox(height: 4),
                  TextField(
                    controller: _messageController,
                    maxLines: 4,
                    decoration: InputDecoration(
                      hintText: 'Tell us what\'s wrong...',
                      filled: true,
                      fillColor: isDark ? const Color(0xFF0F172A) : Colors.white,
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: const BorderSide(color: AppColors.brutalBlack, width: 2)),
                      enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: const BorderSide(color: AppColors.brutalBlack, width: 2)),
                    ),
                  ),
                  const SizedBox(height: 24),
                  ComicCard(
                    onTap: _isSubmitting ? null : _submitTicket,
                    backgroundColor: AppColors.senseiYellow,
                    child: Center(
                      child: _isSubmitting
                          ? const CircularProgressIndicator(color: Colors.black)
                          : Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                const Icon(Icons.send, size: 18),
                                const SizedBox(width: 8),
                                Text('SUBMIT TICKET', style: GoogleFonts.fredoka(fontWeight: FontWeight.bold, fontSize: 16)),
                              ],
                            ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 32),
            Text('Ticket History', style: GoogleFonts.fredoka(fontSize: 24, fontWeight: FontWeight.bold)),
            const SizedBox(height: 16),
            if (_isLoading)
              const Center(child: CircularProgressIndicator())
            else if (_tickets.isEmpty)
              Center(
                child: Padding(
                  padding: const EdgeInsets.symmetric(vertical: 48),
                  child: Column(
                    children: [
                      const Icon(Icons.help_outline, size: 48, color: Colors.grey),
                      const SizedBox(height: 16),
                      Text('You haven\'t raised any tickets yet.', style: GoogleFonts.fredoka(color: Colors.grey)),
                    ],
                  ),
                ),
              )
            else
              ..._tickets.map((t) {
                final isResponded = t['status'] == 'responded' || t['status'] == 'resolved';
                return Padding(
                  padding: const EdgeInsets.only(bottom: 16),
                  child: BrutalistCard(
                    backgroundColor: isDark ? const Color(0xFF1E293B) : Colors.white,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Row(
                              children: [
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 2),
                                  decoration: BoxDecoration(color: _getUrgencyColor(t['urgency'] ?? 'medium').withValues(alpha: 0.1), borderRadius: BorderRadius.circular(4)),
                                  child: Text((t['urgency'] ?? 'medium').toString().toUpperCase(), style: GoogleFonts.spaceMono(fontSize: 10, fontWeight: FontWeight.bold, color: _getUrgencyColor(t['urgency'] ?? 'medium'))),
                                ),
                                const SizedBox(width: 8),
                                Text((t['category'] ?? 'Support').toString().toUpperCase(), style: GoogleFonts.spaceMono(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.grey)),
                              ],
                            ),
                            Row(
                              children: [
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                  decoration: BoxDecoration(color: isResponded ? AppColors.senseiGreen.withValues(alpha: 0.2) : AppColors.senseiYellow.withValues(alpha: 0.2), borderRadius: BorderRadius.circular(16)),
                                  child: Row(
                                    children: [
                                      Icon(isResponded ? Icons.check_circle : Icons.access_time, size: 12, color: isResponded ? Colors.green : Colors.orange),
                                      const SizedBox(width: 4),
                                      Text((t['status'] ?? 'pending').toString().toUpperCase(), style: GoogleFonts.spaceMono(fontSize: 10, fontWeight: FontWeight.bold, color: isResponded ? Colors.green : Colors.orange)),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                        if (t['assignedTo'] != null && t['assignedTo'] is Map && t['assignedTo']['name'] != null) ...[
                          const SizedBox(height: 8),
                          Row(
                            children: [
                              Icon(Icons.assignment_ind_outlined, size: 14, color: isDark ? Colors.grey : Colors.grey.shade600),
                              const SizedBox(width: 4),
                              Text(
                                'ASSIGNED TO: ${t['assignedTo']['name']}'.toUpperCase(),
                                style: GoogleFonts.spaceMono(fontSize: 10, fontWeight: FontWeight.bold, color: isDark ? Colors.grey : Colors.grey.shade600),
                              ),
                            ],
                          ),
                        ],
                        const SizedBox(height: 16),
                        Text(t['message'] ?? '', style: GoogleFonts.fredoka(fontSize: 16)),
                        if (t['response'] != null) ...[
                          const SizedBox(height: 16),
                          Container(
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              color: isDark ? const Color(0xFF0F172A) : Colors.blue.shade50,
                              border: Border.all(color: Colors.blue.shade200),
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                  decoration: BoxDecoration(color: Colors.blue, borderRadius: BorderRadius.circular(12)),
                                  child: Text('RESPONSE', style: GoogleFonts.spaceMono(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.white)),
                                ),
                                const SizedBox(height: 8),
                                Text(t['response'], style: GoogleFonts.fredoka(fontSize: 14, color: isDark ? Colors.white : Colors.blue.shade900)),
                              ],
                            ),
                          ),
                        ],
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
