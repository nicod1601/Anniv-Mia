/* Mini-jeux du bureau
   - Discord        : quiz (à venir)
   - Genshin Impact : jeu de tirages
   - Honkai: Star Rail : jeu de tirages (même moteur)
   Un jeu est « terminé » quand le grand prix est obtenu. Quand les trois sont terminés,
   le dossier verrouillé du bureau s'ouvre. */
(() => {
  'use strict';

  /* =====================================================================
     RÉGLAGES DES TIRAGES  (tout se modifie ici)
     - poids   : pour le grand prix, c'est son % de chance de base.
                 Pour les autres, ce sont des poids relatifs entre eux.
     - etoiles : 4 ou 5 (couleur de la carte)
     - gif     : l'animation de tirage (facultatif)
     - fin     : image fixe affichée à la fin de l'animation (facultatif)
     - duree   : durée du GIF en secondes
     - doux    : à partir de ce tirage sans grand prix, la chance monte
     - garantie: au tirage n° garantie, le grand prix est assuré
     ===================================================================== */
  const GENSHIN = {
    id: 'genshin', nom: 'Genshin Impact', titre: 'Souhait des voyageurs',
    accroche: 'Fais un vœu et découvre qui répond à l’appel…',
    icone: 'jeux/icones/genshin.webp',
    theme: { fond: '#0f1a36', fond2: '#233763', accent: '#f0cd8a', encre: '#2a1d05' },
    doux: 20, garantie: 30,
    recompenses: [
      { id: 'hutao',   nom: 'Hu Tao',  etoiles: 5, poids: 3,  grand: true,
        gif: 'jeux/genshin/hutao.gif', fin: 'jeux/genshin/hutao.webp', duree: 11.1 },
      { id: 'mona',    nom: 'Mona',    etoiles: 5, poids: 21,
        gif: 'jeux/genshin/mona.gif',  fin: 'jeux/genshin/mona.webp',  duree: 11.1 },
      { id: 'bennett', nom: 'Bennett', etoiles: 4, poids: 38,
        gif: 'jeux/genshin/benet.gif', fin: 'jeux/genshin/benet.webp', duree: 11.1 },
      { id: 'noelle',  nom: 'Noelle',  etoiles: 4, poids: 38,
        gif: 'jeux/genshin/noel.gif',  fin: 'jeux/genshin/noel.webp',  duree: 11.1 }
    ]
  };

  // Honkai: Star Rail : remplace les noms et ajoute tes GIF + images fixes dans jeux/honkai/
  // (tant qu'il n'y a pas de gif/fin, le jeu utilise une animation et des cartes simples)
  const HSR = {
    id: 'hsr', nom: 'Honkai: Star Rail', titre: 'Warp des étoiles',
    accroche: 'Lance un Warp et vois qui monte à bord du Express…',
    icone: 'jeux/icones/honkai.webp',
    theme: { fond: '#150f2e', fond2: '#33256b', accent: '#c9a7ff', encre: '#1c0f3d' },
    doux: 20, garantie: 30,
    recompenses: [
      { id: 'grand', nom: 'Grand prix (5★)', etoiles: 5, poids: 3, grand: true },
      { id: 'cinq',  nom: 'Personnage 5★',   etoiles: 5, poids: 21 },
      { id: 'quatreA', nom: 'Personnage 4★ (A)', etoiles: 4, poids: 38 },
      { id: 'quatreB', nom: 'Personnage 4★ (B)', etoiles: 4, poids: 38 }
    ]
  };

  /* ===================================================================== */

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
  window.Jeux = API;

  /* ---------- Discord : à venir ---------- */
  function ouvrirDiscord(ctx) {
    ctx.openWindow('Discord', el => {
      el.querySelector('.content').innerHTML =
        '<div class="jeu jeu-attente" style="--fond:#1e2040;--fond2:#2e3163;--accent:#8b95ff;--encre:#10123a">' +
        '<img src="jeux/icones/discord.png" alt="" width="72" height="72">' +
        '<h2>Quiz Discord</h2><p>Ce jeu arrive bientôt…</p></div>';
    }, { w: 420, h: 280 });
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
    const autres = cfg.recompenses.filter(r => !r.grand);
    const sommeAutres = autres.reduce((s, r) => s + r.poids, 0);
    const etat = Object.assign({ sans: 0, total: 0, inv: {} }, store.lire(CLES_GACHA(cfg.id), {}));
    const sauver = () => store.ecrire(CLES_GACHA(cfg.id), etat);

    function tirerUn() {
      const n = etat.sans + 1;
      let p = grand.poids / 100;
      if (n >= cfg.garantie) p = 1;
      else if (n > cfg.doux) p += (n - cfg.doux) / (cfg.garantie - cfg.doux) * (1 - p);
      let r;
      if (Math.random() < p) { r = grand; etat.sans = 0; }
      else {
        let t = Math.random() * sommeAutres;
        r = autres.find(x => (t -= x.poids) < 0) || autres[autres.length - 1];
        etat.sans = n;
      }
      etat.total++; etat.inv[r.id] = (etat.inv[r.id] || 0) + 1;
      return r;
    }
    const tauxDe = r => r.grand ? grand.poids : (100 - grand.poids) * r.poids / sommeAutres;

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
        $r('garantie').textContent = 'Garantie : ' + etat.sans + ' / ' + cfg.garantie;
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
               <p class="garantie-txt">${esc(grand.nom)} est garanti(e) au ${cfg.garantie}<sup>e</sup> souhait sans l’obtenir.</p>
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

      function banniere() {
        const b = document.createElement('div');
        b.className = 'objectif';
        b.textContent = '✓ Objectif atteint : ' + grand.nom + ' !';
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
        const meilleur = [...liste].sort((a, b) => (b.grand ? 1 : 0) - (a.grand ? 1 : 0) || b.etoiles - a.etoiles)[0];
        const gagne = liste.includes(grand);
        animer(meilleur, () => {
          if (nb === 1) voirResultat(liste[0]); else voirResume(liste);
          if (gagne) {
            const premiere = !API.estTermine(cfg.id);
            API.marquer(cfg.id);
            majStats();
            if (premiere) banniere();
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
