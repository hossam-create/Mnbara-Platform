import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/l10n/app_localizations.dart';
import '../../../shared/widgets/custom_text_field.dart';
import '../../../shared/widgets/custom_button.dart';
import '../providers/address_provider.dart';

class AddAddressScreen extends ConsumerStatefulWidget {
  const AddAddressScreen({super.key});

  @override
  ConsumerState<AddAddressScreen> createState() => _AddAddressScreenState();
}

class _AddAddressScreenState extends ConsumerState<AddAddressScreen> {
  final _formKey = GlobalKey<FormState>();
  final _labelController = TextEditingController();
  final _streetController = TextEditingController();
  final _cityController = TextEditingController();
  final _stateController = TextEditingController();
  final _zipController = TextEditingController();
  final _phoneController = TextEditingController();
  bool _isDefault = false;
  bool _isLoading = false;

  @override
  void dispose() {
    _labelController.dispose();
    _streetController.dispose();
    _cityController.dispose();
    _stateController.dispose();
    _zipController.dispose();
    _phoneController.dispose();
    super.dispose();
  }

  Future<void> _saveAddress() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isLoading = true);
    try {
      await ref.read(addressProvider.notifier).addAddress(
        Address(
          id: DateTime.now().millisecondsSinceEpoch.toString(),
          label: _labelController.text.trim(),
          street: _streetController.text.trim(),
          city: _cityController.text.trim(),
          state: _stateController.text.trim(),
          zipCode: _zipController.text.trim(),
          phone: _phoneController.text.trim(),
          isDefault: _isDefault,
        ),
      );
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(context.l10n.translate('address_added')), backgroundColor: AppColors.success));
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
      appBar: AppBar(title: Text(l10n.translate('add_address'))),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Form(
          key: _formKey,
          child: Column(
            children: [
              CustomTextField(
                controller: _labelController,
                label: l10n.translate('address_label'),
                hint: l10n.translate('address_label_hint'),
                prefixIcon: Icons.label_outline,
                validator: (v) => v == null || v.isEmpty ? l10n.translate('required') : null,
              ),
              const SizedBox(height: 16),
              CustomTextField(
                controller: _streetController,
                label: l10n.translate('street'),
                prefixIcon: Icons.home_outlined,
                validator: (v) => v == null || v.isEmpty ? l10n.translate('required') : null,
              ),
              const SizedBox(height: 16),
              Row(
                children: [
                  Expanded(
                    child: CustomTextField(
                      controller: _cityController,
                      label: l10n.translate('city'),
                      validator: (v) => v == null || v.isEmpty ? l10n.translate('required') : null,
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: CustomTextField(
                      controller: _stateController,
                      label: l10n.translate('state'),
                      validator: (v) => v == null || v.isEmpty ? l10n.translate('required') : null,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              CustomTextField(
                controller: _zipController,
                label: l10n.translate('zip_code'),
                keyboardType: TextInputType.number,
                validator: (v) => v == null || v.isEmpty ? l10n.translate('required') : null,
              ),
              const SizedBox(height: 16),
              CustomTextField(
                controller: _phoneController,
                label: l10n.translate('phone'),
                prefixIcon: Icons.phone_outlined,
                keyboardType: TextInputType.phone,
                validator: (v) => v == null || v.isEmpty ? l10n.translate('required') : null,
              ),
              const SizedBox(height: 16),
              CheckboxListTile(
                value: _isDefault,
                onChanged: (v) => setState(() => _isDefault = v ?? false),
                title: Text(l10n.translate('set_as_default')),
                controlAffinity: ListTileControlAffinity.leading,
                contentPadding: EdgeInsets.zero,
              ),
              const SizedBox(height: 24),
              CustomButton(text: l10n.translate('save_address'), onPressed: _saveAddress, isLoading: _isLoading),
            ],
          ),
        ),
      ),
    );
  }
}
