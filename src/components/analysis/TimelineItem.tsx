import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Clock } from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import { MotiView } from 'moti';

interface TimelineItem {
  timestamp: string;
  label: string;
  detail?: string;
  impact: string;
}

interface TimelineItemProps {
  item: TimelineItem;
  index: number;
  isLast: boolean;
}

const TimelineItemComponent: React.FC<TimelineItemProps> = ({ item, index, isLast }) => {
  const isPositive = item.impact?.includes('+');
  const impactColor = isPositive ? '#10B981' : '#F43F5E';

  return (
    <MotiView
      from={{ opacity: 0, translateX: -20 }}
      animate={{ opacity: 1, translateX: 0 }}
      transition={{ delay: 500 + index * 80 }}
      style={styles.itemContainer}
    >
      <View style={styles.itemContent}>
        {/* Timeline dot */}
        <View style={styles.timelineDotContainer}>
          <View style={[styles.timelineDot, { backgroundColor: impactColor }]} />
          {!isLast && <View style={styles.timelineLine} />}
        </View>

        {/* Content */}
        <View style={styles.content}>
          <View style={styles.contentHeader}>
            <Text style={styles.timestamp}>{item.timestamp}</Text>
            <View style={[styles.badge, { backgroundColor: `${impactColor}20`, borderColor: impactColor }]}>
              <Text style={[styles.badgeText, { color: impactColor }]}>{item.impact}</Text>
            </View>
          </View>
          <Text style={styles.label}>{item.label}</Text>
          {item.detail && <Text style={styles.detail}>{item.detail}</Text>}
        </View>
      </View>
      {!isLast && <View style={styles.separator} />}
    </MotiView>
  );
};

interface TimelineProps {
  items: TimelineItem[];
}

export const Timeline: React.FC<TimelineProps> = ({ items }) => {
  return (
    <MotiView
      from={{ opacity: 0, translateY: 20 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ delay: 400 }}
    >
      <BlurView intensity={20} tint="dark" style={styles.container}>
        <View style={styles.header}>
          <Clock size={18} color="#A56CFB" />
          <Text style={styles.title}>Timeline & Rétention</Text>
        </View>

        <View style={styles.timeline}>
          {items.map((item, index) => (
            <TimelineItemComponent
              key={index}
              item={item}
              index={index}
              isLast={index === items.length - 1}
            />
          ))}
        </View>
      </BlurView>
    </MotiView>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    padding: 20,
    marginBottom: 24,
    shadowColor: '#A56CFB',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 8,
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
  timeline: {
    paddingLeft: 8,
  },
  itemContainer: {
    marginBottom: 0,
  },
  itemContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  timelineDotContainer: {
    width: 24,
    alignItems: 'center',
    marginRight: 12,
  },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: '#0B0716',
    zIndex: 10,
  },
  timelineLine: {
    width: 1,
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginTop: 4,
    minHeight: 40,
  },
  content: {
    flex: 1,
    paddingBottom: 16,
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
    color: '#5DEFFF',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
  },
  badgeText: {
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
    lineHeight: 18,
  },
  separator: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginLeft: 36,
    marginVertical: 8,
  },
});

