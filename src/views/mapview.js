/**
 * Vue Carte.
 *
 * Ne reçoit que des lieux déjà découverts et des positions déjà connues :
 * le seul « spoiler géographique » possible serait un lieu qui n'existe pas
 * encore dans l'histoire vue, et il est filtré en amont (spoiler.js).
 */

import * as S from '../spoiler.js';
import * as state from '../state.js';
import { renderMap, attachPanZoom } from '../map.js';
import { esc, charShort, placeLabel, medal, toast } from '../ui.js';
import { CHARACTERS } from '../../data/characters.js';

let pendingFocus = null;   // lieu à centrer au prochain rendu
let controller = null;

export function setFocus({ place = null, char = null } = {}) {
  if (char) {
    if (state.get().trailChar !== char) state.setTrailChar(char);
    pendingFocus = S.placeOf(char);
  } else if (place) {
    pendingFocus = place;
  }
}

export function renderMapView() {
  const p = state.progress();
  if (p === 0) {
    return `<div class="empty">
      <strong>La carte est vierge</strong>
      <p class="small">Les lieux se révèlent quand l'histoire y passe. Validez un premier
      épisode pour voir apparaître Winterfell, Port-Réal, le Mur — et ceux qui s'y trouvent.</p>
    </div>`;
  }

  const filter = state.get().mapFilter;
  const trailChar = state.get().trailChar;

  let pins = S.pinsForMap();
  if (filter === 'alive') pins = pins.filter((x) => x.status !== 'mort');
  if (filter === 'trail' && trailChar) pins = pins.filter((x) => x.id === trailChar);

  const trail = trailChar ? S.trailOf(trailChar) : [];
  const placeIds = S.visiblePlaceIds();

  const options = S.unlockedIds()
    .sort((a, b) => CHARACTERS[a].name.localeCompare(CHARACTERS[b].name, 'fr'))
    .map((id) => `<option value="${esc(id)}"${trailChar === id ? ' selected' : ''}>${charShort(id)}</option>`)
    .join('');

  return `
    <div class="map-toolbar">
      <div class="seg" role="group" aria-label="Filtre">
        <button data-filter="all" aria-pressed="${filter === 'all'}">Tous</button>
        <button data-filter="alive" aria-pressed="${filter === 'alive'}">Vivants</button>
        <button data-filter="trail" aria-pressed="${filter === 'trail'}">Trajet seul</button>
      </div>
      <select id="trailSelect" style="flex:1;min-width:150px">
        <option value="">— tracer un trajet —</option>
        ${options}
      </select>
    </div>

    <div class="map-wrap" id="mapWrap">
      ${renderMap({ placeIds, pins, trail, trailChar })}
      <div class="map-zoom">
        <button id="zIn" aria-label="Zoomer">+</button>
        <button id="zOut" aria-label="Dézoomer">−</button>
        <button id="zReset" aria-label="Vue d'ensemble">⤢</button>
      </div>
    </div>

    <div class="legend">
      <span><i style="background:#c8a15a"></i>lieu connu</span>
      <span><i style="background:#5f7385"></i>personnage (couleur de maison)</span>
      <span><i style="background:#2a3038"></i>mort</span>
      <span>${placeIds.length} lieux · ${pins.length} personnages localisés</span>
    </div>

    ${trailChar ? trailPanel(trailChar) : `<div class="card" style="margin-top:14px">
      <p class="small muted" style="margin:0">Touchez une épingle pour ouvrir une fiche, ou choisissez
      un personnage ci-dessus pour tracer son parcours épisode par épisode.</p></div>`}
  `;
}

function trailPanel(id) {
  const trail = S.trailOf(id);
  const last = S.lastBeat(id);
  return `<div class="section" style="margin-top:18px">
    <h2>Parcours de ${charShort(id)}</h2>
    <div class="card">
      <div style="display:flex;gap:12px;align-items:center">
        ${medal(id, { dead: S.statusOf(id) === 'mort' })}
        <div style="flex:1">
          <div class="small">${esc(CHARACTERS[id].name)}</div>
          <div class="tiny faint">${trail.length} étape${trail.length > 1 ? 's' : ''} connue${trail.length > 1 ? 's' : ''}
            · dernier signe : ${last ? esc(last.code) : '—'}</div>
        </div>
        <button class="btn btn-ghost" data-char="${esc(id)}">Fiche</button>
      </div>
      <ul class="chron" style="margin-top:12px">
        ${[...trail].reverse().map((t) => `<li>
          <div class="c-ep">${esc(t.code)}</div>
          <div class="c-did">${placeLabel(t.at)}</div>
        </li>`).join('')}
      </ul>
    </div>
  </div>`;
}

export function bindMapView(root, rerender) {
  root.querySelectorAll('[data-filter]').forEach((b) => {
    b.addEventListener('click', () => { state.setMapFilter(b.dataset.filter); });
  });

  const sel = root.querySelector('#trailSelect');
  if (sel) {
    sel.addEventListener('change', () => {
      const id = sel.value;
      if (!id) {
        if (state.get().trailChar) state.setTrailChar(state.get().trailChar);
        return;
      }
      if (state.get().trailChar !== id) state.setTrailChar(id);
      pendingFocus = S.placeOf(id);
      rerender();
    });
  }

  const wrap = root.querySelector('#mapWrap');
  if (!wrap) return;
  controller = attachPanZoom(wrap);

  const zIn = root.querySelector('#zIn');
  const zOut = root.querySelector('#zOut');
  const zReset = root.querySelector('#zReset');
  if (zIn) zIn.addEventListener('click', () => controller && controller.zoomIn());
  if (zOut) zOut.addEventListener('click', () => controller && controller.zoomOut());
  if (zReset) zReset.addEventListener('click', () => controller && controller.reset());

  if (pendingFocus && controller) {
    controller.focus(pendingFocus);
    toast(`Centré sur ${placeLabel(pendingFocus)}`);
    pendingFocus = null;
  }
}
