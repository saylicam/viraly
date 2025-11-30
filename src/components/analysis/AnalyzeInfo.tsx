import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Search, Zap, Target, TrendingUp, Trophy } from 'lucide-react-native';
import { GlassCard } from '../ui/GlassCard';
import { MotiView } from 'moti';

const BENEFITS = [
  { icon: Search, text: 'Analyse profonde de ton montage', color: '#8F5BFF' },
  { icon: Zap, text: 'Score viral instantané', color: '#D946EF' },
  { icon: Target, text: 'Conseils personnalisés', color: '#6EE7FF' },
  { icon: TrendingUp, text: 'Timeline + Retention Map', color: '#8F5BFF' },
  { icon: Trophy, text: 'Recommandations IA', color: '#D946EF' },
];

export const AnalyzeInfo: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>✨ Ce que l'analyse IA va t'apporter</Text>
      
      <GlassCard variant="default" style={styles.benefitsCard}>
        {BENEFITS.map((benefit, index) => {
          const Icon = benefit.icon;
          const isLast = index === BENEFITS.length - 1;
          
          return (
            <MotiView
              key={index}
              from={{ opacity: 0, translateX: -10 }}
              animate={{ opacity: 1, translateX: 0 }}
              transition={{ delay: index * 50 }}
            >
              <View>
                <View style={styles.benefitRow}>
                  <View
                    style={[
                      styles.iconContainer,
                      { backgroundColor: `${benefit.color}15` },
                    ]}
                  >
                    <Icon size={16} color={benefit.color} />
                  </View>
                  <Text style={styles.benefitText}>{benefit.text}</Text>
                </View>
                {!isLast && <View style={styles.separator} />}
              </View>
            </MotiView>
          );
        })}
      </GlassCard>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 0,
  },
  title: {
    fontSize: 17, // Réduit de 18
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 16,
    textAlign: 'center',
  },
  benefitsCard: {
    paddingVertical: 12, // Compact
    paddingHorizontal: 16,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10, // Hauteur réduite
  },
  iconContainer: {
    width: 28, // Réduit de 32
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  benefitText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.85)',
    flex: 1,
    fontWeight: '500',
  },
  separator: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginLeft: 40, // Aligné avec le texte
    marginVertical: 4,
  },
});
