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

interface TimelineCardProps {
  timeline: TimelineItem[];
}

export const TimelineCard: React.FC<TimelineCardProps> = ({ timeline }) => {
  return (
    <MotiView
      from={{ opacity: 0, translateX: -50 }}
      animate={{ opacity: 1, translateX: 0 }}
      transition={{ type: 'timing', duration: 600, delay: 400 }}
      style={styles.container}
    >
      <BlurView intensity={20} tint="dark" style={styles.blurContainer}>
        <View style={styles.header}>
          <Ionicons name="time-outline" size={24} color={colors.primary} />
          <Text style={styles.title}>TIMELINE & RÉTENTION</Text>
        </View>

        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
        >
          {timeline.map((item, index) => (
            <MotiView
              key={index}
              from={{ opacity: 0, translateX: -20 }}
              animate={{ opacity: 1, translateX: 0 }}
              transition={{ type: 'timing', duration: 400, delay: 500 + index * 100 }}
              style={styles.timelineItem}
            >
              <View style={styles.timelineLeft}>
                <View style={styles.timestampContainer}>
                  <Text style={styles.timestamp}>{item.timestamp}</Text>
                </View>
                {index < timeline.length - 1 && <View style={styles.timelineLine} />}
              </View>

              <View style={styles.timelineRight}>
                <View style={styles.timelineContent}>
                  <View style={styles.timelineHeader}>
                    <Text style={styles.timelineLabel}>{item.label}</Text>
                    <ImpactBadge impact={item.impact} />
                  </View>
                  <Text style={styles.timelineDetail}>{item.detail}</Text>
                </View>
              </View>
            </MotiView>
          ))}
        </ScrollView>
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
    shadowColor: colors.glow.cyan,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    maxHeight: 400,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginLeft: 8,
  },
  scrollView: {
    flex: 1,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  timelineLeft: {
    width: 60,
    alignItems: 'center',
    marginRight: 16,
  },
  timestampContainer: {
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    borderRadius: 12,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.4)',
  },
  timestamp: {
    fontSize: 11,
    fontWeight: 'bold',
    color: colors.primary,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: 'rgba(139, 92, 246, 0.3)',
    marginTop: 8,
    marginBottom: 8,
  },
  timelineRight: {
    flex: 1,
  },
  timelineContent: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  timelineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  timelineLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.text.primary,
    flex: 1,
  },
  timelineDetail: {
    fontSize: 13,
    color: colors.text.secondary,
    lineHeight: 18,
  },
});


