# Viraly - Application d'Analyse Vidéo IA

## 🚀 Description

Viraly est une application mobile React Native (Expo) qui utilise l'IA pour analyser les vidéos TikTok et Instagram, fournir des conseils d'optimisation et maximiser le potentiel viral du contenu.

## 📱 Fonctionnalités

- **Analyse IA** : Utilise Google Gemini pour analyser le contenu vidéo
- **Tendances** : Accès aux hashtags et sons les plus viraux
- **Conseils personnalisés** : Recommandations adaptées au style de contenu
- **Abonnement Stripe** : Système de paywall avec Stripe PaymentSheet
- **Interface moderne** : Design futuriste avec dégradés et animations

## 🛠️ Technologies

### Frontend (React Native/Expo)
- React Native 0.81.5
- Expo SDK 54
- TypeScript
- React Navigation 6
- Zustand (state management)
- Expo Linear Gradient
- Expo Blur
- Expo Haptics
- Expo Image Picker
- Expo Camera
- React Native Reanimated 4.1

### Backend (Node.js/Express)
- Node.js
- Express.js
- TypeScript
- Stripe API
- Google Gemini AI
- CORS
- Helmet (security)
- Express Rate Limit

## 📦 Installation

### Prérequis
- Node.js (version 18 ou supérieure)
- npm ou yarn
- Expo CLI
- Compte Stripe (pour les paiements)
- Clé API Google Gemini

### 1. Installation des dépendances

#### Frontend
```bash
npm install
```

#### Backend
```bash
cd src/server
npm install
```

### 2. Configuration des variables d'environnement

#### Backend (.env dans src/server/)
```env
# Server Configuration
PORT=3333
NODE_ENV=development

# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
STRIPE_PRICE_ID=price_your_price_id_here

# Google Gemini API
GEMINI_API_KEY=your_gemini_api_key_here

# CORS
CORS_ORIGIN=*

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
```

#### Frontend (.env dans la racine)
```env
EXPO_PUBLIC_API_URL=http://192.168.0.12:3333
```

### 3. Lancement de l'application

#### Backend
```bash
cd src/server
npm run dev
```

#### Frontend
```bash
npx expo start
```

## 🏗️ Structure du projet

```
viraly/
├── src/
│   ├── components/          # Composants réutilisables
│   ├── screens/            # Écrans de l'application
│   │   ├── IntroScreen.tsx
│   │   ├── WelcomeScreen.tsx
│   │   ├── QuestionnaireScreen.tsx
│   │   ├── CalculatingScreen.tsx
│   │   ├── TimelineScreen.tsx
│   │   ├── AnalyzeScreen.tsx
│   │   ├── AnalysisResultScreen.tsx
│   │   ├── ProfileScreen.tsx
│   │   ├── SettingsScreen.tsx
│   │   └── PaywallScreen.tsx
│   ├── navigation/         # Configuration de navigation
│   ├── theme/             # Thème et couleurs
│   ├── store/             # État global (Zustand)
│   ├── services/          # Services API
│   ├── types/             # Types TypeScript
│   └── server/            # Backend Express
│       ├── src/
│       │   ├── routes/    # Routes API
│       │   │   ├── analyze.ts
│       │   │   ├── video.ts
│       │   │   ├── payments.ts
│       │   │   └── webhook.ts
│       │   ├── index.ts   # Point d'entrée
│       │   ├── env.ts     # Configuration env
│       │   └── stripe.ts  # Configuration Stripe
│       └── package.json
├── assets/                # Images et icônes
├── App.tsx               # Point d'entrée React Native
├── package.json          # Dépendances frontend
└── README.md
```

## 🔧 Configuration Stripe

1. Créez un compte Stripe
2. Récupérez vos clés API dans le dashboard Stripe
3. Créez un produit avec un prix (9.99€/mois)
4. Configurez les webhooks pour les événements de paiement
5. Mettez à jour les variables d'environnement

## 🤖 Configuration Google Gemini

1. Allez sur [Google AI Studio](https://makersuite.google.com/)
2. Créez un projet et activez l'API Gemini
3. Générez une clé API
4. Mettez à jour la variable `GEMINI_API_KEY`

## 📱 Fonctionnalités de l'application

### Parcours utilisateur
1. **Écran d'intro** : Présentation de l'application
2. **Bienvenue** : Description des fonctionnalités
3. **Questionnaire** : Profil personnalisé (niveau, fréquence, niches, objectifs)
4. **Calcul** : Création du profil avec l'IA
5. **Accueil** : Dashboard principal avec actions rapides
6. **Analyse** : Upload et analyse de vidéos
7. **Résultats** : Affichage des recommandations
8. **Profil** : Gestion du compte et abonnement
9. **Paramètres** : Configuration de l'application

### Fonctionnalités Pro
- Analyses illimitées
- Tendances en temps réel
- Conseils personnalisés
- Analytics avancés
- Support prioritaire
- Contenu exclusif

## 🚀 Déploiement

### Frontend (Expo)
```bash
npx expo build:android
npx expo build:ios
```

### Backend
```bash
cd src/server
npm run build
npm start
```

## 📄 Licence

Ce projet est sous licence MIT.

## 🤝 Contribution

Les contributions sont les bienvenues ! N'hésitez pas à ouvrir une issue ou une pull request.

## 📞 Support

Pour toute question ou problème, contactez-nous à support@viraly.app


