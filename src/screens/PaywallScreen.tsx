import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Linking, ActivityIndicator, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from 'moti';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, Check, ScanSearch, Flame, Wand2, UserRound, Crown } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useRevenueCat, IS_DEV_VARIANT } from '../context/RevenueCatContext';
import { OnboardingBackground, OB } from '../components/onboarding/OnboardingUI';

// Liens légaux affichés sous le bouton d'achat (exigés par Apple pour les abonnements)
const TERMS_URL = 'https://www.apple.com/legal/internet-services/itunes/dev/stdeula/';
const PRIVACY_URL = 'https://viraly-production-b0cd.up.railway.app/confidentialite';

type PlanKey = 'annual' | 'monthly';

interface PaywallScreenProps {
  navigation: any;
  route?: { params?: { source?: 'onboarding' | 'limit' } };
}

const FEATURES = [
  { Icon: ScanSearch, color: OB.pink, title: 'Analyses illimitées, seconde par seconde' },
  { Icon: Flame, color: '#FFB84F', title: 'Toutes les tendances de ta niche' },
  { Icon: Wand2, color: '#B371FF', title: 'Chaque tendance adaptée à ton contenu' },
  { Icon: UserRound, color: '#4FC3FF', title: 'Le bilan complet de ton compte TikTok' },
];

/** Délai avant d'afficher la croix quand l'écran s'ouvre tout seul (après l'inscription, analyse offerte utilisée) */
const CLOSE_DELAY_MS = 3000;

/** « 39,99 » → « 3,33 € » (prix par mois de l'annuel, dans la devise de l'utilisateur). */
const perMonth = (price?: number, currency?: string) => {
  if (!price) return null;
  const value = (price / 12).toFixed(2).replace('.', ',');
  return currency === 'EUR' || !currency ? `${value} €` : `${value} ${currency}`;
};

export default function PaywallScreen({ navigation, route }: PaywallScreenProps) {
  const insets = useSafeAreaInsets();
  const source = route?.params?.source;
  const fromOnboarding = source === 'onboarding';
  const fromLimit = source === 'limit';
  // Ouvert par l'utilisateur : croix tout de suite. Ouvert automatiquement : croix après 3 s.
  const [canClose, setCanClose] = useState(!source);
  useEffect(() => {
    if (canClose) return undefined;
    const t = setTimeout(() => setCanClose(true), CLOSE_DELAY_MS);
    return () => clearTimeout(t);
  }, [canClose]);
  const [isBuying, setIsBuying] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<PlanKey>('annual');
  const {
    monthlyPackage, annualPackage, monthlyPrice, annualPrice,
    purchasePackage, restorePurchases, isPremium, isLoading: rcLoading,
  } = useRevenueCat();

  const selectedPackage = selectedPlan === 'annual' ? annualPackage : monthlyPackage;
  const hasFreeTrial = !!selectedPackage?.product.introPrice && selectedPackage.product.introPrice.price === 0;
  const annualHasTrial = !!annualPackage?.product.introPrice && annualPackage.product.introPrice.price === 0;
  const monthlyHasTrial = !!monthlyPackage?.product.introPrice && monthlyPackage.product.introPrice.price === 0;

  const annualLabel = annualPrice ?? '39,99 €';
  const monthlyLabel = monthlyPrice ?? '7,99 €';
  const annualMonthly = perMonth(annualPackage?.product.price, annualPackage?.product.currencyCode) ?? '3,33 €';
  const savings = useMemo(() => {
    const m = monthlyPackage?.product.price;
    const a = annualPackage?.product.price;
    if (!m || !a) return null;
    const pct = Math.round((1 - a / (m * 12)) * 100);
    return pct > 0 ? pct : null;
  }, [monthlyPackage, annualPackage]);

  const priceSentence = selectedPlan === 'annual' ? `${annualLabel} par an` : `${monthlyLabel} par mois`;

  // Déjà abonné (achat, restauration ou abonnement retrouvé sur le compte) : on ferme
  useEffect(() => {
    if (isPremium) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      navigation.goBack();
    }
  }, [isPremium, navigation]);

  const close = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.goBack();
  };

  const buy = async () => {
    if (!selectedPackage) {
      Alert.alert('Abonnement indisponible', "L'abonnement n'est pas disponible pour le moment. Vérifie ta connexion et réessaie.");
      return;
    }
    if (isBuying || rcLoading) return;
    setIsBuying(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await purchasePackage(selectedPackage);
      // Succès : l'effet sur isPremium ferme l'écran. Annulation : on ne fait rien.
    } catch (error: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("L'achat n'a pas abouti", error?.message || "Une erreur est survenue lors de l'achat. Réessaie.");
    } finally {
      setIsBuying(false);
    }
  };

  const restore = async () => {
    if (isRestoring) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsRestoring(true);
    try {
      const restored = await restorePurchases();
      if (!restored) {
        Alert.alert('Aucun abonnement trouvé', "Aucun abonnement actif n'est lié à ton identifiant Apple.");
      }
    } catch {
      Alert.alert('Oups', 'La restauration a échoué. Vérifie ta connexion et réessaie.');
    } finally {
      setIsRestoring(false);
    }
  };

  const ctaLabel = hasFreeTrial ? 'Essayer 3 jours gratuits' : fromOnboarding ? 'Passer à Premium' : 'Débloquer Premium';
  const busy = isBuying || rcLoading;

  return (
    <View style={styles.root}>
      <OnboardingBackground />

      {/* Petite croix en haut à gauche : apparaît après 3 s si l'écran s'est ouvert tout seul */}
      {canClose ? (
        <MotiView from={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ type: 'timing', duration: 400 }} style={[styles.close, { top: insets.top + 6 }]}>
          <TouchableOpacity onPress={close} hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }} accessibilityLabel="Fermer" style={styles.closeHit}>
            <X size={16} color="rgba(255,255,255,0.55)" strokeWidth={2.4} />
          </TouchableOpacity>
        </MotiView>
      ) : null}

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 30 }]}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* En-tête */}
        <MotiView from={{ opacity: 0, translateY: 10 }} animate={{ opacity: 1, translateY: 0 }} style={styles.hero}>
          <View style={styles.logoGlow}>
            <Image source={require('../../assets/logo-mark.png')} style={styles.logo} />
            <View style={styles.crown}><Crown size={12} color="#1A0B00" strokeWidth={2.6} /></View>
          </View>
          <Text style={styles.kicker}>{fromLimit ? 'TON ANALYSE OFFERTE EST UTILISÉE' : 'VIRALY PREMIUM'}</Text>
          {fromLimit ? (
            <Text style={styles.title}>Continue à faire{'\n'}<Text style={styles.titleAccent}>percer tes vidéos.</Text></Text>
          ) : (
            <Text style={styles.title}>Publie des vidéos{'\n'}qui <Text style={styles.titleAccent}>explosent.</Text></Text>
          )}
        </MotiView>

        {/* Ce qui est débloqué */}
        <View style={styles.features}>
          {FEATURES.map(({ Icon, color, title }, i) => (
            <MotiView
              key={title}
              from={{ opacity: 0, translateX: -10 }}
              animate={{ opacity: 1, translateX: 0 }}
              transition={{ delay: 100 + i * 70 }}
              style={styles.feature}
            >
              <View style={[styles.featureIcon, { backgroundColor: `${color}22` }]}><Icon size={16} color={color} /></View>
              <Text style={styles.featureTitle} numberOfLines={1} adjustsFontSizeToFit>{title}</Text>
            </MotiView>
          ))}
        </View>

        {/* Formules */}
        <MotiView from={{ opacity: 0, translateY: 12 }} animate={{ opacity: 1, translateY: 0 }} transition={{ delay: 350 }} style={styles.plans}>
          <PlanRow
            selected={selectedPlan === 'annual'}
            onPress={() => { Haptics.selectionAsync(); setSelectedPlan('annual'); }}
            title="Annuel"
            badge={savings ? `-${savings} %` : 'Meilleure offre'}
            price={rcLoading ? '…' : annualMonthly}
            period="/ mois"
            sub={`${annualLabel} facturé une fois par an`}
            trial={annualHasTrial}
          />
          <PlanRow
            selected={selectedPlan === 'monthly'}
            onPress={() => { Haptics.selectionAsync(); setSelectedPlan('monthly'); }}
            title="Mensuel"
            price={rcLoading ? '…' : monthlyLabel}
            period="/ mois"
            sub="Sans engagement"
            trial={monthlyHasTrial}
          />
        </MotiView>
      </ScrollView>

      {/* Bas d'écran fixe */}
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 14) + 4 }]}>
        <TouchableOpacity activeOpacity={0.9} onPress={buy} disabled={busy || !selectedPackage} style={[styles.ctaWrap, (busy || !selectedPackage) && { opacity: 0.55 }]}>
          <LinearGradient colors={[OB.pink, OB.violet]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.cta}>
            {busy ? <ActivityIndicator color="#FFF" /> : <Text style={styles.ctaText}>{ctaLabel}</Text>}
          </LinearGradient>
        </TouchableOpacity>
        {IS_DEV_VARIANT && !rcLoading && !monthlyPackage && !annualPackage ? (
          <Text style={styles.devNote}>Viraly Dev : les achats ne marchent pas ici (normal). Teste-les avec TestFlight.</Text>
        ) : null}
        <Text style={styles.reassure}>
          {hasFreeTrial ? `3 jours gratuits, puis ${priceSentence}.` : `${priceSentence}.`} Sans engagement, annule quand tu veux.
        </Text>

        <View style={styles.links}>
          <Text style={styles.link} onPress={restore}>{isRestoring ? 'Restauration…' : 'Restaurer mes achats'}</Text>
          <Text style={styles.dot}>·</Text>
          <Text style={styles.link} onPress={() => Linking.openURL(TERMS_URL)}>Conditions</Text>
          <Text style={styles.dot}>·</Text>
          <Text style={styles.link} onPress={() => Linking.openURL(PRIVACY_URL)}>Confidentialité</Text>
        </View>
        <Text style={styles.legal}>
          Renouvellement automatique. Résiliable à tout moment dans les réglages de ton compte Apple, au moins 24 h avant la fin de la période.
        </Text>
      </View>
    </View>
  );
}

const PlanRow = ({ selected, onPress, title, badge, price, period, sub, trial }: {
  selected: boolean; onPress: () => void; title: string; badge?: string; price: string; period: string; sub: string; trial?: boolean;
}) => (
  <TouchableOpacity activeOpacity={0.85} onPress={onPress} style={[styles.plan, selected && styles.planOn]}>
    {selected ? (
      <LinearGradient colors={['rgba(255,79,249,0.18)', 'rgba(144,19,254,0.14)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
    ) : null}
    <View style={[styles.radio, selected && styles.radioOn]}>
      {selected ? <Check size={13} color="#FFF" strokeWidth={3.4} /> : null}
    </View>
    <View style={{ flex: 1 }}>
      <View style={styles.planTitleRow}>
        <Text style={styles.planTitle}>{title}</Text>
        {badge ? <View style={styles.badge}><Text style={styles.badgeText}>{badge}</Text></View> : null}
      </View>
      <Text style={styles.planSub}>{trial ? `3 jours gratuits · ${sub}` : sub}</Text>
    </View>
    <View style={styles.planPriceBox}>
      <Text style={styles.planPrice} numberOfLines={1} adjustsFontSizeToFit>{price}</Text>
      <Text style={styles.planPeriod}>{period}</Text>
    </View>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: OB.bg },
  close: { position: 'absolute', left: 16, zIndex: 10 },
  closeHit: {
    width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  scroll: { paddingHorizontal: 22, paddingBottom: 8 },

  hero: { alignItems: 'center' },
  logoGlow: { shadowColor: OB.pink, shadowOpacity: 0.65, shadowRadius: 26, shadowOffset: { width: 0, height: 0 }, elevation: 12 },
  logo: { width: 58, height: 58, borderRadius: 17 },
  crown: {
    position: 'absolute', right: -7, top: -7, width: 24, height: 24, borderRadius: 12,
    backgroundColor: '#FFD84F', alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: OB.bg,
  },
  kicker: { color: '#FFD84F', fontSize: 11, fontWeight: '900', letterSpacing: 2, marginTop: 12, textAlign: 'center' },
  title: { color: '#FFF', fontSize: 27, lineHeight: 32, fontWeight: '900', textAlign: 'center', marginTop: 6, letterSpacing: -0.4 },
  titleAccent: { color: OB.pink },

  features: { gap: 10, marginTop: 18 },
  feature: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  featureIcon: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  featureTitle: { color: '#FFF', fontSize: 15, fontWeight: '700', flex: 1 },

  plans: { gap: 9, marginTop: 18 },
  plan: {
    flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 14,
    borderRadius: 18, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.12)', backgroundColor: 'rgba(255,255,255,0.04)', overflow: 'hidden',
  },
  planOn: { borderColor: OB.pink },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)', alignItems: 'center', justifyContent: 'center' },
  radioOn: { borderColor: OB.pink, backgroundColor: OB.pink },
  planTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  planTitle: { color: '#FFF', fontSize: 16, fontWeight: '800' },
  badge: { backgroundColor: '#42FFB0', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 },
  badgeText: { color: '#03251A', fontSize: 11, fontWeight: '900' },
  planSub: { color: OB.faint, fontSize: 12.5, marginTop: 3 },
  planPriceBox: { alignItems: 'flex-end', maxWidth: 110 },
  planPrice: { color: '#FFF', fontSize: 19, fontWeight: '900' },
  planPeriod: { color: OB.faint, fontSize: 12, marginTop: 1 },

  footer: { paddingHorizontal: 22, paddingTop: 8 },
  ctaWrap: {
    borderRadius: 999,
    shadowColor: OB.pink, shadowOpacity: 0.5, shadowRadius: 18, shadowOffset: { width: 0, height: 8 }, elevation: 10,
  },
  cta: { height: 56, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  ctaText: { color: '#FFF', fontSize: 18, fontWeight: '900', letterSpacing: 0.2 },
  devNote: { color: '#FFD84F', fontSize: 12, textAlign: 'center', marginTop: 10 },
  reassure: { color: OB.muted, fontSize: 12.5, textAlign: 'center', marginTop: 8 },
  links: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 8 },
  link: { color: OB.muted, fontSize: 12.5, fontWeight: '600', textDecorationLine: 'underline' },
  dot: { color: OB.faint, marginHorizontal: 8 },
  legal: { color: 'rgba(234, 226, 247, 0.32)', fontSize: 10, lineHeight: 13, textAlign: 'center', marginTop: 6 },
});
