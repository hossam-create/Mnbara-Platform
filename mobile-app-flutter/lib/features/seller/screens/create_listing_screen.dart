import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/l10n/app_localizations.dart';
import '../../../shared/widgets/custom_text_field.dart';
import '../../../shared/widgets/custom_button.dart';

class CreateListingScreen extends ConsumerStatefulWidget {
  const CreateListingScreen({super.key});

  @override
  ConsumerState<CreateListingScreen> createState() => _CreateListingScreenState();
}

class _CreateListingScreenState extends ConsumerState<CreateListingScreen> {
  final _formKey = GlobalKey<FormState>();
  final _titleController = TextEditingController();
  final _descriptionController = TextEditingController();
  final _priceController = TextEditingController();
  final _stockController = TextEditingController();
  String? _selectedCategory;
  String _condition = 'new';
  List<String> _images = [];
  bool _isLoading = false;

  @override
  void dispose() {
    _titleController.dispose();
    _descriptionController.dispose();
    _priceController.dispose();
    _stockController.dispose();
    super.dispose();
  }

  Future<void> _pickImages() async {
    final picker = ImagePicker();
    final images = await picker.pickMultiImage();
    if (images.isNotEmpty) {
      setState(() => _images = [..._images, ...images.map((e) => e.path)].take(10).toList());
    }
  }

  Future<void> _createListing() async {
    if (!_formKey.currentState!.validate()) return;
    if (_images.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(context.l10n.translate('add_images')), backgroundColor: AppColors.error));
      return;
    }

    setState(() => _isLoading = true);
    try {
      // API call to create listing
      await Future.delayed(const Duration(seconds: 2));
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(context.l10n.translate('listing_created')), backgroundColor: AppColors.success));
        context.pop();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString()), backgroundColor: AppColors.error));
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;

    return Scaffold(
      appBar: AppBar(title: Text(l10n.translate('create_listing'))),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(l10n.translate('photos'), style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
              const SizedBox(height: 12),
              _buildImagePicker(l10n),
              const SizedBox(height: 24),
              CustomTextField(
                controller: _titleController,
                label: l10n.translate('title'),
                validator: (v) => v == null || v.isEmpty ? l10n.translate('required') : null,
              ),
              const SizedBox(height: 16),
              CustomTextField(
                controller: _descriptionController,
                label: l10n.translate('description'),
                maxLines: 4,
                validator: (v) => v == null || v.isEmpty ? l10n.translate('required') : null,
              ),
              const SizedBox(height: 16),
              DropdownButtonFormField<String>(
                value: _selectedCategory,
                decoration: InputDecoration(
                  labelText: l10n.translate('category'),
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                ),
                items: ['Electronics', 'Fashion', 'Home', 'Sports'].map((c) => DropdownMenuItem(value: c, child: Text(c))).toList(),
                onChanged: (v) => setState(() => _selectedCategory = v),
                validator: (v) => v == null ? l10n.translate('required') : null,
              ),
              const SizedBox(height: 16),
              Row(
                children: [
                  Expanded(
                    child: CustomTextField(
                      controller: _priceController,
                      label: l10n.translate('price'),
                      keyboardType: TextInputType.number,
                      suffix: Text(l10n.translate('sar')),
                      validator: (v) => v == null || v.isEmpty ? l10n.translate('required') : null,
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: CustomTextField(
                      controller: _stockController,
                      label: l10n.translate('stock'),
                      keyboardType: TextInputType.number,
                      validator: (v) => v == null || v.isEmpty ? l10n.translate('required') : null,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              Text(l10n.translate('condition'), style: const TextStyle(fontWeight: FontWeight.bold)),
              const SizedBox(height: 8),
              Row(
                children: [
                  _buildConditionChip('new', l10n.translate('new')),
                  const SizedBox(width: 8),
                  _buildConditionChip('used', l10n.translate('used')),
                  const SizedBox(width: 8),
                  _buildConditionChip('refurbished', l10n.translate('refurbished')),
                ],
              ),
              const SizedBox(height: 32),
              CustomButton(text: l10n.translate('publish_listing'), onPressed: _createListing, isLoading: _isLoading),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildImagePicker(AppLocalizations l10n) {
    return SizedBox(
      height: 100,
      child: ListView(
        scrollDirection: Axis.horizontal,
        children: [
          InkWell(
            onTap: _pickImages,
            borderRadius: BorderRadius.circular(12),
            child: Container(
              width: 100, height: 100,
              decoration: BoxDecoration(border: Border.all(color: AppColors.border, width: 2), borderRadius: BorderRadius.circular(12)),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.add_photo_alternate_outlined, size: 32, color: AppColors.textSecondary),
                  Text('${_images.length}/10', style: TextStyle(color: AppColors.textSecondary, fontSize: 12)),
                ],
              ),
            ),
          ),
          ..._images.asMap().entries.map((e) => Padding(
            padding: const EdgeInsets.only(left: 8),
            child: Stack(
              children: [
                ClipRRect(
                  borderRadius: BorderRadius.circular(12),
                  child: Image.asset(e.value, width: 100, height: 100, fit: BoxFit.cover),
                ),
                Positioned(
                  top: 4, right: 4,
                  child: GestureDetector(
                    onTap: () => setState(() => _images.removeAt(e.key)),
                    child: Container(
                      padding: const EdgeInsets.all(4),
                      decoration: const BoxDecoration(color: AppColors.error, shape: BoxShape.circle),
                      child: const Icon(Icons.close, size: 14, color: Colors.white),
                    ),
                  ),
                ),
              ],
            ),
          )),
        ],
      ),
    );
  }

  Widget _buildConditionChip(String value, String label) {
    final isSelected = _condition == value;
    return ChoiceChip(
      label: Text(label),
      selected: isSelected,
      onSelected: (_) => setState(() => _condition = value),
      selectedColor: AppColors.primary.withOpacity(0.2),
    );
  }
}
