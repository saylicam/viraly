import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from 'moti';
import { colors } from '../../theme/colors';
import { ScoreCircle } from './ScoreCircle';

interface HeroScoreCardProps {
  score: number;
  verdict: string;
  category: string;
  format: string;
}

export const HeroScoreCard: React.FC<HeroScoreCardProps> = ({
  score,
  verdict,
  category,
  format,
}) => {
  const getVerdictColor = (verdict: string): string[] => {
    if (verdict.includes('Excellent')) return ['#10B981', '#34D399']; // Vert émeraude
    if (verdict.includes('Très Bien')) return ['#F59E0B', '#FBBF24']; // Orange ambré
    if (verdict.includes('Bien')) return ['#8B5CF6', '#A78BFA']; // Violet
    return ['#EF4444', '#F87171']; // Rose/rouge
  };

  return (
    <MotiView
      from={{ opacity: 0, translateY: 50, scale: 0.95 }}
      animate={{ opacity: 1, translateY: 0, scale: 1 }}
      transition={{ type: 'spring', damping: 15, stiffness: 150, delay: 200 }}
      style={styles.container}
    >
      <BlurView intensity={25} tint="dark" style={styles.blurContainer}>
        <LinearGradient
          colors={['rgba(139, 92, 246, 0.1)', 'rgba(236, 72, 153, 0.05)', 'rgba(6, 182, 212, 0.1)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientOverlay}
        />
        
        <View style={styles.content}>
          {/* Cercle de score massif à gauche */}
          <View style={styles.scoreSection}>
            <ScoreCircle score={score} size={160} />
            <Text style={styles.scoreLabel}>Score Viral</Text>
          </View>

          {/* Texte explicatif à droite */}
          <View style={styles.textSection}>
            <Text style={styles.explanationText}>
              Basé sur l'engagement, la rétention et le potentiel de partage de ta vidéo.
            </Text>
            
            {/* Badge de niveau */}
            <LinearGradient
              colors={getVerdictColor(verdict) as any}
              style={styles.verdictBadge}
            >
              <Text style={styles.verdictText}>{verdict}</Text>
            </LinearGradient>

            {/* Infos supplémentaires */}
            <View style={styles.infoRow}>
              <View style={styles.infoBadge}>
                <Text style={styles.infoLabel}>Catégorie</Text>
                <Text style={styles.infoValue}>{category}</Text>
              </View>
              <View style={styles.infoBadge}>
                <Text style={styles.infoLabel}>Format</Text>
                <Text style={styles.infoValue}>{format}</Text>
              </View>
            </View>
          </View>
        </View>
      </BlurView>
    </MotiView>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 20,
    marginBottom: 24,
  },
  blurContainer: {
    borderRadius: 32, // rounded-3xl (32px)
    padding: 28,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)', // border-white/20
    backgroundColor: 'rgba(255, 255, 255, 0.05)', // bg-white/5
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3, // shadow-purple-500/30
    shadowRadius: 24,
    elevation: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 32,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
    zIndex: 1,
  },
  scoreSection: {
    alignItems: 'center',
    marginRight: 24,
  },
  scoreLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 12,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  textSection: {
    flex: 1,
  },
  explanationText: {
    fontSize: 15,
    color: '#94A3B8', // slate-400
    lineHeight: 22,
    marginBottom: 20,
  },
  verdictBadge: {
    alignSelf: 'flex-start',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginBottom: 16,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  verdictText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  infoRow: {
    flexDirection: 'row',
    gap: 12,
  },
  infoBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  infoLabel: {
    fontSize: 11,
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});








