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
  
  // Stripe Configuration
  STRIPE_SECRET_KEY: z.string().min(1, 'STRIPE_SECRET_KEY is required'),
  STRIPE_WEBHOOK_SECRET: z.string().min(1, 'STRIPE_WEBHOOK_SECRET is required'),
  STRIPE_PRICE_ID: z.string().min(1, 'STRIPE_PRICE_ID is required'),
  
  // Google Gemini API (supports both GEMINI_API_KEY and EXPO_PUBLIC_GEMINI_API_KEY)
  GEMINI_API_KEY: z.string().optional(),
  EXPO_PUBLIC_GEMINI_API_KEY: z.string().optional(),
  
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
    
    return parsed;
  } catch (error) {
    console.error('❌ Invalid environment variables:');
    if (error instanceof z.ZodError) {
      error.errors.forEach((err) => {
        console.error(`  - ${err.path.join('.')}: ${err.message}`);
      });
    } else {
      console.error('  -', error instanceof Error ? error.message : 'Unknown error');
    }
    process.exit(1);
  }
};

export const env = parseEnv();


