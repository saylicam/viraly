import { config } from 'dotenv';
import { z } from 'zod';
import path from 'path';

// Load environment variables from src/server/.env
// Try multiple paths to find the .env file
const envPaths = [
  path.resolve(process.cwd(), '.env'), // Root of server directory (when running from src/server/)
  path.resolve(process.cwd(), 'src/server/.env'), // Explicit path from project root
  path.resolve(__dirname, '../../.env'), // Relative to compiled file location
];

let envLoaded = false;
for (const envPath of envPaths) {
  const result = config({ path: envPath });
  if (!result.error) {
    console.log('✅ Environment variables loaded from:', envPath);
    envLoaded = true;
    break;
  }
}

if (!envLoaded) {
  console.warn('⚠️  Could not find .env file in expected locations, trying default location...');
  const defaultResult = config(); // Try default location (current working directory)
  if (!defaultResult.error) {
    console.log('✅ Environment variables loaded from default location');
  } else {
    console.warn('⚠️  No .env file found. Make sure to create src/server/.env with GEMINI_API_KEY');
  }
}

const envSchema = z.object({
  PORT: z.string().default('3333'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  
  // Authentification : vérification des jetons Firebase des utilisateurs de l'app
  FIREBASE_PROJECT_ID: z.string().default('viraly-01'),

  // Abonnement : vérification auprès de RevenueCat (clé SECRÈTE sk_..., jamais dans l'app)
  REVENUECAT_SECRET_API_KEY: z.string().optional(),
  REVENUECAT_ENTITLEMENT_ID: z.string().default('premium'),
  // Mettre "false" uniquement en développement pour tester l'analyse sans abonnement
  REQUIRE_SUBSCRIPTION: z.enum(['true', 'false']).default('true'),
  // Analyses offertes à un compte gratuit, AU TOTAL (pas par jour). Résultat partiel, détail réservé à Premium.
  FREE_ANALYSES_TOTAL: z.coerce.number().int().min(0).default(1),
  // Serveur du PC uniquement : simule un compte « free » ou « premium » sans interroger RevenueCat.
  // Ne jamais le mettre sur Railway.
  TEST_PLAN: z.enum(['free', 'premium']).optional(),

  // Google Gemini API (supports both GEMINI_API_KEY and EXPO_PUBLIC_GEMINI_API_KEY)
  GEMINI_API_KEY: z.string().optional(),
  EXPO_PUBLIC_GEMINI_API_KEY: z.string().optional(),
  GEMINI_MODEL: z.string().default('gemini-3.5-flash-lite'),
  
  // Firebase Admin : JSON du compte de service (Firebase > Paramètres du projet > Comptes de service).
  // Nécessaire pour enregistrer les tendances et envoyer les notifications.
  FIREBASE_SERVICE_ACCOUNT: z.string().optional(),

  // Tendances TikTok (fournisseur de données SociaVault) — collecte une fois par semaine
  SOCIAVAULT_API_KEY: z.string().optional(),
  TRENDS_INTERVAL_DAYS: z.coerce.number().min(1).default(7),
  // Jeton secret pour déclencher une collecte à la main (POST /api/trends/refresh)
  ADMIN_TOKEN: z.string().optional(),

  // CORS
  CORS_ORIGIN: z.string().default('*'),
  
  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.string().default('900000'), // 15 minutes
  RATE_LIMIT_MAX: z.string().default('100'),
});

const parseEnv = () => {
  try {
    const parsed = envSchema.parse(process.env);
    
    // Use EXPO_PUBLIC_GEMINI_API_KEY as fallback if GEMINI_API_KEY is not set
    if (!parsed.GEMINI_API_KEY && parsed.EXPO_PUBLIC_GEMINI_API_KEY) {
      parsed.GEMINI_API_KEY = parsed.EXPO_PUBLIC_GEMINI_API_KEY;
      console.log('✅ Using EXPO_PUBLIC_GEMINI_API_KEY as GEMINI_API_KEY');
    }
    
    // Validate that we have a Gemini API key
    if (!parsed.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY or EXPO_PUBLIC_GEMINI_API_KEY is required');
    }
    
    if (parsed.REQUIRE_SUBSCRIPTION === 'true' && !parsed.REVENUECAT_SECRET_API_KEY && !parsed.TEST_PLAN) {
      throw new Error('REVENUECAT_SECRET_API_KEY is required when REQUIRE_SUBSCRIPTION=true');
    }

    return parsed;
  } catch (error) {
    console.error('❌ Invalid environment variables:');
    if (error instanceof z.ZodError) {
      error.issues.forEach((err) => {
        console.error(`  - ${err.path.join('.')}: ${err.message}`);
      });
    } else {
      console.error('  -', error instanceof Error ? error.message : 'Unknown error');
    }
    process.exit(1);
  }
};

export const env = parseEnv();


