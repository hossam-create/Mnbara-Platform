import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/l10n/app_localizations.dart';
import '../providers/settings_provider.dart';

class SettingsScreen extends ConsumerWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = context.l10n;
    final settings = ref.watch(settingsProvider);

    return Scaffold(
      appBar: AppBar(title: Text(l10n.translate('settings'))),
      body: ListView(
        children: [
          _buildSectionHeader(l10n.translate('appearance')),
          ListTile(
            leading: const Icon(Icons.language),
            title: Text(l10n.translate('language')),
            subtitle: Text(settings.isArabic ? 'العربية' : 'English'),
            trailing: const Icon(Icons.chevron_right),
            onTap: () => _showLanguageDialog(context, ref, l10n),
          ),
          ListTile(
            leading: const Icon(Icons.dark_mode),
            title: Text(l10n.translate('theme')),
            subtitle: Text(_getThemeText(settings.themeMode, l10n)),
            trailing: const Icon(Icons.chevron_right),
            onTap: () => _showThemeDialog(context, ref, l10n),
          ),
          _buildSectionHeader(l10n.translate('notifications_settings')),
          SwitchListTile(
            secondary: const Icon(Icons.notifications),
            title: Text(l10n.translate('push_notifications')),
            value: settings.notificationsEnabled,
            onChanged: (value) => ref.read(settingsProvider.notifier).setNotificationsEnabled(value),
          ),
          _buildSectionHeader(l10n.translate('security')),
          SwitchListTile(
            secondary: const Icon(Icons.fingerprint),
            title: Text(l10n.translate('biometric_login')),
            value: settings.biometricEnabled,
            onChanged: (value) => ref.read(settingsProvider.notifier).setBiometricEnabled(value),
          ),
          _buildSectionHeader(l10n.translate('about')),
          ListTile(
            leading: const Icon(Icons.info_outline),
            title: Text(l10n.translate('app_version')),
            subtitle: const Text('1.0.0'),
          ),
          ListTile(
            leading: const Icon(Icons.description_outlined),
            title: Text(l10n.translate('terms_of_service')),
            trailing: const Icon(Icons.chevron_right),
            onTap: () {},
          ),
          ListTile(
            leading: const Icon(Icons.privacy_tip_outlined),
            title: Text(l10n.translate('privacy_policy')),
            trailing: const Icon(Icons.chevron_right),
            onTap: () {},
          ),
        ],
      ),
    );
  }

  Widget _buildSectionHeader(String title) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 24, 16, 8),
      child: Text(title, style: TextStyle(color: AppColors.textSecondary, fontWeight: FontWeight.w600, fontSize: 14)),
    );
  }

  String _getThemeText(ThemeMode mode, AppLocalizations l10n) {
    switch (mode) {
      case ThemeMode.system: return l10n.translate('system');
      case ThemeMode.light: return l10n.translate('light');
      case ThemeMode.dark: return l10n.translate('dark');
    }
  }

  void _showLanguageDialog(BuildContext context, WidgetRef ref, AppLocalizations l10n) {
    final settings = ref.read(settingsProvider);
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(l10n.translate('language')),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            RadioListTile<String>(
              title: const Text('العربية'),
              value: 'ar',
              groupValue: settings.locale.languageCode,
              onChanged: (value) {
                ref.read(settingsProvider.notifier).setLocale(const Locale('ar', 'SA'));
                Navigator.pop(context);
              },
            ),
            RadioListTile<String>(
              title: const Text('English'),
              value: 'en',
              groupValue: settings.locale.languageCode,
              onChanged: (value) {
                ref.read(settingsProvider.notifier).setLocale(const Locale('en', 'US'));
                Navigator.pop(context);
              },
            ),
          ],
        ),
      ),
    );
  }

  void _showThemeDialog(BuildContext context, WidgetRef ref, AppLocalizations l10n) {
    final settings = ref.read(settingsProvider);
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(l10n.translate('theme')),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            RadioListTile<ThemeMode>(
              title: Text(l10n.translate('system')),
              value: ThemeMode.system,
              groupValue: settings.themeMode,
              onChanged: (value) {
                ref.read(settingsProvider.notifier).setThemeMode(value!);
                Navigator.pop(context);
              },
            ),
            RadioListTile<ThemeMode>(
              title: Text(l10n.translate('light')),
              value: ThemeMode.light,
              groupValue: settings.themeMode,
              onChanged: (value) {
                ref.read(settingsProvider.notifier).setThemeMode(value!);
                Navigator.pop(context);
              },
            ),
            RadioListTile<ThemeMode>(
              title: Text(l10n.translate('dark')),
              value: ThemeMode.dark,
              groupValue: settings.themeMode,
              onChanged: (value) {
                ref.read(settingsProvider.notifier).setThemeMode(value!);
                Navigator.pop(context);
              },
            ),
          ],
        ),
      ),
    );
  }
}
