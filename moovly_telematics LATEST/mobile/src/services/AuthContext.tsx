import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { apiService } from './ApiService';

interface User {
  id: number;
  username: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  vehicleId?: number;
  isActive?: boolean;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (username: string, pin: string) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuthState();
  }, []);

  const checkAuthState = async () => {
    try {
      const token = await SecureStore.getItemAsync('auth_token');
      const userData = await AsyncStorage.getItem('user_data');
      
      if (token && userData) {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        apiService.setAuthToken(token);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (username: string, pin: string): Promise<boolean> => {
    try {
      setLoading(true);
      const response = await apiService.post('/api/driver/pin-login', { username, pin });
      
      if (response.success && response.user && response.token) {
        await SecureStore.setItemAsync('auth_token', response.token);
        await AsyncStorage.setItem('user_data', JSON.stringify(response.user));
        
        setUser(response.user);
        apiService.setAuthToken(response.token);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('PIN login failed:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await SecureStore.deleteItemAsync('auth_token');
      await AsyncStorage.removeItem('user_data');
      setUser(null);
      apiService.clearAuthToken();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const refreshUser = async () => {
    try {
      const response = await apiService.get('/api/auth/me');
      if (response.success && response.user) {
        setUser(response.user);
        await AsyncStorage.setItem('user_data', JSON.stringify(response.user));
      }
    } catch (error) {
      console.error('User refresh failed:', error);
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    loading,
    login,
    logout,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}