import 'package:flutter/material.dart';
import 'dart:async';
import '../../models/ui_config.dart';

class CountdownTimerWidget extends StatefulWidget {
  final UISection section;
  final String language;

  const CountdownTimerWidget({
    super.key,
    required this.section,
    required this.language,
  });

  @override
  State<CountdownTimerWidget> createState() => _CountdownTimerWidgetState();
}

class _CountdownTimerWidgetState extends State<CountdownTimerWidget> {
  late Timer _timer;
  Duration _remaining = Duration.zero;

  @override
  void initState() {
    super.initState();
    _calculateRemaining();
    _timer = Timer.periodic(const Duration(seconds: 1), (_) => _calculateRemaining());
  }

  @override
  void dispose() {
    _timer.cancel();
    super.dispose();
  }

  void _calculateRemaining() {
    final endDateStr = widget.section.config['end_date'] as String?;
    if (endDateStr != null) {
      final endDate = DateTime.tryParse(endDateStr);
      if (endDate != null) {
        final now = DateTime.now();
        if (endDate.isAfter(now)) {
          setState(() => _remaining = endDate.difference(now));
        } else {
          setState(() => _remaining = Duration.zero);
        }
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final config = widget.section.config;
    final showDays = config['show_days'] ?? true;
    final showHours = config['show_hours'] ?? true;
    final showMinutes = config['show_minutes'] ?? true;
    final showSeconds = config['show_seconds'] ?? true;

    final days = _remaining.inDays;
    final hours = _remaining.inHours % 24;
    final minutes = _remaining.inMinutes % 60;
    final seconds = _remaining.inSeconds % 60;

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            Theme.of(context).primaryColor,
            Theme.of(context).primaryColor.withOpacity(0.8),
          ],
        ),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        children: [
          Text(
            widget.section.getTitle(widget.language) ?? (widget.language == 'ar' ? 'العرض ينتهي في' : 'Offer ends in'),
            style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 16),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              if (showDays) _buildTimeBox(days.toString().padLeft(2, '0'), widget.language == 'ar' ? 'يوم' : 'Days'),
              if (showDays) _buildSeparator(),
              if (showHours) _buildTimeBox(hours.toString().padLeft(2, '0'), widget.language == 'ar' ? 'ساعة' : 'Hours'),
              if (showHours) _buildSeparator(),
              if (showMinutes) _buildTimeBox(minutes.toString().padLeft(2, '0'), widget.language == 'ar' ? 'دقيقة' : 'Min'),
              if (showMinutes && showSeconds) _buildSeparator(),
              if (showSeconds) _buildTimeBox(seconds.toString().padLeft(2, '0'), widget.language == 'ar' ? 'ثانية' : 'Sec'),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildTimeBox(String value, String label) {
    return Column(
      children: [
        Container(
          width: 60,
          height: 60,
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(12),
          ),
          child: Center(
            child: Text(
              value,
              style: TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.bold,
                color: Theme.of(context).primaryColor,
              ),
            ),
          ),
        ),
        const SizedBox(height: 6),
        Text(label, style: const TextStyle(color: Colors.white70, fontSize: 12)),
      ],
    );
  }

  Widget _buildSeparator() {
    return const Padding(
      padding: EdgeInsets.symmetric(horizontal: 8),
      child: Text(':', style: TextStyle(color: Colors.white, fontSize: 28, fontWeight: FontWeight.bold)),
    );
  }
}
