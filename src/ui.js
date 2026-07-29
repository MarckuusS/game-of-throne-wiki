/**
 * Petites briques d'interface partagées par les vues.
 * Pas de framework : des fonctions qui renvoient des chaînes HTML, et un
 * échappement systématique de tout ce qui vient des données.
 */

import { CHARACTERS, HOUSES, initials, houseOf } from '../data/characters.js';
import { PLACES } from '../data/places.js';
import { STATUS_LABEL } from './spoiler.js';

export function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Médaillon d'un personnage : couleur de maison, emblème, initiales. */
export function medal(id, { size = '', dead = false } = {}) {
  const h = houseOf(id);
  const cls = ['medal', size, dead ? 'dead' : ''].filter(Boolean).join(' ');
  const bg = `background:radial-gradient(120% 120% at 30% 20%, ${h.color} 0%, #0d1319 130%)`;
  return `<span class="${cls}" style="${bg}" aria-hidden="true"
    ><span class="glyph">${esc(h.glyph)}</span><span class="ini">${esc(initials(id))}</span></span>`;
}

export function statusBadge(status) {
  const s = STATUS_LABEL[status];
  if (!s) return '';
  return `<span class="status ${s.cls}">${esc(s.label)}</span>`;
}

export function placeLabel(id) {
  return PLACES[id] ? esc(PLACES[id].name) : '—';
}

export function charLabel(id) {
  return CHARACTERS[id] ? esc(CHARACTERS[id].name) : esc(id);
}

export function charShort(id) {
  return CHARACTERS[id] ? esc(CHARACTERS[id].short || CHARACTERS[id].name) : esc(id);
}

export function houseLabel(id) {
  const c = CHARACTERS[id];
  return c && HOUSES[c.house] ? esc(HOUSES[c.house].name) : '';
}

/** Chip cliquable ouvrant la fiche d'un personnage. */
export function charChip(id) {
  return `<button class="chip" data-char="${esc(id)}">${medal(id, { size: 'sm' })}${charShort(id)}</button>`;
}

/** Barre de progression. */
export function bar(value, total) {
  const pct = total ? Math.round((value / total) * 1000) / 10 : 0;
  return `<div class="bar" role="progressbar" aria-valuenow="${value}" aria-valuemin="0" aria-valuemax="${total}"><i style="width:${pct}%"></i></div>`;
}

/** Bloc « voilé » du mode exploration : flouté jusqu'au clic. */
export function veil(html, hint = 'Contenu à venir') {
  return `<div class="veil blurred" data-veil>
    <div class="veil-hint">${esc(hint)} — toucher pour révéler</div>
    <div class="veil-body">${html}</div>
  </div>`;
}

let toastTimer = null;
export function toast(msg) {
  const old = document.querySelector('.toast');
  if (old) old.remove();
  const el = document.createElement('div');
  el.className = 'toast';
  el.setAttribute('role', 'status');
  el.textContent = msg;
  document.body.appendChild(el);
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.remove(), 2400);
}

/* ---------------------------- feuille modale ------------------------------ */

const host = () => document.getElementById('sheetHost');

export function openSheet(html) {
  const h = host();
  h.innerHTML = `<div class="sheet" role="dialog" aria-modal="true">
    <button class="sheet-close" aria-label="Fermer">&times;</button>
    <div class="sheet-grip"></div>
    ${html}
  </div>`;
  h.hidden = false;
  document.body.style.overflow = 'hidden';
  h.querySelector('.sheet-close').addEventListener('click', closeSheet);
  h.addEventListener('click', (e) => {
    if (e.target === h) closeSheet();
  });
  const sheet = h.querySelector('.sheet');
  if (sheet) sheet.scrollTop = 0;
}

export function closeSheet() {
  const h = host();
  h.hidden = true;
  h.innerHTML = '';
  document.body.style.overflow = '';
}

export function sheetIsOpen() {
  return !host().hidden;
}
