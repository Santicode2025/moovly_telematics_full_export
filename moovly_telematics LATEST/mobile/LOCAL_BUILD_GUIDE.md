# Moovly Driver App - Local APK Build Guide

## Quick Start - Production APK Build

Since EAS Build requires authentication and cloud services, here's how to create a local APK for testing:

### Option 1: Expo Development Build (Recommended for Testing)

```bash
# Navigate to mobile app directory
cd mobile-app

# Install dependencies
npm install

# Create development build APK
npx expo run:android --device

# OR build APK directly
npx expo build:android --type apk
```

### Option 2: Manual React Native Build

```bash
# Generate native code
npx expo prebuild --platform android

# Build APK with Gradle
cd android
./gradlew assembleRelease

# APK will be at: android/app/build/outputs/apk/release/app-release.apk
```

## APK Testing Features

The generated APK will include all production features:

### ✅ Authentication System
- PIN-based driver login
- Username: `test.driver.smith`
- PIN: `4133`
- Session management with remember me

### ✅ Camera Integration
- Fuel receipt capture (3 photos required)
- Vehicle checklist photos
- Image compression and upload
- Offline storage with sync

### ✅ Core Driver Features
- Job assignment and tracking
- Real-time messaging
- MoovScore performance tracking
- Vehicle management
- Break mode toggle

### ✅ Offline Functionality
- Local data storage
- Sync when connected
- Works without internet for basic functions

## Installation Instructions

1. **Enable Unknown Sources**
   - Settings → Security → Unknown Sources (Enable)
   - Or Settings → Apps → Special Access → Install Unknown Apps

2. **Install APK**
   - Copy APK file to Android device
   - Tap file to install
   - Grant necessary permissions

3. **Test Login**
   - Open Moovly Driver app
   - Enter: `test.driver.smith`
   - PIN: `4133`

## Permissions Required

The app requests these permissions:
- 📷 Camera (for fuel receipts & vehicle photos)
- 📱 Storage (for offline data)
- 🌐 Network (for sync & messaging)
- 📍 Location (for GPS tracking)

## Build Configuration

The APK is configured with:
- Bundle ID: `com.moovly.driverapp`
- Version: Auto-incremented
- Target SDK: Android 14 (API 34)
- Min SDK: Android 6.0 (API 23)
- Architecture: Universal (ARM64 + x86)

## Troubleshooting

### Build Errors
- Ensure Node.js 18+ is installed
- Run `npm install` first
- Clear Metro cache: `npx expo start --clear`

### Installation Issues
- Check Android version (6.0+)
- Verify unknown sources enabled
- Try reinstalling if app crashes

### Login Problems
- Verify internet connection for first login
- Use exact credentials: `test.driver.smith` / `4133`
- Clear app data if login fails repeatedly

## Production Deployment

For App Store/Play Store deployment:
1. Use EAS Build with proper certificates
2. Configure signing keys
3. Submit through respective stores
4. This local APK is for testing only

---

📱 **Ready to Test**: The local APK provides full functionality for comprehensive testing before store submission.