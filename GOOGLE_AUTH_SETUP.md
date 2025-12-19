# Configuration Google Authentication

## 📋 Prérequis

1. Installer les dépendances nécessaires :
```bash
npm install expo-auth-session expo-web-browser
```

2. Avoir un projet Firebase configuré avec Authentication activé

## 🔧 Configuration Google Cloud Console

1. Allez sur [Google Cloud Console](https://console.cloud.google.com/)
2. Créez un nouveau projet ou sélectionnez votre projet existant
3. Activez l'API "Google+ API" ou "Google Identity Services"
4. Allez dans "Identifiants" > "Créer des identifiants" > "ID client OAuth 2.0"
5. Configurez l'écran de consentement OAuth si nécessaire
6. Pour **Android** :
   - Type d'application : Android
   - Nom du package : `com.viraly.app` (vérifiez dans app.config.js)
   - SHA-1 : Récupérez avec `expo credentials:manager` ou `keytool`
7. Pour **iOS** :
   - Type d'application : iOS
   - ID de bundle : `com.viraly.app` (vérifiez dans app.config.js)
8. Pour **Web** (si vous testez sur web) :
   - Type d'application : Application Web
   - URI de redirection autorisés : `https://auth.expo.io/@your-username/viraly`

## ⚙️ Configuration dans l'app

### Option 1 : Variable d'environnement (Recommandé)

Créez un fichier `.env` à la racine du projet :
```
EXPO_PUBLIC_GOOGLE_CLIENT_ID=votre-client-id.apps.googleusercontent.com
```

### Option 2 : app.config.js

Modifiez `app.config.js` et remplacez `YOUR_GOOGLE_CLIENT_ID` par votre Client ID réel :
```javascript
extra: {
  apiUrl,
  googleClientId: "votre-client-id.apps.googleusercontent.com",
},
```

## 📱 Utilisation dans un écran

Exemple d'utilisation dans un écran de connexion :

```javascript
import React, { useState } from 'react';
import { View, Button, Text, ActivityIndicator } from 'react-native';
import { useGoogleAuth } from '../hooks/useGoogleAuth';
import { useAuth } from '../hooks/useAuth';
import { useNavigation } from '@react-navigation/native';

export default function LoginScreen() {
  const { loginWithGoogle, loading } = useGoogleAuth();
  const { user } = useAuth();
  const navigation = useNavigation();
  const [error, setError] = useState(null);

  const handleLogin = async () => {
    try {
      setError(null);
      const userData = await loginWithGoogle();
      console.log('Utilisateur connecté:', userData);
      // La navigation vers Main se fait automatiquement via App.tsx
    } catch (err) {
      setError(err.message);
      console.error('Erreur de connexion:', err);
    }
  };

  if (user) {
    // L'utilisateur est déjà connecté, redirection automatique
    return null;
  }

  return (
    <View>
      {error && <Text style={{ color: 'red' }}>{error}</Text>}
      <Button
        title={loading ? 'Connexion...' : 'Se connecter avec Google'}
        onPress={handleLogin}
        disabled={loading}
      />
    </View>
  );
}
```

## 🔐 Fonctionnalités

- ✅ Connexion Google avec expo-auth-session
- ✅ Enregistrement automatique dans Firestore (collection `users`)
- ✅ État d'authentification global avec `onAuthStateChanged`
- ✅ Redirection automatique vers Home si connecté
- ✅ Déconnexion avec `logout()`
- ✅ Persistance de la session (reste connecté après fermeture de l'app)

## 📝 Structure Firestore

Collection : `users`
Document ID : `{uid}` (UID Firebase de l'utilisateur)

Champs :
- `uid` (string)
- `email` (string | null)
- `name` (string | null)
- `photoURL` (string | null)
- `createdAt` (timestamp)
- `updatedAt` (timestamp)

## 🐛 Dépannage

### Erreur "Client ID not found"
- Vérifiez que le Client ID est bien configuré dans `app.config.js` ou `.env`
- Redémarrez le serveur Expo après modification

### Erreur "Redirect URI mismatch"
- Vérifiez que l'URI de redirection dans Google Cloud Console correspond
- Pour Expo, utilisez le format : `https://auth.expo.io/@your-username/viraly`

### L'authentification ne persiste pas
- Vérifiez que `onAuthStateChanged` est bien configuré dans `App.tsx`
- Vérifiez que Firebase est correctement initialisé











