import { env } from '../env';

const BASE = 'https://api.sociavault.com/v1/scrape/tiktok';

/** Appel SociaVault (1 crédit par requête). Renvoie null en cas d'échec : la collecte continue. */
export const sociavault = async (path: string, params: Record<string, string>): Promise<any | null> => {
  if (!env.SOCIAVAULT_API_KEY) throw new Error('SOCIAVAULT_API_KEY manquante');
  const url = `${BASE}${path}?${new URLSearchParams(params)}`;
  for (let attempt = 1; attempt <= 2; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 45_000);
    try {
      const res = await fetch(url, { headers: { 'X-API-Key': env.SOCIAVAULT_API_KEY }, signal: controller.signal });
      if (res.ok) return await res.json();
      // 4xx : inutile de réessayer (paramètre invalide, crédits épuisés…)
      console.warn(`⚠️ SociaVault ${path} → HTTP ${res.status}`);
      if (res.status < 500) return null;
    } catch (e: any) {
      console.warn(`⚠️ SociaVault ${path} → ${e?.name === 'AbortError' ? 'délai dépassé' : e?.message}`);
    } finally {
      clearTimeout(timer);
    }
  }
  return null;
};

/** Récupère toutes les vidéos d'une réponse, quelle que soit sa forme exacte. */
export const extractVideos = (obj: any, acc: any[] = []): any[] => {
  if (!obj || typeof obj !== 'object') return acc;
  if (obj.aweme_id && obj.statistics) {
    acc.push(obj);
    return acc;
  }
  for (const v of Object.values(obj)) extractVideos(v, acc);
  return acc;
};
