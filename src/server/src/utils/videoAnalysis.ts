import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import { GoogleAIFileManager } from '@google/generative-ai/server';
import { env } from '../env';

export interface VideoMetadata {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

export interface VideoAnalysisResult {
  // A. Description complète
  description: {
    resume: string;
    ambiance: string;
    ton: string;
    emotions: string[];
    sujetPrincipal: string;
    personnes: string[];
    contexte: string;
    structureNarrative: string;
  };
  
  // B. Analyse technique
  analyseTechnique: {
    qualiteHook: number; // 0-100
    rythme: string;
    luminosite: string;
    contraste: string;
    cadrage: string;
    lisibiliteTexte: string;
    sousTitres: string;
    musique: {
      type: string;
      mood: string;
    };
  };
  
  // C. Analyse algorithmique
  analyseAlgorithmique: {
    potentielViralite: number; // 0-100
    raisonsPrincipales: string[];
    pointsFaibles: string[];
    recommandations: string[];
  };
  
  // D. Extraction automatique
  extraction: {
    hashtags: string[];
    niche: string;
    motsCles: string[];
    styleVideo: string; // storytime, facecam, montage rapide, etc.
  };
  
  // E. Conseils personnalisés
  conseils: {
    ameliorerHook: string[];
    augmenterRetention: string[];
    suggestionsMontage: string[];
    recommandationFormat: string;
    nouvelleVersionScript: string;
  };
  
  // Champs de compatibilité
  potentielViral: number;
  pointsForts: string[];
  ameliorations: string[];
  planningSuggeré: string[];
  publicCible: string;
  tendances: string[];
}

/**
 * Génère une analyse complète d'une vidéo en utilisant Gemini AI
 * Utilise GoogleAIFileManager pour uploader la vidéo au lieu de Base64 (meilleur pour les grosses vidéos)
 */
export async function generateVideoAnalysis(
  model: GenerativeModel,
  videoMetadata: VideoMetadata,
  genAI: GoogleGenerativeAI
): Promise<VideoAnalysisResult> {
  const { originalname, mimetype, size, buffer } = videoMetadata;
  const fileExtension = originalname.split('.').pop()?.toLowerCase() || 'mp4';
  
  // Créer le prompt complet et structuré
  const prompt = createAnalysisPrompt(originalname, mimetype, size, fileExtension);
  
  console.log('🤖 Préparation de l\'analyse vidéo...');
  console.log(`   Fichier: ${originalname}`);
  console.log(`   Taille: ${(size / 1024 / 1024).toFixed(2)} MB`);
  console.log(`   Type MIME: ${mimetype}`);
  console.log(`   Extension: ${fileExtension}`);
  
  const startTime = Date.now();
  let uploadedFileUri: string | null = null;
  
  try {
    // VÉRIFICATION DE L'IMPLÉMENTATION VIDÉO - Utiliser FileManager pour les vidéos
    // Les vidéos > 20MB doivent être uploadées via FileManager au lieu de Base64
    const useFileManager = size > 20 * 1024 * 1024; // 20MB threshold
    
    if (useFileManager) {
      console.log('📤 Vidéo > 20MB détectée - Utilisation du FileManager pour upload...');
      
      try {
        // Créer une instance du FileManager avec l'API key
        // Note: GoogleAIFileManager nécessite l'API key, pas l'instance genAI
        const apiKey = env.GEMINI_API_KEY || (genAI as any).apiKey || '';
        if (!apiKey) {
          throw new Error('GEMINI_API_KEY non disponible pour initialiser le FileManager');
        }
        const fileManager = new GoogleAIFileManager(apiKey);
        
        // Uploader la vidéo via FileManager
        const uploadResult = await fileManager.uploadFile(buffer, {
          mimeType: mimetype,
          displayName: originalname,
        });
        
        uploadedFileUri = uploadResult.file.uri;
        console.log('✅ Vidéo uploadée avec succès via FileManager');
        console.log(`   URI du fichier: ${uploadedFileUri}`);
        
        // Préparer les données vidéo avec l'URI du fichier
        const videoData = {
          fileData: {
            fileUri: uploadedFileUri,
            mimeType: mimetype,
          },
        };
        
        // Envoyer la requête à Gemini avec l'URI du fichier
        console.log('🤖 Envoi de la requête à Gemini avec URI du fichier...');
        const result = await model.generateContent([prompt, videoData]);
        const response = await result.response;
        let analysisText = response.text();
        
        const duration = ((Date.now() - startTime) / 1000).toFixed(2);
        console.log(`✅ Réponse Gemini reçue en ${duration}s`);
        console.log(`   Longueur de la réponse: ${analysisText.length} caractères`);
        
        // Nettoyer la réponse (enlever les blocs markdown si présents)
        analysisText = analysisText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        
        // Parser le JSON
        let analysisData: any;
        try {
          analysisData = JSON.parse(analysisText);
          console.log('✅ JSON parsé avec succès');
        } catch (parseError) {
          console.error('❌ Erreur lors du parsing JSON');
          console.error('   Erreur:', parseError);
          console.error('   Aperçu de la réponse (500 premiers caractères):', analysisText.substring(0, 500));
          
          // Essayer d'extraire le JSON du texte
          const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            console.log('   Tentative d\'extraction du JSON...');
            try {
              analysisData = JSON.parse(jsonMatch[0]);
              console.log('✅ JSON extrait et parsé avec succès');
            } catch (extractError) {
              console.error('❌ Échec du parsing du JSON extrait:', extractError);
              throw new Error(`Impossible de parser la réponse JSON de Gemini. Réponse: ${analysisText.substring(0, 300)}...`);
            }
          } else {
            throw new Error(`La réponse de Gemini n'est pas au format JSON valide. Réponse: ${analysisText.substring(0, 300)}...`);
          }
        }
        
        // Normaliser et valider les données
        return normalizeAnalysisResult(analysisData);
        
      } catch (fileManagerError: any) {
        console.error('❌ Erreur lors de l\'upload via FileManager');
        console.error('   Type d\'erreur:', fileManagerError?.constructor?.name || 'Unknown');
        console.error('   Message:', fileManagerError?.message || 'No message');
        console.error('   Stack:', fileManagerError?.stack || 'No stack trace');
        console.error('   Cause:', fileManagerError?.cause || 'No cause');
        
        if (fileManagerError?.response) {
          console.error('   Response:', JSON.stringify(fileManagerError.response, null, 2));
        }
        if (fileManagerError?.status) {
          console.error('   Status:', fileManagerError.status);
        }
        
        // Fallback vers Base64 si le FileManager échoue
        console.log('⚠️  Fallback vers Base64 (méthode inlineData)...');
        // Continue avec la méthode Base64 ci-dessous
      }
    }
    
    // Méthode Base64 pour les petites vidéos ou en cas d'échec du FileManager
    console.log('📤 Utilisation de la méthode Base64 (inlineData)...');
    const videoBase64 = buffer.toString('base64');
    
    // Préparer les données vidéo pour Gemini
    const videoData = {
      inlineData: {
        data: videoBase64,
        mimeType: mimetype,
      },
    };
    
    console.log('🤖 Envoi de la requête à Gemini avec Base64...');
    
    // Envoyer la requête à Gemini
    const result = await model.generateContent([prompt, videoData]);
    const response = await result.response;
    let analysisText = response.text();
    
        const duration = ((Date.now() - startTime) / 1000).toFixed(2);
        console.log(`✅ Réponse Gemini reçue en ${duration}s`);
        console.log(`   Longueur de la réponse: ${analysisText.length} caractères`);
        
        // Nettoyer la réponse (enlever les blocs markdown si présents)
        analysisText = analysisText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        
        // Parser le JSON
        let analysisData: any;
        try {
          analysisData = JSON.parse(analysisText);
          console.log('✅ JSON parsé avec succès');
        } catch (parseError) {
          console.error('❌ Erreur lors du parsing JSON');
          console.error('   Erreur:', parseError);
          console.error('   Aperçu de la réponse (500 premiers caractères):', analysisText.substring(0, 500));
          
          // Essayer d'extraire le JSON du texte
          const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            console.log('   Tentative d\'extraction du JSON...');
            try {
              analysisData = JSON.parse(jsonMatch[0]);
              console.log('✅ JSON extrait et parsé avec succès');
            } catch (extractError) {
              console.error('❌ Échec du parsing du JSON extrait:', extractError);
              throw new Error(`Impossible de parser la réponse JSON de Gemini. Réponse: ${analysisText.substring(0, 300)}...`);
            }
          } else {
            throw new Error(`La réponse de Gemini n'est pas au format JSON valide. Réponse: ${analysisText.substring(0, 300)}...`);
          }
        }
        
        // Normaliser et valider les données
        return normalizeAnalysisResult(analysisData);
        
  } catch (error: any) {
    // AMÉLIORATION DU DEBUG - Affichage complet des détails de l'erreur
    console.error('❌ ========== ERREUR LORS DE L\'ANALYSE GEMINI ==========');
    console.error('❌ Type d\'erreur:', error?.constructor?.name || 'Unknown');
    console.error('❌ Message d\'erreur:', error?.message || 'No message');
    console.error('❌ Cause de l\'erreur:', error?.cause || 'No cause');
    console.error('❌ Stack trace:', error?.stack || 'No stack trace');
    
    // Vérifier si c'est une erreur GoogleGenerativeAIError
    if (error?.response) {
      console.error('❌ Response de l\'erreur:', JSON.stringify(error.response, null, 2));
    }
    if (error?.status) {
      console.error('❌ Status HTTP:', error.status);
    }
    if (error?.statusCode) {
      console.error('❌ Status Code:', error.statusCode);
    }
    if (error?.code) {
      console.error('❌ Error Code:', error.code);
    }
    
    // Vérifier les propriétés spécifiques de GoogleGenerativeAIError
    if (error?.name === 'GoogleGenerativeAIError' || error?.constructor?.name === 'GoogleGenerativeAIError') {
      console.error('❌ Erreur GoogleGenerativeAI détectée');
      console.error('❌ Error code:', error?.code || 'No code');
      console.error('❌ Error status:', error?.status || 'No status');
      console.error('❌ Error response:', error?.response || 'No response');
    }
    
    // Afficher toutes les propriétés de l'erreur pour debug
    console.error('❌ Toutes les propriétés de l\'erreur:', Object.keys(error || {}));
    try {
      console.error('❌ Erreur complète (JSON):', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
    } catch (jsonError) {
      console.error('❌ Impossible de sérialiser l\'erreur en JSON:', jsonError);
    }
    console.error('❌ ====================================================');
    
    // Vérifier les types d'erreurs spécifiques
    if (error?.message?.includes('API key') || error?.message?.includes('401')) {
      throw new Error('Clé API Gemini invalide ou manquante');
    } else if (error?.message?.includes('quota') || error?.message?.includes('429')) {
      throw new Error('Quota API Gemini dépassé. Réessayez plus tard.');
    } else if (error?.message?.includes('timeout')) {
      throw new Error('L\'analyse a pris trop de temps. Réessayez avec une vidéo plus courte.');
    } else if (error?.message?.includes('safety') || error?.message?.includes('blocked')) {
      throw new Error('Le contenu de la vidéo a été bloqué par les filtres de sécurité Gemini.');
    }
    
    // Relancer l'erreur avec tous les détails pour le debug
    throw error;
  } finally {
    // Nettoyer le fichier uploadé si nécessaire
    if (uploadedFileUri) {
      try {
        console.log('🧹 Nettoyage du fichier uploadé...');
        // Note: Le FileManager peut gérer automatiquement le nettoyage, mais on peut aussi le faire manuellement si nécessaire
        // const fileManager = new GoogleAIFileManager(genAI);
        // await fileManager.deleteFile(uploadedFileUri);
      } catch (cleanupError) {
        console.warn('⚠️  Erreur lors du nettoyage du fichier:', cleanupError);
      }
    }
  }
}

/**
 * Crée le prompt PREMIUM complet pour l'analyse vidéo
 * Optimisé pour Gemini 2.5 Flash / GPT-4o
 */
function createAnalysisPrompt(
  originalname: string,
  mimetype: string,
  size: number,
  fileExtension: string
): string {
  return `Tu es un EXPERT PREMIUM en analyse de contenu viral pour TikTok, Instagram Reels et YouTube Shorts. Tu analyses les vidéos avec la profondeur d'un consultant professionnel payé 12,99€/mois.

**CONTEXTE DE LA VIDÉO :**
- Nom du fichier : ${originalname}
- Taille : ${(size / 1024 / 1024).toFixed(2)} MB
- Format : ${mimetype}
- Extension : ${fileExtension}

**MISSION : ANALYSE CHIRURGICALE PROFESSIONNELLE**

Analyse cette vidéo comme un expert TikTok/Instagram avec une profondeur EXCEPTIONNELLE. Évalue :
- Storytelling (structure narrative, arc émotionnel)
- Hook (force du début, capacité à captiver en 0-3 secondes)
- Clarté du message (est-ce que le message est clair ?)
- Intérêt général (est-ce que ça mérite d'être regardé ?)
- Rythme des cuts (fréquence, fluidité, impact)
- Énergie ressentie (dynamisme, engagement)
- Émotions transmises (joie, amusement, effort, motivation, etc.)
- Cible (qui est le public visé ?)
- Cohérence du format (facecam, POV, montage, etc.)
- Potentiel viral (probabilité de devenir viral)
- Pertinence des trends (utilise-t-il les bonnes tendances ?)
- Son/musique (qualité, choix, synchronisation)
- Montage (transitions, effets, rythme)
- Cadrage (composition, angles, stabilité)
- Lumière/ambiance (éclairage, atmosphère)
- Tonalité (humoristique, dramatique, esthétique, etc.)
- Risques de désengagement (moments où les gens peuvent quitter)
- Moments critiques (instants qui déterminent le succès)

**STRUCTURE JSON STRICTE OBLIGATOIRE :**

Tu DOIS renvoyer EXACTEMENT ce JSON (aucune variation) :

{
  "summary": {
    "score": <number 0-100>,
    "retention": <number 0-100>,
    "hook_strength": <number 0-100>,
    "clarity": <number 0-100>,
    "shareability": <number 0-100>,
    "category": "<string>",
    "format": "<string>",
    "verdict": "<string>"
  },
  "timeline": [
    {
      "timestamp": "00:00",
      "label": "<string>",
      "detail": "<string>",
      "impact": "<+10 | +5 | 0 | -5 | -10>"
    }
  ],
  "critical_moments": [
    {
      "timestamp": "00:00",
      "reason": "<string>",
      "importance": <number 1-10>
    }
  ],
  "strengths": ["<string>", "<string>", "<string>"],
  "weaknesses": ["<string>", "<string>", "<string>"],
  "risks": ["<string>", "<string>"],
  "recommendations": [
    {
      "id": 1,
      "text": "<string>",
      "impact": "<faible | moyen | fort>"
    }
  ],
  "emotions_detected": ["<string>", "<string>", "<string>"],
  "public_target": "<string>",
  "hashtags": ["#tag1", "#tag2", "#tag3"],
  "trends": ["<string>", "<string>", "<string>"],
  "next_video_ideas": ["<string>", "<string>"]
}

**RÈGLES CRITIQUES :**

1. **summary.score** : Score global 0-100 basé sur TOUS les critères (storytelling, hook, rythme, qualité technique, potentiel viral)
2. **summary.retention** : Probabilité de rétention 0-100 (est-ce que les gens vont regarder jusqu'au bout ?)
3. **summary.hook_strength** : Force du hook 0-100 (capacité à captiver en 0-3 secondes)
4. **summary.clarity** : Clarté du message 0-100 (est-ce que le message est clair et compréhensible ?)
5. **summary.shareability** : Probabilité de partage 0-100 (est-ce que les gens vont partager ?)
6. **summary.category** : Catégorie principale (ex: "Aesthetic", "Gym Humor", "Storytime", "POV", "Montage rapide", "Facecam", "Tutorial", etc.)
7. **summary.format** : Format vidéo (ex: "Facecam", "Montage rapide", "POV", "Aesthetic", etc.)
8. **summary.verdict** : Verdict global ("✨ Excellent", "🔥 Très Bien", "👍 Bien", "⚠️ À améliorer")

9. **timeline** : Analyse chronologique ULTRA-CONCISE. Crée EXACTEMENT 5-6 points MAX dans la timeline avec :
   - timestamp : Format "MM:SS" (ex: "00:00", "00:05", "00:12")
   - label : Titre TRÈS COURT (2-3 mots max) (ex: "Hook initial", "Transition", "Climax")
   - detail : Description ULTRA-CONCISE en 1 phrase maximum (15 mots max). Pas de paragraphes.
   - impact : Impact sur l'engagement ("+10" = excellent, "+5" = bon, "0" = neutre, "-5" = mauvais, "-10" = très mauvais)

10. **critical_moments** : EXACTEMENT 3 moments CRITIQUES MAX. Chaque moment a :
    - timestamp : Format "MM:SS"
    - reason : Pourquoi ce moment est critique en 1 phrase courte (12 mots max)
    - importance : 1-10 (10 = critique absolu)

11. **strengths** : EXACTEMENT 5 points forts MAX. Chaque point doit être ULTRA-CONCIS (5-8 mots max). 
    Format : "Montage dynamique", "Musique entraînante", "Expressions mémorables"
    PAS de phrases longues. Juste des bullets courts et percutants.

12. **weaknesses** : EXACTEMENT 5 points faibles MAX. Chaque point doit être ULTRA-CONCIS (5-8 mots max).
    Format : "Sous-titres manquants", "Transition trop longue", "Musique trop forte"
    PAS de phrases longues. Juste des bullets courts et actionnables.

13. **risks** : EXACTEMENT 2-3 risques MAX. Chaque risque en 1 phrase courte (10 mots max).
    Format : "Risque de swipe à 00:08", "Milieu de vidéo peut perdre l'attention"

14. **recommendations** : EXACTEMENT 5 recommandations MAX. Chaque recommandation :
    - id : Numéro séquentiel (1, 2, 3, 4, 5)
    - text : Conseil ULTRA-CONCIS en 1 phrase (12 mots max). Ex: "Ajouter sous-titres animés 5 premières secondes"
    - impact : "faible", "moyen" ou "fort" (impact estimé sur la performance)

15. **emotions_detected** : EXACTEMENT 3-5 émotions MAX. Un seul mot par émotion (ex: ["joie", "amusement", "effort"])

16. **public_target** : Description ULTRA-CONCISE en 1 phrase (12 mots max). Ex: "Jeunes 18-25 ans, fitness et humour"

17. **hashtags** : EXACTEMENT 10 hashtags MAX. Mélange trending et niche.

18. **trends** : EXACTEMENT 3-5 tendances MAX. Chaque trend en 2-3 mots max (ex: ["POV Gym", "Fitness Humor"])

19. **next_video_ideas** : EXACTEMENT 3 idées MAX. Chaque idée en 1 phrase courte (10 mots max).

**RÈGLES DE CONCISION STRICTES (OBLIGATOIRE) :**
- TOUS les textes doivent être ULTRA-COURTS
- PAS de paragraphes longs
- PAS de répétitions
- PAS de phrases complexes
- Chaque élément doit être lisible en 2 secondes
- Principe : MORE SIGNAL, LESS NOISE
- Si un texte dépasse la limite de mots, il sera rejeté

**QUALITÉ ATTENDUE :**
- Analyse PROFESSIONNELLE et PRÉCISE
- Conseils ACTIONNABLES et CONCRETS
- Scores JUSTIFIÉS et RÉALISTES
- Timeline CHIRURGICALE mais CONCISE
- Identification des moments CRITIQUES
- Détection d'ÉMOTIONS précises
- Recommandations avec IMPACT mesuré
- TOUT doit être SYNTHÉTIQUE et LISIBLE

**IMPORTANT :**
- Base-toi sur ce que tu vois/entends RÉELLEMENT dans la vidéo
- Sois SPÉCIFIQUE, pas générique
- Les conseils doivent être IMMÉDIATEMENT applicables
- RESPECTE les limites de mots pour chaque champ
- Le JSON doit être PARFAITEMENT valide (pas de trailing commas, guillemets corrects)
- PRIORITÉ ABSOLUE : CONCISION et LISIBILITÉ

Réponds UNIQUEMENT avec le JSON valide, sans texte avant ou après.`;
}

/**
 * Normalise et valide le résultat de l'analyse
 * Supporte le nouveau format PREMIUM et l'ancien format
 */
function normalizeAnalysisResult(data: any): VideoAnalysisResult {
  // Vérifier si c'est le nouveau format PREMIUM
  if (data.summary && data.timeline && data.critical_moments) {
    // NOUVEAU FORMAT PREMIUM
    const premium: any = {
      summary: {
        score: typeof data.summary?.score === 'number' ? Math.max(0, Math.min(100, data.summary.score)) : 70,
        retention: typeof data.summary?.retention === 'number' ? Math.max(0, Math.min(100, data.summary.retention)) : 70,
        hook_strength: typeof data.summary?.hook_strength === 'number' ? Math.max(0, Math.min(100, data.summary.hook_strength)) : 70,
        clarity: typeof data.summary?.clarity === 'number' ? Math.max(0, Math.min(100, data.summary.clarity)) : 70,
        shareability: typeof data.summary?.shareability === 'number' ? Math.max(0, Math.min(100, data.summary.shareability)) : 70,
        category: data.summary?.category || 'Général',
        format: data.summary?.format || 'Standard',
        verdict: data.summary?.verdict || '👍 Bien',
      },
      timeline: Array.isArray(data.timeline) ? data.timeline.map((item: any) => ({
        timestamp: item.timestamp || '00:00',
        label: item.label || '',
        detail: item.detail || '',
        impact: ['+10', '+5', '0', '-5', '-10'].includes(item.impact) ? item.impact : '0',
      })) : [],
      critical_moments: Array.isArray(data.critical_moments) ? data.critical_moments.map((item: any) => ({
        timestamp: item.timestamp || '00:00',
        reason: item.reason || '',
        importance: typeof item.importance === 'number' ? Math.max(1, Math.min(10, item.importance)) : 5,
      })) : [],
      strengths: Array.isArray(data.strengths) ? data.strengths : [],
      weaknesses: Array.isArray(data.weaknesses) ? data.weaknesses : [],
      risks: Array.isArray(data.risks) ? data.risks : [],
      recommendations: Array.isArray(data.recommendations) ? data.recommendations.map((item: any) => ({
        id: typeof item.id === 'number' ? item.id : 1,
        text: item.text || '',
        impact: ['faible', 'moyen', 'fort'].includes(item.impact) ? item.impact : 'moyen',
      })) : [],
      emotions_detected: Array.isArray(data.emotions_detected) ? data.emotions_detected : [],
      public_target: data.public_target || 'Public général',
      hashtags: Array.isArray(data.hashtags) ? data.hashtags : [],
      trends: Array.isArray(data.trends) ? data.trends : [],
      next_video_ideas: Array.isArray(data.next_video_ideas) ? data.next_video_ideas : [],
    };

    // Construire le résultat avec compatibilité
    const score = premium.summary.score;
    return {
      premium,
      // Champs de compatibilité basés sur le format premium
      potentielViral: score,
      pointsForts: premium.strengths,
      ameliorations: premium.weaknesses,
      hashtags: premium.hashtags,
      planningSuggeré: premium.recommendations.map((r: any) => r.text),
      publicCible: premium.public_target,
      tendances: premium.trends,
      emotions: premium.emotions_detected,
      niche: premium.summary.category,
      styleMontage: premium.summary.format,
      // Legacy fields
      engagement: Math.round(score / 10),
      viralPotential: score >= 80 ? 'Élevé' : score >= 50 ? 'Moyen' : 'Faible',
      suggestions: premium.recommendations.map((r: any) => r.text),
      trends: premium.trends,
      contentDescription: `Vidéo ${premium.summary.category} - ${premium.summary.verdict}`,
      targetAudience: premium.public_target,
      strengths: premium.strengths,
      improvements: premium.weaknesses,
      timestamp: new Date().toISOString(),
    };
  }

  // ANCIEN FORMAT (compatibilité)
  const description = data.description || {};
  const analyseTechnique = data.analyseTechnique || {};
  const analyseAlgorithmique = data.analyseAlgorithmique || {};
  const extraction = data.extraction || {};
  const conseils = data.conseils || {};
  
  const potentielViral = analyseAlgorithmique.potentielViralite || 70;
  
  return {
    description: {
      resume: description.resume || 'Vidéo analysée',
      ambiance: description.ambiance || 'Non spécifiée',
      ton: description.ton || 'Neutre',
      emotions: Array.isArray(description.emotions) ? description.emotions : [],
      sujetPrincipal: description.sujetPrincipal || 'Non spécifié',
      personnes: Array.isArray(description.personnes) ? description.personnes : [],
      contexte: description.contexte || 'Non spécifié',
      structureNarrative: description.structureNarrative || 'Non spécifiée',
    },
    analyseTechnique: {
      qualiteHook: typeof analyseTechnique.qualiteHook === 'number' ? Math.max(0, Math.min(100, analyseTechnique.qualiteHook)) : 70,
      rythme: analyseTechnique.rythme || 'moyen',
      luminosite: analyseTechnique.luminosite || 'correcte',
      contraste: analyseTechnique.contraste || 'moyen',
      cadrage: analyseTechnique.cadrage || 'moyen',
      lisibiliteTexte: analyseTechnique.lisibiliteTexte || 'N/A',
      sousTitres: analyseTechnique.sousTitres || 'aucun',
      musique: {
        type: analyseTechnique.musique?.type || 'Non spécifié',
        mood: analyseTechnique.musique?.mood || 'Non spécifié',
      },
    },
    analyseAlgorithmique: {
      potentielViralite: typeof analyseAlgorithmique.potentielViralite === 'number' ? Math.max(0, Math.min(100, analyseAlgorithmique.potentielViralite)) : 70,
      raisonsPrincipales: Array.isArray(analyseAlgorithmique.raisonsPrincipales) ? analyseAlgorithmique.raisonsPrincipales : [],
      pointsFaibles: Array.isArray(analyseAlgorithmique.pointsFaibles) ? analyseAlgorithmique.pointsFaibles : [],
      recommandations: Array.isArray(analyseAlgorithmique.recommandations) ? analyseAlgorithmique.recommandations : [],
    },
    extraction: {
      hashtags: Array.isArray(extraction.hashtags) ? extraction.hashtags : [],
      niche: extraction.niche || 'Général',
      motsCles: Array.isArray(extraction.motsCles) ? extraction.motsCles : [],
      styleVideo: extraction.styleVideo || 'Standard',
    },
    conseils: {
      ameliorerHook: Array.isArray(conseils.ameliorerHook) ? conseils.ameliorerHook : [],
      augmenterRetention: Array.isArray(conseils.augmenterRetention) ? conseils.augmenterRetention : [],
      suggestionsMontage: Array.isArray(conseils.suggestionsMontage) ? conseils.suggestionsMontage : [],
      recommandationFormat: conseils.recommandationFormat || 'Format standard',
      nouvelleVersionScript: conseils.nouvelleVersionScript || 'Aucune suggestion',
    },
    // Champs de compatibilité
    potentielViral: potentielViral,
    pointsForts: analyseAlgorithmique.raisonsPrincipales || [],
    ameliorations: analyseAlgorithmique.pointsFaibles || [],
    planningSuggeré: conseils.augmenterRetention || [],
    publicCible: extraction.niche ? `Public intéressé par ${extraction.niche}` : 'Public général',
    tendances: extraction.motsCles || [],
    // Legacy fields
    engagement: Math.round(potentielViral / 10),
    viralPotential: potentielViral >= 80 ? 'Élevé' : potentielViral >= 50 ? 'Moyen' : 'Faible',
    suggestions: analyseAlgorithmique.pointsFaibles || [],
    trends: extraction.motsCles || [],
    contentDescription: description.resume || 'Vidéo analysée',
    targetAudience: extraction.niche ? `Public intéressé par ${extraction.niche}` : 'Public général',
    strengths: analyseAlgorithmique.raisonsPrincipales || [],
    improvements: analyseAlgorithmique.pointsFaibles || [],
    timestamp: new Date().toISOString(),
  };
}


