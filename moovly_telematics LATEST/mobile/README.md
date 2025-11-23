# Moovly Driver Mobile App - React Native

## Overview

This is the React Native conversion of the Moovly Driver mobile application, designed for deployment to iOS App Store and Google Play Store. The app provides drivers with comprehensive fleet management tools including job management, fuel tracking, vehicle checklists, MoovScore performance monitoring, and real-time messaging.

## Key Features

### Core Functionality
- **Driver Authentication**: Secure login with session management
- **Job Management**: View assigned jobs, start/complete tasks, break mode
- **Fuel Upload**: Advanced fuel entry with three-photo requirement (odometer, fuel slip, pump station)
- **Vehicle Checklist**: Comprehensive pre-trip inspections with progress tracking
- **MoovScore Tracking**: Driver performance monitoring with detailed metrics
- **Real-time Messaging**: Communication with dispatch and fleet managers

### Advanced Features
- **Camera Integration**: Native camera access for fuel receipts and vehicle inspections
- **Offline Capability**: Local data storage with automatic sync when connected
- **GPS Integration**: Location tracking for job completion and route optimization
- **Push Notifications**: Real-time alerts for job assignments and messages
- **Professional UI**: Material Design with Moovly branding

## Project Structure

```
mobile-app/
├── App.tsx                          # Main app component with navigation
├── src/
│   ├── screens/                     # All app screens
│   │   ├── LoginScreen.tsx          # Driver authentication
│   │   ├── JobsScreen.tsx           # Job management and break mode
│   │   ├── FuelUploadScreen.tsx     # Fuel entry with camera
│   │   ├── MoovScoreScreen.tsx      # Performance metrics
│   │   ├── VehicleScreen.tsx        # Vehicle info and quick actions
│   │   ├── MessagesScreen.tsx       # Real-time messaging
│   │   └── ChecklistScreen.tsx      # Vehicle inspections
│   ├── services/
│   │   ├── AuthContext.tsx          # Authentication state management
│   │   └── ApiService.ts            # API connectivity and offline sync
│   └── components/                  # Reusable UI components
├── package.json                     # Dependencies and scripts
├── app.json                         # Expo configuration
├── tsconfig.json                    # TypeScript configuration
└── babel.config.js                  # Babel configuration
```

## Technology Stack

### Core Framework
- **React Native**: 0.73.4 - Cross-platform mobile development
- **Expo**: ~50.0.6 - Development platform and build tools
- **TypeScript**: ^5.1.3 - Type safety and enhanced development

### Navigation & State Management
- **React Navigation**: 6.x - Screen navigation and routing
- **TanStack Query**: ^5.17.15 - Server state management and caching
- **Async Storage**: Local data persistence
- **Secure Store**: Secure token storage

### UI & Design
- **React Native Paper**: Material Design components
- **Expo Vector Icons**: Comprehensive icon library
- **React Native Reanimated**: Smooth animations
- **React Native Safe Area Context**: Safe area handling

### Device Integration
- **Expo Camera**: Native camera access for photos
- **Expo Location**: GPS tracking and geolocation
- **Expo Notifications**: Push notification handling
- **Expo Media Library**: Photo storage management

## Installation & Setup

### Prerequisites
- Node.js 18+ 
- Expo CLI (`npm install -g @expo/cli`)
- iOS Simulator (macOS) or Android Studio
- Physical device for testing camera/GPS features

### Development Setup

1. **Install Dependencies**
   ```bash
   cd mobile-app
   npm install
   ```

2. **Configure API Endpoint**
   Update `src/services/ApiService.ts` with your backend URL:
   ```typescript
   this.baseURL = __DEV__ 
     ? 'https://your-replit-url.replit.dev'
     : 'https://moovlytelematics.com';
   ```

3. **Start Development Server**
   ```bash
   npm start
   ```

4. **Run on Device/Simulator**
   ```bash
   # iOS Simulator
   npm run ios
   
   # Android Emulator/Device
   npm run android
   
   # Expo Go (Development)
   # Scan QR code from terminal
   ```

## Building for Production

### EAS Build Setup

1. **Install EAS CLI**
   ```bash
   npm install -g eas-cli
   ```

2. **Configure EAS Project**
   ```bash
   eas login
   eas build:configure
   ```

3. **Build for App Stores**
   ```bash
   # iOS App Store
   eas build --platform ios --profile production
   
   # Google Play Store
   eas build --platform android --profile production
   ```

### Build Profiles (eas.json)
```json
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "autoIncrement": true
    }
  },
  "submit": {
    "production": {}
  }
}
```

## App Store Deployment

### iOS App Store

1. **Prepare Assets**
   - App icon (1024x1024)
   - Launch screen images
   - App Store screenshots

2. **Build and Submit**
   ```bash
   eas build --platform ios --profile production
   eas submit --platform ios
   ```

3. **App Store Connect**
   - Complete app metadata
   - Set pricing and availability
   - Submit for review

### Google Play Store

1. **Prepare Assets**
   - App icon (512x512)
   - Feature graphic (1024x500)
   - Screenshots for different devices

2. **Build and Submit**
   ```bash
   eas build --platform android --profile production
   eas submit --platform android
   ```

3. **Google Play Console**
   - Upload APK/AAB
   - Complete store listing
   - Set content rating
   - Release to production

## Environment Configuration

### Development
- Uses Expo Go for testing
- Hot reloading enabled
- Debug mode active

### Production
- Standalone app builds
- Optimized performance
- Crash reporting enabled

## API Integration

### Authentication
- Secure token-based authentication
- Automatic token refresh
- Offline session persistence

### Data Synchronization
- Real-time data updates
- Offline-first architecture
- Automatic sync when connected
- Conflict resolution for offline data

### Camera & Media
- Native camera integration
- Photo compression and upload
- Local storage for offline mode
- Automatic cloud sync

## Performance Optimization

### Bundle Size
- Code splitting for large components
- Tree shaking for unused code
- Image optimization
- Lazy loading for heavy screens

### Memory Management
- Efficient image handling
- Proper cleanup of listeners
- Optimized re-renders
- Background task management

## Testing Strategy

### Development Testing
- Expo Go for rapid iteration
- Physical device testing for camera/GPS
- iOS Simulator and Android Emulator
- Network condition testing (offline/slow)

### Pre-Production Testing
- TestFlight (iOS) for beta testing
- Internal testing track (Android)
- Performance profiling
- Battery usage optimization

## Deployment Timeline

### Phase 1: Development Complete ✅
- React Native app structure
- All core screens implemented
- API integration completed
- Camera and offline functionality

### Phase 2: Testing & Optimization (Next 2-3 weeks)
- Comprehensive device testing
- Performance optimization
- Bug fixes and improvements
- Store asset preparation

### Phase 3: Store Submission (Following 1-2 weeks)
- iOS App Store submission
- Google Play Store submission
- Review process management
- Launch coordination

### Phase 4: Production Release (2-4 weeks total)
- App store approval
- Production deployment
- User onboarding
- Support and monitoring

## Demo Credentials

**Driver Login:**
- Email: john.smith@moovly.com
- Password: password123

## Support & Maintenance

### Monitoring
- Crash reporting via Expo/Sentry
- Performance metrics
- User analytics
- API endpoint monitoring

### Updates
- Over-the-air updates via Expo Updates
- App store updates for major changes
- Automated testing pipeline
- Continuous integration

## Security Features

- Secure token storage
- API request encryption
- Photo encryption for sensitive data
- Secure offline data storage
- Automatic session timeout

## Compliance

- App Store Review Guidelines compliance
- Google Play Policy compliance
- GDPR data protection
- Industry-standard security practices

---

**Next Steps:**
1. Install Expo CLI and dependencies
2. Configure backend API endpoints
3. Test on physical devices
4. Prepare app store assets
5. Submit for store review

This React Native conversion provides a professional, native mobile experience ready for App Store and Google Play deployment.