import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from 'moti';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';

interface CriticalMoment {
  timestamp: string;
  reason: string;
  importance: number; // 1-10
}

interface CriticalMomentCardProps {
  moments: CriticalMoment[];
}

export const CriticalMomentCard: React.FC<CriticalMomentCardProps> = ({
  moments,
}) => {
  const getImportanceColor = (importance: number): string[] => {
    if (importance >= 8) return ['#F59E0B', '#EF4444'];
    if (importance >= 5) return ['#F59E0B', '#FCD34D'];
    return ['#6B7280', '#9CA3AF'];
  };

  return (
    <MotiView
      from={{ opacity: 0, translateY: 50 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'spring', damping: 15, stiffness: 150, delay: 600 }}
      style={styles.container}
    >
      <BlurView intensity={20} tint="dark" style={styles.blurContainer}>
        <View style={styles.header}>
          <Ionicons name="warning-outline" size={24} color={colors.warning} />
          <Text style={styles.title}>MOMENTS CRITIQUES</Text>
        </View>

        {moments.map((moment, index) => (
          <MotiView
            key={index}
            from={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'timing', duration: 400, delay: 700 + index * 100 }}
            style={styles.momentItem}
          >
            <LinearGradient
              colors={getImportanceColor(moment.importance) as any}
              style={styles.momentGradient}
            >
              <View style={styles.momentContent}>
                <View style={styles.momentHeader}>
                  <View style={styles.timestampBadge}>
                    <Text style={styles.timestamp}>{moment.timestamp}</Text>
                  </View>
                  <View style={styles.importanceBadge}>
                    <Text style={styles.importanceText}>
                      Importance: {moment.importance}/10
                    </Text>
                  </View>
                </View>
                <Text style={styles.momentReason}>{moment.reason}</Text>
              </View>
            </LinearGradient>
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
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    shadowColor: colors.glow.warning,
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
    color: colors.warning,
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginLeft: 8,
  },
  momentItem: {
    marginBottom: 16,
  },
  momentGradient: {
    borderRadius: 16,
    padding: 16,
    shadowColor: colors.glow.warning,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  momentContent: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 12,
    padding: 12,
  },
  momentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  timestampBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  timestamp: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  importanceBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  importanceText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.text.primary,
  },
  momentReason: {
    fontSize: 14,
    color: colors.text.primary,
    lineHeight: 20,
  },
});


