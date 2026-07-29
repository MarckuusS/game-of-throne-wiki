/**
 * Maisons et personnages.
 *
 * RÈGLE ANTI-SPOIL FONDAMENTALE
 * ----------------------------------------------------------------------------
 * Ce fichier ne contient AUCUNE information qui ne soit pas déjà vraie à la
 * première apparition du personnage. Pas de destin, pas de révélation, pas de
 * lien de parenté caché. Tout le reste (ce qu'il fait, ce qu'il pense, où il
 * est, dans quel état) vit dans les beats d'épisodes (data/seasons/*.js) et
 * n'est donc lisible qu'une fois l'épisode validé.
 *
 * `arcs` est la seule exception, et elle est datée : chaque titre porte le code
 * de l'épisode à partir duquel il devient connu. Le moteur ne montre jamais un
 * arc dont le code est postérieur à la progression.
 *
 * Le déblocage d'un personnage n'est PAS déclaré ici : il est calculé depuis le
 * premier épisode où le personnage a un beat (cf. data/index.js -> debutOf).
 */

export const HOUSES = {
  stark:       { name: 'Stark',            color: '#5f7385', glyph: '❄', words: "L'hiver vient" },
  lannister:   { name: 'Lannister',        color: '#9c2f2a', glyph: '⚜', words: 'Entends-moi rugir' },
  targaryen:   { name: 'Targaryen',        color: '#6d1414', glyph: '✹', words: 'Feu et Sang' },
  baratheon:   { name: 'Baratheon',        color: '#a8862a', glyph: '✦', words: 'Nôtre est la fureur' },
  greyjoy:     { name: 'Greyjoy',          color: '#2f4f52', glyph: '≈', words: 'Nous ne semons pas' },
  tyrell:      { name: 'Tyrell',           color: '#43704a', glyph: '✿', words: 'Croître et se dresser' },
  martell:     { name: 'Martell',          color: '#b85c22', glyph: '☉', words: 'Insoumis, invaincus, intacts' },
  tully:       { name: 'Tully',            color: '#2f5f7a', glyph: '〜', words: 'Famille, Devoir, Honneur' },
  arryn:       { name: 'Arryn',            color: '#4a6c8f', glyph: '△', words: "Aussi haut que l'honneur" },
  bolton:      { name: 'Bolton',           color: '#6a2b2b', glyph: '✖', words: 'Nos lames sont acérées' },
  frey:        { name: 'Frey',             color: '#4b4a6b', glyph: '◈', words: '' },
  mormont:     { name: 'Mormont',          color: '#3c5445', glyph: '❋', words: 'Ici nous veillons' },
  tarly:       { name: 'Tarly',            color: '#5a6b3a', glyph: '❦', words: 'Le premier au combat' },
  clegane:     { name: 'Clegane',          color: '#3f4b52', glyph: '✜', words: '' },
  garde:       { name: 'Garde de Nuit',    color: '#242a31', glyph: '☾', words: 'Et ma garde commence' },
  libre:       { name: 'Peuple Libre',     color: '#4d5b63', glyph: '⌇', words: '' },
  baelish:     { name: 'Baelish',          color: '#4a5a4a', glyph: '◇', words: '' },
  toile:       { name: "Petits Oiseaux",   color: '#55506b', glyph: '✤', words: '' },
  // pas de devise ici : la formule des Sans-Visage n'est prononcée qu'en S02E10,
  // et la vue Maisons l'affichait dès la saison 1 (fuite trouvée par l'audit)
  sansvisage:  { name: 'Sans-Visage',      color: '#46464e', glyph: '◐', words: '' },
  essos:       { name: 'Essos',            color: '#7a5f36', glyph: '◉', words: '' },
  dothraki:    { name: 'Dothrakis',        color: '#7a5230', glyph: '⌁', words: '' },
  foi:         { name: 'La Foi',           color: '#6f6248', glyph: '✧', words: '' },
  freres:      { name: 'Confrérie',        color: '#7a4b2a', glyph: '✵', words: '' },
  reed:        { name: 'Reed',             color: '#4c6b5a', glyph: '❈', words: '' },
  autres:      { name: 'Les Autres',       color: '#3f7a92', glyph: '❊', words: '' },
  citadelle:   { name: 'La Citadelle',     color: '#5a5a4a', glyph: '✚', words: '' },
};

/**
 * intro     : vrai dès la première apparition, jamais au-delà.
 * arcs      : titres qui apparaissent au fil du récit, chacun daté.
 * mentioned : épisode où le nom est prononcé à l'écran, quand c'est AVANT la
 *             première apparition. Sert uniquement à l'arbre de parenté : un
 *             lien peut alors se tracer au rythme de la série, avec une carte
 *             « mentionné, pas encore rencontré ». Ne débloque ni fiche, ni
 *             chronique, ni présence dans la liste des personnages.
 */
export const CHARACTERS = {
  /* ------------------------------- Stark ------------------------------- */
  ned:      { name: 'Eddard Stark', short: 'Ned', house: 'stark',
              intro: "Seigneur de Winterfell et Gardien du Nord, ami de jeunesse du roi Robert.",
              arcs: [{ from: '1x02', title: 'Main du Roi' }] },
  catelyn:  { name: 'Catelyn Stark', short: 'Catelyn', house: 'tully',
              intro: "Née Tully de Vivesaigues, épouse d'Eddard Stark et dame de Winterfell." },
  robb:     { name: 'Robb Stark', short: 'Robb', house: 'stark',
              intro: "Fils aîné d'Eddard Stark, héritier de Winterfell.",
              arcs: [{ from: '1x10', title: 'Roi du Nord' }] },
  sansa:    { name: 'Sansa Stark', short: 'Sansa', house: 'stark',
              intro: "Fille aînée des Stark, élevée dans les chansons et les belles manières." },
  arya:     { name: 'Arya Stark', short: 'Arya', house: 'stark',
              intro: "Fille cadette des Stark, rétive à tout ce qu'on attend d'une dame." },
  bran:     { name: 'Brandon Stark', short: 'Bran', house: 'stark',
              intro: "Troisième fils des Stark, grimpeur infatigable des murs de Winterfell." },
  rickon:   { name: 'Rickon Stark', short: 'Rickon', house: 'stark',
              intro: "Le plus jeune des enfants Stark." },
  jon:      { name: 'Jon Snow', short: 'Jon', house: 'garde',
              intro: "Fils bâtard d'Eddard Stark, élevé à Winterfell parmi les enfants légitimes.",
              arcs: [{ from: '1x03', title: 'Frère juré de la Garde de Nuit' }] },
  benjen:   { name: 'Benjen Stark', short: 'Benjen', house: 'garde',
              intro: "Frère cadet d'Eddard, Premier Patrouilleur de la Garde de Nuit." },
  luwin:    { name: 'Mestre Luwin', short: 'Luwin', house: 'citadelle',
              intro: "Mestre de Winterfell, précepteur et conseiller des enfants Stark." },
  hodor:    { name: 'Hodor', short: 'Hodor', house: 'stark',
              intro: "Palefrenier colossal de Winterfell. Ne dit qu'un mot : « Hodor »." },
  osha:     { name: 'Osha', short: 'Osha', house: 'libre',
              intro: "Sauvageonne venue d'au-delà du Mur." },

  /* ----------------------------- Lannister ----------------------------- */
  tywin:    { name: 'Tywin Lannister', short: 'Tywin', house: 'lannister',
              mentioned: '1x03',   // nommé au Conseil restreint avant d'apparaître
              intro: "Seigneur de Castral Roc, chef de la maison Lannister, l'homme le plus riche des Sept Couronnes." },
  cersei:   { name: 'Cersei Lannister', short: 'Cersei', house: 'lannister',
              intro: "Reine des Sept Couronnes, épouse de Robert Baratheon." },
  jaime:    { name: 'Jaime Lannister', short: 'Jaime', house: 'lannister',
              intro: "Frère jumeau de Cersei, garde royal surnommé le Régicide depuis la chute des Targaryen." },
  tyrion:   { name: 'Tyrion Lannister', short: 'Tyrion', house: 'lannister',
              intro: "Cadet des Lannister, nain, tenu à distance par son père. Lit et boit beaucoup." },
  joffrey:  { name: 'Joffrey Baratheon', short: 'Joffrey', house: 'lannister',
              intro: "Prince héritier, fils de Robert et Cersei." },
  tommen:   { name: 'Tommen Baratheon', short: 'Tommen', house: 'lannister',
              mentioned: '1x02',   // nommé dans le cortège royal avant d'avoir une scène
              intro: "Second fils de Robert et Cersei, enfant doux et effacé." },
  myrcella: { name: 'Myrcella Baratheon', short: 'Myrcella', house: 'lannister',
              mentioned: '1x02',   // nommée dans le cortège royal avant d'avoir une scène
              intro: "Fille de Robert et Cersei." },
  bronn:    { name: 'Bronn', short: 'Bronn', house: 'lannister',
              intro: "Reître sans terres ni scrupules, vend son épée au plus offrant." },
  shae:     { name: 'Shae', short: 'Shae', house: 'essos',
              intro: "Prostituée rencontrée dans un camp d'armée, mordante et sans illusions." },
  qyburn:   { name: 'Qyburn', short: 'Qyburn', house: 'citadelle',
              intro: "Ancien mestre chassé de la Citadelle pour ses expériences." },
  gregor:   { name: 'Gregor Clegane', short: 'Gregor', house: 'clegane',
              intro: "Chevalier colossal au service des Lannister, surnommé la Montagne qui Chevauche." },
  sandor:   { name: 'Sandor Clegane', short: 'le Limier', house: 'clegane',
              intro: "Garde du prince Joffrey, visage brûlé, mépris affiché pour la chevalerie." },
  podrick:  { name: 'Podrick Payne', short: 'Podrick', house: 'lannister',
              intro: "Jeune écuyer maladroit et loyal." },

  /* ----------------------------- Targaryen ----------------------------- */
  daenerys: { name: 'Daenerys Targaryen', short: 'Daenerys', house: 'targaryen',
              intro: "Dernière fille du roi Aerys, née en exil, sans autre bien que son nom.",
              arcs: [{ from: '1x02', title: 'Khaleesi des Dothrakis' }] },
  viserys:  { name: 'Viserys Targaryen', short: 'Viserys', house: 'targaryen',
              intro: "Frère de Daenerys, se proclame roi légitime des Sept Couronnes depuis Essos." },
  drogo:    { name: 'Khal Drogo', short: 'Drogo', house: 'dothraki',
              intro: "Khal d'un khalasar de quarante mille cavaliers, jamais vaincu." },
  jorah:    { name: 'Jorah Mormont', short: 'Jorah', house: 'mormont',
              intro: "Chevalier de Westeros exilé à Essos, se met au service des Targaryen." },
  missandei:{ name: 'Missandei', short: 'Missandei', house: 'essos',
              intro: "Esclave de Naath, interprète parlant dix-neuf langues." },
  greyworm: { name: 'Ver Gris', short: 'Ver Gris', house: 'essos',
              intro: "Soldat eunuque des Immaculés, entraîné à la guerre depuis l'enfance." },
  daario:   { name: 'Daario Naharis', short: 'Daario', house: 'essos',
              intro: "Capitaine mercenaire des Puînés, aussi sûr de lui que de sa lame." },
  barristan:{ name: 'Barristan Selmy', short: 'Barristan', house: 'baratheon',
              intro: "Lord Commandant de la Garde Royale, chevalier le plus respecté du royaume." },

  /* ----------------------------- Baratheon ----------------------------- */
  robert:   { name: 'Robert Baratheon', short: 'Robert', house: 'baratheon',
              intro: "Roi des Sept Couronnes depuis la Rébellion, plus attaché à la chasse qu'au trône." },
  renly:    { name: 'Renly Baratheon', short: 'Renly', house: 'baratheon',
              intro: "Plus jeune frère du roi, seigneur d'Accalmie et maître des lois." },
  stannis:  { name: 'Stannis Baratheon', short: 'Stannis', house: 'baratheon',
              intro: "Frère cadet du roi, seigneur de Peyredragon, inflexible sur le devoir." },
  davos:    { name: 'Davos Mervault', short: 'Davos', house: 'baratheon',
              intro: "Ancien contrebandier anobli, main droite de Stannis." },
  melisandre:{ name: 'Mélisandre', short: 'Mélisandre', house: 'foi',
              intro: "Prêtresse rouge d'Asshaï, servante du Maître de la Lumière." },
  shireen:  { name: 'Shireen Baratheon', short: 'Shireen', house: 'baratheon',
              intro: "Fille unique de Stannis, marquée au visage par la léprose." },
  gendry:   { name: 'Gendry', short: 'Gendry', house: 'baratheon',
              intro: "Apprenti forgeron de Port-Réal, orphelin de mère, père inconnu." },

  /* -------------------------- Garde de Nuit ---------------------------- */
  samwell:  { name: 'Samwell Tarly', short: 'Sam', house: 'tarly',
              intro: "Fils de lord Randyll Tarly, envoyé au Mur faute d'être un guerrier." },
  jeor:     { name: 'Jeor Mormont', short: 'Jeor', house: 'garde',
              intro: "Lord Commandant de la Garde de Nuit, dit le Vieil Ours." },
  aemon:    { name: 'Mestre Aemon', short: 'Aemon', house: 'garde',
              intro: "Mestre aveugle de Châteaunoir, au Mur depuis des décennies." },
  alliser:  { name: 'Alliser Thorne', short: 'Alliser', house: 'garde',
              intro: "Maître d'armes de Châteaunoir, brutal avec les recrues." },
  gilly:    { name: 'Vère', short: 'Vère', house: 'libre',
              intro: "Jeune femme du peuple libre, née au manoir de Craster." },
  ygritte:  { name: 'Ygrid', short: 'Ygrid', house: 'libre',
              intro: "Combattante du peuple libre, archère et libre de parole." },
  mance:    { name: 'Mance Rayder', short: 'Mance', house: 'libre',
              intro: "Ancien frère de la Garde de Nuit devenu Roi d'au-delà du Mur." },
  tormund:  { name: 'Tormund', short: 'Tormund', house: 'libre',
              intro: "Chef de guerre du peuple libre, rieur et increvable." },

  /* ---------------------------- Le Val / Nord -------------------------- */
  petyr:    { name: 'Petyr Baelish', short: 'Littlefinger', house: 'baelish',
              intro: "Grand argentier du royaume, parti de rien, propriétaire de bordels et de secrets." },
  varys:    { name: 'Varys', short: 'Varys', house: 'toile',
              intro: "Maître des chuchoteurs, eunuque, réseau d'informateurs dans tout le monde connu." },
  pycelle:  { name: 'Grand Mestre Pycelle', short: 'Pycelle', house: 'citadelle',
              intro: "Grand Mestre du Donjon Rouge, au service des rois depuis très longtemps." },
  lysa:     { name: 'Lysa Arryn', short: 'Lysa', house: 'arryn',
              mentioned: '1x01',   // nommée dans la lettre que Catelyn reçoit
              intro: "Sœur de Catelyn, veuve de Jon Arryn, régente du Val." },
  brienne:  { name: 'Brienne de Torth', short: 'Brienne', house: 'baratheon',
              intro: "Guerrière de Torth, plus grande et plus forte que la plupart des chevaliers." },

  /* ------------------------------ Tyrell ------------------------------- */
  margaery: { name: 'Margaery Tyrell', short: 'Margaery', house: 'tyrell',
              intro: "Fille de lord Mace Tyrell, aussi habile en politique qu'en séduction." },
  loras:    { name: 'Loras Tyrell', short: 'Loras', house: 'tyrell',
              intro: "Le Chevalier des Fleurs, jouteur adulé du Bief." },
  olenna:   { name: 'Olenna Tyrell', short: 'Olenna', house: 'tyrell',
              intro: "Doyenne des Tyrell, langue la plus acérée des Sept Couronnes." },
  randyll:  { name: 'Randyll Tarly', short: 'Randyll', house: 'tarly',
              mentioned: '1x04',   // nommé par Samwell dès son arrivée au Mur
              intro: "Seigneur de Corcolline, réputé le meilleur commandant du Bief." },

  /* ------------------------- Fer & Bolton ------------------------------ */
  theon:    { name: 'Theon Greyjoy', short: 'Theon', house: 'greyjoy',
              intro: "Fils de Balon Greyjoy, pupille des Stark depuis la rébellion de son père." },
  balon:    { name: 'Balon Greyjoy', short: 'Balon', house: 'greyjoy',
              mentioned: '1x01',   // nommé dès la présentation de Theon
              intro: "Seigneur des Îles de Fer, vaincu jadis par Robert Baratheon." },
  yara:     { name: 'Yara Greyjoy', short: 'Yara', house: 'greyjoy',
              intro: "Fille de Balon, commande des navires et des hommes." },
  euron:    { name: 'Euron Greyjoy', short: 'Euron', house: 'greyjoy',
              intro: "Frère de Balon, écumeur exilé, de retour aux Îles de Fer." },
  roose:    { name: 'Roose Bolton', short: 'Roose', house: 'bolton',
              intro: "Seigneur de Fort-Terreur, bannerman des Stark, voix douce et regard froid." },
  ramsay:   { name: 'Ramsay Snow', short: 'Ramsay', house: 'bolton',
              intro: "Jeune homme du Nord au service des Bolton." },

  /* ----------------------------- Conflans ------------------------------ */
  walder:   { name: 'Walder Frey', short: 'Walder', house: 'frey',
              intro: "Seigneur du Pont, maître des Jumeaux et d'une descendance innombrable." },
  edmure:   { name: 'Edmure Tully', short: 'Edmure', house: 'tully',
              intro: "Frère de Catelyn, héritier de Vivesaigues." },
  blackfish:{ name: 'Brynden Tully', short: 'le Silure', house: 'tully',
              intro: "Oncle de Catelyn, capitaine réputé, brouillé avec son frère." },
  talisa:   { name: 'Talisa Maegyr', short: 'Talisa', house: 'essos',
              intro: "Guérisseuse venue de Volantis, soigne les blessés des deux camps." },
  thoros:   { name: 'Thoros de Myr', short: 'Thoros', house: 'freres',
              intro: "Prêtre rouge devenu buveur et bretteur, membre de la Confrérie." },
  beric:    { name: 'Beric Dondarrion', short: 'Beric', house: 'freres',
              intro: "Chevalier hors-la-loi, chef de la Confrérie sans Bannières." },

  /* ------------------------------ Dorne -------------------------------- */
  oberyn:   { name: 'Oberyn Martell', short: 'Oberyn', house: 'martell',
              intro: "Prince de Dorne, dit la Vipère Rouge, poison et plaisirs." },
  ellaria:  { name: 'Ellaria Sand', short: 'Ellaria', house: 'martell',
              intro: "Amante d'Oberyn Martell, bâtarde de Dorne." },

  /* -------------------------- Braavos / autres ------------------------- */
  syrio:    { name: "Syrio Forel", short: 'Syrio', house: 'sansvisage',
              intro: "Ancien Premier Bretteur de Braavos, maître d'armes à l'eau." },
  jaqen:    { name: "Jaqen H'ghar", short: 'Jaqen', house: 'sansvisage',
              intro: "Prisonnier venu de Lorath, poli jusqu'au malaise." },
  jojen:    { name: 'Jojen Reed', short: 'Jojen', house: 'reed',
              intro: "Fils de Howland Reed, sujet à des rêves qui se réalisent." },
  meera:    { name: 'Meera Reed', short: 'Meera', house: 'reed',
              intro: "Sœur de Jojen, chasseuse au filet et au trident." },
  corbeau:  { name: 'La Corneille à Trois Yeux', short: 'la Corneille', house: 'autres',
              intro: "Présence ancienne qui appelle Bran dans ses visions." },
  roiNuit:  { name: 'Le Roi de la Nuit', short: 'Roi de la Nuit', house: 'autres',
              intro: "Chef des Autres, au-delà du Mur." },
  highsparrow:{ name: 'Grand Moineau', short: 'Grand Moineau', house: 'foi',
              intro: "Septon errant à la tête des Moineaux, hostile aux puissants." },
  lyannaM:  { name: 'Lyanna Mormont', short: 'Lyanna M.', house: 'mormont',
              intro: "Très jeune dame d'Île-aux-Ours, seule à la tête de sa maison." },
};

/** Initiales affichées dans le médaillon. */
export function initials(id) {
  const c = CHARACTERS[id];
  if (!c) return '?';
  const parts = c.name.replace(/^(Mestre|Grand Mestre|Khal|Le |La )/, '').trim().split(/[\s'’]+/);
  const first = parts[0] ? parts[0][0] : '';
  const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return (first + last).toUpperCase();
}

export function houseOf(id) {
  const c = CHARACTERS[id];
  return (c && HOUSES[c.house]) ? HOUSES[c.house] : HOUSES.garde;
}

export function charName(id) {
  return CHARACTERS[id] ? CHARACTERS[id].name : id;
}
