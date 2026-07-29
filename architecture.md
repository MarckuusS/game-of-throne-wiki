# Architecture — Chroniques (suivi de série anti-spoil)

> Dernière mise à jour : 2026-07-29 (2e passe : ton des données)
> Stack : HTML + CSS + JavaScript (modules ES natifs), aucune dépendance, aucun build. Stockage : localStorage. PWA (manifest + service worker).
> Pattern : données datées → filtre → vues. Routeur par hash, rendu par chaînes HTML.
> Points d'entrée : `index.html` (coquille) → `main.js` (routeur et démarrage)

---

## Arbre des fichiers

```
index.html                  # coquille : topbar, conteneur de vue, tabbar, hôte de modale
main.js                     # point d'entrée — routeur hash, délégation de clics, service worker
styles.css                  # feuille unique, thème sombre, mobile-first, safe-area iOS
manifest.webmanifest        # PWA : nom, icônes, start_url relatif
sw.js                       # cache hors ligne (précache + stale-while-revalidate)
.nojekyll                   # empêche Jekyll de filtrer des fichiers sur GitHub Pages

data/
├── index.js                # agrégation + index dérivés (EPISODES, TIMELINES, DEBUTS…)
├── characters.js           # HOUSES + CHARACTERS (uniquement le non-spoilant)
├── places.js               # PLACES (coordonnées carte) + REGIONS
└── seasons/s1.js … s8.js   # 73 épisodes : synopsis, events, cliff, beats par personnage

src/
├── state.js                # progression persistée — seule source de vérité du « vu »
├── spoiler.js              # LE FILTRE : unique lecteur autorisé de data/
├── ui.js                   # briques HTML partagées (médaillon, badge, modale, toast, esc)
├── map.js                  # géométrie SVG du monde + rendu + pan/zoom
└── views/
    ├── recap.js            # « Reprise » : reprendre après deux semaines
    ├── episodes.js         # liste par saison, validation, fiche épisode
    ├── carte → mapview.js  # carte, filtres, tracé de parcours
    ├── characters.js       # grille + fiche personnage (réutilisée partout)
    └── settings.js         # progression manuelle, mode exploration, sauvegarde, install

assets/                     # icônes générées (PNG 512/192/180 + maskable) + favicon.svg
tools/
├── make_icons.py           # rasteriseur + encodeur PNG en Python pur (aucune lib)
├── spoiler-audit.mjs       # audit anti-spoil automatisé (Playwright)
└── lint-tone.mjs           # linter de ton : traque les formulations qui anticipent
```

---

## Contrats d'interface

### src/state.js
- **Exporte** : `progress() → number`, `exploration() → bool`, `get() → state`,
  `validate(abs)`, `unvalidate(abs)`, `next(total)`, `setProgress(abs)`,
  `setExploration(bool)`, `setTrailChar(id)`, `setMapFilter(f)`, `reset()`,
  `exportJSON() → string`, `importJSON(text)`, `subscribe(fn) → unsubscribe`
- **Consomme** : `localStorage` (clé `chroniques:v1`)
- **Modifié le** : 2026-07-29

### src/spoiler.js
- **Exporte** : `isSeen(abs)`, `currentEpisode()`, `nextEpisode()`, `episodeCard(ep)`,
  `futureCount()`, `seasonStats(s)`, `isUnlocked(id)`, `unlockedIds()`, `lockedCount()`,
  `chronicle(id)`, `lastBeat(id)`, `statusOf(id)`, `placeOf(id)`, `titleOf(id)`,
  `companionsOf(id)`, `appearances(id)`, `visiblePlaceIds()`, `trailOf(id)`,
  `pinsForMap()`, `whereEveryone()`, `lastEpisodeMoves()`, `deathsIn(ep)`,
  `STATUS_LABEL`, + réexport `EPISODES / SEASONS / TOTAL_EPISODES / episodeAt`
- **Consomme** : `data/index.js`, `data/characters.js`, `data/places.js`, `state.progress()`
- **Modifié le** : 2026-07-29

### src/ui.js
- **Exporte** : `esc(s)`, `medal(id, opts)`, `statusBadge(st)`, `placeLabel(id)`,
  `charLabel(id)`, `charShort(id)`, `houseLabel(id)`, `charChip(id)`, `bar(v, t)`,
  `veil(html, hint)`, `toast(msg)`, `openSheet(html)`, `closeSheet()`, `sheetIsOpen()`
- **Consomme** : `data/characters.js`, `data/places.js`, `spoiler.STATUS_LABEL`, DOM (`#sheetHost`)
- **Modifié le** : 2026-07-29

### src/map.js
- **Exporte** : `VIEW`, `renderMap({placeIds, pins, trail, trailChar}) → string`,
  `attachPanZoom(wrap) → { zoomIn, zoomOut, focus(placeId), reset }`
- **Consomme** : `data/places.js`, `characters.houseOf/initials`, `ui.esc`
- **Modifié le** : 2026-07-29

### data/index.js
- **Exporte** : `EPISODES`, `SEASONS`, `TOTAL_EPISODES`, `TIMELINES`, `DEBUTS`,
  `CHARACTER_IDS`, `PLACE_FIRST_SEEN`, `episodeAt(abs)`, `absOf(code)`,
  `fmtCode(s, n)`, `parseCode(str)`, `integrityReport() → string[]`
- **Consomme** : `data/seasons/s1..s8.js`, `data/characters.js`, `data/places.js`
- **Modifié le** : 2026-07-29

### data/characters.js
- **Exporte** : `HOUSES`, `CHARACTERS`, `initials(id)`, `houseOf(id)`, `charName(id)`
- **Consomme** : —
- **Modifié le** : 2026-07-29

### data/places.js
- **Exporte** : `PLACES`, `REGIONS`, `placeName(id)`, `regionName(id)`
- **Consomme** : —
- **Modifié le** : 2026-07-29

### src/views/*.js
- **Exportent** chacun : `renderX() → string` et `bindX(root, rerender)`.
  En plus : `characters.js` exporte `openCharSheet(id)` (fiche réutilisée par
  toutes les vues via la délégation `[data-char]`) ; `episodes.js` exporte
  `openEpisodeSheet(abs)` ; `mapview.js` exporte `setFocus({place, char})`.
- **Consomment** : `src/spoiler.js`, `src/state.js`, `src/ui.js` (+ `src/map.js` pour mapview)
- **Modifié le** : 2026-07-29

---

## Table des relations

| Fichier source | Dépend de | Type | Dépendants (→) |
|---|---|---|---|
| main.js | state, spoiler, ui, data/index, les 5 vues | import direct | — |
| src/spoiler.js | data/index, data/characters, data/places, state | import direct | les 5 vues, main.js |
| src/state.js | localStorage | config | spoiler, vues, main.js |
| src/ui.js | data/characters, data/places, spoiler.STATUS_LABEL | import direct | les 5 vues, map.js |
| src/map.js | data/places, data/characters, ui | import direct | views/mapview.js |
| views/characters.js | spoiler, ui, data/characters | import direct | main.js (+ ouverte par toutes les vues via `[data-char]`) |
| views/recap.js | spoiler, state, ui, data/characters | import direct | main.js |
| views/episodes.js | spoiler, state, ui, data/characters | import direct | main.js |
| views/mapview.js | spoiler, state, map, ui, data/characters | import direct | main.js |
| views/settings.js | spoiler, state, ui | import direct | main.js |
| data/index.js | seasons/s1..s8, characters, places | import direct | spoiler, main.js, tools/spoiler-audit |
| data/seasons/sN.js | — | — | data/index.js |
| sw.js | liste `ASSETS` (chemins en dur) | implicite | tous les fichiers publiés |

---

## Fichiers critiques

| Fichier | Raison | Dépendants |
|---|---|---|
| `src/spoiler.js` | **Sécurité fonctionnelle** : c'est lui qui garantit l'absence de spoiler. Une erreur ici divulgue l'intrigue. | 5 vues + main.js |
| `src/state.js` | Définit ce qui est « vu ». Toute modification change ce que le filtre autorise. | 6 |
| `data/index.js` | Construit tous les index dérivés (débuts, chronologies, premières apparitions de lieux). | 3 |
| `data/places.js` | Les coordonnées doivent rester cohérentes avec la géométrie de `src/map.js`. | 4 |
| `sw.js` | Liste d'assets en dur + version de cache : un oubli sert indéfiniment une vieille version. | tous |
| `data/seasons/*.js` | Le texte lui-même peut spoiler par sa formulation, sans qu'aucune donnée ne fuite. Voir `tools/lint-tone.mjs`. | data/index.js |

---

## Flux de données

### Validation d'un épisode
```
clic sur .tick (views/episodes.js)
  → confirmJump() si l'écart > 1 épisode
    → state.validate(abs)
      → écriture localStorage
      → emit() → main.js paint()
        → route.render() → spoiler.* (bornés par la nouvelle progression)
        → syncChrome() : puce S0xE0y + anneau du logo
```

### Affichage d'une fiche personnage
```
clic sur n'importe quel [data-char] (délégation globale, main.js)
  → openCharSheet(id) (views/characters.js)
    → spoiler.isUnlocked(id)          [refus si pas encore apparu]
    → spoiler.chronicle(id)           [beats des épisodes vus uniquement]
    → spoiler.statusOf / placeOf / titleOf / companionsOf / lastBeat
    → ui.openSheet(html)
```

### Rendu de la carte
```
views/mapview.js
  → spoiler.visiblePlaceIds()   [lieux « base » + lieux déjà visités]
  → spoiler.pinsForMap()        [dernière position connue de chaque débloqué]
  → spoiler.trailOf(char)       [suite des lieux distincts traversés]
  → map.renderMap(...) → chaîne SVG
  → map.attachPanZoom(wrap) → pan/pinch/molette + focus(placeId)
```

---

## Règles métier et invariants

- **Aucune vue ne lit `data/` pour du contenu narratif.** Seuls sont tolérés les
  imports de `data/characters.js` (identité : nom, maison — non spoilant) et de
  `data/places.js` (libellés). Tout le reste passe par `src/spoiler.js`.
- **Progression linéaire** : `progress` = numéro absolu du dernier épisode vu.
  Valider n implique 1..n vus ; dévalider n ramène à n-1. Pas d'ensemble
  d'épisodes vus en désordre — ce serait infiltrable.
- **Un statut (`st`) n'est posé que lorsqu'il change** et se reporte d'épisode en
  épisode (`statusOf` remonte la chronique jusqu'au dernier `st` explicite).
- **Le déblocage d'un personnage est calculé**, pas déclaré : `DEBUTS[id]` = premier
  épisode où il a un beat. Ajouter un beat plus tôt le débloque plus tôt,
  automatiquement.
- **`data/characters.js` ne contient que du vrai-dès-la-première-apparition.**
  Les titres qui évoluent passent par `arcs: [{ from: '1x02', title: … }]`, datés,
  et filtrés par `titleOf()`.
- **Les titres d'épisodes sont des spoilers** : un épisode non vu n'expose ni titre
  ni date de résumé, seulement son code `S0xE0y`.
- **Tous les chemins sont relatifs** (`./`) : l'application doit fonctionner dans un
  sous-dossier GitHub Pages.
- **Tout texte issu des données est échappé** via `ui.esc()` avant insertion.
- **Règle éditoriale (ton)** : un `synopsis`, un `did`, un `feel`, un `cliff`
  décrivent l'état des choses **à la fin de l'épisode**. Interdits : les
  atténuations qui annoncent un revirement (« — pour l'instant »), l'ironie du
  narrateur (« croit-il »), l'ignorance présentée comme provisoire (« sans savoir
  que »), le futur prédictif et les questions qui suggèrent leur réponse
  (« Va-t-elle répondre par le feu ? »). `tools/lint-tone.mjs` les refuse ;
  les formulations relues et légitimes vivent dans sa liste `ALLOW`.
- **Les notes `cliff` sont des constats**, pas des devinettes : elles disent ce qui
  est resté en suspens, sans proposer d'issue.

---

## Pièges connus

- ⚠️ `.sheet-host[hidden] { display: none; }` doit rester **avant/plus fort** que le
  `display: flex` de `.sheet-host` : sinon le voile invisible de la modale
  intercepte tous les clics de la page (bug déjà rencontré).
- ⚠️ Ajouter un fichier sans l'ajouter à `ASSETS` dans `sw.js` : il ne sera pas
  précaché et manquera hors ligne. Et **incrémenter `CACHE`** à chaque déploiement.
- ⚠️ Les coordonnées de `data/places.js` sont dans le repère `viewBox 0 0 1000 1400`
  de `src/map.js`. Modifier les listes `WESTEROS` / `ESSOS` peut mettre un lieu
  dans la mer : vérifier visuellement après tout changement de géométrie.
- ⚠️ `at:` peut désigner un lieu « à l'échelle d'une région » (`nord`, `conflans`,
  `val`, `audela`, `essosw`) quand un personnage est en déplacement. Ce sont de
  vrais lieux dans `PLACES`, avec `kind: 'region'`.
- ⚠️ Ne jamais introduire dans un `synopsis`/`did` un terme qui n'existe pas encore
  à cet épisode (ex. nommer les « Noces Pourpres » avant la saison 4) : c'est un
  spoiler que `spoiler-audit.mjs` ne détecte pas (le texte appartient bien à un
  épisode validé). `lint-tone.mjs` couvre les locutions, pas le vocabulaire :
  celui-ci reste à la vigilance du rédacteur.
- ⚠️ `tools/make_icons.py` n'utilise aucune bibliothèque d'image (aucune n'est
  disponible) : ne pas le « simplifier » avec Pillow sans vérifier l'environnement.
- ⚠️ Les modules ES exigent `http://` : ouvrir `index.html` en `file://` échoue.

---

## Décisions architecturales

| Date | Décision | Raison | Alternative écartée |
|---|---|---|---|
| 2026-07-29 | Statique sans build, modules ES natifs | Publiable tel quel par GitHub Pages, aucune chaîne d'outils à maintenir | Vite/React (build, dépendances, CI) |
| 2026-07-29 | Faits datés à l'épisode plutôt que fiches biographiques | Rend le spoiler structurellement impossible : une fiche est reconstruite depuis les seuls épisodes vus | Fiches complètes + masquage à l'affichage |
| 2026-07-29 | Progression linéaire (un entier) | Toute autre modélisation oblige à afficher ou masquer arbitrairement des trous, et fuit de l'information | Ensemble d'épisodes vus |
| 2026-07-29 | Module `spoiler.js` comme unique lecteur de `data/` | Un seul endroit à auditer ; l'invariant est vérifiable | Filtrage dans chaque vue |
| 2026-07-29 | Carte SVG dessinée à la main | Aucune ressource externe, fonctionne hors ligne, pas de question de droits sur une carte tierce | Image bitmap ou fond de carte externe |
| 2026-07-29 | Titres d'épisodes en version originale | Référence stable et vérifiable ; les titres français varient d'une source à l'autre | Titres français |
| 2026-07-29 | Icônes générées par un script Python maison | Ni Pillow, ni cairosvg, ni ImageMagick dans l'environnement ; iOS exige du PNG pour `apple-touch-icon` | SVG seul (non fiable sur iOS) |
| 2026-07-29 | Audit anti-spoil automatisé (Playwright) | La promesse du produit doit être testable, pas seulement affirmée | Relecture manuelle |
| 2026-07-29 | Linter de ton sur les données | Le filtre technique n'empêche pas un texte autorisé d'annoncer la suite ; c'est une classe d'erreur, elle mérite un outil | Vigilance à la relecture seule |
| 2026-07-29 | Notes « À surveiller » rédigées en constats | Une question oriente vers sa réponse (« Va-t-elle répondre par le feu ? ») | Questions ouvertes |
