/* Mini-jeux du bureau
   - Discord        : quiz façon salon de discussion
   - Genshin Impact : jeu de tirages
   - Honkai: Star Rail : jeu de tirages (même moteur)
   Un jeu est « terminé » quand le grand prix est obtenu. Quand les trois sont terminés,
   le dossier verrouillé du bureau s'ouvre. */
(() => {
  'use strict';

  /* =====================================================================
     RÉGLAGES DES TIRAGES  (tout se modifie ici) — système façon Genshin
     - taux5      : % de chance de base d'obtenir un 5★ à chaque souhait
     - doux       : à partir de ce souhait sans 5★, la chance de 5★ monte
     - garantie   : au souhait n° garantie, un 5★ est assuré
     - chanceGrand: chance (0 à 1) qu'un 5★ soit le grand prix (le « 50/50 »).
                    Si le 5★ est l'autre (perdant), le prochain 5★ est le grand prix à coup sûr.
     Récompenses :
     - grand : true   → le grand prix (finir le jeu = l'obtenir)
     - perdant : true → l'autre 5★ (celui du 50/50 perdu)
     - 4★             → poids relatifs entre eux
     - gif / fin / duree : animation, image fixe de fin, durée du GIF en secondes (facultatifs)
     ===================================================================== */
  const GENSHIN = {
    id: 'genshin', nom: 'Genshin Impact', titre: 'Souhait des voyageurs',
    accroche: 'Fais un vœu et découvre qui répond à l’appel…',
    icone: 'jeux/icones/genshin.webp',
    theme: { fond: '#0f1a36', fond2: '#233763', accent: '#f0cd8a', encre: '#2a1d05' },
    taux5: 1, doux: 65, garantie: 80, chanceGrand: 0.5,
    recompenses: [
      { id: 'hutao',   nom: 'Hu Tao',  etoiles: 5, grand: true,
        gif: 'jeux/genshin/hutao.gif', fin: 'jeux/genshin/hutao.webp', duree: 11.1 },
      { id: 'mona',    nom: 'Mona',    etoiles: 5, perdant: true,
        gif: 'jeux/genshin/mona.gif',  fin: 'jeux/genshin/mona.webp',  duree: 11.1 },
      { id: 'bennett', nom: 'Bennett', etoiles: 4, poids: 50,
        gif: 'jeux/genshin/benet.gif', fin: 'jeux/genshin/benet.webp', duree: 11.1 },
      { id: 'noelle',  nom: 'Noelle',  etoiles: 4, poids: 50,
        gif: 'jeux/genshin/noel.gif',  fin: 'jeux/genshin/noel.webp',  duree: 11.1 }
    ]
  };

  // Honkai: Star Rail : remplace les noms et ajoute tes GIF + images fixes dans jeux/honkai/
  // (tant qu'il n'y a pas de gif/fin, le jeu utilise une animation et des cartes simples)
  const HSR = {
    id: 'hsr', nom: 'Honkai: Star Rail', titre: 'Warp des étoiles',
    accroche: 'Lance un Warp et vois qui monte à bord de l’Express…',
    icone: 'jeux/icones/honkai.webp',
    theme: { fond: '#150f2e', fond2: '#33256b', accent: '#c9a7ff', encre: '#1c0f3d' },
    taux5: 1, doux: 65, garantie: 80, chanceGrand: 0.5,
    recompenses: [
      { id: 'grand',   nom: 'Grand prix (5★)',   etoiles: 5, grand: true },
      { id: 'perdant', nom: 'Autre 5★',          etoiles: 5, perdant: true },
      { id: 'quatreA', nom: 'Personnage 4★ (A)', etoiles: 4, poids: 50 },
      { id: 'quatreB', nom: 'Personnage 4★ (B)', etoiles: 4, poids: 50 }
    ]
  };

  /* ===================================================================== */

  /* Un tirage. `etat` = { sans, garanti, total, inv } est modifié sur place. */
  function tirerRecompense(cfg, etat, hasard = Math.random) {
    const grand = cfg.recompenses.find(r => r.grand);
    const perdant = cfg.recompenses.find(r => r.perdant);
    const quatre = cfg.recompenses.filter(r => !r.grand && !r.perdant);
    const n = etat.sans + 1;                        // numéro du souhait depuis le dernier 5★
    let p = cfg.taux5 / 100;
    if (n >= cfg.garantie) p = 1;
    else if (n > cfg.doux) p += (n - cfg.doux) / (cfg.garantie - cfg.doux) * (1 - p);
    let r;
    if (hasard() < p) {                             // c'est un 5★
      etat.sans = 0;
      if (etat.garanti || hasard() < cfg.chanceGrand) { r = grand; etat.garanti = false; }
      else { r = perdant; etat.garanti = true; }    // 50/50 perdu : le prochain 5★ est garanti
    } else {
      let t = hasard() * quatre.reduce((s, x) => s + x.poids, 0);
      r = quatre.find(x => (t -= x.poids) < 0) || quatre[quatre.length - 1];
      etat.sans = n;
    }
    etat.total++; etat.inv[r.id] = (etat.inv[r.id] || 0) + 1;
    return r;
  }

  const IDS = ['discord', 'genshin', 'hsr'];
  const CLE_FINI = 'bureau-jeux-termines';
  const CLES_GACHA = id => 'bureau-gacha-' + id;

  const store = {
    lire(k, def) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : def; } catch { return def; } },
    ecrire(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
    effacer(k) { try { localStorage.removeItem(k); } catch {} }
  };
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const etoiles = n => '★'.repeat(n);
  const pct = x => (Math.round(x * 10) / 10).toString().replace('.', ',') + ' %';

  let termines = store.lire(CLE_FINI, {});

  const API = {
    apps: [
      { id: 'discord', nom: 'Discord', icone: 'jeux/icones/discord.png' },
      { id: 'genshin', nom: GENSHIN.nom, icone: GENSHIN.icone },
      { id: 'hsr', nom: HSR.nom, icone: HSR.icone }
    ],
    onChange: null,
    estTermine: id => !!termines[id],
    tousTermines: () => IDS.every(id => termines[id]),
    marquer(id) {
      if (termines[id]) return;
      termines[id] = true; store.ecrire(CLE_FINI, termines);
      if (API.onChange) API.onChange(id);
    },
    toutTerminer() { IDS.forEach(id => { termines[id] = true; }); store.ecrire(CLE_FINI, termines); },
    reinitialiser() {
      termines = {}; store.effacer(CLE_FINI);
      IDS.forEach(id => store.effacer(CLES_GACHA(id)));
    },
    ouvrir(id, ctx) {
      if (id === 'genshin') return ouvrirGacha(GENSHIN, ctx);
      if (id === 'hsr') return ouvrirGacha(HSR, ctx);
      return ouvrirDiscord(ctx);
    }
  };
  API._test = { tirerRecompense, GENSHIN, HSR };   // utilisé seulement pour vérifier les taux
  window.Jeux = API;

  /* ---------- Discord : le quiz ---------- */
  /* Questions du quiz (modifie / ajoute les tiennes ici) :
     type 'choix'      → boutons ; 'bonne' = bonne réponse (facultatif), 'ok' / 'ko' = réaction du bot
     type 'texte'      → réponse libre
     type 'classement' → liste à réordonner (items) */
  const QUIZ_DISCORD = {
    joueuse: 'Mia', serveur: 'Serveur de Koki', salon: 'quiz',
    // À la fin du quiz, les réponses sont envoyées par mail (via le service gratuit FormSubmit)
    envoi: { email: 'nicod1620005@gmail.com', nom: 'Nico', sujet: 'Quiz Discord — réponses de Mia' },
    questions: [
      { id: 'flop', type: 'choix',
        texte: 'Qui fait le plus de FLOP sur le serveur de Koki ?',
        options: ['Mia', 'Nico', 'Navi', 'Shadow', 'Ronni', 'Autre'], bonne: 'Shadow',
        ok: 'Exact ! Shadow et ses flops légendaires.', ko: 'Raté ! La bonne réponse était Shadow.' },
      { id: 'modo', type: 'texte',
        texte: 'Qui est, pour toi, le meilleur modo du serveur de Koki ?' },
      { id: 'proche', type: 'texte',
        texte: 'Entre tous tes amis Discord, quelle est la personne qui compte le plus pour toi ?' },
      { id: 'classement', type: 'classement',
        texte: 'Classe ces personnes : qui est supérieur, qui est inférieur ?',
        aide: '1er = le plus supérieur, dernier = le plus inférieur. Utilise ▲ et ▼.',
        items: ['Shadow', 'Navi', 'Koki', 'Nico', 'Ronni', 'Eski'] },
      { id: 'fight', type: 'texte',
        texte: 'Avec qui as-tu le plus envie de fight ?' }
    ]
  };

  function ouvrirDiscord(ctx) {
    const cfg = QUIZ_DISCORD, Q = cfg.questions, CLE = 'bureau-quiz-discord';
    let etat = Object.assign({ rep: {} }, store.lire(CLE, {}));
    const sauver = () => store.ecrire(CLE, etat);

    ctx.openWindow('Discord', (el, w) => {
      el.querySelector('.content').innerHTML =
        `<div class="jeu jeu-discord">
           <div class="d-top"><span class="d-hash">#</span><b>${esc(cfg.salon)}</b><span class="d-serveur">${esc(cfg.serveur)}</span>
             <span class="sp"></span><span class="chip" data-r="prog"></span></div>
           <div class="d-log" role="log" aria-live="polite" data-r="log"></div>
           <div class="d-saisie" data-r="saisie"></div>
         </div>`;
      const $r = n => el.querySelector(`[data-r="${n}"]`);
      const log = $r('log'), saisie = $r('saisie');
      let annule = false;
      w.cleanup = () => { annule = true; };
      const pause = ms => new Promise(r => setTimeout(r, ms));
      const heure = () => 'Aujourd’hui à ' + new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
      const descendre = () => { log.scrollTop = log.scrollHeight; };

      function msg(qui, html) {
        const bot = qui === 'bot';
        const d = document.createElement('div');
        d.className = 'd-msg';
        d.innerHTML =
          `<div class="d-av ${bot ? 'bot' : 'moi'}">${bot ? '<img src="jeux/icones/discord.png" alt="">' : esc(cfg.joueuse[0])}</div>
           <div class="d-corps"><div class="d-nom"><span class="${bot ? 'bot' : 'moi'}">${bot ? 'Quiz Bot' : esc(cfg.joueuse)}</span>${bot ? '<i class="d-tag">BOT</i>' : ''}<time>${heure()}</time></div>
           <div class="d-txt">${html}</div></div>`;
        log.appendChild(d); descendre();
        return d;
      }
      async function ecrire(ms) {         // « Quiz Bot est en train d'écrire… »
        const t = document.createElement('div');
        t.className = 'd-typing'; t.innerHTML = 'Quiz Bot est en train d’écrire<span>.</span><span>.</span><span>.</span>';
        log.appendChild(t); descendre();
        await pause(ms); t.remove();
      }
      const majProg = i => { $r('prog').textContent = i >= Q.length ? 'Terminé ✓' : 'Question ' + (i + 1) + ' / ' + Q.length; };

      const rendu = (q, v) => q.type === 'classement'
        ? '<ol>' + v.map(n => '<li>' + esc(n) + '</li>').join('') + '</ol>' : esc(v);

      async function repondre(i, valeur) {
        const q = Q[i];
        etat.rep[q.id] = valeur; sauver();
        saisie.innerHTML = '';
        msg('moi', rendu(q, valeur));
        if (q.type === 'choix' && q.bonne) {
          await ecrire(550); if (annule) return;
          msg('bot', esc(valeur === q.bonne ? q.ok : q.ko));
        }
        poser(i + 1);
      }

      function classement(i, q, carteDans) {
        let ordre = [...q.items];
        const carte = document.createElement('div');
        carte.className = 'd-carte';
        function dessiner(focus) {
          carte.innerHTML =
            `<p class="d-aide">${esc(q.aide || '')}</p><ol class="d-rang">` +
            ordre.map((n, k) => `<li><span class="d-pos">${k + 1}</span><span class="d-nr">${esc(n)}</span>
               <button type="button" data-k="${k}" data-d="-1" aria-label="Monter ${esc(n)}"${k === 0 ? ' disabled' : ''}>▲</button>
               <button type="button" data-k="${k}" data-d="1" aria-label="Descendre ${esc(n)}"${k === ordre.length - 1 ? ' disabled' : ''}>▼</button></li>`).join('') +
            '</ol><button type="button" class="d-btn" data-ok>Valider mon classement</button>';
          if (focus) {
            const b = carte.querySelector(`[data-k="${focus.k}"][data-d="${focus.d}"]:not([disabled])`) ||
                      carte.querySelector(`[data-k="${focus.k}"]:not([disabled])`);
            if (b) b.focus();
          }
        }
        carte.addEventListener('click', e => {
          const b = e.target.closest('button'); if (!b) return;
          if ('ok' in b.dataset) { carte.remove(); repondre(i, ordre); return; }
          const k = +b.dataset.k, d = +b.dataset.d, k2 = k + d;
          if (k2 < 0 || k2 >= ordre.length) return;
          [ordre[k], ordre[k2]] = [ordre[k2], ordre[k]];
          dessiner({ k: k2, d });
        });
        dessiner();
        carteDans.querySelector('.d-corps').appendChild(carte);
        descendre();
      }

      async function poser(i) {
        if (annule) return;
        majProg(i);
        if (i >= Q.length) return fin();
        const q = Q[i];
        await ecrire(500 + Math.random() * 400); if (annule) return;
        const m = msg('bot', esc(q.texte));
        saisie.innerHTML = '';
        if (q.type === 'choix') {
          saisie.innerHTML = q.options.map(o => `<button type="button" class="d-btn" data-o="${esc(o)}">${esc(o)}</button>`).join('');
          saisie.onclick = e => { const b = e.target.closest('[data-o]'); if (b) { saisie.onclick = null; repondre(i, b.dataset.o); } };
        } else if (q.type === 'texte') {
          saisie.innerHTML = `<form class="d-form"><input type="text" maxlength="300" autocomplete="off" placeholder="Envoyer un message dans #${esc(cfg.salon)}" aria-label="Ta réponse"><button class="d-envoi" type="submit" aria-label="Envoyer">➤</button></form>`;
          const f = saisie.querySelector('form'), inp = f.querySelector('input');
          inp.focus();
          f.onsubmit = e => { e.preventDefault(); const v = inp.value.trim(); if (v) { f.onsubmit = null; repondre(i, v); } };
        } else classement(i, q, m);
      }

      function texteReponses() {
        return 'Quiz Discord — réponses de ' + cfg.joueuse + '\n\n' + Q.map((q, k) => {
          return (k + 1) + '. ' + q.texte + '\n   → ' + ligneReponse(q);
        }).join('\n');
      }

      function ligneReponse(q) {
        const v = etat.rep[q.id];
        return Array.isArray(v) ? v.map((n, j) => (j + 1) + ') ' + n).join('  ') : v;
      }

      // Méthode 1 : envoi « AJAX » (on peut lire la réponse de FormSubmit)
      async function postFetch(corps) {
        let rep;
        try {
          rep = await fetch('https://formsubmit.co/ajax/' + cfg.envoi.email, {
            method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(corps)
          });
        } catch (e) { const err = new Error('reseau'); err.reseau = true; throw err; }
        const data = await rep.json().catch(() => ({}));
        if (!rep.ok || data.success === 'false' || data.success === false) {
          throw new Error(data.message || ('erreur ' + rep.status));
        }
      }
      // Méthode 2 (secours) : formulaire classique envoyé dans un cadre caché, sans blocage de sécurité
      function postFormulaire(corps) {
        return new Promise(resolve => {
          const nom = 'envoi-' + Date.now();
          const cadre = document.createElement('iframe'); cadre.name = nom; cadre.hidden = true;
          const f = document.createElement('form');
          f.method = 'POST'; f.action = 'https://formsubmit.co/' + cfg.envoi.email; f.target = nom; f.acceptCharset = 'UTF-8'; f.hidden = true;
          Object.entries(corps).forEach(([k, v]) => {
            const i = document.createElement('input'); i.type = 'hidden'; i.name = k; i.value = v; f.appendChild(i);
          });
          document.body.append(cadre, f);
          const fini = () => { setTimeout(() => { cadre.remove(); f.remove(); }, 500); resolve(); };
          cadre.addEventListener('load', fini, { once: true });
          setTimeout(fini, 10000);
          f.submit();
        });
      }

      async function envoyer() {
        const info = saisie.querySelector('.d-info');
        const dire = t => { if (info) info.textContent = t; };
        const boutonRessai = () => {
          if (!saisie.querySelector('[data-a="envoyer"]'))
            saisie.insertAdjacentHTML('afterbegin', '<button type="button" class="d-btn" data-a="envoyer">Réessayer l’envoi</button>');
        };
        dire('Envoi de tes réponses à ' + cfg.envoi.nom + '…');
        const corps = { _subject: cfg.envoi.sujet, _template: 'table', _captcha: 'false', Joueuse: cfg.joueuse };
        Q.forEach((q, k) => { corps['Q' + (k + 1) + ' – ' + q.texte] = ligneReponse(q); });
        try {
          await postFetch(corps);
          etat.envoye = true; sauver();
          saisie.querySelector('[data-a="envoyer"]')?.remove();
          dire('');
          if (!annule) msg('bot', 'Tes réponses ont été envoyées à ' + esc(cfg.envoi.nom) + ' 💌');
        } catch (e) {
          console.warn('Envoi FormSubmit :', e.message);
          if (e.reseau) {                      // la méthode 1 est bloquée : on tente la méthode de secours
            await postFormulaire(corps);
            etat.envoye = true; sauver();
            dire('Envoi effectué, mais la réception n’a pas pu être confirmée.');
            boutonRessai();
          } else {
            dire('FormSubmit a répondu : « ' + e.message + ' ». Réessaie, ou copie tes réponses.');
            boutonRessai();
          }
        }
      }

      async function fin() {
        await ecrire(600); if (annule) return;
        msg('bot', 'Le quiz est terminé, merci d’avoir joué ! 💙');
        API.marquer('discord');
        saisie.innerHTML = '<button type="button" class="d-btn sec" data-a="copier">Copier mes réponses</button>' +
                           '<button type="button" class="d-btn sec" data-a="refaire">Refaire le quiz</button><span class="d-info" aria-live="polite"></span>';
        saisie.onclick = async e => {
          const b = e.target.closest('[data-a]'); if (!b) return;
          const a = b.dataset.a;
          if (a === 'refaire') { etat.rep = {}; etat.envoye = false; sauver(); log.innerHTML = ''; saisie.onclick = null; poser(0); return; }
          if (a === 'envoyer') { envoyer(); return; }
          const info = saisie.querySelector('.d-info');
          try { await navigator.clipboard.writeText(texteReponses()); info.textContent = 'Copié ! Tu peux le coller dans un message.'; }
          catch {
            const t = document.createElement('textarea'); t.value = texteReponses(); document.body.appendChild(t); t.select();
            try { document.execCommand('copy'); info.textContent = 'Copié ! Tu peux le coller dans un message.'; } catch { info.textContent = 'Impossible de copier.'; }
            t.remove();
          }
        };
        if (!etat.envoye) envoyer();
      }

      // reprise : on réaffiche ce qui a déjà été répondu, puis on continue
      let reprise = 0;
      while (reprise < Q.length && Q[reprise].id in etat.rep) {
        const q = Q[reprise], v = etat.rep[q.id];
        msg('bot', esc(q.texte)); msg('moi', rendu(q, v));
        if (q.type === 'choix' && q.bonne) msg('bot', esc(v === q.bonne ? q.ok : q.ko));
        reprise++;
      }
      poser(reprise);
    }, { w: 600, h: 650 });
  }

  /* ---------- Jeux de tirages ---------- */
  const blobs = {};                       // GIF déjà téléchargés (on ne les retélécharge pas)
  async function urlGif(src) {
    try {
      let b = blobs[src];
      if (!b) {
        const rep = await fetch(src);
        if (!rep.ok) throw new Error('HTTP ' + rep.status);
        b = blobs[src] = await rep.blob();
      }
      return { url: URL.createObjectURL(b), blob: true };   // nouvelle adresse = l'animation repart du début
    } catch {
      return { url: src + (src.includes('?') ? '&' : '?') + 'v=' + Date.now(), blob: false };
    }
  }

  function ouvrirGacha(cfg, ctx) {
    const grand = cfg.recompenses.find(r => r.grand);
    const perdant = cfg.recompenses.find(r => r.perdant);
    const quatre = cfg.recompenses.filter(r => !r.grand && !r.perdant);
    const sommeQuatre = quatre.reduce((x, r) => x + r.poids, 0);
    const etat = Object.assign({ sans: 0, garanti: false, total: 0, inv: {} }, store.lire(CLES_GACHA(cfg.id), {}));
    const sauver = () => store.ecrire(CLES_GACHA(cfg.id), etat);
    const tirerUn = () => tirerRecompense(cfg, etat);
    const tauxDe = r => r.grand || r.perdant ? cfg.taux5 * (r.grand ? cfg.chanceGrand : 1 - cfg.chanceGrand)
                                             : (100 - cfg.taux5) * r.poids / sommeQuatre;

    ctx.openWindow(cfg.nom, (el, w) => {
      const t = cfg.theme;
      el.querySelector('.content').innerHTML =
        `<div class="jeu" style="--fond:${t.fond};--fond2:${t.fond2};--accent:${t.accent};--encre:${t.encre}">
           <div class="jeu-top">
             <img class="jeu-logo" src="${cfg.icone}" alt="" width="26" height="26">
             <b>${esc(cfg.titre)}</b><span class="sp"></span>
             <span class="chip" data-r="fini" hidden>✓ Terminé</span>
             <span class="chip" data-r="total"></span>
             <span class="chip" data-r="garantie"></span>
             <span class="chip" data-r="cinqcinq"></span>
           </div>
           <div class="jeu-stage" data-r="stage" aria-live="polite"></div>
           <div class="jeu-actions" data-r="actions"></div>
         </div>`;
      const $r = n => el.querySelector(`[data-r="${n}"]`);
      const stage = $r('stage'), actions = $r('actions');
      let annule = false, minuteur = null, urlEnCours = null;
      w.cleanup = () => { annule = true; clearTimeout(minuteur); if (urlEnCours) URL.revokeObjectURL(urlEnCours); };

      function majStats() {
        $r('total').textContent = 'Souhaits : ' + etat.total;
        $r('garantie').textContent = 'Garantie 5★ : ' + etat.sans + ' / ' + cfg.garantie;
        $r('cinqcinq').textContent = etat.garanti ? 'Prochain 5★ : ' + grand.nom + ' garanti' : '50/50';
        $r('fini').hidden = !API.estTermine(cfg.id);
      }

      /* ----- cartes ----- */
      function carteGen(r) {
        return `<div class="carte-gen s${r.etoiles}${r.grand ? ' grand' : ''}"><div class="etoiles s${r.etoiles}">${etoiles(r.etoiles)}</div><div class="nom">${esc(r.nom)}</div></div>`;
      }
      function tuile(r, n, opts = {}) {
        const vide = opts.vide;
        const img = r.fin && !vide ? `<img src="${r.fin}" alt="" loading="lazy" onerror="this.remove()">` : '';
        return `<div class="tuile s${r.etoiles}${r.grand ? ' grand' : ''}${vide ? ' vide' : ''}">${img}
          <span class="etoiles s${r.etoiles}">${vide ? '?' : etoiles(r.etoiles)}</span>
          <span class="nom">${vide ? '???' : esc(r.nom)}</span>${n > 1 ? `<span class="x">×${n}</span>` : ''}</div>`;
      }

      /* ----- vues ----- */
      function barre(avecRetour) {
        actions.innerHTML = avecRetour
          ? '<button class="sec" data-a="accueil">‹ Retour</button><span class="sp"></span>'
          : '<button class="sec" data-a="collection">Collection</button><span class="sp"></span>';
        actions.innerHTML += '<button class="prin" data-a="1">Souhait ×1</button><button class="prin" data-a="10">Souhait ×10</button>';
      }

      function accueil() {
        majStats(); barre(false);
        const lignes = cfg.recompenses.map(r =>
          `<li><span class="etoiles s${r.etoiles}">${etoiles(r.etoiles)}</span> ${esc(r.nom)} <em>${pct(tauxDe(r))}</em></li>`).join('');
        stage.innerHTML =
          `<div class="hero"><div class="hero-bg" style="background-image:url('${cfg.icone}')"></div>
             <div class="hero-body">
               <img class="hero-icone" src="${cfg.icone}" alt="">
               <h2>${esc(cfg.titre)}</h2><p>${esc(cfg.accroche)}</p>
               <ul class="taux">${lignes}</ul>
               <p class="garantie-txt">Un 5★ est garanti au plus tard au ${cfg.garantie}<sup>e</sup> souhait.<br>
                 Chaque 5★ a ${Math.round(cfg.chanceGrand * 100)} % de chance d’être ${esc(grand.nom)}. Si c’est ${esc(perdant.nom)}, le prochain 5★ sera ${esc(grand.nom)} à coup sûr.</p>
             </div></div>`;
      }

      function collection() {
        barre(true);
        stage.innerHTML = '<div class="resume">' +
          [...cfg.recompenses].sort((a, b) => b.etoiles - a.etoiles || (b.grand ? 1 : 0) - (a.grand ? 1 : 0))
            .map(r => tuile(r, etat.inv[r.id] || 0, { vide: !etat.inv[r.id] })).join('') + '</div>';
      }

      function voirResultat(r) {
        majStats(); barre(false);
        const img = r.fin
          ? `<img class="splash" src="${r.fin}" alt="${esc(r.nom)}">` : carteGen(r);
        stage.innerHTML = `<div class="resultat">${img}</div>`;
        const i = stage.querySelector('.splash');
        if (i) i.onerror = () => { stage.querySelector('.resultat').innerHTML = carteGen(r); };
      }

      function voirResume(liste) {
        majStats(); barre(false);
        const compte = {};
        liste.forEach(r => { compte[r.id] = (compte[r.id] || 0) + 1; });
        const uniques = cfg.recompenses.filter(r => compte[r.id])
          .sort((a, b) => (b.grand ? 1 : 0) - (a.grand ? 1 : 0) || b.etoiles - a.etoiles);
        stage.innerHTML = '<div class="resume">' + uniques.map(r => tuile(r, compte[r.id])).join('') + '</div>';
      }

      function banniere(texte) {
        const b = document.createElement('div');
        b.className = 'objectif';
        b.textContent = texte;
        stage.appendChild(b);
        const liste = stage.querySelector('.resume');
        if (liste) liste.style.paddingTop = '66px';   // la bannière ne cache pas les cartes
      }

      /* ----- animation de tirage ----- */
      function animer(r, apres) {
        actions.innerHTML = '';
        stage.innerHTML = '<div class="anim"><div class="warp"></div><div class="charge">Invocation…</div></div>' +
                          '<button class="passer" type="button">Passer ›</button>';
        const zone = stage.querySelector('.anim');
        let fait = false;
        const finir = () => { if (fait || annule) return; fait = true; clearTimeout(minuteur); apres(); };
        stage.querySelector('.passer').onclick = finir;
        stage.querySelector('.passer').focus();
        if (!r.gif) { minuteur = setTimeout(finir, 2600); return; }
        urlGif(r.gif).then(({ url, blob }) => {
          if (annule || fait) { if (blob) URL.revokeObjectURL(url); return; }
          if (urlEnCours) URL.revokeObjectURL(urlEnCours);
          urlEnCours = blob ? url : null;
          const img = new Image();
          img.alt = '';
          img.onload = () => {
            if (annule || fait) return;
            zone.appendChild(img);
            // on s'arrête juste avant la fin, sinon le GIF repartirait au début
            minuteur = setTimeout(finir, Math.max(800, ((r.duree || 6) - 0.3) * 1000));
          };
          img.onerror = () => { if (!annule && !fait) minuteur = setTimeout(finir, 2200); };
          img.src = url;
        });
      }

      /* ----- tirage ----- */
      function lancer(nb) {
        const liste = [];
        for (let i = 0; i < nb; i++) liste.push(tirerUn());
        sauver();
        // comme dans le jeu : on joue l'animation du meilleur résultat
        const rang = r => (r.grand ? 2 : 0) + r.etoiles;
        const meilleur = [...liste].sort((a, b) => rang(b) - rang(a))[0];
        const gagne = liste.includes(grand);
        const perdu5050 = !gagne && etat.garanti && liste.includes(perdant);
        animer(meilleur, () => {
          if (nb === 1) voirResultat(liste[0]); else voirResume(liste);
          if (gagne) {
            const premiere = !API.estTermine(cfg.id);
            API.marquer(cfg.id);
            majStats();
            if (premiere) banniere('✓ Objectif atteint : ' + grand.nom + ' !');
          } else if (perdu5050) {
            banniere('50/50 perdu… le prochain 5★ sera ' + grand.nom + ' !');
          }
        });
      }

      actions.addEventListener('click', e => {
        const b = e.target.closest('button[data-a]'); if (!b) return;
        const a = b.dataset.a;
        if (a === '1') lancer(1);
        else if (a === '10') lancer(10);
        else if (a === 'collection') collection();
        else if (a === 'accueil') accueil();
      });

      accueil();
    }, { w: 880, h: 590 });
  }
})();
