#!/bin/bash

echo "🚀 Starting Moovly Mobile App for Expo Go Testing"
echo "==============================================="
echo ""
echo "✅ Expo Go app should be installed on your phone"
echo "✅ API configured for: https://e0dd98e0-3085-452b-9dbe-afdbdf6afbd5-00-2irv2xkbttdkj.janeway.replit.dev"
echo ""
echo "📱 Starting development server..."
echo "   Once QR code appears, scan it with Expo Go app"
echo ""

# Start Expo with LAN mode (more reliable than tunnel)
npx expo start --lan --port 19000