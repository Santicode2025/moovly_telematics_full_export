import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Truck, User, Lock, RefreshCw } from "lucide-react";

interface LoginCredentials {
  username: string;
  pin: string;
}


export default function MobileLogin() {
  const [, setLocation] = useLocation();
  const [credentials, setCredentials] = useState<LoginCredentials>({ username: "", pin: "" });
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const { toast } = useToast();

  // Load saved preferences
  useEffect(() => {
    const savedCredentials = localStorage.getItem('saved_driver_credentials');
    const isRemembered = localStorage.getItem('remember_driver') === 'true';

    if (isRemembered && savedCredentials) {
      const parsed = JSON.parse(savedCredentials);
      setCredentials(parsed);
      setRememberMe(true);
    }
  }, []);



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
          pin: credentials.pin
        })
      });

      const data = await response.json();

      if (data.success && data.driver) {
        // Save credentials if remember me is checked
        if (rememberMe) {
          localStorage.setItem('saved_driver_credentials', JSON.stringify(credentials));
          localStorage.setItem('remember_driver', 'true');
        } else {
          localStorage.removeItem('saved_driver_credentials');
          localStorage.removeItem('remember_driver');
        }

        // Save driver session AND authentication token
        localStorage.setItem('mobileDriver', JSON.stringify(data.driver));
        localStorage.setItem('mobileAuthToken', data.token);
        localStorage.setItem('authenticated', 'true');

        toast({
          title: "Welcome to Moovly Connect!",
          description: `Logged in as ${data.driver.name}`,
        });

        // Redirect immediately to driver interface
        setLocation('/mobile-driver');
        
      } else {
        toast({
          title: "Login Failed",
          description: data.message || "Invalid username or PIN",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Connection Error",
        description: "Unable to connect to server. Please try again.",
        variant: "destructive"
      });
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6">
        {/* Logo and Title */}
        <div className="text-center space-y-4">
          <div className="mx-auto w-20 h-20 bg-blue-600 rounded-2xl shadow-lg flex items-center justify-center">
            <Truck className="w-10 h-10 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Moovly Connect</h1>
            <p className="text-gray-600">Driver Mobile App</p>
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username" className="text-gray-700 font-medium">Username</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                id="username"
                value={credentials.username}
                onChange={(e) => setCredentials(prev => ({ ...prev, username: e.target.value }))}
                placeholder="Enter your username"
                className="pl-10 h-12 border-2 border-gray-300 rounded-lg"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="pin" className="text-gray-700 font-medium">PIN</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                id="pin"
                type="password"
                inputMode="numeric"
                pattern="[0-9]{4}"
                maxLength={4}
                value={credentials.pin}
                onChange={(e) => setCredentials(prev => ({ ...prev, pin: e.target.value.replace(/\D/g, '') }))}
                placeholder="4-digit PIN"
                className="pl-10 h-12 border-2 border-gray-300 rounded-lg"
                required
              />
            </div>
          </div>

          {/* Remember Me Switch */}
          <div className="flex items-center justify-between py-2">
            <Label htmlFor="remember" className="text-gray-700 font-medium">
              Remember Me
            </Label>
            <Switch 
              id="remember" 
              checked={rememberMe}
              onCheckedChange={setRememberMe}
            />
          </div>

          <Button 
            type="submit"
            disabled={loading || !credentials.username || credentials.pin.length !== 4}
            className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg"
          >
            {loading ? (
              <>
                <RefreshCw className="mr-2 h-5 w-5 animate-spin" />
                Signing In...
              </>
            ) : (
              'Login'
            )}
          </Button>
        </form>

        <div className="text-center text-sm text-gray-500">
          Need help? Contact your dispatcher
        </div>
      </div>

    </div>
  );
}