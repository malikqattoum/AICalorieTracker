import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';

// Auth Screens
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import OnboardingScreen from '../screens/auth/OnboardingScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';

// Main Screens
import HomeScreen from '../screens/HomeScreen';
import MealHistoryScreen from '../screens/MealHistoryScreen';
import MealPlanScreen from '../screens/MealPlanScreen';
import ProfileScreen from '../screens/ProfileScreen';
import CameraScreen from '../screens/CameraScreen';
import MealDetailsScreen from '../screens/MealDetailsScreen';
import SettingsScreen from '../screens/SettingsScreen';
import NutritionCoachScreen from '../screens/NutritionCoachScreen';
import RecipeImportScreen from '../screens/RecipeImportScreen';
import MealCalendarScreen from '../screens/MealCalendarScreen';
import PersonalInfoScreen from '../screens/PersonalInfoScreen';
import ChangePasswordScreen from '../screens/ChangePasswordScreen';
import NotificationSettingsScreen from '../screens/NotificationSettingsScreen';
import AboutScreen from '../screens/AboutScreen';
import AnalyticsScreen from '../screens/AnalyticsScreen';
import WearableScreen from '../screens/WearableScreen';
import WearableIntegrationScreen from '../screens/WearableIntegrationScreen';
import HealthcareScreen from '../screens/HealthcareScreen';
import RealTimeMonitoringScreen from '../screens/RealTimeMonitoringScreen';
import AdvancedAIScreen from '../screens/AdvancedAIScreen';
import SocialFeedScreen from '../screens/SocialFeedScreen';
import ReportingScreen from '../screens/ReportingScreen';
import PremiumScreen from '../screens/PremiumScreen';
import { PremiumDashboardScreen } from '../screens/PremiumDashboardScreen';

// Define navigation types
export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  MealDetails: { mealId: string };
  Camera: undefined;
  Settings: undefined;
  NutritionCoach: undefined;
  RecipeImport: undefined;
  MealCalendar: undefined;
  PersonalInfo: undefined;
  ChangePassword: undefined;
  NotificationSettings: undefined;
  Analytics: undefined;
  About: undefined;
  Wearable: undefined;
  WearableIntegration: undefined;
  Healthcare: undefined;
  RealTimeMonitoring: undefined;
  AdvancedAI: undefined;
  SocialFeed: undefined;
  Reporting: undefined;
  Premium: undefined;
  PremiumDashboard: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  Onboarding: undefined;
  ForgotPassword: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  MealHistory: undefined;
  MealPlan: undefined;
  Analytics: undefined;
  Profile: undefined;
};

// Create navigators
const Stack = createNativeStackNavigator<RootStackParamList>();
const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

// Auth Navigator
function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
      <AuthStack.Screen name="Onboarding" component={OnboardingScreen} />
      <AuthStack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    </AuthStack.Navigator>
  );
}

// Main Tab Navigator
function MainTabNavigator() {
  const { colors } = useTheme();
  
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'home';
          
          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'MealHistory') {
            iconName = focused ? 'list' : 'list-outline';
          } else if (route.name === 'MealPlan') {
            iconName = focused ? 'calendar' : 'calendar-outline';
          } else if (route.name === 'Analytics') {
            iconName = focused ? 'bar-chart' : 'bar-chart-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }
          
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.text,
        headerShown: false,
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: colors.border,
          backgroundColor: colors.card,
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontFamily: 'Inter-Medium',
        },
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ title: 'Dashboard' }}
      />
      <Tab.Screen
        name="MealHistory"
        component={MealHistoryScreen}
        options={{ title: 'History' }}
      />
      <Tab.Screen
        name="MealPlan"
        component={MealPlanScreen}
        options={{ title: 'Meal Plan' }}
      />
      <Tab.Screen
        name="Analytics"
        component={AnalyticsScreen}
        options={{ title: 'Analytics' }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: 'Profile' }}
      />
    </Tab.Navigator>
  );
}

// Root Navigator
export default function Navigation() {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF' }}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }
  
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!user ? (
        <Stack.Screen name="Auth" component={AuthNavigator} />
      ) : (
        <>
          <Stack.Screen name="Main" component={MainTabNavigator} />
          <Stack.Screen 
            name="MealDetails" 
            component={MealDetailsScreen} 
            options={{ 
              headerShown: true,
              title: 'Meal Details',
              animation: 'slide_from_right',
            }}
          />
          <Stack.Screen 
            name="Camera" 
            component={CameraScreen} 
            options={{ 
              headerShown: false,
              presentation: 'fullScreenModal',
              animation: 'slide_from_bottom',
            }}
          />
          <Stack.Screen 
            name="Settings" 
            component={SettingsScreen} 
            options={{ 
              headerShown: true,
              title: 'Settings',
              animation: 'slide_from_right',
            }}
          />
          <Stack.Screen 
            name="NutritionCoach" 
            component={NutritionCoachScreen} 
            options={{ 
              headerShown: true,
              title: 'Nutrition Coach',
              animation: 'slide_from_right',
            }}
          />
          <Stack.Screen 
            name="RecipeImport" 
            component={RecipeImportScreen} 
            options={{ 
              headerShown: true,
              title: 'Import Recipe',
              animation: 'slide_from_right',
            }}
          />
          <Stack.Screen 
            name="MealCalendar" 
            component={MealCalendarScreen} 
            options={{ 
              headerShown: true,
              title: 'Meal Calendar',
              animation: 'slide_from_right',
            }}
          />
          <Stack.Screen 
            name="PersonalInfo" 
            component={PersonalInfoScreen} 
            options={{ 
              headerShown: false,
              animation: 'slide_from_right',
            }}
          />
          <Stack.Screen 
            name="ChangePassword" 
            component={ChangePasswordScreen} 
            options={{ 
              headerShown: false,
              animation: 'slide_from_right',
            }}
          />
          <Stack.Screen 
            name="NotificationSettings" 
            component={NotificationSettingsScreen} 
            options={{ 
              headerShown: false,
              animation: 'slide_from_right',
            }}
          />
          <Stack.Screen 
            name="About" 
            component={AboutScreen} 
            options={{ 
              headerShown: false,
              animation: 'slide_from_right',
            }}
          />
          <Stack.Screen
            name="Wearable"
            component={WearableScreen}
            options={{
              headerShown: true,
              title: 'Wearable Devices',
              animation: 'slide_from_right',
            }}
          />
          <Stack.Screen
            name="WearableIntegration"
            component={WearableIntegrationScreen}
            options={{
              headerShown: true,
              title: 'Wearable Integration',
              animation: 'slide_from_right',
            }}
          />
          <Stack.Screen
            name="Healthcare"
            component={HealthcareScreen}
            options={{
              headerShown: true,
              title: 'Healthcare',
              animation: 'slide_from_right',
            }}
          />
          <Stack.Screen
            name="RealTimeMonitoring"
            component={RealTimeMonitoringScreen}
            options={{
              headerShown: true,
              title: 'Real-time Monitoring',
              animation: 'slide_from_right',
            }}
          />
          <Stack.Screen
            name="AdvancedAI"
            component={AdvancedAIScreen}
            options={{
              headerShown: true,
              title: 'Advanced AI',
              animation: 'slide_from_right',
            }}
          />
          <Stack.Screen
            name="SocialFeed"
            component={SocialFeedScreen}
            options={{
              headerShown: true,
              title: 'Social Feed',
              animation: 'slide_from_right',
            }}
          />
          <Stack.Screen
            name="Reporting"
            component={ReportingScreen}
            options={{
              headerShown: true,
              title: 'Reporting',
              animation: 'slide_from_right',
            }}
          />
          <Stack.Screen
            name="Premium"
            component={PremiumScreen}
            options={{
              headerShown: true,
              title: 'Premium',
              animation: 'slide_from_right',
            }}
          />
          <Stack.Screen
            name="PremiumDashboard"
            component={PremiumDashboardScreen}
            options={{
              headerShown: true,
              title: 'Premium Dashboard',
              animation: 'slide_from_right',
            }}
          />
        </>
      )}
    </Stack.Navigator>
  );
}