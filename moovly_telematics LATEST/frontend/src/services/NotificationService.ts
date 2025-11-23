import { apiRequest } from "@/lib/queryClient";

interface NotificationSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export class NotificationService {
  private static swRegistration: ServiceWorkerRegistration | null = null;
  private static vapidPublicKey: string | null = null;
  
  // Initialize the notification service
  static async initialize(): Promise<boolean> {
    if (!('serviceWorker' in navigator)) {
      console.warn('Service Worker not supported');
      return false;
    }
    
    if (!('PushManager' in window)) {
      console.warn('Push messaging not supported');
      return false;
    }
    
    try {
      // Register service worker
      this.swRegistration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker registered successfully');
      
      // Get VAPID public key from server
      const response = await apiRequest('GET', '/api/push/vapid-public-key');
      this.vapidPublicKey = response.publicKey;
      
      return true;
    } catch (error) {
      console.error('Failed to initialize notification service:', error);
      return false;
    }
  }
  
  // Request notification permission
  static async requestPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications');
      return 'denied';
    }
    
    if (Notification.permission === 'granted') {
      return 'granted';
    }
    
    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission;
    }
    
    return Notification.permission;
  }
  
  // Subscribe to push notifications (requires authentication token)
  static async subscribe(authToken: string): Promise<boolean> {
    if (!this.swRegistration || !this.vapidPublicKey) {
      console.error('Service not initialized');
      return false;
    }
    
    try {
      const permission = await this.requestPermission();
      if (permission !== 'granted') {
        console.warn('Notification permission not granted');
        return false;
      }
      
      // Check if already subscribed
      let subscription = await this.swRegistration.pushManager.getSubscription();
      
      if (!subscription) {
        // Create new subscription
        subscription = await this.swRegistration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: this.urlBase64ToUint8Array(this.vapidPublicKey)
        });
      }
      
      // Send subscription to server with authentication
      const response = await fetch('/api/mobile/push/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          subscription: subscription.toJSON()
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Subscription failed');
      }
      
      console.log('Successfully subscribed to push notifications');
      return true;
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error);
      return false;
    }
  }
  
  // Unsubscribe from push notifications (requires authentication token)
  static async unsubscribe(authToken: string): Promise<boolean> {
    if (!this.swRegistration) {
      return false;
    }
    
    try {
      const subscription = await this.swRegistration.pushManager.getSubscription();
      
      if (subscription) {
        await subscription.unsubscribe();
      }
      
      // Remove subscription from server with authentication
      const response = await fetch('/api/mobile/push/unsubscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Unsubscribe failed');
      }
      
      console.log('Successfully unsubscribed from push notifications');
      return true;
    } catch (error) {
      console.error('Failed to unsubscribe from push notifications:', error);
      return false;
    }
  }
  
  // Send test notification (requires authentication token)
  static async sendTestNotification(authToken: string, title?: string, body?: string): Promise<boolean> {
    try {
      const response = await fetch('/api/mobile/push/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          title,
          body
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Test notification failed');
      }
      
      return true;
    } catch (error) {
      console.error('Failed to send test notification:', error);
      return false;
    }
  }
  
  // Get notification preferences (requires authentication token)
  static async getPreferences(authToken: string): Promise<any | null> {
    try {
      const response = await fetch('/api/mobile/push/preferences', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get preferences');
      }
      
      const data = await response.json();
      return data.preferences;
    } catch (error) {
      console.error('Failed to get notification preferences:', error);
      return null;
    }
  }
  
  // Update notification preferences (requires authentication token)
  static async updatePreferences(authToken: string, preferences: any): Promise<boolean> {
    try {
      const response = await fetch('/api/mobile/push/preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(preferences)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update preferences');
      }
      
      return true;
    } catch (error) {
      console.error('Failed to update notification preferences:', error);
      return false;
    }
  }
  
  // Check if notifications are supported and permission granted
  static isSupported(): boolean {
    return 'serviceWorker' in navigator && 
           'PushManager' in window && 
           'Notification' in window;
  }
  
  // Get current notification permission status
  static getPermissionStatus(): NotificationPermission {
    return Notification.permission;
  }
  
  // Check if currently subscribed
  static async isSubscribed(): Promise<boolean> {
    if (!this.swRegistration) {
      return false;
    }
    
    try {
      const subscription = await this.swRegistration.pushManager.getSubscription();
      return subscription !== null;
    } catch {
      return false;
    }
  }
  
  // Utility function to convert VAPID key
  private static urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');
    
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }
  
  // Show a local notification (fallback)
  static showLocalNotification(title: string, options?: NotificationOptions): void {
    if (Notification.permission === 'granted') {
      new Notification(title, {
        icon: '/icons/moovly-icon-192.png',
        badge: '/icons/moovly-badge-72.png',
        ...options
      });
    }
  }
}