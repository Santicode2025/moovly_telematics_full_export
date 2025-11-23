import crypto from 'crypto';

// SMS Service Interface
export interface SMSService {
  sendOTP(phone: string, code: string): Promise<{ success: boolean; messageId?: string; error?: string }>;
  sendWelcome(phone: string, username: string): Promise<{ success: boolean; messageId?: string; error?: string }>;
}

// Mock SMS Service for Development
class MockSMSService implements SMSService {
  async sendOTP(phone: string, code: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
    console.log(`📱 SMS OTP to ${phone}: Your Moovly verification code is ${code}. Valid for 10 minutes.`);
    return {
      success: true,
      messageId: `mock_${Date.now()}`
    };
  }

  async sendWelcome(phone: string, username: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
    console.log(`📱 SMS Welcome to ${phone}: Welcome to Moovly ${username}! You can now login with your username and PIN.`);
    return {
      success: true,
      messageId: `mock_${Date.now()}`
    };
  }
}

// Twilio SMS Service (for production)
class TwilioSMSService implements SMSService {
  private accountSid: string;
  private authToken: string;
  private fromNumber: string;

  constructor(accountSid: string, authToken: string, fromNumber: string) {
    this.accountSid = accountSid;
    this.authToken = authToken;
    this.fromNumber = fromNumber;
  }

  async sendOTP(phone: string, code: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      // Import Twilio only when needed to avoid dependency issues in development
      const twilio = require('twilio');
      const client = twilio(this.accountSid, this.authToken);
      
      const message = await client.messages.create({
        body: `Your Moovly verification code is ${code}. Valid for 10 minutes. Do not share this code.`,
        from: this.fromNumber,
        to: phone
      });

      return {
        success: true,
        messageId: message.sid
      };
    } catch (error: any) {
      console.error('Twilio SMS Error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async sendWelcome(phone: string, username: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const twilio = require('twilio');
      const client = twilio(this.accountSid, this.authToken);
      
      const message = await client.messages.create({
        body: `Welcome to Moovly, ${username}! You can now login with your username and PIN. Download the driver app to get started.`,
        from: this.fromNumber,
        to: phone
      });

      return {
        success: true,
        messageId: message.sid
      };
    } catch (error: any) {
      console.error('Twilio SMS Error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

// OTP Utilities
export class OTPService {
  static generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
  }

  static generatePIN(): string {
    return Math.floor(1000 + Math.random() * 9000).toString(); // 4-digit PIN
  }

  static generateRegistrationToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  static hashPIN(pin: string): string {
    return crypto.createHash('sha256').update(pin).digest('hex');
  }

  static verifyPIN(pin: string, hashedPIN: string): boolean {
    return this.hashPIN(pin) === hashedPIN;
  }

  static isOTPExpired(expiresAt: Date): boolean {
    return new Date() > expiresAt;
  }

  static getOTPExpirationTime(): Date {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 10); // 10 minutes expiration
    return now;
  }
}

// SMS Service Factory
export function createSMSService(): SMSService {
  const isProduction = process.env.NODE_ENV === 'production';
  const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
  const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
  const twilioFromNumber = process.env.TWILIO_FROM_NUMBER;

  if (isProduction && twilioAccountSid && twilioAuthToken && twilioFromNumber) {
    console.log('🚀 Using Twilio SMS Service for production');
    return new TwilioSMSService(twilioAccountSid, twilioAuthToken, twilioFromNumber);
  } else {
    console.log('🔧 Using Mock SMS Service for development');
    return new MockSMSService();
  }
}

export const smsService = createSMSService();