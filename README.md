# Chroniques

Carnet de suivi de série avec **anti-spoil structurel** : l'application ne montre
que ce que vous avez déjà vu. Vous validez un épisode, et le monde s'ouvre d'un
épisode — résumés, personnages, positions sur la carte, état d'esprit.

Application web statique, sans build, sans serveur, sans compte.
Installable sur iPhone via *Partager → Sur l'écran d'accueil*.

---

## Ce qu'elle fait

| | |
|---|---|
| **Reprise** | Vous revenez après deux semaines : résumé du dernier épisode vu, qui a bougé, où en est chacun, dans quel état, avec qui, et ce qui restait en suspens. |
| **Épisodes** | Les 73 épisodes par saison. Un épisode non vu n'affiche ni titre ni résumé — le titre seul est déjà un spoiler. Une pression le valide. |
| **Carte** | Le monde connu dessiné en SVG. Les lieux se révèlent quand l'histoire y passe ; les personnages sont posés à leur dernière position connue ; on peut tracer le parcours de n'importe qui, étape par étape. |
| **Personnages** | 79 personnages, débloqués à leur entrée en scène. Trois modes : **liste** (triable, cherchable), **maisons** (regroupés par famille), **arbre** (arbre de descendance d'une maison, avec unions, bâtardises et filiations officielles). Fiche : maison, statut, position, compagnons du moment, famille, ce qu'il pense, et une chronique de tout ce qu'on lui a vu faire. |
| **Réglages** | Progression manuelle, mode exploration (désactivé par défaut), sauvegarde par copier-coller, instructions d'installation. |

## L'anti-spoil, concrètement

Le filtre n'est pas un habillage : il est dans la structure des données.

- Chaque fait est **daté à un épisode**. Il n'existe aucune fiche « biographie de
  X » qui raconterait toute sa vie : la fiche d'un personnage est reconstruite à
  la volée depuis les seuls épisodes validés.
- La progression est **linéaire** (`progress` = numéro du dernier épisode vu).
  Sans cela, il faudrait décider quoi afficher pour quelqu'un qui aurait vu
  l'épisode 40 mais pas le 12 — et toute réponse fuirait quelque chose.
- Les vues **n'accèdent jamais** aux données brutes : tout passe par
  `src/spoiler.js`, seul module autorisé à lire `data/`. Un contenu futur n'est
  pas grisé ni flouté : il n'est pas envoyé dans la page.
- `tools/spoiler-audit.mjs` vérifie cette promesse automatiquement : il ouvre
  l'application à 7 niveaux de progression, parcourt les 5 vues (saisons
  dépliées) et cherche dans le DOM le moindre fragment de texte appartenant à un
  épisode non validé, ainsi que les noms des personnages pas encore apparus.
- `tools/lint-tone.mjs` s'attaque au spoiler que l'audit ne peut pas voir : la
  **formulation**. « Fait des Stark des otages et non des cadavres — pour
  l'instant » ne divulgue rien, et pourtant on sait qu'elle changera d'avis. Le
  linter traque ces locutions (`pour l'instant`, `croit-il`, `pas encore`,
  `sans savoir que`, `bientôt`, futur prédictif…). Règle éditoriale : rapporter
  l'état des choses à la fin de l'épisode, sans anticipation ni ironie du
  narrateur.

```
✓ progression  0 / 73 — aucune fuite
✓ progression  9 / 73 — aucune fuite
✓ progression 29 / 73 — aucune fuite
✓ progression 55 / 73 — aucune fuite
✓ progression 72 / 73 — aucune fuite
```

### Le cas de l'arbre de descendance

La filiation *est* la révélation, dans cette série. L'arbre applique donc deux
règles supplémentaires (`data/family.js`) :

- chaque lien porte l'épisode où **le spectateur** l'apprend — pas celui où le
  fait devient vrai. Un lien n'est jamais tracé avant ;
- les deux filiations **officielles et fausses** de la série sont modélisées
  comme telles : un lien `believed` s'affiche comme une filiation ordinaire
  jusqu'à l'épisode `refuted`, où il devient une ligne pointillée « reconnu »
  et où le lien réel apparaît. Avant cette date, l'arbre montre la version
  officielle, sans le moindre indice.

Corollaire, aussi important que le reste : un lien ne doit pas non plus être
révélé **plus tard** que la série. La série nomme Tywin Lannister au Conseil
restreint (S01E03) et ne le montre qu'en S01E07 : attendre S01E07 pour dessiner
sa paternité, ce serait retarder une information déjà donnée. D'où le champ
`mentioned` dans `data/characters.js` — l'épisode où un nom est prononcé, quand
c'est avant la première apparition. Le lien se trace alors au bon moment, avec
une carte en pointillé « nom connu, pas encore rencontré » : pas de fiche, pas
de chronique, pas d'état. On a entendu le nom, rien de plus.

`integrityReport()` refuse un lien vers un inconnu, un démenti antérieur à sa
révélation, ou un lien daté **avant** que le nom de l'une de ses extrémités ne
soit connu. `familyDeferrals()` liste les liens que le filtre repousse encore —
la liste doit rester vide.

## Publier sur GitHub Pages

Aucune étape de build : le dépôt se publie tel quel.

1. **Settings → Pages**
2. *Source* : **Deploy from a branch**
3. *Branch* : `claude/got-wiki-app-n13hsw` (ou `main` après fusion), dossier `/ (root)`
4. Enregistrer. L'adresse est
   `https://<utilisateur>.github.io/game-of-throne-wiki/`

Les chemins sont tous relatifs (`./`), l'application fonctionne donc dans un
sous-dossier. `.nojekyll` est présent pour que Jekyll ne filtre aucun fichier.

## Installer sur iPhone

1. Ouvrir l'adresse dans **Safari** (iOS ne permet l'ajout à l'écran d'accueil
   que depuis Safari).
2. Bouton **Partager** → **Sur l'écran d'accueil** → **Ajouter**.

L'application s'ouvre alors en plein écran, avec son icône, et fonctionne hors
ligne (service worker). La progression est stockée sur l'appareil.

## Développer

```bash
npx http-server -p 8099 -s .          # n'importe quel serveur statique fait l'affaire
# les modules ES exigent http:// — ouvrir index.html en file:// ne marchera pas

node tools/spoiler-audit.mjs           # audit anti-spoil (Playwright)
node tools/lint-tone.mjs               # linter de ton : aucune anticipation dans les textes
python3 tools/make_icons.py            # régénère les icônes PNG
```

Il n'y a pas de dépendance à installer. `data/index.js` expose
`integrityReport()`, appelé au démarrage : toute incohérence (personnage ou lieu
inconnu dans un beat) est signalée dans la console sans rien casser.

## Ajouter du contenu

Un épisode, dans `data/seasons/sN.js` :

```js
{
  n: 4, title: 'Titre original', air: '2011-05-08',
  synopsis: "Deux ou trois phrases.",
  events: ["Fait marquant.", "Autre fait."],
  cliff: "La question laissée ouverte à la fin.",
  beats: {
    arya: { at: 'portreal', did: "Ce qu'elle fait.", feel: "Ce qu'elle pense.", st: 'fuite' },
  },
}
```

- `at` : identifiant de `data/places.js` (le marqueur se place tout seul sur la carte).
- `st` : `ok · blesse · captif · fuite · disparu · exil · mue · mort`.
  À ne poser **que** lorsque le statut change : il est reporté d'épisode en épisode.
- `with` : compagnons explicites. Omis, ils sont déduits des personnages présents
  au même endroit dans le même épisode.
- Un personnage se débloque au premier épisode où il a un beat — rien à déclarer
  ailleurs. `data/characters.js` ne contient que ce qui est vrai dès sa première
  apparition.
- Une parenté s'ajoute dans `data/family.js` : `['tywin', 'jaime', '1x03']`, la
  date étant celle où **le spectateur** l'apprend. Un parent jamais suivi se
  déclare dans `KIN` ; un personnage suivi mais nommé avant d'apparaître reçoit
  `mentioned` dans `data/characters.js`. `node tools/spoiler-audit.mjs` vérifie
  ensuite qu'aucun lien, nom ou présentation n'apparaît avant sa date.
- **Ton** : décrire l'état des choses à la fin de l'épisode. Pas de « pour
  l'instant », pas de « croit-il », pas de « sans savoir que » — `lint-tone.mjs`
  les refuse. Une formulation relue et légitime (fait passé, événement
  intra-épisode) s'ajoute à sa liste `ALLOW`.

Après modification, incrémenter `CACHE` dans `sw.js` pour que les appareils déjà
installés récupèrent la nouvelle version.

## Notes

- Les titres d'épisodes sont donnés en **version originale** : c'est la seule
  référence stable d'un tracker à l'autre.
- Application non officielle, sans lien avec les ayants droit de l'œuvre.
  Aucune donnée ne quitte l'appareil : pas de compte, pas d'analytique, aucune
  requête réseau sortante.
