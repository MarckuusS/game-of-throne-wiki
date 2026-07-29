/**
 * Vue Personnages : trois modes de lecture, et la fiche personnage.
 *
 *   liste    grille de tous les personnages rencontrés, triable et cherchable
 *   maisons  les mêmes, regroupés par famille
 *   arbre    arbre de descendance d'une maison
 *
 * La grille ne contient que des personnages débloqués (première apparition déjà
 * visionnée). Les autres ne sont pas grisés : ils n'existent pas encore dans
 * l'interface. Seul leur nombre est affiché.
 */

import { CHARACTERS, HOUSES } from '../../data/characters.js';
import * as S from '../spoiler.js';
import { renderTree } from '../tree.js';
import { attachPanZoom } from '../panzoom.js';
import { medal, statusBadge, esc, charChip, placeLabel, openSheet } from '../ui.js';

let mode = 'liste';        // liste | maisons | arbre
let sortMode = 'presence'; // presence | recent | alpha
let query = '';
let treeHouse = null;
let lastTree = null;   // dimensions du dernier arbre rendu, pour le cadrage

function sortIds(ids) {
  const arr = [...ids];
  if (sortMode === 'alpha') {
    arr.sort((a, b) => CHARACTERS[a].name.localeCompare(CHARACTERS[b].name, 'fr'));
  } else if (sortMode === 'recent') {
    arr.sort((a, b) => {
      const la = S.lastBeat(a); const lb = S.lastBeat(b);
      return (lb ? lb.abs : 0) - (la ? la.abs : 0);
    });
  } else {
    arr.sort((a, b) => S.appearances(b) - S.appearances(a));
  }
  return arr;
}

function cell(id) {
  const status = S.statusOf(id);
  const at = S.placeOf(id);
  return `<button class="person-cell" data-char="${esc(id)}">
    ${medal(id, { dead: status === 'mort' })}
    <span class="p-name">${esc(CHARACTERS[id].short || CHARACTERS[id].name)}</span>
    ${statusBadge(status)}
    <span class="p-loc">${at ? placeLabel(at) : ''}</span>
  </button>`;
}

const modeBar = () => `<div class="seg" role="group" aria-label="Mode d'affichage">
    <button data-mode="liste" aria-pressed="${mode === 'liste'}">Liste</button>
    <button data-mode="maisons" aria-pressed="${mode === 'maisons'}">Maisons</button>
    <button data-mode="arbre" aria-pressed="${mode === 'arbre'}">Arbre</button>
  </div>`;

/* ------------------------------- mode liste ------------------------------- */

function renderList(ids) {
  const q = query.trim().toLowerCase();
  const filtered = q
    ? ids.filter((id) => (CHARACTERS[id].name + ' ' + (HOUSES[CHARACTERS[id].house]?.name || '')).toLowerCase().includes(q))
    : ids;

  return `
    <div class="btn-row" style="margin-bottom:12px">
      <div class="seg" role="group" aria-label="Tri">
        <button data-sort="presence" aria-pressed="${sortMode === 'presence'}">Présence</button>
        <button data-sort="recent" aria-pressed="${sortMode === 'recent'}">Récents</button>
        <button data-sort="alpha" aria-pressed="${sortMode === 'alpha'}">A→Z</button>
      </div>
    </div>
    <input type="text" id="charSearch" placeholder="Chercher un nom, une maison…" value="${esc(query)}"
           autocomplete="off" spellcheck="false" style="margin-bottom:12px">
    <div class="people-grid">${sortIds(filtered).map(cell).join('')}</div>
    ${filtered.length === 0 ? '<p class="muted small center" style="margin-top:14px">Aucun résultat.</p>' : ''}
  `;
}

/* ------------------------------ mode maisons ------------------------------ */

function renderHouses() {
  const groups = S.byHouse();
  return groups.map((g) => `<div class="house-block">
    <div class="house-head">
      <span class="house-glyph" style="color:${g.color}">${esc(g.glyph)}</span>
      <div style="flex:1;min-width:0">
        <div class="house-name">${esc(g.name)}</div>
        ${g.words ? `<div class="house-words">« ${esc(g.words)} »</div>` : ''}
      </div>
      <div class="house-count tiny faint">${g.ids.length} membre${g.ids.length > 1 ? 's' : ''}<br>${g.alive} en vie</div>
    </div>
    <div class="people-grid">${g.ids.map(cell).join('')}</div>
  </div>`).join('');
}

/* ------------------------------- mode arbre ------------------------------- */

function renderTreeMode() {
  const houses = S.housesWithTree();
  if (!houses.length) {
    return `<div class="empty">
      <strong>Pas encore d'arbre à dessiner</strong>
      <p class="small">Les liens de parenté apparaissent au fil des épisodes, quand la série
      les établit. Avancez un peu : les premières familles se dessineront d'elles-mêmes.</p>
    </div>`;
  }

  if (!treeHouse || !houses.some((h) => h.house === treeHouse)) treeHouse = houses[0].house;

  const chips = houses.map((h) => `<button class="house-chip" data-tree="${esc(h.house)}"
      aria-pressed="${h.house === treeHouse}">
      <span style="color:${h.color}">${esc(h.glyph)}</span> ${esc(h.name)}
    </button>`).join('');

  const tree = renderTree(treeHouse, S.familyGraph(), S.kinNode);
  lastTree = tree;

  return `
    <div class="house-chips">${chips}</div>
    ${tree ? `<div class="tree-wrap" id="treeWrap">
        ${tree.svg}
        <div class="map-zoom">
          <button id="tIn" aria-label="Zoomer">+</button>
          <button id="tOut" aria-label="Dézoomer">−</button>
          <button id="tReset" aria-label="Vue d'ensemble">⤢</button>
        </div>
      </div>
      <p class="tiny faint center" style="margin-top:6px">Faites glisser pour vous déplacer, pincez pour dézoomer.</p>
      <div class="legend">
        <span><b style="color:#8a6f3d">—</b> mariage</span>
        <span><b style="color:#8a6f3d">- -</b> liaison</span>
        <span><b style="color:#5f6b7a">· ·</b> fiançailles</span>
        <span><b style="color:#3f4d5d">- -</b> filiation hors mariage</span>
        <span><b style="color:#4a4256">· ·</b> filiation reconnue mais fausse</span>
        <span><i style="background:#131a24;border:1px dashed #2c3947"></i> nom connu, pas encore rencontré</span>
      </div>`
      : '<div class="empty"><strong>Rien à dessiner pour cette maison</strong></div>'}
  `;
}

/* --------------------------------- vue ----------------------------------- */

export function renderCharacters() {
  const ids = S.unlockedIds();
  const locked = S.lockedCount();

  if (!ids.length) {
    return `<div class="empty">
      <strong>Aucun personnage débloqué</strong>
      <p class="small">Validez le premier épisode dans l'onglet Épisodes : les personnages
      apparaîtront au fur et à mesure de leur entrée en scène.</p>
    </div>`;
  }

  let body;
  if (mode === 'maisons') body = renderHouses();
  else if (mode === 'arbre') body = renderTreeMode();
  else body = renderList(ids);

  return `
    <div class="section">
      <h2>${mode === 'arbre' ? 'Arbre de descendance' : 'Personnages rencontrés'}</h2>
      <div class="btn-row" style="margin-bottom:14px">${modeBar()}</div>
      ${body}
    </div>

    ${locked ? `<div class="veil"><div class="veil-hint">Encore dans l'ombre</div>
      <p class="small" style="margin:6px 0 0">${locked} personnage${locked > 1 ? 's' : ''} n'${locked > 1 ? 'ont' : 'a'} pas encore
      fait ${locked > 1 ? 'leur' : 'son'} entrée. Leur nom serait déjà un indice : ils apparaîtront à leur épisode.</p></div>` : ''}
  `;
}

export function bindCharacters(root, rerender) {
  root.querySelectorAll('[data-mode]').forEach((b) => {
    b.addEventListener('click', () => { mode = b.dataset.mode; rerender(); });
  });
  root.querySelectorAll('[data-sort]').forEach((b) => {
    b.addEventListener('click', () => { sortMode = b.dataset.sort; rerender(); });
  });
  root.querySelectorAll('[data-tree]').forEach((b) => {
    b.addEventListener('click', () => { treeHouse = b.dataset.tree; rerender(); });
  });

  const treeWrap = root.querySelector('#treeWrap');
  if (treeWrap && lastTree) {
    // hauteur calée sur la forme de l'arbre : un arbre à trois générations ne
    // doit pas occuper la même place qu'un arbre à cinq, ni laisser du vide
    // on vise une échelle d'environ 0,85 : les cartes restent lisibles, et sur
    // un grand écran l'arbre s'affiche presque en entier sans zoomer
    const boxWidth = treeWrap.getBoundingClientRect().width || 360;
    const startWidth = Math.min(lastTree.width, boxWidth / 0.85);
    const fitted = (boxWidth * lastTree.height) / startWidth;
    treeWrap.style.height = `${Math.round(Math.max(220, Math.min(560, fitted)))}px`;

    const pz = attachPanZoom(treeWrap, { w: lastTree.width, h: lastTree.height },
      { minZoom: 1.5, maxZoom: 3 });
    if (pz) {
      // on démarre au-dessus de l'ancêtre le plus lointain, à une échelle lisible
      pz.frame(startWidth, { x: lastTree.focusX, y: lastTree.height / 2 });
      const bind = (sel, fn) => {
        const el = root.querySelector(sel);
        if (el) el.addEventListener('click', fn);
      };
      bind('#tIn', pz.zoomIn);
      bind('#tOut', pz.zoomOut);
      bind('#tReset', pz.reset);
    }
  }

  const search = root.querySelector('#charSearch');
  if (search) {
    search.addEventListener('input', () => {
      query = search.value;
      const grid = root.querySelector('.people-grid');
      if (!grid) return;
      const q = query.trim().toLowerCase();
      const ids = S.unlockedIds().filter((id) => !q
        || (CHARACTERS[id].name + ' ' + (HOUSES[CHARACTERS[id].house]?.name || '')).toLowerCase().includes(q));
      grid.innerHTML = sortIds(ids).map(cell).join('');
    });
  }
}

/* -------------------------------------------------------------------------- */
/* Fiche personnage                                                            */
/* -------------------------------------------------------------------------- */

/** Parenté connue d'un personnage, telle que l'arbre la montre. */
function kinSummary(id) {
  const { parents, unions } = S.familyGraph();
  const label = (who) => {
    const n = S.kinNode(who);
    if (!n) return '';
    return n.followed
      ? `<button class="chip" data-char="${esc(who)}">${medal(who, { size: 'sm' })}${esc(n.short)}</button>`
      : `<span class="chip ghost-chip">${esc(n.short)}</span>`;
  };

  const father = parents.filter((l) => l.child === id && !l.official);
  const officialParents = parents.filter((l) => l.child === id && l.official);
  const kids = parents.filter((l) => l.parent === id && !l.official);
  const mates = unions.filter((u) => u.a === id || u.b === id);

  const rows = [];
  if (father.length) rows.push(['Parents', father.map((l) => label(l.parent)).join('')]);
  if (officialParents.length) {
    rows.push(['Reconnu par', officialParents.map((l) => label(l.parent)).join('')
      + '<div class="tiny faint" style="margin-top:4px">filiation officielle, démentie depuis</div>']);
  }
  if (mates.length) {
    rows.push(['Union', mates.map((u) => {
      const other = u.a === id ? u.b : u.a;
      return `${label(other)}<span class="tiny faint" style="margin-left:4px">${esc(u.kind || '')}</span>`;
    }).join('')]);
  }
  if (kids.length) rows.push(['Enfants', kids.map((l) => label(l.child)).join('')]);

  if (!rows.length) return '';
  return `<div class="divider"></div>
    <h2 style="margin-bottom:10px">Famille</h2>
    <dl class="kv">${rows.map(([k, v]) => `<dt>${k}</dt><dd class="chip-list">${v}</dd>`).join('')}</dl>`;
}

export function openCharSheet(id) {
  const ch = CHARACTERS[id];
  if (!ch || !S.isUnlocked(id)) return;

  const house = HOUSES[ch.house];
  const status = S.statusOf(id);
  const at = S.placeOf(id);
  const last = S.lastBeat(id);
  const companions = S.companionsOf(id).filter((c) => c !== id);
  const chron = S.chronicle(id);
  const title = S.titleOf(id);

  const timeline = [...chron].reverse().map((b) => `<li>
      <div class="c-ep">${esc(b.code)}${b.at ? ` · <span class="c-loc">${placeLabel(b.at)}</span>` : ''}</div>
      <div class="c-did">${esc(b.did)}</div>
      ${b.feel ? `<div class="c-feel">« ${esc(b.feel)} »</div>` : ''}
    </li>`).join('');

  openSheet(`
    <div class="person-head">
      ${medal(id, { size: 'lg', dead: status === 'mort' })}
      <div>
        <div class="ph-name">${esc(ch.name)}</div>
        <div class="ph-sub">${esc(house.name)}${title ? ' · ' + esc(title) : ''}</div>
        <div style="margin-top:6px">${statusBadge(status)}</div>
      </div>
    </div>

    ${house.words ? `<p class="tiny faint" style="margin:10px 0 0;font-style:italic">« ${esc(house.words)} »</p>` : ''}
    <p class="small muted" style="margin:12px 0 0">${esc(ch.intro)}</p>

    <div class="divider"></div>

    <dl class="kv">
      <dt>Où</dt><dd>${at ? placeLabel(at) : 'Inconnu'}</dd>
      <dt>Depuis</dt><dd>${last ? esc(last.code) : '—'}</dd>
      <dt>Vu dans</dt><dd>${chron.length} épisode${chron.length > 1 ? 's' : ''}</dd>
      ${companions.length ? `<dt>Avec</dt><dd class="chip-list" style="margin-top:2px">${companions.map(charChip).join('')}</dd>` : ''}
    </dl>

    ${last && last.feel ? `<div class="warn" style="margin-top:14px">
      <strong>Dans sa tête —</strong> ${esc(last.feel)}</div>` : ''}

    <div class="btn-row" style="margin-top:14px">
      <a class="btn btn-ghost" href="#/carte?char=${esc(id)}">Suivre sur la carte</a>
    </div>

    ${kinSummary(id)}

    <div class="divider"></div>

    <h2 style="margin-bottom:10px">Ce que l'on sait</h2>
    <ul class="chron">${timeline}</ul>
    <p class="tiny faint center" style="margin-top:12px">
      Chronique arrêtée à ${esc(S.currentEpisode() ? S.currentEpisode().code : '—')}.
      La suite s'écrira quand vous aurez vu la suite.</p>
  `);
}
