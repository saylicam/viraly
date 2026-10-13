import AsyncStorage from '@react-native-async-storage/async-storage';
import { answersToProfile, saveCreatorProfile } from './creatorProfile';
import { generateTasksFromQuestionnaire, getTasks } from './calendarService';

/**
 * Fin de l'onboarding (compte créé ou mode invité) :
 * 1. enregistre les réponses du questionnaire (téléphone + compte),
 * 2. remplit le calendrier avec les créneaux du plan, une seule fois et seulement s'il est vide.
 */
export const finalizeOnboarding = async (answers: Record<string, string[]> | undefined, uid: string | null) => {
  if (!answers || !Object.keys(answers).length) return;
  const account = uid && uid !== 'guest' ? uid : null;
  await saveCreatorProfile(answersToProfile(answers), account).catch(() => {});

  const flag = `@viraly_calendar_seeded_${account ?? 'guest'}`;
  try {
    if (await AsyncStorage.getItem(flag)) return;
    const existing = await getTasks(account).catch(() => []);
    if (!existing.length) await generateTasksFromQuestionnaire(answers, account);
    await AsyncStorage.setItem(flag, '1');
  } catch (e: any) {
    console.warn('⚠️ Calendrier non pré-rempli :', e?.message ?? e);
  }
};
