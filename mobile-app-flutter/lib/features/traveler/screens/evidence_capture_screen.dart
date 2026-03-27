import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';
import 'dart:io';

import '../../../core/theme/app_colors.dart';
import '../../../core/l10n/app_localizations.dart';
import '../providers/traveler_provider.dart';

class EvidenceCaptureScreen extends ConsumerStatefulWidget {
  final String deliveryId;
  final String type; // 'pickup' or 'delivery'

  const EvidenceCaptureScreen({super.key, required this.deliveryId, required this.type});

  @override
  ConsumerState<EvidenceCaptureScreen> createState() => _EvidenceCaptureScreenState();
}

class _EvidenceCaptureScreenState extends ConsumerState<EvidenceCaptureScreen> {
  File? _capturedImage;
  bool _isSubmitting = false;
  final ImagePicker _picker = ImagePicker();

  Future<void> _takePhoto() async {
    try {
      final XFile? photo = await _picker.pickImage(source: ImageSource.camera, imageQuality: 80, maxWidth: 1200);
      if (photo != null) {
        setState(() => _capturedImage = File(photo.path));
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
    }
  }

  Future<void> _pickFromGallery() async {
    try {
      final XFile? photo = await _picker.pickImage(source: ImageSource.gallery, imageQuality: 80, maxWidth: 1200);
      if (photo != null) {
        setState(() => _capturedImage = File(photo.path));
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
    }
  }

  Future<void> _submitEvidence() async {
    if (_capturedImage == null) return;
    
    setState(() => _isSubmitting = true);
    
    try {
      await ref.read(travelerProvider.notifier).submitEvidence(
        widget.deliveryId,
        widget.type,
        _capturedImage!.path,
      );
      if (mounted) {
        context.pop();
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(widget.type == 'pickup' ? l10n.translate('picked_up') : l10n.translate('delivered'))),
        );
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
    } finally {
      if (mounted) setState(() => _isSubmitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final isPickup = widget.type == 'pickup';

    return Scaffold(
      appBar: AppBar(title: Text(l10n.translate('capture_evidence'))),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(
              isPickup ? l10n.translate('photo_instructions_pickup') : l10n.translate('photo_instructions_delivery'),
              style: TextStyle(color: AppColors.textSecondary, fontSize: 16),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 24),
            Expanded(
              child: _capturedImage != null
                  ? Stack(
                      children: [
                        ClipRRect(
                          borderRadius: BorderRadius.circular(12),
                          child: Image.file(_capturedImage!, fit: BoxFit.cover, width: double.infinity),
                        ),
                        Positioned(
                          top: 8,
                          right: 8,
                          child: IconButton(
                            onPressed: () => setState(() => _capturedImage = null),
                            icon: const Icon(Icons.close, color: Colors.white),
                            style: IconButton.styleFrom(backgroundColor: Colors.black54),
                          ),
                        ),
                      ],
                    )
                  : Container(
                      decoration: BoxDecoration(
                        color: AppColors.surface,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: AppColors.border, width: 2, style: BorderStyle.solid),
                      ),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const Icon(Icons.camera_alt_outlined, size: 64, color: AppColors.textSecondary),
                          const SizedBox(height: 16),
                          Text(l10n.translate('take_photo'), style: TextStyle(color: AppColors.textSecondary, fontSize: 16)),
                        ],
                      ),
                    ),
            ),
            const SizedBox(height: 24),
            if (_capturedImage == null) ...[
              ElevatedButton.icon(
                onPressed: _takePhoto,
                icon: const Icon(Icons.camera_alt),
                label: Text(l10n.translate('take_photo')),
                style: ElevatedButton.styleFrom(padding: const EdgeInsets.all(16)),
              ),
              const SizedBox(height: 12),
              OutlinedButton.icon(
                onPressed: _pickFromGallery,
                icon: const Icon(Icons.photo_library),
                label: const Text('Gallery'),
                style: OutlinedButton.styleFrom(padding: const EdgeInsets.all(16)),
              ),
            ] else
              ElevatedButton(
                onPressed: _isSubmitting ? null : _submitEvidence,
                style: ElevatedButton.styleFrom(padding: const EdgeInsets.all(16)),
                child: _isSubmitting
                    ? const SizedBox(width: 24, height: 24, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                    : Text(isPickup ? l10n.translate('confirm_pickup') : l10n.translate('confirm_delivery')),
              ),
          ],
        ),
      ),
    );
  }
}
