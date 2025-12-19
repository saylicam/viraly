import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { View, StyleSheet } from 'react-native';

// Screens
import IntroScreen from '../screens/IntroScreen';
import SplashScreen from '../screens/SplashScreen';
import WelcomeScreen from '../screens/WelcomeScreen';
import QuestionnaireScreen from '../screens/QuestionnaireScreen';
import LoginScreen from '../screens/LoginScreen';
import CalculatingScreen from '../screens/CalculatingScreen';
import RecommendationScreen from '../screens/RecommendationScreen';
import TimelineScreen from '../screens/TimelineScreen';
import AnalyzeScreen from '../screens/AnalyzeScreen';
import VideoAnalyzingScreen from '../screens/VideoAnalyzingScreen';
import AnalysisResultScreen from '../screens/AnalysisResultScreen';
import ProfileScreen from '../screens/ProfileScreen';
import SettingsScreen from '../screens/SettingsScreen';
import PaywallScreen from '../screens/PaywallScreen';
import CalendarScreen from '../screens/Calendar/CalendarScreen';

import { theme } from '../theme';
import { ProtectedScreen } from '../components/ProtectedScreen';

// Wrapper pour AnalyzeScreen avec le bon fond
const AnalyzeScreenWrapper = (props: any) => {
  return (
    <View style={{ flex: 1, backgroundColor: '#0A0214' }}>
      <AnalyzeScreen {...props} />
    </View>
  );
};

export type RootStackParamList = {
  Intro: undefined;
  Splash: undefined;
  Welcome: undefined;
  Questionnaire: undefined;
  Login: { answers?: Record<string, string[]> };
  Calculating: { answers: Record<string, string[]> };
  Recommendation: { answers: Record<string, string[]> };
  Main: undefined;
  Analyze: undefined;
  VideoAnalyzing: { videoUri: string };
  AnalysisResult: { videoUri: string; result: any };
  Profile: undefined;
  Paywall: undefined;
};

export type MainTabParamList = {
  Timeline: undefined;
  Analyze: undefined;
  Calendar: undefined;
  Profile: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

function MainTabs() {
  return (
    <ProtectedScreen>
      <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: 90,
          backgroundColor: 'transparent',
          borderTopWidth: 0,
          elevation: 0,
        },
        tabBarBackground: () => (
          <BlurView intensity={30} tint="dark" style={styles.tabBarBlur}>
            <LinearGradient
              colors={['rgba(10, 11, 16, 0.8)', 'rgba(10, 11, 16, 0.95)']}
              style={styles.tabBarGradient}
            />
          </BlurView>
        ),
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.text.tertiary,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 4,
        },
        tabBarItemStyle: {
          paddingTop: 8,
        },
      }}
    >
      <Tab.Screen
        name="Timeline"
        component={TimelineScreen}
        options={{
          tabBarLabel: 'Accueil',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Analyze"
        component={AnalyzeScreenWrapper}
        options={{
          tabBarLabel: 'Analyser',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="analytics-outline" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Calendar"
        component={CalendarScreen}
        options={{
          tabBarLabel: 'Calendrier',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar-outline" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profil',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" color={color} size={size} />
          ),
        }}
      />
      </Tab.Navigator>
    </ProtectedScreen>
  );
}

export const RootNavigator = () => {
  // Navigation simplifiée - toujours commencer par Intro
  // Les écrans individuels gèrent leur propre logique de navigation
  // PAS de dépendance à Firestore pour la navigation
  return (
    <Stack.Navigator
      initialRouteName="Intro"
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.colors.bg.primary },
      }}
    >
      <Stack.Screen name="Intro" component={IntroScreen} />
      <Stack.Screen name="Splash" component={SplashScreen} />
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="Questionnaire" component={QuestionnaireScreen} />
      <Stack.Screen 
        name="Login" 
        component={LoginScreen}
        options={{
          gestureEnabled: false, // Empêcher le retour en arrière depuis Login
        }}
      />
      <Stack.Screen name="Calculating" component={CalculatingScreen} />
      <Stack.Screen name="Recommendation" component={RecommendationScreen} />
      <Stack.Screen 
        name="Main" 
        component={MainTabs}
        options={{
          gestureEnabled: true, // Permettre le retour en arrière
        }}
      />
      <Stack.Screen
        name="VideoAnalyzing"
        component={VideoAnalyzingScreen}
        options={{
          presentation: 'card',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="AnalysisResult"
        component={AnalysisResultScreen}
        options={{
          presentation: 'card',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="Paywall"
        component={PaywallScreen}
        options={{
          presentation: 'modal',
          headerShown: false,
        }}
      />
    </Stack.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBarBlur: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  tabBarGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
});


