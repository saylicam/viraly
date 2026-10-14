/**
 * Lance une collecte de tendances tout de suite (≈ 33 crédits SociaVault) et affiche le résultat.
 * Usage (dans src/server) :  npx tsx scripts/collect-now.ts
 */
import 'dotenv/config';
import { collectTrends } from '../src/services/trends';

(async () => {
  const snap = await collectTrends();
  const fr = (m: string) => m === 'FR';
  console.log('\n===== RÉSUMÉ =====');
  console.log(`Vidéos stars : ${snap.videos.length} (${snap.videos.filter((v) => fr(v.market)).length} francophones)`);
  console.log(`Formats : ${snap.formats.length} (${snap.formats.filter((v) => fr(v.market)).length} francophones)`);
  console.log(`Sons : ${snap.sounds.length} (${snap.sounds.filter((s) => s.markets.includes('FR')).length} utilisés en France)`);
  console.log('\nTop 10 sons :');
  snap.sounds.slice(0, 10).forEach((s, i) => console.log(`  ${i + 1}. ${s.title} — ${s.markets.join('+')} — ${s.appearances} vidéo(s)`));
  console.log('\nTop 6 vidéos stars :');
  snap.videos.slice(0, 6).forEach((v, i) => console.log(`  ${i + 1}. @${v.author} — ${v.market} — ${v.views} vues — publiée il y a ${Math.round((Date.now() / 1000 - v.createdAt) / 86400)} j`));
  process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });
