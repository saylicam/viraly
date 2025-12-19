# 🎨 VIRALY DESIGN SYSTEM — Next-Gen AI Interface

> **Version:** 2.0 Cyberpunk Edition  
> **Date:** Novembre 2024  
> **Lead Designer:** AI Architect

---

## 🌌 1. PHILOSOPHIE VISUELLE

### Concept Central : "Deep Space meets Neon AI"

Viraly incarne l'**intelligence artificielle du futur** à travers une interface :
- **Profonde** : Fonds spatiaux à plusieurs couches
- **Lumineuse** : Néons, glows, halos colorés
- **Flottante** : Glassmorphism omniprésent
- **Organique** : Aucun angle droit, tout est arrondi
- **Immersive** : Animations fluides et micro-interactions

---

## 🎨 2. PALETTE DE COULEURS

### Fondations (Backgrounds)
```
Deep Space Base:
- #0B0B15 (Noir profond teinté)
- #1B1B2F (Violet très sombre)
- #2D1B4E (Violet moyen - accents)
```

### Néons Primaires
```
Violet Électrique: #8B5CF6
Magenta Néon:      #EC4899
Cyan Laser:        #06B6D4
Bleu Roi:          #3B82F6
```

### Néons Sémantiques
```
Succès (Emerald):  #10B981
Danger (Ruby):     #F43F5E
Warning (Amber):   #F59E0B
```

### Textes
```
Blanc Pur:         #FFFFFF
Gris Bleuté:       #94A3B8
Gris Foncé:        #64748B
```

---

## 🔮 3. COMPOSANTS UI

### `<ScreenBackground>`
**Usage:** Fond de tous les écrans  
**Props:**
- `variant`: 'default' | 'dark' | 'vibrant'

**Caractéristiques:**
- Dégradé radial Deep Space
- 3 orbes animés (Violet, Cyan, Magenta)
- Vignette pour profondeur
- Grille subtile (optionnel)

---

### `<GlassCard>`
**Usage:** Conteneur glassmorphique principal  
**Props:**
- `variant`: 'default' | 'highlight' | 'subtle'
- `onPress`: Si cliquable
- `className`: Classes Tailwind custom

**Style:**
```tsx
bg-white/5 backdrop-blur-lg
border border-white/10
rounded-[32px]
shadow-lg shadow-purple-500/20
```

---

### `<NeonButton>`
**Usage:** Boutons d'action principaux  
**Props:**
- `variant`: 'primary' | 'secondary' | 'danger'
- `size`: 'default' | 'large'
- `icon`: LucideIcon
- `fullWidth`: boolean

**Variantes:**
- **Primary:** Dégradé Violet → Magenta
- **Secondary:** Cyan → Bleu
- **Danger:** Rouge → Rose

---

### `<ScoreCircle>`
**Usage:** Affichage du score viral  
**Props:**
- `score`: 0-100
- `size`: 'sm' | 'md' | 'lg' | 'xl'
- `label`: string
- `animated`: boolean

**Couleurs dynamiques:**
- 80-100: Emerald (#10B981)
- 60-79: Violet (#8B5CF6)
- 40-59: Amber (#F59E0B)
- 0-39: Ruby (#F43F5E)

---

### `<Chip>`
**Usage:** Tags, catégories, émotions  
**Props:**
- `label`: string
- `variant`: 'violet' | 'cyan' | 'magenta' | 'emerald' | 'ruby' | 'amber'
- `size`: 'sm' | 'md' | 'lg'
- `icon`: LucideIcon

---

### `<SectionTitle>`
**Usage:** Titres de sections  
**Props:**
- `title`: string
- `subtitle`: string (optionnel)
- `icon`: LucideIcon
- `iconColor`: string
- `animated`: boolean

---

## 📐 4. RÈGLES DE DESIGN

### Espacement
```
Gap entre cartes: 16px (gap-4)
Padding écrans: 24px (px-6)
Marges sections: 32-40px (mb-8 à mb-10)
```

### Arrondi (Border Radius)
```
Cartes: 32px (rounded-[32px])
Boutons: 24px (rounded-[24px])
Chips: 9999px (rounded-full)
Icons containers: 12-16px
```

### Ombres (Shadows)
```tsx
// Cartes
shadow-lg shadow-purple-500/20

// Boutons
shadow-[0_0_25px_rgba(139,92,246,0.35)]

// Score Circle
shadowColor: color
shadowOpacity: 0.6
shadowRadius: 20
```

### Glassmorphism Standard
```tsx
bg-white/5 backdrop-blur-lg
border border-white/10
border-t-white/20  // Highlight supérieur
```

---

## 🎬 5. ANIMATIONS

### Entrées de cartes (Moti)
```tsx
from={{ opacity: 0, scale: 0.95 }}
animate={{ opacity: 1, scale: 1 }}
transition={{ delay: 300, type: 'spring', damping: 15 }}
```

### Slides
```tsx
from={{ opacity: 0, translateY: 20 }}
animate={{ opacity: 1, translateY: 0 }}
```

### Pulse (Glow)
```tsx
from={{ opacity: 0.6, scale: 1 }}
animate={{ opacity: 0, scale: 1.3 }}
transition={{ loop: true, duration: 2000 }}
```

---

## 📱 6. ÉCRANS PRINCIPAUX

### Home Dashboard
- Hero Section: Analyser Vidéo (gradient massif)
- Grille 2x2: Cartes navigation (Tendances, Profil, Analytics, Réglages)
- Info card: IA Gemini

### Analyse Vidéo (Upload)
- Zone d'upload translucide
- Boutons Galerie/Caméra (NeonButton)
- État: Vide vs Prêt

### Résultat d'Analyse
1. **Hero:** Score Circle géant + Verdict + Chip catégorie
2. **Timeline:** Ligne verticale avec points colorés + cartes impact
3. **Forces:** Cartes vertes avec CheckCircle
4. **Faiblesses:** Cartes rouges avec XCircle
5. **Émotions:** Chips magenta
6. **Hashtags:** Chips violet
7. **CTA:** NeonButton "Nouvelle Analyse"

---

## 🛠️ 7. STACK TECHNIQUE

- **Styling:** NativeWind (Tailwind CSS)
- **Animations:** Moti + Reanimated
- **Icons:** Lucide React Native
- **Blur:** Expo BlurView
- **Gradients:** Expo Linear Gradient

---

## ✅ 8. CHECKLIST QUALITÉ

Avant de valider un écran :
- [ ] Aucun angle droit (sauf écran)
- [ ] Fond Deep Space avec orbes
- [ ] Toutes les cartes en glassmorphism
- [ ] Textes en FRANÇAIS
- [ ] Animations d'entrée fluides
- [ ] Glow externe sur éléments importants
- [ ] Hiérarchie visuelle claire (tailles, couleurs, profondeur)
- [ ] Lisibilité parfaite (contraste texte/fond)
- [ ] Cohérence avec le reste de l'app

---

## 🎯 9. EXEMPLES DE CODE

### Créer une nouvelle carte simple
```tsx
<GlassCard className="p-6" variant="highlight">
  <Text className="text-white font-bold text-xl mb-2">
    Titre
  </Text>
  <Text className="text-gray-400 text-sm">
    Description
  </Text>
</GlassCard>
```

### Ajouter une animation d'entrée
```tsx
<MotiView
  from={{ opacity: 0, translateY: 20 }}
  animate={{ opacity: 1, translateY: 0 }}
  transition={{ delay: 300 }}
>
  {/* Votre contenu */}
</MotiView>
```

### Créer un bouton d'action
```tsx
<NeonButton
  title="COMMENCER"
  onPress={handleAction}
  variant="primary"
  size="large"
  icon={Zap}
  fullWidth
/>
```

---

## 📚 10. RESSOURCES

- **Tailwind Docs:** https://tailwindcss.com
- **Moti Docs:** https://moti.fyi
- **Lucide Icons:** https://lucide.dev
- **Inspiration:** Dribbble (recherche "cyberpunk ui", "glassmorphism dashboard")

---

**Maintenu par:** L'équipe Viraly Design  
**Dernière mise à jour:** $(date)















