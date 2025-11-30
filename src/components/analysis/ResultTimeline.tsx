import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Clock } from 'lucide-react-native';
import { GlassCard } from '../ui/GlassCard';
import { MotiView } from 'moti';

interface TimelineItem {
  timestamp: string;
  label: string;
  detail?: string;
  impact: string; // "+10" ou "-5"
}

interface TimelineProps {
  items: TimelineItem[];
}

export const Timeline: React.FC<TimelineProps> = ({ items }) => {
  return (
    <MotiView
      from={{ opacity: 0, translateY: 20 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ delay: 500 }}
    >
      <GlassCard variant="highlight" style={styles.container}>
        <View style={styles.header}>
          <Clock size={18} color="#8F5BFF" />
          <Text style={styles.title}>Timeline & Rétention</Text>
        </View>

        <View style={styles.timelineContainer}>
          {/* Ligne verticale */}
          <View style={styles.verticalLine} />
          
          {items.map((item, index) => {
            const isPositive = item.impact?.includes('+');
            const impactValue = parseInt(item.impact?.replace(/[+-]/g, '') || '0');
            const impactColor = isPositive ? '#10B981' : '#F43F5E';
            
            return (
              <MotiView
                key={index}
                from={{ opacity: 0, translateX: -20 }}
                animate={{ opacity: 1, translateX: 0 }}
                transition={{ delay: 600 + index * 80 }}
                style={styles.timelineItem}
              >
                {/* Point sur ligne */}
                <View
                  style={[
                    styles.timelineDot,
                    { backgroundColor: impactColor },
                  ]}
                />
                
                {/* Barre de progression verticale */}
                <View style={styles.progressBarContainer}>
                  <View
                    style={[
                      styles.progressBar,
                      {
                        height: `${Math.min(impactValue * 5, 100)}%`,
                        backgroundColor: impactColor,
                      },
                    ]}
                  />
                </View>

                {/* Contenu */}
                <View style={styles.content}>
                  <View style={styles.contentHeader}>
                    <Text style={styles.timestamp}>{item.timestamp}</Text>
                    <View
                      style={[
                        styles.impactBadge,
                        {
                          backgroundColor: `${impactColor}20`,
                          borderColor: impactColor,
                        },
                      ]}
                    >
                      <Text style={[styles.impactText, { color: impactColor }]}>
                        {item.impact}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.label}>{item.label}</Text>
                  {item.detail && (
                    <Text style={styles.detail}>{item.detail}</Text>
                  )}
                </View>
              </MotiView>
            );
          })}
        </View>
      </GlassCard>
    </MotiView>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  timelineContainer: {
    position: 'relative',
    paddingLeft: 8,
  },
  verticalLine: {
    position: 'absolute',
    left: 19,
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
    position: 'relative',
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#0F051D',
    position: 'absolute',
    left: 13,
    top: 6,
    zIndex: 10,
  },
  progressBarContainer: {
    width: 4,
    height: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 2,
    marginLeft: 24,
    marginRight: 12,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  progressBar: {
    width: '100%',
    borderRadius: 2,
    minHeight: 4,
  },
  content: {
    flex: 1,
    paddingTop: 2,
  },
  contentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  timestamp: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6EE7FF',
  },
  impactBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  impactText: {
    fontSize: 11,
    fontWeight: '800',
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  detail: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.6)',
  },
});







