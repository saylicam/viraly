import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from 'moti';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';

interface TimelineItem {
  timestamp: string;
  label: string;
  detail: string;
  impact: '+10' | '+5' | '0' | '-5' | '-10';
}

interface TimelineWithImpactProps {
  timeline: TimelineItem[];
  maxItems?: number;
}

export const TimelineWithImpact: React.FC<TimelineWithImpactProps> = ({
  timeline,
  maxItems = 8,
}) => {
  const displayItems = timeline.slice(0, maxItems);

  const getImpactConfig = (impact: string) => {
    switch (impact) {
      case '+10':
        return {
          bg: 'rgba(16, 185, 129, 0.2)', // bg-emerald-500/20
          border: 'rgba(16, 185, 129, 0.4)',
          text: '#10B981', // text-emerald-400
          label: 'Excellent',
        };
      case '+5':
        return {
          bg: 'rgba(52, 211, 153, 0.2)',
          border: 'rgba(52, 211, 153, 0.4)',
          text: '#34D399',
          label: 'Bon',
        };
      case '0':
        return {
          bg: 'rgba(107, 114, 128, 0.2)',
          border: 'rgba(107, 114, 128, 0.4)',
          text: '#9CA3AF',
          label: 'Neutre',
        };
      case '-5':
        return {
          bg: 'rgba(251, 146, 60, 0.2)', // bg-amber-500/20
          border: 'rgba(251, 146, 60, 0.4)',
          text: '#FB923C', // text-amber-400
          label: 'Faible',
        };
      case '-10':
        return {
          bg: 'rgba(244, 63, 94, 0.2)', // bg-rose-500/20
          border: 'rgba(244, 63, 94, 0.4)',
          text: '#F43F5E', // text-rose-500
          label: 'Critique',
        };
      default:
        return {
          bg: 'rgba(107, 114, 128, 0.2)',
          border: 'rgba(107, 114, 128, 0.4)',
          text: '#9CA3AF',
          label: 'Neutre',
        };
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.timeline}>
          {displayItems.map((item, index) => {
            const impactConfig = getImpactConfig(item.impact);
            const isLast = index === displayItems.length - 1;

            return (
              <MotiView
                key={index}
                from={{ opacity: 0, translateX: -20 }}
                animate={{ opacity: 1, translateX: 0 }}
                transition={{ type: 'timing', duration: 400, delay: 500 + index * 100 }}
                style={styles.timelineItem}
              >
                {/* Ligne verticale de connexion */}
                <View style={styles.timelineLeft}>
                  <View style={[styles.timelineDot, { backgroundColor: impactConfig.text }]} />
                  {!isLast && <View style={[styles.timelineLine, { backgroundColor: impactConfig.text + '40' }]} />}
                </View>

                {/* Contenu de l'item */}
                <View style={styles.timelineRight}>
                  <View style={styles.timelineHeader}>
                    <View style={styles.timestampContainer}>
                      <Text style={styles.timestamp}>{item.timestamp}</Text>
                    </View>
                    <View
                      style={[
                        styles.impactBadge,
                        {
                          backgroundColor: impactConfig.bg,
                          borderColor: impactConfig.border,
                        },
                      ]}
                    >
                      <Text style={[styles.impactText, { color: impactConfig.text }]}>
                        {item.impact}
                      </Text>
                    </View>
                  </View>
                  
                  <Text style={styles.timelineLabel}>{item.label}</Text>
                  <Text style={styles.timelineDetail} numberOfLines={2}>
                    {item.detail}
                  </Text>
                </View>
              </MotiView>
            );
          })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 0,
  },
  timelineContainer: {
    position: 'relative',
  },
  timeline: {
    position: 'relative',
    zIndex: 1,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  timelineLeft: {
    width: 24,
    alignItems: 'center',
    marginRight: 16,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    marginTop: 4,
    marginBottom: 4,
  },
  timelineRight: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 20,
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
  timestampContainer: {
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.4)',
  },
  timestamp: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#A78BFA',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  impactBadge: {
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderWidth: 1,
  },
  impactText: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  timelineLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  timelineDetail: {
    fontSize: 14,
    color: '#94A3B8',
    lineHeight: 20,
  },
});

