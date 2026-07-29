/**
 * Audit anti-spoil.
 *
 * Ouvre l'application à plusieurs niveaux de progression, parcourt toutes les
 * vues, et vérifie qu'AUCUN fragment de texte issu d'un épisode non validé
 * n'apparaît dans le DOM. Le corpus de référence est extrait des données
 * elles-mêmes : titres d'épisodes, résumés, faits marquants, actions,
 * pensées, et noms des personnages pas encore entrés en scène.
 *
 * Usage : node tools/spoiler-audit.mjs [url]
 * (un serveur statique doit servir le dossier ; défaut http://127.0.0.1:8099)
 */

import { chromium, devices } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { EPISODES, DEBUTS } from '../data/index.js';
import { CHARACTERS } from '../data/characters.js';
import { PLACES } from '../data/places.js';

/* Certains titres d'épisodes sont des mots que l'application affiche
   légitimement par ailleurs (« Winterfell » est un lieu de la carte).
   Les comparer ne prouverait rien : on les exclut du corpus des titres. */
const PLACE_WORDS = new Set(Object.values(PLACES).map((p) => p.name.toLowerCase()));
const titleIsAmbiguous = (t) => PLACE_WORDS.has(t.toLowerCase()) || t.split(/\s+/).length < 2;

const BASE = process.argv[2] || 'http://127.0.0.1:8099/index.html';
const CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const LEVELS = [0, 1, 9, 29, 40, 55, 72];
const VIEWS = ['reprise', 'episodes', 'carte', 'personnages', 'reglages'];

/** Fragments distinctifs (>= 5 mots) d'un texte, pour une recherche fiable. */
function fragments(text) {
  if (!text) return [];
  return String(text)
    .split(/[.;:—]/)
    .map((s) => s.trim())
    .filter((s) => s.split(/\s+/).length >= 5);
}

const browser = await chromium.launch({ executablePath: CHROME });
let failures = 0;

for (const level of LEVELS) {
  const ctx = await browser.newContext({ ...devices['iPhone 13'] });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));

  await page.goto(BASE, { waitUntil: 'domcontentloaded' });
  await page.evaluate((p) => localStorage.setItem('chroniques:v1',
    JSON.stringify({ progress: p, exploration: false, trailChar: null, mapFilter: 'all' })), level);

  let html = '';
  for (const v of VIEWS) {
    await page.goto(`${BASE}#/${v}`, { waitUntil: 'domcontentloaded' });
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(150);
    // déplier toutes les saisons pour maximiser la surface exposée
    if (v === 'episodes') {
      const heads = await page.locator('.season-head').all();
      for (const h of heads) { await h.click(); await page.waitForTimeout(30); }
    }
    html += await page.content();
  }

  const leaks = [];

  for (const ep of EPISODES) {
    if (ep.abs <= level) continue;
    if (!titleIsAmbiguous(ep.title) && html.includes(ep.title)) {
      leaks.push(`${ep.code} titre « ${ep.title} »`);
    }
    const texts = [ep.synopsis, ep.cliff, ...ep.events];
    for (const beat of Object.values(ep.beats)) {
      if (beat) texts.push(beat.did, beat.feel);
    }
    for (const t of texts) {
      for (const frag of fragments(t)) {
        if (html.includes(frag)) leaks.push(`${ep.code} : « ${frag.slice(0, 60)}… »`);
      }
    }
  }

  for (const [id, ch] of Object.entries(CHARACTERS)) {
    if (DEBUTS[id] <= level) continue;
    if (html.includes(ch.name)) leaks.push(`personnage non débloqué : ${ch.name}`);
    for (const frag of fragments(ch.intro)) {
      if (html.includes(frag)) leaks.push(`intro de ${ch.name}`);
    }
  }

  const unique = [...new Set(leaks)];
  const label = `progression ${String(level).padStart(2)} / ${EPISODES.length}`;
  if (unique.length || errors.length) {
    failures += 1;
    console.log(`✗ ${label} — ${unique.length} fuite(s), ${errors.length} erreur(s)`);
    unique.slice(0, 10).forEach((l) => console.log(`    ${l}`));
    errors.slice(0, 5).forEach((e) => console.log(`    JS: ${e}`));
  } else {
    console.log(`✓ ${label} — aucune fuite`);
  }
  await ctx.close();
}

await browser.close();
console.log(failures ? `\n${failures} niveau(x) en échec` : '\nAudit anti-spoil intégralement vert');
process.exit(failures ? 1 : 0);
