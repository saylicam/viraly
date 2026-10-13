// Test de qualité des données "tendances" (SociaVault).
// Lancer depuis src/server :  node scripts/test-trends.mjs
// Clé lue dans src/server/.env : SOCIAVAULT_API_KEY=...
// Résultats bruts enregistrés dans src/server/trends-sample/ (non versionné).
import 'dotenv/config';
import { mkdirSync, writeFileSync } from 'node:fs';

const KEY = process.env.SOCIAVAULT_API_KEY;
if (!KEY) {
  console.error('❌ SOCIAVAULT_API_KEY manquante dans src/server/.env');
  process.exit(1);
}
const BASE = 'https://api.sociavault.com/v1/scrape/tiktok';
const OUT = new URL('../trends-sample/', import.meta.url);
mkdirSync(OUT, { recursive: true });

async function call(name, path, params) {
  const url = `${BASE}${path}?${new URLSearchParams(params)}`;
  const t0 = Date.now();
  try {
    const res = await fetch(url, { headers: { 'X-API-Key': KEY } });
    const text = await res.text();
    let json; try { json = JSON.parse(text); } catch { json = { raw: text }; }
    writeFileSync(new URL(`${name}.json`, OUT), JSON.stringify({ status: res.status, ms: Date.now() - t0, url: url.replace(KEY, '***'), body: json }, null, 2));
    console.log(`${res.ok ? '✅' : '⚠️ '} ${name} → HTTP ${res.status} en ${((Date.now() - t0) / 1000).toFixed(1)} s`);
    return json;
  } catch (e) {
    console.log(`❌ ${name} → ${e.message}`);
    return null;
  }
}

// Cherche récursivement le premier tableau d'objets (la forme exacte de la réponse varie)
function firstList(obj) {
  if (!obj || typeof obj !== 'object') return [];
  if (Array.isArray(obj) && obj.length && typeof obj[0] === 'object') return obj;
  for (const v of Object.values(obj)) { const r = firstList(v); if (r.length) return r; }
  return [];
}

const popFR = await call('popular_FR_7j', '/music/popular', { countryCode: 'FR', timePeriod: '7', rankType: 'popular', page: '1' });
await call('surging_FR_7j', '/music/popular', { countryCode: 'FR', timePeriod: '7', rankType: 'surging', page: '1' });
await call('popular_BE_7j', '/music/popular', { countryCode: 'BE', timePeriod: '7', rankType: 'popular', page: '1' });

const songs = firstList(popFR);
console.log(`\n🎵 ${songs.length} sons dans le top FR. Les 5 premiers :`);
songs.slice(0, 5).forEach((s, i) => console.log(`  ${i + 1}. ${s.title ?? '?'} — ${s.author ?? '?'}  (champs: ${Object.keys(s).join(', ')})`));

const top = songs[0] || {};
const clipId = top.clip_id ?? top.clipId ?? top.song_id ?? top.id ?? top.music_id;
if (clipId) {
  const vids = firstList(await call('videos_du_son_1', '/music/videos', { clipId: String(clipId) }));
  const best = vids
    .map(v => ({ auteur: v.author?.unique_id ?? v.author?.uniqueId ?? '?', vues: v.statistics?.play_count ?? v.stats?.playCount ?? v.play_count ?? 0, texte: (v.desc ?? '').slice(0, 80) }))
    .sort((a, b) => b.vues - a.vues).slice(0, 3);
  console.log(`\n🔥 Meilleures vidéos avec "${top.title}" :`);
  best.forEach(b => console.log(`  @${b.auteur} — ${Number(b.vues).toLocaleString('fr-FR')} vues — ${b.texte}`));
} else {
  console.log('\n(identifiant du son introuvable dans la réponse : je regarderai le fichier brut)');
}
console.log('\n📁 Détails enregistrés dans src/server/trends-sample/ — dis à Claude que c\'est fait.');
