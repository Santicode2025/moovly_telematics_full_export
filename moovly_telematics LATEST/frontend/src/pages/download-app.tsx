import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Smartphone, QrCode, Info } from "lucide-react";

export default function DownloadAppPage() {
  const [buildStatus, setBuildStatus] = useState<'ready' | 'building' | 'error'>('ready');

  const startBuild = async () => {
    setBuildStatus('building');
    try {
      const response = await fetch('/api/build-apk', {
        method: 'POST',
      });
      const data = await response.json();
      
      if (data.success) {
        // APK is ready for download
        window.location.href = '/download/moovly-driver-app.apk';
      } else {
        setBuildStatus('error');
      }
    } catch (error) {
      setBuildStatus('error');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-blue-900 mb-2">Moovly Driver App</h1>
          <p className="text-blue-700">Download the mobile app for Android testing</p>
        </div>

        <div className="grid gap-6">
          {/* Download Options */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Download className="w-5 h-5 mr-2" />
                Download APK for Testing
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                <h3 className="font-semibold text-amber-900 mb-2">Option 1: Direct APK Download</h3>
                <p className="text-sm text-amber-700 mb-4">
                  APK generation requires local development environment. Cloud building needs authentication setup.
                </p>
                <div className="bg-amber-100 p-3 rounded border border-amber-300 mb-4">
                  <p className="text-xs text-amber-800">
                    <strong>To build APK locally:</strong><br/>
                    1. Download project to your computer<br/>
                    2. Install Android Studio<br/>
                    3. Run: <code>npx expo prebuild --platform android</code><br/>
                    4. Build: <code>cd android && ./gradlew assembleRelease</code>
                  </p>
                </div>
                <Button 
                  onClick={startBuild}
                  disabled={buildStatus === 'building'}
                  className="w-full bg-amber-600 hover:bg-amber-700"
                >
                  {buildStatus === 'building' ? (
                    <div className="flex items-center">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Checking Build Status...
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <Info className="w-4 h-4 mr-2" />
                      Check Build Options
                    </div>
                  )}
                </Button>
              </div>

              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="font-semibold text-green-900 mb-2">Option 2: Expo Go (Recommended)</h3>
                <p className="text-sm text-green-700 mb-4">
                  Install Expo Go from Play Store, then scan QR code for instant testing.
                </p>
                
                {/* QR Code Display */}
                <div className="bg-white p-4 rounded-lg border-2 border-green-200 mb-4">
                  <div className="text-center">
                    <div className="mx-auto w-48 h-48 bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center mb-3">
                      <div className="text-center">
                        <QrCode className="w-12 h-12 mx-auto text-gray-400 mb-2" />
                        <p className="text-sm text-gray-500">QR Code</p>
                        <p className="text-xs text-gray-400">Run 'npx expo start'</p>
                        <p className="text-xs text-gray-400">in mobile-app folder</p>
                      </div>
                    </div>
                    <p className="text-xs text-green-700">
                      <strong>Instructions:</strong><br/>
                      1. Open terminal in mobile-app folder<br/>
                      2. Run: <code className="bg-gray-200 px-1 rounded">npx expo start</code><br/>
                      3. Scan QR code with Expo Go app
                    </p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Button 
                    variant="outline" 
                    className="w-full border-green-600 text-green-700 hover:bg-green-50"
                    onClick={() => window.open('https://play.google.com/store/apps/details?id=host.exp.exponent', '_blank')}
                  >
                    <Smartphone className="w-4 h-4 mr-2" />
                    Install Expo Go from Play Store
                  </Button>
                </div>
              </div>

              <div className="bg-yellow-50 p-4 rounded-lg">
                <h3 className="font-semibold text-yellow-900 mb-2">Option 3: Mobile Web (Instant)</h3>
                <p className="text-sm text-yellow-700 mb-4">
                  Test most features immediately in your phone browser.
                </p>
                <Button 
                  variant="outline" 
                  className="w-full border-yellow-600 text-yellow-700 hover:bg-yellow-50"
                  onClick={() => window.location.href = '/mobile'}
                >
                  <Smartphone className="w-4 h-4 mr-2" />
                  Open Mobile Interface
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Test Credentials */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Info className="w-5 h-5 mr-2" />
                Test Credentials
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="space-y-2">
                  <div>
                    <span className="font-semibold">Username:</span>
                    <code className="ml-2 bg-gray-200 px-2 py-1 rounded">test.driver.smith</code>
                  </div>
                  <div>
                    <span className="font-semibold">PIN:</span>
                    <code className="ml-2 bg-gray-200 px-2 py-1 rounded">4133</code>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Installation Instructions */}
          <Card>
            <CardHeader>
              <CardTitle>Installation Instructions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="font-semibold">1. Download APK</span>
                  <p className="text-gray-600">Tap "Generate & Download APK" button above</p>
                </div>
                <div>
                  <span className="font-semibold">2. Enable Unknown Sources</span>
                  <p className="text-gray-600">Settings → Security → Install from Unknown Sources</p>
                </div>
                <div>
                  <span className="font-semibold">3. Install App</span>
                  <p className="text-gray-600">Tap the downloaded APK file to install</p>
                </div>
                <div>
                  <span className="font-semibold">4. Test Login</span>
                  <p className="text-gray-600">Use credentials above to sign in</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}