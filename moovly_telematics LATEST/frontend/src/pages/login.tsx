import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Truck, Eye, EyeOff, Shield, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { detectRegionFlag, initializeIPDetection } from "@/utils/regionUtils";
// Moovly logo as SVG to reduce bundle size
const MoovlyLogo = () => (
  <svg width="180" height="60" viewBox="0 0 180 60" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="180" height="60" rx="12" fill="#1e3a8a"/>
    <text x="90" y="38" fontFamily="Arial, sans-serif" fontSize="26" fontWeight="bold" fill="white" textAnchor="middle">Moovly</text>
  </svg>
);

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("admin");
  
  // Admin login state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  
  // Driver login state  
  const [driverUsername, setDriverUsername] = useState("");
  const [driverPin, setDriverPin] = useState("");
  const [driverRememberMe, setDriverRememberMe] = useState(false);
  
  const [flag, setFlag] = useState(detectRegionFlag());
  const { toast } = useToast();

  // Initialize IP-based geolocation detection
  useEffect(() => {
    const loadIPDetection = async () => {
      await initializeIPDetection();
      // Update flag after IP detection
      setFlag(detectRegionFlag());
    };
    
    loadIPDetection();
  }, []);

  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await apiRequest("POST", "/api/auth/login", {
        username: email,
        password: password,
      });

      toast({
        title: "Welcome to Moovly",
        description: "Successfully logged in to your fleet management dashboard.",
      });

      // Always stay on current domain until both domains are fully verified
      setLocation("/dashboard");
    } catch (error) {
      toast({
        title: "Login Failed",
        description: "Invalid email or password. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDriverSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await apiRequest("POST", "/api/driver/pin-login", {
        username: driverUsername,
        pin: driverPin,
      });

      toast({
        title: "Welcome Driver",
        description: "Successfully logged in to your mobile interface.",
      });

      // Redirect to mobile driver interface
      setLocation("/mobile");
    } catch (error) {
      toast({
        title: "Authentication Failed",
        description: "Invalid username or PIN. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-slate-200 py-8 px-4">

      <div className="max-w-lg mx-auto w-full space-y-10">
        {/* Login Header - Desktop First */}
        <div className="text-center">
          <div className="flex items-center justify-center space-x-6 mb-8">
            <MoovlyLogo />
            <span className="text-4xl">{flag}</span>
          </div>
          <h2 className="text-4xl font-bold text-gray-900">Sign in to your account</h2>
          <p className="mt-4 text-lg text-gray-600">Access your fleet management dashboard</p>
        </div>

        {/* Login Form - Desktop Sized */}
        <Card className="shadow-lg">
          <CardContent className="p-8">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-8">
                <TabsTrigger value="admin" className="flex items-center space-x-2">
                  <Shield className="w-4 h-4" />
                  <span>Admin Login</span>
                </TabsTrigger>
                <TabsTrigger value="driver" className="flex items-center space-x-2">
                  <User className="w-4 h-4" />
                  <span>Driver Login</span>
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="admin">
                <form className="space-y-8" onSubmit={handleAdminSubmit}>
              <div className="space-y-6">
                <div>
                  <Label htmlFor="email" className="block text-lg font-medium text-gray-700 mb-2">
                    Email address
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="w-full h-12 text-lg px-4"
                  />
                </div>
                <div>
                  <Label htmlFor="password" className="block text-lg font-medium text-gray-700 mb-2">
                    Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="w-full h-12 text-lg px-4 pr-12"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5 text-gray-400" />
                      ) : (
                        <Eye className="h-5 w-5 text-gray-400" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="remember-me"
                    checked={rememberMe}
                    onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                  />
                  <Label htmlFor="remember-me" className="text-lg text-gray-700">
                    Remember me
                  </Label>
                </div>
                <div className="text-lg">
                  <a href="#" className="font-medium text-primary hover:text-primary/80">
                    Forgot your password?
                  </a>
                </div>
              </div>

              <div>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-primary hover:bg-primary/90 h-12 text-lg"
                >
                  {isLoading ? "Signing in..." : "Sign in"}
                </Button>
              </div>

              <div className="text-center">
                <span className="text-lg text-gray-600">Don't have an account? </span>
                <a href="#" className="font-medium text-primary hover:text-primary/80 text-lg">
                  Contact sales
                </a>
              </div>
            </form>
          </TabsContent>
          
          <TabsContent value="driver">
            <form className="space-y-8" onSubmit={handleDriverSubmit}>
              <div className="space-y-6">
                <div>
                  <Label htmlFor="driver-username" className="block text-lg font-medium text-gray-700 mb-2">
                    Username
                  </Label>
                  <Input
                    id="driver-username"
                    name="username"
                    type="text"
                    required
                    value={driverUsername}
                    onChange={(e) => setDriverUsername(e.target.value)}
                    placeholder="Enter your username"
                    className="w-full h-12 text-lg px-4"
                  />
                </div>

                <div>
                  <Label htmlFor="driver-pin" className="block text-lg font-medium text-gray-700 mb-2">
                    PIN (4 digits)
                  </Label>
                  <Input
                    id="driver-pin"
                    name="pin"
                    type="password"
                    required
                    value={driverPin}
                    onChange={(e) => setDriverPin(e.target.value)}
                    placeholder="Enter your 4-digit PIN"
                    className="w-full h-12 text-lg px-4"
                    maxLength={4}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="driver-remember-me"
                    checked={driverRememberMe}
                    onCheckedChange={(checked) => setDriverRememberMe(checked as boolean)}
                  />
                  <Label htmlFor="driver-remember-me" className="text-lg text-gray-700">
                    Remember me
                  </Label>
                </div>
                <div className="text-lg">
                  <a href="#" className="font-medium text-primary hover:text-primary/80">
                    Forgot your PIN?
                  </a>
                </div>
              </div>

              <div>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-primary hover:bg-primary/90 h-12 text-lg"
                >
                  {isLoading ? "Signing in..." : "Sign in"}
                </Button>
              </div>

              <div className="text-center">
                <span className="text-lg text-gray-600">Need help? </span>
                <a href="#" className="font-medium text-primary hover:text-primary/80 text-lg">
                  Contact your administrator
                </a>
              </div>
            </form>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
      </div>
    </div>
  );
}
