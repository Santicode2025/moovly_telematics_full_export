const { execSync } = require('child_process');

console.log('Building APK with simple approach...');

try {
  // Use Expo's legacy build service (still works for APKs)
  console.log('Starting build...');
  execSync('npx expo build:android --type apk --no-wait', { 
    stdio: 'inherit',
    cwd: __dirname
  });
  
  console.log('Build started! Check Expo dashboard for download link.');
  
} catch (error) {
  console.log('Trying alternative build method...');
  
  // Alternative: Use eas build
  try {
    execSync('npx eas build --platform android --profile preview --non-interactive', { 
      stdio: 'inherit',
      cwd: __dirname
    });
  } catch (easError) {
    console.log('Build requires authentication. Follow these steps:');
    console.log('1. Run: npx expo login');
    console.log('2. Run: npx eas build --platform android --profile preview');
    console.log('3. Download APK from link provided');
  }
}