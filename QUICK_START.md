# 🚀 Démarrage Rapide Viraly

## ⚡ Installation Express

### 1. Installer Node.js
- Téléchargez Node.js depuis [nodejs.org](https://nodejs.org/)
- Installez la version LTS
- Redémarrez votre terminal

### 2. Configurer le projet
```powershell
cd C:\laragon\www\viraly
npm run setup
```

### 3. Installer les dépendances
```powershell
npm run install:all
```

### 4. Configurer les APIs
Éditez les fichiers `.env` créés et ajoutez vos clés :
- **Stripe** : Clés API depuis [stripe.com](https://stripe.com)
- **Gemini** : Clé API depuis [makersuite.google.com](https://makersuite.google.com/)

### 5. Lancer l'application
```powershell
npm run dev
```

## 📱 Test sur mobile

1. Installez **Expo Go** sur votre téléphone
2. Scannez le QR code affiché
3. L'app se charge automatiquement

## ✅ Vérification

- **Backend** : `http://localhost:3333/health`
- **Frontend** : Expo s'ouvre dans le navigateur
- **Mobile** : App fonctionne via Expo Go

## 🆘 Problèmes ?

- **"npm n'est pas reconnu"** → Node.js pas installé
- **"Cannot find module"** → Relancez `npm install`
- **App ne se charge pas** → Vérifiez les fichiers .env

## 📞 Support

Consultez `INSTALLATION.md` pour plus de détails.







