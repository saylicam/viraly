import React, { useEffect, useState } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { pickVideo } from '../utils/pickVideo';

// Screens
import IntroScreen from '../screens/IntroScreen';
import BootScreen from '../screens/BootScreen';
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
import PaywallScreen from '../screens/PaywallScreen';
import TrendPlanScreen from '../screens/TrendPlanScreen';
import TrendCheckScreen from '../screens/TrendCheckScreen';
import AccountReportScreen from '../screens/AccountReportScreen';
import CalendarScreen from '../screens/Calendar/CalendarScreen';
import TrendsScreen from '../screens/TrendsScreen';

import { theme } from '../theme';
import { ProtectedScreen } from '../components/ProtectedScreen';
import { useSession } from '../context/SessionContext';
import { useRevenueCat } from '../context/RevenueCatContext';
import NotificationPrompt from '../components/notifications/NotificationPrompt';
import { refreshPushToken, scheduleComebackReminder, shouldPromptNotifications } from '../services/notifications';
import { useAnalysisGate } from '../hooks/useAnalysisGate';

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
  Welcome: undefined;
  Questionnaire: undefined;
  Login: { answers?: Record<string, string[]>; mode?: 'login' | 'signup' } | undefined;
  Calculating: { answers: Record<string, string[]> };
  Recommendation: { answers: Record<string, string[]> };
  Main: undefined;
  Analyze: undefined;
  VideoAnalyzing: { videoUri: string };
  AnalysisResult: { videoUri: string; result: any };
  Profile: undefined;
  Paywall: { source?: 'onboarding' | 'limit' } | undefined;
  TrendPlan: {
    kind: 'sound' | 'video';
    id: string;
    title: string;
    subtitle?: string | null;
    cover?: string | null;
    url?: string;
    stage?: 'emerging' | 'peak' | 'declining';
    niche?: string;
    level?: string;
  };
  TrendCheck: { videoUri: string; plan: any; kind?: 'sound' | 'video'; id?: string; title?: string };
  AccountReport: undefined;
};

export type MainTabParamList = {
  Timeline: undefined;
  Analyze: undefined;
  Trends: undefined;
  Calendar: undefined;
  Profile: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

/** Bouton central « Analyser » (comme le + de TikTok) : choisit une vidéo et lance l'analyse. */
function AnalyzeTabButton() {
  const navigation = useNavigation<any>();
  const gate = useAnalysisGate(navigation);
  const onPress = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    if (!(await gate())) return;
    const video = await pickVideo();
    if (video) navigation.navigate('VideoAnalyzing', { videoUri: video.uri });
  };
  return (
    <TouchableOpacity activeOpacity={0.88} onPress={onPress} style={styles.centerWrap} accessibilityLabel="Analyser une vidéo">
      <LinearGradient colors={['#FF4FF9', '#9013FE']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.centerBtn}>
        <Ionicons name="cloud-upload-outline" size={26} color="#FFF" />
      </LinearGradient>
      <Text style={styles.centerLabel}>Analyser</Text>
    </TouchableOpacity>
  );
}

/** Écran Premium montré une seule fois, juste après la création du compte (si pas déjà abonné). */
function useWelcomePaywall(navigation: any) {
  const { welcomePaywall, consumeWelcomePaywall } = useSession();
  const { isPremium, isLoading } = useRevenueCat();
  useEffect(() => {
    if (!welcomePaywall || isLoading) return undefined;
    // Petit délai : l'accueil s'affiche, puis l'écran Premium monte par-dessus
    const t = setTimeout(() => {
      consumeWelcomePaywall();
      if (!isPremium) navigation.navigate('Paywall', { source: 'onboarding' });
    }, 400);
    return () => clearTimeout(t);
  }, [welcomePaywall, isLoading, isPremium]);
}

/**
 * Proposition d'activer les notifications : une fois sur l'accueil (après l'écran Premium
 * de bienvenue), puis au plus tous les 3 jours tant que ce n'est pas accepté.
 */
function useNotificationPrompt(navigation: any) {
  const { welcomePaywall } = useSession();
  const [show, setShow] = useState(false);
  useEffect(() => {
    refreshPushToken();
    scheduleComebackReminder();
  }, []);
  useEffect(() => {
    if (welcomePaywall) return undefined;
    let timer: any;
    const check = () => {
      clearTimeout(timer);
      timer = setTimeout(async () => {
        // Pas pendant que l'écran Premium (ou un autre écran) est par-dessus
        if (!navigation.isFocused()) return;
        if (await shouldPromptNotifications()) setShow(true);
      }, 1500);
    };
    check();
    const unsub = navigation.addListener('focus', check);
    return () => { clearTimeout(timer); unsub(); };
  }, [welcomePaywall, navigation]);
  return { show, close: () => setShow(false) };
}

function MainTabs({ navigation }: any) {
  useWelcomePaywall(navigation);
  const notif = useNotificationPrompt(navigation);
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
        name="Trends"
        component={TrendsScreen}
        options={{
          tabBarLabel: 'Tendances',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="flame-outline" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Analyze"
        component={AnalyzeScreenWrapper}
        options={{
          tabBarLabel: () => null,
          // Fonction phare : gros bouton au centre, ouvre directement la galerie
          tabBarButton: () => <AnalyzeTabButton />,
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
      <NotificationPrompt visible={notif.show} onClose={notif.close} />
    </ProtectedScreen>
  );
}

const cardOptions = { presentation: 'card' as const, headerShown: false };

/**
 * Les écrans dépendent uniquement du statut de session (voir SessionContext) :
 * - pas connecté          → intro, questionnaire, création de compte / connexion
 * - connecté sans profil  → questionnaire
 * - connecté avec profil  → accueil directement (jamais de questionnaire)
 * Quand le statut change (connexion, déconnexion), la pile est recréée au bon endroit.
 */
export const RootNavigator = () => {
  const { status, retry, signOut } = useSession();

  if (status === 'loading' || status === 'error') {
    return <BootScreen error={status === 'error'} onRetry={retry} onSignOut={() => { signOut().catch(() => {}); }} />;
  }

  const onboardingScreens = (
    <>
      <Stack.Screen name="Questionnaire" component={QuestionnaireScreen} />
      <Stack.Screen name="Calculating" component={CalculatingScreen} />
      <Stack.Screen name="Recommendation" component={RecommendationScreen} />
    </>
  );

  return (
    <Stack.Navigator
      key={status}
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.colors.bg.primary },
      }}
    >
      {status === 'signedOut' ? (
        <>
          <Stack.Screen name="Intro" component={IntroScreen} />
          <Stack.Screen name="Welcome" component={WelcomeScreen} />
          {onboardingScreens}
          <Stack.Screen name="Login" component={LoginScreen} />
        </>
      ) : status === 'needsProfile' ? (
        onboardingScreens
      ) : (
        <>
          <Stack.Screen name="Main" component={MainTabs} />
          <Stack.Screen name="VideoAnalyzing" component={VideoAnalyzingScreen} options={cardOptions} />
          <Stack.Screen name="AnalysisResult" component={AnalysisResultScreen} options={cardOptions} />
          <Stack.Screen name="TrendPlan" component={TrendPlanScreen} options={cardOptions} />
          <Stack.Screen name="TrendCheck" component={TrendCheckScreen} options={cardOptions} />
          <Stack.Screen name="AccountReport" component={AccountReportScreen} options={cardOptions} />
          {onboardingScreens}
          <Stack.Screen
            name="Paywall"
            component={PaywallScreen}
            options={({ route }) => ({
              headerShown: false,
              // Après l'inscription : plein écran, on ne ferme qu'avec la croix
              presentation: route.params?.source ? 'fullScreenModal' : 'modal',
              gestureEnabled: !route.params?.source,
            })}
          />
        </>
      )}
    </Stack.Navigator>
  );
};

const styles = StyleSheet.create({
  centerWrap: { flex: 1, alignItems: 'center', justifyContent: 'flex-start', marginTop: -18 },
  centerBtn: {
    width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center',
    borderWidth: 4, borderColor: '#0A0B10',
    shadowColor: '#FF4FF9', shadowOpacity: 0.6, shadowRadius: 14, shadowOffset: { width: 0, height: 4 }, elevation: 12,
  },
  centerLabel: { color: '#FF4FF9', fontSize: 11, fontWeight: '800', marginTop: 2 },
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


