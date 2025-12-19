import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { ArrowLeft, Zap, Target, Video, TrendingUp, BarChart3, CheckCircle2, AlertTriangle, Clock, Hash, Sparkles, FileText, Award, Lightbulb, Eye, TrendingDown, ChevronDown, ChevronUp, Flame, Music, Heart, Zap as ZapIcon } from 'lucide-react-native';
import { MotiView } from 'moti';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Video as ExpoVideo, ResizeMode } from 'expo-av';
import { theme } from '../theme';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 48; // 24px padding de chaque côté

// Palette de couleurs pour hashtags
const HASHTAG_COLORS = ['#A855F7', '#E879F9', '#D946EF', '#9333EA', '#7C3AED', '#4C1D95'];

export default function AnalysisResultScreen({ navigation, route }: any) {
  const { result, videoUri } = route.params;
  const analysis = result.premium || result;
  const videoRef = React.useRef<ExpoVideo>(null);
  
  // États pour les sections collapsibles
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  
  // Extraction des données depuis la NOUVELLE structure JSON améliorée
  const resumeVideo = analysis?.resume_video || { court: 'Résumé vidéo en cours de génération.', long: '' };
  const avisGlobal = analysis?.avis_global || { court: 'Analyse en cours de traitement.', long: '' };
  const pourquoiCaPerce = analysis?.pourquoi_ca_perce || { preview: [], complet: [] };
  const pourquoiCaFloppe = analysis?.pourquoi_ca_floppe || { preview: [], complet: [] };
  const conseilsRapides = analysis?.conseils_rapides || [];
  const conseilsAmelioration = analysis?.conseils_amelioration || { preview: [], complet: [] };
  const scoreEmotionnel = analysis?.score_emotionnel || { confiance_charisme: 70, intensite: 70, impact_visuel: 70, nostalgie: 60 };
  const microMetrics = analysis?.micro_metrics || { potentiel_viral: 'Moyen', watchtime_estime: '5-8s', audio_tendance: 'Oui' };
  const punchline = analysis?.punchline || 'Ton edit est vraiment puissant : rythme, vibe, synchro…';
  const verdictFinal = analysis?.verdict_final || { emoji: '👍', titre: 'Très bon début !', message: 'Avec quelques ajustements, tu peux viser le FYP facilement.' };
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
    if (score >= 85) return { text: 'Vidéo excellente', color: '#42FFB0', emoji: '🟩' };
    if (score >= 70) return { text: 'Bonne vidéo', color: '#FFB85C', emoji: '🟨' };
    if (score >= 50) return { text: 'Peut mieux faire', color: '#FF9F43', emoji: '🟧' };
    return { text: 'À retravailler', color: '#FF6B6B', emoji: '🟥' };
  };

  const getVerdictColor = (score: number) => {
    if (score >= 80) return '#42FFB0';
    if (score >= 60) return '#4F7BFF';
    if (score >= 40) return '#FFB85C';
    return '#FF6B6B';
  };

  // Fonction pour toggle une section
  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => ({ ...prev, [sectionId]: !prev[sectionId] }));
  };

  // Fonction pour obtenir une couleur aléatoire pour les hashtags
  const getHashtagColor = (index: number) => {
    return HASHTAG_COLORS[index % HASHTAG_COLORS.length];
  };

  const verdict = getVerdict(scoreSur100);

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

          {/* 2️⃣ MAJOR CARD : Score + Confiance + Badge + Micro-metrics */}
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ delay: 200 }}
          >
            <View style={styles.majorCard}>
              <LinearGradient
                colors={['rgba(144, 19, 254, 0.2)', 'rgba(255, 46, 240, 0.15)']}
                style={styles.majorCardGradient}
              >
                {/* Ligne 1: Score + Badge */}
                <View style={styles.majorCardRow1}>
                  <View style={styles.scoreContainer}>
                    <Target size={32} color={getVerdictColor(scoreSur100)} />
                    <Text style={styles.scoreValue}>{scoreSur100}</Text>
                    <Text style={styles.scoreUnit}>/100</Text>
                  </View>
                  <View style={[styles.verdictBadge, { borderColor: verdict.color, backgroundColor: `${verdict.color}20` }]}>
                    <Text style={styles.verdictEmoji}>{verdict.emoji}</Text>
                    <Text style={[styles.verdictText, { color: verdict.color }]}>{verdict.text}</Text>
                  </View>
                </View>

                {/* Ligne 2: Confiance + Synthèse */}
                <View style={styles.majorCardRow2}>
                  <View style={styles.confidenceItem}>
                    <BarChart3 size={20} color={getConfidenceColor(niveauConfiance)} />
                    <Text style={styles.confidenceLabel}>Confiance</Text>
                    <Text style={[styles.confidenceValue, { color: getConfidenceColor(niveauConfiance) }]}>{niveauConfiance}</Text>
                  </View>
                  <View style={styles.synthContainer}>
                    <Text style={styles.synthText}>{punchline}</Text>
                  </View>
                </View>

                {/* Ligne 3: Micro-metrics */}
                <View style={styles.microMetricsContainer}>
                  <View style={styles.microMetricItem}>
                    <Flame size={16} color={microMetrics.potentiel_viral === 'Élevé' ? '#42FFB0' : microMetrics.potentiel_viral === 'Moyen' ? '#FFB85C' : '#FF6B6B'} />
                    <Text style={styles.microMetricLabel}>Potentiel viral</Text>
                    <Text style={[styles.microMetricValue, { 
                      color: microMetrics.potentiel_viral === 'Élevé' ? '#42FFB0' : microMetrics.potentiel_viral === 'Moyen' ? '#FFB85C' : '#FF6B6B' 
                    }]}>{microMetrics.potentiel_viral}</Text>
                  </View>
                  <View style={styles.microMetricItem}>
                    <Eye size={16} color="#4F7BFF" />
                    <Text style={styles.microMetricLabel}>Watchtime</Text>
                    <Text style={[styles.microMetricValue, { color: '#4F7BFF' }]}>{microMetrics.watchtime_estime}</Text>
                  </View>
                  <View style={styles.microMetricItem}>
                    <Music size={16} color={microMetrics.audio_tendance === 'Oui' ? '#42FFB0' : '#FF6B6B'} />
                    <Text style={styles.microMetricLabel}>Audio tendance</Text>
                    <Text style={[styles.microMetricValue, { 
                      color: microMetrics.audio_tendance === 'Oui' ? '#42FFB0' : '#FF6B6B' 
                    }]}>{microMetrics.audio_tendance}</Text>
                  </View>
                </View>
              </LinearGradient>
            </View>
          </MotiView>

          {/* 3️⃣ Résumé vidéo (collapsible) */}
          <CollapsibleSection
            id="resume"
            title="Résumé vidéo"
            icon={FileText}
            iconColor={theme.colors.primary}
            preview={resumeVideo.court}
            fullContent={resumeVideo.long}
            delay={300}
          />

          {/* 4️⃣ Avis global (collapsible) */}
          <CollapsibleSection
            id="avis"
            title="Avis global de l'IA"
            icon={Award}
            iconColor={getVerdictColor(scoreSur100)}
            preview={avisGlobal.court}
            fullContent={avisGlobal.long}
            delay={400}
          />

          {/* 5️⃣ Score émotionnel (barres) */}
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ delay: 500 }}
          >
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <View style={[styles.sectionIconContainer, { backgroundColor: 'rgba(255, 46, 240, 0.2)' }]}>
                  <Heart size={20} color={theme.colors.secondary} />
                </View>
                <Text style={styles.sectionTitle}>Score émotionnel</Text>
              </View>
              <View style={styles.emotionBarsContainer}>
                <EmotionBar label="Confiance / Charisme" value={scoreEmotionnel.confiance_charisme} color="#42FFB0" />
                <EmotionBar label="Intensité" value={scoreEmotionnel.intensite} color="#FF2EF0" />
                <EmotionBar label="Impact visuel" value={scoreEmotionnel.impact_visuel} color="#4F7BFF" />
                <EmotionBar label="Nostalgie" value={scoreEmotionnel.nostalgie} color="#FFB85C" />
              </View>
            </View>
          </MotiView>

          {/* 6️⃣ Pourquoi ça peut percer (collapsible) */}
          <CollapsibleBulletsSection
            id="perce"
            title="Pourquoi ça peut percer"
            icon={TrendingUp}
            iconColor="#42FFB0"
            preview={pourquoiCaPerce.preview || []}
            fullContent={pourquoiCaPerce.complet || []}
            bulletColor="#42FFB0"
            delay={600}
          />

          {/* 7️⃣ Pourquoi ça peut flopper (collapsible) */}
          <CollapsibleBulletsSection
            id="floppe"
            title="Pourquoi ça peut flopper"
            icon={TrendingDown}
            iconColor="#FF6B6B"
            preview={pourquoiCaFloppe.preview || []}
            fullContent={pourquoiCaFloppe.complet || []}
            bulletColor="#FF6B6B"
            delay={700}
          />

          {/* 8️⃣ Conseils rapides (carrousel) */}
          {conseilsRapides.length > 0 && (
            <MotiView
              from={{ opacity: 0, translateY: 20 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ delay: 800 }}
            >
              <View style={styles.sectionCard}>
                <View style={styles.sectionHeader}>
                  <View style={[styles.sectionIconContainer, { backgroundColor: 'rgba(255, 46, 240, 0.2)' }]}>
                    <ZapIcon size={20} color={theme.colors.secondary} />
                  </View>
                  <Text style={styles.sectionTitle}>Conseils rapides</Text>
                </View>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.carouselContainer}
                >
                  {conseilsRapides.map((conseil: any, index: number) => (
                    <MotiView
                      key={index}
                      from={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 850 + index * 50 }}
                    >
                      <View style={styles.carouselCard}>
                        <Text style={styles.carouselIcon}>{conseil.icone || '💡'}</Text>
                        <Text style={styles.carouselTitle}>{conseil.titre}</Text>
                        <Text style={styles.carouselText}>{conseil.texte}</Text>
                      </View>
                    </MotiView>
                  ))}
                </ScrollView>
              </View>
            </MotiView>
          )}

          {/* 9️⃣ Conseils IA détaillés (collapsible) */}
          <CollapsibleBulletsSection
            id="conseils"
            title="Conseils d'amélioration"
            icon={Lightbulb}
            iconColor={theme.colors.secondary}
            preview={conseilsAmelioration.preview || []}
            fullContent={conseilsAmelioration.complet || []}
            bulletColor={theme.colors.secondary}
            delay={900}
          />

          {/* 🔟 Caption optimisée */}
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ delay: 1000 }}
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

          {/* 1️⃣1️⃣ Hashtags multicolores */}
          {hashtags.length > 0 && (
            <MotiView
              from={{ opacity: 0, translateY: 20 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ delay: 1050 }}
            >
              <View style={styles.sectionCard}>
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionIconContainer}>
                    <Hash size={20} color={theme.colors.secondary} />
                  </View>
                  <Text style={styles.sectionTitle}>Hashtags recommandés</Text>
                </View>
                <View style={styles.hashtagsContainer}>
                  {hashtags.map((tag: string, index: number) => {
                    const color = getHashtagColor(index);
                    return (
                      <MotiView
                        key={index}
                        from={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 1100 + index * 30 }}
                      >
                        <View style={[styles.hashtagPill, { 
                          backgroundColor: `${color}20`,
                          borderColor: `${color}60`,
                        }]}>
                          <Text style={[styles.hashtagText, { color }]}>{tag}</Text>
                        </View>
                      </MotiView>
                    );
                  })}
                </View>
              </View>
            </MotiView>
          )}

          {/* 1️⃣2️⃣ Stats prédictives */}
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ delay: 1150 }}
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

          {/* 1️⃣3️⃣ Meilleurs horaires */}
          {meilleursHoraires.length > 0 && (
            <MotiView
              from={{ opacity: 0, translateY: 20 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ delay: 1200 }}
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
                      transition={{ delay: 1250 + index * 50 }}
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

          {/* 1️⃣4️⃣ Verdict final du coach IA */}
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ delay: 1300 }}
          >
            <View style={styles.verdictFinalCard}>
              <LinearGradient
                colors={['rgba(144, 19, 254, 0.2)', 'rgba(255, 46, 240, 0.15)']}
                style={styles.verdictFinalGradient}
              >
                <Text style={styles.verdictFinalEmoji}>{verdictFinal.emoji}</Text>
                <Text style={styles.verdictFinalTitre}>{verdictFinal.titre}</Text>
                <Text style={styles.verdictFinalMessage}>{verdictFinal.message}</Text>
              </LinearGradient>
            </View>
          </MotiView>

          {/* Bouton Nouvelle Analyse */}
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ delay: 1400 }}
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

  // Composant Section Collapsible pour texte
  function CollapsibleSection({ id, title, icon: Icon, iconColor, preview, fullContent, delay }: any) {
    const isExpanded = expandedSections[id] || false;
    const displayContent = isExpanded ? fullContent : preview;
    const hasMore = fullContent && fullContent.trim() !== '' && fullContent !== preview;

    return (
      <MotiView
        from={{ opacity: 0, translateY: 20 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ delay }}
      >
        <View style={styles.sectionCard}>
          <TouchableOpacity
            onPress={() => hasMore && toggleSection(id)}
            activeOpacity={hasMore ? 0.7 : 1}
            style={styles.sectionHeaderTouchable}
          >
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIconContainer, { backgroundColor: `${iconColor}20` }]}>
                <Icon size={20} color={iconColor} />
              </View>
              <Text style={styles.sectionTitle}>{title}</Text>
              {hasMore && (
                <View style={styles.expandIcon}>
                  {isExpanded ? <ChevronUp size={20} color={iconColor} /> : <ChevronDown size={20} color={iconColor} />}
                </View>
              )}
            </View>
          </TouchableOpacity>
          <Text style={styles.resumeText}>{displayContent}</Text>
        </View>
      </MotiView>
    );
  }

  // Composant Section Collapsible pour bullets
  function CollapsibleBulletsSection({ id, title, icon: Icon, iconColor, preview, fullContent, bulletColor, delay }: any) {
    const isExpanded = expandedSections[id] || false;
    const displayContent = isExpanded ? fullContent : preview;
    const hasMore = fullContent && fullContent.length > preview.length;

    return (
      <MotiView
        from={{ opacity: 0, translateY: 20 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ delay }}
      >
        <View style={styles.sectionCard}>
          <TouchableOpacity
            onPress={() => hasMore && toggleSection(id)}
            activeOpacity={hasMore ? 0.7 : 1}
            style={styles.sectionHeaderTouchable}
          >
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIconContainer, { backgroundColor: `${iconColor}20` }]}>
                <Icon size={20} color={iconColor} />
              </View>
              <Text style={styles.sectionTitle}>{title}</Text>
              {hasMore && (
                <View style={styles.expandIcon}>
                  {isExpanded ? <ChevronUp size={20} color={iconColor} /> : <ChevronDown size={20} color={iconColor} />}
                </View>
              )}
            </View>
          </TouchableOpacity>
          <View style={styles.bulletsContainer}>
            {displayContent.map((item: string, index: number) => (
              <MotiView
                key={index}
                from={{ opacity: 0, translateX: -10 }}
                animate={{ opacity: 1, translateX: 0 }}
                transition={{ delay: delay + 50 + index * 30 }}
              >
                <View style={styles.bulletItem}>
                  <View style={[styles.bulletDot, { backgroundColor: bulletColor }]} />
                  <Text style={styles.bulletText}>{item}</Text>
                </View>
              </MotiView>
            ))}
          </View>
        </View>
      </MotiView>
    );
  }

  // Composant Barre émotionnelle
  function EmotionBar({ label, value, color }: any) {
    return (
      <View style={styles.emotionBarContainer}>
        <View style={styles.emotionBarHeader}>
          <Text style={styles.emotionBarLabel}>{label}</Text>
          <Text style={[styles.emotionBarValue, { color }]}>{value}%</Text>
        </View>
        <View style={styles.emotionBarTrack}>
          <MotiView
            from={{ width: 0 }}
            animate={{ width: `${value}%` }}
            transition={{ type: 'spring', delay: 500 }}
            style={[styles.emotionBarFill, { backgroundColor: color }]}
          />
        </View>
      </View>
    );
  }
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
  // Major Card
  majorCard: {
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
  majorCardGradient: {
    padding: 20,
  },
  majorCardRow1: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  scoreValue: {
    fontSize: 36,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  scoreUnit: {
    fontSize: 18,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.7)',
  },
  verdictBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    gap: 6,
  },
  verdictEmoji: {
    fontSize: 18,
  },
  verdictText: {
    fontSize: 13,
    fontWeight: '700',
  },
  majorCardRow2: {
    marginBottom: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  confidenceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  confidenceLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.7)',
  },
  confidenceValue: {
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 'auto',
  },
  synthContainer: {
    marginTop: 8,
  },
  synthText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    lineHeight: 20,
  },
  microMetricsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  microMetricItem: {
    alignItems: 'center',
    gap: 4,
  },
  microMetricLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
  },
  microMetricValue: {
    fontSize: 13,
    fontWeight: '700',
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
  sectionHeaderTouchable: {
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
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
    flex: 1,
  },
  expandIcon: {
    marginLeft: 'auto',
  },
  resumeText: {
    fontSize: 15,
    lineHeight: 22,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
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
  // Emotion Bars
  emotionBarsContainer: {
    gap: 16,
  },
  emotionBarContainer: {
    gap: 8,
  },
  emotionBarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  emotionBarLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
  },
  emotionBarValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  emotionBarTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
  },
  emotionBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  // Carousel
  carouselContainer: {
    paddingRight: 24,
    gap: 12,
  },
  carouselCard: {
    width: CARD_WIDTH * 0.85,
    padding: 16,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 46, 240, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 46, 240, 0.3)',
  },
  carouselIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  carouselTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  carouselText: {
    fontSize: 13,
    lineHeight: 18,
    color: 'rgba(255, 255, 255, 0.85)',
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
    borderWidth: 1,
  },
  hashtagText: {
    fontSize: 13,
    fontWeight: '600',
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
  // Verdict Final
  verdictFinalCard: {
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
  verdictFinalGradient: {
    padding: 24,
    alignItems: 'center',
  },
  verdictFinalEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  verdictFinalTitre: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 12,
    textAlign: 'center',
  },
  verdictFinalMessage: {
    fontSize: 16,
    lineHeight: 24,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
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












