import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

final settingsProvider = StateNotifierProvider<SettingsNotifier, SettingsState>((ref) {
  return SettingsNotifier();
});

class SettingsState {
  final Locale locale;
  final ThemeMode themeMode;
  final bool notificationsEnabled;
  final bool biometricEnabled;

  SettingsState({
    this.locale = const Locale('ar', 'SA'),
    this.themeMode = ThemeMode.system,
    this.notificationsEnabled = true,
    this.biometricEnabled = false,
  });

  bool get isArabic => locale.languageCode == 'ar';

  SettingsState copyWith({
    Locale? locale,
    ThemeMode? themeMode,
    bool? notificationsEnabled,
    bool? biometricEnabled,
  }) {
    return SettingsState(
      locale: locale ?? this.locale,
      themeMode: themeMode ?? this.themeMode,
      notificationsEnabled: notificationsEnabled ?? this.notificationsEnabled,
      biometricEnabled: biometricEnabled ?? this.biometricEnabled,
    );
  }
}

class SettingsNotifier extends StateNotifier<SettingsState> {
  SettingsNotifier() : super(SettingsState()) {
    _loadSettings();
  }

  Future<void> _loadSettings() async {
    final prefs = await SharedPreferences.getInstance();
    final languageCode = prefs.getString('language_code') ?? 'ar';
    final countryCode = prefs.getString('country_code') ?? 'SA';
    final themeModeIndex = prefs.getInt('theme_mode') ?? 0;
    final notificationsEnabled = prefs.getBool('notifications_enabled') ?? true;
    final biometricEnabled = prefs.getBool('biometric_enabled') ?? false;

    state = SettingsState(
      locale: Locale(languageCode, countryCode),
      themeMode: ThemeMode.values[themeModeIndex],
      notificationsEnabled: notificationsEnabled,
      biometricEnabled: biometricEnabled,
    );
  }

  Future<void> setLocale(Locale locale) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('language_code', locale.languageCode);
    await prefs.setString('country_code', locale.countryCode ?? '');
    state = state.copyWith(locale: locale);
  }

  Future<void> toggleLanguage() async {
    final newLocale = state.isArabic ? const Locale('en', 'US') : const Locale('ar', 'SA');
    await setLocale(newLocale);
  }

  Future<void> setThemeMode(ThemeMode mode) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setInt('theme_mode', mode.index);
    state = state.copyWith(themeMode: mode);
  }

  Future<void> setNotificationsEnabled(bool enabled) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool('notifications_enabled', enabled);
    state = state.copyWith(notificationsEnabled: enabled);
  }

  Future<void> setBiometricEnabled(bool enabled) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool('biometric_enabled', enabled);
    state = state.copyWith(biometricEnabled: enabled);
  }
}
