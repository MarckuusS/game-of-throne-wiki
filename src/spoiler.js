/**
 * Le filtre anti-spoil.
 *
 * TOUTE lecture de données par les vues passe par ce module. Aucune vue
 * n'importe directement TIMELINES ou EPISODES pour en tirer un contenu
 * narratif : c'est la règle qui garantit qu'on ne peut pas divulguer par
 * inadvertance.
 *
 * Invariant : aucune fonction de ce fichier ne renvoie une information issue
 * d'un épisode dont le numéro absolu est strictement supérieur à la
 * progression, sauf `futureCount` (qui ne renvoie qu'un nombre) et
 * `veiled` (qui sert explicitement au mode exploration).
 */

import {
  EPISODES, SEASONS, TOTAL_EPISODES, TIMELINES, DEBUTS, PLACE_FIRST_SEEN,
  episodeAt, absOf,
} from '../data/index.js';
import { CHARACTERS } from '../data/characters.js';
import { PLACES } from '../data/places.js';
import { progress } from './state.js';

export { EPISODES, SEASONS, TOTAL_EPISODES, episodeAt };

export const STATUS_LABEL = {
  ok:      { label: 'En vie',      cls: 'st-ok' },
  blesse:  { label: 'Blessé',      cls: 'st-blesse' },
  captif:  { label: 'Captif',      cls: 'st-captif' },
  fuite:   { label: 'En fuite',    cls: 'st-fuite' },
  disparu: { label: 'Disparu',     cls: 'st-disparu' },
  exil:    { label: 'En exil',     cls: 'st-exil' },
  mue:     { label: 'Transformé',  cls: 'st-mue' },
  mort:    { label: 'Mort',        cls: 'st-mort' },
};

/* -------------------------------------------------------------------------- */
/* Épisodes                                                                    */
/* -------------------------------------------------------------------------- */

export function isSeen(abs) {
  return abs <= progress();
}

/** L'épisode qu'on vient de valider (celui à résumer à la reprise). */
export function currentEpisode() {
  return progress() > 0 ? episodeAt(progress()) : null;
}

/** Le prochain épisode à regarder — titre masqué, aucun contenu. */
export function nextEpisode() {
  return progress() < TOTAL_EPISODES ? episodeAt(progress() + 1) : null;
}

/** Vue « sûre » d'un épisode : contenu si vu, coquille vide sinon. */
export function episodeCard(ep) {
  if (isSeen(ep.abs)) {
    return { ...ep, locked: false };
  }
  return {
    abs: ep.abs, season: ep.season, n: ep.n, code: ep.code,
    air: ep.air, locked: true,
    title: null, synopsis: null, events: [], cliff: null, beats: {},
  };
}

/** Nombre d'épisodes restants — un compteur ne spoile rien. */
export function futureCount() {
  return TOTAL_EPISODES - progress();
}

export function seasonStats(season) {
  const eps = SEASONS[season - 1].episodes;
  const seen = eps.filter((e) => isSeen(e.abs)).length;
  return { seen, total: eps.length };
}

/* -------------------------------------------------------------------------- */
/* Personnages                                                                 */
/* -------------------------------------------------------------------------- */

export function isUnlocked(id) {
  return DEBUTS[id] !== undefined && DEBUTS[id] <= progress();
}

/** Ids des personnages débloqués, dans l'ordre d'apparition. */
export function unlockedIds() {
  return Object.keys(DEBUTS)
    .filter(isUnlocked)
    .sort((a, b) => DEBUTS[a] - DEBUTS[b]);
}

export function lockedCount() {
  return Object.keys(DEBUTS).filter((id) => !isUnlocked(id)).length;
}

/** Chronique d'un personnage, bornée à la progression. */
export function chronicle(id) {
  const tl = TIMELINES[id] || [];
  const p = progress();
  return tl.filter((b) => b.abs <= p);
}

/** Dernier beat connu (le plus récent épisode vu où il apparaît). */
export function lastBeat(id) {
  const c = chronicle(id);
  return c.length ? c[c.length - 1] : null;
}

/**
 * Statut courant : dernier `st` explicitement posé avant ou à la progression.
 * Un personnage sans aucun statut posé est considéré « en vie ».
 */
export function statusOf(id) {
  const c = chronicle(id);
  for (let i = c.length - 1; i >= 0; i -= 1) {
    if (c[i].st) return c[i].st;
  }
  return c.length ? 'ok' : null;
}

/** Dernier lieu connu. */
export function placeOf(id) {
  const c = chronicle(id);
  for (let i = c.length - 1; i >= 0; i -= 1) {
    if (c[i].at) return c[i].at;
  }
  return null;
}

/** Titre courant, tiré des arcs datés du personnage. */
export function titleOf(id) {
  const ch = CHARACTERS[id];
  if (!ch) return '';
  let title = ch.title || '';
  if (ch.arcs) {
    for (const arc of ch.arcs) {
      if (absOf(arc.from) <= progress()) title = arc.title;
    }
  }
  return title;
}

/**
 * Avec qui il se trouve, au dernier épisode vu où il apparaît :
 * les compagnons explicites du beat, sinon les personnages présents
 * au même endroit dans le même épisode.
 */
export function companionsOf(id) {
  const b = lastBeat(id);
  if (!b) return [];
  if (b.with && b.with.length) return b.with.filter(isUnlocked);
  const ep = episodeAt(b.abs);
  if (!ep || !b.at) return [];
  return Object.entries(ep.beats)
    .filter(([other, beat]) => other !== id && beat && beat.at === b.at && isUnlocked(other))
    .map(([other]) => other);
}

/** Nombre d'apparitions déjà vues (utile pour trier par importance ressentie). */
export function appearances(id) {
  return chronicle(id).length;
}

/* -------------------------------------------------------------------------- */
/* Lieux et déplacements                                                       */
/* -------------------------------------------------------------------------- */

/** Lieux affichables : géographie de base + lieux déjà visités. */
export function visiblePlaceIds() {
  const p = progress();
  return Object.keys(PLACES).filter(
    (id) => PLACES[id].base || (PLACE_FIRST_SEEN[id] !== undefined && PLACE_FIRST_SEEN[id] <= p),
  );
}

/**
 * Trajectoire d'un personnage : suite des lieux distincts traversés,
 * dans l'ordre, jusqu'à la progression.
 */
export function trailOf(id) {
  const out = [];
  for (const b of chronicle(id)) {
    if (!b.at) continue;
    if (!out.length || out[out.length - 1].at !== b.at) {
      out.push({ at: b.at, code: b.code, abs: b.abs });
    }
  }
  return out;
}

/** Personnages présents sur la carte, avec leur position et leur état. */
export function pinsForMap() {
  const out = [];
  for (const id of unlockedIds()) {
    const at = placeOf(id);
    if (!at || !PLACES[at]) continue;
    out.push({ id, at, status: statusOf(id), last: lastBeat(id) });
  }
  return out;
}

/** Regroupement « qui est où » pour la vue de reprise. */
export function whereEveryone({ includeDead = false } = {}) {
  const groups = new Map();
  for (const pin of pinsForMap()) {
    if (!includeDead && pin.status === 'mort') continue;
    if (!groups.has(pin.at)) groups.set(pin.at, []);
    groups.get(pin.at).push(pin);
  }
  const arr = [...groups.entries()].map(([at, people]) => ({
    at,
    name: PLACES[at].name,
    people: people.sort((a, b) => appearances(b.id) - appearances(a.id)),
  }));
  arr.sort((a, b) => b.people.length - a.people.length || a.name.localeCompare(b.name, 'fr'));
  return arr;
}

/** Ce qui a changé pour chaque personnage lors du dernier épisode vu. */
export function lastEpisodeMoves() {
  const ep = currentEpisode();
  if (!ep) return [];
  const out = [];
  for (const [id, beat] of Object.entries(ep.beats)) {
    if (!beat) continue;
    const tl = TIMELINES[id] || [];
    const idx = tl.findIndex((b) => b.abs === ep.abs);
    const prev = idx > 0 ? tl[idx - 1] : null;
    out.push({
      id,
      beat,
      moved: !!(prev && prev.at && beat.at && prev.at !== beat.at),
      from: prev ? prev.at : null,
    });
  }
  return out;
}

/** Les morts survenues dans l'épisode courant (mémo utile à la reprise). */
export function deathsIn(ep) {
  if (!ep || !isSeen(ep.abs)) return [];
  return Object.entries(ep.beats)
    .filter(([, b]) => b && b.st === 'mort')
    .map(([id]) => id);
}

/* -------------------------------------------------------------------------- */
/* Mode exploration                                                            */
/* -------------------------------------------------------------------------- */

/**
 * Enveloppe un contenu futur. Utilisé uniquement par les vues qui proposent
 * explicitement le mode exploration ; jamais appelé en mode normal.
 */
export function veiled(text) {
  return { veiled: true, text };
}

export const isCharacterKnown = isUnlocked;
