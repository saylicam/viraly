import fs from 'fs';
import { GoogleAIFileManager, FileState } from '@google/generative-ai/server';
import { env } from '../env';

/**
 * Envoi d'une vidéo à Gemini.
 *
 * - Petite vidéo (≤ INLINE_MAX_BYTES) : envoyée directement dans la requête (base64), c'est le plus rapide.
 * - Vidéo plus longue : envoyée UNE fois à l'API Fichiers de Google, puis la requête ne contient
 *   qu'un lien vers le fichier. Avant, une vidéo d'une minute (~25 Mo, ~35 Mo en base64) était
 *   renvoyée en entier à chaque essai et dépassait le délai de 90 s.
 */
const INLINE_MAX_BYTES = 8 * 1024 * 1024;
const ACTIVE_WAIT_MS = 90_000;

export type VideoPart =
  | { inlineData: { data: string; mimeType: string } }
  | { fileData: { fileUri: string; mimeType: string } };

export interface PreparedVideo {
  part: VideoPart;
  /** true si la vidéo est passée par l'API Fichiers (traitement plus long côté Gemini) */
  uploaded: boolean;
  sizeMb: number;
  /** Supprime le fichier chez Google (à appeler dans un finally) */
  cleanup: () => Promise<void>;
}

let fileManager: GoogleAIFileManager | null = null;
const getFileManager = () => {
  if (!fileManager) fileManager = new GoogleAIFileManager(env.GEMINI_API_KEY as string);
  return fileManager;
};

export const prepareVideo = async (filePath: string, mimeType: string): Promise<PreparedVideo> => {
  const size = fs.statSync(filePath).size;
  const sizeMb = size / 1024 / 1024;

  if (size <= INLINE_MAX_BYTES) {
    return {
      part: { inlineData: { data: fs.readFileSync(filePath).toString('base64'), mimeType } },
      uploaded: false,
      sizeMb,
      cleanup: async () => {},
    };
  }

  const fm = getFileManager();
  const started = Date.now();
  const upload = await fm.uploadFile(filePath, { mimeType, displayName: `viraly-${Date.now()}` });
  let file = upload.file;

  // Google prépare la vidéo (quelques secondes) avant qu'on puisse l'analyser
  while (file.state === FileState.PROCESSING) {
    if (Date.now() - started > ACTIVE_WAIT_MS) throw new Error('timeout (préparation de la vidéo chez Google)');
    await new Promise((r) => setTimeout(r, 2000));
    file = await fm.getFile(file.name);
  }
  if (file.state !== FileState.ACTIVE) {
    throw new Error(`Vidéo refusée par Google (${file.state})`);
  }
  console.log(`☁️ Vidéo envoyée à Gemini (${sizeMb.toFixed(1)} Mo) en ${((Date.now() - started) / 1000).toFixed(1)} s`);

  return {
    part: { fileData: { fileUri: file.uri, mimeType: file.mimeType || mimeType } },
    uploaded: true,
    sizeMb,
    cleanup: async () => {
      await fm.deleteFile(file.name).catch(() => {});
    },
  };
};
