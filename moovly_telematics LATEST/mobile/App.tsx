import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Provider as PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

// Screens
import LoginScreen from './src/screens/LoginScreen';
import JobsScreen from './src/screens/JobsScreen';
import MoovScoreScreen from './src/screens/MoovScoreScreen';
import VehicleScreen from './src/screens/VehicleScreen';
import MessagesScreen from './src/screens/MessagesScreen';
import FuelUploadScreen from './src/screens/FuelUploadScreen';
import ChecklistScreen from './src/screens/ChecklistScreen';

// Services
import { AuthProvider, useAuth } from './src/services/AuthContext';

// Create navigators
const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// Create QueryClient
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

// Theme colors matching Moovly branding
const theme = {
  colors: {
    primary: '#1e3a8a', // Navy blue
    accent: '#4285f4',  // Moovly blue
    surface: '#ffffff',
    background: '#f8fafc',
    text: '#1f2937',
    onSurface: '#374151',
  },
};

// Main Tab Navigator
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          if (route.name === 'Jobs') {
            iconName = focused ? 'list' : 'list-outline';
          } else if (route.name === 'MoovScore') {
            iconName = focused ? 'speedometer' : 'speedometer-outline';
          } else if (route.name === 'Vehicle') {
            iconName = focused ? 'car' : 'car-outline';
          } else if (route.name === 'Messages') {
            iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
          } else {
            iconName = 'ellipse-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: '#6b7280',
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopWidth: 1,
          borderTopColor: '#e5e7eb',
        },
        headerStyle: {
          backgroundColor: theme.colors.primary,
        },
        headerTintColor: '#ffffff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      })}
    >
      <Tab.Screen name="Jobs" component={JobsScreen} />
      <Tab.Screen name="MoovScore" component={MoovScoreScreen} />
      <Tab.Screen name="Vehicle" component={VehicleScreen} />
      <Tab.Screen name="Messages" component={MessagesScreen} />
    </Tab.Navigator>
  );
}

// Main Stack Navigator
function AppNavigator() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return null; // Show loading screen if needed
  }

  return (
    <NavigationContainer>
      <Stack.Navigator>
        {!isAuthenticated ? (
          <Stack.Screen 
            name="Login" 
            component={LoginScreen}
            options={{ headerShown: false }}
          />
        ) : (
          <>
            <Stack.Screen 
              name="MainTabs" 
              component={MainTabs}
              options={{ headerShown: false }}
            />
            <Stack.Screen 
              name="FuelUpload" 
              component={FuelUploadScreen}
              options={{
                title: 'Upload Fuel Entry',
                headerStyle: { backgroundColor: theme.colors.primary },
                headerTintColor: '#ffffff',
              }}
            />
            <Stack.Screen 
              name="Checklist" 
              component={ChecklistScreen}
              options={{
                title: 'Vehicle Checklist',
                headerStyle: { backgroundColor: theme.colors.primary },
                headerTintColor: '#ffffff',
              }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

// Main App Component
export default function App() {
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <PaperProvider theme={{ colors: theme.colors }}>
          <AuthProvider>
            <AppNavigator />
            <StatusBar style="light" backgroundColor={theme.colors.primary} />
          </AuthProvider>
        </PaperProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}