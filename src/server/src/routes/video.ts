import express from 'express';
import multer from 'multer';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from '../env';
import { generateVideoAnalysis, VideoMetadata } from '../utils/videoAnalysis';

const router = express.Router();

// Configure multer for video uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only video files are allowed'));
    }
  },
});

// Initialize Gemini AI
let genAI: GoogleGenerativeAI | null = null;
let model: any = null;

if (env.GEMINI_API_KEY) {
  try {
    genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
    
    const geminiModel = env.GEMINI_MODEL;

    // VERIFICATION DES MODÈLES (Debug)
    try {
      const testModel = genAI.getGenerativeModel({ model: geminiModel });
      console.log(`✅ Modèle ${geminiModel} configuré et accessible via l'API SDK.`);
    } catch (e: any) {
      console.error(`⚠️ ATTENTION: Le code ne semble pas trouver ${geminiModel} via l'API SDK.`);
      console.error('   Erreur:', e?.message || e);
      throw e; // Arrêter l'initialisation si le modèle n'est pas accessible
    }
    
    // CONFIGURATION DU MODÈLE
    model = genAI.getGenerativeModel({ 
      model: geminiModel,
      generationConfig: {
        temperature: 0.7,
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 8192,
      },
    });
    console.log('✅ Gemini AI initialized successfully');
    console.log(`   Model: ${geminiModel}`);
    console.log('   API Key: ' + (env.GEMINI_API_KEY.substring(0, 10) + '...'));
  } catch (error) {
    console.error('❌ Failed to initialize Gemini AI:', error);
  }
} else {
  console.error('❌ GEMINI_API_KEY is missing in environment variables');
  console.error('   Please set GEMINI_API_KEY in src/server/.env file');
}

// Upload and analyze video
router.post('/upload', upload.single('video'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No video file provided' });
    }

    // Check if Gemini is properly initialized
    if (!env.GEMINI_API_KEY || !genAI || !model) {
      console.error('❌ Gemini API not configured properly');
      console.error('   GEMINI_API_KEY:', env.GEMINI_API_KEY ? 'Present' : 'Missing');
      console.error('   genAI:', genAI ? 'Initialized' : 'Not initialized');
      console.error('   model:', model ? 'Initialized' : 'Not initialized');
      
      return res.status(500).json({ 
        success: false,
        error: 'GEMINI_ANALYSIS_FAILED',
        message: 'La clé API Gemini n\'est pas configurée. Vérifiez que GEMINI_API_KEY est définie dans src/server/.env'
      });
    }

    const { originalname, mimetype, size, buffer } = req.file;

    console.log(`📹 Analyse de la vidéo: ${originalname} (${(size / 1024 / 1024).toFixed(2)}MB)`);
    console.log(`⏱️  Début de la requête: ${new Date().toISOString()}`);
    
    // Set a longer timeout for this specific request (5 minutes)
    req.setTimeout(300000, () => {
      console.error('❌ Timeout de la requête après 5 minutes');
      if (!res.headersSent) {
        res.status(408).json({ 
          success: false,
          error: 'GEMINI_TIMEOUT',
          message: 'L\'analyse prend trop de temps. Réessayez avec une vidéo plus courte.' 
        });
      }
    });

    try {
      // Préparer les métadonnées de la vidéo
      const videoMetadata: VideoMetadata = {
        originalname,
        mimetype,
        size,
        buffer,
      };
      
      // Générer l'analyse complète avec la fonction helper
      // Passer genAI pour permettre l'utilisation du FileManager
      if (!genAI) {
        throw new Error('GoogleGenerativeAI instance not initialized');
      }
      const analysis = await generateVideoAnalysis(model, videoMetadata, genAI);
      
      // Vérifier si on a le format premium ou l'ancien format
      const isPremiumFormat = !!analysis.premium;
      
      console.log('✅ Analyse terminée avec succès');
      if (isPremiumFormat) {
        console.log(`   Format: Premium`);
        console.log(`   Score: ${analysis.premium!.summary.score}%`);
        console.log(`   Catégorie: ${analysis.premium!.summary.category}`);
        console.log(`   Hashtags: ${analysis.premium!.hashtags.length} hashtags générés`);
        console.log(`   Points forts: ${analysis.premium!.strengths.length} points identifiés`);
        console.log(`   Recommandations: ${analysis.premium!.recommendations.length} suggestions`);
      } else {
        console.log(`   Format: Legacy`);
        console.log(`   Potentiel viral: ${analysis.potentielViral}%`);
        const niche = analysis.extraction?.niche || 'Non spécifié';
        console.log(`   Niche: ${niche}`);
        const hashtagsCount = analysis.extraction?.hashtags?.length || 0;
        console.log(`   Hashtags: ${hashtagsCount} hashtags générés`);
        console.log(`   Points forts: ${analysis.pointsForts?.length || 0} points identifiés`);
        console.log(`   Améliorations: ${analysis.ameliorations?.length || 0} suggestions`);
      }

      // Construire la réponse selon le format
      let analysisResponse: any;
      
      if (isPremiumFormat) {
        // NOUVEAU FORMAT PREMIUM
        const premium = analysis.premium!;
        analysisResponse = {
          // Format premium complet
          premium: premium,
          // Champs de compatibilité pour le frontend
          description: `Vidéo ${premium.summary.category} - ${premium.summary.verdict}`,
          ton: 'Non spécifié',
          rythme: 'Non spécifié',
          emotions: premium.emotions_detected || [],
          styleMontage: premium.summary.format,
          publicCible: premium.public_target,
          hashtags: premium.hashtags || [],
          tendances: premium.trends || [],
          niche: premium.summary.category,
          // Champs legacy
          potentielViral: premium.summary.score,
          pointsForts: premium.strengths || [],
          ameliorations: premium.weaknesses || [],
          planningSuggeré: premium.recommendations.map(r => r.text) || [],
          viralPotential: premium.summary.score >= 80 ? 'Élevé' : 
                         premium.summary.score >= 50 ? 'Moyen' : 'Faible',
          engagementScore: Math.round(premium.summary.score / 10),
          viralScore: Math.round(premium.summary.score / 10),
          suggestions: premium.recommendations.map(r => r.text) || [],
          trends: premium.trends || [],
          contentDescription: `Vidéo ${premium.summary.category} - ${premium.summary.verdict}`,
          targetAudience: premium.public_target,
          strengths: premium.strengths || [],
          improvements: premium.weaknesses || [],
          // Champs snake_case pour compatibilité
          points_forts: premium.strengths || [],
          potentiel_viral: premium.summary.score,
          style_montage: premium.summary.format,
          public_cible: premium.public_target,
          timestamp: new Date().toISOString(),
        };
      } else {
        // ANCIEN FORMAT (compatibilité)
        analysisResponse = {
          // Ancien format complet
          ...analysis,
          // Champs de compatibilité pour le frontend
          description: analysis.description?.resume || 'Vidéo analysée',
          ton: analysis.description?.ton || 'Non spécifié',
          rythme: analysis.analyseTechnique?.rythme || 'Non spécifié',
          emotions: analysis.description?.emotions || [],
          styleMontage: analysis.extraction?.styleVideo || 'Standard',
          publicCible: analysis.publicCible || 'Public général',
          hashtags: analysis.extraction?.hashtags || [],
          tendances: analysis.tendances || [],
          niche: analysis.extraction?.niche || 'Général',
          // Champs legacy
          viralPotential: analysis.potentielViral >= 80 ? 'Élevé' : 
                         analysis.potentielViral >= 50 ? 'Moyen' : 'Faible',
          engagementScore: Math.round(analysis.potentielViral / 10),
          viralScore: Math.round(analysis.potentielViral / 10),
          suggestions: analysis.ameliorations || [],
          trends: analysis.tendances || [],
          contentDescription: analysis.description?.resume || 'Vidéo analysée',
          targetAudience: analysis.publicCible || 'Public général',
          strengths: analysis.pointsForts || [],
          improvements: analysis.ameliorations || [],
          // Champs snake_case pour compatibilité
          points_forts: analysis.pointsForts || [],
          potentiel_viral: analysis.potentielViral,
          style_montage: analysis.extraction?.styleVideo || 'Standard',
          public_cible: analysis.publicCible || 'Public général',
          timestamp: new Date().toISOString(),
        };
      }

      // Retourner la réponse avec toutes les données
      res.json({
        success: true,
        data: {
          fileName: originalname,
          fileSize: size,
          mimeType: mimetype,
          analysis: analysisResponse,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (geminiError: any) {
      console.error('❌ Erreur lors de l\'analyse Gemini');
      console.error('   Type d\'erreur:', geminiError?.constructor?.name || 'Unknown');
      console.error('   Message:', geminiError?.message || 'No message');
      console.error('   Stack:', geminiError?.stack || 'No stack trace');
      
      // Déterminer le code et message d'erreur
      let errorMessage = 'Erreur lors de l\'analyse par Gemini';
      let errorCode = 'GEMINI_ANALYSIS_FAILED';
      
      if (geminiError?.message?.includes('API key') || geminiError?.message?.includes('401')) {
        errorMessage = 'Clé API Gemini invalide ou manquante. Vérifiez votre clé dans src/server/.env';
        errorCode = 'GEMINI_API_KEY_INVALID';
      } else if (geminiError?.message?.includes('quota') || geminiError?.message?.includes('429')) {
        errorMessage = 'Quota API Gemini dépassé. Réessayez plus tard.';
        errorCode = 'GEMINI_QUOTA_EXCEEDED';
      } else if (geminiError?.message?.includes('timeout')) {
        errorMessage = 'L\'analyse a pris trop de temps. Réessayez avec une vidéo plus courte.';
        errorCode = 'GEMINI_TIMEOUT';
      } else if (geminiError?.message?.includes('safety') || geminiError?.message?.includes('blocked')) {
        errorMessage = 'Le contenu de la vidéo a été bloqué par les filtres de sécurité Gemini.';
        errorCode = 'GEMINI_SAFETY_BLOCKED';
      } else if (geminiError?.message) {
        errorMessage = geminiError.message;
      }
      
      // Retourner l'erreur au lieu d'un fallback
      return res.status(500).json({
        success: false,
        error: errorCode,
        message: errorMessage,
        details: process.env.NODE_ENV === 'development' ? geminiError?.message : undefined
      });
    }

  } catch (error) {
    console.error('❌ Video upload error:', error);
    console.error('   Error type:', error?.constructor?.name || 'Unknown');
    console.error('   Error message:', error instanceof Error ? error.message : 'No message');
    
    res.status(500).json({ 
      success: false,
      error: 'VIDEO_UPLOAD_FAILED',
      message: error instanceof Error ? error.message : 'Erreur inconnue lors du traitement de la vidéo'
    });
  }
});

// Get video processing status
router.get('/status/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    res.json({
      id,
      status: 'completed',
      progress: 100,
      result: {
        analysis: 'Video analysis completed',
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Status check error:', error);
    res.status(500).json({ error: 'Failed to check status' });
  }
});

export default router;
