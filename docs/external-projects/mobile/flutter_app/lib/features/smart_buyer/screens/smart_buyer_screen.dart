import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:camera/camera.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/l10n/app_localizations.dart';
import '../services/smart_buyer_service.dart';
import '../providers/smart_buyer_provider.dart';
import '../widgets/recognized_product_card.dart';
import '../widgets/voice_indicator.dart';

class SmartBuyerScreen extends ConsumerStatefulWidget {
  const SmartBuyerScreen({super.key});

  @override
  ConsumerState<SmartBuyerScreen> createState() => _SmartBuyerScreenState();
}

class _SmartBuyerScreenState extends ConsumerState<SmartBuyerScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  CameraController? _cameraController;
  bool _isInitialized = false;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _initializeCamera();
  }

  Future<void> _initializeCamera() async {
    final service = ref.read(smartBuyerServiceProvider);
    _cameraController = await service.startCamera();
    if (mounted) {
      setState(() => _isInitialized = true);
    }
  }

  @override
  void dispose() {
    _tabController.dispose();
    ref.read(smartBuyerServiceProvider).stopCamera();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final state = ref.watch(smartBuyerProvider);

    return Scaffold(
      appBar: AppBar(
        title: Text(l10n.translate('smart_buyer')),
        bottom: TabBar(
          controller: _tabController,
          tabs: [
            Tab(
              icon: const Icon(Icons.camera_alt),
              text: l10n.translate('camera_search'),
            ),
            Tab(
              icon: const Icon(Icons.mic),
              text: l10n.translate('voice_search'),
            ),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          _buildCameraTab(l10n, state),
          _buildVoiceTab(l10n, state),
        ],
      ),
    );
  }

  Widget _buildCameraTab(AppLocalizations l10n, SmartBuyerState state) {
    return Column(
      children: [
        // Camera Preview
        Expanded(
          flex: 2,
          child: _isInitialized && _cameraController != null
              ? Stack(
                  children: [
                    CameraPreview(_cameraController!),
                    // Overlay with scan area
                    Center(
                      child: Container(
                        width: 250,
                        height: 250,
                        decoration: BoxDecoration(
                          border: Border.all(
                            color: AppColors.primary.withOpacity(0.8),
                            width: 2,
                          ),
                          borderRadius: BorderRadius.circular(16),
                        ),
                      ),
                    ),
                    // Instructions
                    Positioned(
                      bottom: 20,
                      left: 0,
                      right: 0,
                      child: Text(
                        l10n.translate('point_camera_at_product'),
                        textAlign: TextAlign.center,
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 14,
                          shadows: [
                            Shadow(blurRadius: 4, color: Colors.black),
                          ],
                        ),
                      ),
                    ),
                  ],
                )
              : const Center(child: CircularProgressIndicator()),
        ),
        
        // Capture Button
        Padding(
          padding: const EdgeInsets.all(16),
          child: ElevatedButton.icon(
            onPressed: state.isAnalyzing ? null : _captureAndAnalyze,
            icon: state.isAnalyzing
                ? const SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                : const Icon(Icons.search),
            label: Text(
              state.isAnalyzing
                  ? l10n.translate('analyzing')
                  : l10n.translate('scan_product'),
            ),
            style: ElevatedButton.styleFrom(
              minimumSize: const Size(double.infinity, 50),
            ),
          ),
        ),
        
        // Results
        if (state.recognizedProducts.isNotEmpty)
          Expanded(
            flex: 1,
            child: _buildResultsList(state.recognizedProducts),
          ),
      ],
    );
  }

  Widget _buildVoiceTab(AppLocalizations l10n, SmartBuyerState state) {
    return Column(
      children: [
        const SizedBox(height: 40),
        
        // Voice Indicator
        VoiceIndicator(isListening: state.isListening),
        
        const SizedBox(height: 24),
        
        // Instructions
        Text(
          state.isListening
              ? l10n.translate('listening')
              : l10n.translate('tap_to_speak'),
          style: Theme.of(context).textTheme.titleMedium,
        ),
        
        const SizedBox(height: 8),
        
        Text(
          l10n.translate('voice_search_hint'),
          style: Theme.of(context).textTheme.bodySmall?.copyWith(
                color: AppColors.textSecondary,
              ),
          textAlign: TextAlign.center,
        ),
        
        const SizedBox(height: 32),
        
        // Voice Button
        GestureDetector(
          onTapDown: (_) => _startListening(),
          onTapUp: (_) => _stopListening(),
          onTapCancel: () => _stopListening(),
          child: Container(
            width: 100,
            height: 100,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: state.isListening ? AppColors.primary : Colors.grey[200],
              boxShadow: [
                BoxShadow(
                  color: state.isListening
                      ? AppColors.primary.withOpacity(0.4)
                      : Colors.black12,
                  blurRadius: 20,
                  spreadRadius: state.isListening ? 5 : 0,
                ),
              ],
            ),
            child: Icon(
              Icons.mic,
              size: 48,
              color: state.isListening ? Colors.white : AppColors.textSecondary,
            ),
          ),
        ),
        
        // Last Query
        if (state.lastVoiceQuery != null) ...[
          const SizedBox(height: 24),
          Container(
            margin: const EdgeInsets.symmetric(horizontal: 32),
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.grey[100],
              borderRadius: BorderRadius.circular(12),
            ),
            child: Row(
              children: [
                const Icon(Icons.format_quote, color: AppColors.textSecondary),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    state.lastVoiceQuery!,
                    style: const TextStyle(fontStyle: FontStyle.italic),
                  ),
                ),
              ],
            ),
          ),
        ],
        
        // Results
        if (state.recognizedProducts.isNotEmpty)
          Expanded(
            child: _buildResultsList(state.recognizedProducts),
          ),
      ],
    );
  }

  Widget _buildResultsList(List<RecognizedProduct> products) {
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: products.length,
      itemBuilder: (context, index) {
        return RecognizedProductCard(
          product: products[index],
          onTap: () => _navigateToProduct(products[index]),
        );
      },
    );
  }

  Future<void> _captureAndAnalyze() async {
    await ref.read(smartBuyerProvider.notifier).captureAndAnalyze();
  }

  void _startListening() {
    ref.read(smartBuyerProvider.notifier).startListening();
  }

  void _stopListening() {
    ref.read(smartBuyerProvider.notifier).stopListening();
  }

  void _navigateToProduct(RecognizedProduct product) {
    if (product.matchedListingId != null) {
      context.push('/product/${product.matchedListingId}');
    } else {
      // البحث عن المنتج
      context.push('/search?q=${Uri.encodeComponent(product.name)}');
    }
  }
}
