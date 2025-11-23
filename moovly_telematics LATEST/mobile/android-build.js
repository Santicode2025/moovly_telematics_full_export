const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function buildAPK() {
  console.log('🚀 Building Moovly Driver APK...\n');
  
  try {
    // Step 1: Install dependencies
    console.log('📦 Installing dependencies...');
    execSync('npm install', { stdio: 'inherit' });
    
    // Step 2: Generate native code
    console.log('🔧 Generating Android native code...');
    execSync('npx expo prebuild --platform android --clear', { 
      stdio: 'inherit',
      timeout: 120000 
    });
    
    // Step 3: Build APK
    if (fs.existsSync('./android')) {
      console.log('📱 Building release APK...');
      process.chdir('./android');
      
      // Make gradlew executable
      execSync('chmod +x ./gradlew', { stdio: 'inherit' });
      
      // Clean and build
      execSync('./gradlew clean', { stdio: 'inherit' });
      execSync('./gradlew assembleRelease', { 
        stdio: 'inherit',
        timeout: 300000 
      });
      
      // Copy APK
      const apkPath = './app/build/outputs/apk/release/app-release.apk';
      if (fs.existsSync(apkPath)) {
        fs.copyFileSync(apkPath, '../moovly-driver-app.apk');
        console.log('\n✅ APK built successfully!');
        console.log('📱 Location: moovly-driver-app.apk');
        console.log('\n🎯 Test with credentials:');
        console.log('   Username: test.driver.smith');
        console.log('   PIN: 4133');
      }
    }
    
  } catch (error) {
    console.error('❌ Build failed:', error.message);
    console.log('\n💡 Try running these commands manually:');
    console.log('1. cd mobile-app');
    console.log('2. npm install');
    console.log('3. npx expo prebuild --platform android');
    console.log('4. cd android && ./gradlew assembleRelease');
  }
}

buildAPK();