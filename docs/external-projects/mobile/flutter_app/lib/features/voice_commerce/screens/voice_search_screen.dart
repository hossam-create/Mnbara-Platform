// Voice Search Screen - شاشة البحث الصوتي
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'dart:async';
import '../services/voice_service.dart';
import '../../../core/theme/app_colors.dart';

class VoiceSearchScreen extends ConsumerStatefulWidget {
  const VoiceSearchScreen({super.key});

  @override
  ConsumerState<VoiceSearchScreen> createState() => _VoiceSearchScreenState();
}

class _VoiceSearchScreenState extends ConsumerState<VoiceSearchScreen>
    with SingleTickerProviderStateMixin {
  final VoiceService _voiceService = VoiceService();
  late AnimationController _animationController;
  
  bool _isListening = false;
  String _transcribedText = '';
  String _responseText = '';
  List<Map<String, dynamic>> _searchResults = [];
  String? _sessionId;

  @override
  void initState() {
    super.initState();
    _animationController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1000),
    )..repeat(reverse: true);
    _initSession();
  }

  Future<void> _initSession() async {
    try {
      final result = await _voiceService.startSession(userId: 'current_user');
      setState(() => _sessionId = result['sessionId']);
    } catch (e) {
      debugPrint('Error starting session: $e');
    }
  }

  @override
  void dispose() {
    _animationController.dispose();
    if (_sessionId != null) {
      _voiceService.endSession(_sessionId!);
    }
    super.dispose();
  }

  void _toggleListening() {
    setState(() {
      _isListening = !_isListening;
      if (_isListening) {
        _startListening();
      } else {
        _stopListening();
      }
    });
  }

  Future<void> _startListening() async {
    // Simulate voice recognition
    await Future.delayed(const Duration(seconds: 2));
    if (mounted && _isListening) {
      setState(() {
        _transcribedText = 'أريد شراء هاتف آيفون';
        _isListening = false;
      });
      _processVoiceCommand();
    }
  }

  void _stopListening() {
    // Stop recording
  }

  Future<void> _processVoiceCommand() async {
    if (_transcribedText.isEmpty) return;
    
    setState(() => _responseText = 'جاري البحث...');
    
    // Simulate API response
    await Future.delayed(const Duration(seconds: 1));
    
    setState(() {
      _responseText = 'وجدت لك 15 نتيجة لهواتف آيفون';
      _searchResults = [
        {'name': 'iPhone 15 Pro Max', 'price': 4999, 'image': '📱'},
        {'name': 'iPhone 15 Pro', 'price': 4499, 'image': '📱'},
        {'name': 'iPhone 15', 'price': 3499, 'image': '📱'},
        {'name': 'iPhone 14 Pro', 'price': 3999, 'image': '📱'},
      ];
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('البحث الصوتي'),
        centerTitle: true,
        backgroundColor: Colors.transparent,
        elevation: 0,
      ),
      body: Column(
        children: [
          // Voice Animation Area
          Expanded(
            flex: 2,
            child: Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  // Mic Button with Animation
                  GestureDetector(
                    onTap: _toggleListening,
                    child: AnimatedBuilder(
                      animation: _animationController,
                      builder: (context, child) {
                        return Container(
                          width: 120 + (_isListening ? _animationController.value * 30 : 0),
                          height: 120 + (_isListening ? _animationController.value * 30 : 0),
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            color: _isListening ? AppColors.primary : AppColors.primary.withOpacity(0.8),
                            boxShadow: [
                              BoxShadow(
                                color: AppColors.primary.withOpacity(_isListening ? 0.5 : 0.3),
                                blurRadius: _isListening ? 30 : 15,
                                spreadRadius: _isListening ? 10 : 5,
                              ),
                            ],
                          ),
                          child: Icon(
                            _isListening ? Icons.mic : Icons.mic_none,
                            size: 50,
                            color: Colors.white,
                          ),
                        );
                      },
                    ),
                  ),
                  const SizedBox(height: 24),
                  Text(
                    _isListening ? 'جاري الاستماع...' : 'اضغط للتحدث',
                    style: TextStyle(
                      fontSize: 18,
                      color: _isListening ? AppColors.primary : Colors.grey,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                  if (_transcribedText.isNotEmpty) ...[
                    const SizedBox(height: 16),
                    Container(
                      padding: const EdgeInsets.all(16),
                      margin: const EdgeInsets.symmetric(horizontal: 24),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(12),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withOpacity(0.05),
                            blurRadius: 10,
                          ),
                        ],
                      ),
                      child: Text(
                        '"$_transcribedText"',
                        style: const TextStyle(fontSize: 16),
                        textAlign: TextAlign.center,
                      ),
                    ),
                  ],
                  if (_responseText.isNotEmpty) ...[
                    const SizedBox(height: 12),
                    Text(
                      _responseText,
                      style: TextStyle(
                        fontSize: 14,
                        color: AppColors.primary,
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ),
          // Search Results
          if (_searchResults.isNotEmpty)
            Expanded(
              flex: 3,
              child: Container(
                decoration: const BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
                ),
                child: Column(
                  children: [
                    const Padding(
                      padding: EdgeInsets.all(16),
                      child: Text(
                        'نتائج البحث',
                        style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                      ),
                    ),
                    Expanded(
                      child: ListView.builder(
                        padding: const EdgeInsets.symmetric(horizontal: 16),
                        itemCount: _searchResults.length,
                        itemBuilder: (context, index) {
                          final product = _searchResults[index];
                          return Card(
                            margin: const EdgeInsets.only(bottom: 12),
                            child: ListTile(
                              leading: Text(product['image'], style: const TextStyle(fontSize: 32)),
                              title: Text(product['name']),
                              subtitle: Text('${product['price']} ر.س'),
                              trailing: ElevatedButton(
                                onPressed: () {},
                                child: const Text('عرض'),
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
        ],
      ),
      // Quick Actions
      bottomNavigationBar: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceEvenly,
            children: [
              _buildQuickAction(Icons.search, 'بحث'),
              _buildQuickAction(Icons.shopping_cart, 'سلة'),
              _buildQuickAction(Icons.history, 'السجل'),
              _buildQuickAction(Icons.help_outline, 'مساعدة'),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildQuickAction(IconData icon, String label) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        IconButton(
          onPressed: () {},
          icon: Icon(icon, color: AppColors.primary),
        ),
        Text(label, style: const TextStyle(fontSize: 12)),
      ],
    );
  }
}
