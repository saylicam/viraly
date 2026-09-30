# Configuration Firebase - Guide de Setup

## ✅ Configuration Complétée

Toute la configuration Firebase a été mise à jour pour utiliser les bonnes valeurs et les variables d'environnement.

## 📁 Fichiers Modifiés

### 1. **firebase.js** ✅
- Utilise maintenant `expo-constants` pour récupérer les variables
- Configuration mise à jour avec les nouvelles valeurs
- Fallback sur les valeurs hardcodées si les variables d'environnement ne sont pas disponibles

### 2. **app.config.js** ✅
- Ajout des variables Firebase dans la section `extra`
- Les valeurs sont récupérées depuis `process.env`

### 3. **.gitignore** ✅
- Ajout de `.env` pour protéger les secrets

## 🔧 Étape Requise : Créer le fichier .env

**IMPORTANT** : Vous devez créer manuellement le fichier `.env` à la racine du projet avec le contenu suivant :

```env
# Firebase Configuration
EXPO_PUBLIC_FIREBASE_API_KEY=AIzaSyB6X3DvOG_z2synzYA7E5sN70GwKJRG3gY
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=viraly-01.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=viraly-01
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=viraly-01.firebasestorage.app
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=143996912608
EXPO_PUBLIC_FIREBASE_APP_ID=1:143996912608:web:da8d73bddf00d6e38e6185
```

### Comment créer le fichier :

1. **Windows** :
   - Créez un nouveau fichier texte nommé `.env` à la racine du projet
   - Ajoutez le contenu ci-dessus
   - Sauvegardez

2. **Mac/Linux** :
   ```bash
   cd /path/to/viraly
   cat > .env << 'EOF'
   # Firebase Configuration
   EXPO_PUBLIC_FIREBASE_API_KEY=AIzaSyB6X3DvOG_z2synzYA7E5sN70GwKJRG3gY
   EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=viraly-01.firebaseapp.com
   EXPO_PUBLIC_FIREBASE_PROJECT_ID=viraly-01
   EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=viraly-01.firebasestorage.app
   EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=143996912608
   EXPO_PUBLIC_FIREBASE_APP_ID=1:143996912608:web:da8d73bddf00d6e38e6185
   EOF
   ```

## ✅ Vérifications Effectuées

1. ✅ Tous les fichiers utilisent bien la même instance `auth` et `db` depuis `firebase.js`
2. ✅ Aucune utilisation de `firebase/compat` dans le code source
3. ✅ Aucune ancienne clé API hardcodée trouvée
4. ✅ Configuration Firebase correcte avec les nouvelles valeurs

## 🔄 Flux de Configuration

```
.env (variables d'environnement)
    ↓
app.config.js (extra)
    ↓
expo-constants (Constants.expoConfig.extra)
    ↓
firebase.js (firebaseConfig)
    ↓
initializeApp() → auth & db exports
    ↓
Tous les services utilisent les mêmes instances
```

## 📝 Notes Importantes

- Les valeurs dans `firebase.js` servent de **fallback** si les variables d'environnement ne sont pas disponibles
- Le fichier `.env` est dans `.gitignore` pour protéger vos secrets
- Toutes les méthodes d'authentification (Email, Apple, Google) utilisent la même instance `auth`
- Firestore utilise la même instance `db` pour toutes les opérations

## 🚀 Après la création du .env

1. Redémarrer le serveur Expo pour charger les nouvelles variables :
   ```bash
   npm start -- --clear
   ```

2. Si nécessaire, reconstruire l'app native :
   ```bash
   npx expo prebuild --clean
   ```

---

**Configuration terminée !** 🎉











