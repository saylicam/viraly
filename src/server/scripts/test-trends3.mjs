// Test n°3 : tendances RÉCENTES (cette semaine), US + FR, par niche (recherche par mot-clé, cette semaine, les plus likées).
// Lancer depuis src/server :  node scripts/test-trends3.mjs   (~7 crédits)
import 'dotenv/config';
import { mkdirSync, writeFileSync } from 'node:fs';

const KEY = process.env.SOCIAVAULT_API_KEY;
if (!KEY) { console.error('❌ SOCIAVAULT_API_KEY manquante dans src/server/.env'); process.exit(1); }
const BASE = 'https://api.sociavault.com/v1/scrape/tiktok';
const OUT = new URL('../trends-sample/', import.meta.url);
mkdirSync(OUT, { recursive: true });
const fmt = n => Number(n || 0).toLocaleString('fr-FR');

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

const niches = { us_trend: ['trend','US'], us_dance: ['dance challenge','US'], us_comedy: ['comedy','US'], fr_humour: ['humour','FR'], fr_gaming: ['gaming','FR'], fr_tendance: ['tendance','FR'] };
const all = [];
for (const [niche, [query, region]] of Object.entries(niches)) {
  const vids = allVideos(await call(`recherche_${niche}`, '/search/keyword', { query, region, date_posted: 'this-week', sort_by: 'most-liked' }));
  vids.forEach(v => (v._niche = niche));
  all.push(...vids);
  const top = vids.sort((a, b) => (b.statistics?.play_count || 0) - (a.statistics?.play_count || 0))[0];
  if (top) console.log(`   ${niche}: ${vids.length} vidéos — top: @${top.author?.unique_id} ${fmt(top.statistics?.play_count)} vues — son: ${top.music?.title}`);
}
await call('hashtag_pourtoi', '/search/hashtag', { hashtag: 'pourtoi', region: 'FR' }).then(j => allVideos(j).forEach(v => { v._niche = 'pourtoi'; all.push(v); }));

const now = Date.now() / 1000;
const ages = all.map(v => (now - (v.create_time || now)) / 86400).sort((a, b) => a - b);
const regions = {};
all.forEach(v => { const r = v.region || v.author?.region || '?'; regions[r] = (regions[r] || 0) + 1; });
console.log(`\n📺 ${all.length} vidéos | âge médian ${ages[Math.floor(ages.length / 2)]?.toFixed(1)} jours | pays des créateurs: ${JSON.stringify(regions)}`);

const sounds = new Map();
for (const v of all) {
  const m = v.music || {}; const id = m.id_str || (m.id != null ? String(m.id) : null);
  if (!id) continue;
  const s = sounds.get(id) || { titre: m.title, artiste: m.author, n: 0, vues: 0, niches: new Set() };
  s.n++; s.vues += Number(v.statistics?.play_count || 0); s.niches.add(v._niche); sounds.set(id, s);
}
const ranked = [...sounds.values()].filter(s => s.n > 1).sort((a, b) => b.n - a.n || b.vues - a.vues);
console.log(`🎵 Sons présents dans plusieurs vidéos : ${ranked.length}`);
ranked.slice(0, 10).forEach((s, i) => console.log(`  ${i + 1}. ${s.titre} — ${s.artiste} | ${s.n} vidéos, ${fmt(s.vues)} vues | niches: ${[...s.niches].join(', ')}`));
console.log('\n📁 Résultats dans src/server/trends-sample/ — dis à Claude que c\'est fait.');
