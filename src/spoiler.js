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
  KNOWN_FROM, episodeAt, absOf,
} from '../data/index.js';
import { CHARACTERS, HOUSES } from '../data/characters.js';
import { PLACES } from '../data/places.js';
import { KIN, PARENTS, UNIONS } from '../data/family.js';
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
/* Maisons et parentés                                                         */
/* -------------------------------------------------------------------------- */

/** Personnages débloqués regroupés par maison, maisons les plus fournies d'abord. */
export function byHouse() {
  const groups = new Map();
  for (const id of unlockedIds()) {
    const h = CHARACTERS[id].house;
    if (!groups.has(h)) groups.set(h, []);
    groups.get(h).push(id);
  }
  return [...groups.entries()]
    .map(([house, ids]) => ({
      house,
      ...HOUSES[house],
      ids: ids.sort((a, b) => appearances(b) - appearances(a)),
      alive: ids.filter((id) => statusOf(id) !== 'mort').length,
    }))
    .sort((a, b) => b.ids.length - a.ids.length || a.name.localeCompare(b.name, 'fr'));
}

/**
 * Le nom de cette personne est-il connu du spectateur ?
 *
 * C'est la condition d'affichage d'un lien de parenté — et non le déblocage du
 * personnage. La série nomme Tywin Lannister au Conseil restreint (S01E03) bien
 * avant de le montrer (S01E07) : attendre S01E07 pour dessiner sa paternité
 * révélerait le lien plus tard que la série ne le fait. Sa fiche, elle, reste
 * fermée jusqu'à sa première apparition.
 */
export function isKinKnown(id) {
  return KNOWN_FROM[id] !== undefined && KNOWN_FROM[id] <= progress();
}

/**
 * Fiche minimale d'un nœud d'arbre.
 *
 * `followed` distingue le personnage qu'on suit — carte pleine, cliquable, état
 * connu — de celui dont on ne connaît encore que le nom. D'un personnage pas
 * encore rencontré on n'expose ni l'état ni la présentation : on n'en sait rien,
 * on a seulement entendu son nom.
 */
export function kinNode(id) {
  const ch = CHARACTERS[id];
  if (ch) {
    const met = isUnlocked(id);
    return {
      id, name: ch.name, short: ch.short || ch.name, house: ch.house,
      status: met ? statusOf(id) : null,
      followed: met,
      note: met ? ch.intro : '',
    };
  }
  const k = KIN[id];
  if (!k) return null;
  const dead = k.dies && absOf(k.dies) <= progress();
  return {
    id, name: k.name, short: k.short || k.name, house: k.house,
    status: dead ? 'mort' : null, followed: false, note: k.note,
  };
}

/**
 * Graphe de parenté filtré par la progression.
 *
 * Un lien n'apparaît qu'à partir de son épisode de révélation. Un lien
 * `believed` devient `official: true` (filiation reconnue mais fausse) dès
 * l'épisode où le spectateur apprend la vérité — il reste affiché, en
 * pointillé, parce que le mensonge officiel fait partie de l'histoire.
 */
export function familyGraph() {
  const p = progress();

  const parents = [];
  for (const [parent, child, from, opts = {}] of PARENTS) {
    if (absOf(from) > p) continue;
    if (!isKinKnown(parent) || !isKinKnown(child)) continue;
    const official = !!(opts.believed && opts.refuted && absOf(opts.refuted) <= p);
    parents.push({ parent, child, bastard: !!opts.bastard, official });
  }

  const unions = [];
  for (const [a, b, from, kind, end] of UNIONS) {
    if (absOf(from) > p) continue;
    if (end && absOf(end) <= p) continue;
    if (!isKinKnown(a) || !isKinKnown(b)) continue;
    unions.push({ a, b, kind });
  }

  return { parents, unions };
}

/** Maisons ayant de quoi dessiner un arbre, avec le nombre de liens visibles. */
export function housesWithTree() {
  const { parents } = familyGraph();
  const count = new Map();
  const bump = (id) => {
    const node = kinNode(id);
    if (!node) return;
    count.set(node.house, (count.get(node.house) || 0) + 1);
  };
  for (const link of parents) {
    if (link.official) continue;
    bump(link.parent);
    bump(link.child);
  }
  return [...count.entries()]
    .filter(([, n]) => n >= 3)
    .map(([house, n]) => ({ house, ...HOUSES[house], weight: n }))
    .sort((a, b) => b.weight - a.weight);
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
