/**
 * Vue Épisodes : validation de la progression et fiche d'épisode.
 *
 * Un épisode non vu n'affiche NI son titre NI sa date de résumé : le titre seul
 * est déjà un spoiler ("The Rains of Castamere", "Battle of the Bastards"…).
 * Seuls le numéro et l'année de diffusion sont visibles.
 */

import * as S from '../spoiler.js';
import * as state from '../state.js';
import { esc, medal, statusBadge, placeLabel, charChip, openSheet, closeSheet, toast, bar } from '../ui.js';
import { CHARACTERS } from '../../data/characters.js';

const open = new Set();
let initialised = false;

const CHECK = '<svg viewBox="0 0 24 24"><path d="M5 13l4 4L19 7"/></svg>';
const DOT = '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="4" fill="currentColor" stroke="none" opacity=".45"/></svg>';

function epRow(ep) {
  const card = S.episodeCard(ep);
  const seen = !card.locked;
  const isCurrent = ep.abs === state.progress();
  const cls = ['ep-row', seen ? 'seen' : '', isCurrent ? 'current' : ''].filter(Boolean).join(' ');
  const name = seen
    ? `<span class="ep-name">${esc(ep.title)}</span>`
    : '<span class="ep-name locked">••••••••••</span>';
  const note = seen
    ? `<span class="ep-note">${esc(new Date(ep.air).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long' }))}</span>`
    : '<span class="ep-note">Non visionné</span>';

  return `<div class="${cls}">
    <span class="ep-n mono">${esc(ep.code)}</span>
    <button class="ep-main" data-ep="${ep.abs}" style="background:none;border:0;text-align:left;padding:0;color:inherit">
      ${name}<br>${note}
    </button>
    <button class="tick" data-tick="${ep.abs}" aria-pressed="${seen}"
            aria-label="${seen ? 'Marquer comme non vu' : 'Marquer comme vu'}">${seen ? CHECK : DOT}</button>
  </div>`;
}

export function renderEpisodes() {
  const p = state.progress();

  if (!initialised) {
    initialised = true;
    const cur = p > 0 ? S.episodeAt(p) : S.EPISODES[0];
    open.add(cur.season);
  }

  const seasons = S.SEASONS.map((s) => {
    const st = S.seasonStats(s.season);
    const expanded = open.has(s.season);
    return `<div class="season">
      <button class="season-head" data-season="${s.season}" aria-expanded="${expanded}">
        <span class="caret">›</span>
        <span class="s-name">Saison ${s.season}</span>
        <span class="s-count">${st.seen}/${st.total} · ${s.year}</span>
      </button>
      ${expanded ? `<div class="season-body">${s.episodes.map(epRow).join('')}</div>` : ''}
    </div>`;
  }).join('');

  return `
    <div class="section">
      <h2>Progression</h2>
      <div class="card">
        <div class="small">${p} épisode${p > 1 ? 's' : ''} sur ${S.TOTAL_EPISODES}</div>
        ${bar(p, S.TOTAL_EPISODES)}
        <div class="tiny faint">Valider un épisode débloque son résumé, les personnages qui y entrent
        en scène, leurs déplacements et leur état d'esprit — et rien de plus.</div>
      </div>
    </div>
    <div class="section">
      <h2>Saisons</h2>
      ${seasons}
    </div>
  `;
}

function confirmJump(ep, onConfirm) {
  const gap = ep.abs - state.progress();
  if (gap <= 1) { onConfirm(); return; }
  openSheet(`
    <h2 style="margin-bottom:10px">Valider jusqu'à ${esc(ep.code)} ?</h2>
    <p class="small muted">La progression est linéaire : valider ${esc(ep.code)} marque aussi comme vus
    les <strong>${gap - 1} épisode${gap - 1 > 1 ? 's' : ''}</strong> qui le précèdent, et débloque tout
    leur contenu d'un coup.</p>
    <div class="btn-row" style="margin-top:16px">
      <button class="btn btn-gold" id="jumpYes">Valider quand même</button>
      <button class="btn btn-ghost" id="jumpNo">Annuler</button>
    </div>
  `);
  document.getElementById('jumpYes').addEventListener('click', () => { closeSheet(); onConfirm(); });
  document.getElementById('jumpNo').addEventListener('click', closeSheet);
}

export function bindEpisodes(root, rerender) {
  root.querySelectorAll('[data-season]').forEach((b) => {
    b.addEventListener('click', () => {
      const s = Number(b.dataset.season);
      if (open.has(s)) open.delete(s); else open.add(s);
      rerender();
    });
  });

  root.querySelectorAll('[data-tick]').forEach((b) => {
    b.addEventListener('click', () => {
      const abs = Number(b.dataset.tick);
      if (abs <= state.progress()) {
        state.unvalidate(abs);
        toast(`Progression ramenée à ${abs > 1 ? S.episodeAt(abs - 1).code : 'zéro'}`);
      } else {
        confirmJump(S.episodeAt(abs), () => {
          state.validate(abs);
          toast(`${S.episodeAt(abs).code} validé`);
        });
      }
    });
  });

  root.querySelectorAll('[data-ep]').forEach((b) => {
    b.addEventListener('click', () => openEpisodeSheet(Number(b.dataset.ep)));
  });
}

/* -------------------------------------------------------------------------- */
/* Fiche épisode                                                               */
/* -------------------------------------------------------------------------- */

export function openEpisodeSheet(abs) {
  const ep = S.episodeAt(abs);
  if (!ep) return;

  if (!S.isSeen(abs)) {
    openSheet(`
      <h2 style="margin-bottom:8px">${esc(ep.code)}</h2>
      <div class="veil"><div class="veil-hint">Épisode non visionné</div>
        <p class="small" style="margin:8px 0 0">Le titre, le résumé et les personnages de cet épisode
        restent scellés. Regardez-le, puis validez-le ici.</p></div>
      <div class="btn-row" style="margin-top:16px">
        <button class="btn btn-gold" id="valNow">Je viens de le voir</button>
      </div>
    `);
    document.getElementById('valNow').addEventListener('click', () => {
      closeSheet();
      confirmJump(ep, () => { state.validate(abs); toast(`${ep.code} validé`); });
    });
    return;
  }

  const deaths = S.deathsIn(ep);
  const beats = Object.entries(ep.beats)
    .filter(([id, b]) => b && CHARACTERS[id])
    .sort((a, b) => S.appearances(b[0]) - S.appearances(a[0]));

  openSheet(`
    <div class="tiny faint mono">${esc(ep.code)} · ${esc(new Date(ep.air).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }))}</div>
    <h1 style="margin:4px 0 12px">${esc(ep.title)}</h1>
    <p class="synopsis">${esc(ep.synopsis)}</p>

    ${ep.events.length ? `<div class="divider"></div>
      <h2 style="margin-bottom:8px">Ce qui s'est passé</h2>
      <ul class="bullets">${ep.events.map((e) => `<li>${esc(e)}</li>`).join('')}</ul>` : ''}

    ${deaths.length ? `<div class="divider"></div>
      <h2 style="margin-bottom:8px">Morts</h2>
      <div class="chip-list">${deaths.map(charChip).join('')}</div>` : ''}

    <div class="divider"></div>
    <h2 style="margin-bottom:8px">Où en est chacun</h2>
    <ul class="beats">
      ${beats.map(([id, b]) => `<li>
        <button data-char="${esc(id)}" style="background:none;border:0;padding:0">${medal(id, { size: 'sm', dead: b.st === 'mort' })}</button>
        <div class="b-body">
          <div class="b-name">${esc(CHARACTERS[id].short || CHARACTERS[id].name)}
            ${b.st ? statusBadge(b.st) : ''}</div>
          ${b.at ? `<div class="b-loc">${placeLabel(b.at)}</div>` : ''}
          <div class="b-did">${esc(b.did)}</div>
          ${b.feel ? `<div class="b-feel">« ${esc(b.feel)} »</div>` : ''}
        </div>
      </li>`).join('')}
    </ul>

    ${ep.cliff ? `<div class="divider"></div>
      <div class="warn"><strong>À surveiller —</strong> ${esc(ep.cliff)}</div>` : ''}
  `);
}
