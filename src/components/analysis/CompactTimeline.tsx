import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { BlurView } from 'expo-blur';
import { MotiView } from 'moti';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { ImpactBadge } from './ImpactBadge';

interface TimelineItem {
  timestamp: string;
  label: string;
  detail: string;
  impact: '+10' | '+5' | '0' | '-5' | '-10';
}

interface CompactTimelineProps {
  timeline: TimelineItem[];
  maxItems?: number;
}

export const CompactTimeline: React.FC<CompactTimelineProps> = ({
  timeline,
  maxItems = 6,
}) => {
  // Limiter à maxItems
  const displayItems = timeline.slice(0, maxItems);

  return (
    <MotiView
      from={{ opacity: 0, translateX: -50 }}
      animate={{ opacity: 1, translateX: 0 }}
      transition={{ type: 'timing', duration: 600, delay: 400 }}
      style={styles.container}
    >
      <BlurView intensity={20} tint="dark" style={styles.blurContainer}>
        <View style={styles.header}>
          <Ionicons name="time-outline" size={20} color={colors.primary} />
          <Text style={styles.title}>Timeline & Rétention</Text>
        </View>

        <View style={styles.timeline}>
          {displayItems.map((item, index) => (
            <MotiView
              key={index}
              from={{ opacity: 0, translateX: -20 }}
              animate={{ opacity: 1, translateX: 0 }}
              transition={{ type: 'timing', duration: 400, delay: 500 + index * 100 }}
              style={styles.item}
            >
              <View style={styles.itemLeft}>
                <View style={styles.timestamp}>
                  <Text style={styles.timestampText}>{item.timestamp}</Text>
                </View>
                {index < displayItems.length - 1 && <View style={styles.line} />}
              </View>

              <View style={styles.itemRight}>
                <View style={styles.itemHeader}>
                  <Text style={styles.itemLabel}>{item.label}</Text>
                  <ImpactBadge impact={item.impact} />
                </View>
                <Text style={styles.itemDetail} numberOfLines={2}>
                  {item.detail}
                </Text>
              </View>
            </MotiView>
          ))}
        </View>
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
    backgroundColor: 'rgba(255, 255, 255, 0.05)', // bg-white/5
    borderRadius: 32, // rounded-3xl (32px)
    padding: 28,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)', // border-white/20
    shadowColor: colors.glow.cyan,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
    marginLeft: 8,
  },
  timeline: {
    gap: 12,
  },
  item: {
    flexDirection: 'row',
  },
  itemLeft: {
    width: 50,
    alignItems: 'center',
    marginRight: 12,
  },
  timestamp: {
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.4)',
  },
  timestampText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: colors.primary,
  },
  line: {
    width: 2,
    flex: 1,
    backgroundColor: 'rgba(139, 92, 246, 0.3)',
    marginVertical: 4,
  },
  itemRight: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 16,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  itemLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text.primary,
    flex: 1,
  },
  itemDetail: {
    fontSize: 12,
    color: colors.text.secondary,
    lineHeight: 16,
  },
});

