import { env } from '../env';
import { collectTrends, loadLatestTrends } from '../services/trends';
import { sendWeeklyTrendsPush, sendScheduledPush } from '../services/push';

/**
 * Collecte automatique une fois par semaine (TRENDS_INTERVAL_DAYS).
 * Vérifie toutes les heures si la dernière collecte est assez ancienne :
 * pas besoin de service de planification séparé sur Railway.
 */
const HOUR = 60 * 60 * 1000;

export const runTrendsCycle = async () => {
  const snapshot = await collectTrends();
  await sendWeeklyTrendsPush(snapshot);
  return snapshot;
};

const checkAndRun = async () => {
  try {
    const latest = await loadLatestTrends();
    const age = latest ? Date.now() - new Date(latest.collectedAt).getTime() : Infinity;
    if (age >= env.TRENDS_INTERVAL_DAYS * 24 * HOUR) {
      console.log('📈 Lancement de la collecte hebdomadaire des tendances…');
      await runTrendsCycle();
    } else {
      // Rendez-vous du jeudi 18 h et du samedi 11 h (heure de Paris)
      await sendScheduledPush(latest);
    }
  } catch (e: any) {
    console.error('❌ Collecte des tendances échouée:', e?.message ?? e);
  }
};

export const startWeeklyTrendsJob = () => {
  if (!env.SOCIAVAULT_API_KEY) {
    console.log('ℹ️ Tendances désactivées (SOCIAVAULT_API_KEY absente)');
    return;
  }
  // Premier contrôle 1 minute après le démarrage, puis toutes les heures
  setTimeout(checkAndRun, 60 * 1000);
  setInterval(checkAndRun, HOUR);
  console.log(`📈 Tendances : collecte automatique tous les ${env.TRENDS_INTERVAL_DAYS} jours`);
};
