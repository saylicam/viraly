import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { ArrowLeft, Zap, Target, Video, TrendingUp, BarChart3, CheckCircle2, AlertTriangle, Clock, Hash, Sparkles, FileText, Award, Lightbulb, Eye, TrendingDown } from 'lucide-react-native';
import { MotiView } from 'moti';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Video as ExpoVideo, ResizeMode } from 'expo-av';
import { theme } from '../theme';

const { width } = Dimensions.get('window');

export default function AnalysisResultScreen({ navigation, route }: any) {
  const { result, videoUri } = route.params;
  // Le result contient directement les données de l'analyse (pas besoin de .premium)
  const analysis = result.premium || result;
  const videoRef = React.useRef<ExpoVideo>(null);
  
  // Debug: Afficher la structure reçue
  React.useEffect(() => {
    console.log('📱 AnalysisResultScreen - Structure reçue:');
    console.log('   Keys dans result:', Object.keys(result || {}).slice(0, 10));
    console.log('   Keys dans analysis:', Object.keys(analysis || {}).slice(0, 10));
    console.log('   description_video présent:', !!analysis?.description_video);
    console.log('   avis_global présent:', !!analysis?.avis_global);
    console.log('   analyse_viralite présent:', !!analysis?.analyse_viralite);
  }, [result, analysis]);
  
  // Extraction des données depuis la NOUVELLE structure JSON simplifiée (6 blocs)
  const resumeVideo = analysis?.resume_video || 'Résumé vidéo en cours de génération.';
  const avisGlobal = analysis?.avis_global || 'Analyse en cours de traitement.';
  const pourquoiCaPerce = analysis?.pourquoi_ca_perce || [];
  const pourquoiCaFloppe = analysis?.pourquoi_ca_floppe || [];
  const conseilsAmelioration = analysis?.conseils_amelioration || [];
  const caption = analysis?.caption || 'Caption optimisée en cours de génération.';
  const hashtags = analysis?.hashtags || [];
  const scoreSur100 = analysis?.score_sur_100 || 70;
  const chanceTrend = analysis?.chance_trend || '30%';
  const vuesAttendues = analysis?.vues_attendues || '20k-200k';
  const niveauConfiance = analysis?.niveau_confiance || 'Moyen';
  const meilleursHoraires = analysis?.meilleurs_horaires || ['12:00', '18:00', '20:00'];
  
  // Compatibilité legacy (si l'ancien format est encore présent)
  const descriptionVideo = analysis?.description_video || resumeVideo;

  React.useEffect(() => {
    const playVideo = async () => {
      if (videoRef.current) {
        try {
          await videoRef.current.playAsync();
        } catch (error) {
          console.error('Error playing video:', error);
        }
      }
    };
    if (videoUri) playVideo();
  }, [videoUri]);

  // Fonction pour obtenir la couleur du verdict
  const getVerdictColor = (verdict: string) => {
    const text = verdict?.toLowerCase() || '';
    if (text.includes('excellent')) return '#42FFB0';
    if (text.includes('bon')) return '#4F7BFF';
    if (text.includes('moyen')) return '#FFB85C';
    return '#FF6B6B';
  };

  // Fonction pour obtenir la couleur du niveau de confiance
  const getConfidenceColor = (niveau: string) => {
    const text = niveau?.toLowerCase() || '';
    if (text.includes('fort')) return '#42FFB0';
    if (text.includes('moyen')) return '#FFB85C';
    return '#FF6B6B';
  };

  return (
    <View style={styles.container}>
      {/* Background avec gradient V1 */}
      <LinearGradient
        colors={['#0D0017', '#140026']}
        locations={[0, 1]}
        style={StyleSheet.absoluteFillObject}
      />
      
      {/* Header avec bouton retour */}
      <View style={styles.headerContainer}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <BlurView intensity={30} tint="dark" style={styles.backButtonBlur}>
            <ArrowLeft color="white" size={20} />
          </BlurView>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          {/* 1️⃣ Vidéo analysée */}
          {videoUri && (
            <MotiView
              from={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', delay: 100 }}
            >
              <View style={styles.videoCard}>
                <View style={styles.videoHeader}>
                  <View style={styles.videoHeaderLeft}>
                    <View style={styles.videoIconContainer}>
                      <Video size={18} color={theme.colors.primary} />
                    </View>
                    <Text style={styles.videoTitle}>Vidéo analysée</Text>
                  </View>
                  <View style={styles.iaTag}>
                    <Sparkles size={12} color="#FFFFFF" />
                    <Text style={styles.iaTagText}>Analyse IA complète</Text>
                  </View>
                </View>
                <View style={styles.videoWrapper}>
                  <LinearGradient
                    colors={['rgba(144, 19, 254, 0.1)', 'transparent', 'rgba(255, 46, 240, 0.1)']}
                    style={styles.videoGradient}
                  />
                  <ExpoVideo
                    ref={videoRef}
                    source={{ uri: videoUri }}
                    style={styles.video}
                    resizeMode={ResizeMode.COVER}
                    isLooping
                    isMuted
                    shouldPlay
                  />
                </View>
              </View>
            </MotiView>
          )}

          {/* 2️⃣ Score global + Confiance */}
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ delay: 200 }}
            style={styles.statsContainer}
          >
            <View style={styles.statsGrid}>
              <StatCardV1
                icon={Target}
                label="Score global"
                value={`${avisGlobal.note_sur_100 || 70}`}
                unit="/100"
                gradient={theme.colors.gradient.primary}
                delay={250}
              />
              <StatCardV1
                icon={BarChart3}
                label="Confiance"
                value={predictionPerformance.niveau_confiance || 'Moyen'}
                gradient={getConfidenceColor(predictionPerformance.niveau_confiance || 'Moyen') === '#42FFB0' ? ['#42FFB0', '#10B981'] : getConfidenceColor(predictionPerformance.niveau_confiance || 'Moyen') === '#FFB85C' ? ['#FFB85C', '#F59E0B'] : ['#FF6B6B', '#EF4444']}
                delay={300}
              />
            </View>
          </MotiView>

          {/* 3️⃣ Description vidéo (obligatoire et détaillée) */}
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ delay: 350 }}
          >
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionIconContainer}>
                  <FileText size={20} color={theme.colors.primary} />
                </View>
                <Text style={styles.sectionTitle}>Description vidéo</Text>
              </View>
              <Text style={styles.descriptionText}>{descriptionVideo}</Text>
            </View>
          </MotiView>

          {/* 4️⃣ Avis global de l'IA */}
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ delay: 450 }}
          >
            <View style={styles.avisCard}>
              <LinearGradient
                colors={['rgba(144, 19, 254, 0.15)', 'rgba(255, 46, 240, 0.1)']}
                style={styles.avisGradient}
              >
                <View style={styles.avisHeader}>
                  <View style={styles.avisIconContainer}>
                    <Award size={28} color={getVerdictColor(avisGlobal.verdict || 'Moyen')} />
                  </View>
                  <View style={styles.avisHeaderText}>
                    <Text style={styles.avisTitle}>Avis global de l'IA</Text>
                    <View style={[styles.verdictBadge, { borderColor: getVerdictColor(avisGlobal.verdict || 'Moyen') }]}>
                      <Text style={[styles.verdictBadgeText, { color: getVerdictColor(avisGlobal.verdict || 'Moyen') }]}>
                        {avisGlobal.verdict || 'Moyen'}
                      </Text>
                    </View>
                  </View>
                </View>
                <Text style={styles.avisRaison}>{avisGlobal.raison || 'Analyse en cours...'}</Text>
              </LinearGradient>
            </View>
          </MotiView>

          {/* 5️⃣ Analyse de viralité */}
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ delay: 550 }}
          >
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionIconContainer}>
                  <TrendingUp size={20} color={theme.colors.secondary} />
                </View>
                <Text style={styles.sectionTitle}>Analyse de viralité</Text>
              </View>
              
              {/* Pourquoi ça peut percer */}
              <View style={styles.viraliteSection}>
                <View style={styles.viraliteHeader}>
                  <CheckCircle2 size={18} color="#42FFB0" />
                  <Text style={styles.viraliteTitle}>Pourquoi ça peut percer</Text>
                </View>
                <Text style={styles.viraliteText}>{analyseViralite.pourquoi_ca_peut_percer || 'Analyse du potentiel viral'}</Text>
              </View>

              {/* Pourquoi ça peut flopper */}
              <View style={styles.viraliteSection}>
                <View style={styles.viraliteHeader}>
                  <AlertTriangle size={18} color="#FF6B6B" />
                  <Text style={styles.viraliteTitle}>Pourquoi ça peut flopper</Text>
                </View>
                <Text style={styles.viraliteText}>{analyseViralite.pourquoi_ca_peut_flopper || 'Analyse des risques'}</Text>
              </View>

              {/* Points forts */}
              {analyseViralite.points_forts && analyseViralite.points_forts.length > 0 && (
                <View style={styles.viraliteSection}>
                  <Text style={styles.viraliteSubtitle}>Points forts</Text>
                  <View style={styles.pillsContainer}>
                    {analyseViralite.points_forts.map((item: string, index: number) => (
                      <PremiumPill key={index} text={item} variant="success" delay={600 + index * 50} />
                    ))}
                  </View>
                </View>
              )}

              {/* Points faibles */}
              {analyseViralite.points_faibles && analyseViralite.points_faibles.length > 0 && (
                <View style={styles.viraliteSection}>
                  <Text style={styles.viraliteSubtitle}>Points faibles</Text>
                  <View style={styles.pillsContainer}>
                    {analyseViralite.points_faibles.map((item: string, index: number) => (
                      <PremiumPill key={index} text={item} variant="warning" delay={650 + index * 50} />
                    ))}
                  </View>
                </View>
              )}

              {/* Opportunités */}
              {analyseViralite.opportunites && analyseViralite.opportunites.length > 0 && (
                <View style={styles.viraliteSection}>
                  <Text style={styles.viraliteSubtitle}>Opportunités</Text>
                  <View style={styles.pillsContainer}>
                    {analyseViralite.opportunites.map((item: string, index: number) => (
                      <PremiumPill key={index} text={item} variant="info" delay={700 + index * 50} />
                    ))}
                  </View>
                </View>
              )}

              {/* Risques */}
              {analyseViralite.risques && analyseViralite.risques.length > 0 && (
                <View style={styles.viraliteSection}>
                  <Text style={styles.viraliteSubtitle}>Risques</Text>
                  <View style={styles.pillsContainer}>
                    {analyseViralite.risques.map((item: string, index: number) => (
                      <PremiumPill key={index} text={item} variant="danger" delay={750 + index * 50} />
                    ))}
                  </View>
                </View>
              )}
            </View>
          </MotiView>

          {/* 6️⃣ Stats prédictives */}
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ delay: 800 }}
          >
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionIconContainer}>
                  <Eye size={20} color={theme.colors.accent} />
                </View>
                <Text style={styles.sectionTitle}>Stats prédictives</Text>
              </View>
              <View style={styles.statsPredictiveGrid}>
                <PredictiveStat
                  label="Chance de trend"
                  value={predictionPerformance.chance_de_trend || '30%'}
                  icon={Zap}
                  delay={850}
                />
                <PredictiveStat
                  label="Vues probables"
                  value={predictionPerformance.vues_probables || '20k–200k'}
                  icon={TrendingUp}
                  delay={900}
                />
              </View>
            </View>
          </MotiView>

          {/* 7️⃣ Recommandations IA (top 5) */}
          {recommandationsPrecises.ameliorations_prioritaires && recommandationsPrecises.ameliorations_prioritaires.length > 0 && (
            <MotiView
              from={{ opacity: 0, translateY: 20 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ delay: 950 }}
            >
              <View style={styles.sectionCard}>
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionIconContainer}>
                    <Lightbulb size={20} color={theme.colors.primary} />
                  </View>
                  <Text style={styles.sectionTitle}>Recommandations IA</Text>
                </View>
                <View style={styles.recommendationsContainer}>
                  {recommandationsPrecises.ameliorations_prioritaires.slice(0, 5).map((item: string, index: number) => (
                    <View key={index} style={styles.recommendationItem}>
                      <View style={styles.recommendationBullet} />
                      <Text style={styles.recommendationText}>{item}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </MotiView>
          )}

          {/* 8️⃣ Moments critiques */}
          {momentsCritiques && momentsCritiques.length > 0 && (
            <MotiView
              from={{ opacity: 0, translateY: 20 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ delay: 1050 }}
            >
              <View style={styles.sectionCard}>
                <View style={styles.sectionHeader}>
                  <View style={[styles.sectionIconContainer, { backgroundColor: 'rgba(255, 107, 107, 0.2)' }]}>
                    <AlertTriangle size={20} color={theme.colors.error} />
                  </View>
                  <Text style={styles.sectionTitle}>Moments critiques</Text>
                </View>
                <View style={styles.criticalMomentsContainer}>
                  {momentsCritiques.map((moment: any, index: number) => (
                    <View key={index} style={styles.criticalMomentItem}>
                      <Text style={styles.criticalMomentTimestamp}>{moment.timestamp}</Text>
                      <Text style={styles.criticalMomentRisque}>{moment.risque}</Text>
                      <Text style={styles.criticalMomentConsequence}>{moment.consequence}</Text>
                      <Text style={styles.criticalMomentSuggestion}>💡 {moment.suggestion}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </MotiView>
          )}

          {/* 9️⃣ Checklist créateur */}
          {checklistFinale && checklistFinale.length > 0 && (
            <MotiView
              from={{ opacity: 0, translateY: 20 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ delay: 1150 }}
            >
              <View style={styles.sectionCard}>
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionIconContainer}>
                    <CheckCircle2 size={20} color={theme.colors.success} />
                  </View>
                  <Text style={styles.sectionTitle}>Checklist créateur</Text>
                </View>
                <View style={styles.checklistContainer}>
                  {checklistFinale.map((item: string, index: number) => (
                    <View key={index} style={styles.checklistItem}>
                      <CheckCircle2 size={16} color={theme.colors.success} />
                      <Text style={styles.checklistText}>{item}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </MotiView>
          )}

          {/* 🔟 Caption optimisée + hashtags */}
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ delay: 1250 }}
          >
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionIconContainer}>
                  <FileText size={20} color={theme.colors.secondary} />
                </View>
                <Text style={styles.sectionTitle}>Caption optimisée</Text>
              </View>
              <View style={styles.captionContainer}>
                <Text style={styles.captionText}>{captionOptimisee}</Text>
              </View>
              {hashtagsRecommandes && hashtagsRecommandes.length > 0 && (
                <>
                  <View style={styles.hashtagsHeader}>
                    <Hash size={18} color={theme.colors.primary} />
                    <Text style={styles.hashtagsTitle}>Hashtags recommandés</Text>
                  </View>
                  <View style={styles.pillsContainer}>
                    {hashtagsRecommandes.map((item: string, index: number) => {
                      const cleanHashtag = item.startsWith('#') ? item : `#${item}`;
                      return (
                        <PremiumPill key={index} text={cleanHashtag} variant="hashtag" delay={1300 + index * 50} />
                      );
                    })}
                  </View>
                </>
              )}
            </View>
          </MotiView>

          {/* 1️⃣1️⃣ Meilleurs horaires */}
          {meilleursHoraires && meilleursHoraires.length > 0 && (
            <MotiView
              from={{ opacity: 0, translateY: 20 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ delay: 1400 }}
            >
              <View style={styles.sectionCard}>
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionIconContainer}>
                    <Clock size={20} color={theme.colors.accent} />
                  </View>
                  <Text style={styles.sectionTitle}>Meilleurs horaires</Text>
                </View>
                <View style={styles.timesContainer}>
                  {meilleursHoraires.map((time: string, index: number) => (
                    <View key={index} style={styles.timeItem}>
                      <Text style={styles.timeText}>{time}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </MotiView>
          )}

          {/* 1️⃣2️⃣ Timeline & Rétention (tout à la fin) */}
          {timelineDetaillee && timelineDetaillee.length > 0 && (
            <MotiView
              from={{ opacity: 0, translateY: 20 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ delay: 1500 }}
            >
              <View style={styles.sectionCard}>
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionIconContainer}>
                    <Clock size={20} color={theme.colors.accent} />
                  </View>
                  <Text style={styles.sectionTitle}>Timeline & Rétention</Text>
                </View>
                <View style={styles.timelineContainer}>
                  {timelineDetaillee.map((item: any, index: number, arr: any[]) => (
                    <TimelineItemV1
                      key={index}
                      item={item}
                      index={index}
                      isLast={index === arr.length - 1}
                    />
                  ))}
                </View>
              </View>
            </MotiView>
          )}

          {/* Bouton "Nouvelle Analyse" */}
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ delay: 1600 }}
            style={styles.buttonContainer}
          >
            <TouchableOpacity
              onPress={() => navigation.navigate('Analyze')}
              activeOpacity={0.85}
              style={styles.premiumButton}
            >
              <LinearGradient
                colors={theme.colors.gradient.button}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.premiumButtonGradient}
              >
                <Zap size={22} color="#FFFFFF" style={{ marginRight: 10 }} />
                <Text style={styles.premiumButtonText}>Nouvelle Analyse</Text>
              </LinearGradient>
            </TouchableOpacity>
          </MotiView>
        </View>
      </ScrollView>
    </View>
  );
}

// Composant StatCardV1
const StatCardV1 = ({ icon: Icon, label, value, unit, gradient, delay }: any) => {
  return (
    <MotiView
      from={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, type: 'spring' }}
      style={styles.statCard}
    >
      <View style={styles.statCardContent}>
        <LinearGradient
          colors={gradient}
          style={styles.statIconContainer}
        >
          <Icon size={18} color="#FFFFFF" />
        </LinearGradient>
        <View style={styles.statValueContainer}>
          <Text style={styles.statValue}>{value}</Text>
          {unit && <Text style={styles.statUnit}>{unit}</Text>}
        </View>
        <Text style={styles.statLabel}>{label}</Text>
      </View>
    </MotiView>
  );
};

// Composant PredictiveStat
const PredictiveStat = ({ label, value, icon: Icon, delay }: any) => {
  return (
    <MotiView
      from={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, type: 'spring' }}
      style={styles.predictiveStatCard}
    >
      <View style={styles.predictiveStatContent}>
        <Icon size={20} color={theme.colors.accent} />
        <Text style={styles.predictiveStatValue}>{value}</Text>
        <Text style={styles.predictiveStatLabel}>{label}</Text>
      </View>
    </MotiView>
  );
};

// Composant TimelineItemV1
const TimelineItemV1 = ({ item, index, isLast }: any) => {
  const isPositive = item.impact?.includes('+');
  const impactColor = isPositive ? theme.colors.success : item.impact === '0' ? '#6B7280' : theme.colors.error;

  return (
    <MotiView
      from={{ opacity: 0, translateX: -20 }}
      animate={{ opacity: 1, translateX: 0 }}
      transition={{ delay: 1550 + index * 80 }}
      style={styles.timelineItem}
    >
      <View style={styles.timelineItemContent}>
        <View style={styles.timelineDotContainer}>
          <View style={[styles.timelineDot, { backgroundColor: impactColor }]} />
          {!isLast && <View style={styles.timelineLine} />}
        </View>
        <View style={styles.timelineContent}>
          <View style={styles.timelineHeader}>
            <Text style={styles.timelineTimestamp}>{item.timestamp}</Text>
            <View style={[styles.timelineBadge, { borderColor: impactColor }]}>
              <Text style={[styles.timelineBadgeText, { color: impactColor }]}>{item.impact}</Text>
            </View>
          </View>
          <Text style={styles.timelineLabel}>{item.titre}</Text>
          <Text style={styles.timelineDetail}>{item.commentaire}</Text>
        </View>
      </View>
    </MotiView>
  );
};

// Composant PremiumPill - Badges avec gradient neon et glow
const PremiumPill = ({ text, variant, delay }: any) => {
  const variantStyles = {
    success: {
      bg: 'rgba(66, 255, 176, 0.15)',
      border: 'rgba(66, 255, 176, 0.5)',
      text: '#42FFB0',
      glow: '#42FFB0',
    },
    warning: {
      bg: 'rgba(255, 184, 92, 0.15)',
      border: 'rgba(255, 184, 92, 0.5)',
      text: '#FFB85C',
      glow: '#FFB85C',
    },
    info: {
      bg: 'rgba(79, 123, 255, 0.15)',
      border: 'rgba(79, 123, 255, 0.5)',
      text: '#4F7BFF',
      glow: '#4F7BFF',
    },
    danger: {
      bg: 'rgba(255, 107, 107, 0.15)',
      border: 'rgba(255, 107, 107, 0.5)',
      text: '#FF6B6B',
      glow: '#FF6B6B',
    },
    hashtag: {
      bg: 'rgba(144, 19, 254, 0.15)',
      border: 'rgba(144, 19, 254, 0.5)',
      text: '#9013FE',
      glow: '#9013FE',
    },
  };

  const style = variantStyles[variant as keyof typeof variantStyles] || variantStyles.hashtag;

  return (
    <MotiView
      from={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, type: 'spring' }}
    >
      <View style={[styles.premiumPill, { 
        backgroundColor: style.bg, 
        borderColor: style.border,
        shadowColor: style.glow,
      }]}>
        <Text style={[styles.premiumPillText, { color: style.text }]}>{text}</Text>
      </View>
    </MotiView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    position: 'absolute',
    top: 50,
    left: 24,
    zIndex: 50,
  },
  backButton: {
    width: 44,
    height: 44,
  },
  backButtonBlur: {
    width: '100%',
    height: '100%',
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingTop: 100,
    paddingBottom: 40,
  },
  content: {
    paddingHorizontal: 20,
  },
  // Video Card
  videoCard: {
    borderRadius: 28,
    backgroundColor: 'rgba(144, 19, 254, 0.1)',
    borderWidth: 2,
    borderColor: 'rgba(144, 19, 254, 0.4)',
    padding: 24,
    marginBottom: 28,
    shadowColor: '#9013FE',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 12,
  },
  videoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  videoHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  videoIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(144, 19, 254, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  videoTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  iaTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 46, 240, 0.3)',
    borderWidth: 1,
    borderColor: 'rgba(255, 46, 240, 0.5)',
    gap: 8,
  },
  iaTagText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  videoWrapper: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#000000',
    position: 'relative',
  },
  videoGradient: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
    pointerEvents: 'none',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  // Stats Grid
  statsContainer: {
    marginBottom: 28,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 16,
  },
  statCard: {
    flex: 1,
  },
  statCardContent: {
    borderRadius: 28,
    backgroundColor: 'rgba(144, 19, 254, 0.1)',
    borderWidth: 2,
    borderColor: 'rgba(144, 19, 254, 0.4)',
    padding: 24,
    alignItems: 'center',
    minHeight: 140,
    justifyContent: 'center',
    shadowColor: '#9013FE',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  statIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  statValueContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  statUnit: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.7)',
    marginLeft: 4,
  },
  statLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  // Section Card
  sectionCard: {
    borderRadius: 28,
    backgroundColor: 'rgba(144, 19, 254, 0.1)',
    borderWidth: 2,
    borderColor: 'rgba(144, 19, 254, 0.4)',
    padding: 28,
    marginBottom: 28,
    shadowColor: '#9013FE',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(144, 19, 254, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(144, 19, 254, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  descriptionText: {
    fontSize: 16,
    lineHeight: 28,
    color: 'rgba(255, 255, 255, 0.95)',
    letterSpacing: 0.2,
  },
  // Avis Card
  avisCard: {
    borderRadius: 28,
    backgroundColor: 'rgba(144, 19, 254, 0.1)',
    borderWidth: 2,
    borderColor: 'rgba(144, 19, 254, 0.4)',
    marginBottom: 28,
    overflow: 'hidden',
    shadowColor: '#9013FE',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 12,
  },
  avisGradient: {
    padding: 28,
  },
  avisHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avisIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(144, 19, 254, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    borderWidth: 1,
    borderColor: 'rgba(144, 19, 254, 0.4)',
  },
  avisHeaderText: {
    flex: 1,
  },
  avisTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 8,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  verdictBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 2,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    alignSelf: 'flex-start',
  },
  verdictBadgeText: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  avisRaison: {
    fontSize: 16,
    lineHeight: 24,
    color: 'rgba(255, 255, 255, 0.95)',
    letterSpacing: 0.2,
  },
  // Viralité Section
  viraliteSection: {
    marginBottom: 24,
  },
  viraliteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 10,
  },
  viraliteTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  viraliteSubtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 12,
    letterSpacing: 0.2,
  },
  viraliteText: {
    fontSize: 15,
    lineHeight: 24,
    color: 'rgba(255, 255, 255, 0.85)',
    letterSpacing: 0.1,
  },
  // Stats Prédictives
  statsPredictiveGrid: {
    flexDirection: 'row',
    gap: 16,
  },
  predictiveStatCard: {
    flex: 1,
  },
  predictiveStatContent: {
    borderRadius: 20,
    backgroundColor: 'rgba(79, 123, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(79, 123, 255, 0.3)',
    padding: 20,
    alignItems: 'center',
  },
  predictiveStatValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 12,
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  predictiveStatLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  // Recommendations
  recommendationsContainer: {
    gap: 14,
  },
  recommendationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  recommendationBullet: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.primary,
    marginTop: 8,
  },
  recommendationText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
    color: 'rgba(255, 255, 255, 0.9)',
    letterSpacing: 0.1,
  },
  // Critical Moments
  criticalMomentsContainer: {
    gap: 16,
  },
  criticalMomentItem: {
    padding: 20,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    borderWidth: 2,
    borderColor: 'rgba(255, 107, 107, 0.4)',
  },
  criticalMomentTimestamp: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.error,
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  criticalMomentRisque: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
    letterSpacing: 0.2,
  },
  criticalMomentConsequence: {
    fontSize: 15,
    lineHeight: 22,
    color: 'rgba(255, 255, 255, 0.85)',
    marginBottom: 12,
    letterSpacing: 0.1,
  },
  criticalMomentSuggestion: {
    fontSize: 15,
    lineHeight: 22,
    color: 'rgba(255, 255, 255, 0.9)',
    fontStyle: 'italic',
    letterSpacing: 0.1,
  },
  // Checklist
  checklistContainer: {
    gap: 14,
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  checklistText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
    color: 'rgba(255, 255, 255, 0.9)',
    letterSpacing: 0.1,
  },
  // Caption
  captionContainer: {
    marginBottom: 20,
  },
  captionText: {
    fontSize: 16,
    lineHeight: 26,
    color: 'rgba(255, 255, 255, 0.95)',
    letterSpacing: 0.2,
  },
  hashtagsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 10,
  },
  hashtagsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
    letterSpacing: 0.2,
  },
  // Times
  timesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  timeItem: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 24,
    backgroundColor: 'rgba(79, 123, 255, 0.15)',
    borderWidth: 2,
    borderColor: 'rgba(79, 123, 255, 0.4)',
  },
  timeText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.accent,
    letterSpacing: 0.3,
  },
  // Timeline
  timelineContainer: {
    paddingLeft: 12,
  },
  timelineItem: {
    marginBottom: 0,
  },
  timelineItemContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  timelineDotContainer: {
    width: 32,
    alignItems: 'center',
    marginRight: 18,
  },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2.5,
    borderColor: '#0D0017',
    zIndex: 10,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  timelineLine: {
    width: 1,
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    marginTop: 5,
    minHeight: 60,
  },
  timelineContent: {
    flex: 1,
    paddingBottom: 24,
  },
  timelineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  timelineTimestamp: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.accent,
    letterSpacing: 0.5,
  },
  timelineBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1.5,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  timelineBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  timelineLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 6,
    letterSpacing: 0.2,
  },
  timelineDetail: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.75)',
    lineHeight: 20,
    letterSpacing: 0.1,
  },
  // Pills
  pillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  premiumPill: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 24,
    borderWidth: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  premiumPillText: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  // Button
  buttonContainer: {
    marginTop: 16,
    marginBottom: 32,
  },
  premiumButton: {
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: '#FF2EF0',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 28,
    elevation: 16,
  },
  premiumButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    paddingHorizontal: 36,
  },
  premiumButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
});
