import AsyncStorage from '@react-native-async-storage/async-storage';

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  user?: any;
  token?: string;
  message?: string;
  error?: string;
}

class ApiService {
  private baseURL: string;
  private authToken: string | null = null;

  constructor() {
    // Configure for different environments
    // For Expo Go testing, use your Replit's public URL
    const isDev = typeof __DEV__ !== 'undefined' ? __DEV__ : true;
    
    if (isDev) {
      // Replace with your actual Replit URL when available
      this.baseURL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000';
    } else {
      this.baseURL = 'https://moovlytelematics.com';
    }
  }

  setAuthToken(token: string) {
    this.authToken = token;
  }

  clearAuthToken() {
    this.authToken = null;
  }

  private async makeRequest<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${this.baseURL}${endpoint}`;
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...options.headers,
      };

      if (this.authToken) {
        headers['Authorization'] = `Bearer ${this.authToken}`;
      }

      const response = await fetch(url, {
        ...options,
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `HTTP ${response.status}`);
      }

      return {
        success: true,
        ...data,
      };
    } catch (error) {
      console.error('API Request failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, { method: 'DELETE' });
  }

  // Offline data management
  async saveOfflineData(key: string, data: any): Promise<void> {
    try {
      await AsyncStorage.setItem(`offline_${key}`, JSON.stringify({
        data,
        timestamp: Date.now(),
      }));
    } catch (error) {
      console.error('Failed to save offline data:', error);
    }
  }

  async getOfflineData(key: string): Promise<any | null> {
    try {
      const stored = await AsyncStorage.getItem(`offline_${key}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed.data;
      }
      return null;
    } catch (error) {
      console.error('Failed to get offline data:', error);
      return null;
    }
  }

  async syncOfflineData(): Promise<void> {
    try {
      // Get all offline data keys
      const keys = await AsyncStorage.getAllKeys();
      const offlineKeys = keys.filter(key => key.startsWith('offline_'));

      for (const key of offlineKeys) {
        const data = await this.getOfflineData(key.replace('offline_', ''));
        if (data) {
          // Attempt to sync based on data type
          if (key.includes('fuel_entry')) {
            await this.post('/api/fuel-entries', data);
          } else if (key.includes('checklist')) {
            await this.post('/api/vehicle-checklist', data);
          }
          
          // Remove synced data
          await AsyncStorage.removeItem(key);
        }
      }
    } catch (error) {
      console.error('Offline sync failed:', error);
    }
  }
}

export const apiService = new ApiService();