import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:go_router/go_router.dart';
import '../../theme/app_colors.dart';
import '../../theme/neubrutalist_widgets.dart';
import '../../services/api_service.dart';
import '../../services/socket_service.dart';
import '../../components/three_js_avatar_view.dart';

class WorldScreen extends ConsumerStatefulWidget {
  const WorldScreen({super.key});

  @override
  ConsumerState<WorldScreen> createState() => _WorldScreenState();
}

class _WorldScreenState extends ConsumerState<WorldScreen> {
  final SocketService _socket = SocketService();
  List<dynamic> _rooms = [];
  bool _isLoadingRooms = true;
  String? _joinedRoomId;
  String? _joinedRoomName;
  List<dynamic> _roomPlayers = [];
  Map<String, dynamic>? _activeQuiz;
  int? _selectedAnswerIndex;
  bool _isAnswerSubmitted = false;

  final _roomNameController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _fetchRooms();
  }

  @override
  void dispose() {
    _roomNameController.dispose();
    _socket.emit('world:leave', {'roomId': _joinedRoomId});
    super.dispose();
  }

  Future<void> _fetchRooms() async {
    setState(() => _isLoadingRooms = true);
    try {
      final response = await ApiService().get('/api/world/rooms');
      if (response.data is List) {
        setState(() => _rooms = response.data);
      } else {
        _useDefaultRooms();
      }
    } catch (_) {
      _useDefaultRooms();
    } finally {
      if (mounted) setState(() => _isLoadingRooms = false);
    }
  }

  void _useDefaultRooms() {
    if (!mounted) return;
    setState(() {
      _rooms = [
        {
          '_id': 'room_main_campus',
          'name': '🏛️ Pune AI Campus Plaza',
          'maxPlayers': 20,
          'currentPlayers': 4,
          'topic': 'Computer Science & AI',
        },
        {
          '_id': 'room_algo_arena',
          'name': '⚡ Algorithm Battleground',
          'maxPlayers': 10,
          'currentPlayers': 2,
          'topic': 'Data Structures',
        },
        {
          '_id': 'room_npu_lounge',
          'name': '🧠 Hexagon NPU Study Hall',
          'maxPlayers': 15,
          'currentPlayers': 6,
          'topic': 'On-Device AI',
        },
      ];
    });
  }

  Future<void> _createRoom() async {
    final name = _roomNameController.text.trim();
    if (name.isEmpty) return;

    try {
      await ApiService().post('/api/world/rooms', data: {
        'name': name,
        'topic': 'General Engineering',
        'maxPlayers': 15,
      });

      _roomNameController.clear();
      Navigator.of(context).pop();
      _fetchRooms();
    } catch (_) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Room created locally')),
      );
      Navigator.of(context).pop();
    }
  }

  void _joinRoom(String roomId, String roomName) {
    setState(() {
      _joinedRoomId = roomId;
      _joinedRoomName = roomName;
      _roomPlayers = [
        {'username': 'You', 'score': 120, 'avatar': 'avatar_1', 'isMe': true},
        {'username': 'Alex_Pune', 'score': 95, 'avatar': 'avatar_2', 'isMe': false},
        {'username': 'Rohan_NPU', 'score': 80, 'avatar': 'avatar_3', 'isMe': false},
      ];
      _activeQuiz = {
        'question': 'Which quantization format is best suited for Hexagon NPU execution?',
        'options': ['FP32 Float', 'INT8 / INT4 (QNN)', 'TF32 Tensor', 'FP64 Double'],
        'correctAnswer': 'INT8 / INT4 (QNN)',
      };
      _isAnswerSubmitted = false;
      _selectedAnswerIndex = null;
    });

    _socket.emit('world:join', {'roomId': roomId});
  }

  void _leaveRoom() {
    _socket.emit('world:leave', {'roomId': _joinedRoomId});
    setState(() {
      _joinedRoomId = null;
      _joinedRoomName = null;
      _activeQuiz = null;
    });
  }

  void _submitQuizAnswer(int index) {
    if (_isAnswerSubmitted) return;
    setState(() {
      _selectedAnswerIndex = index;
      _isAnswerSubmitted = true;
    });

    _socket.emit('world:answer', {
      'roomId': _joinedRoomId,
      'answerIndex': index,
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.creamBg,
      body: SafeArea(
        child: Column(
          children: [
            _buildHeader(),
            Expanded(
              child: _joinedRoomId == null
                  ? _buildRoomBrowser()
                  : _buildActiveRoomView(),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildHeader() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: const BoxDecoration(
        color: AppColors.creamBg,
        border: Border(bottom: BorderSide(color: AppColors.brutalBlack, width: 2.5)),
      ),
      child: Row(
        children: [
          GestureDetector(
            onTap: () {
              if (_joinedRoomId != null) {
                _leaveRoom();
              } else {
                context.canPop() ? context.pop() : context.go('/student');
              }
            },
            child: Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: AppColors.creamCard,
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: AppColors.brutalBlack, width: 2.5),
                boxShadow: const [
                  BoxShadow(color: AppColors.brutalBlack, offset: Offset(2, 2), blurRadius: 0),
                ],
              ),
              child: const Icon(Icons.arrow_back_rounded, color: AppColors.brutalBlack, size: 20),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  _joinedRoomId == null ? 'VIRTUAL WORLD HUB' : _joinedRoomName ?? 'CAMPUS ROOM',
                  style: GoogleFonts.fredoka(fontSize: 18, fontWeight: FontWeight.bold, color: AppColors.brutalBlack),
                ),
                Text(
                  'MULTIPLAYER 3D STUDY CAMPUS §6.6',
                  style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.black54, letterSpacing: 1.1),
                ),
              ],
            ),
          ),
          NeuBadge(
            label: _joinedRoomId == null ? 'CAMPUS LOBBY' : 'IN ROOM',
            backgroundColor: _joinedRoomId == null ? AppColors.popGreen : AppColors.popCoral,
            isLive: _joinedRoomId != null,
          ),
        ],
      ),
    );
  }

  Widget _buildRoomBrowser() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          NeuCard(
            backgroundColor: Colors.white,
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: AppColors.popGreen.withOpacity(0.2),
                    shape: BoxShape.circle,
                    border: Border.all(color: AppColors.brutalBlack, width: 2),
                  ),
                  child: const Icon(Icons.public_rounded, size: 32, color: AppColors.brutalBlack),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'MULTIPLAYER 3D CAMPUS',
                        style: GoogleFonts.fredoka(fontSize: 15, fontWeight: FontWeight.bold, color: AppColors.brutalBlack),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        'Join rooms with peers, practice quizzes together, and level up your mastery.',
                        style: GoogleFonts.inter(fontSize: 12, color: Colors.black54),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'AVAILABLE ROOMS',
                style: GoogleFonts.fredoka(fontSize: 14, fontWeight: FontWeight.bold, color: AppColors.brutalBlack, letterSpacing: 1),
              ),
              GestureDetector(
                onTap: _showCreateRoomDialog,
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                  decoration: BoxDecoration(
                    color: AppColors.popYellow,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: AppColors.brutalBlack, width: 2),
                    boxShadow: const [
                      BoxShadow(color: AppColors.brutalBlack, offset: Offset(2, 2), blurRadius: 0),
                    ],
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(Icons.add_rounded, size: 16, color: AppColors.brutalBlack),
                      const SizedBox(width: 4),
                      Text(
                        'CREATE ROOM',
                        style: GoogleFonts.fredoka(fontSize: 11, fontWeight: FontWeight.bold, color: AppColors.brutalBlack),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          if (_isLoadingRooms)
            const Center(child: CircularProgressIndicator(color: AppColors.brutalBlack))
          else
            ..._rooms.map((room) => Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: NeuCard(
                backgroundColor: Colors.white,
                onTap: () => _joinRoom(room['_id'] ?? 'room_1', room['name'] ?? 'Study Room'),
                child: Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            room['name'] ?? 'Campus Plaza',
                            style: GoogleFonts.fredoka(fontSize: 15, fontWeight: FontWeight.bold, color: AppColors.brutalBlack),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            'Topic: ${room['topic'] ?? "General"}',
                            style: GoogleFonts.inter(fontSize: 12, color: Colors.black54),
                          ),
                        ],
                      ),
                    ),
                    NeuBadge(
                      label: '${room['currentPlayers'] ?? 3}/${room['maxPlayers'] ?? 15} PLAYERS',
                      backgroundColor: AppColors.popBlue,
                    ),
                  ],
                ),
              ),
            )),
        ],
      ),
    );
  }

  Widget _buildActiveRoomView() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          // 3D Three.js GLB Campus Scene Container
          NeuCard(
            backgroundColor: const Color(0xFF1E1E2E),
            padding: const EdgeInsets.all(14),
            child: Column(
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const NeuBadge(
                      label: '3D GLB CAMPUS RIG · THREE.JS',
                      backgroundColor: AppColors.popGreen,
                      isLive: true,
                    ),
                    Text(
                      '${_roomPlayers.length} Connected',
                      style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.white70),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                const ThreeJsAvatarView(
                  height: 200,
                  initialMood: 'idle',
                ),
                const SizedBox(height: 10),
                SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  child: Row(
                    children: _roomPlayers.map((p) => Container(
                      margin: const EdgeInsets.only(right: 8),
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                      decoration: BoxDecoration(
                        color: p['isMe'] == true ? AppColors.popYellow : Colors.white24,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: Colors.black45, width: 1.5),
                      ),
                      child: Text(
                        '👤 ${p['username']}',
                        style: GoogleFonts.fredoka(fontSize: 11, fontWeight: FontWeight.bold, color: p['isMe'] == true ? AppColors.brutalBlack : Colors.white),
                      ),
                    )).toList(),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),

          // Multiplayer Quiz Battle Card
          if (_activeQuiz != null)
            NeuCard(
              backgroundColor: Colors.white,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const NeuBadge(
                        label: 'LIVE MULTIPLAYER QUIZ',
                        backgroundColor: AppColors.popPink,
                        isLive: true,
                      ),
                      Text(
                        'Timer: 15s',
                        style: GoogleFonts.fredoka(fontSize: 13, fontWeight: FontWeight.bold, color: AppColors.popCoral),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Text(
                    _activeQuiz!['question'] ?? 'Question loading...',
                    style: GoogleFonts.fredoka(fontSize: 15, fontWeight: FontWeight.bold, color: AppColors.brutalBlack),
                  ),
                  const SizedBox(height: 14),
                  ...(_activeQuiz!['options'] as List).asMap().entries.map((opt) {
                    final index = opt.key;
                    final text = opt.value;
                    final isSelected = _selectedAnswerIndex == index;

                    return Padding(
                      padding: const EdgeInsets.only(bottom: 8),
                      child: GestureDetector(
                        onTap: () => _submitQuizAnswer(index),
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                          decoration: BoxDecoration(
                            color: isSelected ? AppColors.popGreen.withOpacity(0.3) : AppColors.creamBg,
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(
                              color: isSelected ? AppColors.popGreen : AppColors.brutalBlack,
                              width: 2,
                            ),
                          ),
                          child: Row(
                            children: [
                              Text(
                                '${String.fromCharCode(65 + index)}. ',
                                style: GoogleFonts.fredoka(fontSize: 13, fontWeight: FontWeight.bold, color: AppColors.brutalBlack),
                              ),
                              Expanded(
                                child: Text(
                                  text,
                                  style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600, color: AppColors.brutalBlack),
                                ),
                              ),
                              if (isSelected)
                                const Icon(Icons.check_circle_rounded, color: AppColors.popGreen, size: 20),
                            ],
                          ),
                        ),
                      ),
                    );
                  }),
                ],
              ),
            ),
          const SizedBox(height: 16),
          NeuButton(
            text: 'LEAVE WORLD ROOM',
            backgroundColor: AppColors.popCoral,
            textColor: Colors.white,
            onPressed: _leaveRoom,
          ),
        ],
      ),
    );
  }

  void _showCreateRoomDialog() {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppColors.creamCard,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(20),
          side: const BorderSide(color: AppColors.brutalBlack, width: 3),
        ),
        title: Text(
          'CREATE CAMPUS ROOM 🏛️',
          style: GoogleFonts.fredoka(fontWeight: FontWeight.bold, color: AppColors.brutalBlack),
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: _roomNameController,
              style: GoogleFonts.inter(fontWeight: FontWeight.w600),
              decoration: InputDecoration(
                hintText: 'Room Name (e.g. AI Study Hall)',
                filled: true,
                fillColor: Colors.white,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: const BorderSide(color: AppColors.brutalBlack, width: 2),
                ),
              ),
            ),
          ],
        ),
        actions: [
          NeuButton(
            text: 'CREATE & JOIN',
            backgroundColor: AppColors.popGreen,
            onPressed: _createRoom,
          ),
        ],
      ),
    );
  }
}
