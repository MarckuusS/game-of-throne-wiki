/**
 * Chroniques — point d'entrée.
 *
 * Routeur par hash, rendu en chaînes HTML, état persistant dans localStorage.
 * Aucune dépendance, aucun build : le fichier est chargé tel quel comme module
 * ES par le navigateur, ce qui permet de publier le dossier en l'état sur
 * GitHub Pages.
 *
 * Architecture :
 *   data/      les faits, datés épisode par épisode
 *   src/state  la progression (seule source de vérité de ce qui est « vu »)
 *   src/spoiler le filtre : les vues ne lisent JAMAIS data/ directement
 *   src/views  le rendu
 */

import * as state from './src/state.js';
import * as S from './src/spoiler.js';
import { integrityReport } from './data/index.js';
import { closeSheet, sheetIsOpen } from './src/ui.js';

import { renderRecap, bindRecap } from './src/views/recap.js';
import { renderEpisodes, bindEpisodes } from './src/views/episodes.js';
import { renderMapView, bindMapView, setFocus } from './src/views/mapview.js';
import { renderCharacters, bindCharacters, openCharSheet } from './src/views/characters.js';
import { renderSettings, bindSettings } from './src/views/settings.js';

const ROUTES = {
  reprise:     { render: renderRecap,      bind: bindRecap,      wide: false },
  episodes:    { render: renderEpisodes,   bind: bindEpisodes,   wide: false },
  carte:       { render: renderMapView,    bind: bindMapView,    wide: true },
  personnages: { render: renderCharacters, bind: bindCharacters, wide: false },
  reglages:    { render: renderSettings,   bind: bindSettings,   wide: false },
};

const view = document.getElementById('view');
let current = 'reprise';

function parseHash() {
  const raw = (location.hash || '#/reprise').replace(/^#\/?/, '');
  const [path, qs] = raw.split('?');
  const params = new URLSearchParams(qs || '');
  return { name: ROUTES[path] ? path : 'reprise', params };
}

function paint() {
  const route = ROUTES[current];
  view.className = 'view' + (route.wide ? ' wide' : '');
  view.innerHTML = route.render();
  route.bind(view, paint);
  syncChrome();
}

function navigate({ replaceScroll = true } = {}) {
  const { name, params } = parseHash();
  current = name;

  // paramètres de navigation profonde : #/carte?char=arya, #/carte?place=winterfell
  if (name === 'carte') {
    const char = params.get('char');
    const place = params.get('place');
    if (char || place) setFocus({ char, place });
  }
  if (name === 'personnages' && params.get('char')) {
    paint();
    openCharSheet(params.get('char'));
    return;
  }

  paint();
  if (replaceScroll) window.scrollTo(0, 0);
}

/** En-tête : puce de progression et anneau du logo. */
function syncChrome() {
  const ep = S.currentEpisode();
  const p = state.progress();

  document.getElementById('chipCode').textContent = ep ? ep.code : '—';
  document.getElementById('chipSub').textContent = ep
    ? `${p}/${S.TOTAL_EPISODES} épisodes`
    : 'Rien de visionné';

  const ring = document.querySelector('.brand-ring');
  if (ring) {
    const c = 2 * Math.PI * 14;
    const done = (p / S.TOTAL_EPISODES) * c;
    ring.setAttribute('stroke-dasharray', `${done.toFixed(1)} ${(c - done).toFixed(1)}`);
  }

  document.querySelectorAll('.tab').forEach((tab) => {
    if (tab.dataset.tab === current) tab.setAttribute('aria-current', 'page');
    else tab.removeAttribute('aria-current');
  });
}

/* ------------------------------- événements ------------------------------- */

window.addEventListener('hashchange', () => navigate());

// Un état qui change (validation, réglage) repeint la vue courante.
state.subscribe(() => paint());

// Délégation : n'importe quel [data-char] ouvre la fiche du personnage.
document.addEventListener('click', (e) => {
  const holder = e.target.closest('[data-char]');
  if (holder) {
    const id = holder.dataset.char;
    if (id) { openCharSheet(id); return; }
  }
  const veil = e.target.closest('[data-veil]');
  if (veil) veil.classList.toggle('blurred');
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && sheetIsOpen()) closeSheet();
});

document.getElementById('brand').addEventListener('click', () => {
  location.hash = '#/reprise';
});

document.getElementById('progressChip').addEventListener('click', () => {
  location.hash = '#/episodes';
});

/* ------------------------------- démarrage -------------------------------- */

if (!location.hash) location.hash = '#/reprise';
navigate();

// Aide au développement : signale toute incohérence de données sans rien casser.
const problems = integrityReport();
if (problems.length) console.warn('[chroniques] données incohérentes :\n' + problems.join('\n'));

// Cache hors ligne — indispensable pour une application ajoutée à l'écran d'accueil.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(new URL('sw.js', import.meta.url)).catch(() => {
      /* http:// local ou navigation privée : l'application marche sans cache */
    });
  });
}
