/**
 * La carte du monde connu.
 *
 * Tout est dessiné à la main en SVG : aucune image, aucune ressource externe
 * (l'application doit fonctionner hors ligne et sans dépendance réseau).
 * Les côtes sont définies par des listes de points lissées en courbes de
 * Bézier — plus simple à ajuster que des chemins écrits à la main.
 *
 * Le repère est fixe : viewBox 0 0 1000 1400. Les coordonnées des lieux
 * (data/places.js) sont exprimées dans ce repère.
 */

import { PLACES, REGIONS } from '../data/places.js';
import { houseOf, initials } from '../data/characters.js';
import { esc } from './ui.js';
import { attachPanZoom as panzoom } from './panzoom.js';

export const VIEW = { w: 1000, h: 1400 };

/* -------------------------------------------------------------------------- */
/* Lissage : Catmull-Rom -> cubiques                                           */
/* -------------------------------------------------------------------------- */

function smooth(points, closed = true, tension = 0.5) {
  const p = points;
  const n = p.length;
  if (n < 3) return '';
  const at = (i) => {
    if (closed) return p[(i + n) % n];
    return p[Math.min(Math.max(i, 0), n - 1)];
  };
  let d = `M ${p[0][0]} ${p[0][1]}`;
  const last = closed ? n : n - 1;
  for (let i = 0; i < last; i += 1) {
    const p0 = at(i - 1); const p1 = at(i); const p2 = at(i + 1); const p3 = at(i + 2);
    const c1x = p1[0] + ((p2[0] - p0[0]) / 6) * tension * 2;
    const c1y = p1[1] + ((p2[1] - p0[1]) / 6) * tension * 2;
    const c2x = p2[0] - ((p3[0] - p1[0]) / 6) * tension * 2;
    const c2y = p2[1] - ((p3[1] - p1[1]) / 6) * tension * 2;
    d += ` C ${c1x.toFixed(1)} ${c1y.toFixed(1)}, ${c2x.toFixed(1)} ${c2y.toFixed(1)}, ${p2[0]} ${p2[1]}`;
  }
  if (closed) d += ' Z';
  return d;
}

function blob(cx, cy, rx, ry, wobble = 0.18, steps = 9) {
  const pts = [];
  for (let i = 0; i < steps; i += 1) {
    const a = (i / steps) * Math.PI * 2;
    // déformation déterministe : même île à chaque rendu
    const k = 1 + Math.sin(a * 3 + cx * 0.05) * wobble;
    pts.push([+(cx + Math.cos(a) * rx * k).toFixed(1), +(cy + Math.sin(a) * ry * k).toFixed(1)]);
  }
  return smooth(pts, true, 0.6);
}

/* -------------------------------------------------------------------------- */
/* Géométrie                                                                   */
/* -------------------------------------------------------------------------- */

/* Westeros, dans le sens des aiguilles depuis le nord-ouest des terres gelées.
   Points de repère : le Mur à y≈298, le Neck resserré vers y≈575, le Val en
   saillie à l'est vers y≈670, Dorne en pointe au sud-est. */
const WESTEROS = [
  [210, 110], [252, 92], [322, 96], [356, 124], [380, 170], [392, 224], [396, 270],
  [414, 298], [416, 340], [404, 378], [418, 420], [406, 462], [416, 500], [392, 528],
  [352, 548], [338, 566], [344, 586], [382, 600], [420, 608], [440, 626], [428, 652],
  [452, 676], [446, 706], [458, 736], [440, 764], [446, 790], [412, 808], [430, 834],
  [452, 860], [458, 896], [448, 928], [464, 958], [486, 996], [492, 1042], [470, 1088],
  [428, 1108], [372, 1116], [318, 1104], [268, 1080], [236, 1046], [214, 1006],
  [204, 964], [210, 922], [196, 882], [202, 842], [186, 806], [178, 772], [186, 738],
  [172, 706], [186, 672], [196, 636], [218, 606], [262, 584], [254, 562], [212, 536],
  [190, 500], [172, 462], [160, 420], [152, 376], [158, 332], [168, 300], [154, 264],
  [160, 212], [178, 158],
];

/* Essos : côte ouest découpée (Braavos, Pentos, Myr, Volantis), rive nord de la
   baie des Serfs, puis sortie du cadre à l'est — le continent continue. */
const ESSOS = [
  [560, 330], [534, 382], [556, 432], [598, 470], [628, 506], [586, 548], [578, 592],
  [610, 634], [600, 672], [568, 700], [554, 738], [576, 780], [612, 812], [652, 842],
  [694, 868], [736, 898], [768, 936], [800, 1000], [850, 1012], [890, 1000], [930, 958],
  [1010, 908], [1010, 290], [840, 282], [700, 296],
];

const QARTH_LAND = [
  [878, 1132], [944, 1116], [1010, 1128], [1010, 1250], [928, 1258], [872, 1206],
];

const ISLANDS = [
  blob(472, 770, 21, 16),                 // Peyredragon
  blob(126, 388, 19, 13),                 // Île-aux-Ours
  blob(154, 690, 18, 13),                 // Îles de Fer
  blob(176, 712, 11, 8),
  blob(136, 716, 10, 8),
  blob(584, 764, 13, 10),                 // Tyrosh
  blob(626, 850, 11, 9),                  // Lys
  blob(566, 404, 15, 11),                 // Braavos
];

const WALL = { x1: 166, y1: 300, x2: 416, y2: 296 };

/* -------------------------------------------------------------------------- */
/* Rendu                                                                       */
/* -------------------------------------------------------------------------- */

function marker(kind) {
  switch (kind) {
    case 'city':   return '<rect x="-3.5" y="-3.5" width="7" height="7" transform="rotate(45)"/>';
    case 'castle': return '<path d="M-4 3 L-4 -2 L-2 -2 L-2 -4 L0 -2 L2 -4 L2 -2 L4 -2 L4 3 Z"/>';
    case 'ruin':   return '<path d="M-4 3 L-3 -3 L-1 1 L0 -4 L2 0 L4 3 Z"/>';
    case 'region': return '<circle r="2" opacity=".5"/>';
    default:       return '<circle r="2.6"/>';
  }
}

function pinGrid(count) {
  const cols = Math.min(4, count);
  const dx = 15;
  const dy = 15;
  const out = [];
  for (let i = 0; i < count; i += 1) {
    const row = Math.floor(i / cols);
    const col = i % cols;
    const rowCount = Math.min(cols, count - row * cols);
    out.push([(col - (rowCount - 1) / 2) * dx, 14 + row * dy]);
  }
  return out;
}

/**
 * @param {object} o
 * @param {string[]} o.placeIds   lieux visibles
 * @param {Array}    o.pins       [{ id, at, status }]
 * @param {Array}    o.trail      [{ at, code }] trajectoire à tracer
 * @param {string}   o.trailChar  personnage tracé
 */
export function renderMap({ placeIds = [], pins = [], trail = [], trailChar = null } = {}) {
  const visible = new Set(placeIds);

  const regionLabels = Object.values(REGIONS)
    .map((r) => `<text class="m-region" x="${r.x}" y="${r.y}">${esc(r.name.toUpperCase())}</text>`)
    .join('');

  const placeMarks = placeIds.map((id) => {
    const p = PLACES[id];
    if (!p) return '';
    const anchor = p.x > 700 ? 'end' : 'start';
    const tx = anchor === 'end' ? -7 : 7;
    const extra = p.kind === 'region' ? ' m-region-place' : '';
    return `<g class="m-place m-${p.kind}${extra}" transform="translate(${p.x} ${p.y})">
      ${marker(p.kind)}
      <text class="m-name" x="${tx}" y="3.4" text-anchor="${anchor}">${esc(p.name)}</text>
    </g>`;
  }).join('');

  // trajectoire
  let trailPath = '';
  if (trail.length > 1) {
    const pts = trail.filter((t) => PLACES[t.at]).map((t) => [PLACES[t.at].x, PLACES[t.at].y]);
    if (pts.length > 1) {
      const d = pts.map((pt, i) => `${i ? 'L' : 'M'} ${pt[0]} ${pt[1]}`).join(' ');
      trailPath = `<path class="m-trail" d="${d}"/>` + pts.map((pt, i) => {
        const step = trail[i];
        return `<g class="m-step" transform="translate(${pt[0]} ${pt[1]})">
          <circle r="3.4"/>
          <text class="m-stepn" y="-6">${esc(step.code)}</text>
        </g>`;
      }).join('');
    }
  }

  // épingles de personnages, groupées par lieu
  const byPlace = new Map();
  for (const pin of pins) {
    if (!visible.has(pin.at)) continue;
    if (!byPlace.has(pin.at)) byPlace.set(pin.at, []);
    byPlace.get(pin.at).push(pin);
  }
  const pinMarks = [...byPlace.entries()].map(([at, list]) => {
    const p = PLACES[at];
    const grid = pinGrid(list.length);
    return list.map((pin, i) => {
      const [ox, oy] = grid[i];
      const h = houseOf(pin.id);
      const dead = pin.status === 'mort';
      const cls = ['m-pin', dead ? 'dead' : '', trailChar === pin.id ? 'active' : ''].filter(Boolean).join(' ');
      return `<g class="${cls}" data-char="${esc(pin.id)}" transform="translate(${p.x + ox} ${p.y + oy})">
        <circle class="m-pin-bg" r="6.6" fill="${dead ? '#2a3038' : h.color}"/>
        <text class="m-pin-ini" y="2.2">${esc(initials(pin.id))}</text>
        ${dead ? '<path class="m-pin-x" d="M-3.4 -3.4 L3.4 3.4 M3.4 -3.4 L-3.4 3.4"/>' : ''}
      </g>`;
    }).join('');
  }).join('');

  return `<svg viewBox="0 0 ${VIEW.w} ${VIEW.h}" xmlns="http://www.w3.org/2000/svg" role="img"
       aria-label="Carte du monde connu avec la position des personnages">
    <defs>
      <linearGradient id="sea" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#0b2029"/><stop offset="100%" stop-color="#071219"/>
      </linearGradient>
      <linearGradient id="land" x1="0" y1="0" x2="0.4" y2="1">
        <stop offset="0%" stop-color="#3c4753"/><stop offset="100%" stop-color="#28313b"/>
      </linearGradient>
      <linearGradient id="wall" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="#4d7c8f" stop-opacity=".2"/>
        <stop offset="18%" stop-color="#a9d8e8"/>
        <stop offset="82%" stop-color="#a9d8e8"/>
        <stop offset="100%" stop-color="#4d7c8f" stop-opacity=".2"/>
      </linearGradient>
      <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
        <path d="M50 0 L0 0 0 50" fill="none" stroke="#16303c" stroke-width=".5"/>
      </pattern>
    </defs>

    <style>
      .m-land   { fill:url(#land); stroke:#6d97a8; stroke-width:1.5; }
      .m-region { fill:#7d95a1; font-size:11px; letter-spacing:.22em; font-family:Georgia,serif; text-anchor:middle;
                  stroke:#0a141b; stroke-width:2.6; paint-order:stroke; }
      .m-place circle, .m-place rect, .m-place path { fill:#c8a15a; }
      .m-place.m-region circle { fill:#7f8c96; }
      .m-name   { fill:#d6cdb8; font-size:10.5px; font-family:Georgia,serif; letter-spacing:.04em;
                  stroke:#0a141b; stroke-width:2.6; paint-order:stroke; }
      .m-region-place .m-name { fill:#9aa7b6; font-style:italic; font-size:10px; }
      .m-trail  { fill:none; stroke:#c8a15a; stroke-width:2; stroke-dasharray:7 5; opacity:.85; }
      .m-step circle { fill:#0b0f14; stroke:#c8a15a; stroke-width:1.6; }
      .m-stepn  { fill:#c8a15a; font-size:9px; font-family:Georgia,serif; text-anchor:middle;
                  stroke:#0a141b; stroke-width:2.4; paint-order:stroke; }
      .m-pin    { cursor:pointer; }
      .m-pin-bg { stroke:#0b0f14; stroke-width:1.4; }
      .m-pin-ini{ fill:#f2ede2; font-size:7px; font-family:Georgia,serif; text-anchor:middle; letter-spacing:.02em; }
      .m-pin.dead .m-pin-ini { fill:#7c848e; }
      .m-pin-x  { stroke:#a1372c; stroke-width:1.4; fill:none; }
      .m-pin.active .m-pin-bg { stroke:#f0d9a5; stroke-width:2.2; }
      .m-wall-l { stroke:url(#wall); stroke-width:9; stroke-linecap:round; }
      .m-wall-t { fill:#a9d8e8; font-size:10px; letter-spacing:.34em; font-family:Georgia,serif; text-anchor:middle; opacity:.85; }
    </style>

    <rect width="${VIEW.w}" height="${VIEW.h}" fill="url(#sea)"/>
    <rect width="${VIEW.w}" height="${VIEW.h}" fill="url(#grid)"/>

    <g class="m-lands">
      <path class="m-land" d="${smooth(WESTEROS)}"/>
      <path class="m-land" d="${smooth(ESSOS)}"/>
      <path class="m-land" d="${smooth(QARTH_LAND)}"/>
      ${ISLANDS.map((d) => `<path class="m-land" d="${d}"/>`).join('')}
    </g>

    <g class="m-seas">
      <text class="m-region" x="96" y="640" transform="rotate(-90 96 640)">MER DU CRÉPUSCULE</text>
      <text class="m-region" x="524" y="470" transform="rotate(90 524 470)">MER ÉTROITE</text>
      <text class="m-region" x="676" y="1130">MER D'ÉTÉ</text>
    </g>

    <line class="m-wall-l" x1="${WALL.x1}" y1="${WALL.y1}" x2="${WALL.x2}" y2="${WALL.y2}"/>
    <text class="m-wall-t" x="228" y="286">LE MUR</text>

    ${regionLabels}
    ${placeMarks}
    ${trailPath}
    ${pinMarks}
  </svg>`;
}

/* -------------------------------------------------------------------------- */
/* Navigation                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * Le déplacement et le zoom sont assurés par src/panzoom.js, partagé avec
 * l'arbre de descendance. On n'ajoute ici que le recentrage sur un lieu.
 */
export function attachPanZoom(wrap) {
  const pz = panzoom(wrap, VIEW);
  if (!pz) return null;
  return {
    ...pz,
    focus: (placeId, width = VIEW.w / 2.4) => {
      const p = PLACES[placeId];
      if (p) pz.frame(width, { x: p.x, y: p.y });
    },
  };
}
