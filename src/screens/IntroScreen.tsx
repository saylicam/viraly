import React, { useEffect, useState, useRef } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { MotiView } from 'moti';

const FIRST_LAUNCH_KEY = '@viraly_first_launch';

interface IntroScreenProps {
  navigation: any;
}

// Hook custom pour l'effet typewriter
const useTypewriter = (text: string, speed: number = 18) => {
  const [displayedText, setDisplayedText] = useState('');
  const [isComplete, setIsComplete] = useState(false);
  const [showCursor, setShowCursor] = useState(true);
  const indexRef = useRef(0);

  useEffect(() => {
    setDisplayedText('');
    setIsComplete(false);
    indexRef.current = 0;
    setShowCursor(true);

    const interval = setInterval(() => {
      if (indexRef.current < text.length) {
        setDisplayedText(text.substring(0, indexRef.current + 1));
        indexRef.current += 1;
      } else {
        setIsComplete(true);
        setShowCursor(false);
        clearInterval(interval);
      }
    }, speed);

    // Animation du curseur clignotant
    const cursorInterval = setInterval(() => {
      setShowCursor(prev => !prev);
    }, 500);

    return () => {
      clearInterval(interval);
      clearInterval(cursorInterval);
    };
  }, [text, speed]);

  return { displayedText, isComplete, showCursor };
};

export default function IntroScreen({ navigation }: IntroScreenProps) {
  const [isReady, setIsReady] = useState(false);
  const [showLogo, setShowLogo] = useState(false);
  const [showContinue, setShowContinue] = useState(false);

  // Texte principal avec typewriter
  const fullText = "Arrête de scroller.\nCommence à\nconstruire.";
  const { displayedText, isComplete, showCursor } = useTypewriter(fullText, 18); // ~1.2s pour 67 caractères

  useEffect(() => {
    checkFirstLaunch();
  }, []);

  // Déclencher l'affichage de VIRALY une fois le texte complet
  useEffect(() => {
    if (isComplete) {
      setTimeout(() => {
        setShowLogo(true);
        // Puis afficher "Appuie pour continuer" après un court délai
        setTimeout(() => {
          setShowContinue(true);
        }, 300);
      }, 200);
    }
  }, [isComplete]);

  const checkFirstLaunch = async () => {
    // Toujours afficher l'intro immédiatement
    // Pas de vérification AsyncStorage - l'intro s'affiche toujours en premier
    setIsReady(true);
  };

  const handleContinue = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    // Rediriger vers Welcome (première étape après l'intro)
    navigation.navigate('Welcome');
  };

  if (!isReady) {
    return null;
  }

  return (
    <Pressable 
      style={styles.container}
      onPress={handleContinue}
      activeOpacity={1}
    >
      {/* Fond: Dégradé radial subtil deep purple */}
      <LinearGradient
        colors={['#0B0B15', '#1A103F', '#2B176F', '#1A103F', '#0B0B15']}
        locations={[0, 0.3, 0.5, 0.7, 1]}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Texture grain très légère */}
      <View style={styles.grainOverlay} pointerEvents="none" />

      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.content}>
          
          {/* Texte principal: Typewriter Effect */}
          <View style={styles.textContainer}>
            <Text style={styles.mainText}>
              {displayedText}
              {!isComplete && showCursor && <Text style={styles.cursor}>|</Text>}
            </Text>
          </View>

          {/* Brand: VIRALY - Fade-in après le texte */}
          {showLogo && (
            <MotiView
              from={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ type: 'timing', duration: 300 }}
              style={styles.brandContainer}
            >
              <Text style={styles.brandText}>
                V I R A L Y
              </Text>
            </MotiView>
          )}

          {/* Instruction: Appuie pour continuer - Fade-in après VIRALY */}
          {showContinue && (
            <MotiView
              from={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ type: 'timing', duration: 300 }}
              style={styles.instructionContainer}
            >
              <Text style={styles.instructionText}>
                Appuie pour continuer
              </Text>
            </MotiView>
          )}

        </View>
      </SafeAreaView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  grainOverlay: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    opacity: 0.02,
    backgroundColor: 'transparent',
  },
  textContainer: {
    marginBottom: 48,
    alignItems: 'center',
    minHeight: 132, // Hauteur fixe pour éviter le saut
  },
  mainText: {
    fontSize: 33,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 44,
    letterSpacing: -0.5,
  },
  cursor: {
    color: '#FFFFFF',
    opacity: 0.8,
  },
  brandContainer: {
    marginBottom: 120,
    alignItems: 'center',
  },
  brandText: {
    fontSize: 15,
    fontWeight: '400',
    color: '#CFCFCF',
    textAlign: 'center',
    letterSpacing: 8,
  },
  instructionContainer: {
    position: 'absolute',
    bottom: 60,
    alignItems: 'center',
  },
  instructionText: {
    fontSize: 13.5,
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
  },
});
