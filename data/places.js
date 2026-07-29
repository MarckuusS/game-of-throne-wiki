/**
 * Lieux du monde connu.
 *
 * x / y  : coordonnées dans le repère de la carte (viewBox 0 0 1000 1400),
 *          cf. src/map.js — toute modification de la géométrie du continent
 *          doit rester cohérente avec ces coordonnées.
 * base   : true  -> le lieu est affiché dès le départ (géographie de culture
 *                   générale, aucun risque de spoiler)
 *          false -> le lieu n'apparaît sur la carte qu'une fois visité par un
 *                   personnage dans un épisode validé (effet de découverte)
 * kind   : city | castle | ruin | wild | region  (style du marqueur)
 */

export const REGIONS = {
  nord:        { name: 'Le Nord',          x: 270, y: 405 },
  audela:      { name: 'Terres gelées',    x: 268, y: 138 },
  conflans:    { name: 'Le Conflans',      x: 268, y: 665 },
  val:         { name: 'Le Val',           x: 434, y: 664 },
  ouest:       { name: "L'Ouest",          x: 214, y: 748 },
  couronnes:   { name: 'Les Terres de la Couronne', x: 372, y: 762 },
  orages:      { name: "Les Terres de l'Orage", x: 424, y: 872 },
  bief:        { name: 'Le Bief',          x: 268, y: 905 },
  dorne:       { name: 'Dorne',            x: 400, y: 1075 },
  ferislands:  { name: 'Îles de Fer',      x: 132, y: 664 },
  essosw:      { name: 'Cités Libres',     x: 690, y: 600 },
  dothraki:    { name: 'Mer Dothrak',      x: 845, y: 610 },
  esclavagist: { name: "Baie des Serfs",   x: 872, y: 1035 },
};

export const PLACES = {
  /* ---------------- Au-delà du Mur ---------------- */
  durlieu:      { name: 'Durlieu',                region: 'audela',    kind: 'wild',   x: 300, y: 112, base: false },
  poing:        { name: 'Poing des Premiers Hommes', region: 'audela', kind: 'wild',   x: 232, y: 172, base: false },
  craster:      { name: 'Manoir de Craster',      region: 'audela',    kind: 'castle', x: 305, y: 205, base: false },
  arbrecoeur:   { name: 'La Grotte aux Corbeaux', region: 'audela',    kind: 'wild',   x: 208, y: 118, base: false },
  laccelé:      { name: 'Lac Gelé',               region: 'audela',    kind: 'wild',   x: 352, y: 168, base: false },

  /* ---------------- Le Mur ---------------- */
  chateaunoir:  { name: 'Châteaunoir',            region: 'nord',      kind: 'castle', x: 288, y: 296, base: true },
  fortnox:      { name: 'Fort Levant',            region: 'nord',      kind: 'castle', x: 398, y: 288, base: false },
  tourombreuse: { name: 'Tour Ombreuse',          region: 'nord',      kind: 'castle', x: 186, y: 300, base: false },
  taupière:     { name: 'La Taupière',            region: 'nord',      kind: 'city',   x: 300, y: 330, base: false },

  /* ---------------- Le Nord ---------------- */
  winterfell:   { name: 'Winterfell',             region: 'nord',      kind: 'castle', x: 282, y: 452, base: true },
  fortterreur:  { name: 'Fort-Terreur',           region: 'nord',      kind: 'castle', x: 362, y: 428, base: false },
  atre:         { name: 'Âtre-lès-Confins',       region: 'nord',      kind: 'castle', x: 332, y: 362, base: false },
  ileours:      { name: 'Île-aux-Ours',           region: 'nord',      kind: 'castle', x: 126, y: 388, base: false },
  blancport:    { name: 'Blancport',              region: 'nord',      kind: 'city',   x: 372, y: 520, base: false },
  moatcailin:   { name: 'Moat Cailin',            region: 'nord',      kind: 'ruin',   x: 300, y: 562, base: false },
  boisauxloups: { name: 'Bois-aux-Loups',         region: 'nord',      kind: 'wild',   x: 232, y: 468, base: false },

  /* ---------------- Conflans / Val ---------------- */
  jumeaux:      { name: 'Les Jumeaux',            region: 'conflans',  kind: 'castle', x: 302, y: 640, base: false },
  vivesaigues:  { name: 'Vivesaigues',            region: 'conflans',  kind: 'castle', x: 264, y: 702, base: false },
  harrenhal:    { name: 'Harrenhal',              region: 'conflans',  kind: 'ruin',   x: 342, y: 688, base: false },
  routroyale:   { name: 'La Route Royale',        region: 'conflans',  kind: 'wild',   x: 336, y: 742, base: false },
  eyrie:        { name: 'Les Eyrié',              region: 'val',       kind: 'castle', x: 412, y: 658, base: true },
  portegaie:    { name: 'La Porte Sanglante',     region: 'val',       kind: 'castle', x: 392, y: 632, base: false },
  trident:      { name: 'Le Trident',             region: 'conflans',  kind: 'wild',   x: 318, y: 716, base: false },

  /* ---------------- Ouest / Îles de Fer ---------------- */
  castralroc:   { name: 'Castral Roc',            region: 'ouest',     kind: 'castle', x: 198, y: 778, base: true },
  pyke:         { name: 'Pyke',                   region: 'ferislands',kind: 'castle', x: 156, y: 690, base: false },

  /* ---------------- Couronnes / Orages ---------------- */
  portreal:     { name: 'Port-Réal',              region: 'couronnes', kind: 'city',   x: 392, y: 800, base: true },
  peyredragon:  { name: 'Peyredragon',            region: 'couronnes', kind: 'castle', x: 470, y: 768, base: true },
  accalmie:     { name: 'Accalmie',               region: 'orages',    kind: 'castle', x: 432, y: 900, base: false },
  neral:        { name: 'La Néra',                region: 'couronnes', kind: 'wild',   x: 424, y: 812, base: false },

  /* ---------------- Bief / Dorne ---------------- */
  hautjardin:   { name: 'Hautjardin',             region: 'bief',      kind: 'castle', x: 278, y: 928, base: false },
  villevieille: { name: 'Villevieille',           region: 'bief',      kind: 'city',   x: 238, y: 1028, base: false },
  corcolline:   { name: 'Corcolline',             region: 'bief',      kind: 'castle', x: 312, y: 862, base: false },
  lancehelion:  { name: 'Lancehélion',            region: 'dorne',     kind: 'castle', x: 448, y: 1078, base: false },
  tourjoie:     { name: 'La Tour de la Joie',     region: 'dorne',     kind: 'ruin',   x: 336, y: 1096, base: false },

  /* ---------------- Essos : Cités Libres ---------------- */
  braavos:      { name: 'Braavos',                region: 'essosw',    kind: 'city',   x: 566, y: 404, base: true },
  pentos:       { name: 'Pentos',                 region: 'essosw',    kind: 'city',   x: 630, y: 612, base: true },
  norvos:       { name: 'Norvos',                 region: 'essosw',    kind: 'city',   x: 722, y: 556, base: false },
  qohor:        { name: 'Qohor',                  region: 'essosw',    kind: 'city',   x: 804, y: 548, base: false },
  myr:          { name: 'Myr',                    region: 'essosw',    kind: 'city',   x: 622, y: 706, base: false },
  tyrosh:       { name: 'Tyrosh',                 region: 'essosw',    kind: 'city',   x: 584, y: 764, base: false },
  lys:          { name: 'Lys',                    region: 'essosw',    kind: 'city',   x: 626, y: 850, base: false },
  volantis:     { name: 'Volantis',               region: 'essosw',    kind: 'city',   x: 706, y: 838, base: false },

  /* ---------------- Essos : est et sud ---------------- */
  vaesdothrak:  { name: 'Vaes Dothrak',           region: 'dothraki',  kind: 'city',   x: 862, y: 528, base: false },
  merdothrak:   { name: 'La Mer Dothrak',         region: 'dothraki',  kind: 'wild',   x: 812, y: 636, base: false },
  valyria:      { name: 'Valyria',                region: 'essosw',    kind: 'ruin',   x: 762, y: 918, base: true },
  astapor:      { name: 'Astapor',                region: 'esclavagist', kind: 'city', x: 796, y: 976, base: false },
  yunkai:       { name: 'Yunkai',                region: 'esclavagist', kind: 'city', x: 862, y: 968, base: false },
  meereen:      { name: 'Meereen',                region: 'esclavagist', kind: 'city', x: 938, y: 928, base: false },
  qarth:        { name: 'Qarth',                  region: 'esclavagist', kind: 'city', x: 946, y: 1168, base: false },
  desertrouge:  { name: 'Le Désert Rouge',        region: 'esclavagist', kind: 'wild', x: 886, y: 880, base: false },

  /* ---------------- En mer / hors carte ---------------- */
  mer:          { name: 'En mer',                 region: null,        kind: 'wild',   x: 520, y: 620, base: true },
  meretroite:   { name: 'La Mer Étroite',         region: null,        kind: 'wild',   x: 546, y: 480, base: true },

  /* ---------------- Localisations à l'échelle d'une région ----------------
     Utilisées quand un personnage est « quelque part dans » une région, en
     campagne ou en déplacement : le marqueur se pose au centre de la région. */
  nord:         { name: 'Dans le Nord',           region: 'nord',      kind: 'region', x: 244, y: 418, base: false },
  audela:       { name: 'Au-delà du Mur',         region: 'audela',    kind: 'region', x: 262, y: 240, base: true },
  conflans:     { name: 'Dans le Conflans',       region: 'conflans',  kind: 'region', x: 296, y: 744, base: false },
  val:          { name: 'Dans le Val',            region: 'val',       kind: 'region', x: 402, y: 618, base: false },
  essosw:       { name: 'Dans Essos',             region: 'essosw',    kind: 'region', x: 664, y: 664, base: false },
};

/** Nom lisible d'un lieu, sans jamais planter sur un identifiant inconnu. */
export function placeName(id) {
  return PLACES[id] ? PLACES[id].name : '—';
}

/** Nom de la région d'un lieu (chaîne vide si le lieu est hors région). */
export function regionName(id) {
  const p = PLACES[id];
  if (!p || !p.region || !REGIONS[p.region]) return '';
  return REGIONS[p.region].name;
}
