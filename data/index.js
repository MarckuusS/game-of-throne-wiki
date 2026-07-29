/**
 * Agrégation des données et index dérivés.
 *
 * Tout ce qui est calculé ici l'est UNE FOIS au chargement, et sert de source
 * unique aux vues. Les index sont volontairement « bruts » : ils ne filtrent
 * rien. Le filtrage anti-spoil est appliqué au-dessus, dans src/spoiler.js.
 */

import s1 from './seasons/s1.js';
import s2 from './seasons/s2.js';
import s3 from './seasons/s3.js';
import s4 from './seasons/s4.js';
import s5 from './seasons/s5.js';
import s6 from './seasons/s6.js';
import s7 from './seasons/s7.js';
import s8 from './seasons/s8.js';

import { CHARACTERS } from './characters.js';
import { PLACES } from './places.js';

const RAW = [s1, s2, s3, s4, s5, s6, s7, s8];

/** Code d'affichage canonique : S03E09. */
export function fmtCode(season, n) {
  return 'S' + String(season).padStart(2, '0') + 'E' + String(n).padStart(2, '0');
}

/** Accepte « 1x02 », « S01E02 », « s1e2 » -> { season, n } ou null. */
export function parseCode(str) {
  if (typeof str !== 'string') return null;
  const m = str.trim().match(/^s?(\d{1,2})\s*[xe]\s*(\d{1,2})$/i);
  if (!m) return null;
  return { season: Number(m[1]), n: Number(m[2]) };
}

/* -------------------------------------------------------------------------- */
/* Épisodes                                                                    */
/* -------------------------------------------------------------------------- */

export const SEASONS = [];
export const EPISODES = [];

let abs = 0;
for (const raw of RAW) {
  const season = { season: raw.season, year: raw.year, episodes: [] };
  for (const ep of raw.episodes) {
    abs += 1;
    const episode = {
      abs,
      season: raw.season,
      n: ep.n,
      code: fmtCode(raw.season, ep.n),
      title: ep.title,
      air: ep.air,
      synopsis: ep.synopsis,
      events: ep.events || [],
      cliff: ep.cliff || null,
      beats: ep.beats || {},
    };
    season.episodes.push(episode);
    EPISODES.push(episode);
  }
  SEASONS.push(season);
}

export const TOTAL_EPISODES = EPISODES.length;

/** Numéro absolu à partir d'un code souple, ou 0 si introuvable. */
export function absOf(code) {
  const p = parseCode(code);
  if (!p) return 0;
  const ep = EPISODES.find((e) => e.season === p.season && e.n === p.n);
  return ep ? ep.abs : 0;
}

export function episodeAt(absN) {
  return EPISODES[absN - 1] || null;
}

/* -------------------------------------------------------------------------- */
/* Index par personnage                                                        */
/* -------------------------------------------------------------------------- */

/**
 * TIMELINES[charId] = [{ abs, code, at, did, feel, st, with }, ...] trié.
 * DEBUTS[charId]    = numéro absolu de la première apparition.
 */
export const TIMELINES = {};
export const DEBUTS = {};

for (const ep of EPISODES) {
  for (const [id, beat] of Object.entries(ep.beats)) {
    if (!beat) continue;
    if (!TIMELINES[id]) TIMELINES[id] = [];
    TIMELINES[id].push({
      abs: ep.abs,
      code: ep.code,
      season: ep.season,
      at: beat.at || null,
      did: beat.did || '',
      feel: beat.feel || '',
      st: beat.st || null,
      with: beat.with || null,
    });
    if (DEBUTS[id] === undefined) DEBUTS[id] = ep.abs;
  }
}

/** Personnages réellement présents dans les données, triés par apparition. */
export const CHARACTER_IDS = Object.keys(DEBUTS).sort((a, b) => DEBUTS[a] - DEBUTS[b]);

/* -------------------------------------------------------------------------- */
/* Index par lieu                                                              */
/* -------------------------------------------------------------------------- */

/** PLACE_FIRST_SEEN[placeId] = premier épisode (abs) où un beat s'y déroule. */
export const PLACE_FIRST_SEEN = {};

for (const ep of EPISODES) {
  for (const beat of Object.values(ep.beats)) {
    if (!beat || !beat.at) continue;
    if (PLACE_FIRST_SEEN[beat.at] === undefined) PLACE_FIRST_SEEN[beat.at] = ep.abs;
  }
}

/* -------------------------------------------------------------------------- */
/* Contrôle d'intégrité (console uniquement, jamais bloquant)                   */
/* -------------------------------------------------------------------------- */

export function integrityReport() {
  const problems = [];
  for (const ep of EPISODES) {
    for (const [id, beat] of Object.entries(ep.beats)) {
      if (!CHARACTERS[id]) problems.push(`${ep.code} : personnage inconnu « ${id} »`);
      if (beat && beat.at && !PLACES[beat.at]) problems.push(`${ep.code} : lieu inconnu « ${beat.at} »`);
      if (beat && beat.with) {
        for (const other of beat.with) {
          if (!CHARACTERS[other]) problems.push(`${ep.code} : compagnon inconnu « ${other} »`);
        }
      }
    }
  }
  for (const id of Object.keys(CHARACTERS)) {
    if (!DEBUTS[id]) problems.push(`personnage « ${id} » déclaré mais jamais présent dans un épisode`);
  }
  return problems;
}
