import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { MotiView } from 'moti';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';

interface StrengthListProps {
  strengths: string[];
}

export const StrengthList: React.FC<StrengthListProps> = ({ strengths }) => {
  return (
    <MotiView
      from={{ opacity: 0, translateX: -50 }}
      animate={{ opacity: 1, translateX: 0 }}
      transition={{ type: 'timing', duration: 600, delay: 800 }}
      style={styles.container}
    >
      <BlurView intensity={20} tint="dark" style={styles.blurContainer}>
        <View style={styles.header}>
          <Ionicons name="star" size={24} color={colors.success} />
          <Text style={styles.title}>POINTS FORTS</Text>
        </View>

        {strengths.map((strength, index) => (
          <MotiView
            key={index}
            from={{ opacity: 0, translateX: -20 }}
            animate={{ opacity: 1, translateX: 0 }}
            transition={{ type: 'timing', duration: 400, delay: 900 + index * 100 }}
            style={styles.strengthItem}
          >
            <View style={styles.bullet}>
              <Ionicons name="checkmark-circle" size={20} color={colors.success} />
            </View>
            <Text style={styles.strengthText}>{strength}</Text>
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
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    shadowColor: colors.glow.success,
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
    color: colors.success,
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginLeft: 8,
  },
  strengthItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  bullet: {
    marginRight: 12,
    marginTop: 2,
  },
  strengthText: {
    flex: 1,
    fontSize: 14,
    color: colors.text.primary,
    lineHeight: 20,
  },
});


