import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from 'moti';

interface ScreenWrapperProps {
  children: React.ReactNode;
}

export const ScreenWrapper: React.FC<ScreenWrapperProps> = ({ children }) => {
  return (
    <View style={styles.container}>
      {/* Background gradient */}
      <LinearGradient
        colors={['#140B2E', '#0B0716']}
        locations={[0, 0.7]}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Subtle violet halos */}
      <MotiView
        from={{ opacity: 0.06, scale: 0.8 }}
        animate={{ opacity: 0.08, scale: 1 }}
        transition={{ loop: true, type: 'timing', duration: 4000, direction: 'alternate' }}
        style={styles.halo1}
      />
      <MotiView
        from={{ opacity: 0.06, scale: 0.9 }}
        animate={{ opacity: 0.1, scale: 1.1 }}
        transition={{ loop: true, type: 'timing', duration: 5000, direction: 'alternate', delay: 1000 }}
        style={styles.halo2}
      />

      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  halo1: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: '#A56CFB',
    top: '10%',
    right: '10%',
    opacity: 0.08,
  },
  halo2: {
    position: 'absolute',
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: '#7F5BFF',
    bottom: '15%',
    left: '5%',
    opacity: 0.08,
  },
});







