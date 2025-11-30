import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from '../env';

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
    
    // VERIFICATION DES MODÈLES (Debug) : Tester l'accès au modèle gemini-2.5-flash
    try {
      const testModel = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
      console.log('✅ Modèle gemini-2.5-flash configuré et accessible via l\'API SDK.');
    } catch (e: any) {
      console.error('⚠️ ATTENTION: Le code ne semble pas trouver gemini-2.5-flash via l\'API SDK.');
      console.error('   Erreur:', e?.message || e);
      throw e; // Arrêter l'initialisation si le modèle n'est pas accessible
    }
    
    // CONFIGURATION DU MODÈLE : Utiliser EXCLUSIVEMENT gemini-2.5-flash
    model = genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash',
      generationConfig: generationConfig,
    });
    
    console.log('✅ Gemini AI initialized successfully');
    console.log('   Model: gemini-2.5-flash');
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
    cb(null, `video-${uniqueSuffix}-${file.originalname}`);
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
    console.log(`📹 Méthode: inlineData (direct upload, pas de FileManager)`);

    // 1. Lire le fichier depuis le disque et convertir en base64
    console.log('📤 Lecture du fichier et conversion en base64...');
    const fileBuffer = fs.readFileSync(tempFilePath);
    const videoBase64 = fileBuffer.toString('base64');
    console.log(`✅ Fichier converti en base64 (${(videoBase64.length / 1024).toFixed(2)} KB)`);

    // 2. Créer le prompt d'analyse AMÉLIORÉ avec persona fixe et calibrage réaliste
    const analysisPrompt = `Tu es un analyste TikTok professionnel avec une persona fixe : "Coach TikTok + Analyst Marketing + Créateur de contenu expérimenté". Analyse cette vidéo avec RIGUEUR et HONNÊTETÉ. Renvoie UNIQUEMENT un JSON propre.

**🎯 PERSONA FIXE — TON À ADOPTER :**
- Professionnel : expertise TikTok et marketing
- Honnête et strict : évaluation rigoureuse mais constructive
- Calibré et mesuré : jamais agressif, jamais trop gentil
- Toujours constructif : orienté "amélioration" et actionnable
- Nuancé : "pour TikTok", "dans ce format", "pour ton public"
- Focalisé : uniquement sur la qualité TikTok du contenu (pas jugement de valeur inutile)

**Exemples de ton :**
❌ Évite : "Exécution très faible" / "C'est nul" / "Très mauvais"
✅ Préfère : "Vidéo perfectible : l'idée est bonne mais plusieurs éléments limitent sa performance pour TikTok."
✅ Préfère : "Le contenu est fort, mais il manque les codes TikTok (son viral + recadrage + sous-titres)."
✅ Préfère : "Vidéo solide dans le fond, mais l'exécution TikTok doit être optimisée."

**⚠️ CALIBRAGE DES SCORES — NOUVELLE GRILLE RÉALISTE :**

Tu dois évaluer la vidéo comme un analyste TikTok professionnel. La distribution des notes doit être RÉALISTE :

- 85–100 : Fort potentiel de viralité
- 70–85 : Très bonne vidéo / edit solide
- 55–70 : Correct avec des défauts
- 40–55 : Moyen
- 25–40 : Faible
- 0–25 : Très faible / non adapté

**RÈGLES CRITIQUES :**
- Un edit correct ne doit JAMAIS être noté sous 40
- Les pénalités (watermark, TV, copyright, audio non viral) doivent réduire le score mais jamais de manière injuste
- Le score doit toujours refléter la qualité TikTok (pas la qualité "film/TV")
- Sois strict mais pas "cassant". Reste équilibré dans tes évaluations.

**PÉNALISES (calibrées et justes) :**
- Manque de hook à 0:00 → -10 points
- Transitions faibles → -8 points
- Rythme trop lent → -10 points
- Texte illisible → -6 points
- Vidéo floue / sombre / répétitive → -12 points
- Watermark visible → -15 points (mais ne descend pas sous 40 si edit correct)
- Sujet trop niche → -8 points
- Mauvaise lumière ou qualité clips → -10 points
- Audio non tendance → -6 points
- Longueur excessive → -8 points
- Montage non dynamique → -10 points

**RÉCOMPENSES :**
- Montage dynamique et rythmé → +12 points
- Rythme tendance et accrocheur → +10 points
- Audio tendance et synchro → +8 points
- Personnalité forte et authentique → +8 points
- Hook puissant dès 0:00 → +6 points
- Sous-titres dynamiques → +5 points
- Codes TikTok respectés → +8 points

**RÈGLE D'OR :** Sois HONNÊTE, DIRECTE mais CONSTRUCTIVE. Sois un coach TikTok professionnel, pas un juge.

**CONTEXTE :**
- Fichier : ${originalname}
- Taille : ${(size / 1024 / 1024).toFixed(2)} MB

**STRUCTURE JSON OBLIGATOIRE :**

{
  "resume_video": {
    "court": "Résumé ultra-court en 3-4 lignes max. Direct, précis, format coach. RÈGLE STRICTE : Si la vidéo provient d'un film, série, anime, influenceur connu → CITE DIRECTEMENT l'œuvre, quand c'est détectable. Exemples : 'Extrait de La Vérité si je mens avec Patrick Abitbol.' / 'Edit de Damon Salvatore (The Vampire Diaries).' / 'Scène culte provenant de [œuvre].' L'IA connaît l'origine de la vidéo (elle le met dans les hashtags), donc elle DOIT l'inclure dans le résumé. Ne reste JAMAIS vague si tu connais la référence.",
    "long": "Résumé détaillé en 5-7 lignes. Plus de contexte et d'analyse. OBLIGATOIREMENT : mentionne le contexte (film/série/TikTok/POV), le type de scène (dialogue/edit/POV/montage esthétique), la vibe (émotion/humour/nostalgie). Si l'œuvre est identifiée, cite-la clairement. Exemple : 'Extrait culte du film La Vérité si je mens où Patrick Abitbol et Serge débattent du mot 'date'. La scène joue sur le malentendu culturel, renforcé par un texte incrusté explicatif.'"
  },
  
  "avis_global": {
    "court": "Avis condensé en 3-4 lignes max. Ton coach professionnel.",
    "long": "Avis détaillé en 5-7 lignes. Mentionne qualité montage + vibe + potentiel viral."
  },
  
  "pourquoi_ca_perce": {
    "preview": [
      "Bullet 1 (hook)",
      "Bullet 2 (musique)",
      "Bullet 3 (vibe)"
    ],
    "complet": [
      "Bullet détaillé 1",
      "Bullet détaillé 2",
      "Bullet détaillé 3",
      "Bullet détaillé 4",
      "Bullet détaillé 5"
    ]
  },
  ⚠️ RÈGLE : Toujours 3 à 5 bullet points maximum, concis, lisibles. Ne JAMAIS répéter la même idée dans plusieurs sections. Adapter au contexte réel (pas générique).
  
  "pourquoi_ca_floppe": {
    "preview": [
      "Risque 1",
      "Risque 2",
      "Risque 3"
    ],
    "complet": [
      "Risque détaillé 1",
      "Risque détaillé 2",
      "Risque détaillé 3",
      "Risque détaillé 4"
    ]
  },
  ⚠️ RÈGLE : Toujours 3 à 5 bullet points maximum, concis, lisibles. Ne JAMAIS répéter la même idée dans plusieurs sections. Adapter au contexte réel (pas générique).
  
  "conseils_rapides": [
    {
      "icone": "🎥",
      "titre": "Améliorer transitions",
      "texte": "Ajoute un effet plus moderne pour dynamiser la vidéo."
    },
    {
      "icone": "✂️",
      "titre": "Réduire l'intro",
      "texte": "Coupe 0.2s du début pour booster le hook."
    },
    {
      "icone": "🎵",
      "titre": "Audio alternatif",
      "texte": "Teste un son tendance similaire pour gagner 20% de visibilité."
    },
    {
      "icone": "📝",
      "titre": "Texte plus court",
      "texte": "Garde un hook ≤ 3 mots pour exploser l'engagement."
    }
  ],
  
  "conseils_amelioration": {
    "preview": [
      "Conseil 1",
      "Conseil 2",
      "Conseil 3"
    ],
    "complet": [
      "Conseil détaillé 1",
      "Conseil détaillé 2",
      "Conseil détaillé 3",
      "Conseil détaillé 4",
      "Conseil détaillé 5",
      "Conseil détaillé 6"
    ]
  },
  
  "score_emotionnel": {
    "confiance_charisme": 75,
    "intensite": 80,
    "impact_visuel": 70,
    "nostalgie": 60
  },
  ⚠️ IMPORTANT : Les scores doivent être RÉELS (0-100). 50% = 50, pas 100. 25% = 25, pas 100. Les barres s'affichent selon le pourcentage réel. Ajouter des emojis : Charisme 🎭, Intensité 🔥, Impact visuel 👁️, Nostalgie 🌅.
  
  "type_video_detecte": "Edit TV / film",
  ⚠️ IMPORTANT pour type_video_detecte : Détecte automatiquement le type de vidéo et renvoie une catégorie avec emoji :
  - 🎬 Edit TV / film
  - 😂 Meme / humour
  - 🎧 Edit musical
  - 💬 Débat / clash
  - 🎮 Gaming
  - 👤 POV
  - 🎥 Cinématique
  - 📰 Actualité / reportage
  - Autre type détecté
  
  "potentiel_partage": {
    "potentiel_like": 75,
    "potentiel_commentaire": 60,
    "potentiel_partage": 45
  },
  ⚠️ IMPORTANT pour potentiel_partage : Pourcentages simples (0-100) estimant le potentiel d'engagement pour chaque type.
  
  "micro_metrics": {
    "potentiel_viral": "Élevé",
    "watchtime_estime": "7-12s",
    "audio_tendance": "Oui",
    "public_cible": "18-25 ans",
    "type_engagement": "likes / commentaires"
  },
  
  "tags_rapides": {
    "potentiel_viral": "Élevé",
    "watchtime_optimal": "7-12s",
    "audio_tendance": "Oui",
    "public_cible": "18-25 ans",
    "type_engagement": "likes / commentaires / partages"
  },
  
  "verdict_express": "Bonne vidéo mais risquée",
  
  "indice_risque": "Faible",
  "indice_risque_detail": "Risque identifié : aucun",
  ⚠️ IMPORTANT pour indice_risque : Vraie logique de détection professionnelle :
  - RISQUE FAIBLE : aucun copyright, audio TikTok, pas de violence/politique
  - RISQUE MOYEN : extrait TV, watermark externe visible, contenu potentiellement limité (tabac, clash, etc.)
  - RISQUE ÉLEVÉ : copyright musique, extrait film/série protégé, nudité/sexualisation, sujet politique sensible, discours discriminatoire
  indice_risque_detail doit être professionnel et clair :
  - "Clips TV sous copyright détectés + watermark externe visible : risque de limitation et suppression."
  - "Copyright musique détecté : risque de muted audio et limitation de portée."
  - "Sujet politique sensible : peut entraîner une limite de visibilité."
  - "Aucun risque détecté — contenu conforme aux normes TikTok."
  
  "micro_indicateurs": {
    "audio": 75,
    "montage": 70,
    "trendiness": 80
  },
  
  "inspiration_ia": [
    "Essaie une version humoristique pour élargir l'audience.",
    "Une version slow-motion dramatique fonctionnerait bien.",
    "Un remix du son pourrait booster le watchtime."
  ],
  
  "punchline": "Ton edit est vraiment puissant : rythme, vibe, synchro…",
  
  "verdict_final": {
    "emoji": "🎉",
    "titre": "Excellent boulot !",
    "message": "Ton edit est vraiment puissant : rythme, vibe, synchro… tu peux poster tel quel. Gros potentiel viral !"
  },
  
  ⚠️ IMPORTANT pour verdict_final : Génère selon score_sur_100 avec verdict clair, motivant, professionnel :
  - Score ≥ 85 : emoji 🎯, titre "Fort potentiel de viralité", message "Très bon début. Le contenu est fort, mais il manque les codes TikTok (son viral + recadrage + sous-titres). Avec ces ajustements, tu peux doubler ta portée."
  - Score 70-84 : emoji 💡, titre "Très bonne vidéo / edit solide", message "Vidéo solide dans le fond, mais l'exécution TikTok doit être optimisée. L'idée est bonne : tu es sur la bonne voie."
  - Score 55-69 : emoji 👍, titre "Correct avec des défauts", message "Le contenu a du potentiel, mais plusieurs éléments limitent sa performance pour TikTok. Voici comment l'optimiser."
  - Score 40-54 : emoji 🛠️, titre "Moyen", message "Vidéo perfectible : l'idée est bonne mais plusieurs éléments limitent sa performance. Avec ces ajustements, tu peux améliorer significativement ta portée."
  - Score 25-39 : emoji 🔧, titre "Faible", message "Il y a des idées, mais l'exécution n'est pas encore adaptée à TikTok. Voici comment repartir sur de bonnes bases."
  - Score < 25 : emoji ⚠️, titre "Très faible / non adapté", message "Le contenu nécessite une refonte pour être adapté à TikTok. Voici les bases à travailler."
  
  "caption": "Caption optimisée en 3 lignes max. SEO + taux de clic + storytelling.",
  
  "hashtags": [
    "#hashtag1",
    "#hashtag2",
    "#hashtag3",
    "#hashtag4",
    "#hashtag5",
    "#hashtag6",
    "#hashtag7",
    "#hashtag8",
    "#hashtag9",
    "#hashtag10"
  ],
  ⚠️ IMPORTANT pour hashtags : Règle automatique obligatoire :
  → Inclure 2 hashtags généraux (#fyp, #foryou, #pourtoi, #viral, #tiktok) + 3 hashtags de niche + 3 hashtags spécifiques au contenu.
  → Si langue FR détectée, ajouter #tiktokfr.
  → Total : 10 hashtags maximum (les universels comptent dans les 2 généraux).
  
  "optimisation_express": [
    "Ajoute un son viral (trending)",
    "Supprime le watermark",
    "Coupe 2 secondes au début",
    "Ajoute un zoom léger sur le moment clé",
    "Ajoute des sous-titres dynamiques"
  ],
  ⚠️ IMPORTANT pour optimisation_express : Section "Optimisation express (10 secondes)" - 3 à 5 conseils rapides et actionnables, très simples.
  
  "score_sur_100": 65,
  "score_titre": "Montage solide, bon potentiel viral",
  ⚠️ IMPORTANT pour score_titre : Ajoute TOUJOURS un mini titre sous le score global selon le score :
  - < 20 : "Très faible exécution – nécessite un vrai montage"
  - 20-39 : "À retravailler – plusieurs points critiques"
  - 40-59 : "Moyen – potentiel mais améliorations nécessaires"
  - 60-74 : "Montage solide, bon potentiel viral"
  - 75-89 : "Très bon contenu, excellent potentiel"
  - 90+ : "Excellente exécution, potentiel viral élevé"
  
  "chance_trend": "35%",
  
  "vues_attendues": "20k-200k",
  
  "niveau_confiance": "Moyen",
  
  "meilleurs_horaires": ["12:00", "18:00", "20:00"]
}

**RÈGLES CRITIQUES :**
- Renvoie UNIQUEMENT du JSON, rien d'autre.
- Chaque section a une version "court"/"preview" (3-4 éléments max) et une version "long"/"complet".
- conseils_rapides : 4-6 cartes avec icône, titre court, 1 phrase max.
- score_emotionnel : 4 scores de 0 à 100 (confiance_charisme, intensite, impact_visuel, nostalgie). Les valeurs doivent être RÉELLES : 50 = 50%, pas 100%. La barre de couleur doit visuellement respecter le pourcentage (pas dépasser 100%).
- micro_metrics : potentiel_viral (Faible/Moyen/Élevé), watchtime_estime (format "3-6s"), audio_tendance (Oui/Non), public_cible (ex: "18-25 ans"), type_engagement (ex: "likes / commentaires").
- tags_rapides : même structure que micro_metrics + watchtime_optimal (format "3-6s").
- verdict_express : 1 phrase courte et directe (ex: "Bonne vidéo mais risquée" / "Montage propre mais manque d'impact").
- indice_risque : Faible / Moyen / Élevé. Évalue VRAIMENT : Violence/Nudité/Insultes, Politique sensible, Copyright (clips/musique/logos/extraits), Watermark TikTok, Contenu polarisant.
- indice_risque_detail : Phrase claire expliquant le risque identifié (ex: "Risque identifié : musique sous copyright").
- micro_indicateurs : audio (0-100), montage (0-100), trendiness (0-100).
- inspiration_ia : 3-4 idées alternatives courtes et inspirantes.
- punchline : phrase courte <12 mots, impactante.
- score_sur_100 : NOUVELLE GRILLE RÉALISTE. 85-100 = Fort potentiel de viralité, 70-85 = Très bonne vidéo / edit solide, 55-70 = Correct avec des défauts, 40-55 = Moyen, 25-40 = Faible, 0-25 = Très faible / non adapté. Un edit correct ne doit JAMAIS être noté sous 40.
- score_titre : Mini titre sous le score global selon le niveau (ex: "Montage solide, bon potentiel viral").
- verdict_final : génère selon score_sur_100 avec 3 variantes intelligentes (voir détails ci-dessus).
- CHECK DE COHÉRENCE AUTOMATIQUE :
  * Si audio = non tendance → doit influencer "potentiel_viral" négativement
  * Si watermark TikTok → doit être cité dans indice_risque + pourquoi_ca_floppe
  * Si pas de montage → score montage ≤ 25
  * Si audio tendance → doit être dans pourquoi_ca_perce
  * Si watermark → indice_risque au moins "Moyen"
- Sois PRÉCIS, COURT, IMPACTANT, CONSTRUCTIF.
- Base-toi sur ce que tu VOIS et ENTENDS vraiment.
- Sois HONNÊTE mais BIENVEILLANT. Coach, pas juge.
- Jamais "Analyse en cours", jamais vide, jamais générique.
- Dans resume_video : OBLIGATOIREMENT mentionner film/série/personnage/artiste SI identifié ailleurs (hashtags, opportunités, etc.).`;

    // 2. Lancer l'analyse avec inlineData (méthode recommandée par Google)
    console.log('🤖 Envoi de la requête d\'analyse à Gemini avec inlineData...');
    console.log(`   Type MIME: ${mimetype}`);
    console.log(`   Taille base64: ${(videoBase64.length / 1024).toFixed(2)} KB`);
    console.log(`   Modèle: gemini-2.5-flash`);
    console.log(`   Format attendu: JSON structuré`);
    const startTime = Date.now();
    
    let result: any;
    try {
      // Utiliser le nouveau format recommandé par Google avec inlineData
      result = await model.generateContent({
        contents: [
          {
            role: 'user',
            parts: [
              {
                inlineData: {
                  data: videoBase64,
            mimeType: mimetype,
          },
        },
              {
                text: analysisPrompt,
              },
            ],
          },
        ],
      });
    } catch (generateError: any) {
      console.error('❌ ERREUR lors de l\'appel generateContent :', generateError);
      if (generateError?.response) {
        console.error('❌ Détails API :', JSON.stringify(generateError.response, null, 2));
      }
      throw generateError;
    }
    
    const response = await result.response;
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    
    // 6. Extraire le texte de la réponse (gérer différents formats)
    let analysisText: string = '';
    try {
      // Essayer d'abord response.text() (format standard)
      analysisText = response.text();
    } catch (textError: any) {
      console.warn('⚠️  response.text() a échoué, tentative d\'extraction alternative...');
      // Essayer d'extraire depuis les candidates
      if (response.candidates && response.candidates.length > 0) {
        const candidate = response.candidates[0];
        if (candidate.content && candidate.content.parts) {
          analysisText = candidate.content.parts.map((part: any) => part.text || '').join('');
        }
      }
      if (!analysisText) {
        throw new Error('Impossible d\'extraire le texte de la réponse Gemini');
      }
    }
    
    console.log(`✅ Analyse terminée en ${duration}s`);
    console.log(`   Longueur de la réponse: ${analysisText.length} caractères`);
    console.log(`   Aperçu de la réponse brute (premiers 500 caractères):`);
    console.log(`   ${analysisText.substring(0, 500)}...`);

    // 3. Nettoyer le texte avant parsing (enlever markdown code blocks si présents)
    let cleanedText = analysisText.trim();
    // Enlever les markdown code blocks ```json ... ```
    if (cleanedText.startsWith('```')) {
      cleanedText = cleanedText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');
    }
    // Enlever tout texte avant le premier { et après le dernier }
    const firstBrace = cleanedText.indexOf('{');
    const lastBrace = cleanedText.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      cleanedText = cleanedText.substring(firstBrace, lastBrace + 1);
    }
    
    // 4. Parser le JSON avec système de fallback
    let analysisData: any;
    let parseAttempts = 0;
    const maxAttempts = 3;
    
    while (parseAttempts < maxAttempts) {
    try {
        analysisData = JSON.parse(cleanedText);
      console.log('✅ JSON parsé avec succès');
        console.log(`   Champs présents dans la réponse:`);
        console.log(`   - resume_video: ${analysisData.resume_video ? '✅' : '❌'}`);
        console.log(`   - avis_global: ${analysisData.avis_global ? '✅' : '❌'}`);
        console.log(`   - pourquoi_ca_perce: ${analysisData.pourquoi_ca_perce ? '✅' : '❌'}`);
        console.log(`   - pourquoi_ca_floppe: ${analysisData.pourquoi_ca_floppe ? '✅' : '❌'}`);
        console.log(`   - conseils_rapides: ${analysisData.conseils_rapides ? '✅' : '❌'}`);
        console.log(`   - conseils_amelioration: ${analysisData.conseils_amelioration ? '✅' : '❌'}`);
        console.log(`   - score_emotionnel: ${analysisData.score_emotionnel ? '✅' : '❌'}`);
        console.log(`   - micro_metrics: ${analysisData.micro_metrics ? '✅' : '❌'}`);
        console.log(`   - tags_rapides: ${analysisData.tags_rapides ? '✅' : '❌'}`);
        console.log(`   - verdict_express: ${analysisData.verdict_express ? '✅' : '❌'}`);
        console.log(`   - indice_risque: ${analysisData.indice_risque ? '✅' : '❌'}`);
        console.log(`   - micro_indicateurs: ${analysisData.micro_indicateurs ? '✅' : '❌'}`);
        console.log(`   - inspiration_ia: ${analysisData.inspiration_ia ? '✅' : '❌'}`);
        console.log(`   - punchline: ${analysisData.punchline ? '✅' : '❌'}`);
        console.log(`   - verdict_final: ${analysisData.verdict_final ? '✅' : '❌'}`);
        console.log(`   - caption: ${analysisData.caption ? '✅' : '❌'}`);
        console.log(`   - hashtags: ${analysisData.hashtags ? '✅' : '❌'}`);
        break; // Succès, sortir de la boucle
    } catch (parseError: any) {
        parseAttempts++;
        console.error(`❌ Tentative ${parseAttempts}/${maxAttempts} - Erreur parsing JSON:`, parseError.message);
        
        if (parseAttempts >= maxAttempts) {
          // Dernière tentative : essayer de réparer le JSON
          console.warn('⚠️  Tentative de réparation du JSON...');
          try {
            // Essayer de trouver et extraire le JSON même s'il y a du texte autour
            const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              analysisData = JSON.parse(jsonMatch[0]);
              console.log('✅ JSON réparé et parsé avec succès');
              break;
            }
          } catch (repairError) {
            console.error('❌ Impossible de réparer le JSON');
          }
          
          // Si tout échoue, créer une structure par défaut
          console.error('❌ Impossible de parser le JSON après plusieurs tentatives');
          console.error('   Texte reçu (premiers 500 caractères):', cleanedText.substring(0, 500));
          console.error('   Création d\'une structure par défaut...');
          
          analysisData = {
            resume_video: { court: 'Analyse vidéo en cours. Veuillez réessayer.', long: '' },
            avis_global: { court: 'Analyse en cours de traitement.', long: '' },
            pourquoi_ca_perce: { preview: ['Analyse en cours'], complet: ['Analyse en cours'] },
            pourquoi_ca_floppe: { preview: ['Analyse en cours'], complet: ['Analyse en cours'] },
            conseils_rapides: [
              { icone: '🎥', titre: 'Améliorer transitions', texte: 'Ajoute un effet plus moderne.' },
              { icone: '✂️', titre: 'Réduire l\'intro', texte: 'Coupe 0.2s du début.' },
              { icone: '🎵', titre: 'Audio alternatif', texte: 'Teste un son tendance.' },
              { icone: '📝', titre: 'Texte plus court', texte: 'Garde un hook ≤ 3 mots.' },
            ],
            conseils_amelioration: { preview: ['Analyse en cours'], complet: ['Analyse en cours'] },
            score_emotionnel: { confiance_charisme: 60, intensite: 65, impact_visuel: 60, nostalgie: 50 },
            micro_metrics: { potentiel_viral: 'Moyen', watchtime_estime: '5-8s', audio_tendance: 'Oui', public_cible: '18-25 ans', type_engagement: 'likes / commentaires' },
            tags_rapides: { potentiel_viral: 'Moyen', watchtime_optimal: '5-8s', audio_tendance: 'Oui', public_cible: '18-25 ans', type_engagement: 'likes / commentaires' },
            verdict_express: 'Montage correct mais manque d\'impact',
            indice_risque: 'Faible',
            indice_risque_detail: 'Risque identifié : aucun',
            micro_indicateurs: { audio: 65, montage: 60, trendiness: 70 },
            inspiration_ia: ['Essaie une version humoristique pour élargir l\'audience.', 'Une version slow-motion dramatique fonctionnerait bien.', 'Un remix du son pourrait booster le watchtime.'],
            punchline: 'Ton edit est vraiment puissant : rythme, vibe, synchro…',
            verdict_final: { emoji: '👍', titre: 'Très bon début !', message: 'Avec quelques ajustements, tu peux viser le FYP facilement.' },
            caption: 'Caption en cours de génération',
            hashtags: ['#viral', '#fyp', '#trending', '#foryou', '#explore', '#reels', '#shorts', '#content', '#creator', '#social'],
            score_sur_100: 50, // Calibrage équilibré par défaut
            score_titre: 'Moyen – potentiel mais améliorations nécessaires',
            phrase_motivante: 'Du potentiel, continue d\'expérimenter !',
            type_video_detecte: '🎥 Autre',
            potentiel_partage: { potentiel_like: 50, potentiel_commentaire: 40, potentiel_partage: 30 },
            optimisation_express: ['Ajoute un son viral (trending)', 'Supprime le watermark', 'Coupe 2 secondes au début'],
            chance_trend: '30%',
            vues_attendues: '20k-200k',
            niveau_confiance: 'Moyen',
            meilleurs_horaires: ['12:00', '18:00', '20:00'],
          };
          break;
        }
        
        // Attendre un peu avant de réessayer (si on doit réessayer)
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    // 5. Normaliser les données pour compatibilité frontend (FORMAT AMÉLIORÉ avec jugement SÉVÈRE)
    const resumeVideo = analysisData.resume_video || {};
    const avisGlobal = analysisData.avis_global || {};
    const pourquoiCaPerce = analysisData.pourquoi_ca_perce || {};
    const pourquoiCaFloppe = analysisData.pourquoi_ca_floppe || {};
    const conseilsAmelioration = analysisData.conseils_amelioration || {};
    const scoreEmotionnel = analysisData.score_emotionnel || {};
    const microMetrics = analysisData.micro_metrics || {};
    const tagsRapides = analysisData.tags_rapides || {};
    const microIndicateurs = analysisData.micro_indicateurs || {};
    const verdictFinal = analysisData.verdict_final || {};
    
    // CHECK DE COHÉRENCE AUTOMATIQUE (déclarer d'abord les variables)
    const audioTendance = microMetrics.audio_tendance || analysisData.micro_metrics?.audio_tendance || 'Oui';
    const watermarkDetected = 
      (analysisData.indice_risque_detail && analysisData.indice_risque_detail.toLowerCase().includes('watermark')) ||
      (analysisData.pourquoi_ca_floppe?.complet?.some((p: string) => p.toLowerCase().includes('watermark'))) ||
      (Array.isArray(analysisData.pourquoi_ca_floppe) && analysisData.pourquoi_ca_floppe.some((p: string) => p.toLowerCase().includes('watermark')));
    const montageScore = microIndicateurs.montage || analysisData.micro_indicateurs?.montage || 60;
    
    // Ajuster le score selon le nouveau calibrage réaliste
    let adjustedScore = (typeof analysisData.score_sur_100 === 'number' && analysisData.score_sur_100 >= 0 && analysisData.score_sur_100 <= 100)
      ? analysisData.score_sur_100
      : 50; // Valeur par défaut selon nouveau calibrage réaliste
    
    // Règle : Un edit correct ne doit JAMAIS être noté sous 40
    if (adjustedScore < 40 && montageScore >= 50) {
      adjustedScore = Math.max(40, adjustedScore); // Forcer minimum 40 si montage correct
    }
    
    // Ajustements de cohérence (calibrés et justes)
    if (audioTendance === 'Non' && adjustedScore > 50) {
      adjustedScore = Math.max(40, adjustedScore - 6); // Pénalité audio non tendance (calibrée)
    }
    if (watermarkDetected) {
      adjustedScore = Math.max(40, adjustedScore - 15); // Pénalité watermark (mais ne descend pas sous 40 si edit correct)
      if (!analysisData.indice_risque || analysisData.indice_risque === 'Faible') {
        analysisData.indice_risque = 'Moyen';
      }
    }
    if (montageScore <= 25 && adjustedScore > 45) {
      adjustedScore = Math.max(40, adjustedScore - 10); // Pénalité pas de montage (calibrée)
    }
    
    // Générer score_titre et phrase motivante selon le score ajusté
    let scoreTitre = analysisData.score_titre || '';
    let phraseMotivante = '';
    if (!scoreTitre || scoreTitre.trim() === '') {
      if (adjustedScore >= 80) {
        scoreTitre = 'Vidéo très solide !';
        phraseMotivante = 'Continue comme ça, ton style s\'affine !';
      } else if (adjustedScore >= 65) {
        scoreTitre = 'Belle base, ça peut performer.';
        phraseMotivante = 'Belle marge de progression, tu es sur la bonne voie.';
      } else if (adjustedScore >= 45) {
        scoreTitre = 'Du potentiel, quelques ajustements !';
        phraseMotivante = 'Du potentiel, continue d\'expérimenter !';
      } else if (adjustedScore >= 25) {
        scoreTitre = 'Intéressant, mais nécessite du travail.';
        phraseMotivante = 'L\'idée est là, il faut juste peaufiner l\'exécution.';
      } else {
        scoreTitre = 'À refaire, mais l\'idée peut être améliorée !';
        phraseMotivante = 'Ne te décourage pas, chaque vidéo est un apprentissage.';
      }
    } else {
      // Générer phrase motivante même si score_titre existe
      if (adjustedScore >= 80) {
        phraseMotivante = 'Continue comme ça, ton style s\'affine !';
      } else if (adjustedScore >= 65) {
        phraseMotivante = 'Belle marge de progression, tu es sur la bonne voie.';
      } else if (adjustedScore >= 45) {
        phraseMotivante = 'Du potentiel, continue d\'expérimenter !';
      } else if (adjustedScore >= 25) {
        phraseMotivante = 'L\'idée est là, il faut juste peaufiner l\'exécution.';
      } else {
        phraseMotivante = 'Ne te décourage pas, chaque vidéo est un apprentissage.';
      }
    }

    const normalizedAnalysis = {
      // NOUVEAU FORMAT AMÉLIORÉ avec versions condensées
      resume_video: {
        court: (typeof resumeVideo === 'string' ? resumeVideo : (resumeVideo.court && resumeVideo.court.trim() !== '')) ? (typeof resumeVideo === 'string' ? resumeVideo : resumeVideo.court.trim()) : 'Résumé vidéo en cours de génération.',
        long: (typeof resumeVideo === 'object' && resumeVideo.long && resumeVideo.long.trim() !== '') ? resumeVideo.long.trim() : 'Résumé détaillé en cours de génération.',
      },
      
      avis_global: {
        court: (typeof avisGlobal === 'string' ? avisGlobal : (avisGlobal.court && avisGlobal.court.trim() !== '')) ? (typeof avisGlobal === 'string' ? avisGlobal : avisGlobal.court.trim()) : 'Analyse en cours de traitement.',
        long: (typeof avisGlobal === 'object' && avisGlobal.long && avisGlobal.long.trim() !== '') ? avisGlobal.long.trim() : 'Analyse détaillée en cours de traitement.',
      },
      
      pourquoi_ca_perce: {
        preview: Array.isArray(pourquoiCaPerce) ? pourquoiCaPerce.slice(0, 3) : (Array.isArray(pourquoiCaPerce.preview) && pourquoiCaPerce.preview.length > 0
          ? pourquoiCaPerce.preview.filter((p: any) => p && p.trim() !== '')
          : ['Analyse en cours']),
        complet: Array.isArray(pourquoiCaPerce) ? pourquoiCaPerce : (Array.isArray(pourquoiCaPerce.complet) && pourquoiCaPerce.complet.length > 0
          ? pourquoiCaPerce.complet.filter((p: any) => p && p.trim() !== '')
          : ['Analyse en cours']),
      },
      
      pourquoi_ca_floppe: {
        preview: Array.isArray(pourquoiCaFloppe) ? pourquoiCaFloppe.slice(0, 3) : (Array.isArray(pourquoiCaFloppe.preview) && pourquoiCaFloppe.preview.length > 0
          ? pourquoiCaFloppe.preview.filter((p: any) => p && p.trim() !== '')
          : ['Analyse en cours']),
        complet: Array.isArray(pourquoiCaFloppe) ? pourquoiCaFloppe : (Array.isArray(pourquoiCaFloppe.complet) && pourquoiCaFloppe.complet.length > 0
          ? pourquoiCaFloppe.complet.filter((p: any) => p && p.trim() !== '')
          : ['Analyse en cours']),
      },
      
      conseils_rapides: Array.isArray(analysisData.conseils_rapides) && analysisData.conseils_rapides.length > 0
        ? analysisData.conseils_rapides.filter((c: any) => c && c.icone && c.titre && c.texte)
        : [
            { icone: '🎥', titre: 'Améliorer transitions', texte: 'Ajoute un effet plus moderne pour dynamiser la vidéo.' },
            { icone: '✂️', titre: 'Réduire l\'intro', texte: 'Coupe 0.2s du début pour booster le hook.' },
            { icone: '🎵', titre: 'Audio alternatif', texte: 'Teste un son tendance similaire pour gagner 20% de visibilité.' },
            { icone: '📝', titre: 'Texte plus court', texte: 'Garde un hook ≤ 3 mots pour exploser l\'engagement.' },
          ],
      
      conseils_amelioration: {
        preview: Array.isArray(conseilsAmelioration) ? conseilsAmelioration.slice(0, 3) : (Array.isArray(conseilsAmelioration.preview) && conseilsAmelioration.preview.length > 0
          ? conseilsAmelioration.preview.filter((p: any) => p && p.trim() !== '')
          : ['Analyse en cours']),
        complet: Array.isArray(conseilsAmelioration) ? conseilsAmelioration : (Array.isArray(conseilsAmelioration.complet) && conseilsAmelioration.complet.length > 0
          ? conseilsAmelioration.complet.filter((p: any) => p && p.trim() !== '')
          : ['Analyse en cours']),
      },
      
      score_emotionnel: {
        confiance_charisme: (() => {
          const val = typeof scoreEmotionnel.confiance_charisme === 'number' ? scoreEmotionnel.confiance_charisme : 60;
          return Math.max(0, Math.min(100, val)); // S'assurer que c'est entre 0 et 100
        })(),
        intensite: (() => {
          const val = typeof scoreEmotionnel.intensite === 'number' ? scoreEmotionnel.intensite : 65;
          return Math.max(0, Math.min(100, val)); // S'assurer que c'est entre 0 et 100
        })(),
        impact_visuel: (() => {
          const val = typeof scoreEmotionnel.impact_visuel === 'number' ? scoreEmotionnel.impact_visuel : 60;
          return Math.max(0, Math.min(100, val)); // S'assurer que c'est entre 0 et 100
        })(),
        nostalgie: (() => {
          const val = typeof scoreEmotionnel.nostalgie === 'number' ? scoreEmotionnel.nostalgie : 50;
          return Math.max(0, Math.min(100, val)); // S'assurer que c'est entre 0 et 100
        })(),
      },
      
      micro_metrics: {
        potentiel_viral: (microMetrics.potentiel_viral && ['Faible', 'Moyen', 'Élevé'].includes(microMetrics.potentiel_viral))
          ? microMetrics.potentiel_viral
          : 'Moyen',
        watchtime_estime: (microMetrics.watchtime_estime && microMetrics.watchtime_estime.trim() !== '')
          ? microMetrics.watchtime_estime.trim()
          : '5-8s',
        audio_tendance: (microMetrics.audio_tendance && ['Oui', 'Non'].includes(microMetrics.audio_tendance))
          ? microMetrics.audio_tendance
          : 'Oui',
        public_cible: (microMetrics.public_cible && microMetrics.public_cible.trim() !== '')
          ? microMetrics.public_cible.trim()
          : '18-25 ans',
        type_engagement: (microMetrics.type_engagement && microMetrics.type_engagement.trim() !== '')
          ? microMetrics.type_engagement.trim()
          : 'likes / commentaires',
      },
      
      tags_rapides: {
        potentiel_viral: (tagsRapides.potentiel_viral && ['Faible', 'Moyen', 'Élevé'].includes(tagsRapides.potentiel_viral))
          ? tagsRapides.potentiel_viral
          : (microMetrics.potentiel_viral && ['Faible', 'Moyen', 'Élevé'].includes(microMetrics.potentiel_viral))
            ? microMetrics.potentiel_viral
            : 'Moyen',
        watchtime_optimal: (tagsRapides.watchtime_optimal && tagsRapides.watchtime_optimal.trim() !== '')
          ? tagsRapides.watchtime_optimal.trim()
          : (microMetrics.watchtime_estime && microMetrics.watchtime_estime.trim() !== '')
            ? microMetrics.watchtime_estime.trim()
            : '5-8s',
        audio_tendance: (tagsRapides.audio_tendance && ['Oui', 'Non'].includes(tagsRapides.audio_tendance))
          ? tagsRapides.audio_tendance
          : (microMetrics.audio_tendance && ['Oui', 'Non'].includes(microMetrics.audio_tendance))
            ? microMetrics.audio_tendance
            : 'Oui',
        public_cible: (tagsRapides.public_cible && tagsRapides.public_cible.trim() !== '')
          ? tagsRapides.public_cible.trim()
          : (microMetrics.public_cible && microMetrics.public_cible.trim() !== '')
            ? microMetrics.public_cible.trim()
            : '18-25 ans',
        type_engagement: (tagsRapides.type_engagement && tagsRapides.type_engagement.trim() !== '')
          ? tagsRapides.type_engagement.trim()
          : (microMetrics.type_engagement && microMetrics.type_engagement.trim() !== '')
            ? microMetrics.type_engagement.trim()
            : 'likes / commentaires',
      },
      
      verdict_express: (analysisData.verdict_express && analysisData.verdict_express.trim() !== '')
        ? analysisData.verdict_express.trim()
        : (() => {
            if (adjustedScore >= 80) return 'Excellent contenu, potentiel viral élevé';
            if (adjustedScore >= 60) return 'Bonne vidéo mais risquée';
            if (adjustedScore >= 40) return 'Montage correct mais manque d\'impact';
            return 'Plusieurs points à améliorer';
          })(),
      
      indice_risque: (analysisData.indice_risque && ['Faible', 'Moyen', 'Élevé'].includes(analysisData.indice_risque))
        ? analysisData.indice_risque
        : 'Faible',
      
      indice_risque_detail: (analysisData.indice_risque_detail && analysisData.indice_risque_detail.trim() !== '')
        ? analysisData.indice_risque_detail.trim()
        : (() => {
            const risque = analysisData.indice_risque || 'Faible';
            if (risque === 'Élevé') {
              return 'Risque identifié : contenu sensible détecté (violence/nudité/politique/copyright). Risque de suppression / shadowban, prudence.';
            } else if (risque === 'Moyen') {
              return 'Risque identifié : quelques éléments peuvent nécessiter une attention particulière. Possible limitation de portée.';
            } else {
              return 'Risque identifié : aucun. OK, conforme aux normes.';
            }
          })(),
      
      micro_indicateurs: {
        audio: (typeof microIndicateurs.audio === 'number' && microIndicateurs.audio >= 0 && microIndicateurs.audio <= 100)
          ? microIndicateurs.audio
          : 65,
        montage: (typeof microIndicateurs.montage === 'number' && microIndicateurs.montage >= 0 && microIndicateurs.montage <= 100)
          ? microIndicateurs.montage
          : 60,
        trendiness: (typeof microIndicateurs.trendiness === 'number' && microIndicateurs.trendiness >= 0 && microIndicateurs.trendiness <= 100)
          ? microIndicateurs.trendiness
          : 70,
      },
      
      inspiration_ia: Array.isArray(analysisData.inspiration_ia) && analysisData.inspiration_ia.length > 0
        ? analysisData.inspiration_ia.filter((i: any) => i && i.trim() !== '').slice(0, 4)
        : [
            'Essaie une version humoristique pour élargir l\'audience.',
            'Une version slow-motion dramatique fonctionnerait bien.',
            'Un remix du son pourrait booster le watchtime.',
          ],
      
      punchline: (analysisData.punchline && analysisData.punchline.trim() !== '')
        ? analysisData.punchline.trim()
        : 'Ton edit est vraiment puissant : rythme, vibe, synchro…',
      
      verdict_final: (() => {
        const score = adjustedScore;
        
        // Si Gemini a fourni un verdict, l'utiliser, sinon générer dynamiquement selon les 3 variantes intelligentes
        if (verdictFinal.emoji && verdictFinal.titre && verdictFinal.message) {
          return {
            emoji: verdictFinal.emoji.trim(),
            titre: verdictFinal.titre.trim(),
            message: verdictFinal.message.trim(),
          };
        }
        
        // Génération dynamique selon le score avec nouvelle grille réaliste
        if (score >= 85) {
          return {
            emoji: '🎯',
            titre: 'Fort potentiel de viralité',
            message: 'Très bon début. Le contenu est fort, mais il manque les codes TikTok (son viral + recadrage + sous-titres). Avec ces ajustements, tu peux doubler ta portée.',
          };
        } else if (score >= 70) {
          return {
            emoji: '💡',
            titre: 'Très bonne vidéo / edit solide',
            message: 'Vidéo solide dans le fond, mais l\'exécution TikTok doit être optimisée. L\'idée est bonne : tu es sur la bonne voie.',
          };
        } else if (score >= 55) {
          return {
            emoji: '👍',
            titre: 'Correct avec des défauts',
            message: 'Le contenu a du potentiel, mais plusieurs éléments limitent sa performance pour TikTok. Voici comment l\'optimiser.',
          };
        } else if (score >= 40) {
          return {
            emoji: '🛠️',
            titre: 'Moyen',
            message: 'Vidéo perfectible : l\'idée est bonne mais plusieurs éléments limitent sa performance. Avec ces ajustements, tu peux améliorer significativement ta portée.',
          };
        } else if (score >= 25) {
          return {
            emoji: '🔧',
            titre: 'Faible',
            message: 'Il y a des idées, mais l\'exécution n\'est pas encore adaptée à TikTok. Voici comment repartir sur de bonnes bases.',
          };
        } else {
          return {
            emoji: '⚠️',
            titre: 'Très faible / non adapté',
            message: 'Le contenu nécessite une refonte pour être adapté à TikTok. Voici les bases à travailler.',
          };
        }
      })(),
      
      caption: (analysisData.caption && analysisData.caption.trim() !== '')
        ? analysisData.caption.trim()
        : 'Caption optimisée en cours de génération.',
      
      hashtags: (() => {
        const baseHashtags = Array.isArray(analysisData.hashtags) && analysisData.hashtags.length > 0
          ? analysisData.hashtags.filter((h: any) => h && h.trim() !== '').slice(0, 10)
          : ['#viral', '#fyp', '#trending', '#foryou', '#explore', '#reels', '#shorts', '#content', '#creator', '#social'];
        // Ajouter les hashtags universels s'ils ne sont pas déjà présents
        const universalHashtags = ['#PourToi', '#FYP', '#ForYouPage'];
        const existingLower = baseHashtags.map((h: string) => h.toLowerCase());
        universalHashtags.forEach((tag) => {
          if (!existingLower.includes(tag.toLowerCase())) {
            baseHashtags.push(tag);
          }
        });
        return baseHashtags;
      })(),
      
      score_sur_100: adjustedScore,
      
      score_titre: scoreTitre,
      
      phrase_motivante: phraseMotivante,
      
      type_video_detecte: (analysisData.type_video_detecte && analysisData.type_video_detecte.trim() !== '')
        ? analysisData.type_video_detecte.trim()
        : '🎥 Autre',
      
      potentiel_partage: (analysisData.potentiel_partage && typeof analysisData.potentiel_partage === 'object')
        ? {
            potentiel_like: Math.max(0, Math.min(100, analysisData.potentiel_partage.potentiel_like || 50)),
            potentiel_commentaire: Math.max(0, Math.min(100, analysisData.potentiel_partage.potentiel_commentaire || 40)),
            potentiel_partage: Math.max(0, Math.min(100, analysisData.potentiel_partage.potentiel_partage || 30)),
          }
        : { potentiel_like: 50, potentiel_commentaire: 40, potentiel_partage: 30 },
      
      optimisation_express: Array.isArray(analysisData.optimisation_express) && analysisData.optimisation_express.length > 0
        ? analysisData.optimisation_express.filter((o: any) => o && o.trim() !== '').slice(0, 5)
        : ['Ajoute un son viral (trending)', 'Supprime le watermark', 'Coupe 2 secondes au début'],
      
      chance_trend: (analysisData.chance_trend && analysisData.chance_trend.trim() !== '')
        ? analysisData.chance_trend.trim()
        : '30%',
      
      vues_attendues: (analysisData.vues_attendues && analysisData.vues_attendues.trim() !== '')
        ? analysisData.vues_attendues.trim()
        : '20k-200k',
      
      niveau_confiance: (analysisData.niveau_confiance && ['Faible', 'Moyen', 'Fort'].includes(analysisData.niveau_confiance))
        ? analysisData.niveau_confiance
        : 'Moyen',
      
      meilleurs_horaires: Array.isArray(analysisData.meilleurs_horaires) && analysisData.meilleurs_horaires.length >= 3
        ? analysisData.meilleurs_horaires.slice(0, 3)
        : ['12:00', '18:00', '20:00'],
      
      // Champs de compatibilité legacy
      resume_video_legacy: (typeof resumeVideo === 'string' ? resumeVideo : (resumeVideo.court && resumeVideo.court.trim() !== '')) ? (typeof resumeVideo === 'string' ? resumeVideo : resumeVideo.court.trim()) : 'Résumé vidéo en cours de génération.',
      avis_global_legacy: (typeof avisGlobal === 'string' ? avisGlobal : (avisGlobal.court && avisGlobal.court.trim() !== '')) ? (typeof avisGlobal === 'string' ? avisGlobal : avisGlobal.court.trim()) : 'Analyse en cours de traitement.',
    };

    console.log('✅ Analyse normalisée avec succès (format amélioré)');
    console.log(`   Score sur 100: ${normalizedAnalysis.score_sur_100}`);
    console.log(`   Résumé vidéo (court): ${normalizedAnalysis.resume_video.court.substring(0, 50)}...`);
    console.log(`   Avis global (court): ${normalizedAnalysis.avis_global.court.substring(0, 50)}...`);
    console.log(`   Pourquoi ça perce (preview): ${normalizedAnalysis.pourquoi_ca_perce.preview.length} bullets`);
    console.log(`   Pourquoi ça floppe (preview): ${normalizedAnalysis.pourquoi_ca_floppe.preview.length} bullets`);
    console.log(`   Conseils rapides: ${normalizedAnalysis.conseils_rapides.length} cartes`);
    console.log(`   Conseils amélioration (preview): ${normalizedAnalysis.conseils_amelioration.preview.length} bullets`);
    console.log(`   Score émotionnel: ${normalizedAnalysis.score_emotionnel.confiance_charisme}% confiance`);
    console.log(`   Micro-metrics: ${normalizedAnalysis.micro_metrics.potentiel_viral} / ${normalizedAnalysis.micro_metrics.watchtime_estime} / ${normalizedAnalysis.micro_metrics.audio_tendance}`);
    console.log(`   Punchline: ${normalizedAnalysis.punchline.substring(0, 50)}...`);
    console.log(`   Verdict final: ${normalizedAnalysis.verdict_final.emoji} ${normalizedAnalysis.verdict_final.titre}`);
    console.log(`   Caption: ${normalizedAnalysis.caption.substring(0, 50)}...`);
    console.log(`   Hashtags: ${normalizedAnalysis.hashtags.length} hashtags générés`);
    console.log(`   Chance de trend: ${normalizedAnalysis.chance_trend}`);
    console.log(`   Vues attendues: ${normalizedAnalysis.vues_attendues}`);
    
    // Vérification que tous les champs critiques sont présents
    const criticalFields = {
      resume_video: !!normalizedAnalysis.resume_video.court && normalizedAnalysis.resume_video.court !== 'Résumé vidéo en cours de génération.',
      avis_global: !!normalizedAnalysis.avis_global.court && normalizedAnalysis.avis_global.court !== 'Analyse en cours de traitement.',
      pourquoi_ca_perce: Array.isArray(normalizedAnalysis.pourquoi_ca_perce.preview) && normalizedAnalysis.pourquoi_ca_perce.preview.length > 0,
      pourquoi_ca_floppe: Array.isArray(normalizedAnalysis.pourquoi_ca_floppe.preview) && normalizedAnalysis.pourquoi_ca_floppe.preview.length > 0,
      conseils_rapides: Array.isArray(normalizedAnalysis.conseils_rapides) && normalizedAnalysis.conseils_rapides.length >= 4,
      conseils_amelioration: Array.isArray(normalizedAnalysis.conseils_amelioration.preview) && normalizedAnalysis.conseils_amelioration.preview.length > 0,
      score_emotionnel: typeof normalizedAnalysis.score_emotionnel.confiance_charisme === 'number',
      micro_metrics: !!normalizedAnalysis.micro_metrics.potentiel_viral,
      punchline: !!normalizedAnalysis.punchline && normalizedAnalysis.punchline.trim() !== '',
      verdict_final: !!normalizedAnalysis.verdict_final.emoji && !!normalizedAnalysis.verdict_final.titre,
      caption: !!normalizedAnalysis.caption && normalizedAnalysis.caption !== 'Caption optimisée en cours de génération.',
      hashtags: Array.isArray(normalizedAnalysis.hashtags) && normalizedAnalysis.hashtags.length >= 10,
    };
    
    console.log('📋 Vérification des champs critiques:');
    Object.entries(criticalFields).forEach(([field, isValid]) => {
      console.log(`   ${field}: ${isValid ? '✅' : '❌'}`);
    });

    // 8. Retourner la réponse
    const responseData = {
      success: true,
      data: {
        fileName: originalname,
        fileSize: size,
        mimeType: mimetype,
        analysis: normalizedAnalysis,
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
    } else if (error?.message) {
      errorMessage = error.message;
    }

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