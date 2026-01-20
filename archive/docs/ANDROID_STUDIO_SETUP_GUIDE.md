# ط¯ظ„ظٹظ„ ظپطھط­ طھط·ط¨ظٹظ‚ Mnbarh ط¹ظ„ظ‰ Android Studio

**ط¢ط®ط± طھط­ط¯ظٹط«:** 28 ط¯ظٹط³ظ…ط¨ط± 2025

---

## ًں“‹ ط§ظ„ظ…طھط·ظ„ط¨ط§طھ ط§ظ„ط£ط³ط§ط³ظٹط©

### 1. ط§ظ„ط¨ط±ط§ظ…ط¬ ط§ظ„ظ…ط·ظ„ظˆط¨ط©
- âœ… **Android Studio** (ط£ط­ط¯ط« ط¥طµط¯ط§ط±)
- âœ… **Flutter SDK** (v3.2.0 ط£ظˆ ط£ط­ط¯ط«)
- âœ… **Java Development Kit (JDK)** 11 ط£ظˆ ط£ط­ط¯ط«
- âœ… **Android SDK** (API Level 23+)
- âœ… **Git** (ظ„ظ„طھط­ظƒظ… ط¨ط§ظ„ط¥طµط¯ط§ط±ط§طھ)

### 2. ظ…طھط·ظ„ط¨ط§طھ ط§ظ„ظ†ط¸ط§ظ…
- **RAM:** 8GB ط¹ظ„ظ‰ ط§ظ„ط£ظ‚ظ„ (16GB ظ…ظˆطµظ‰ ط¨ظ‡)
- **Storage:** 50GB ظ…ط³ط§ط­ط© ط­ط±ط©
- **OS:** Windows 10+, macOS 10.15+, ط£ظˆ Linux

---

## ًںڑ€ ط®ط·ظˆط§طھ ط§ظ„ط¥ط¹ط¯ط§ط¯ ط§ظ„ط£ظˆظ„ظٹ

### ط§ظ„ط®ط·ظˆط© 1: طھط«ط¨ظٹطھ Flutter SDK

```bash
# Windows (PowerShell)
# 1. ط­ظ…ظ„ Flutter ظ…ظ†: https://flutter.dev/docs/get-started/install
# 2. ط§ط³طھط®ط±ط¬ ط§ظ„ظ…ظ„ظپ ط¥ظ„ظ‰ ظ…ط¬ظ„ط¯ (ظ…ط«ظ„ط§ظ‹: C:\flutter)
# 3. ط£ط¶ظپ Flutter ط¥ظ„ظ‰ PATH

# macOS / Linux
git clone https://github.com/flutter/flutter.git -b stable
export PATH="$PATH:`pwd`/flutter/bin"
```

### ط§ظ„ط®ط·ظˆط© 2: ط§ظ„طھط­ظ‚ظ‚ ظ…ظ† ط§ظ„طھط«ط¨ظٹطھ

```bash
flutter doctor
```

**ط§ظ„ظ†طھظٹط¬ط© ط§ظ„ظ…طھظˆظ‚ط¹ط©:**
```
âœ“ Flutter (Channel stable)
âœ“ Android toolchain
âœ“ Android Studio
âœ“ VS Code
âœ“ Connected device
```

### ط§ظ„ط®ط·ظˆط© 3: طھط«ط¨ظٹطھ ط§ظ„ظ…طھط·ظ„ط¨ط§طھ ط§ظ„ظ†ط§ظ‚طµط©

```bash
# طھط«ط¨ظٹطھ Android SDK
flutter config --android-sdk /path/to/android/sdk

# ظ‚ط¨ظˆظ„ ط±ط®طµ Android
flutter doctor --android-licenses

# طھط«ط¨ظٹطھ ط§ظ„ظ…طھط·ظ„ط¨ط§طھ ط§ظ„ظ†ط§ظ‚طµط©
flutter pub get
```

---

## ًں“‚ ظپطھط­ ط§ظ„ظ…ط´ط±ظˆط¹ ط¹ظ„ظ‰ Android Studio

### ط§ظ„ط·ط±ظٹظ‚ط© 1: ظپطھط­ ط§ظ„ظ…ط´ط±ظˆط¹ ط§ظ„ظƒط§ظ…ظ„

```bash
# 1. ط§ظ†طھظ‚ظ„ ط¥ظ„ظ‰ ظ…ط¬ظ„ط¯ ط§ظ„ظ…ط´ط±ظˆط¹
cd /path/to/mnbarh

# 2. ط§ظپطھط­ Android Studio
# 3. ط§ط®طھط±: File > Open
# 4. ط§ط®طھط± ظ…ط¬ظ„ط¯ ط§ظ„ظ…ط´ط±ظˆط¹ ط§ظ„ط±ط¦ظٹط³ظٹ (mnbarh)
# 5. ط§ط®طھط± "Open as Project"
```

### ط§ظ„ط·ط±ظٹظ‚ط© 2: ظپطھط­ ظ…ط´ط±ظˆط¹ Android ظ…ط¨ط§ط´ط±ط©

```bash
# 1. ط§ظپطھط­ Android Studio
# 2. ط§ط®طھط±: File > Open
# 3. ط§ظ†طھظ‚ظ„ ط¥ظ„ظ‰: mobile/flutter_app/android
# 4. ط§ط®طھط± ظ…ط¬ظ„ط¯ "android" ظˆط§ظپطھط­ظ‡
```

### ط§ظ„ط·ط±ظٹظ‚ط© 3: ظ…ظ† ط³ط·ط± ط§ظ„ط£ظˆط§ظ…ط±

```bash
# Windows
cd mobile\flutter_app
flutter pub get
flutter run -d emulator-5554

# macOS / Linux
cd mobile/flutter_app
flutter pub get
flutter run -d emulator-5554
```

---

## âڑ™ï¸ڈ ط¥ط¹ط¯ط§ط¯ط§طھ Android Studio

### 1. طھظƒظˆظٹظ† SDK

```
File > Settings > Languages & Frameworks > Flutter
â”œâ”€ Flutter SDK path: /path/to/flutter
â”œâ”€ Dart SDK path: /path/to/flutter/bin/cache/dart-sdk
â””â”€ Enable Dart support: âœ“
```

### 2. طھظƒظˆظٹظ† Android SDK

```
File > Settings > Appearance & Behavior > System Settings > Android SDK
â”œâ”€ SDK Platforms:
â”‚  â”œâ”€ Android 14 (API 34)
â”‚  â”œâ”€ Android 13 (API 33)
â”‚  â””â”€ Android 12 (API 31)
â”œâ”€ SDK Tools:
â”‚  â”œâ”€ Android SDK Build-Tools
â”‚  â”œâ”€ Android Emulator
â”‚  â”œâ”€ Android SDK Platform-Tools
â”‚  â””â”€ Google Play services
â””â”€ Apply > OK
```

### 3. طھظƒظˆظٹظ† Java

```
File > Settings > Build, Execution, Deployment > Build Tools > Gradle
â”œâ”€ Gradle JDK: 11 ط£ظˆ ط£ط­ط¯ط«
â””â”€ Apply > OK
```

---

## ًں“± ط¥ط¹ط¯ط§ط¯ ط§ظ„ظ…ط­ط§ظƒظٹ (Emulator)

### ط¥ظ†ط´ط§ط، ط¬ظ‡ط§ط² ط§ظپطھط±ط§ط¶ظٹ ط¬ط¯ظٹط¯

```
Tools > Device Manager > Create Device
â”œâ”€ Select Hardware: Pixel 6 Pro (ط£ظˆ ط£ظٹ ط¬ظ‡ط§ط² ط¢ط®ط±)
â”œâ”€ Select System Image: Android 14 (API 34)
â”œâ”€ Verify Configuration
â””â”€ Finish
```

### طھط´ط؛ظٹظ„ ط§ظ„ظ…ط­ط§ظƒظٹ

```bash
# ظ…ظ† ط³ط·ط± ط§ظ„ط£ظˆط§ظ…ط±
emulator -avd Pixel_6_Pro_API_34

# ط£ظˆ ظ…ظ† Android Studio
Tools > Device Manager > Play (â–¶)
```

---

## ًں”§ ط¥ط¹ط¯ط§ط¯ط§طھ ط§ظ„ظ…ط´ط±ظˆط¹

### 1. ظ…ظ„ظپ local.properties

```properties
# mobile/flutter_app/android/local.properties
sdk.dir=/path/to/android/sdk
flutter.sdk=/path/to/flutter
flutter.buildMode=debug
flutter.versionName=1.0.0
flutter.versionCode=1
```

### 2. ظ…ظ„ظپ key.properties (ظ„ظ„ط¥طµط¯ط§ط±)

```properties
# mobile/flutter_app/android/key.properties
keyAlias=mnbarh_key
keyPassword=your_key_password
storeFile=/path/to/keystore.jks
storePassword=your_store_password
```

### 3. ظ…طھط؛ظٹط±ط§طھ ط§ظ„ط¨ظٹط¦ط©

```bash
# Windows (PowerShell)
$env:MAPS_API_KEY = "your_google_maps_api_key"
$env:STRIPE_PUBLISHABLE_KEY = "your_stripe_key"

# macOS / Linux
export MAPS_API_KEY="your_google_maps_api_key"
export STRIPE_PUBLISHABLE_KEY="your_stripe_key"
```

---

## ًں“¦ طھط«ط¨ظٹطھ ط§ظ„ظ…طھط·ظ„ط¨ط§طھ

### 1. طھط­ط¯ظٹط« ط§ظ„ظ…طھط·ظ„ط¨ط§طھ

```bash
cd mobile/flutter_app

# طھط­ط¯ظٹط« pub dependencies
flutter pub get

# طھط­ط¯ظٹط« build files
flutter pub upgrade

# ط¥ظ†ط´ط§ط، generated files
flutter pub run build_runner build
```

### 2. طھظ†ط¸ظٹظپ ط§ظ„ظ…ط´ط±ظˆط¹

```bash
flutter clean
flutter pub get
flutter pub run build_runner build --delete-conflicting-outputs
```

---

## ًںڈƒ طھط´ط؛ظٹظ„ ط§ظ„طھط·ط¨ظٹظ‚

### ط§ظ„ط·ط±ظٹظ‚ط© 1: ظ…ظ† Android Studio

```
1. ط§ط®طھط± ط¬ظ‡ط§ط² ظ…ظ† ظ‚ط§ط¦ظ…ط© ط§ظ„ط£ط¬ظ‡ط²ط© (Device Selector)
2. ط§ط¶ط؛ط· ط¹ظ„ظ‰ ط²ط± Run (â–¶) ط£ظˆ Shift + F10
3. ط§ظ†طھط¸ط± ط­طھظ‰ ظٹطھظ… ط¨ظ†ط§ط، ظˆطھط´ط؛ظٹظ„ ط§ظ„طھط·ط¨ظٹظ‚
```

### ط§ظ„ط·ط±ظٹظ‚ط© 2: ظ…ظ† ط³ط·ط± ط§ظ„ط£ظˆط§ظ…ط±

```bash
cd mobile/flutter_app

# طھط´ط؛ظٹظ„ ط¹ظ„ظ‰ ط§ظ„ظ…ط­ط§ظƒظٹ
flutter run

# طھط´ط؛ظٹظ„ ط¹ظ„ظ‰ ط¬ظ‡ط§ط² ط­ظ‚ظٹظ‚ظٹ
flutter run -d <device_id>

# طھط´ط؛ظٹظ„ ظ…ط¹ ظˆط¶ط¹ debug
flutter run -v

# طھط´ط؛ظٹظ„ ظ…ط¹ hot reload
flutter run --hot
```

### ط§ظ„ط·ط±ظٹظ‚ط© 3: ط¨ظ†ط§ط، APK

```bash
# ط¨ظ†ط§ط، APK ظ„ظ„ط§ط®طھط¨ط§ط±
flutter build apk --debug

# ط¨ظ†ط§ط، APK ظ„ظ„ط¥طµط¯ط§ط±
flutter build apk --release

# ط¨ظ†ط§ط، App Bundle
flutter build appbundle --release
```

---

## ًںگ› ط§ط³طھظƒط´ط§ظپ ط§ظ„ط£ط®ط·ط§ط،

### ط§ظ„ظ…ط´ظƒظ„ط© 1: "Flutter SDK not found"

```bash
# ط§ظ„ط­ظ„:
flutter config --android-sdk /path/to/android/sdk
flutter config --android-studio-dir /path/to/android/studio
```

### ط§ظ„ظ…ط´ظƒظ„ط© 2: "Gradle build failed"

```bash
# ط§ظ„ط­ظ„:
cd mobile/flutter_app/android
./gradlew clean
./gradlew build
```

### ط§ظ„ظ…ط´ظƒظ„ط© 3: "Emulator not starting"

```bash
# ط§ظ„ط­ظ„:
# 1. طھط­ظ‚ظ‚ ظ…ظ† طھظپط¹ظٹظ„ Virtualization ظپظٹ BIOS
# 2. ط§ط³طھط®ط¯ظ… emulator ط¨ط¯ظ„ط§ظ‹ ظ…ظ† ظ…ط­ط§ظƒظٹ Android Studio
emulator -avd Pixel_6_Pro_API_34 -no-snapshot-load
```

### ط§ظ„ظ…ط´ظƒظ„ط© 4: "Dependencies conflict"

```bash
# ط§ظ„ط­ظ„:
flutter pub get
flutter pub upgrade
flutter pub run build_runner build --delete-conflicting-outputs
```

---

## ًں“ٹ ظ‡ظٹظƒظ„ ط§ظ„ظ…ط´ط±ظˆط¹

```
mobile/flutter_app/
â”œâ”€â”€ android/                          # ظƒظˆط¯ Android native
â”‚   â”œâ”€â”€ app/
â”‚   â”‚   â”œâ”€â”€ build.gradle             # ط¥ط¹ط¯ط§ط¯ط§طھ ط§ظ„ط¨ظ†ط§ط،
â”‚   â”‚   â”œâ”€â”€ src/main/
â”‚   â”‚   â”‚   â”œâ”€â”€ AndroidManifest.xml  # ط§ظ„ط£ط°ظˆظ†ط§طھ ظˆط§ظ„ط¥ط¹ط¯ط§ط¯ط§طھ
â”‚   â”‚   â”‚   â”œâ”€â”€ kotlin/              # ظƒظˆط¯ Kotlin
â”‚   â”‚   â”‚   â””â”€â”€ res/                 # ط§ظ„ظ…ظˆط§ط±ط¯
â”‚   â”‚   â””â”€â”€ proguard-rules.pro       # ظ‚ظˆط§ط¹ط¯ ProGuard
â”‚   â”œâ”€â”€ gradle/                       # ظ…ظ„ظپط§طھ Gradle
â”‚   â”œâ”€â”€ settings.gradle               # ط¥ط¹ط¯ط§ط¯ط§طھ Gradle
â”‚   â””â”€â”€ local.properties              # ط§ظ„ط®طµط§ط¦طµ ط§ظ„ظ…ط­ظ„ظٹط©
â”œâ”€â”€ ios/                              # ظƒظˆط¯ iOS
â”œâ”€â”€ lib/                              # ظƒظˆط¯ Dart ط§ظ„ط±ط¦ظٹط³ظٹ
â”‚   â”œâ”€â”€ main.dart                     # ظ†ظ‚ط·ط© ط§ظ„ط¯ط®ظˆظ„
â”‚   â”œâ”€â”€ core/                         # ط§ظ„ط£ط³ط§ط³ظٹط§طھ
â”‚   â”œâ”€â”€ features/                     # ط§ظ„ظ…ظٹط²ط§طھ
â”‚   â”œâ”€â”€ models/                       # ظ†ظ…ط§ط°ط¬ ط§ظ„ط¨ظٹط§ظ†ط§طھ
â”‚   â”œâ”€â”€ services/                     # ط§ظ„ط®ط¯ظ…ط§طھ
â”‚   â”œâ”€â”€ providers/                    # Riverpod providers
â”‚   â”œâ”€â”€ widgets/                      # ط§ظ„ظ€ widgets ط§ظ„ظ…ط´طھط±ظƒط©
â”‚   â””â”€â”€ theme/                        # ط§ظ„ط«ظٹظ… ظˆط§ظ„ط£ظ„ظˆط§ظ†
â”œâ”€â”€ assets/                           # ط§ظ„طµظˆط± ظˆط§ظ„ط®ط·ظˆط·
â”œâ”€â”€ test/                             # ط§ط®طھط¨ط§ط±ط§طھ
â”œâ”€â”€ pubspec.yaml                      # ط§ظ„ظ…طھط·ظ„ط¨ط§طھ
â””â”€â”€ README.md                         # ط§ظ„طھظˆط«ظٹظ‚
```

---

## ًںژ¯ ط§ظ„ظ…ظٹط²ط§طھ ط§ظ„ط±ط¦ظٹط³ظٹط© ظ„ظ„طھط·ط¨ظٹظ‚

### 1. ط§ظ„ظ…طµط§ط¯ظ‚ط© ظˆط§ظ„طھط³ط¬ظٹظ„
- âœ… طھط³ط¬ظٹظ„ ط¨ط§ظ„ط¨ط±ظٹط¯ ط§ظ„ط¥ظ„ظƒطھط±ظˆظ†ظٹ
- âœ… طھط³ط¬ظٹظ„ ط§ظ„ط¯ط®ظˆظ„ ط¨ظ€ Google
- âœ… طھط³ط¬ظٹظ„ ط§ظ„ط¯ط®ظˆظ„ ط¨ظ€ Apple
- âœ… طھط³ط¬ظٹظ„ ط§ظ„ط¯ط®ظˆظ„ ط¨ظ€ Facebook
- âœ… ط§ظ„طھط­ظ‚ظ‚ ط¨ظ€ OTP

### 2. ط§ظ„ظ…طھط¬ط± ط§ظ„ط±ط¦ظٹط³ظٹ
- âœ… ط¹ط±ط¶ ط§ظ„ظ…ظ†طھط¬ط§طھ
- âœ… ط§ظ„ط¨ط­ط« ظˆط§ظ„طھطµظپظٹط©
- âœ… ط¹ط±ط¶ ط§ظ„طھظپط§طµظٹظ„
- âœ… ط¥ط¶ط§ظپط© ط¥ظ„ظ‰ ط§ظ„ط³ظ„ط©
- âœ… ط§ظ„ظ…ظپط¶ظ„ط©

### 3. ط§ظ„ط´ط±ط§ط، ظˆط§ظ„ط¯ظپط¹
- âœ… ط³ظ„ط© ط§ظ„طھط³ظˆظ‚
- âœ… ط¹ظ…ظ„ظٹط© ط§ظ„ط¯ظپط¹
- âœ… ط¯ظپط¹ ط¨ظ€ Stripe
- âœ… ط¯ظپط¹ ط¨ظ€ PayPal
- âœ… ط¯ظپط¹ ط¨ظ€ Crypto

### 4. ط§ظ„ظ…ط¨ظٹط¹ط§طھ ظˆط§ظ„ط¨ظٹط¹
- âœ… ط¥ظ†ط´ط§ط، ظ‚ظˆط§ط¦ظ…
- âœ… ط¥ط¯ط§ط±ط© ط§ظ„ظ…ط®ط²ظˆظ†
- âœ… طھط­ظ„ظٹظ„ط§طھ ط§ظ„ظ…ط¨ظٹط¹ط§طھ
- âœ… ط¥ط¯ط§ط±ط© ط§ظ„ط·ظ„ط¨ط§طھ

### 5. ط§ظ„ظ…ظٹط²ط§طھ ط§ظ„ظ…طھظ‚ط¯ظ…ط©
- âœ… ط§ظ„ط¨ط­ط« ط¨ط§ظ„طµظˆطھ
- âœ… ظ…ط¹ط§ظٹظ†ط© AR
- âœ… ط¹ط±ط¶ VR
- âœ… ط§ظ„طھظˆطµظٹط§طھ ط¨ظ€ AI
- âœ… ط§ظ„ط¯ط¹ظ… ط§ظ„ظپظˆط±ظٹ

### 6. ط§ظ„طھطھط¨ط¹ ظˆط§ظ„طھط³ظ„ظٹظ…
- âœ… طھطھط¨ط¹ ط§ظ„ط·ظ„ط¨ط§طھ
- âœ… طھطھط¨ط¹ ط§ظ„طھط³ظ„ظٹظ… ط§ظ„ط­ظٹ
- âœ… ط¥ط´ط¹ط§ط±ط§طھ ط§ظ„طھط³ظ„ظٹظ…
- âœ… ط¥ط«ط¨ط§طھ ط§ظ„طھط³ظ„ظٹظ…

---

## ًں”گ ط§ظ„ط£ظ…ط§ظ† ظˆط§ظ„ط£ط°ظˆظ†ط§طھ

### ط§ظ„ط£ط°ظˆظ†ط§طھ ط§ظ„ظ…ط·ظ„ظˆط¨ط©

```xml
<!-- ط§ظ„ط¥ظ†طھط±ظ†طھ -->
<uses-permission android:name="android.permission.INTERNET"/>

<!-- ط§ظ„ظ…ظˆظ‚ط¹ -->
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION"/>
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION"/>

<!-- ط§ظ„ظƒط§ظ…ظٹط±ط§ -->
<uses-permission android:name="android.permission.CAMERA"/>

<!-- ط§ظ„طھط®ط²ظٹظ† -->
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE"/>
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE"/>

<!-- ط§ظ„ط¨ظٹظˆظ…طھط±ظٹط§ -->
<uses-permission android:name="android.permission.USE_BIOMETRIC"/>
<uses-permission android:name="android.permission.USE_FINGERPRINT"/>
```

### ط·ظ„ط¨ ط§ظ„ط£ط°ظˆظ†ط§طھ ظپظٹ ط§ظ„طھط·ط¨ظٹظ‚

```dart
import 'package:permission_handler/permission_handler.dart';

// ط·ظ„ط¨ ط¥ط°ظ† ط§ظ„ظ…ظˆظ‚ط¹
final status = await Permission.location.request();
if (status.isGranted) {
  // ط§ظ„ط¥ط°ظ† ظ…ظ…ظ†ظˆط­
}

// ط·ظ„ط¨ ط¥ط°ظ† ط§ظ„ظƒط§ظ…ظٹط±ط§
final cameraStatus = await Permission.camera.request();
```

---

## ًں“ˆ ط§ظ„ط£ط¯ط§ط، ظˆط§ظ„طھط­ط³ظٹظ†ط§طھ

### 1. طھط­ط³ظٹظ† ط§ظ„ط¨ظ†ط§ط،

```bash
# ط¨ظ†ط§ط، ط³ط±ظٹط¹
flutter build apk --debug --split-per-abi

# ط¨ظ†ط§ط، ظ…ط­ط³ظ‘ظ†
flutter build apk --release --obfuscate --split-debug-info=./symbols
```

### 2. طھط­ظ„ظٹظ„ ط§ظ„ط£ط¯ط§ط،

```bash
# طھط´ط؛ظٹظ„ ظ…ط¹ طھط­ظ„ظٹظ„ ط§ظ„ط£ط¯ط§ط،
flutter run --profile

# طھط­ظ„ظٹظ„ ط­ط¬ظ… ط§ظ„طھط·ط¨ظٹظ‚
flutter build apk --analyze-size
```

### 3. ط§ط®طھط¨ط§ط± ط§ظ„ط£ط¯ط§ط،

```bash
# طھط´ط؛ظٹظ„ ط§ظ„ط§ط®طھط¨ط§ط±ط§طھ
flutter test

# ط§ط®طھط¨ط§ط±ط§طھ ط§ظ„طھظƒط§ظ…ظ„
flutter drive --target=test_driver/app.dart
```

---

## ًںڑ€ ظ†ط´ط± ط§ظ„طھط·ط¨ظٹظ‚

### ط¹ظ„ظ‰ Google Play Store

```bash
# 1. ط¨ظ†ط§ط، App Bundle
flutter build appbundle --release

# 2. ط§ظ„طھظˆظ‚ظٹط¹ ط§ظ„ط±ظ‚ظ…ظٹ (طھظ„ظ‚ط§ط¦ظٹ ط¥ط°ط§ ظƒط§ظ† key.properties ظ…ظˆط¬ظˆط¯)

# 3. ط±ظپط¹ ط¹ظ„ظ‰ Google Play Console
# - ط§ظ†طھظ‚ظ„ ط¥ظ„ظ‰ https://play.google.com/console
# - ط§ط®طھط± ط§ظ„طھط·ط¨ظٹظ‚
# - ط§ط®طھط± Release > Production
# - ط±ظپط¹ ط§ظ„ظ€ AAB
```

### ط¹ظ„ظ‰ ظ…طھط¬ط± طھط·ط¨ظٹظ‚ط§طھ ط¢ط®ط±

```bash
# ط¨ظ†ط§ط، APK ظ„ظ„طھظˆط²ظٹط¹
flutter build apk --release --split-per-abi

# ط§ظ„ظ†طھظٹط¬ط©:
# - app-armeabi-v7a-release.apk
# - app-arm64-v8a-release.apk
# - app-x86_64-release.apk
```

---

## ًں“‍ ط§ظ„ط¯ط¹ظ… ظˆط§ظ„ظ…ط³ط§ط¹ط¯ط©

### ط§ظ„ظ…ظˆط§ط±ط¯ ط§ظ„ظ…ظپظٹط¯ط©

- [Flutter Documentation](https://flutter.dev/docs)
- [Android Studio Help](https://developer.android.com/studio/intro)
- [Dart Language Guide](https://dart.dev/guides)
- [Firebase Documentation](https://firebase.google.com/docs)

### ط§ظ„ط£ظˆط§ظ…ط± ط§ظ„ظ…ظ‡ظ…ط©

```bash
# ظ…ط¹ظ„ظˆظ…ط§طھ ط§ظ„ظ†ط¸ط§ظ…
flutter doctor -v

# طھط­ط¯ظٹط« Flutter
flutter upgrade

# طھظ†ط¸ظٹظپ ط§ظ„ظ…ط´ط±ظˆط¹
flutter clean

# ط¥ط¹ط§ط¯ط© ط¨ظ†ط§ط، ط§ظ„ظ…ظ„ظپط§طھ ط§ظ„ظ…ظˆظ„ط¯ط©
flutter pub run build_runner build --delete-conflicting-outputs

# طھط´ط؛ظٹظ„ ط§ظ„ط§ط®طھط¨ط§ط±ط§طھ
flutter test

# طھط­ظ„ظٹظ„ ط§ظ„ظƒظˆط¯
flutter analyze
```

---

## âœ… ظ‚ط§ط¦ظ…ط© ط§ظ„طھط­ظ‚ظ‚ ظ‚ط¨ظ„ ط§ظ„ط¨ط¯ط،

- [ ] طھط«ط¨ظٹطھ Flutter SDK
- [ ] طھط«ط¨ظٹطھ Android Studio
- [ ] طھط«ط¨ظٹطھ Java JDK 11+
- [ ] طھط«ط¨ظٹطھ Android SDK (API 23+)
- [ ] طھط´ط؛ظٹظ„ `flutter doctor` ط¨ظ†ط¬ط§ط­
- [ ] ط¥ظ†ط´ط§ط، ط¬ظ‡ط§ط² ط§ظپطھط±ط§ط¶ظٹ
- [ ] طھط«ط¨ظٹطھ ط§ظ„ظ…طھط·ظ„ط¨ط§طھ: `flutter pub get`
- [ ] طھط´ط؛ظٹظ„ ط§ظ„طھط·ط¨ظٹظ‚: `flutter run`

---

**Status:** âœ… ط¬ط§ظ‡ط² ظ„ظ„طھط·ظˆظٹط± ظˆط§ظ„ط§ط®طھط¨ط§ط±

**ط¢ط®ط± طھط­ط¯ظٹط«:** 28 ط¯ظٹط³ظ…ط¨ط± 2025

