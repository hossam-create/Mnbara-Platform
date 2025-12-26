import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/l10n/app_localizations.dart';
import '../../../shared/widgets/custom_button.dart';
import '../../../shared/widgets/custom_text_field.dart';
import '../providers/traveler_provider.dart';

class CreateTripScreen extends ConsumerStatefulWidget {
  const CreateTripScreen({super.key});

  @override
  ConsumerState<CreateTripScreen> createState() => _CreateTripScreenState();
}

class _CreateTripScreenState extends ConsumerState<CreateTripScreen> {
  final _formKey = GlobalKey<FormState>();
  String _origin = '';
  String _destination = '';
  DateTime _departureDate = DateTime.now().add(const Duration(days: 1));
  DateTime _arrivalDate = DateTime.now().add(const Duration(days: 2));
  final _capacityController = TextEditingController();
  bool _isLoading = false;

  @override
  void dispose() {
    _capacityController.dispose();
    super.dispose();
  }

  Future<void> _selectDate(bool isDeparture) async {
    final date = await showDatePicker(
      context: context,
      initialDate: isDeparture ? _departureDate : _arrivalDate,
      firstDate: isDeparture ? DateTime.now() : _departureDate,
      lastDate: DateTime.now().add(const Duration(days: 365)),
    );
    if (date != null) {
      setState(() {
        if (isDeparture) {
          _departureDate = date;
          if (_arrivalDate.isBefore(_departureDate)) {
            _arrivalDate = _departureDate.add(const Duration(days: 1));
          }
        } else {
          _arrivalDate = date;
        }
      });
    }
  }

  void _showLocationPicker(bool isOrigin) {
    final locations = ['الرياض', 'جدة', 'دبي', 'القاهرة', 'لندن', 'باريس', 'نيويورك', 'طوكيو', 'اسطنبول', 'كوالالمبور'];
    
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (context) => DraggableScrollableSheet(
        initialChildSize: 0.7,
        minChildSize: 0.5,
        maxChildSize: 0.9,
        expand: false,
        builder: (context, scrollController) => Column(
          children: [
            Padding(
              padding: const EdgeInsets.all(16),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(isOrigin ? context.l10n.translate('select_origin') : context.l10n.translate('select_destination'), style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                  IconButton(icon: const Icon(Icons.close), onPressed: () => Navigator.pop(context)),
                ],
              ),
            ),
            Expanded(
              child: ListView.builder(
                controller: scrollController,
                itemCount: locations.length,
                itemBuilder: (context, index) => ListTile(
                  leading: const Icon(Icons.location_on_outlined),
                  title: Text(locations[index]),
                  onTap: () {
                    setState(() {
                      if (isOrigin) {
                        _origin = locations[index];
                      } else {
                        _destination = locations[index];
                      }
                    });
                    Navigator.pop(context);
                  },
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _createTrip() async {
    if (_origin.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(context.l10n.translate('select_origin')), backgroundColor: AppColors.error));
      return;
    }
    if (_destination.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(context.l10n.translate('select_destination')), backgroundColor: AppColors.error));
      return;
    }
    if (_origin == _destination) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(context.l10n.translate('origin_destination_different')), backgroundColor: AppColors.error));
      return;
    }
    final capacity = double.tryParse(_capacityController.text);
    if (capacity == null || capacity <= 0 || capacity > 100) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(context.l10n.translate('invalid_capacity')), backgroundColor: AppColors.error));
      return;
    }

    setState(() => _isLoading = true);
    try {
      await ref.read(travelerProvider.notifier).createTrip(
        origin: _origin,
        destination: _destination,
        departAt: _departureDate,
        arriveAt: _arrivalDate,
        capacityKg: capacity,
      );
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(context.l10n.translate('trip_created')), backgroundColor: AppColors.success));
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
      appBar: AppBar(title: Text(l10n.translate('create_trip'))),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Origin
              Text(l10n.translate('origin'), style: const TextStyle(fontWeight: FontWeight.w600)),
              const SizedBox(height: 8),
              InkWell(
                onTap: () => _showLocationPicker(true),
                child: Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(12), border: Border.all(color: AppColors.border)),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(_origin.isEmpty ? l10n.translate('select_departure_city') : _origin, style: TextStyle(color: _origin.isEmpty ? AppColors.textSecondary : AppColors.textPrimary)),
                      const Icon(Icons.location_on, color: AppColors.textSecondary),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 20),

              // Destination
              Text(l10n.translate('destination'), style: const TextStyle(fontWeight: FontWeight.w600)),
              const SizedBox(height: 8),
              InkWell(
                onTap: () => _showLocationPicker(false),
                child: Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(12), border: Border.all(color: AppColors.border)),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(_destination.isEmpty ? l10n.translate('select_arrival_city') : _destination, style: TextStyle(color: _destination.isEmpty ? AppColors.textSecondary : AppColors.textPrimary)),
                      const Icon(Icons.location_on, color: AppColors.textSecondary),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 20),

              // Departure Date
              Text(l10n.translate('departure_date'), style: const TextStyle(fontWeight: FontWeight.w600)),
              const SizedBox(height: 8),
              InkWell(
                onTap: () => _selectDate(true),
                child: Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(12), border: Border.all(color: AppColors.border)),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(_formatDate(_departureDate)),
                      const Icon(Icons.calendar_today, color: AppColors.textSecondary),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 20),

              // Arrival Date
              Text(l10n.translate('arrival_date'), style: const TextStyle(fontWeight: FontWeight.w600)),
              const SizedBox(height: 8),
              InkWell(
                onTap: () => _selectDate(false),
                child: Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(12), border: Border.all(color: AppColors.border)),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(_formatDate(_arrivalDate)),
                      const Icon(Icons.calendar_today, color: AppColors.textSecondary),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 20),

              // Capacity
              Text(l10n.translate('available_capacity'), style: const TextStyle(fontWeight: FontWeight.w600)),
              const SizedBox(height: 8),
              CustomTextField(
                controller: _capacityController,
                hint: '0',
                keyboardType: TextInputType.number,
                suffix: const Text('kg'),
              ),
              Text(l10n.translate('capacity_hint'), style: TextStyle(color: AppColors.textSecondary, fontSize: 12)),
              const SizedBox(height: 24),

              // Trip Summary
              if (_origin.isNotEmpty && _destination.isNotEmpty)
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(12)),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(l10n.translate('trip_summary'), style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                      const SizedBox(height: 12),
                      _buildSummaryRow(l10n.translate('route'), '$_origin → $_destination'),
                      _buildSummaryRow(l10n.translate('duration'), '${_arrivalDate.difference(_departureDate).inDays} ${l10n.translate('days')}'),
                      if (_capacityController.text.isNotEmpty)
                        _buildSummaryRow(l10n.translate('capacity'), '${_capacityController.text} kg'),
                    ],
                  ),
                ),
              const SizedBox(height: 24),

              CustomButton(text: l10n.translate('create_trip'), onPressed: _createTrip, isLoading: _isLoading),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildSummaryRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: TextStyle(color: AppColors.textSecondary)),
          Text(value, style: const TextStyle(fontWeight: FontWeight.w500)),
        ],
      ),
    );
  }

  String _formatDate(DateTime date) {
    return '${date.day}/${date.month}/${date.year}';
  }
}
