/**
 * Parentés et alliances.
 *
 * DANGER PARTICULIER
 * ----------------------------------------------------------------------------
 * Un arbre de descendance est le pire vecteur de spoiler de toute la série :
 * la filiation EST la révélation. Deux mécanismes protègent l'arbre.
 *
 * 1. `from` — chaque lien porte l'épisode où LE SPECTATEUR l'apprend, pas
 *    l'épisode où le fait devient vrai. Un lien n'est jamais tracé avant.
 *
 * 2. `refuted` — la série avance sur deux filiations officielles et fausses.
 *    Un lien `believed: true` est affiché comme une filiation ordinaire jusqu'à
 *    l'épisode `refuted`, où il devient une simple ligne pointillée
 *    « reconnu officiellement », tandis que le lien réel — daté du même
 *    épisode — apparaît. Avant cette date, l'arbre affiche la version
 *    officielle, sans le moindre indice.
 *
 * Les ancêtres morts avant le début de la série sont datés de leur première
 * mention et marqués `dies` à la même date : leur mort ne peut rien divulguer.
 * En revanche un personnage vivant à son entrée ne reçoit `dies` qu'à
 * l'épisode où il meurt à l'écran.
 *
 * En cas de doute sur une date, on retarde : arriver en retard sur une
 * révélation n'est jamais un spoiler, arriver en avance l'est toujours.
 */

/**
 * Personnages présents uniquement dans l'arbre : ceux qu'on nomme sans les
 * suivre. Ils ne sont pas cliquables et n'ont pas de fiche.
 * `note` doit être vraie dès `from`.
 */
export const KIN = {
  /* ------------------------------- Stark ------------------------------- */
  rickard:   { name: 'Rickard Stark', short: 'Rickard', house: 'stark', from: '1x01', dies: '1x01',
               note: "Seigneur de Winterfell, mort pendant la rébellion." },
  brandonS:  { name: 'Brandon Stark', short: 'Brandon', house: 'stark', from: '1x02', dies: '1x02',
               note: "Frère aîné d'Eddard, mort avant la rébellion." },
  lyanna:    { name: 'Lyanna Stark', short: 'Lyanna', house: 'stark', from: '1x01', dies: '1x01',
               note: "Sœur d'Eddard, promise à Robert Baratheon, morte pendant la rébellion." },

  /* ------------------------------- Tully ------------------------------- */
  hoster:    { name: 'Hoster Tully', short: 'Hoster', house: 'tully', from: '1x03',
               note: "Seigneur de Vivesaigues, père de Catelyn, Lysa et Edmure.", dies: '3x03' },
  jonarryn:  { name: 'Jon Arryn', short: 'Jon Arryn', house: 'arryn', from: '1x01', dies: '1x01',
               note: "Main du Roi, mort peu avant l'arrivée de Robert à Winterfell." },
  robin:     { name: 'Robin Arryn', short: 'Robin', house: 'arryn', from: '1x05',
               note: "Fils unique de Lysa et Jon Arryn, héritier du Val." },

  /* ----------------------------- Lannister ----------------------------- */
  joanna:    { name: 'Joanna Lannister', short: 'Joanna', house: 'lannister', from: '3x01', dies: '3x01',
               note: "Épouse de Tywin, morte en donnant naissance à Tyrion." },
  lancel:    { name: 'Lancel Lannister', short: 'Lancel', house: 'lannister', from: '2x03',
               note: "Cousin des Lannister, ancien écuyer du roi Robert.", dies: '6x10' },

  /* ----------------------------- Targaryen ----------------------------- */
  aerys:     { name: 'Aerys II Targaryen', short: 'Aerys II', house: 'targaryen', from: '1x01', dies: '1x01',
               note: "Le Roi Fou, tué à la fin de la rébellion." },
  rhaegar:   { name: 'Rhaegar Targaryen', short: 'Rhaegar', house: 'targaryen', from: '1x02', dies: '1x02',
               note: "Prince héritier, tué par Robert Baratheon au Trident." },
  elia:      { name: 'Elia Martell', short: 'Elia', house: 'martell', from: '4x01', dies: '4x01',
               note: "Épouse de Rhaegar, sœur d'Oberyn, tuée lors du sac de Port-Réal." },
  rhaego:    { name: 'Rhaego', short: 'Rhaego', house: 'targaryen', from: '1x10', dies: '1x10',
               note: "Fils de Daenerys et Drogo, mort avant de naître." },

  /* ----------------------------- Baratheon ----------------------------- */
  selyse:    { name: 'Selyse Baratheon', short: 'Selyse', house: 'baratheon', from: '3x05',
               note: "Épouse de Stannis, dévote du Maître de la Lumière.", dies: '5x10' },

  /* ------------------------------ Tyrell ------------------------------- */
  mace:      { name: 'Mace Tyrell', short: 'Mace', house: 'tyrell', from: '3x01',
               note: "Seigneur de Hautjardin, père de Margaery et Loras.", dies: '6x10' },

  /* ------------------------------ Martell ------------------------------ */
  doran:     { name: 'Doran Martell', short: 'Doran', house: 'martell', from: '5x02',
               note: "Prince de Dorne, frère aîné d'Oberyn.", dies: '6x01' },
  trystane:  { name: 'Trystane Martell', short: 'Trystane', house: 'martell', from: '5x02',
               note: "Fils de Doran, fiancé à Myrcella Baratheon.", dies: '6x01' },
  obara:     { name: 'Obara Sand', short: 'Obara', house: 'martell', from: '5x04',
               note: "Fille bâtarde d'Oberyn Martell.", dies: '7x02' },
  nymeriaS:  { name: 'Nymeria Sand', short: 'Nymeria S.', house: 'martell', from: '5x04',
               note: "Fille bâtarde d'Oberyn Martell.", dies: '7x02' },
  tyene:     { name: 'Tyene Sand', short: 'Tyene', house: 'martell', from: '5x04',
               note: "Fille bâtarde d'Oberyn et d'Ellaria.", dies: '7x03' },

  /* ------------------------------ Bolton ------------------------------- */
  walda:     { name: 'Walda Frey', short: 'Walda', house: 'frey', from: '4x02',
               note: "Épouse Frey de Roose Bolton.", dies: '6x02' },
  boltonbaby:{ name: 'Le fils de Roose', short: 'Nouveau-né', house: 'bolton', from: '6x02',
               note: "Nouveau-né de Roose et Walda.", dies: '6x02' },

  /* ------------------------------- Frey -------------------------------- */
  roslin:    { name: 'Roslin Frey', short: 'Roslin', house: 'frey', from: '3x09',
               note: "Fille de Walder Frey, mariée à Edmure Tully." },

  /* ------------------------------- Tarly ------------------------------- */
  dickon:    { name: 'Dickon Tarly', short: 'Dickon', house: 'tarly', from: '6x06',
               note: "Frère cadet de Samwell, héritier de Corcolline.", dies: '7x05' },

  /* --------------------------- Peuple libre ---------------------------- */
  craster:   { name: 'Craster', short: 'Craster', house: 'libre', from: '2x02',
               note: "Sauvageon qui tient un manoir au-delà du Mur.", dies: '3x04' },
  petitsam:  { name: 'Petit Sam', short: 'Petit Sam', house: 'libre', from: '3x03',
               note: "Fils de Vère, né au manoir de Craster." },
};

/**
 * Filiations : [parent, enfant, épisode de révélation, options]
 *   bastard  : lien hors mariage (tracé en pointillé)
 *   believed : filiation officielle, vraie aux yeux du monde jusqu'à `refuted`
 *   refuted  : épisode où le spectateur apprend que cette filiation est fausse
 */
export const PARENTS = [
  /* --- Stark ---------------------------------------------------------- */
  ['rickard', 'ned', '1x01'],
  ['rickard', 'brandonS', '1x02'],
  ['rickard', 'lyanna', '1x01'],
  ['rickard', 'benjen', '1x01'],
  ['ned', 'robb', '1x01'],
  ['ned', 'sansa', '1x01'],
  ['ned', 'arya', '1x01'],
  ['ned', 'bran', '1x01'],
  ['ned', 'rickon', '1x01'],
  ['catelyn', 'robb', '1x01'],
  ['catelyn', 'sansa', '1x01'],
  ['catelyn', 'arya', '1x01'],
  ['catelyn', 'bran', '1x01'],
  ['catelyn', 'rickon', '1x01'],
  // la filiation de Jon : version officielle, puis la vraie
  ['ned', 'jon', '1x01', { bastard: true, believed: true, refuted: '6x10' }],
  ['lyanna', 'jon', '6x10'],
  ['rhaegar', 'jon', '7x07'],

  /* --- Tully / Arryn -------------------------------------------------- */
  ['hoster', 'catelyn', '1x03'],
  ['hoster', 'lysa', '1x03'],
  ['hoster', 'edmure', '3x03'],
  ['lysa', 'robin', '1x05'],
  ['jonarryn', 'robin', '1x05'],

  /* --- Lannister ------------------------------------------------------ */
  ['tywin', 'jaime', '1x01'],
  ['tywin', 'cersei', '1x01'],
  ['tywin', 'tyrion', '1x01'],
  ['joanna', 'jaime', '3x01'],
  ['joanna', 'cersei', '3x01'],
  ['joanna', 'tyrion', '3x01'],
  ['cersei', 'joffrey', '1x01'],
  ['cersei', 'tommen', '1x02'],
  ['cersei', 'myrcella', '1x02'],
  // les enfants de la reine : reconnus du roi, puis la vérité
  ['robert', 'joffrey', '1x01', { believed: true, refuted: '1x07' }],
  ['robert', 'tommen', '1x02', { believed: true, refuted: '1x07' }],
  ['robert', 'myrcella', '1x02', { believed: true, refuted: '1x07' }],
  ['jaime', 'joffrey', '1x07'],
  ['jaime', 'tommen', '1x07'],
  ['jaime', 'myrcella', '1x07'],

  /* --- Baratheon ------------------------------------------------------ */
  ['stannis', 'shireen', '3x05'],
  ['selyse', 'shireen', '3x05'],
  ['robert', 'gendry', '3x07', { bastard: true }],

  /* --- Targaryen ------------------------------------------------------ */
  ['aerys', 'rhaegar', '1x02'],
  ['aerys', 'viserys', '1x01'],
  ['aerys', 'daenerys', '1x01'],
  ['daenerys', 'rhaego', '1x10'],
  ['drogo', 'rhaego', '1x10'],

  /* --- Greyjoy -------------------------------------------------------- */
  ['balon', 'theon', '1x01'],
  ['balon', 'yara', '2x02'],

  /* --- Tyrell --------------------------------------------------------- */
  ['olenna', 'mace', '3x02'],
  ['mace', 'margaery', '3x01'],
  ['mace', 'loras', '3x01'],

  /* --- Martell -------------------------------------------------------- */
  ['doran', 'trystane', '5x02'],
  ['oberyn', 'obara', '5x04', { bastard: true }],
  ['oberyn', 'nymeriaS', '5x04', { bastard: true }],
  ['oberyn', 'tyene', '5x04', { bastard: true }],
  ['ellaria', 'tyene', '5x04', { bastard: true }],

  /* --- Bolton / Frey -------------------------------------------------- */
  ['roose', 'ramsay', '3x10', { bastard: true }],
  ['roose', 'boltonbaby', '6x02'],
  ['walda', 'boltonbaby', '6x02'],
  ['walder', 'roslin', '3x09'],
  ['walder', 'walda', '4x02'],

  /* --- Tarly / Mormont ------------------------------------------------ */
  ['randyll', 'samwell', '1x04'],
  ['randyll', 'dickon', '6x06'],
  ['jeor', 'jorah', '5x04'],

  /* --- Reed / Peuple libre -------------------------------------------- */
  ['craster', 'gilly', '2x03'],
  ['gilly', 'petitsam', '3x03'],
];

/**
 * Alliances : [a, b, épisode, type, fin?]
 * `fin` : épisode à partir duquel l'alliance n'existe plus (fiançailles rompues).
 */
export const UNIONS = [
  ['ned', 'catelyn', '1x01', 'mariage'],
  ['robert', 'cersei', '1x01', 'mariage'],
  ['jaime', 'cersei', '1x07', 'liaison'],
  ['tywin', 'joanna', '3x01', 'mariage'],
  ['lysa', 'jonarryn', '1x05', 'mariage'],
  ['lysa', 'petyr', '4x05', 'mariage'],
  ['robb', 'talisa', '2x10', 'mariage'],
  ['edmure', 'roslin', '3x09', 'mariage'],
  ['stannis', 'selyse', '3x05', 'mariage'],
  ['daenerys', 'drogo', '1x01', 'mariage'],
  ['rhaegar', 'elia', '4x01', 'mariage'],
  ['rhaegar', 'lyanna', '7x07', 'mariage'],
  ['renly', 'margaery', '2x03', 'mariage'],
  ['joffrey', 'sansa', '1x01', 'fiançailles', '2x10'],
  ['joffrey', 'margaery', '4x02', 'mariage'],
  ['tommen', 'margaery', '5x03', 'mariage'],
  ['tyrion', 'sansa', '3x08', 'mariage'],
  ['ramsay', 'sansa', '5x06', 'mariage'],
  ['roose', 'walda', '4x02', 'mariage'],
  ['oberyn', 'ellaria', '4x01', 'liaison'],
  ['trystane', 'myrcella', '5x02', 'fiançailles', '5x10'],
];
