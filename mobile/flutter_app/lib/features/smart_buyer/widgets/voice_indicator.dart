import 'package:flutter/material.dart';
import '../../../core/theme/app_colors.dart';

class VoiceIndicator extends StatefulWidget {
  final bool isListening;

  const VoiceIndicator({super.key, required this.isListening});

  @override
  State<VoiceIndicator> createState() => _VoiceIndicatorState();
}

class _VoiceIndicatorState extends State<VoiceIndicator>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _animation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: const Duration(milliseconds: 1000),
      vsync: this,
    )..repeat(reverse: true);
    _animation = Tween<double>(begin: 1.0, end: 1.3).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeInOut),
    );
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _animation,
      builder: (context, child) {
        return Container(
          width: 120 * (widget.isListening ? _animation.value : 1.0),
          height: 120 * (widget.isListening ? _animation.value : 1.0),
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            color: widget.isListening
                ? AppColors.primary.withOpacity(0.2)
                : Colors.grey[200],
          ),
          child: Center(
            child: Icon(
              Icons.graphic_eq,
              size: 48,
              color: widget.isListening ? AppColors.primary : Colors.grey,
            ),
          ),
        );
      },
    );
  }
}
