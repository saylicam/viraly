# 🔄 Mise à Jour du Flow de Navigation

## ✅ Flow UX Corrigé

Le flow de navigation a été complètement réorganisé selon les spécifications :

### 📍 Nouveau Flow

1. **Écran d'introduction** (IntroScreen) - splash custom
2. **Questionnaire** (QuestionnaireScreen) - toutes les questions TikTok
3. **Écran de calcul** (CalculatingScreen) - traitement des réponses
4. **Écran résultats du questionnaire** (RecommendationScreen) - plan de publication, recommandations
5. **Écran d'inscription / connexion** (LoginScreen) - Google, Apple, Email/Mdp
6. **Home principale** (MainTabs) - analyse vidéo + calendrier + profil

### 🔑 Changements Importants

#### 1. **L'utilisateur n'est plus forcé à créer un compte avant le questionnaire**
- Le questionnaire est maintenant accessible AVANT l'authentification
- L'authentification sert uniquement à sauvegarder les données du questionnaire dans Firestore

#### 2. **Flow conditionnel**
- **Si utilisateur connecté + profil complet** → Home directement
- **Si utilisateur connecté mais pas de profil** → Questionnaire
- **Si pas d'utilisateur** → Flow complet (Intro → Questionnaire → ...)

## 📁 Fichiers Modifiés

### 1. **`src/hooks/useUserProfile.ts`** ✅ NOUVEAU
- Hook pour vérifier si le profil utilisateur est complet
- Vérifie si `questionnaireAnswers` existe dans Firestore
- Retourne `hasCompleteProfile`, `loading`, `profileData`

### 2. **`src/services/authService.js`** ✅ AMÉLIORÉ
- Nouvelle fonction `saveQuestionnaireAnswers()` pour sauvegarder les réponses
- Sauvegarde les réponses du questionnaire dans Firestore après inscription/connexion

### 3. **`src/screens/QuestionnaireScreen.tsx`** ✅ MODIFIÉ
- Navigue maintenant vers `Calculating` au lieu de `Login`
- Les réponses sont passées à travers le flow

### 4. **`src/screens/RecommendationScreen.tsx`** ✅ MODIFIÉ
- Navigue maintenant vers `Login` avec les réponses en paramètres
- Le bouton dit "Créer mon compte" au lieu de "Accéder à mon dashboard"

### 5. **`src/screens/LoginScreen.tsx`** ✅ MODIFIÉ
- Accepte les réponses du questionnaire via `route.params.answers`
- Sauvegarde automatiquement les réponses après inscription/connexion
- Navigue vers `Main` après sauvegarde

### 6. **`src/components/ProtectedScreen.tsx`** ✅ AMÉLIORÉ
- Vérifie maintenant aussi si le profil est complet
- Redirige vers `Questionnaire` si l'utilisateur n'a pas de profil complet
- Redirige vers `Login` si l'utilisateur n'est pas connecté

### 7. **`src/navigation/index.tsx`** ✅ MODIFIÉ
- `RootNavigator` accepte maintenant `hasCompleteProfile`
- Route initiale déterminée selon :
  - Utilisateur connecté + profil complet → `Main`
  - Utilisateur connecté mais pas de profil → `Questionnaire`
  - Pas d'utilisateur → `Intro`

### 8. **`App.tsx`** ✅ MODIFIÉ
- Utilise maintenant `useUserProfile` en plus de `useAuth`
- Passe `hasCompleteProfile` à `RootNavigator`

## 🔄 Flow Détaillé

### Flow Initial (Nouveau Utilisateur)

```
Intro
  ↓
Questionnaire
  ↓
Calculating (transition animée)
  ↓
Recommendation (résultats du questionnaire)
  ↓
Login (avec answers en paramètres)
  ↓ (après connexion/inscription)
Sauvegarde des réponses dans Firestore
  ↓
Main (Home)
```

### Flow Utilisateur Connecté Sans Profil

```
App démarre
  ↓
useAuth → user trouvé
  ↓
useUserProfile → hasCompleteProfile = false
  ↓
RootNavigator → initialRoute = 'Questionnaire'
  ↓
Questionnaire
  ↓
... (suite du flow normal)
```

### Flow Utilisateur Connecté Avec Profil Complet

```
App démarre
  ↓
useAuth → user trouvé
  ↓
useUserProfile → hasCompleteProfile = true
  ↓
RootNavigator → initialRoute = 'Main'
  ↓
Main (Home) directement
```

## 🔐 Protection des Écrans

### ProtectedScreen
- Protège MainTabs (Timeline, Analyze, Profile, Settings)
- Vérifie :
  1. Si pas d'utilisateur → redirige vers `Login`
  2. Si utilisateur mais pas de profil → redirige vers `Questionnaire`
  3. Sinon → affiche le contenu

### Écrans Non Protégés
- `Intro` - accessible sans authentification
- `Questionnaire` - accessible sans authentification
- `Calculating` - accessible sans authentification
- `Recommendation` - accessible sans authentification
- `Login` - accessible sans authentification

## 💾 Sauvegarde des Réponses

### Structure Firestore

Les réponses sont sauvegardées dans `users/{uid}` :

```javascript
{
  questionnaireAnswers: {
    level: ['beginner'],
    frequency: ['daily'],
    niches: ['comedy', 'music'],
    goal: ['views']
  },
  questionnaireCompletedAt: timestamp,
  // Champs extraits pour faciliter les requêtes
  level: 'beginner',
  niches: ['comedy', 'music'],
  frequency: 'daily',
  goal: 'views'
}
```

### Quand sont-elles sauvegardées ?

1. Après inscription email
2. Après connexion email
3. Après connexion Apple
4. Après connexion Google (si implémentée)

Les réponses sont passées via `route.params.answers` depuis `RecommendationScreen` vers `LoginScreen`.

## ✅ Vérifications

- ✅ Le questionnaire est accessible AVANT l'authentification
- ✅ Les réponses sont sauvegardées après inscription/connexion
- ✅ La navigation est conditionnelle selon l'état du profil
- ✅ ProtectedScreen vérifie le profil complet
- ✅ Le flow complet fonctionne sans bloquer l'utilisateur

---

**✅ Toutes les modifications sont terminées !**

Le flow de navigation suit maintenant exactement les spécifications demandées.











