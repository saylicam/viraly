import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from '../env';
import { type AuthedRequest } from '../middleware/auth';
import { refundFreeAnalysis, freeAnalysesLeft } from '../services/freeQuota';
import { analyzeVideo, sanitizeContext, toLegacy, trendContextFor } from '../services/videoAnalysis';
import { prepareVideo } from '../services/geminiVideo';

/** Parties de l'analyse réservées aux abonnés Premium (retirées pour les autres). */
const PREMIUM_FIELDS = [
  // v2
  'moments',
  'corrections',
  'accroches',
  'montage_ideal',
  'tendances',
  'public',
  'points_forts',
  'points_faibles',
  'idees',
  'legende',
  'meilleurs_horaires',
  'engagement',
  'risque',
  // anciens champs
  'indice_risque',
  'indice_risque_detail',
  'score_emotionnel',
  'potentiel_partage',
  'conseils_rapides',
  'optimisation_express',
  'conseils_amelioration',
  'inspiration_ia',
  'caption',
  'hashtags',
  'chance_trend',
  'vues_attendues',
  'meilleurs_horaires',
  'pourquoi_ca_perce',
  'pourquoi_ca_floppe',
];

/** Version gratuite : score, verdict et résumé visibles ; le détail est retiré. */
const toFreeAnalysis = (analysis: any) => {
  const free: any = { ...analysis, limited: true };
  // Aperçu de ce qui est caché : des chiffres concrets et le 1er problème (sans sa solution),
  // pour que l'utilisateur sache exactement ce qu'il débloque.
  const list = (v: any) => (Array.isArray(v) ? v.filter(Boolean) : []);
  const corrections = list(analysis.corrections);
  free.apercu_premium = {
    corrections: corrections.length,
    premier_probleme: corrections[0]
      ? { moment: String(corrections[0].moment ?? '').slice(0, 12), probleme: String(corrections[0].probleme ?? '').slice(0, 160) }
      : null,
    moments_faibles: list(analysis.moments).filter((m: any) => m?.type === 'faible').length,
    accroches: list(analysis.accroches).length,
    plans_montage: list(analysis.montage_ideal).length,
    hashtags: list(analysis.hashtags).length,
  };
  for (const field of PREMIUM_FIELDS) delete free[field];
  return free;
};

const router = express.Router();

// Initialize Gemini AI
let genAI: GoogleGenerativeAI | null = null;
let model: any = null;

if (env.GEMINI_API_KEY) {
  try {
    genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
    console.log('✅ GoogleGenerativeAI initialisé');
    
    // Créer le schéma JSON pour la réponse structurée (FORMAT AMÉLIORÉ avec versions condensées)
    const analysisResponseSchema = {
      type: 'object',
      properties: {
        resume_video: {
          type: 'object',
          properties: {
            court: { type: 'string', maxLength: 300 },
            long: { type: 'string', maxLength: 500 },
          },
          required: ['court', 'long'],
        },
        avis_global: {
          type: 'object',
          properties: {
            court: { type: 'string', maxLength: 300 },
            long: { type: 'string', maxLength: 500 },
          },
          required: ['court', 'long'],
        },
        pourquoi_ca_perce: {
          type: 'object',
          properties: {
            preview: { type: 'array', items: { type: 'string', maxLength: 100 }, minItems: 3, maxItems: 3 },
            complet: { type: 'array', items: { type: 'string', maxLength: 120 }, minItems: 3, maxItems: 5 },
          },
          required: ['preview', 'complet'],
        },
        pourquoi_ca_floppe: {
          type: 'object',
          properties: {
            preview: { type: 'array', items: { type: 'string', maxLength: 100 }, minItems: 3, maxItems: 3 },
            complet: { type: 'array', items: { type: 'string', maxLength: 120 }, minItems: 3, maxItems: 4 },
          },
          required: ['preview', 'complet'],
        },
        conseils_rapides: {
          type: 'array',
          items: {
          type: 'object',
          properties: {
              icone: { type: 'string', maxLength: 5 },
              titre: { type: 'string', maxLength: 50 },
              texte: { type: 'string', maxLength: 150 },
            },
            required: ['icone', 'titre', 'texte'],
          },
          minItems: 4,
          maxItems: 6,
        },
        conseils_amelioration: {
            type: 'object',
            properties: {
            preview: { type: 'array', items: { type: 'string', maxLength: 100 }, minItems: 3, maxItems: 3 },
            complet: { type: 'array', items: { type: 'string', maxLength: 120 }, minItems: 4, maxItems: 6 },
          },
          required: ['preview', 'complet'],
        },
        score_emotionnel: {
          type: 'object',
          properties: {
            confiance_charisme: { type: 'number', minimum: 0, maximum: 100 },
            intensite: { type: 'number', minimum: 0, maximum: 100 },
            impact_visuel: { type: 'number', minimum: 0, maximum: 100 },
            nostalgie: { type: 'number', minimum: 0, maximum: 100 },
          },
          required: ['confiance_charisme', 'intensite', 'impact_visuel', 'nostalgie'],
        },
        micro_metrics: {
          type: 'object',
          properties: {
            potentiel_viral: { type: 'string', enum: ['Faible', 'Moyen', 'Élevé'] },
            watchtime_estime: { type: 'string', maxLength: 20 },
            audio_tendance: { type: 'string', enum: ['Oui', 'Non'] },
            public_cible: { type: 'string', maxLength: 50 },
            type_engagement: { type: 'string', maxLength: 100 },
          },
          required: ['potentiel_viral', 'watchtime_estime', 'audio_tendance', 'public_cible', 'type_engagement'],
        },
        tags_rapides: {
          type: 'object',
          properties: {
            potentiel_viral: { type: 'string', enum: ['Faible', 'Moyen', 'Élevé'] },
            watchtime_optimal: { type: 'string', maxLength: 20 },
            audio_tendance: { type: 'string', enum: ['Oui', 'Non'] },
            public_cible: { type: 'string', maxLength: 50 },
            type_engagement: { type: 'string', maxLength: 100 },
          },
          required: ['potentiel_viral', 'watchtime_optimal', 'audio_tendance', 'public_cible', 'type_engagement'],
        },
        verdict_express: { type: 'string', maxLength: 100 },
        indice_risque: { type: 'string', enum: ['Faible', 'Moyen', 'Élevé'] },
        indice_risque_detail: { type: 'string', maxLength: 200 },
        micro_indicateurs: {
          type: 'object',
          properties: {
            audio: { type: 'number', minimum: 0, maximum: 100 },
            montage: { type: 'number', minimum: 0, maximum: 100 },
            trendiness: { type: 'number', minimum: 0, maximum: 100 },
          },
          required: ['audio', 'montage', 'trendiness'],
        },
        inspiration_ia: { type: 'array', items: { type: 'string', maxLength: 150 }, minItems: 3, maxItems: 4 },
        punchline: { type: 'string', maxLength: 100 },
        verdict_final: {
          type: 'object',
          properties: {
            emoji: { type: 'string', maxLength: 5 },
            titre: { type: 'string', maxLength: 50 },
            message: { type: 'string', maxLength: 300 },
          },
          required: ['emoji', 'titre', 'message'],
        },
        caption: { type: 'string', maxLength: 300 },
        hashtags: { type: 'array', items: { type: 'string' }, minItems: 10, maxItems: 10 },
        score_sur_100: { type: 'number', minimum: 0, maximum: 100 },
        score_titre: { type: 'string', maxLength: 100 },
        phrase_motivante: { type: 'string', maxLength: 150 },
        type_video_detecte: { type: 'string', maxLength: 50 },
        potentiel_partage: {
          type: 'object',
          properties: {
            potentiel_like: { type: 'number', minimum: 0, maximum: 100 },
            potentiel_commentaire: { type: 'number', minimum: 0, maximum: 100 },
            potentiel_partage: { type: 'number', minimum: 0, maximum: 100 },
          },
          required: ['potentiel_like', 'potentiel_commentaire', 'potentiel_partage'],
        },
        optimisation_express: {
          type: 'array',
          items: { type: 'string', maxLength: 120 },
          minItems: 3,
          maxItems: 5,
        },
        chance_trend: { type: 'string', maxLength: 20 },
        vues_attendues: { type: 'string', maxLength: 50 },
        niveau_confiance: { type: 'string', enum: ['Faible', 'Moyen', 'Fort'] },
        meilleurs_horaires: { type: 'array', items: { type: 'string', maxLength: 10 }, minItems: 3, maxItems: 3 },
      },
      required: ['resume_video', 'avis_global', 'pourquoi_ca_perce', 'pourquoi_ca_floppe', 'conseils_rapides', 'conseils_amelioration', 'score_emotionnel', 'micro_metrics', 'tags_rapides', 'verdict_express', 'indice_risque', 'indice_risque_detail', 'micro_indicateurs', 'inspiration_ia', 'punchline', 'verdict_final', 'caption', 'hashtags', 'score_sur_100', 'score_titre', 'phrase_motivante', 'type_video_detecte', 'potentiel_partage', 'optimisation_express', 'chance_trend', 'vues_attendues', 'niveau_confiance', 'meilleurs_horaires'],
    };
    
    // Initialiser le modèle avec configuration JSON
    // Note: responseMimeType et responseSchema peuvent ne pas être disponibles dans toutes les versions
    const generationConfig: any = {
      temperature: 0.7,
      topP: 0.95,
      topK: 40,
      maxOutputTokens: 16384, // Augmenté pour permettre des réponses plus longues
    };
    
    // Ajouter responseMimeType et responseSchema si supportés
    try {
      generationConfig.responseMimeType = 'application/json';
      generationConfig.responseSchema = analysisResponseSchema;
      console.log('✅ Configuration JSON structuré activée');
    } catch (e) {
      console.warn('⚠️  responseMimeType/responseSchema non supportés, utilisation du prompt JSON');
      console.warn('   Erreur:', e);
    }
    
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
    
    // CONFIGURATION DU MODÈLE (JSON structuré + inlineData conservés)
    model = genAI.getGenerativeModel({ 
      model: geminiModel,
      generationConfig: generationConfig,
    });
    
    console.log('✅ Gemini AI initialized successfully');
    console.log(`   Model: ${geminiModel}`);
    console.log('   Response format: JSON (structured)');
    console.log('   API Key: ' + (env.GEMINI_API_KEY.substring(0, 10) + '...'));
    console.log('   Method: inlineData (direct upload, no FileManager)');
  } catch (error) {
    console.error('❌ Failed to initialize Gemini AI:', error);
  }
} else {
  console.error('❌ GEMINI_API_KEY is missing in environment variables');
}

// Configuration multer pour stocker les fichiers dans /uploads
const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const safeName = path.basename(file.originalname || 'video.mp4').replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, `video-${uniqueSuffix}-${safeName}`);
  },
});

const upload = multer({
  storage: storage,
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

// FileManager supprimé - utilisation directe de inlineData avec base64

// Analyze video content
router.post('/', async (req, res) => {
  try {
    const { videoUrl, prompt } = req.body;

    if (!videoUrl) {
      return res.status(400).json({ error: 'Video URL is required' });
    }

    // Default prompt for video analysis
    const defaultPrompt = `
    Analyse cette vidéo TikTok/Instagram et fournis une analyse détaillée en français :
    
    1. **Contenu** : Décris ce qui se passe dans la vidéo
    2. **Engagement** : Évalue le potentiel viral (1-10)
    3. **Hashtags** : Suggère 5-10 hashtags pertinents
    4. **Améliorations** : 3 conseils pour optimiser la vidéo
    5. **Tendances** : Identifie les tendances actuelles utilisées
    6. **Audience** : À qui cette vidéo s'adresse-t-elle ?
    
    Sois précis, constructif et utilise un ton professionnel mais accessible.
    `;

    const analysisPrompt = prompt || defaultPrompt;

    // Generate analysis using Gemini
    const result = await model.generateContent(analysisPrompt);
    const response = await result.response;
    const analysis = response.text();

    res.json({
      success: true,
      analysis,
      videoUrl,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Analysis error:', error);
    res.status(500).json({ 
      error: 'Failed to analyze video',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ROUTE /analysis/video - Utilisation directe de inlineData (sans FileManager)
router.post('/video', upload.single('video'), async (req, res) => {
  let tempFilePath: string | null = null;
  
  try {
    // Vérifier que le fichier a été uploadé
    if (!req.file) {
      return res.status(400).json({ 
        success: false,
        error: 'NO_VIDEO_FILE',
        message: 'Aucun fichier vidéo fourni' 
      });
    }

    // Vérifier que Gemini est initialisé
    if (!env.GEMINI_API_KEY || !genAI || !model) {
      return res.status(500).json({ 
        success: false,
        error: 'GEMINI_NOT_INITIALIZED',
        message: 'L\'API Gemini n\'est pas correctement initialisée. Vérifiez GEMINI_API_KEY dans .env'
      });
    }

    const { originalname, mimetype, size, path: filePath } = req.file;
    tempFilePath = filePath;

    console.log('📹 ========== DÉBUT ANALYSE VIDÉO ==========');
    console.log(`📹 Fichier: ${originalname}`);
    console.log(`📹 Taille: ${(size / 1024 / 1024).toFixed(2)} MB`);
    console.log(`📹 Type MIME: ${mimetype}`);

    // 1. Vidéo pour Gemini : directe si elle est petite, sinon via l'API Fichiers de Google (envoyée une seule fois)
    const ctx = sanitizeContext(req.body);
    console.log(`🤖 Analyse v2 — modèle ${env.GEMINI_MODEL}, niche ${ctx.niche ?? '?'}, niveau ${ctx.level ?? '?'}`);
    const [video, trends] = await Promise.all([prepareVideo(tempFilePath, mimetype), trendContextFor(ctx.niche)]);
    console.log(`📤 Vidéo prête (${video.uploaded ? 'API Fichiers' : 'directe'}, ${video.sizeMb.toFixed(1)} Mo)`);
    let v2;
    try {
      v2 = await analyzeVideo(video.part, ctx, trends);
    } finally {
      video.cleanup();
    }
    // Nouveaux champs + anciens champs (pour les versions de l'app déjà publiées)
    const normalizedAnalysis = { ...toLegacy(v2), ...v2 };

    // 8. Retourner la réponse
    const responseData = {
      success: true,
      data: {
        fileName: originalname,
        fileSize: size,
        mimeType: mimetype,
        analysis: (req as AuthedRequest).isPremium ? normalizedAnalysis : toFreeAnalysis(normalizedAnalysis),
        timestamp: new Date().toISOString(),
      },
    };
    
    console.log('📤 Envoi de la réponse au frontend');
    console.log(`   Structure: { success: true, data: { analysis: {...} } }`);
    console.log(`   Clés dans analysis: ${Object.keys(normalizedAnalysis).slice(0, 10).join(', ')}...`);
    
    res.json(responseData);

    console.log('📹 ========== ANALYSE TERMINÉE AVEC SUCCÈS ==========');

  } catch (error: any) {
    // AMÉLIORATION DU DEBUG - Affichage complet des détails de l'erreur
    console.error('❌ ========== ERREUR LORS DE L\'ANALYSE VIDÉO ==========');
    console.error('❌ ERREUR GEMINI :', error);
    
    // Logs détaillés de l'erreur
    console.error('❌ Type d\'erreur:', error?.constructor?.name || 'Unknown');
    console.error('❌ Message d\'erreur:', error?.message || 'No message');
    console.error('❌ Cause de l\'erreur:', error?.cause || 'No cause');
    console.error('❌ Stack trace:', error?.stack || 'No stack trace');
    
    // Détails de la réponse API si disponible
    if (error?.response) {
      console.error('❌ Détails API :', JSON.stringify(error.response, null, 2));
    }
    
    // Autres propriétés d'erreur
    if (error?.status) {
      console.error('❌ Status HTTP:', error.status);
    }
    if (error?.statusCode) {
      console.error('❌ Status Code:', error.statusCode);
    }
    if (error?.code) {
      console.error('❌ Error Code:', error.code);
    }
    
    // Propriétés spécifiques GoogleGenerativeAIError
    if (error?.name === 'GoogleGenerativeAIError' || error?.constructor?.name === 'GoogleGenerativeAIError') {
      console.error('❌ Erreur GoogleGenerativeAI détectée');
      console.error('❌ Error code:', error?.code || 'No code');
      console.error('❌ Error status:', error?.status || 'No status');
      if (error?.response) {
        console.error('❌ Error response:', JSON.stringify(error.response, null, 2));
      }
    }
    
    // Afficher toutes les propriétés disponibles
    console.error('❌ Toutes les propriétés de l\'erreur:', Object.keys(error || {}));
    try {
      console.error('❌ Erreur complète (JSON):', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
    } catch (jsonError) {
      console.error('❌ Impossible de sérialiser l\'erreur en JSON:', jsonError);
    }
    
    console.error('❌ ====================================================');

    // Déterminer le code et message d'erreur
    let errorMessage = 'Erreur lors de l\'analyse vidéo';
    let errorCode = 'ANALYSIS_FAILED';
    
    if (error?.message?.includes('API key') || error?.message?.includes('401')) {
      errorMessage = 'Clé API Gemini invalide ou manquante';
      errorCode = 'GEMINI_API_KEY_INVALID';
    } else if (error?.message?.includes('quota') || error?.message?.includes('429')) {
      errorMessage = 'Quota API Gemini dépassé. Réessayez plus tard.';
      errorCode = 'GEMINI_QUOTA_EXCEEDED';
    } else if (error?.message?.includes('timeout') || error?.message?.includes('Timeout')) {
      errorMessage = 'L\'analyse a pris trop de temps. Réessayez avec une vidéo plus courte.';
      errorCode = 'GEMINI_TIMEOUT';
    } else if (error?.message?.includes('safety') || error?.message?.includes('blocked')) {
      errorMessage = 'Le contenu de la vidéo a été bloqué par les filtres de sécurité Gemini.';
      errorCode = 'GEMINI_SAFETY_BLOCKED';
    } else {
      errorMessage = "L'IA n'a pas réussi à analyser ta vidéo. Réessaie dans un instant.";
    }

    // L'utilisateur n'a rien reçu : on lui rend son analyse gratuite
    const authed = req as AuthedRequest;
    if (authed.uid && !authed.isPremium) refundFreeAnalysis(authed.uid);

    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        error: errorCode,
        message: errorMessage,
        details: process.env.NODE_ENV === 'development' ? error?.message : undefined,
      });
    }
  } finally {
    // Nettoyage : Supprimer le fichier temporaire
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      try {
        fs.unlinkSync(tempFilePath);
        console.log('🧹 Fichier temporaire supprimé:', tempFilePath);
      } catch (cleanupError) {
        console.warn('⚠️  Erreur lors de la suppression du fichier temporaire:', cleanupError);
      }
    }
    // Plus besoin de nettoyer le FileManager car on ne l'utilise plus
  }
});

// Get analysis suggestions
/**
 * GET /api/analyze/quota — l'app vérifie AVANT d'envoyer une vidéo : si l'analyse offerte
 * est déjà utilisée, elle ouvre directement l'écran Premium (pas d'envoi ni d'attente inutile).
 */
router.get('/quota', async (req, res) => {
  const authed = req as AuthedRequest;
  if (authed.isPremium) return res.json({ success: true, data: { isPremium: true, freeLeft: null } });
  try {
    const freeLeft = await freeAnalysesLeft(authed.uid as string);
    return res.json({ success: true, data: { isPremium: false, freeLeft, freeTotal: env.FREE_ANALYSES_TOTAL } });
  } catch {
    // En cas de doute, on laisse essayer : le serveur refusera l'analyse si besoin
    return res.json({ success: true, data: { isPremium: false, freeLeft: 1, freeTotal: env.FREE_ANALYSES_TOTAL } });
  }
});

router.get('/suggestions', async (req, res) => {
  try {
    const suggestions = {
      trendingHashtags: [
        '#viral', '#fyp', '#trending', '#foryou', '#explore',
        '#reels', '#shorts', '#content', '#creator', '#social'
      ],
      contentTypes: [
        'Tutoriel', 'Comédie', 'Danse', 'Tendances', 'Lifestyle',
        'Beauté', 'Cuisine', 'Fitness', 'Voyage', 'Tech'
      ],
      optimizationTips: [
        'Utilise des transitions fluides',
        'Ajoute des sous-titres',
        'Commence fort dans les 3 premières secondes',
        'Utilise des couleurs vives',
        'Reste authentique et original'
      ]
    };

    res.json(suggestions);
  } catch (error) {
    console.error('Suggestions error:', error);
    res.status(500).json({ error: 'Failed to get suggestions' });
  }
});

export default router;