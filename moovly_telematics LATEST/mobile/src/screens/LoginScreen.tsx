import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { TextInput, Button, Card, Checkbox } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../services/AuthContext';

export default function LoginScreen() {
  const [username, setUsername] = useState('');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [showForgotPin, setShowForgotPin] = useState(false);
  const { login } = useAuth();

  // Load saved credentials on component mount
  useEffect(() => {
    loadSavedCredentials();
  }, []);

  const loadSavedCredentials = async () => {
    try {
      const savedUsername = await AsyncStorage.getItem('saved_username');
      const savedPin = await AsyncStorage.getItem('saved_pin');
      const isRemembered = await AsyncStorage.getItem('remember_me');
      
      if (isRemembered === 'true' && savedUsername && savedPin) {
        setUsername(savedUsername);
        setPin(savedPin);
        setRememberMe(true);
      }
    } catch (error) {
      console.log('Error loading saved credentials:', error);
    }
  };

  const saveCredentials = async () => {
    try {
      if (rememberMe) {
        await AsyncStorage.setItem('saved_username', username);
        await AsyncStorage.setItem('saved_pin', pin);
        await AsyncStorage.setItem('remember_me', 'true');
      } else {
        await AsyncStorage.removeItem('saved_username');
        await AsyncStorage.removeItem('saved_pin');
        await AsyncStorage.removeItem('remember_me');
      }
    } catch (error) {
      console.log('Error saving credentials:', error);
    }
  };

  const handleLogin = async () => {
    if (!username || !pin) {
      Alert.alert('Error', 'Please enter both username and 4-digit PIN.');
      return;
    }

    if (pin.length !== 4) {
      Alert.alert('Error', 'PIN must be exactly 4 digits.');
      return;
    }

    setLoading(true);
    const success = await login(username, pin);
    
    if (success) {
      await saveCredentials();
    }
    
    setLoading(false);

    if (!success) {
      Alert.alert('Login Failed', 'Invalid username or PIN. Please check your credentials.');
      setShowForgotPin(true);
    }
  };

  const handleForgotPin = () => {
    Alert.alert(
      'Forgot PIN?',
      'Your PIN was provided during registration via SMS. If you cannot find it, please contact your administrator for assistance.',
      [
        { text: 'OK', style: 'default' },
        { 
          text: 'Contact Admin', 
          style: 'default',
          onPress: () => {
            // In a real app, this could open email/phone app
            Alert.alert('Contact Administrator', 'Please contact your fleet administrator for PIN assistance.');
          }
        }
      ]
    );
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.logoContainer}>
          <Image
            source={require('../../assets/moovly-logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.appTitle}>Moovly Driver</Text>
          <Text style={styles.subtitle}>Fleet Management System</Text>
        </View>

        <Card style={styles.loginCard}>
          <Card.Content>
            <Text style={styles.loginTitle}>Driver Login</Text>
            
            <TextInput
              label="Username"
              value={username}
              onChangeText={setUsername}
              mode="outlined"
              autoCapitalize="none"
              style={styles.input}
              disabled={loading}
              placeholder="e.g. john.smith"
            />

            <TextInput
              label="4-Digit PIN"
              value={pin}
              onChangeText={setPin}
              mode="outlined"
              secureTextEntry
              keyboardType="numeric"
              maxLength={4}
              style={styles.input}
              disabled={loading}
              placeholder="Enter your PIN"
            />

            <View style={styles.rememberMeContainer}>
              <Checkbox
                status={rememberMe ? 'checked' : 'unchecked'}
                onPress={() => setRememberMe(!rememberMe)}
                disabled={loading}
              />
              <Text style={styles.rememberMeText}>Remember my credentials</Text>
            </View>

            <Button
              mode="contained"
              onPress={handleLogin}
              loading={loading}
              disabled={loading || !username || pin.length !== 4}
              style={styles.loginButton}
              contentStyle={styles.buttonContent}
            >
              {loading ? 'Logging in...' : 'Login with PIN'}
            </Button>

            {showForgotPin && (
              <TouchableOpacity onPress={handleForgotPin} style={styles.forgotPinButton}>
                <Text style={styles.forgotPinText}>Forgot PIN?</Text>
              </TouchableOpacity>
            )}

            <View style={styles.helpContainer}>
              <Text style={styles.helpText}>
                Use the username and 4-digit PIN provided during registration
              </Text>
            </View>
          </Card.Content>
        </Card>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Moovly Telematics © 2025</Text>
          <Text style={styles.footerSubtext}>Professional Fleet Management</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1e3a8a', // Navy blue background
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 16,
  },
  appTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#cbd5e1',
    textAlign: 'center',
  },
  loginCard: {
    marginHorizontal: 20,
    elevation: 8,
    borderRadius: 16,
  },
  loginTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 24,
    color: '#1f2937',
  },
  input: {
    marginBottom: 16,
  },
  loginButton: {
    marginTop: 16,
    marginBottom: 24,
    backgroundColor: '#4285f4',
  },
  buttonContent: {
    paddingVertical: 8,
  },
  rememberMeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 10,
  },
  rememberMeText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#374151',
  },
  forgotPinButton: {
    alignItems: 'center',
    marginTop: 12,
    paddingVertical: 8,
  },
  forgotPinText: {
    color: '#4285f4',
    fontSize: 14,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  helpContainer: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    alignItems: 'center',
  },
  helpText: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 16,
  },
  footer: {
    alignItems: 'center',
    marginTop: 40,
  },
  footerText: {
    color: '#cbd5e1',
    fontSize: 14,
    fontWeight: '600',
  },
  footerSubtext: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 4,
  },
});