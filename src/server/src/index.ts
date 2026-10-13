import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { env } from './env';
import analyzeRoutes from './routes/analyze';
import legalRoutes from './routes/legal';
import trendsRoutes from './routes/trends';
import accountRoutes from './routes/account';
import { startWeeklyTrendsJob } from './jobs/weeklyTrends';
import { requireAuth, checkSubscription } from './middleware/auth';

const app = express();

// Derrière le proxy HTTPS de Railway : nécessaire pour que le rate limiting voie la vraie IP
app.set('trust proxy', 1);

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(env.RATE_LIMIT_WINDOW_MS),
  max: parseInt(env.RATE_LIMIT_MAX),
  message: { success: false, error: 'RATE_LIMITED', message: 'Trop de requêtes, réessaie dans quelques minutes.' },
  // Les vignettes des tendances (des dizaines par écran) ne comptent pas dans la limite
  skip: (req) => req.path.startsWith('/api/trends/cover/') || req.path === '/health',
});
app.use(limiter);

// CORS configuration
app.use(cors({
  origin: env.CORS_ORIGIN === '*' ? true : env.CORS_ORIGIN,
  credentials: true,
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV 
  });
});

// API routes : analyse réservée aux utilisateurs connectés ; complète pour les abonnés, partielle sinon
app.use('/api/analyze', requireAuth, checkSubscription, analyzeRoutes);

// Tendances de la semaine (sons, vidéos stars) : aperçu gratuit, complet pour Premium
app.use('/api/trends', trendsRoutes);

// Bilan du compte TikTok (@pseudo) et fiche créateur
app.use('/api/account', accountRoutes);

// Pages publiques : politique de confidentialité et assistance (liens App Store)
app.use('/', legalRoutes);

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

const PORT = parseInt(env.PORT);

// Increase server timeout for video uploads and AI analysis (5 minutes)
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on http://0.0.0.0:${PORT}`);
  console.log(`📊 Environment: ${env.NODE_ENV}`);
  console.log(`🔐 Abonnement requis: ${env.REQUIRE_SUBSCRIPTION === 'true' ? 'Oui' : 'Non (tout le monde est Premium)'}`);
  if (env.TEST_PLAN) console.log(`🧪 Mode test : tous les comptes sont traités comme « ${env.TEST_PLAN} » (TEST_PLAN)`);
  console.log(`🎁 Analyses offertes par compte gratuit : ${env.FREE_ANALYSES_TOTAL}`);
  console.log(`🤖 Gemini API configured: ${env.GEMINI_API_KEY ? 'Yes' : 'No'}`);
  console.log(`⏱️  Server timeout: 5 minutes (300000ms)`);
  startWeeklyTrendsJob();
});

// Set timeout for long requests (video upload + AI analysis)
server.timeout = 300000; // 5 minutes
server.keepAliveTimeout = 65000;
server.headersTimeout = 66000;