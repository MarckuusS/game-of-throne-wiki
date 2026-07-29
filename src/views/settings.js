/**
 * Vue Réglages : progression manuelle, mode exploration, sauvegarde, installation.
 */

import * as S from '../spoiler.js';
import * as state from '../state.js';
import { esc, openSheet, closeSheet, toast } from '../ui.js';

export function renderSettings() {
  const p = state.progress();
  const expl = state.exploration();

  const options = S.EPISODES.map((ep) => `<option value="${ep.abs}"${ep.abs === p ? ' selected' : ''}>${esc(ep.code)}${
    S.isSeen(ep.abs) ? ' — ' + esc(ep.title) : ''}</option>`).join('');

  return `
    <div class="section">
      <h2>Progression</h2>
      <div class="card">
        <div class="row">
          <div class="r-body">
            <div class="r-title">Dernier épisode vu</div>
            <div class="r-desc">Tout ce qui précède est considéré comme vu, tout ce qui suit reste scellé.</div>
          </div>
        </div>
        <select id="progSelect" aria-label="Dernier épisode vu">
          <option value="0"${p === 0 ? ' selected' : ''}>Aucun épisode vu</option>
          ${options}
        </select>
        <div class="btn-row" style="margin-top:12px">
          <button class="btn btn-danger" id="resetBtn">Tout réinitialiser</button>
        </div>
      </div>
    </div>

    <div class="section">
      <h2>Anti-spoil</h2>
      <div class="card">
        <div class="row">
          <div class="r-body">
            <div class="r-title">Mode exploration</div>
            <div class="r-desc">Désactivé, l'application ne charge jamais le contenu non vu dans la page.
            Activé, elle affiche les blocs à venir floutés, révélables au toucher. À n'utiliser
            qu'en connaissance de cause.</div>
          </div>
          <button class="switch" id="explSwitch" role="switch" aria-checked="${expl}" aria-label="Mode exploration"></button>
        </div>
        <div class="row">
          <div class="r-body">
            <div class="r-title">Ce qui reste caché</div>
            <div class="r-desc">${S.futureCount()} épisode${S.futureCount() > 1 ? 's' : ''} ·
            ${S.lockedCount()} personnage${S.lockedCount() > 1 ? 's' : ''} pas encore entré${S.lockedCount() > 1 ? 's' : ''} en scène.</div>
          </div>
        </div>
      </div>
    </div>

    <div class="section">
      <h2>Sauvegarde</h2>
      <div class="card">
        <div class="r-desc" style="margin-bottom:10px">La progression est stockée sur l'appareil, sans compte
        ni serveur. Pour la transférer, copiez ce texte et collez-le sur l'autre appareil.</div>
        <textarea id="ioBox" spellcheck="false" aria-label="Sauvegarde">${esc(state.exportJSON())}</textarea>
        <div class="btn-row" style="margin-top:10px">
          <button class="btn" id="copyBtn">Copier</button>
          <button class="btn btn-ghost" id="importBtn">Importer le contenu du champ</button>
        </div>
      </div>
    </div>

    <div class="section">
      <h2>Installer sur iPhone</h2>
      <div class="card">
        <ol class="bullets" style="list-style:decimal">
          <li>Ouvrir cette page dans <strong>Safari</strong> (pas Chrome : iOS n'autorise que Safari).</li>
          <li>Toucher le bouton <strong>Partager</strong> (le carré avec une flèche).</li>
          <li>Choisir <strong>Sur l'écran d'accueil</strong>, puis <strong>Ajouter</strong>.</li>
        </ol>
        <p class="tiny faint" style="margin-top:8px">L'icône apparaît alors comme une application, en plein
        écran et sans barre d'adresse. Le contenu est mis en cache : elle fonctionne hors ligne.</p>
      </div>
    </div>

    <div class="section">
      <h2>À propos</h2>
      <div class="card">
        <p class="small muted" style="margin:0">Chroniques est un carnet de suivi personnel : ${S.TOTAL_EPISODES} épisodes,
        ${S.EPISODES.reduce((n, e) => n + Object.keys(e.beats).length, 0)} fiches de situation, une carte dessinée à la main.
        Les titres d'épisodes sont donnés en version originale, seule référence stable.</p>
        <p class="tiny faint" style="margin:10px 0 0">Application non officielle, sans lien avec les ayants droit
        de l'œuvre. Aucune donnée ne quitte votre appareil.</p>
      </div>
    </div>
  `;
}

export function bindSettings(root, rerender) {
  const sel = root.querySelector('#progSelect');
  if (sel) sel.addEventListener('change', () => {
    state.setProgress(Number(sel.value));
    toast('Progression mise à jour');
  });

  const reset = root.querySelector('#resetBtn');
  if (reset) reset.addEventListener('click', () => {
    openSheet(`
      <h2 style="margin-bottom:10px">Tout réinitialiser ?</h2>
      <p class="small muted">La progression revient à zéro : plus aucun épisode, personnage ou lieu
      ne sera visible. C'est irréversible.</p>
      <div class="btn-row" style="margin-top:16px">
        <button class="btn btn-danger" id="resYes">Réinitialiser</button>
        <button class="btn btn-ghost" id="resNo">Annuler</button>
      </div>`);
    document.getElementById('resYes').addEventListener('click', () => {
      state.reset(); closeSheet(); toast('Progression remise à zéro');
    });
    document.getElementById('resNo').addEventListener('click', closeSheet);
  });

  const sw = root.querySelector('#explSwitch');
  if (sw) sw.addEventListener('click', () => {
    if (state.exploration()) { state.setExploration(false); return; }
    openSheet(`
      <h2 style="margin-bottom:10px">Activer le mode exploration ?</h2>
      <p class="small muted">Le contenu des épisodes non vus sera présent dans la page, flouté.
      Un toucher suffit à le révéler — y compris par accident. C'est exactement ce que
      cette application est faite pour éviter.</p>
      <div class="btn-row" style="margin-top:16px">
        <button class="btn btn-gold" id="explYes">J'accepte le risque</button>
        <button class="btn btn-ghost" id="explNo">Laisser protégé</button>
      </div>`);
    document.getElementById('explYes').addEventListener('click', () => {
      state.setExploration(true); closeSheet(); toast('Mode exploration activé');
    });
    document.getElementById('explNo').addEventListener('click', closeSheet);
  });

  const copy = root.querySelector('#copyBtn');
  if (copy) copy.addEventListener('click', async () => {
    const box = root.querySelector('#ioBox');
    try {
      await navigator.clipboard.writeText(box.value);
      toast('Sauvegarde copiée');
    } catch {
      box.select();
      toast('Sélectionné : copiez manuellement');
    }
  });

  const imp = root.querySelector('#importBtn');
  if (imp) imp.addEventListener('click', () => {
    try {
      state.importJSON(root.querySelector('#ioBox').value);
      toast('Sauvegarde importée');
      rerender();
    } catch (err) {
      toast('Import impossible : ' + err.message);
    }
  });
}
