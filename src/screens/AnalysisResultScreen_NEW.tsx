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
  const analysis = result.premium || result;
  const videoRef = React.useRef<ExpoVideo>(null);
  
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

  // Fonction pour obtenir la couleur du niveau de confiance
  const getConfidenceColor = (niveau: string) => {
    const text = niveau?.toLowerCase() || '';
    if (text.includes('fort')) return '#42FFB0';
    if (text.includes('moyen')) return '#FFB85C';
    return '#FF6B6B';
  };

  // Fonction pour obtenir le verdict depuis le score
  const getVerdict = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Bon';
    if (score >= 40) return 'Moyen';
    return 'Mauvais';
  };

  const getVerdictColor = (score: number) => {
    if (score >= 80) return '#42FFB0';
    if (score >= 60) return '#4F7BFF';
    if (score >= 40) return '#FFB85C';
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

          {/* 2️⃣ Carte compacte Score + Confiance + Synthèse */}
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ delay: 200 }}
          >
            <View style={styles.compactStatsCard}>
              <LinearGradient
                colors={['rgba(144, 19, 254, 0.15)', 'rgba(255, 46, 240, 0.1)']}
                style={styles.compactStatsGradient}
              >
                <View style={styles.compactStatsRow}>
                  <View style={styles.compactStatItem}>
                    <Target size={24} color={getVerdictColor(scoreSur100)} />
                    <Text style={styles.compactStatValue}>{scoreSur100}</Text>
                    <Text style={styles.compactStatLabel}>/100</Text>
                  </View>
                  <View style={styles.compactStatDivider} />
                  <View style={styles.compactStatItem}>
                    <BarChart3 size={24} color={getConfidenceColor(niveauConfiance)} />
                    <Text style={[styles.compactStatValue, { fontSize: 16 }]}>{niveauConfiance}</Text>
                    <Text style={styles.compactStatLabel}>Confiance</Text>
                  </View>
                </View>
                <View style={styles.compactSynth}>
                  <Text style={styles.compactSynthText}>
                    {getVerdict(scoreSur100) === 'Excellent' ? 'Très bon montage, potentiel viral élevé' :
                     getVerdict(scoreSur100) === 'Bon' ? 'Bon montage, potentiel viral moyen' :
                     getVerdict(scoreSur100) === 'Moyen' ? 'Montage correct, potentiel viral modéré' :
                     'Montage à améliorer, potentiel viral faible'}
                  </Text>
                </View>
              </LinearGradient>
            </View>
          </MotiView>

          {/* 3️⃣ Résumé vidéo (3-5 lignes max) */}
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ delay: 300 }}
          >
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionIconContainer}>
                  <FileText size={20} color={theme.colors.primary} />
                </View>
                <Text style={styles.sectionTitle}>Résumé vidéo</Text>
              </View>
              <Text style={styles.resumeText}>{resumeVideo}</Text>
            </View>
          </MotiView>

          {/* 4️⃣ Avis global IA (3-5 lignes max) */}
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ delay: 400 }}
          >
            <View style={styles.avisCard}>
              <LinearGradient
                colors={['rgba(144, 19, 254, 0.15)', 'rgba(255, 46, 240, 0.1)']}
                style={styles.avisGradient}
              >
                <View style={styles.avisHeader}>
                  <View style={styles.avisIconContainer}>
                    <Award size={28} color={getVerdictColor(scoreSur100)} />
                  </View>
                  <View style={styles.avisHeaderText}>
                    <Text style={styles.avisTitle}>Avis global de l'IA</Text>
                    <View style={[styles.verdictBadge, { borderColor: getVerdictColor(scoreSur100) }]}>
                      <Text style={[styles.verdictBadgeText, { color: getVerdictColor(scoreSur100) }]}>
                        {getVerdict(scoreSur100)}
                      </Text>
                    </View>
                  </View>
                </View>
                <Text style={styles.avisText}>{avisGlobal}</Text>
              </LinearGradient>
            </View>
          </MotiView>

          {/* 5️⃣ Pourquoi ça peut percer (3-5 bullets) */}
          {pourquoiCaPerce.length > 0 && (
            <MotiView
              from={{ opacity: 0, translateY: 20 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ delay: 500 }}
            >
              <View style={styles.sectionCard}>
                <View style={styles.sectionHeader}>
                  <View style={[styles.sectionIconContainer, { backgroundColor: 'rgba(66, 255, 176, 0.2)' }]}>
                    <TrendingUp size={20} color="#42FFB0" />
                  </View>
                  <Text style={styles.sectionTitle}>Pourquoi ça peut percer</Text>
                </View>
                <View style={styles.bulletsContainer}>
                  {pourquoiCaPerce.map((item: string, index: number) => (
                    <MotiView
                      key={index}
                      from={{ opacity: 0, translateX: -10 }}
                      animate={{ opacity: 1, translateX: 0 }}
                      transition={{ delay: 550 + index * 50 }}
                    >
                      <View style={styles.bulletItem}>
                        <View style={[styles.bulletDot, { backgroundColor: '#42FFB0' }]} />
                        <Text style={styles.bulletText}>{item}</Text>
                      </View>
                    </MotiView>
                  ))}
                </View>
              </View>
            </MotiView>
          )}

          {/* 6️⃣ Pourquoi ça peut flopper (3-5 bullets) */}
          {pourquoiCaFloppe.length > 0 && (
            <MotiView
              from={{ opacity: 0, translateY: 20 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ delay: 600 }}
            >
              <View style={styles.sectionCard}>
                <View style={styles.sectionHeader}>
                  <View style={[styles.sectionIconContainer, { backgroundColor: 'rgba(255, 107, 107, 0.2)' }]}>
                    <TrendingDown size={20} color="#FF6B6B" />
                  </View>
                  <Text style={styles.sectionTitle}>Pourquoi ça peut flopper</Text>
                </View>
                <View style={styles.bulletsContainer}>
                  {pourquoiCaFloppe.map((item: string, index: number) => (
                    <MotiView
                      key={index}
                      from={{ opacity: 0, translateX: -10 }}
                      animate={{ opacity: 1, translateX: 0 }}
                      transition={{ delay: 650 + index * 50 }}
                    >
                      <View style={styles.bulletItem}>
                        <View style={[styles.bulletDot, { backgroundColor: '#FF6B6B' }]} />
                        <Text style={styles.bulletText}>{item}</Text>
                      </View>
                    </MotiView>
                  ))}
                </View>
              </View>
            </MotiView>
          )}

          {/* 7️⃣ Conseils IA (4-6 bullets) */}
          {conseilsAmelioration.length > 0 && (
            <MotiView
              from={{ opacity: 0, translateY: 20 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ delay: 700 }}
            >
              <View style={styles.sectionCard}>
                <View style={styles.sectionHeader}>
                  <View style={[styles.sectionIconContainer, { backgroundColor: 'rgba(255, 46, 240, 0.2)' }]}>
                    <Lightbulb size={20} color={theme.colors.secondary} />
                  </View>
                  <Text style={styles.sectionTitle}>Conseils d'amélioration</Text>
                </View>
                <View style={styles.bulletsContainer}>
                  {conseilsAmelioration.map((item: string, index: number) => (
                    <MotiView
                      key={index}
                      from={{ opacity: 0, translateX: -10 }}
                      animate={{ opacity: 1, translateX: 0 }}
                      transition={{ delay: 750 + index * 50 }}
                    >
                      <View style={styles.bulletItem}>
                        <View style={[styles.bulletDot, { backgroundColor: theme.colors.secondary }]} />
                        <Text style={styles.bulletText}>{item}</Text>
                      </View>
                    </MotiView>
                  ))}
                </View>
              </View>
            </MotiView>
          )}

          {/* 8️⃣ Caption optimisée */}
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ delay: 800 }}
          >
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionIconContainer}>
                  <FileText size={20} color={theme.colors.primary} />
                </View>
                <Text style={styles.sectionTitle}>Caption optimisée</Text>
              </View>
              <Text style={styles.captionText}>{caption}</Text>
            </View>
          </MotiView>

          {/* 9️⃣ Hashtags */}
          {hashtags.length > 0 && (
            <MotiView
              from={{ opacity: 0, translateY: 20 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ delay: 850 }}
            >
              <View style={styles.sectionCard}>
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionIconContainer}>
                    <Hash size={20} color={theme.colors.secondary} />
                  </View>
                  <Text style={styles.sectionTitle}>Hashtags recommandés</Text>
                </View>
                <View style={styles.hashtagsContainer}>
                  {hashtags.map((tag: string, index: number) => (
                    <MotiView
                      key={index}
                      from={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 900 + index * 30 }}
                    >
                      <View style={styles.hashtagPill}>
                        <Text style={styles.hashtagText}>{tag}</Text>
                      </View>
                    </MotiView>
                  ))}
                </View>
              </View>
            </MotiView>
          )}

          {/* 🔟 Stats prédictives */}
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ delay: 950 }}
          >
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionIconContainer}>
                  <BarChart3 size={20} color={theme.colors.accent} />
                </View>
                <Text style={styles.sectionTitle}>Stats prédictives</Text>
              </View>
              <View style={styles.statsGrid}>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Chance de trend</Text>
                  <Text style={styles.statValue}>{chanceTrend}</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Vues attendues</Text>
                  <Text style={styles.statValue}>{vuesAttendues}</Text>
                </View>
              </View>
            </View>
          </MotiView>

          {/* 1️⃣1️⃣ Meilleurs horaires */}
          {meilleursHoraires.length > 0 && (
            <MotiView
              from={{ opacity: 0, translateY: 20 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ delay: 1000 }}
            >
              <View style={styles.sectionCard}>
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionIconContainer}>
                    <Clock size={20} color={theme.colors.highlight} />
                  </View>
                  <Text style={styles.sectionTitle}>Meilleurs horaires</Text>
                </View>
                <View style={styles.horairesContainer}>
                  {meilleursHoraires.map((horaire: string, index: number) => (
                    <MotiView
                      key={index}
                      from={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 1050 + index * 50 }}
                    >
                      <View style={styles.horairePill}>
                        <Clock size={16} color={theme.colors.highlight} />
                        <Text style={styles.horaireText}>{horaire}</Text>
                      </View>
                    </MotiView>
                  ))}
                </View>
              </View>
            </MotiView>
          )}

          {/* Bouton Nouvelle Analyse */}
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ delay: 1100 }}
            style={styles.buttonContainer}
          >
            <TouchableOpacity
              onPress={() => navigation.navigate('Analyze')}
              style={styles.newAnalysisButton}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={theme.colors.gradient.button}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.newAnalysisGradient}
              >
                <Sparkles size={20} color="#FFFFFF" />
                <Text style={styles.newAnalysisText}>Nouvelle Analyse</Text>
              </LinearGradient>
            </TouchableOpacity>
          </MotiView>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    paddingTop: 50,
    paddingHorizontal: 24,
    paddingBottom: 16,
    zIndex: 10,
  },
  backButton: {
    width: 44,
    height: 44,
  },
  backButtonBlur: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  content: {
    paddingHorizontal: 24,
  },
  // Video Card
  videoCard: {
    borderRadius: 28,
    overflow: 'hidden',
    backgroundColor: 'rgba(144, 19, 254, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(144, 19, 254, 0.3)',
    marginBottom: 20,
    shadowColor: '#9013FE',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  videoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  videoHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  videoIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(144, 19, 254, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  videoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  iaTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(144, 19, 254, 0.3)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  iaTagText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  videoWrapper: {
    width: '100%',
    height: 200,
    position: 'relative',
  },
  videoGradient: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
  video: {
    width: '100%',
    height: '100%',
  },
  // Compact Stats Card
  compactStatsCard: {
    borderRadius: 28,
    overflow: 'hidden',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(144, 19, 254, 0.3)',
    shadowColor: '#9013FE',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  compactStatsGradient: {
    padding: 20,
  },
  compactStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  compactStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  compactStatDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginHorizontal: 20,
  },
  compactStatValue: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FFFFFF',
    marginTop: 8,
  },
  compactStatLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 4,
  },
  compactSynth: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  compactSynthText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 20,
  },
  // Section Card
  sectionCard: {
    borderRadius: 28,
    backgroundColor: 'rgba(144, 19, 254, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(144, 19, 254, 0.3)',
    padding: 20,
    marginBottom: 20,
    shadowColor: '#9013FE',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(144, 19, 254, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  resumeText: {
    fontSize: 15,
    lineHeight: 22,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },
  // Avis Card
  avisCard: {
    borderRadius: 28,
    overflow: 'hidden',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(144, 19, 254, 0.3)',
    shadowColor: '#9013FE',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  avisGradient: {
    padding: 20,
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
  },
  avisHeaderText: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  avisTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  verdictBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1.5,
    backgroundColor: 'rgba(144, 19, 254, 0.1)',
  },
  verdictBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  avisText: {
    fontSize: 15,
    lineHeight: 22,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  // Bullets
  bulletsContainer: {
    gap: 12,
  },
  bulletItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  bulletDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 6,
    marginRight: 12,
  },
  bulletText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  // Caption
  captionText: {
    fontSize: 15,
    lineHeight: 22,
    color: 'rgba(255, 255, 255, 0.9)',
    fontStyle: 'italic',
  },
  // Hashtags
  hashtagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  hashtagPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 46, 240, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 46, 240, 0.4)',
  },
  hashtagText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FF2EF0',
  },
  // Stats
  statsGrid: {
    flexDirection: 'row',
    gap: 16,
  },
  statItem: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(79, 123, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(79, 123, 255, 0.3)',
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#4F7BFF',
  },
  // Horaires
  horairesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  horairePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(66, 255, 176, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(66, 255, 176, 0.3)',
    gap: 8,
  },
  horaireText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#42FFB0',
  },
  // Button
  buttonContainer: {
    marginTop: 20,
    marginBottom: 40,
  },
  newAnalysisButton: {
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: '#FF2EF0',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  newAnalysisGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 32,
    gap: 12,
  },
  newAnalysisText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});




