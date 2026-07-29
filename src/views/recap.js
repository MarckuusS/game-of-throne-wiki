/**
 * Vue Reprise — la raison d'être de l'application.
 *
 * On revient après deux semaines : que s'est-il passé, où en est chacun, dans
 * quel état, avec qui, et qu'est-ce qui restait en suspens.
 */

import * as S from '../spoiler.js';
import * as state from '../state.js';
import { esc, medal, statusBadge, placeLabel, charChip, bar } from '../ui.js';
import { CHARACTERS } from '../../data/characters.js';

function heroEmpty() {
  return `<div class="empty">
    <strong>Rien n'est encore commencé</strong>
    <p class="small">Cette application ne montre que ce que vous avez déjà vu. Validez
    <strong>S01E01</strong> après l'avoir regardé : le monde s'ouvrira épisode par épisode.</p>
    <div class="btn-row center" style="justify-content:center;margin-top:14px">
      <button class="btn btn-gold" id="startNow">Valider S01E01</button>
      <a class="btn btn-ghost" href="#/episodes">Voir la liste</a>
    </div>
  </div>`;
}

export function renderRecap() {
  const ep = S.currentEpisode();
  if (!ep) return heroEmpty();

  const p = state.progress();
  const deaths = S.deathsIn(ep);
  const moves = S.lastEpisodeMoves();
  const movedOnly = moves.filter((m) => m.moved);
  const groups = S.whereEveryone();
  const next = S.nextEpisode();

  return `
    <div class="progress-hero">
      <div class="ep-code">${esc(ep.code)}</div>
      <div class="ep-title">${esc(ep.title)}</div>
      ${bar(p, S.TOTAL_EPISODES)}
      <div class="tiny faint">${p} / ${S.TOTAL_EPISODES} épisodes · saison ${ep.season}</div>
    </div>

    <div class="section" style="margin-top:22px">
      <h2>Là où vous en étiez</h2>
      <div class="card">
        <p class="small" style="margin:0">${esc(ep.synopsis)}</p>
        ${ep.events.length ? `<ul class="bullets">${ep.events.map((e) => `<li>${esc(e)}</li>`).join('')}</ul>` : ''}
      </div>
      ${ep.cliff ? `<div class="card"><div class="warn" style="border:0;padding:0;background:none">
        <strong>À surveiller —</strong> ${esc(ep.cliff)}</div></div>` : ''}
      ${deaths.length ? `<div class="card">
        <div class="tiny faint" style="letter-spacing:.1em;text-transform:uppercase">Morts dans cet épisode</div>
        <div class="chip-list" style="margin-top:8px">${deaths.map(charChip).join('')}</div>
      </div>` : ''}
    </div>

    ${movedOnly.length ? `<div class="section">
      <h2>Qui a bougé</h2>
      <div class="card">
        <ul class="beats">
          ${movedOnly.map((m) => `<li>
            <button data-char="${esc(m.id)}" style="background:none;border:0;padding:0">${medal(m.id, { size: 'sm' })}</button>
            <div class="b-body">
              <div class="b-name">${esc(CHARACTERS[m.id].short || CHARACTERS[m.id].name)}</div>
              <div class="b-loc">${placeLabel(m.from)} → ${placeLabel(m.beat.at)}</div>
            </div>
          </li>`).join('')}
        </ul>
      </div>
    </div>` : ''}

    <div class="section">
      <h2>Où en est tout le monde</h2>
      ${groups.map((g) => `<div class="card">
        <div style="display:flex;align-items:baseline;gap:8px">
          <h3 style="flex:1">${esc(g.name)}</h3>
          <a class="tiny" href="#/carte?place=${esc(g.at)}">sur la carte</a>
        </div>
        <div class="chip-list" style="margin-top:10px">
          ${g.people.map((pin) => `<button class="chip" data-char="${esc(pin.id)}">
            ${medal(pin.id, { size: 'sm', dead: pin.status === 'mort' })}
            ${esc(CHARACTERS[pin.id].short || CHARACTERS[pin.id].name)}
            ${pin.status !== 'ok' ? statusBadge(pin.status) : ''}
          </button>`).join('')}
        </div>
      </div>`).join('')}
    </div>

    <div class="section">
      <h2>Ensuite</h2>
      <div class="card center">
        ${next ? `<div class="small muted">Prochain épisode</div>
          <div class="ep-code" style="font-size:26px">${esc(next.code)}</div>
          <p class="tiny faint">Titre et contenu masqués jusqu'à validation.</p>
          <div class="btn-row" style="justify-content:center;margin-top:10px">
            <button class="btn btn-gold" id="validateNext">Je viens de le voir</button>
          </div>`
          : `<div class="small muted">Vous avez tout vu.</div>
             <p class="tiny faint">Les 73 épisodes sont validés — la chronique est complète.</p>`}
      </div>
    </div>
  `;
}

export function bindRecap(root) {
  const start = root.querySelector('#startNow');
  if (start) start.addEventListener('click', () => state.validate(1));
  const nextBtn = root.querySelector('#validateNext');
  if (nextBtn) nextBtn.addEventListener('click', () => state.next(S.TOTAL_EPISODES));
}
