const fs = require('fs');
const path = require('path');

console.log('🚀 Configuration de Viraly...');

// Créer le fichier .env pour le frontend
const frontendEnv = `# Frontend Environment Variables
EXPO_PUBLIC_API_URL=http://192.168.0.12:3333
`;

fs.writeFileSync('.env', frontendEnv);
console.log('✅ Fichier .env créé pour le frontend');

// Créer le fichier .env pour le backend
const backendEnv = `# Server Configuration
PORT=3333
NODE_ENV=development

# Stripe Configuration (remplacez par vos vraies clés)
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
STRIPE_PRICE_ID=price_your_price_id_here

# Google Gemini API (remplacez par votre vraie clé)
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-3.5-flash-lite

# CORS
CORS_ORIGIN=*

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
`;

const backendEnvPath = path.join('src', 'server', '.env');
fs.writeFileSync(backendEnvPath, backendEnv);
console.log('✅ Fichier .env créé pour le backend');

console.log('🎉 Configuration terminée !');
console.log('');
console.log('📝 Prochaines étapes :');
console.log('1. Installez Node.js si ce n\'est pas fait');
console.log('2. Configurez vos clés API dans les fichiers .env');
console.log('3. Lancez "npm install" dans la racine');
console.log('4. Lancez "npm install" dans src/server/');
console.log('5. Démarrez le backend avec "npm run dev" dans src/server/');
console.log('6. Démarrez le frontend avec "npx expo start"');







