/**
 * Vue Personnages + fiche personnage.
 *
 * La grille ne contient que des personnages débloqués (première apparition
 * déjà visionnée). Les autres ne sont pas grisés : ils n'existent pas encore
 * dans l'interface. Seul leur nombre est affiché.
 */

import { CHARACTERS, HOUSES } from '../../data/characters.js';
import * as S from '../spoiler.js';
import { medal, statusBadge, esc, charChip, placeLabel, openSheet } from '../ui.js';

let sortMode = 'presence'; // presence | recent | alpha
let query = '';

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

  const q = query.trim().toLowerCase();
  const filtered = q
    ? ids.filter((id) => (CHARACTERS[id].name + ' ' + (HOUSES[CHARACTERS[id].house]?.name || '')).toLowerCase().includes(q))
    : ids;

  return `
    <div class="section">
      <h2>Personnages rencontrés</h2>
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
    </div>

    ${locked ? `<div class="veil"><div class="veil-hint">Encore dans l'ombre</div>
      <p class="small" style="margin:6px 0 0">${locked} personnage${locked > 1 ? 's' : ''} n'${locked > 1 ? 'ont' : 'a'} pas encore
      fait ${locked > 1 ? 'leur' : 'son'} entrée. Leur nom serait déjà un indice : ils apparaîtront à leur épisode.</p></div>` : ''}
  `;
}

export function bindCharacters(root, rerender) {
  root.querySelectorAll('[data-sort]').forEach((b) => {
    b.addEventListener('click', () => { sortMode = b.dataset.sort; rerender(); });
  });
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

    <div class="divider"></div>

    <h2 style="margin-bottom:10px">Ce que l'on sait</h2>
    <ul class="chron">${timeline}</ul>
    <p class="tiny faint center" style="margin-top:12px">
      Chronique arrêtée à ${esc(S.currentEpisode() ? S.currentEpisode().code : '—')}.
      La suite s'écrira quand vous aurez vu la suite.</p>
  `);
}
