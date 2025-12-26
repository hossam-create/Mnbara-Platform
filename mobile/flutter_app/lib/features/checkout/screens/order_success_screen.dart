import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:lottie/lottie.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/l10n/app_localizations.dart';
import '../../../shared/widgets/custom_button.dart';

class OrderSuccessScreen extends StatelessWidget {
  final String orderId;

  const OrderSuccessScreen({super.key, required this.orderId});

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;

    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                width: 150, height: 150,
                decoration: BoxDecoration(color: AppColors.success.withOpacity(0.1), shape: BoxShape.circle),
                child: const Icon(Icons.check_circle, size: 100, color: AppColors.success),
              ),
              const SizedBox(height: 32),
              Text(l10n.translate('order_success'), style: Theme.of(context).textTheme.headlineMedium?.copyWith(fontWeight: FontWeight.bold), textAlign: TextAlign.center),
              const SizedBox(height: 16),
              Text(l10n.translate('order_success_desc'), style: TextStyle(color: AppColors.textSecondary, fontSize: 16), textAlign: TextAlign.center),
              const SizedBox(height: 24),
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(color: AppColors.surface, borderRadius: BorderRadius.circular(12)),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text('${l10n.translate('order_number')}: ', style: TextStyle(color: AppColors.textSecondary)),
                    Text('#$orderId', style: const TextStyle(fontWeight: FontWeight.bold)),
                  ],
                ),
              ),
              const SizedBox(height: 48),
              CustomButton(text: l10n.translate('track_order'), onPressed: () => context.push('/order/$orderId')),
              const SizedBox(height: 16),
              CustomButton(text: l10n.translate('continue_shopping'), onPressed: () => context.go('/'), variant: ButtonVariant.outlined),
            ],
          ),
        ),
      ),
    );
  }
}
