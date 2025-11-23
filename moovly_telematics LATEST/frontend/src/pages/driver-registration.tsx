import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  UserPlus, 
  Phone, 
  Mail, 
  CreditCard, 
  User,
  CheckCircle,
  Clock,
  RefreshCw,
  AlertCircle,
  MessageSquare
} from "lucide-react";

interface RegistrationData {
  name: string;
  email: string;
  phone: string;
  licenseNumber: string;
  idNumber: string;
}

interface RegistrationResponse {
  success: boolean;
  message: string;
  registrationToken?: string;
  driverId?: number;
}

interface OTPVerificationResponse {
  success: boolean;
  message: string;
  username?: string;
  pin?: string;
  loginInstructions?: string;
}

export default function DriverRegistrationPage() {
  const [formData, setFormData] = useState<RegistrationData>({
    name: "",
    email: "",
    phone: "",
    licenseNumber: "",
    idNumber: ""
  });
  
  const [loading, setLoading] = useState(false);
  const [registrationStep, setRegistrationStep] = useState<'form' | 'otp' | 'completed'>('form');
  const [registrationToken, setRegistrationToken] = useState<string>("");
  const [otpCode, setOtpCode] = useState("");
  const [driverCredentials, setDriverCredentials] = useState<{username: string, pin: string} | null>(null);
  const { toast } = useToast();

  const handleInputChange = (field: keyof RegistrationData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const formatPhoneNumber = (phone: string) => {
    // Ensure phone number starts with +27 for South Africa
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.startsWith('0')) {
      return '+27' + cleanPhone.substring(1);
    } else if (cleanPhone.startsWith('27')) {
      return '+' + cleanPhone;
    } else if (!cleanPhone.startsWith('+27')) {
      return '+27' + cleanPhone;
    }
    return phone;
  };

  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      toast({ title: "Error", description: "Driver name is required", variant: "destructive" });
      return false;
    }
    if (!formData.email.trim() || !formData.email.includes('@')) {
      toast({ title: "Error", description: "Valid email is required", variant: "destructive" });
      return false;
    }
    if (!formData.phone.trim()) {
      toast({ title: "Error", description: "Phone number is required", variant: "destructive" });
      return false;
    }
    if (!formData.licenseNumber.trim()) {
      toast({ title: "Error", description: "License number is required", variant: "destructive" });
      return false;
    }
    return true;
  };

  const handleRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);

    try {
      const formattedData = {
        ...formData,
        phone: formatPhoneNumber(formData.phone)
      };

      const response = await fetch("/api/drivers/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formattedData),
      });

      const data: RegistrationResponse = await response.json();

      if (data.success && data.registrationToken) {
        setRegistrationToken(data.registrationToken);
        setRegistrationStep('otp');
        toast({
          title: "Registration Initiated",
          description: `OTP sent to ${formattedData.phone}. Driver will receive verification code.`,
        });
      } else {
        toast({
          title: "Registration Failed",
          description: data.message || "Failed to register driver",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to register driver. Please try again.",
        variant: "destructive",
      });
    }
    setLoading(false);
  };

  const handleOTPVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!otpCode.trim()) {
      toast({ title: "Error", description: "OTP code is required", variant: "destructive" });
      return;
    }
    
    setLoading(true);

    try {
      const response = await fetch("/api/drivers/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          registrationToken,
          otpCode: otpCode.trim()
        }),
      });

      const data: OTPVerificationResponse = await response.json();

      if (data.success && data.username && data.pin) {
        setDriverCredentials({ username: data.username, pin: data.pin });
        setRegistrationStep('completed');
        toast({
          title: "Registration Completed",
          description: "Driver has been successfully registered and can now login!",
        });
      } else {
        toast({
          title: "Verification Failed",
          description: data.message || "Invalid OTP code",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to verify OTP. Please try again.",
        variant: "destructive",
      });
    }
    setLoading(false);
  };

  const handleResendOTP = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/drivers/resend-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ registrationToken }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "OTP Resent",
          description: "New verification code sent to driver's phone.",
        });
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to resend OTP",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to resend OTP. Please try again.",
        variant: "destructive",
      });
    }
    setLoading(false);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      phone: "",
      licenseNumber: "",
      idNumber: ""
    });
    setOtpCode("");
    setRegistrationToken("");
    setDriverCredentials(null);
    setRegistrationStep('form');
  };

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Driver Registration</h1>
        <p className="text-gray-600 dark:text-gray-400">Register new drivers with SMS OTP verification</p>
      </div>

      {registrationStep === 'form' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Driver Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleRegistration} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name" className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Full Name *
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="e.g. John Smith"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="email" className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email Address *
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="john.smith@example.com"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="phone" className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Cell Phone Number * 
                    <Badge variant="outline" className="text-xs">SMS OTP</Badge>
                  </Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="083 123 4567"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Required for SMS verification. Format: +27831234567
                  </p>
                </div>

                <div>
                  <Label htmlFor="licenseNumber" className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    License Number *
                  </Label>
                  <Input
                    id="licenseNumber"
                    value={formData.licenseNumber}
                    onChange={(e) => handleInputChange('licenseNumber', e.target.value)}
                    placeholder="123456789"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="idNumber">
                    ID Number (Optional)
                  </Label>
                  <Input
                    id="idNumber"
                    value={formData.idNumber}
                    onChange={(e) => handleInputChange('idNumber', e.target.value)}
                    placeholder="8001015009087"
                  />
                </div>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-2">SMS OTP Process:</h3>
                <ol className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                  <li>1. Driver receives 6-digit verification code via SMS</li>
                  <li>2. Driver enters OTP code to verify phone number</li>
                  <li>3. System generates 4-digit PIN for driver login</li>
                  <li>4. Driver can login with Username + PIN</li>
                </ol>
              </div>

              <Button type="submit" disabled={loading} className="w-full">
                {loading ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Sending OTP...
                  </>
                ) : (
                  <>
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Register Driver & Send OTP
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {registrationStep === 'otp' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              OTP Verification Required
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                <span className="font-medium text-yellow-800 dark:text-yellow-200">
                  Waiting for Driver Verification
                </span>
              </div>
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                SMS sent to {formData.phone}. Driver must enter the 6-digit code below to complete registration.
              </p>
            </div>

            <form onSubmit={handleOTPVerification}>
              <Label htmlFor="otpCode">6-Digit OTP Code (from SMS)</Label>
              <Input
                id="otpCode"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                placeholder="123456"
                maxLength={6}
                pattern="[0-9]{6}"
                className="text-center text-lg font-mono"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Driver should enter the code they received via SMS
              </p>

              <div className="flex gap-2 mt-4">
                <Button type="submit" disabled={loading || otpCode.length !== 6} className="flex-1">
                  {loading ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Verify OTP
                    </>
                  )}
                </Button>
                
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleResendOTP}
                  disabled={loading}
                >
                  {loading ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Resend OTP
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {registrationStep === 'completed' && driverCredentials && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-400">
              <CheckCircle className="h-5 w-5" />
              Registration Completed Successfully!
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
              <h3 className="font-medium text-green-900 dark:text-green-100 mb-3">
                Driver Login Credentials:
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-green-700 dark:text-green-300">Username:</span>
                  <Badge variant="secondary" className="font-mono">{driverCredentials.username}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-green-700 dark:text-green-300">4-Digit PIN:</span>
                  <Badge variant="secondary" className="font-mono text-lg">{driverCredentials.pin}</Badge>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                Instructions for Driver:
              </h3>
              <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                <li>• Use the username and PIN to login to the mobile app</li>
                <li>• Download the Moovly Driver app from the App Store</li>
                <li>• Keep the PIN secure and do not share with others</li>
                <li>• Contact support if login issues occur</li>
              </ul>
            </div>

            <Button onClick={resetForm} className="w-full">
              <UserPlus className="h-4 w-4 mr-2" />
              Register Another Driver
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <h3 className="font-medium mb-2">SMS Cost Information:</h3>
        <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
          <li>• Registration OTP: ~R0.10 per SMS</li>
          <li>• Estimated monthly cost for 100 drivers: R20-50</li>
          <li>• PIN is cached for 24-48 hours to reduce SMS frequency</li>
          <li>• Twilio SMS service provides reliable delivery</li>
        </ul>
      </div>
    </div>
  );
}