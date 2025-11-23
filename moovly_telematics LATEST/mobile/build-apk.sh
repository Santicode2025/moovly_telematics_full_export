#!/bin/bash

echo "🚀 Building Moovly Driver App APK for Testing..."

# Check if we're in the right directory
if [ ! -f "app.json" ]; then
    echo "❌ Error: app.json not found. Please run this script from the mobile-app directory."
    exit 1
fi

# Install dependencies if needed
echo "📦 Installing dependencies..."
npm install

# Pre-build for React Native
echo "🔧 Running Expo prebuild..."
npx expo prebuild --platform android

# Check if android directory exists
if [ ! -d "android" ]; then
    echo "❌ Error: Android directory not created. Prebuild may have failed."
    exit 1
fi

# Navigate to android directory and build APK
echo "🏗️ Building APK with Gradle..."
cd android

# Clean previous builds
./gradlew clean

# Build release APK
./gradlew assembleRelease

# Check if APK was created
APK_PATH="app/build/outputs/apk/release/app-release.apk"
if [ -f "$APK_PATH" ]; then
    echo "✅ APK built successfully!"
    echo "📱 APK Location: android/$APK_PATH"
    
    # Copy APK to root directory for easy access
    cp "$APK_PATH" "../moovly-driver-app.apk"
    echo "📂 APK copied to: moovly-driver-app.apk"
    
    # Show APK info
    APK_SIZE=$(du -h "../moovly-driver-app.apk" | cut -f1)
    echo "📊 APK Size: $APK_SIZE"
    
    echo ""
    echo "🎉 Build Complete!"
    echo "You can now install the APK on your Android device:"
    echo "1. Copy moovly-driver-app.apk to your device"
    echo "2. Enable 'Install from Unknown Sources' in Settings"
    echo "3. Tap the APK file to install"
    echo ""
    echo "🧪 Test Features:"
    echo "- Driver login with PIN authentication"
    echo "- Camera functionality for fuel receipts"
    echo "- Job management and tracking"
    echo "- Real-time messaging"
    echo "- Vehicle checklist with photos"
    
else
    echo "❌ Error: APK build failed. Check the logs above for details."
    exit 1
fi