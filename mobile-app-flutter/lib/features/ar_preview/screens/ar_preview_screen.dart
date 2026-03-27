// AR Preview Screen - شاشة معاينة الواقع المعزز
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../services/ar_service.dart';
import '../../../core/theme/app_colors.dart';

class ARPreviewScreen extends ConsumerStatefulWidget {
  final String productId;
  final String productName;
  final String? modelUrl;

  const ARPreviewScreen({
    super.key,
    required this.productId,
    required this.productName,
    this.modelUrl,
  });

  @override
  ConsumerState<ARPreviewScreen> createState() => _ARPreviewScreenState();
}

class _ARPreviewScreenState extends ConsumerState<ARPreviewScreen> {
  final ARService _arService = ARService();
  
  bool _isLoading = true;
  bool _isARActive = false;
  double _scale = 1.0;
  double _rotation = 0.0;
  String? _sessionId;
  int _interactionCount = 0;
  DateTime? _sessionStart;

  @override
  void initState() {
    super.initState();
    _loadModel();
  }

  Future<void> _loadModel() async {
    setState(() => _isLoading = true);
    try {
      // Start AR session
      final session = await _arService.startSession(
        productId: widget.productId,
        userId: 'current_user',
        deviceType: 'android', // or ios
      );
      _sessionId = session['sessionId'];
      _sessionStart = DateTime.now();
      
      // Simulate model loading
      await Future.delayed(const Duration(seconds: 2));
      
      setState(() {
        _isLoading = false;
        _isARActive = true;
      });
    } catch (e) {
      setState(() => _isLoading = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('خطأ في تحميل النموذج: $e')),
        );
      }
    }
  }

  void _onInteraction() {
    _interactionCount++;
  }

  Future<void> _takeScreenshot() async {
    _onInteraction();
    // Simulate screenshot
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('تم حفظ الصورة! 📸'),
        backgroundColor: Colors.green,
      ),
    );
  }

  Future<void> _shareAR() async {
    _onInteraction();
    // Share functionality
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('جاري المشاركة...')),
    );
  }

  @override
  void dispose() {
    // End session with analytics
    if (_sessionId != null && _sessionStart != null) {
      final duration = DateTime.now().difference(_sessionStart!).inSeconds;
      _arService.endSession(
        sessionId: _sessionId!,
        duration: duration,
        interactions: _interactionCount,
      );
    }
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      body: Stack(
        children: [
          // AR Camera View (Simulated)
          if (_isARActive)
            GestureDetector(
              onScaleUpdate: (details) {
                _onInteraction();
                setState(() {
                  _scale = (_scale * details.scale).clamp(0.5, 3.0);
                });
              },
              onPanUpdate: (details) {
                _onInteraction();
                setState(() {
                  _rotation += details.delta.dx * 0.5;
                });
              },
              child: Container(
                width: double.infinity,
                height: double.infinity,
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                    colors: [
                      Colors.grey[800]!,
                      Colors.grey[900]!,
                    ],
                  ),
                ),
                child: Center(
                  child: Transform.scale(
                    scale: _scale,
                    child: Transform.rotate(
                      angle: _rotation * 0.0174533, // degrees to radians
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          // 3D Model Placeholder
                          Container(
                            width: 200,
                            height: 200,
                            decoration: BoxDecoration(
                              color: AppColors.primary.withOpacity(0.3),
                              borderRadius: BorderRadius.circular(20),
                              border: Border.all(
                                color: AppColors.primary,
                                width: 2,
                              ),
                              boxShadow: [
                                BoxShadow(
                                  color: AppColors.primary.withOpacity(0.5),
                                  blurRadius: 20,
                                  spreadRadius: 5,
                                ),
                              ],
                            ),
                            child: const Center(
                              child: Text(
                                '📦\n3D Model',
                                textAlign: TextAlign.center,
                                style: TextStyle(
                                  color: Colors.white,
                                  fontSize: 24,
                                ),
                              ),
                            ),
                          ),
                          const SizedBox(height: 16),
                          Text(
                            widget.productName,
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ),
            ),

          // Loading Overlay
          if (_isLoading)
            Container(
              color: Colors.black,
              child: const Center(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    CircularProgressIndicator(color: Colors.white),
                    SizedBox(height: 16),
                    Text(
                      'جاري تحميل النموذج ثلاثي الأبعاد...',
                      style: TextStyle(color: Colors.white),
                    ),
                  ],
                ),
              ),
            ),

          // Top Bar
          SafeArea(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  IconButton(
                    onPressed: () => Navigator.pop(context),
                    icon: const Icon(Icons.close, color: Colors.white, size: 28),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    decoration: BoxDecoration(
                      color: Colors.black54,
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: const Row(
                      children: [
                        Icon(Icons.view_in_ar, color: Colors.white, size: 20),
                        SizedBox(width: 8),
                        Text('AR', style: TextStyle(color: Colors.white)),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),

          // Bottom Controls
          Positioned(
            bottom: 0,
            left: 0,
            right: 0,
            child: Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.bottomCenter,
                  end: Alignment.topCenter,
                  colors: [
                    Colors.black.withOpacity(0.8),
                    Colors.transparent,
                  ],
                ),
              ),
              child: SafeArea(
                child: Column(
                  children: [
                    // Scale Slider
                    Row(
                      children: [
                        const Icon(Icons.zoom_out, color: Colors.white),
                        Expanded(
                          child: Slider(
                            value: _scale,
                            min: 0.5,
                            max: 3.0,
                            activeColor: AppColors.primary,
                            onChanged: (value) {
                              _onInteraction();
                              setState(() => _scale = value);
                            },
                          ),
                        ),
                        const Icon(Icons.zoom_in, color: Colors.white),
                      ],
                    ),
                    const SizedBox(height: 16),
                    // Action Buttons
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                      children: [
                        _buildActionButton(
                          icon: Icons.camera_alt,
                          label: 'صورة',
                          onTap: _takeScreenshot,
                        ),
                        _buildActionButton(
                          icon: Icons.share,
                          label: 'مشاركة',
                          onTap: _shareAR,
                        ),
                        _buildActionButton(
                          icon: Icons.shopping_cart,
                          label: 'شراء',
                          onTap: () {
                            Navigator.pop(context, 'add_to_cart');
                          },
                          isPrimary: true,
                        ),
                        _buildActionButton(
                          icon: Icons.refresh,
                          label: 'إعادة',
                          onTap: () {
                            _onInteraction();
                            setState(() {
                              _scale = 1.0;
                              _rotation = 0.0;
                            });
                          },
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          ),

          // Instructions
          if (_isARActive && _interactionCount == 0)
            Positioned(
              top: MediaQuery.of(context).size.height * 0.3,
              left: 0,
              right: 0,
              child: Container(
                margin: const EdgeInsets.symmetric(horizontal: 40),
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.black54,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Column(
                  children: [
                    Text(
                      '👆 اسحب للتدوير',
                      style: TextStyle(color: Colors.white),
                    ),
                    SizedBox(height: 8),
                    Text(
                      '🤏 قرّب أو بعّد للتكبير',
                      style: TextStyle(color: Colors.white),
                    ),
                  ],
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildActionButton({
    required IconData icon,
    required String label,
    required VoidCallback onTap,
    bool isPrimary = false,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 56,
            height: 56,
            decoration: BoxDecoration(
              color: isPrimary ? AppColors.primary : Colors.white24,
              shape: BoxShape.circle,
            ),
            child: Icon(icon, color: Colors.white),
          ),
          const SizedBox(height: 8),
          Text(
            label,
            style: const TextStyle(color: Colors.white, fontSize: 12),
          ),
        ],
      ),
    );
  }
}
