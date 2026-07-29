/**
 * Linter de ton.
 *
 * L'audit anti-spoil (tools/spoiler-audit.mjs) vérifie qu'aucun TEXTE d'un
 * épisode non vu n'atteint la page. Il ne peut rien contre un texte
 * parfaitement autorisé qui, par sa formulation, annonce la suite :
 *
 *     « Fait des Stark des otages et non des cadavres — pour l'instant. »
 *
 * Rien n'a fuité, et pourtant le lecteur sait qu'elle changera d'avis.
 * Ce linter traque ces locutions. La règle éditoriale est simple :
 * rapporter l'état des choses à la fin de l'épisode, sans anticipation,
 * sans ironie du narrateur, sans « il ne sait pas encore ».
 *
 * Usage : node tools/lint-tone.mjs
 * Sortie 1 s'il reste des formulations non vérifiées.
 */

import { EPISODES } from '../data/index.js';
import { CHARACTERS } from '../data/characters.js';
import { KIN } from '../data/family.js';

const RULES = [
  [/pour l'instant|pour l'heure|pour le moment/i, "atténuation qui annonce un revirement"],
  [/croit-il|croit-elle|croit encore|se croit/i, "ironie du narrateur : il en sait plus que le lecteur"],
  [/sans savoir (?:que|jusqu|la)/i, "ignorance présentée comme provisoire"],
  [/pas encore|encore faut-il/i, "« pas encore » implique un plus tard"],
  [/bientôt|sous peu|d'ici peu/i, "annonce un délai"],
  [/ne se doute|n'imagine pas|ignore encore/i, "insiste sur ce que le personnage apprendra"],
  [/une dernière fois|la dernière fois/i, "« dernière » n'est vrai qu'avec la suite en main"],
  [/jusqu'à ce que|avant que/i, "subordonnée qui déborde sur l'après"],
  [/attend la suite|la suite\b/i, "renvoi explicite à la suite"],
  [/reviendra|le paiera|lui coûtera|le regrettera|s'en souviendra/i, "futur simple prédictif"],
  [/devrait en revenir|ne devrait pas/i, "pronostic"],
  [/commence à (?:grimper|monter|payer)/i, "amorce d'une trajectoire à venir"],
  [/\bfinira\b/i, "futur simple prédictif"],
  [/ils enverront|va lui demander|va-t-il|va-t-elle/i, "question sur ce qui va se produire"],
];

/**
 * Formulations relues et validées : elles ne parlent que de l'épisode en cours
 * ou d'un fait passé. Comparaison sur la chaîne exacte — une reformulation
 * repasse donc devant le linter.
 */
const ALLOW = [
  "il conseille Bran une dernière fois",           // Luwin meurt dans ce même épisode
  "Surgit une dernière fois",                      // Benjen meurt dans ce même épisode
  "L'amour et le devoir se sont exclus une dernière fois", // dernier épisode de la série
  "Joffrey humilie Sansa jusqu'à ce que Tyrion s'en mêle", // intra-épisode
  "Perd l'envie de vivre, jusqu'à ce que Brienne l'oblige", // intra-épisode
  "qu'elle a un jour souhaité la mort",            // aveu sur le passé
  "meurt sans savoir la vérité",                   // fait acquis dans l'épisode
  "sans savoir que son roi est mort",              // Stannis meurt dans ce même épisode
  "on lui explique qu'elle finira ses jours ici",  // parole prononcée à l'écran
  "Avertie par la Corneille qu'elle devra se battre", // avertissement donné à l'écran
  "et le ramène avant qu'il ne s'y perde",         // intra-épisode
  "commence à écarter Cersei du roi",              // action de l'épisode
  "commence à poser des questions sur Shireen",    // action de l'épisode
  "la Garde de Nuit voit ce qui vient vraiment",   // la bataille a lieu dans l'épisode
];

const allowed = (text) => ALLOW.some((a) => text.includes(a));

let count = 0;
const report = (where, field, text) => {
  for (const [re, why] of RULES) {
    const m = text.match(re);
    if (!m || allowed(text)) continue;
    count += 1;
    console.log(`${where} · ${field}`);
    console.log(`  « ${text.trim()} »`);
    console.log(`  → « ${m[0]} » : ${why}\n`);
    return;                      // une alerte par texte suffit
  }
};

for (const ep of EPISODES) {
  report(ep.code, 'synopsis', ep.synopsis);
  if (ep.cliff) report(ep.code, 'à surveiller', ep.cliff);
  ep.events.forEach((e, i) => report(ep.code, `fait ${i + 1}`, e));
  for (const [id, beat] of Object.entries(ep.beats)) {
    if (!beat) continue;
    const name = CHARACTERS[id] ? CHARACTERS[id].short || CHARACTERS[id].name : id;
    if (beat.did) report(ep.code, `${name} — action`, beat.did);
    if (beat.feel) report(ep.code, `${name} — pensée`, beat.feel);
  }
}

for (const [id, ch] of Object.entries(CHARACTERS)) {
  report('personnage', ch.name, ch.intro);
  for (const arc of ch.arcs || []) report('personnage', `${ch.name} (arc ${arc.from})`, arc.title);
}

for (const k of Object.values(KIN)) report('parenté', k.name, k.note);

console.log(count
  ? `${count} formulation(s) à revoir — reformuler, ou ajouter à ALLOW après relecture.`
  : 'Ton factuel : aucune anticipation détectée.');
process.exit(count ? 1 : 0);
