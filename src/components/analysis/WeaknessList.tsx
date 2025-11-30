import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { MotiView } from 'moti';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';

interface WeaknessListProps {
  weaknesses: string[];
}

export const WeaknessList: React.FC<WeaknessListProps> = ({ weaknesses }) => {
  return (
    <MotiView
      from={{ opacity: 0, translateX: 50 }}
      animate={{ opacity: 1, translateX: 0 }}
      transition={{ type: 'timing', duration: 600, delay: 1000 }}
      style={styles.container}
    >
      <BlurView intensity={20} tint="dark" style={styles.blurContainer}>
        <View style={styles.header}>
          <Ionicons name="alert-circle" size={24} color={colors.error} />
          <Text style={styles.title}>POINTS FAIBLES</Text>
        </View>

        {weaknesses.map((weakness, index) => (
          <MotiView
            key={index}
            from={{ opacity: 0, translateX: 20 }}
            animate={{ opacity: 1, translateX: 0 }}
            transition={{ type: 'timing', duration: 400, delay: 1100 + index * 100 }}
            style={styles.weaknessItem}
          >
            <View style={styles.bullet}>
              <Ionicons name="close-circle" size={20} color={colors.error} />
            </View>
            <Text style={styles.weaknessText}>{weakness}</Text>
          </MotiView>
        ))}
      </BlurView>
    </MotiView>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  blurContainer: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    shadowColor: colors.glow.error,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.error,
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginLeft: 8,
  },
  weaknessItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  bullet: {
    marginRight: 12,
    marginTop: 2,
  },
  weaknessText: {
    flex: 1,
    fontSize: 14,
    color: colors.text.primary,
    lineHeight: 20,
  },
});


