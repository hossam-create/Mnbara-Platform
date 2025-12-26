#!/bin/bash

# 📱 Mnbara Flutter App Update Script
# Usage: ./scripts/update-flutter.sh [platform] [version]
# Example: ./scripts/update-flutter.sh android 3.3.0

set -e

PLATFORM=$1
VERSION=$2

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${GREEN}📱 Mnbara Flutter App Update Script${NC}"
echo "====================================="

if [ -z "$PLATFORM" ] || [ -z "$VERSION" ]; then
    echo -e "${RED}❌ Usage: ./update-flutter.sh [platform] [version]${NC}"
    echo "Platforms: android, ios, both"
    exit 1
fi

cd mobile/flutter_app

# Step 1: Update version in pubspec.yaml
echo -e "\n${YELLOW}1️⃣ Updating version to $VERSION...${NC}"
# Version format: 3.3.0+33 (version+buildNumber)
BUILD_NUMBER=$(echo $VERSION | tr -d '.')
sed -i "s/version: .*/version: $VERSION+$BUILD_NUMBER/" pubspec.yaml
echo -e "${GREEN}✅ Version updated${NC}"

# Step 2: Get dependencies
echo -e "\n${YELLOW}2️⃣ Getting dependencies...${NC}"
flutter pub get
echo -e "${GREEN}✅ Dependencies updated${NC}"

# Step 3: Run tests
echo -e "\n${YELLOW}3️⃣ Running tests...${NC}"
flutter test || { echo -e "${RED}❌ Tests failed!${NC}"; exit 1; }
echo -e "${GREEN}✅ Tests passed${NC}"

# Step 4: Build
if [ "$PLATFORM" == "android" ] || [ "$PLATFORM" == "both" ]; then
    echo -e "\n${YELLOW}4️⃣ Building Android...${NC}"
    flutter build appbundle --release
    flutter build apk --release
    echo -e "${GREEN}✅ Android build complete${NC}"
    echo -e "${BLUE}📁 APK: build/app/outputs/flutter-apk/app-release.apk${NC}"
    echo -e "${BLUE}📁 AAB: build/app/outputs/bundle/release/app-release.aab${NC}"
fi

if [ "$PLATFORM" == "ios" ] || [ "$PLATFORM" == "both" ]; then
    echo -e "\n${YELLOW}4️⃣ Building iOS...${NC}"
    flutter build ios --release
    echo -e "${GREEN}✅ iOS build complete${NC}"
    echo -e "${BLUE}📁 Open Xcode to archive and upload to App Store${NC}"
fi

echo -e "\n${GREEN}🎉 Flutter build complete!${NC}"
echo ""
echo -e "${YELLOW}📤 Next steps:${NC}"
echo "  Android: Upload AAB to Google Play Console"
echo "  iOS: Archive in Xcode → Upload to App Store Connect"
