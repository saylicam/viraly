import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Search, Zap, Target, TrendingUp } from 'lucide-react-native';
import { MotiView } from 'moti';

const BENEFITS = [
  { 
    icon: Search, 
    text: 'Analyse profonde de ton montage',
    color: '#FF4FF9', // Rose néon
  },
  { 
    icon: Zap, 
    text: 'Score viral instantané',
    color: '#B371FF', // Violet clair néon
  },
  { 
    icon: Target, 
    text: 'Conseils personnalisés',
    color: '#4FC3FF', // Bleu néon
  },
  { 
    icon: TrendingUp, 
    text: 'Timeline + Retention Map',
    color: '#FFD84F', // Jaune néon
  },
];

export const AnalyzeInfo: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Ce que l'analyse IA va t'apporter</Text>
      
      {/* Spacer */}
      <View style={{ height: 14 }} />

      {BENEFITS.map((benefit, index) => {
        const Icon = benefit.icon;
        
        return (
          <MotiView
            key={index}
            from={{ opacity: 0, translateY: 10 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ delay: index * 80 }}
          >
            <View style={styles.benefitCard}>
              <Icon size={24} color={benefit.color} strokeWidth={2.5} style={{ marginRight: 14 }} />
              <Text style={styles.benefitText}>{benefit.text}</Text>
            </View>
          </MotiView>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 0,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 0,
  },
  benefitCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1B0730',
    borderRadius: 22,
    paddingVertical: 18,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: 'rgba(179, 113, 255, 0.35)',
    shadowColor: '#7B33F7',
    shadowOpacity: 0.22,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    marginBottom: 12,
    elevation: 8,
  },
  benefitText: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
});
