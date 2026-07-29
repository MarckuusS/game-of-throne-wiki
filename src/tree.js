/**
 * Arbre de descendance — disposition et rendu SVG.
 *
 * Ce module ne connaît RIEN des épisodes : il reçoit un graphe déjà filtré par
 * src/spoiler.js (`familyGraph()`) et une fonction `nodeOf(id)` qui rend une
 * fiche minimale. Il ne peut donc pas divulguer une parenté non révélée : il
 * n'y a pas accès.
 *
 * Disposition : arbre « tidy » simplifié.
 *   1. appartenance   — la maison choisie, ses ancêtres, ses descendants, et
 *                       les conjoints venus d'ailleurs
 *   2. abscisses      — parcours en profondeur : les enfants d'abord, le parent
 *                       centré au-dessus d'eux ; un conjoint « marié dans » la
 *                       famille occupe le créneau voisin
 *   3. profondeurs    — 1 + profondeur du parent ; un conjoint prend celle de
 *                       son partenaire
 */

import { esc } from './ui.js';
import { HOUSES } from '../data/characters.js';

const CARD_W = 116;
const CARD_H = 38;
const UNIT = 136;   // pas horizontal d'un créneau
const ROW = 104;    // pas vertical d'une génération
const PAD = 26;

/* -------------------------------------------------------------------------- */
/* Disposition                                                                 */
/* -------------------------------------------------------------------------- */

export function layoutHouse(house, graph, nodeOf) {
  const parentsOf = new Map();
  const childrenOf = new Map();
  for (const l of graph.parents) {
    if (l.official) continue;              // filiation reconnue mais fausse : hors squelette
    if (!parentsOf.has(l.child)) parentsOf.set(l.child, []);
    parentsOf.get(l.child).push(l.parent);
    if (!childrenOf.has(l.parent)) childrenOf.set(l.parent, []);
    childrenOf.get(l.parent).push(l.child);
  }

  const partnersOf = new Map();
  const addPartner = (a, b, kind) => {
    if (!partnersOf.has(a)) partnersOf.set(a, []);
    partnersOf.get(a).push({ id: b, kind });
  };
  for (const u of graph.unions) {
    addPartner(u.a, u.b, u.kind);
    addPartner(u.b, u.a, u.kind);
  }
  // deux personnes qui ont un enfant commun forment une union, même sans alliance
  const coParents = new Map();
  for (const [child, ps] of parentsOf) {
    if (ps.length < 2) continue;
    for (let i = 0; i < ps.length; i += 1) {
      for (let j = i + 1; j < ps.length; j += 1) {
        const key = [ps[i], ps[j]].sort().join('~');
        if (!coParents.has(key)) coParents.set(key, { a: ps[i], b: ps[j], children: [] });
        coParents.get(key).children.push(child);
      }
    }
  }
  for (const { a, b } of coParents.values()) {
    const known = (partnersOf.get(a) || []).some((p) => p.id === b);
    if (!known) { addPartner(a, b, null); addPartner(b, a, null); }
  }

  /* ---- appartenance ---- */
  const all = new Set();
  for (const l of graph.parents) { all.add(l.parent); all.add(l.child); }
  for (const u of graph.unions) { all.add(u.a); all.add(u.b); }

  const members = new Set();
  const houseOfId = (id) => { const n = nodeOf(id); return n ? n.house : null; };
  const seeds = [...all].filter((id) => houseOfId(id) === house);
  seeds.forEach((s) => members.add(s));

  const up = (id) => {
    for (const p of parentsOf.get(id) || []) if (!members.has(p)) { members.add(p); up(p); }
  };
  const down = (id) => {
    for (const c of childrenOf.get(id) || []) if (!members.has(c)) { members.add(c); down(c); }
  };
  seeds.forEach((s) => { up(s); down(s); });
  for (const m of [...members]) {
    for (const pt of partnersOf.get(m) || []) members.add(pt.id);
  }

  if (!members.size) return null;

  const inFamily = (id) => members.has(id);
  const bloodParents = (id) => (parentsOf.get(id) || []).filter(inFamily);
  const kidsOf = (id) => (childrenOf.get(id) || []).filter(inFamily);

  /* ---- abscisses ---- */
  const x = new Map();
  let slot = 0;

  /** Conjoints à placer juste à côté : dans la famille, mais pas du sang. */
  const marriedIn = (id) => (partnersOf.get(id) || [])
    .filter((pt) => inFamily(pt.id) && !bloodParents(pt.id).length && !x.has(pt.id))
    .map((pt) => pt.id)
    .filter((v, i, arr) => arr.indexOf(v) === i);

  function walk(id) {
    if (x.has(id)) return;
    x.set(id, null);                                  // réservation : coupe les cycles
    const floor = slot;                               // créneaux déjà pris à gauche
    const kids = kidsOf(id).filter((k) => !x.has(k));
    kids.forEach(walk);

    const kidXs = kids.map((k) => x.get(k)).filter((v) => v != null);
    const mates = marriedIn(id);
    const block = [id, ...mates];

    // centré au-dessus de ses enfants, mais jamais à gauche de ce qui est déjà
    // placé : sans cette borne, un bloc large déborde sur son voisin de gauche
    const start = kidXs.length
      ? Math.max(floor, (Math.min(...kidXs) + Math.max(...kidXs)) / 2 - (block.length - 1) / 2)
      : slot;

    block.forEach((who, i) => x.set(who, start + i));
    slot = Math.max(slot, start + block.length);
  }

  const roots = [...members]
    .filter((id) => !bloodParents(id).length)
    .sort((a, b) => {
      const ha = houseOfId(a) === house ? 0 : 1;
      const hb = houseOfId(b) === house ? 0 : 1;
      return ha - hb || (kidsOf(b).length - kidsOf(a).length);
    });
  roots.forEach(walk);
  [...members].forEach(walk);                          // filet de sécurité

  /* ---- profondeurs ---- */
  const depth = new Map();
  const depthOf = (id, guard = new Set()) => {
    if (depth.has(id)) return depth.get(id);
    if (guard.has(id)) return 0;
    guard.add(id);
    const ps = bloodParents(id);
    let d;
    if (ps.length) {
      d = Math.max(...ps.map((p) => depthOf(p, guard))) + 1;
    } else {
      // conjoint venu d'ailleurs : la génération de son partenaire
      const mate = (partnersOf.get(id) || []).find((pt) => inFamily(pt.id) && bloodParents(pt.id).length);
      d = mate ? depthOf(mate.id, guard) : 0;
    }
    depth.set(id, d);
    return d;
  };
  [...members].forEach((id) => depthOf(id));

  /* ---- normalisation en pixels ---- */
  const xs = [...members].map((id) => x.get(id) || 0);
  const minX = Math.min(...xs);
  const pos = new Map();
  for (const id of members) {
    pos.set(id, {
      cx: PAD + CARD_W / 2 + ((x.get(id) || 0) - minX) * UNIT,
      cy: PAD + CARD_H / 2 + depth.get(id) * ROW,
    });
  }

  const width = PAD * 2 + CARD_W + (Math.max(...xs) - minX) * UNIT;
  const height = PAD * 2 + CARD_H + Math.max(...[...members].map((id) => depth.get(id))) * ROW;

  // cadrage initial : centré horizontalement sur la génération la plus ancienne
  const minDepth = Math.min(...[...members].map((id) => depth.get(id)));
  const topRow = [...members].filter((id) => depth.get(id) === minDepth).map((id) => pos.get(id).cx);
  const focusX = topRow.reduce((a, b) => a + b, 0) / topRow.length;

  return {
    members, pos, width, height, focusX,
    unions: [...coParents.values()].filter((u) => inFamily(u.a) && inFamily(u.b)),
    partners: graph.unions.filter((u) => inFamily(u.a) && inFamily(u.b)),
    links: graph.parents.filter((l) => inFamily(l.parent) && inFamily(l.child)),
    singleParent: [...members].filter((id) => bloodParents(id).length === 1),
    parentsOf, childrenOf,
  };
}

/* -------------------------------------------------------------------------- */
/* Rendu                                                                       */
/* -------------------------------------------------------------------------- */

/** Initiales calculées depuis le nom : les personnages seulement mentionnés
    n'existent pas dans CHARACTERS et n'ont donc pas d'initiales toutes faites. */
function ini(name) {
  const parts = String(name).replace(/^(Mestre|Grand Mestre|Khal|Le |La )/, '').trim().split(/[\s'’]+/);
  const a = parts[0] ? parts[0][0] : '';
  const b = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return (a + b).toUpperCase();
}

function card(node, p) {
  const h = HOUSES[node.house] || HOUSES.garde;
  const dead = node.status === 'mort';
  const cls = ['t-card', dead ? 'dead' : '', node.followed ? 'live' : 'ghost'].filter(Boolean).join(' ');
  const attr = node.followed ? ` data-char="${esc(node.id)}"` : '';
  const label = node.short.length > 17 ? node.short.slice(0, 16) + '…' : node.short;
  return `<g class="${cls}" transform="translate(${p.cx - CARD_W / 2} ${p.cy - CARD_H / 2})"${attr}>
    <rect class="t-box" width="${CARD_W}" height="${CARD_H}" rx="8"/>
    <circle class="t-medal" cx="20" cy="${CARD_H / 2}" r="13" fill="${h.color}"/>
    <text class="t-ini" x="20" y="${CARD_H / 2 + 3.5}">${esc(ini(node.name))}</text>
    <text class="t-name" x="39" y="${CARD_H / 2 + 4}">${esc(label)}</text>
    ${dead ? `<path class="t-cross" d="M12 ${CARD_H / 2 - 8} L28 ${CARD_H / 2 + 8}"/>` : ''}
  </g>`;
}

export function renderTree(house, graph, nodeOf) {
  const L = layoutHouse(house, graph, nodeOf);
  if (!L) return null;

  const { pos } = L;
  const bottom = (id) => pos.get(id).cy + CARD_H / 2;
  const top = (id) => pos.get(id).cy - CARD_H / 2;

  /* alliances : trait horizontal entre les deux cartes */
  const unionLines = L.partners.map((u) => {
    const a = pos.get(u.a); const b = pos.get(u.b);
    if (!a || !b) return '';
    const cls = u.kind === 'mariage' ? 't-mar' : u.kind === 'liaison' ? 't-liaison' : 't-fiance';
    if (Math.abs(a.cy - b.cy) < 1) {
      const [l, r] = a.cx < b.cx ? [a, b] : [b, a];
      // voisins immédiats : trait droit dans l'intervalle entre les deux cartes
      if (r.cx - l.cx <= UNIT * 1.15) {
        return `<line class="t-union ${cls}" x1="${l.cx + CARD_W / 2}" y1="${l.cy}" x2="${r.cx - CARD_W / 2}" y2="${r.cy}"/>`;
      }
      // éloignés : on contourne par le bas, sinon le trait traverse les cartes
      // intermédiaires et laisse croire à une union entre voisins
      const y = l.cy + CARD_H / 2 + 11;
      return `<path class="t-union ${cls}" d="M${l.cx} ${l.cy + CARD_H / 2} L${l.cx} ${y} L${r.cx} ${y} L${r.cx} ${r.cy + CARD_H / 2}"/>`;
    }
    // générations différentes : coude discret
    return `<path class="t-union ${cls}" d="M${a.cx} ${a.cy} C ${(a.cx + b.cx) / 2} ${a.cy}, ${(a.cx + b.cx) / 2} ${b.cy}, ${b.cx} ${b.cy}"/>`;
  }).join('');

  /* filiations : descente depuis le couple (ou le parent seul) vers l'enfant */
  const drawn = new Set();
  const parentLines = [];

  for (const u of L.unions) {
    const a = pos.get(u.a); const b = pos.get(u.b);
    if (!a || !b) continue;
    const anchorX = (a.cx + b.cx) / 2;
    const anchorY = Math.max(a.cy, b.cy) + CARD_H / 2;
    const kids = u.children.filter((c) => pos.has(c));
    if (!kids.length) continue;
    const busY = Math.min(...kids.map(top)) - 22;
    parentLines.push(`<path class="t-line" d="M${anchorX} ${anchorY} L${anchorX} ${busY}"/>`);
    for (const c of kids) {
      const link = L.links.find((l) => l.child === c && (l.parent === u.a || l.parent === u.b) && !l.official);
      const cls = link && link.bastard ? 't-line t-bastard' : 't-line';
      parentLines.push(`<path class="${cls}" d="M${anchorX} ${busY} L${pos.get(c).cx} ${busY} L${pos.get(c).cx} ${top(c)}"/>`);
      drawn.add(`${u.a}>${c}`); drawn.add(`${u.b}>${c}`);
    }
  }

  for (const l of L.links) {
    if (drawn.has(`${l.parent}>${l.child}`)) continue;
    const p = pos.get(l.parent); const c = pos.get(l.child);
    if (!p || !c) continue;
    const cls = ['t-line', l.official ? 't-official' : '', l.bastard ? 't-bastard' : ''].filter(Boolean).join(' ');
    const midY = (bottom(l.parent) + top(l.child)) / 2;
    parentLines.push(`<path class="${cls}" d="M${p.cx} ${bottom(l.parent)} L${p.cx} ${midY} L${c.cx} ${midY} L${c.cx} ${top(l.child)}"/>`);
    if (l.official) {
      parentLines.push(`<text class="t-tag" x="${(p.cx + c.cx) / 2}" y="${midY - 5}">reconnu</text>`);
    }
  }

  const cards = [...L.members]
    .map((id) => ({ node: nodeOf(id), p: pos.get(id) }))
    .filter((x) => x.node && x.p)
    .map(({ node, p }) => card(node, p))
    .join('');

  return {
    width: L.width,
    height: L.height,
    focusX: L.focusX,
    svg: `<svg width="${L.width}" height="${L.height}" viewBox="0 0 ${L.width} ${L.height}"
        xmlns="http://www.w3.org/2000/svg" role="img"
        aria-label="Arbre de descendance de la maison ${esc((HOUSES[house] || {}).name || house)}">
      <style>
        .t-box     { fill:#18222f; stroke:#2c3947; stroke-width:1; }
        .t-card.ghost .t-box { fill:#131a24; stroke:#232d3a; stroke-dasharray:3 3; }
        .t-card.live { cursor:pointer; }
        .t-card.live:hover .t-box { stroke:#c8a15a; }
        .t-card.dead .t-box { fill:#141a21; }
        .t-card.dead .t-medal, .t-card.dead .t-name { opacity:.5; }
        .t-medal   { stroke:#0b0f14; stroke-width:1.2; }
        .t-ini     { fill:#f2ede2; font-size:9px; font-family:Georgia,serif; text-anchor:middle; }
        .t-name    { fill:#e8e6e1; font-size:11.5px; font-family:Georgia,serif; }
        .t-card.ghost .t-name { fill:#9aa7b6; font-style:italic; }
        .t-cross   { stroke:#a1372c; stroke-width:1.6; }
        .t-line    { fill:none; stroke:#3f4d5d; stroke-width:1.4; }
        .t-bastard { stroke-dasharray:5 4; }
        .t-official{ stroke:#4a4256; stroke-dasharray:2 4; }
        .t-tag     { fill:#6f6480; font-size:8.5px; font-family:Georgia,serif; text-anchor:middle; letter-spacing:.06em; }
        .t-union   { fill:none; stroke:#8a6f3d; stroke-width:1.6; }
        .t-liaison { stroke-dasharray:6 4; }
        .t-fiance  { stroke-dasharray:2 4; stroke:#5f6b7a; }
      </style>
      ${parentLines.join('')}
      ${unionLines}
      ${cards}
    </svg>`,
  };
}
