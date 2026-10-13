// Test n°2 : tendances calculées nous-mêmes à partir du fil "Tendances" (le classement officiel TikTok est en panne).
// Lancer depuis src/server :  node scripts/test-trends2.mjs   (~8 crédits)
import 'dotenv/config';
import { mkdirSync, writeFileSync } from 'node:fs';

const KEY = process.env.SOCIAVAULT_API_KEY;
if (!KEY) { console.error('❌ SOCIAVAULT_API_KEY manquante dans src/server/.env'); process.exit(1); }
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
    writeFileSync(new URL(`${name}.json`, OUT), JSON.stringify({ status: res.status, ms: Date.now() - t0, url, body: json }, null, 2));
    console.log(`${res.ok ? '✅' : '⚠️ '} ${name} → HTTP ${res.status} en ${((Date.now() - t0) / 1000).toFixed(1)} s`);
    return res.ok ? json : null;
  } catch (e) { console.log(`❌ ${name} → ${e.message}`); return null; }
}
function allVideos(obj, acc = []) {
  if (!obj || typeof obj !== 'object') return acc;
  if (obj.aweme_id && obj.statistics) { acc.push(obj); return acc; }
  for (const v of Object.values(obj)) allVideos(v, acc);
  return acc;
}
const fmt = n => Number(n || 0).toLocaleString('fr-FR');

const videos = [];
for (const [i, region] of [['1', 'FR'], ['2', 'FR'], ['3', 'BE']]) {
  allVideos(await call(`fil_tendances_${region}_${i}`, '/trending', { region }), videos);
}
console.log(`\n📺 ${videos.length} vidéos tendance récupérées`);

const sounds = new Map();
for (const v of videos) {
  const m = v.music || {};
  const id = m.id_str || (m.id != null ? String(m.id) : null);
  if (!id) continue;
  const s = sounds.get(id) || { id, titre: m.title, artiste: m.author, original: m.is_original ?? null, videos: 0, vues: 0 };
  s.videos++; s.vues += Number(v.statistics?.play_count || 0);
  sounds.set(id, s);
}
const ranked = [...sounds.values()].sort((a, b) => b.videos - a.videos || b.vues - a.vues);
console.log(`🎵 ${ranked.length} sons différents. Top 8 :`);
ranked.slice(0, 8).forEach((s, i) => console.log(`  ${i + 1}. ${s.titre} — ${s.artiste} | dans ${s.videos} vidéo(s) du fil, ${fmt(s.vues)} vues cumulées`));

// Détails (nombre total de vidéos utilisant le son) pour les 3 premiers sons non "original sound"
const picks = ranked.filter(s => !/original|son original|suono originale/i.test(s.titre || '')).slice(0, 3);
for (const [i, s] of picks.entries()) {
  const d = await call(`details_son_${i + 1}`, '/music/details', { clipId: s.id });
  const info = d?.music_info || d?.data?.music_info || {};
  console.log(`  ℹ️  "${s.titre}" est utilisé dans ${fmt(info.user_count)} vidéos au total`);
}
if (picks[0]) {
  const vids = allVideos(await call('videos_du_son_1', '/music/videos', { clipId: picks[0].id }));
  const best = vids.sort((a, b) => (b.statistics?.play_count || 0) - (a.statistics?.play_count || 0)).slice(0, 3);
  console.log(`\n🔥 Meilleures vidéos avec "${picks[0].titre}" :`);
  best.forEach(v => console.log(`  @${v.author?.unique_id} — ${fmt(v.statistics?.play_count)} vues — ${(v.desc || '').slice(0, 70)}`));
}
console.log('\n📁 Résultats dans src/server/trends-sample/ — dis à Claude que c\'est fait.');
