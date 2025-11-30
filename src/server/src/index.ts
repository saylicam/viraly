import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { env } from './env';
import { stripe } from './stripe';
import analyzeRoutes from './routes/analyze';
import videoRoutes from './routes/video';
import paymentsRoutes from './routes/payments';
import webhookRoutes from './routes/webhook';

const app = express();

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(env.RATE_LIMIT_WINDOW_MS),
  max: parseInt(env.RATE_LIMIT_MAX),
  message: 'Too many requests from this IP, please try again later.',
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

// API routes
app.use('/api/analyze', analyzeRoutes);
app.use('/api/video', videoRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/webhook', webhookRoutes);

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
  console.log(`🔑 Stripe configured: ${stripe ? 'Yes' : 'No'}`);
  console.log(`🤖 Gemini API configured: ${env.GEMINI_API_KEY ? 'Yes' : 'No'}`);
  console.log(`⏱️  Server timeout: 5 minutes (300000ms)`);
});

// Set timeout for long requests (video upload + AI analysis)
server.timeout = 300000; // 5 minutes
server.keepAliveTimeout = 65000;
server.headersTimeout = 66000;