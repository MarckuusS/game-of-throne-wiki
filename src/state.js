/**
 * État persistant de l'application.
 *
 * MODÈLE DE PROGRESSION — volontairement minimal et linéaire
 * ----------------------------------------------------------------------------
 * `progress` est le numéro absolu (1..73) du dernier épisode validé, 0 si rien.
 * Valider l'épisode n implique que tous les épisodes antérieurs sont vus ;
 * dévalider l'épisode n ramène la progression à n-1.
 *
 * Ce choix n'est pas une simplification paresseuse : c'est ce qui rend le filtre
 * anti-spoil incontournable. Avec un ensemble d'épisodes « vus » en désordre, il
 * faudrait décider quoi faire d'un personnage dont on aurait vu l'épisode 40
 * mais pas le 12 — et toute réponse fuirait de l'information.
 *
 * `exploration` : mode explicite « je veux voir la suite ». Par défaut false.
 * Quand il est activé, le contenu futur est affiché mais flouté et il faut
 * cliquer chaque bloc pour le révéler. Il n'est JAMAIS activé implicitement.
 */

const KEY = 'chroniques:v1';

const DEFAULTS = {
  progress: 0,
  exploration: false,
  trailChar: null,   // personnage dont la trajectoire est tracée sur la carte
  mapFilter: 'all',  // all | alive | pov
};

let state = load();
const listeners = new Set();

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...DEFAULTS };
    const parsed = JSON.parse(raw);
    return { ...DEFAULTS, ...(parsed && typeof parsed === 'object' ? parsed : {}) };
  } catch {
    return { ...DEFAULTS };
  }
}

function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* mode navigation privée, quota plein : l'appli reste utilisable en mémoire */
  }
}

function emit() {
  for (const fn of listeners) fn(state);
}

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function get() {
  return state;
}

export function progress() {
  return state.progress;
}

export function exploration() {
  return state.exploration;
}

function commit(patch) {
  state = { ...state, ...patch };
  persist();
  emit();
}

/** Marque l'épisode `abs` comme vu (et tous les précédents). */
export function validate(abs) {
  if (abs > state.progress) commit({ progress: abs });
}

/** Annule l'épisode `abs` : la progression retombe à abs-1. */
export function unvalidate(abs) {
  if (abs <= state.progress) commit({ progress: abs - 1 });
}

/** Avance d'un épisode. */
export function next(total) {
  if (state.progress < total) commit({ progress: state.progress + 1 });
}

export function setProgress(abs) {
  commit({ progress: Math.max(0, abs) });
}

export function setExploration(on) {
  commit({ exploration: !!on });
}

export function setTrailChar(id) {
  commit({ trailChar: state.trailChar === id ? null : id });
}

export function setMapFilter(f) {
  commit({ mapFilter: f });
}

export function reset() {
  state = { ...DEFAULTS };
  persist();
  emit();
}

/** Export/import pour changer d'appareil sans compte ni serveur. */
export function exportJSON() {
  return JSON.stringify({ app: 'chroniques', version: 1, ...state }, null, 2);
}

export function importJSON(text) {
  const parsed = JSON.parse(text);
  if (!parsed || typeof parsed !== 'object') throw new Error('format invalide');
  const patch = {};
  if (Number.isFinite(parsed.progress)) patch.progress = Math.max(0, Math.floor(parsed.progress));
  if (typeof parsed.exploration === 'boolean') patch.exploration = parsed.exploration;
  if (!('progress' in patch)) throw new Error('aucune progression dans ce fichier');
  commit(patch);
}
