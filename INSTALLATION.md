# 🚀 Guide d'Installation Viraly

## ⚠️ IMPORTANT : Node.js requis

Avant de commencer, assurez-vous d'avoir **Node.js** installé sur votre système.

### 1. Installer Node.js

1. Allez sur [nodejs.org](https://nodejs.org/)
2. Téléchargez la version LTS (recommandée)
3. Installez Node.js en suivant les instructions
4. Redémarrez votre terminal/PowerShell

### 2. Vérifier l'installation

Ouvrez PowerShell et tapez :
```powershell
node --version
npm --version
```

Vous devriez voir les numéros de version.

## 📦 Installation du projet

### 1. Installer les dépendances frontend

```powershell
cd C:\laragon\www\viraly
npm install
```

### 2. Installer les dépendances backend

```powershell
cd C:\laragon\www\viraly\src\server
npm install
```

## 🔧 Configuration

### 1. Variables d'environnement backend

Créez un fichier `.env` dans `src/server/` avec :

```env
# Server Configuration
PORT=3333
NODE_ENV=development

# Stripe Configuration (remplacez par vos vraies clés)
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
STRIPE_PRICE_ID=price_your_price_id_here

# Google Gemini API (remplacez par votre vraie clé)
GEMINI_API_KEY=your_gemini_api_key_here

# CORS
CORS_ORIGIN=*

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
```

### 2. Variables d'environnement frontend

Créez un fichier `.env` dans la racine avec :

```env
EXPO_PUBLIC_API_URL=http://192.168.0.12:3333
```

## 🚀 Lancement

### 1. Démarrer le backend

```powershell
cd C:\laragon\www\viraly\src\server
npm run dev
```

Le serveur devrait démarrer sur `http://localhost:3333`

### 2. Démarrer le frontend

```powershell
cd C:\laragon\www\viraly
npx expo start
```

L'application Expo devrait s'ouvrir dans votre navigateur.

## 📱 Test sur mobile

1. Installez l'app **Expo Go** sur votre téléphone
2. Scannez le QR code affiché dans le terminal
3. L'application devrait se charger sur votre téléphone

## 🔑 Configuration des APIs

### Stripe (pour les paiements)

1. Créez un compte sur [stripe.com](https://stripe.com)
2. Allez dans "Developers" > "API keys"
3. Copiez la clé secrète (sk_test_...)
4. Créez un produit avec un prix de 9.99€/mois
5. Copiez l'ID du prix (price_...)
6. Configurez les webhooks pour les événements de paiement

### Google Gemini (pour l'IA)

1. Allez sur [makersuite.google.com](https://makersuite.google.com/)
2. Créez un projet
3. Activez l'API Gemini
4. Générez une clé API
5. Copiez la clé dans votre fichier .env

## ✅ Vérification

Si tout fonctionne correctement, vous devriez voir :

1. **Backend** : "🚀 Server running on http://0.0.0.0:3333"
2. **Frontend** : L'application Expo s'ouvre dans le navigateur
3. **Mobile** : L'app se charge sur votre téléphone via Expo Go

## 🆘 Problèmes courants

### "npm n'est pas reconnu"
- Node.js n'est pas installé ou pas dans le PATH
- Redémarrez votre terminal après l'installation

### "Cannot find module"
- Les dépendances ne sont pas installées
- Relancez `npm install`

### "Connection refused" sur mobile
- Vérifiez que le backend tourne sur le bon port
- Assurez-vous que votre téléphone et PC sont sur le même réseau WiFi
- Vérifiez l'URL dans le fichier .env frontend

### Erreurs Stripe
- Vérifiez que vos clés API sont correctes
- Assurez-vous d'utiliser les clés de test (sk_test_...)

## 📞 Support

Si vous rencontrez des problèmes :
1. Vérifiez que Node.js est bien installé
2. Relancez les commandes d'installation
3. Vérifiez les fichiers .env
4. Consultez les logs d'erreur dans le terminal







