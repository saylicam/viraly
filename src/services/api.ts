import { ApiResponse, AnalysisResult, VideoUploadResponse } from '../types';
import Constants from 'expo-constants';
import { auth } from '../../firebase';
import { loadLocalProfile } from './creatorProfile';

/** Fiche créateur (bilan du compte TikTok) : envoyée à chaque appel IA pour des conseils personnels. */
const creatorCard = async (): Promise<any | null> => {
  try {
    return (await loadLocalProfile())?.creatorCard ?? null;
  } catch {
    return null;
  }
};

/**
 * Jeton Firebase de l'utilisateur connecté, envoyé au serveur pour prouver son identité.
 * On attend d'abord que Firebase ait relu la session du téléphone : sinon, juste après
 * l'ouverture de l'app, un appel pourrait partir sans jeton et être refusé.
 */
const getAuthHeaders = async (forceRefresh = false): Promise<Record<string, string>> => {
  try {
    await auth.authStateReady();
  } catch {}
  const user = auth.currentUser;
  if (!user) return {};
  const token = await user.getIdToken(forceRefresh);
  return { Authorization: `Bearer ${token}` };
};

/**
 * fetch avec le jeton de l'utilisateur. Si le serveur refuse le jeton (expiré),
 * on le rafraîchit et on réessaie une seule fois.
 */
const authedFetch = async (url: string, init: RequestInit = {}): Promise<Response> => {
  const send = async (forceRefresh: boolean) => fetch(url, {
    ...init,
    headers: { ...(init.headers as Record<string, string>), ...(await getAuthHeaders(forceRefresh)) },
  });
  const response = await send(false);
  if (response.status === 401 && auth.currentUser) return send(true);
  return response;
};

/**
 * Adresse du serveur, choisie automatiquement (plus besoin de .env) :
 * - Viraly Dev (APP_VARIANT=development) → le serveur du PC, à la même adresse que Metro, port 3333
 * - Viraly (App Store / TestFlight)       → Railway
 */
const PROD_API_URL = 'https://viraly-production-b0cd.up.railway.app';
const DEV_API_PORT = 3333;

const resolveBaseUrl = (): string => {
  const extra: any = Constants.expoConfig?.extra ?? {};
  if (extra.appVariant === 'development') {
    const hostUri: string =
      Constants.expoConfig?.hostUri ||
      (Constants as any).expoGoConfig?.debuggerHost ||
      (Constants as any).manifest2?.extra?.expoGo?.debuggerHost ||
      '';
    const host = hostUri.split(':')[0];
    if (host) return `http://${host}:${DEV_API_PORT}`;
  }
  return extra.apiUrl || PROD_API_URL;
};

export const API_BASE_URL = resolveBaseUrl();
if (__DEV__) console.log(`🌐 Serveur Viraly : ${API_BASE_URL}`);

/** Les miniatures des tendances sont servies par notre serveur (chemin relatif « /api/... »). */
export const resolveApiUrl = (url?: string | null) =>
  !url ? null : url.startsWith('/') ? `${API_BASE_URL}${url}` : url;

class ApiService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = API_BASE_URL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${this.baseUrl}${endpoint}`;
      const response = await authedFetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...(options.headers as Record<string, string>),
        },
      });

      // Le serveur peut répondre autre chose que du JSON (limite de requêtes, page d'erreur…)
      const text = await response.text();
      let data: any;
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        data = { message: response.ok ? 'Réponse inattendue du serveur.' : text.slice(0, 120) };
      }

      if (!response.ok) {
        return {
          success: false,
          error: data.message || data.error || 'Une erreur est survenue',
        };
      }

      return {
        success: true,
        data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur de connexion',
      };
    }
  }

  // Tendances de la semaine (aperçu limité sans Premium)
  async getTrends(niche?: string): Promise<ApiResponse<{ success: boolean; data: any; message?: string }>> {
    const query = niche && niche !== 'all' ? `?niche=${encodeURIComponent(niche)}` : '';
    return this.request(`/api/trends${query}`);
  }

  // Plan de tournage IA pour refaire une tendance (1/jour en gratuit)
  async remixTrend(body: { kind: 'sound' | 'video'; id: string; niche?: string; level?: string }): Promise<{ success: boolean; data?: any; error?: string; code?: string }> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);
    try {
      const response = await authedFetch(`${this.baseUrl}/api/trends/remix`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...body, creator: await creatorCard() }),
        signal: controller.signal,
      });
      const text = await response.text();
      let json: any = {};
      try { json = text ? JSON.parse(text) : {}; } catch { json = {}; }
      if (!response.ok || json.success === false) {
        return { success: false, code: json.error, error: json.message || 'Impossible de générer le plan pour le moment.' };
      }
      return { success: true, data: json.data };
    } catch (error) {
      const aborted = error instanceof Error && error.name === 'AbortError';
      return { success: false, code: aborted ? 'TIMEOUT' : 'NETWORK', error: aborted ? 'L’IA met trop de temps à répondre. Réessaie.' : 'Erreur de connexion' };
    } finally {
      clearTimeout(timeoutId);
    }
  }

  // « Vérifie ma version » : compare la vidéo tournée au plan de tendance
  async checkTrendVideo(videoUri: string, plan: any, trend?: { kind?: string; id?: string }): Promise<{ success: boolean; data?: any; error?: string; code?: string }> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 150000);
    try {
      const fileName = videoUri.split('/').pop() || 'video.mp4';
      const type = /\.mov$/i.test(fileName) ? 'video/quicktime' : 'video/mp4';
      const form = new FormData();
      form.append('video', { uri: videoUri, type, name: fileName } as any);
      form.append('plan', JSON.stringify(plan));
      if (trend?.kind) form.append('kind', trend.kind);
      if (trend?.id) form.append('id', trend.id);
      const card = await creatorCard();
      if (card) form.append('creator', JSON.stringify(card));

      const response = await authedFetch(`${this.baseUrl}/api/trends/check`, {
        method: 'POST',
        headers: {},
        body: form,
        signal: controller.signal,
      });
      const text = await response.text();
      let json: any = {};
      try { json = text ? JSON.parse(text) : {}; } catch { json = {}; }
      if (!response.ok || json.success === false) {
        return { success: false, code: json.error, error: json.message || 'Impossible de vérifier ta vidéo pour le moment.' };
      }
      return { success: true, data: json.data };
    } catch (error) {
      const aborted = error instanceof Error && error.name === 'AbortError';
      return { success: false, code: aborted ? 'TIMEOUT' : 'NETWORK', error: aborted ? 'La vérification prend trop de temps. Réessaie avec une vidéo plus courte.' : 'Erreur de connexion' };
    } finally {
      clearTimeout(timeoutId);
    }
  }

  // Analyses offertes restantes (vérifié avant d'envoyer une vidéo)
  async getQuota(): Promise<{ success: boolean; data?: { isPremium: boolean; freeLeft: number | null; freeTotal?: number }; error?: string; code?: string }> {
    return this.jsonCall('/api/analyze/quota', { method: 'GET' }, 10000, 'Quota indisponible.');
  }

  // Aperçu d'un compte TikTok (photo, nom, abonnés) — utilisable avant la création du compte Viraly
  async previewTikTok(handle: string): Promise<{ success: boolean; data?: any; error?: string; code?: string }> {
    return this.jsonCall(`/api/account/preview?handle=${encodeURIComponent(handle)}`, { method: 'GET' }, 30000, 'Impossible de trouver ce compte pour le moment.');
  }

  // Bilan complet du compte TikTok + fiche créateur (aperçu sans Premium)
  async auditTikTok(body: { handle: string; niche?: string; goal?: string; refresh?: boolean }): Promise<{ success: boolean; data?: any; error?: string; code?: string }> {
    return this.jsonCall('/api/account/audit', { method: 'POST', body: JSON.stringify(body) }, 120000, 'Impossible de faire ton bilan pour le moment.');
  }

  private async jsonCall(endpoint: string, init: RequestInit, timeoutMs: number, fallback: string): Promise<{ success: boolean; data?: any; error?: string; code?: string }> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await authedFetch(`${this.baseUrl}${endpoint}`, {
        ...init,
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
      });
      const text = await response.text();
      let json: any = {};
      try { json = text ? JSON.parse(text) : {}; } catch { json = {}; }
      if (!response.ok || json.success === false) return { success: false, code: json.error, error: json.message || fallback };
      return { success: true, data: json.data };
    } catch (error) {
      const aborted = error instanceof Error && error.name === 'AbortError';
      return { success: false, code: aborted ? 'TIMEOUT' : 'NETWORK', error: aborted ? 'Ça prend trop de temps. Réessaie dans un instant.' : 'Erreur de connexion' };
    } finally {
      clearTimeout(timeoutId);
    }
  }

  // Health check
  async healthCheck(): Promise<ApiResponse<{ status: string; timestamp: string }>> {
    return this.request('/health');
  }

  // Video analysis
  async analyzeVideo(videoUrl: string, prompt?: string): Promise<ApiResponse<AnalysisResult>> {
    return this.request('/api/analyze', {
      method: 'POST',
      body: JSON.stringify({ videoUrl, prompt }),
    });
  }

  // Upload video with timeout
  async uploadVideo(
    videoUri: string,
    onProgress?: (progress: number) => void,
    context?: { niche?: string; level?: string; goal?: string }
  ): Promise<ApiResponse<VideoUploadResponse>> {
    // Create AbortController for timeout (le serveur peut relancer l'IA si sa réponse est invalide)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 210000);

    try {
      console.log('📤 Starting video upload:', videoUri);
      
      // Create FormData
      const formData = new FormData();
      
      // Get file name from URI
      const fileName = videoUri.split('/').pop() || 'video.mp4';
      
      // Detect file type from URI or default to mp4
      let fileType = 'video/mp4';
      if (videoUri.includes('.mov')) fileType = 'video/quicktime';
      if (videoUri.includes('.webm')) fileType = 'video/webm';
      if (videoUri.includes('.m4v')) fileType = 'video/mp4';

      // For React Native, we need to use the URI directly
      // The FormData will handle the file reading
      formData.append('video', {
        uri: videoUri,
        type: fileType,
        name: fileName,
      } as any);
      // Profil du créateur : l'IA adapte ses conseils à sa niche, son niveau et son objectif
      if (context?.niche) formData.append('niche', context.niche);
      if (context?.level) formData.append('level', context.level);
      if (context?.goal) formData.append('goal', context.goal);
      const card = await creatorCard();
      if (card) formData.append('creator', JSON.stringify(card));

      console.log('📤 FormData prepared:', { fileName, fileType, uri: videoUri });

      const url = `${this.baseUrl}/api/analyze/video`;
      
      console.log('📤 Uploading to:', url);
      console.log('📤 Timeout set to 120 seconds (2 minutes)');
      
      // Simulate progress (React Native fetch doesn't support progress natively)
      if (onProgress) {
        onProgress(10); // Start
        setTimeout(() => onProgress(30), 1000);
        setTimeout(() => onProgress(50), 2000);
      }
      
      const response = await authedFetch(url, {
        method: 'POST',
        headers: {},
        body: formData,
        signal: controller.signal,
        // Don't set Content-Type header - let React Native set it with boundary
      });

      clearTimeout(timeoutId);

      console.log('📤 Upload response status:', response.status);

      if (onProgress) {
        onProgress(70); // Upload complete, analysis starting
      }

      if (!response.ok) {
        const errorText = await response.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: errorText || `Erreur HTTP ${response.status}` };
        }
        
        console.error('❌ Upload error:', errorData);
        return {
          success: false,
          error: errorData.message || errorData.error || `Erreur HTTP ${response.status}`,
          code: errorData.error,
        };
      }

      if (onProgress) {
        onProgress(90); // Analysis processing
      }

      const data = await response.json();
      console.log('✅ Upload successful:', data);

      if (onProgress) {
        onProgress(100); // Complete
      }

      return {
        success: true,
        data,
      };
    } catch (error: any) {
      clearTimeout(timeoutId);
      
      console.error('❌ Upload error:', error);
      
      if (error.name === 'AbortError') {
        return {
          success: false,
          error: 'Le téléversement a pris trop de temps. La vidéo est peut-être trop grande ou le serveur est lent. Réessaye avec une vidéo plus courte.',
        };
      }
      
      if (error.message?.includes('Network request failed') || error.message?.includes('timeout')) {
        return {
          success: false,
          error: __DEV__
            ? `Connexion au serveur échouée (${this.baseUrl}). Vérifie que le serveur du PC est lancé (cd src/server && npm run dev) et que le téléphone est sur le même Wi-Fi.`
            : 'Connexion au serveur impossible. Vérifie ta connexion internet et réessaie.',
        };
      }
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur de connexion lors de l\'upload',
      };
    }
  }

  // Get analysis suggestions
  async getSuggestions(): Promise<ApiResponse<{
    trendingHashtags: string[];
    contentTypes: string[];
    optimizationTips: string[];
  }>> {
    return this.request('/api/analyze/suggestions');
  }
}

export const apiService = new ApiService();
