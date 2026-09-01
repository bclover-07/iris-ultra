import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter/foundation.dart';
import '../services/on_device_llm_service.dart';
import '../services/npu_event_service.dart';

class ChatMessage {
  final String text;
  final bool isUser;
  final DateTime timestamp;
  final String? modelEngine;

  ChatMessage({
    required this.text,
    required this.isUser,
    DateTime? timestamp,
    this.modelEngine,
  }) : timestamp = timestamp ?? DateTime.now();
}

class MentorState {
  final List<ChatMessage> messages;
  final bool isLoading;
  final bool isOfflineMode;
  final bool isListening;

  const MentorState({
    this.messages = const [],
    this.isLoading = false,
    this.isOfflineMode = true,
    this.isListening = false,
  });

  MentorState copyWith({
    List<ChatMessage>? messages,
    bool? isLoading,
    bool? isOfflineMode,
    bool? isListening,
  }) {
    return MentorState(
      messages: messages ?? this.messages,
      isLoading: isLoading ?? this.isLoading,
      isOfflineMode: isOfflineMode ?? this.isOfflineMode,
      isListening: isListening ?? this.isListening,
    );
  }
}

class MentorNotifier extends StateNotifier<MentorState> {
  final OnDeviceLlmService _llm = OnDeviceLlmService();

  MentorNotifier() : super(const MentorState());

  Future<void> initialize() async {
    if (!_llm.isInitialized) {
      await _llm.initialize();
    }
  }

  Future<void> sendMessage(String text) async {
    if (text.trim().isEmpty) return;

    final userMsg = ChatMessage(text: text, isUser: true);
    state = state.copyWith(
      messages: [...state.messages, userMsg],
      isLoading: true,
    );

    try {
      final response = await _llm.generateText(
        text,
        systemPrompt: 'You are SENSEI, an on-device AI study mentor running on Hexagon NPU. '
            'Provide personalized study guidance based on verified signals.',
      );

      final aiMsg = ChatMessage(
        text: response,
        isUser: false,
        modelEngine: '${_llm.modelName} · ${_llm.runtime} · ${_llm.currentBackend.name.toUpperCase()}',
      );

      state = state.copyWith(
        messages: [...state.messages, aiMsg],
        isLoading: false,
      );
    } catch (e) {
      final errorMsg = ChatMessage(
        text: 'I encountered an issue processing your request. Please try again.',
        isUser: false,
        modelEngine: 'Error',
      );
      state = state.copyWith(
        messages: [...state.messages, errorMsg],
        isLoading: false,
      );
    }
  }

  void toggleOfflineMode() {
    state = state.copyWith(isOfflineMode: !state.isOfflineMode);
  }

  void setListening(bool listening) {
    state = state.copyWith(isListening: listening);
  }
}

final mentorProvider = StateNotifierProvider<MentorNotifier, MentorState>((ref) {
  return MentorNotifier();
});
