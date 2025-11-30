import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { MotiView } from 'moti';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import * as Haptics from 'expo-haptics';

interface AccordionProps {
  title: string;
  items: string[];
  icon?: keyof typeof Ionicons.glyphMap;
  color?: string;
  compact?: boolean;
}

export const Accordion: React.FC<AccordionProps> = ({
  title,
  items,
  icon = 'chevron-down',
  color = colors.primary,
  compact = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggle = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsExpanded(!isExpanded);
  };

  // Afficher seulement les 3 premiers items en mode compact
  const visibleItems = compact && !isExpanded ? items.slice(0, 3) : items;
  const hasMore = items.length > 3;

  return (
    <View style={styles.container}>
      <TouchableOpacity
        onPress={toggle}
        activeOpacity={0.7}
        style={styles.header}
      >
        <View style={styles.headerLeft}>
          {icon && <Ionicons name={icon} size={20} color={color} style={styles.icon} />}
          <Text style={[styles.title, { color }]}>{title}</Text>
          {hasMore && compact && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>+{items.length - 3}</Text>
            </View>
          )}
        </View>
        <MotiView
          animate={{ rotate: isExpanded ? '180deg' : '0deg' }}
          transition={{ type: 'timing', duration: 200 }}
        >
          <Ionicons name="chevron-down" size={20} color={color} />
        </MotiView>
      </TouchableOpacity>

      <MotiView
        animate={{
          height: isExpanded ? 'auto' : 0,
          opacity: isExpanded ? 1 : 0,
        }}
        transition={{ type: 'timing', duration: 300 }}
        style={styles.contentContainer}
      >
        <View style={styles.content}>
          {visibleItems.map((item, index) => (
            <View key={index} style={styles.item}>
              <View style={[styles.bullet, { backgroundColor: color }]} />
              <Text style={styles.itemText}>{item}</Text>
            </View>
          ))}
        </View>
      </MotiView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  icon: {
    marginRight: 8,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
  },
  badge: {
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 8,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.primary,
  },
  contentContainer: {
    overflow: 'hidden',
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 10,
    marginTop: 6,
  },
  itemText: {
    flex: 1,
    fontSize: 14,
    color: colors.text.secondary,
    lineHeight: 20,
  },
});








