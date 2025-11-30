import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { BlurView } from 'expo-blur';
import { MotiView } from 'moti';
import { LucideIcon } from 'lucide-react-native';

interface TagProps {
  label: string;
  variant?: 'emotion' | 'hashtag';
  icon?: LucideIcon;
  delay?: number;
}

export const Tag: React.FC<TagProps> = ({
  label,
  variant = 'hashtag',
  icon: Icon,
  delay = 0,
}) => {
  const isEmotion = variant === 'emotion';
  const glowColor = isEmotion ? '#5DEFFF' : '#A56CFB';

  return (
    <MotiView
      from={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay }}
    >
      <BlurView intensity={15} tint="dark" style={styles.container}>
        <View style={[styles.tag, { shadowColor: glowColor }]}>
          {Icon && (
            <Icon size={14} color="white" style={styles.icon} />
          )}
          <Text style={styles.text}>{label}</Text>
        </View>
      </BlurView>
    </MotiView>
  );
};

interface TagsListProps {
  items: string[];
  variant?: 'emotion' | 'hashtag';
  title: string;
  delay?: number;
}

export const TagsList: React.FC<TagsListProps> = ({
  items,
  variant = 'hashtag',
  title,
  delay = 0,
}) => {
  if (!items || items.length === 0) return null;

  return (
    <MotiView
      from={{ opacity: 0, translateY: 20 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ delay }}
      style={styles.listContainer}
    >
      <Text style={styles.title}>{title}</Text>
      <View style={styles.tagsContainer}>
        {items.map((item, index) => {
          const cleanLabel = variant === 'hashtag' 
            ? (item.startsWith('#') ? item : `#${item}`)
            : item.replace(/[🎯🔥✨👍]/g, '').trim();
          
          return (
            <Tag
              key={index}
              label={cleanLabel}
              variant={variant}
              delay={delay + 100 + index * 50}
            />
          );
        })}
      </View>
    </MotiView>
  );
};

const styles = StyleSheet.create({
  listContainer: {
    marginBottom: 24,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  container: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  icon: {
    marginRight: 6,
  },
  text: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});







