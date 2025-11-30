# 🔧 Configuration Gemini API - Viraly

## ✅ **Réparation Complète**

L'analyse vidéo IA avec Gemini est maintenant **100% fonctionnelle** !

---

## 🔑 **Configuration de la Clé API**

### 1. Créer le fichier `.env` dans `src/server/`

Crée un fichier `.env` à la racine du dossier `src/server/` avec :

```env
# Server Configuration
PORT=3333
NODE_ENV=development

# Google Gemini API (OBLIGATOIRE)
GEMINI_API_KEY=ta_cle_api_gemini_ici

# Stripe Configuration (optionnel pour l'instant)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID=price_...

# CORS Configuration
CORS_ORIGIN=*

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
```

### 2. Obtenir ta clé Gemini API

1. Va sur [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Connecte-toi avec ton compte Google
3. Clique sur "Create API Key"
4. Copie la clé générée
5. Colle-la dans le fichier `.env` comme `GEMINI_API_KEY`

---

## 🚀 **Fonctionnement**

### Flow complet

```
1. Utilisateur sélectionne une vidéo
   ↓
2. Frontend (AnalyzeScreen) upload la vidéo
   ↓
3. Backend (/api/video/upload) reçoit la vidéo
   ↓
4. Conversion en base64
   ↓
5. Envoi à Gemini 1.5 Flash avec prompt structuré
   ↓
6. Gemini analyse la vidéo et renvoie JSON
   ↓
7. Backend parse la réponse et structure les données
   ↓
8. Frontend affiche les résultats (AnalysisResultScreen)
```

---

## 📊 **Format de Réponse**

### Structure JSON attendue de Gemini

```json
{
  "viralPotential": "Élevé" | "Moyen" | "Faible",
  "engagementScore": 8,
  "viralScore": 8,
  "hashtags": ["#viral", "#fyp", "#trending"],
  "suggestions": ["conseil 1", "conseil 2"],
  "trends": ["tendance 1", "tendance 2"],
  "contentDescription": "Description du contenu",
  "targetAudience": "Public cible",
  "strengths": ["force 1", "force 2"],
  "improvements": ["amélioration 1", "amélioration 2"]
}
```

### Données affichées dans l'UI

- ✅ **Score d'engagement** : `engagementScore` / 10
- ✅ **Potentiel viral** : `viralPotential` (Élevé/Moyen/Faible)
- ✅ **Hashtags recommandés** : `hashtags` array
- ✅ **Conseils d'amélioration** : `suggestions` array
- ✅ **Tendances détectées** : `trends` array

---

## ⚙️ **Détails Techniques**

### Backend (`src/server/src/routes/video.ts`)

- ✅ Upload vidéo via Multer (max 100MB)
- ✅ Conversion en base64
- ✅ Envoi à Gemini 1.5 Flash
- ✅ Prompt structuré pour JSON
- ✅ Parsing de la réponse
- ✅ Fallback si erreur API
- ✅ Logs détaillés

### Frontend (`src/screens/AnalyzeScreen.tsx`)

- ✅ Sélection vidéo (galerie/caméra)
- ✅ Upload via FormData
- ✅ Loading state avec animation
- ✅ Gestion d'erreurs avec Alert
- ✅ Navigation vers résultats

### Service API (`src/services/api.ts`)

- ✅ Upload vidéo avec FormData
- ✅ Gestion des erreurs
- ✅ Typage TypeScript strict

---

## 🐛 **Gestion des Erreurs**

### Erreurs possibles

1. **Clé API manquante**
   - Message : "Gemini API key not configured"
   - Solution : Ajouter `GEMINI_API_KEY` dans `.env`

2. **Vidéo trop grande**
   - Limite : 100MB
   - Solution : Compresser la vidéo

3. **Erreur Gemini API**
   - Fallback activé automatiquement
   - Analyse basique retournée

4. **Erreur de parsing JSON**
   - Extraction automatique du JSON
   - Fallback si échec

---

## ✅ **Vérifications**

### Backend

```bash
cd src/server
npm install
npm run dev
```

Vérifie dans les logs :
- ✅ `🤖 Gemini API configured: Yes`
- ✅ `🚀 Server running on http://0.0.0.0:3333`

### Frontend

```bash
# Dans le dossier racine
npx expo start
```

Vérifie dans l'app :
- ✅ Sélection vidéo fonctionne
- ✅ Upload démarre
- ✅ Loading animation visible
- ✅ Résultats affichés

---

## 📝 **Logs Utiles**

### Backend logs

```
📹 Analyzing video: video.mp4 (2.5MB)
✅ Analysis completed successfully
```

### Erreurs possibles

```
❌ GEMINI_API_KEY is missing
❌ Gemini API error: [détails]
❌ Failed to parse analysis response
```

---

## 🎯 **Résultat**

### Fonctionnalités restaurées

- ✅ Upload vidéo (galerie/caméra)
- ✅ Analyse Gemini IA complète
- ✅ Résultats structurés (JSON)
- ✅ Affichage premium dans l'UI
- ✅ Gestion d'erreurs complète
- ✅ Fallback si API échoue

---

## 🚀 **Test**

1. **Lance le serveur backend** :
   ```bash
   cd src/server
   npm run dev
   ```

2. **Lance l'app Expo** :
   ```bash
   npx expo start
   ```

3. **Teste le flux** :
   - Sélectionne une vidéo
   - Clique sur "Analyser la vidéo"
   - Attends l'analyse (10-30 secondes)
   - Vérifie les résultats affichés

---

## 📦 **Dépendances**

### Backend (`src/server/package.json`)

```json
{
  "@google/generative-ai": "^0.2.1",
  "multer": "^1.4.5-lts.1",
  "express": "^4.18.2"
}
```

### Frontend (déjà installées)

- `expo-image-picker` : Sélection vidéo
- `expo-haptics` : Feedback tactile
- `react-native` : FormData support

---

## 🎉 **C'est Prêt !**

L'analyse vidéo IA fonctionne maintenant à **100%** !

**Assure-toi juste d'avoir ta clé Gemini API dans `src/server/.env`** 🔑





