import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { ArrowLeft, Zap, Target, Video, TrendingUp, BarChart3, CheckCircle2, AlertTriangle, Clock, Hash, Sparkles, FileText, Award, Lightbulb, Eye, TrendingDown, ChevronDown, ChevronUp, Flame, Music, Heart, Zap as ZapIcon, Scissors, TrendingUp as TrendingUpIcon, Brain, Users, MessageSquare, Share2, Bookmark, Shield } from 'lucide-react-native';
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
  const scoreEmotionnel = analysis?.score_emotionnel || { confiance_charisme: 60, intensite: 65, impact_visuel: 60, nostalgie: 50 };
  const microMetrics = analysis?.micro_metrics || { potentiel_viral: 'Moyen', watchtime_estime: '5-8s', audio_tendance: 'Oui', public_cible: '18-25 ans', type_engagement: 'likes / commentaires' };
  const tagsRapides = analysis?.tags_rapides || { potentiel_viral: 'Moyen', watchtime_optimal: '5-8s', audio_tendance: 'Oui', public_cible: '18-25 ans', type_engagement: 'likes / commentaires' };
  const verdictExpress = analysis?.verdict_express || 'Montage correct mais manque d\'impact';
  const indiceRisque = analysis?.indice_risque || 'Faible';
  const indiceRisqueDetail = analysis?.indice_risque_detail || '';
  const scoreTitre = analysis?.score_titre || '';
  const microIndicateurs = analysis?.micro_indicateurs || { audio: 65, montage: 60, trendiness: 70 };
  const inspirationIa = analysis?.inspiration_ia || [];
  const punchline = analysis?.punchline || 'Ton edit est vraiment puissant : rythme, vibe, synchro…';
  const verdictFinal = analysis?.verdict_final || { emoji: '👍', titre: 'Très bon début !', message: 'Avec quelques ajustements, tu peux viser le FYP facilement.' };
  const caption = analysis?.caption || 'Caption optimisée en cours de génération.';
  const hashtags = analysis?.hashtags || [];
  const scoreSur100 = analysis?.score_sur_100 || 55;
  const phraseMotivante = analysis?.phrase_motivante || '';
  const typeVideoDetecte = analysis?.type_video_detecte || '🎥 Autre';
  const potentielPartage = analysis?.potentiel_partage || { potentiel_like: 50, potentiel_commentaire: 40, potentiel_partage: 30 };
  const optimisationExpress = analysis?.optimisation_express || [];
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

  // Fonction pour détecter le type de vidéo et retourner l'emoji approprié
  const getVideoTypeEmoji = (text: string) => {
    const lowerText = text.toLowerCase();
    if (lowerText.includes('film') || lowerText.includes('movie') || lowerText.includes('cinema')) return '🎬';
    if (lowerText.includes('série') || lowerText.includes('serie') || lowerText.includes('tv show')) return '📺';
    if (lowerText.includes('anime') || lowerText.includes('manga')) return '🎭';
    if (lowerText.includes('edit') || lowerText.includes('montage')) return '🎞';
    if (lowerText.includes('pov') || lowerText.includes('facecam')) return '📱';
    return '🎥'; // Par défaut
  };

  // Fonction pour obtenir l'icône selon le type de bullet
  const getBulletIcon = (text: string, isPositive: boolean) => {
    const lowerText = text.toLowerCase();
    if (lowerText.includes('hook') || lowerText.includes('accroche')) return '🔥';
    if (lowerText.includes('audio') || lowerText.includes('musique') || lowerText.includes('son')) return '🎵';
    if (lowerText.includes('montage') || lowerText.includes('edit') || lowerText.includes('transition')) return '🎥';
    if (lowerText.includes('risque') || lowerText.includes('danger') || lowerText.includes('problème')) return '⚠️';
    if (lowerText.includes('watermark') || lowerText.includes('copyright')) return '❌';
    return isPositive ? '✅' : '⚠️';
  };

  // Composant Section Collapsible pour texte
  const CollapsibleSection = ({ id, title, icon: Icon, iconColor, preview, fullContent, delay, showEmoji = false }: any) => {
    const isExpanded = expandedSections[id] || false;
    const displayContent = isExpanded ? fullContent : preview;
    const hasMore = fullContent && fullContent.trim() !== '' && fullContent !== preview;
    const emoji = showEmoji && id === 'resume' ? getVideoTypeEmoji(preview || '') : null;

    return (
      <MotiView
        from={{ opacity: 0, translateY: 20, scale: 0.98 }}
        animate={{ opacity: 1, translateY: 0, scale: 1 }}
        transition={{ delay, type: 'timing', duration: 200 }}
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
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                {emoji && <Text style={{ fontSize: 18 }}>{emoji}</Text>}
                <Text style={styles.sectionTitle}>{title}</Text>
              </View>
              {hasMore && (
                <View style={styles.expandIcon}>
                  {isExpanded ? <ChevronUp size={20} color={iconColor} /> : <ChevronDown size={20} color={iconColor} />}
                </View>
              )}
            </View>
          </TouchableOpacity>
          <Text style={[styles.resumeText, { lineHeight: 20 }]}>{displayContent}</Text>
        </View>
      </MotiView>
    );
  };

  // Composant Section Collapsible pour bullets
  const CollapsibleBulletsSection = ({ id, title, icon: Icon, iconColor, preview, fullContent, bulletColor, delay }: any) => {
    const isExpanded = expandedSections[id] || false;
    const displayContent = isExpanded ? fullContent : preview;
    const hasMore = fullContent && fullContent.length > preview.length;
    const isPositive = id === 'perce';

    return (
      <MotiView
        from={{ opacity: 0, translateY: 20, scale: 0.98 }}
        animate={{ opacity: 1, translateY: 0, scale: 1 }}
        transition={{ delay, type: 'timing', duration: 200 }}
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
            {displayContent.map((item: string, index: number) => {
              const bulletIcon = getBulletIcon(item, isPositive);
              return (
                <MotiView
                  key={index}
                  from={{ opacity: 0, translateX: -10 }}
                  animate={{ opacity: 1, translateX: 0 }}
                  transition={{ delay: delay + 50 + index * 30, type: 'timing', duration: 150 }}
                >
                  <View style={styles.bulletItem}>
                    <Text style={{ fontSize: 16, marginRight: 8 }}>{bulletIcon}</Text>
                    <View style={[styles.bulletDot, { backgroundColor: bulletColor }]} />
                    <Text style={styles.bulletText}>{item}</Text>
                  </View>
                </MotiView>
              );
            })}
          </View>
        </View>
      </MotiView>
    );
  };

  // Composant Barre émotionnelle
  const EmotionBar = ({ label, value, color, emoji }: any) => {
    const [trackWidth, setTrackWidth] = React.useState(0);
    const fillWidth = (value / 100) * trackWidth; // Calculer la largeur en pixels selon le pourcentage réel
    
    return (
      <View style={styles.emotionBarContainer}>
        <View style={styles.emotionBarHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            {emoji && <Text style={{ fontSize: 16 }}>{emoji}</Text>}
            <Text style={styles.emotionBarLabel}>{label}</Text>
          </View>
          <Text style={[styles.emotionBarValue, { color }]}>{value}%</Text>
        </View>
        <View 
          style={styles.emotionBarTrack}
          onLayout={(event) => {
            const { width } = event.nativeEvent.layout;
            setTrackWidth(width);
          }}
        >
          <MotiView
            from={{ width: 0 }}
            animate={{ width: fillWidth }}
            transition={{ type: 'spring', delay: 500 }}
            style={[styles.emotionBarFill, { backgroundColor: color }]}
          >
            <LinearGradient
              colors={[color, color + '80']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFillObject}
            />
          </MotiView>
        </View>
      </View>
    );
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

          {/* 2️⃣ MAJOR CARD : Score + Confiance + Badge + Verdict Express + Tags Rapides + Micro-indicateurs */}
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

                {/* Mini titre sous le score */}
                {scoreTitre && scoreTitre.trim() !== '' && (
                  <View style={styles.scoreTitreContainer}>
                    <Text style={styles.scoreTitreText}>{scoreTitre}</Text>
                  </View>
                )}

                {/* Phrase motivante */}
                {phraseMotivante && phraseMotivante.trim() !== '' && (
                  <View style={styles.phraseMotivanteContainer}>
                    <Text style={styles.phraseMotivanteText}>{phraseMotivante}</Text>
                  </View>
                )}

                {/* Verdict Express */}
                <View style={styles.verdictExpressContainer}>
                  <Text style={styles.verdictExpressText}>{verdictExpress}</Text>
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

                {/* Ligne 3: Tags Rapides (horizontal) */}
                <View style={styles.tagsRapidesContainer}>
                  <View style={styles.tagRapideItem}>
                    <Flame size={14} color={tagsRapides.potentiel_viral === 'Élevé' ? '#42FFB0' : tagsRapides.potentiel_viral === 'Moyen' ? '#FFB85C' : '#FF6B6B'} />
                    <Text style={styles.tagRapideLabel}>Potentiel viral</Text>
                    <Text style={[styles.tagRapideValue, { 
                      color: tagsRapides.potentiel_viral === 'Élevé' ? '#42FFB0' : tagsRapides.potentiel_viral === 'Moyen' ? '#FFB85C' : '#FF6B6B' 
                    }]}>{tagsRapides.potentiel_viral}</Text>
                  </View>
                  <View style={styles.tagRapideItem}>
                    <Eye size={14} color="#4F7BFF" />
                    <Text style={styles.tagRapideLabel}>Watchtime</Text>
                    <Text style={[styles.tagRapideValue, { color: '#4F7BFF' }]}>{tagsRapides.watchtime_optimal}</Text>
                  </View>
                  <View style={styles.tagRapideItem}>
                    <Music size={14} color={tagsRapides.audio_tendance === 'Oui' ? '#42FFB0' : '#FF6B6B'} />
                    <Text style={styles.tagRapideLabel}>Audio</Text>
                    <Text style={[styles.tagRapideValue, { 
                      color: tagsRapides.audio_tendance === 'Oui' ? '#42FFB0' : '#FF6B6B' 
                    }]}>{tagsRapides.audio_tendance}</Text>
                  </View>
                  <View style={styles.tagRapideItem}>
                    <Users size={14} color="#E879F9" />
                    <Text style={styles.tagRapideLabel}>Public</Text>
                    <Text style={[styles.tagRapideValue, { color: '#E879F9' }]}>{tagsRapides.public_cible}</Text>
                  </View>
                  <View style={styles.tagRapideItem}>
                    <MessageSquare size={14} color="#42FFB0" />
                    <Text style={styles.tagRapideLabel}>Engagement</Text>
                    <Text style={[styles.tagRapideValue, { color: '#42FFB0' }]}>{tagsRapides.type_engagement}</Text>
                  </View>
                </View>

                {/* Ligne 4: Micro-indicateurs (icônes) */}
                <View style={styles.microIndicateursContainer}>
                  <View style={styles.microIndicateurItem}>
                    <Music size={18} color={microIndicateurs.audio >= 70 ? '#42FFB0' : microIndicateurs.audio >= 50 ? '#FFB85C' : '#FF6B6B'} />
                    <Text style={styles.microIndicateurLabel}>Audio</Text>
                    <Text style={[styles.microIndicateurValue, { 
                      color: microIndicateurs.audio >= 70 ? '#42FFB0' : microIndicateurs.audio >= 50 ? '#FFB85C' : '#FF6B6B' 
                    }]}>{microIndicateurs.audio}</Text>
                  </View>
                  <View style={styles.microIndicateurItem}>
                    <Scissors size={18} color={microIndicateurs.montage >= 70 ? '#42FFB0' : microIndicateurs.montage >= 50 ? '#FFB85C' : '#FF6B6B'} />
                    <Text style={styles.microIndicateurLabel}>Montage</Text>
                    <Text style={[styles.microIndicateurValue, { 
                      color: microIndicateurs.montage >= 70 ? '#42FFB0' : microIndicateurs.montage >= 50 ? '#FFB85C' : '#FF6B6B' 
                    }]}>{microIndicateurs.montage}</Text>
                  </View>
                  <View style={styles.microIndicateurItem}>
                    <TrendingUpIcon size={18} color={microIndicateurs.trendiness >= 70 ? '#42FFB0' : microIndicateurs.trendiness >= 50 ? '#FFB85C' : '#FF6B6B'} />
                    <Text style={styles.microIndicateurLabel}>Trendiness</Text>
                    <Text style={[styles.microIndicateurValue, { 
                      color: microIndicateurs.trendiness >= 70 ? '#42FFB0' : microIndicateurs.trendiness >= 50 ? '#FFB85C' : '#FF6B6B' 
                    }]}>{microIndicateurs.trendiness}</Text>
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
            showEmoji={true}
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

          {/* 5️⃣ Indice de risque */}
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ delay: 450 }}
          >
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <View style={[styles.sectionIconContainer, { backgroundColor: indiceRisque === 'Élevé' ? 'rgba(255, 107, 107, 0.2)' : indiceRisque === 'Moyen' ? 'rgba(255, 184, 92, 0.2)' : 'rgba(66, 255, 176, 0.2)' }]}>
                  <Shield size={20} color={indiceRisque === 'Élevé' ? '#FF6B6B' : indiceRisque === 'Moyen' ? '#FFB85C' : '#42FFB0'} />
                </View>
                <Text style={styles.sectionTitle}>Indice de risque</Text>
                <View style={[styles.risqueBadge, { 
                  borderColor: indiceRisque === 'Élevé' ? '#FF6B6B' : indiceRisque === 'Moyen' ? '#FFB85C' : '#42FFB0',
                  backgroundColor: indiceRisque === 'Élevé' ? 'rgba(255, 107, 107, 0.15)' : indiceRisque === 'Moyen' ? 'rgba(255, 184, 92, 0.15)' : 'rgba(66, 255, 176, 0.15)',
                }]}>
                  <Text style={[styles.risqueBadgeText, { 
                    color: indiceRisque === 'Élevé' ? '#FF6B6B' : indiceRisque === 'Moyen' ? '#FFB85C' : '#42FFB0' 
                  }]}>{indiceRisque}</Text>
                </View>
              </View>
              <Text style={styles.risqueDescription}>
                {indiceRisqueDetail && indiceRisqueDetail.trim() !== ''
                  ? indiceRisqueDetail
                  : indiceRisque === 'Élevé' 
                  ? 'Contenu sensible détecté (politique, nudité, violence, copyright). Risque de modération élevé.'
                  : indiceRisque === 'Moyen'
                  ? 'Quelques éléments peuvent nécessiter une attention particulière.'
                  : 'Contenu conforme aux standards de la plateforme.'}
              </Text>
            </View>
          </MotiView>

          {/* 6️⃣ Score émotionnel (barres full width) */}
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
                <EmotionBar label="Confiance / Charisme" value={scoreEmotionnel.confiance_charisme} color="#42FFB0" emoji="🎭" />
                <EmotionBar label="Intensité" value={scoreEmotionnel.intensite} color="#FF2EF0" emoji="🔥" />
                <EmotionBar label="Impact visuel" value={scoreEmotionnel.impact_visuel} color="#4F7BFF" emoji="👁️" />
                <EmotionBar label="Nostalgie" value={scoreEmotionnel.nostalgie} color="#FFB85C" emoji="🌅" />
              </View>
            </View>
          </MotiView>

          {/* Type de vidéo détecté */}
          <MotiView
            from={{ opacity: 0, translateY: 20, scale: 0.98 }}
            animate={{ opacity: 1, translateY: 0, scale: 1 }}
            transition={{ delay: 550, type: 'timing', duration: 200 }}
          >
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <View style={[styles.sectionIconContainer, { backgroundColor: 'rgba(79, 123, 255, 0.2)' }]}>
                  <Video size={20} color="#4F7BFF" />
                </View>
                <Text style={styles.sectionTitle}>Type de vidéo détecté</Text>
              </View>
              <Text style={styles.typeVideoText}>{typeVideoDetecte}</Text>
            </View>
          </MotiView>

          {/* Potentiel de partage */}
          <MotiView
            from={{ opacity: 0, translateY: 20, scale: 0.98 }}
            animate={{ opacity: 1, translateY: 0, scale: 1 }}
            transition={{ delay: 575, type: 'timing', duration: 200 }}
          >
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <View style={[styles.sectionIconContainer, { backgroundColor: 'rgba(255, 46, 240, 0.2)' }]}>
                  <Share2 size={20} color={theme.colors.secondary} />
                </View>
                <Text style={styles.sectionTitle}>Potentiel de partage</Text>
              </View>
              <View style={styles.potentielPartageContainer}>
                <View style={styles.potentielItem}>
                  <Text style={styles.potentielLabel}>Potentiel de like</Text>
                  <Text style={[styles.potentielValue, { color: '#42FFB0' }]}>{potentielPartage.potentiel_like}%</Text>
                </View>
                <View style={styles.potentielItem}>
                  <Text style={styles.potentielLabel}>Potentiel de commentaire</Text>
                  <Text style={[styles.potentielValue, { color: '#4F7BFF' }]}>{potentielPartage.potentiel_commentaire}%</Text>
                </View>
                <View style={styles.potentielItem}>
                  <Text style={styles.potentielLabel}>Potentiel de partage</Text>
                  <Text style={[styles.potentielValue, { color: '#FF2EF0' }]}>{potentielPartage.potentiel_partage}%</Text>
                </View>
              </View>
            </View>
          </MotiView>

          {/* 7️⃣ Pourquoi ça peut percer (collapsible) */}
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

          {/* 8️⃣ Pourquoi ça peut flopper (collapsible) */}
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

          {/* 9️⃣ Conseils rapides (carrousel) */}
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

          {/* Optimisation express (10 secondes) */}
          {optimisationExpress.length > 0 && (
            <MotiView
              from={{ opacity: 0, translateY: 20, scale: 0.98 }}
              animate={{ opacity: 1, translateY: 0, scale: 1 }}
              transition={{ delay: 850, type: 'timing', duration: 200 }}
            >
              <View style={styles.sectionCard}>
                <View style={styles.sectionHeader}>
                  <View style={[styles.sectionIconContainer, { backgroundColor: 'rgba(66, 255, 176, 0.2)' }]}>
                    <Zap size={20} color="#42FFB0" />
                  </View>
                  <Text style={styles.sectionTitle}>Optimisation express (10 secondes)</Text>
                </View>
                <View style={styles.optimisationExpressContainer}>
                  {optimisationExpress.map((item: string, index: number) => (
                    <MotiView
                      key={index}
                      from={{ opacity: 0, translateX: -10 }}
                      animate={{ opacity: 1, translateX: 0 }}
                      transition={{ delay: 875 + index * 50, type: 'timing', duration: 150 }}
                    >
                      <View style={styles.optimisationExpressItem}>
                        <Text style={styles.optimisationExpressBullet}>⚡</Text>
                        <Text style={styles.optimisationExpressText}>{item}</Text>
                      </View>
                    </MotiView>
                  ))}
                </View>
              </View>
            </MotiView>
          )}

          {/* 🔟 Conseils IA détaillés (collapsible) */}
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

          {/* 1️⃣1️⃣ Inspiration IA / Idées Alternatives */}
          {inspirationIa.length > 0 && (
            <MotiView
              from={{ opacity: 0, translateY: 20 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ delay: 950 }}
            >
              <View style={styles.sectionCard}>
                <View style={styles.sectionHeader}>
                  <View style={[styles.sectionIconContainer, { backgroundColor: 'rgba(79, 123, 255, 0.2)' }]}>
                    <Brain size={20} color={theme.colors.accent} />
                  </View>
                  <Text style={styles.sectionTitle}>Inspiration IA / Idées Alternatives</Text>
                </View>
                <View style={styles.inspirationContainer}>
                  {inspirationIa.map((idee: string, index: number) => (
                    <MotiView
                      key={index}
                      from={{ opacity: 0, translateX: -10 }}
                      animate={{ opacity: 1, translateX: 0 }}
                      transition={{ delay: 1000 + index * 50 }}
                    >
                      <View style={styles.inspirationItem}>
                        <View style={styles.inspirationBullet}>
                          <Sparkles size={14} color={theme.colors.accent} />
                        </View>
                        <Text style={styles.inspirationText}>{idee}</Text>
                      </View>
                    </MotiView>
                  ))}
                </View>
              </View>
            </MotiView>
          )}

          {/* 1️⃣2️⃣ Caption optimisée */}
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ delay: 1050 }}
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

          {/* 1️⃣3️⃣ Hashtags multicolores */}
          {hashtags.length > 0 && (
            <MotiView
              from={{ opacity: 0, translateY: 20 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ delay: 1100 }}
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
                    // Dégradés néon : violet → bleu → rose
                    const neonColors = [
                      ['#A855F7', '#8B5CF6', '#7C3AED'], // Violet
                      ['#6366F1', '#4F46E5', '#4338CA'], // Bleu
                      ['#EC4899', '#DB2777', '#BE185D'], // Rose
                      ['#F59E0B', '#D97706', '#B45309'], // Orange
                      ['#10B981', '#059669', '#047857'], // Vert
                    ];
                    const gradientIndex = index % neonColors.length;
                    const gradientColors = neonColors[gradientIndex];
                    
                    return (
                      <MotiView
                        key={index}
                        from={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 1150 + index * 30, type: 'timing', duration: 200 }}
                      >
                        <View style={styles.hashtagPillNeon}>
                          <LinearGradient
                            colors={gradientColors}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.hashtagPillGradient}
                          >
                            <Text style={styles.hashtagTextNeon}>{tag}</Text>
                          </LinearGradient>
                        </View>
                      </MotiView>
                    );
                  })}
                </View>
              </View>
            </MotiView>
          )}

          {/* 1️⃣4️⃣ Stats prédictives */}
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ delay: 1200 }}
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

          {/* 1️⃣5️⃣ Meilleurs horaires de publication */}
          {meilleursHoraires.length > 0 && (
            <MotiView
              from={{ opacity: 0, translateY: 20 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ delay: 1250 }}
            >
              <View style={styles.sectionCard}>
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionIconContainer}>
                    <Clock size={20} color={theme.colors.highlight} />
                  </View>
                  <Text style={styles.sectionTitle}>Meilleurs horaires de publication</Text>
                </View>
                <View style={styles.horairesContainer}>
                  {meilleursHoraires.map((horaire: string, index: number) => (
                    <MotiView
                      key={index}
                      from={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 1300 + index * 50 }}
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

          {/* 1️⃣6️⃣ Message final motivant */}
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ delay: 1350 }}
          >
            <View style={styles.verdictFinalCard}>
              <LinearGradient
                colors={['rgba(144, 19, 254, 0.2)', 'rgba(255, 46, 240, 0.15)']}
                style={styles.verdictFinalGradient}
              >
                <Text style={styles.verdictFinalEmoji}>{verdictFinal.emoji}</Text>
                <Text style={styles.verdictFinalTitre}>{verdictFinal.titre}</Text>
                <Text style={styles.verdictFinalMessage}>{verdictFinal.message}</Text>
                {phraseMotivante && phraseMotivante.trim() !== '' && (
                  <Text style={styles.verdictFinalPhrase}>{phraseMotivante}</Text>
                )}
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
  verdictExpressContainer: {
    marginTop: 12,
    marginBottom: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  verdictExpressText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  scoreTitreContainer: {
    marginTop: 8,
    marginBottom: 8,
    paddingHorizontal: 14,
  },
  scoreTitreText: {
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.75)',
    textAlign: 'center',
  },
  phraseMotivanteContainer: {
    marginTop: 6,
    marginBottom: 8,
    paddingHorizontal: 14,
  },
  phraseMotivanteText: {
    fontSize: 12,
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.65)',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  tagsRapidesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  tagRapideItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    flex: 1,
    minWidth: '45%',
  },
  tagRapideLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.6)',
  },
  tagRapideValue: {
    fontSize: 11,
    fontWeight: '700',
    marginLeft: 'auto',
  },
  microIndicateursContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  microIndicateurItem: {
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  microIndicateurLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
  },
  microIndicateurValue: {
    fontSize: 14,
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
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
    width: '100%',
  },
  emotionBarFill: {
    height: '100%',
    borderRadius: 5,
    shadowColor: '#A855F7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  typeVideoText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 8,
  },
  potentielPartageContainer: {
    marginTop: 12,
    gap: 12,
  },
  potentielItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  potentielLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  potentielValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  optimisationExpressContainer: {
    marginTop: 12,
    gap: 10,
  },
  optimisationExpressItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(66, 255, 176, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(66, 255, 176, 0.2)',
  },
  optimisationExpressBullet: {
    fontSize: 16,
    marginRight: 10,
  },
  optimisationExpressText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
  },
  risqueBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1.5,
    marginLeft: 'auto',
  },
  risqueBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  risqueDescription: {
    fontSize: 13,
    lineHeight: 18,
    color: 'rgba(255, 255, 255, 0.85)',
    marginTop: 8,
  },
  inspirationContainer: {
    gap: 12,
  },
  inspirationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  inspirationBullet: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(79, 123, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  inspirationText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: 'rgba(255, 255, 255, 0.9)',
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
    gap: 12,
  },
  hashtagPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    overflow: 'hidden',
  },
  hashtagText: {
    fontSize: 13,
    fontWeight: '600',
  },
  hashtagPillNeon: {
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#A855F7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  hashtagPillGradient: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 24,
  },
  hashtagTextNeon: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
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
    marginBottom: 8,
  },
  verdictFinalPhrase: {
    fontSize: 14,
    lineHeight: 20,
    color: 'rgba(255, 255, 255, 0.75)',
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: 4,
  },
  verdictFinalPhrase: {
    fontSize: 14,
    lineHeight: 20,
    color: 'rgba(255, 255, 255, 0.75)',
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: 4,
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

