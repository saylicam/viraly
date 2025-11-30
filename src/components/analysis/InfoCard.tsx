import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { CheckCircle2, AlertTriangle } from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import { MotiView } from 'moti';

interface InfoCardProps {
  title: string;
  items: string[];
  variant: 'strengths' | 'weaknesses';
  delay?: number;
}

export const InfoCard: React.FC<InfoCardProps> = ({
  title,
  items,
  variant,
  delay = 0,
}) => {
  const isStrengths = variant === 'strengths';
  const Icon = isStrengths ? CheckCircle2 : AlertTriangle;
  const iconColor = isStrengths ? '#10B981' : '#FBBF24';
  const iconBg = isStrengths ? 'rgba(16, 185, 129, 0.15)' : 'rgba(251, 191, 36, 0.15)';

  return (
    <MotiView
      from={{ opacity: 0, translateY: 20 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ delay }}
    >
      <BlurView intensity={20} tint="dark" style={styles.container}>
        <View style={styles.header}>
          <View style={[styles.iconContainer, { backgroundColor: iconBg }]}>
            <Icon size={18} color={iconColor} />
          </View>
          <Text style={styles.title}>{title}</Text>
        </View>

        <View style={styles.items}>
          {items.map((item, index) => (
            <MotiView
              key={index}
              from={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: delay + 100 + index * 60 }}
              style={styles.item}
            >
              <View style={styles.itemContent}>
                <View style={[styles.bullet, { backgroundColor: iconColor }]} />
                <Text style={styles.itemText}>{item}</Text>
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
    marginBottom: 16,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  items: {
    gap: 12,
  },
  item: {
    marginBottom: 0,
  },
  itemContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 8,
    marginRight: 12,
  },
  itemText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
    color: 'rgba(255, 255, 255, 0.9)',
  },
});







