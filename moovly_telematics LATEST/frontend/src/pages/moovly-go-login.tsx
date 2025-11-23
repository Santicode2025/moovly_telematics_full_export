import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Package, LogIn, User, Lock, HelpCircle } from "lucide-react";

export default function MoovlyGoLogin() {
  const [, setLocation] = useLocation();
  const [credentials, setCredentials] = useState({ username: "", pin: "" });
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!credentials.username || !credentials.pin) {
      toast({
        title: "Missing Information",
        description: "Please enter both username and PIN",
        variant: "destructive"
      });
      return;
    }

    if (credentials.pin.length !== 4) {
      toast({
        title: "Invalid PIN",
        description: "PIN must be exactly 4 digits",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/drivers/mobile-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: credentials.username,
          pin: credentials.pin,
          appMode: 'go'
        })
      });

      const result = await response.json();

      if (response.ok && result.success) {
        // Save credentials if remember me is checked
        if (rememberMe) {
          localStorage.setItem('moovly_go_credentials', JSON.stringify(credentials));
          localStorage.setItem('remember_moovly_go', 'true');
        } else {
          localStorage.removeItem('moovly_go_credentials');
          localStorage.removeItem('remember_moovly_go');
        }

        toast({
          title: "Welcome to Moovly Go!",
          description: "Successfully logged in to delivery optimization system",
        });

        // Store authentication data in localStorage for mobile-driver page
        localStorage.setItem('mobileDriver', JSON.stringify({
          ...result.driver,
          appMode: 'go'  // Ensure appMode is set for Moovly Go users
        }));
        localStorage.setItem('authenticated', 'true');
        localStorage.setItem('loginTimestamp', Date.now().toString());
        
        // Redirect to mobile driver interface (will show Moovly Go interface)
        setLocation('/mobile-driver');
      } else {
        toast({
          title: "Login Failed",
          description: result.message || "Invalid username or PIN",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Connection Error",
        description: "Unable to connect to server. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPin = () => {
    toast({
      title: "PIN Reset Request",
      description: "Please contact your dispatch coordinator for PIN reset assistance.",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-600 to-cyan-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-2xl border-slate-200">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto mb-4 w-20 h-20 bg-teal-600 rounded-2xl flex items-center justify-center shadow-lg">
            <Package className="w-10 h-10 text-white" />
          </div>
          <div>
            <CardTitle className="text-3xl font-bold text-teal-800 mb-2">
              Moovly Go
            </CardTitle>
            <p className="text-slate-600 text-lg">
              Smart Delivery Login
            </p>
          </div>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-slate-700 mb-1">
                <User className="w-4 h-4" />
                <span className="text-sm font-medium">Username</span>
              </div>
              <Input
                type="text"
                placeholder="courier.driver"
                value={credentials.username}
                onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
                required
                className="h-12 text-lg"
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-slate-700 mb-1">
                <Lock className="w-4 h-4" />
                <span className="text-sm font-medium">4-Digit PIN</span>
              </div>
              <Input
                type="password"
                placeholder="••••"
                maxLength={4}
                value={credentials.pin}
                onChange={(e) => setCredentials({ ...credentials, pin: e.target.value.replace(/\D/g, '').slice(0, 4) })}
                required
                className="h-12 text-lg text-center tracking-widest"
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="remember"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="rounded border-slate-300"
              />
              <label htmlFor="remember" className="text-sm text-slate-600">
                Remember my credentials
              </label>
            </div>
            
            <Button 
              type="submit" 
              className="w-full h-12 bg-teal-600 hover:bg-teal-700 text-lg font-semibold"
              disabled={loading}
            >
              <LogIn className="w-5 h-5 mr-2" />
              {loading ? "Signing In..." : "Sign In to Moovly Go"}
            </Button>
            
            <div className="text-center">
              <Button 
                type="button"
                variant="ghost"
                className="text-teal-600 hover:text-teal-800 text-sm"
                onClick={handleForgotPin}
                disabled={!credentials.username || loading}
              >
                <HelpCircle className="w-4 h-4 mr-1" />
                Forgot PIN? Contact Dispatch
              </Button>
            </div>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-200">
            <div className="text-center text-sm text-slate-500">
              <p className="font-medium mb-2">Test Credentials</p>
              <p><strong>Go:</strong> courier.driver / PIN: 5678</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}