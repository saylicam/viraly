import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { MotiView } from 'moti';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';

interface CompactNextIdeasProps {
  ideas: string[];
  maxItems?: number;
}

export const CompactNextIdeas: React.FC<CompactNextIdeasProps> = ({
  ideas,
  maxItems = 3,
}) => {
  const displayIdeas = ideas.slice(0, maxItems);

  return (
    <View style={styles.container}>
      <View style={styles.list}>
          {displayIdeas.map((idea, index) => (
            <View key={index} style={styles.ideaItem}>
              <View style={styles.ideaBullet}>
                <Ionicons name="lightbulb" size={16} color={colors.primary} />
              </View>
              <Text style={styles.ideaText} numberOfLines={2}>
                {idea}
              </Text>
            </View>
          ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 0,
  },
  blurContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)', // bg-white/5
    borderRadius: 32, // rounded-3xl (32px)
    padding: 28,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)', // border-white/20
    shadowColor: colors.glow.violet,
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
  list: {
    gap: 12,
  },
  ideaItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    borderRadius: 12,
    padding: 12,
  },
  ideaBullet: {
    marginRight: 12,
    marginTop: 2,
  },
  ideaText: {
    flex: 1,
    fontSize: 13,
    color: colors.text.primary,
    lineHeight: 18,
  },
});

