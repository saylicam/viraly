# Correction du problème de timeout lors de l'analyse vidéo

## 🔴 Problème identifié

L'analyse vidéo échouait avec l'erreur **"Network request timed out"** après un long temps d'attente. Cela était dû à plusieurs facteurs :

1. **Timeout client trop court** : Le timeout par défaut de `fetch` était insuffisant pour l'upload de vidéos et l'analyse Gemini
2. **Timeout serveur non configuré** : Le serveur Express n'avait pas de timeout explicite pour les requêtes longues
3. **Pas de vérification de connexion** : L'app ne vérifiait pas si le serveur était accessible avant de tenter l'upload
4. **Problème d'URL** : Si l'app tourne sur un téléphone, `localhost` ne fonctionne pas

## ✅ Solutions appliquées

### 1. **Frontend (`src/services/api.ts`)**

- **Timeout client augmenté à 2 minutes** : Utilisation de `AbortController` avec un timeout de 120 secondes
- **Vérification du serveur** : Ajout d'un health check avant l'upload
- **Messages d'erreur améliorés** : Messages clairs selon le type d'erreur (timeout, connexion, etc.)
- **Détection de localhost** : Avertissement si l'URL utilise `localhost` sur un appareil mobile

### 2. **Backend (`src/server/src/index.ts`)**

- **Timeout serveur configuré à 5 minutes** : 
  - `server.timeout = 300000` (5 minutes)
  - `server.keepAliveTimeout = 65000`
  - `server.headersTimeout = 66000`

### 3. **Route vidéo (`src/server/src/routes/video.ts`)**

- **Timeout par requête** : Chaque requête d'upload a un timeout de 5 minutes
- **Logs de performance** : Mesure du temps d'exécution de l'analyse Gemini
- **Logs détaillés** : Ajout de logs pour suivre chaque étape du processus

### 4. **Écran d'analyse (`src/screens/AnalyzeScreen.tsx`)**

- **Vérification du serveur** : Health check avant de lancer l'upload
- **Messages d'erreur clairs** : Instructions pour résoudre les problèmes de connexion

## 📋 Configuration requise

### Pour tester sur un téléphone physique

1. **Trouve l'IP de ton PC** :
   - Windows : `ipconfig` (cherche "IPv4 Address")
   - Mac/Linux : `ifconfig` ou `ip addr`

2. **Configure l'URL de l'API** :
   - Crée un fichier `.env` à la racine du projet
   - Ajoute : `EXPO_PUBLIC_API_URL=http://TON_IP:3333`
   - Exemple : `EXPO_PUBLIC_API_URL=http://192.168.1.100:3333`

3. **Redémarre Expo** :
   ```bash
   npx expo start --clear
   ```

### Pour tester sur un émulateur/simulateur

- `localhost` fonctionne normalement
- Pas besoin de changer l'URL

## 🧪 Test

1. **Lance le serveur backend** :
   ```bash
   cd src/server
   npm run dev
   ```

2. **Lance l'app** :
   ```bash
   npx expo start --clear
   ```

3. **Teste l'upload** :
   - Va dans "Analyser"
   - Sélectionne une vidéo
   - Clique sur "Analyser la vidéo"
   - L'analyse devrait prendre 30-60 secondes (selon la taille de la vidéo)

## 📊 Logs à surveiller

### Frontend (console Expo)
- `🔍 Checking server health...`
- `✅ Server is accessible`
- `📤 Starting video upload:`
- `📤 Uploading to:`
- `✅ Upload successful:`

### Backend (terminal serveur)
- `📹 Analyzing video: ... (X.XX MB)`
- `⏱️  Request started at: ...`
- `🤖 Sending request to Gemini API...`
- `✅ Gemini API responded in X.XXs`
- `✅ Analysis completed successfully`

## ⚠️ Problèmes courants

### "Network request timed out"
- **Solution** : Vérifie que le serveur backend est lancé
- **Solution** : Si sur téléphone, configure `EXPO_PUBLIC_API_URL` avec l'IP de ton PC

### "Le serveur backend n'est pas accessible"
- **Solution** : Lance le serveur : `cd src/server && npm run dev`
- **Solution** : Vérifie que le port 3333 n'est pas utilisé par un autre service

### "L'analyse prend trop de temps"
- **Solution** : Réduis la taille/durée de la vidéo (max 60 secondes recommandé)
- **Solution** : Vérifie ta connexion internet (Gemini nécessite une connexion stable)

## 🎯 Résultat

- ✅ Timeout client : 2 minutes
- ✅ Timeout serveur : 5 minutes
- ✅ Vérification du serveur avant upload
- ✅ Messages d'erreur clairs et actionnables
- ✅ Logs détaillés pour le débogage
- ✅ Support pour téléphone physique (via IP locale)

L'analyse vidéo devrait maintenant fonctionner correctement ! 🚀





