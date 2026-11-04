/* Succès façon jeu vidéo : notification dorée + fenêtre « Succès ». */
(() => {
  'use strict';
  const CLE = 'bureau-succes';
  const LISTE = [
    { id: 'souhait',   titre: 'Premier souhait',        desc: 'Faire un premier vœu.' },
    { id: 'dix',       titre: 'Dix d’un coup',          desc: 'Faire un tirage ×10.' },
    { id: 'cinq',      titre: 'Une étoile dorée',       desc: 'Obtenir un personnage 5★.' },
    { id: 'perdu',     titre: 'Le 50/50 est cruel',     desc: 'Perdre un 50/50. Ça arrive aux meilleurs.' },
    { id: 'genshin',   titre: 'Voyageuse accomplie',    desc: 'Terminer Genshin Impact.' },
    { id: 'hsr',       titre: 'Passagère de l’Express', desc: 'Terminer Honkai: Star Rail.' },
    { id: 'discord',   titre: 'Habituée du serveur',    desc: 'Terminer le quiz Discord.' },
    { id: 'tout',      titre: 'Tout terminé !',         desc: 'Terminer les trois jeux.' },
    { id: 'corbeille', titre: 'Fouineuse',              desc: 'Ouvrir la corbeille.' },
    { id: 'ouvre',     titre: 'Une lettre pour toi',    desc: 'Ouvrir un dossier « Ouvre quand… ».' },
    { id: 'vocal',     titre: 'À l’écoute',             desc: 'Écouter un enregistrement audio.' },
    { id: 'fond',      titre: 'Décoratrice',            desc: 'Changer le fond d’écran.' },
    { id: 'secret',    titre: 'Curieuse',               desc: 'Trouver le bloc-notes caché.', secret: true },
    { id: 'nico',      titre: 'Le dernier dossier',     desc: 'Ouvrir le dossier qui était verrouillé.' },
    { id: 'impossible', titre: 'Rien ne se perd',       desc: 'Essayer de vider la corbeille.' },
    { id: 'fin',       titre: 'Bonne nuit',             desc: 'Arrêter l’ordinateur.' },
    { id: 'messenger', titre: 'Lectrice assidue',       desc: 'Lire la conversation jusqu’au bout.', si: () => ok('messenger') },
    { id: 'qui',       titre: 'Mémoire de serveur',     desc: 'Terminer « Qui a dit ça ? ».', si: () => ok('qui') },
    { id: 'parfait',   titre: 'Sans faute',             desc: 'Réussir « Qui a dit ça ? » à 100 %.', si: () => ok('qui') },
    { id: 'musique',   titre: 'Mélomane',               desc: 'Écouter une chanson dans le lecteur.', si: () => ok('musique') },
    { id: 'konami',    titre: 'Code secret',            desc: 'Un vieux code de jeu vidéo…', secret: true },
    { id: 'flop',      titre: 'Flop détecté',           desc: 'Prononcer le mot qui fâche.', secret: true },
    { id: 'mia',       titre: 'Un petit coucou',        desc: 'Taper un certain prénom.', secret: true }
  ];
  const ok = id => !!(window.Apps && window.Apps.visible(id));
  const visibles = () => LISTE.filter(a => !a.si || a.si());

  let faits = {};
  try { faits = JSON.parse(localStorage.getItem(CLE) || '{}'); } catch {}
  const sauver = () => { try { localStorage.setItem(CLE, JSON.stringify(faits)); } catch {} };
  const vues = new Set();           // fenêtres « Succès » ouvertes (mises à jour en direct)

  /* ----- notification ----- */
  const file = []; let enCours = false, zone = null;
  function afficher() {
    if (enCours || !file.length) return;
    enCours = true;
    const a = file.shift();
    if (!zone) {
      zone = document.createElement('div');
      zone.id = 'succes-toast'; zone.setAttribute('role', 'status'); zone.setAttribute('aria-live', 'polite');
      document.body.appendChild(zone);
    }
    zone.innerHTML = '<div class="st-icone">🏆</div><div><div class="st-label">Succès débloqué</div><div class="st-titre"></div></div>';
    zone.querySelector('.st-titre').textContent = a.titre;
    zone.classList.add('show');
    if (window.Sons) window.Sons.notif();
    setTimeout(() => { zone.classList.remove('show'); setTimeout(() => { enCours = false; afficher(); }, 450); }, 3400);
  }

  const API = {
    liste: LISTE,
    estDebloque: id => !!faits[id],
    debloquer(id) {
      const a = LISTE.find(x => x.id === id);
      if (!a || faits[id]) return;
      faits[id] = Date.now(); sauver();
      file.push(a); afficher();
      vues.forEach(f => f());
    },
    reinitialiser() { faits = {}; try { localStorage.removeItem(CLE); } catch {} vues.forEach(f => f()); },
    ouvrir(ctx) {
      ctx.openWindow('Succès', (el, w) => {
        el.querySelector('.content').innerHTML =
          `<div class="jeu jeu-succes">
             <div class="succ-top"><b>Succès</b><span class="sp"></span><span class="chip" data-r="n"></span></div>
             <div class="succ-barre"><i data-r="barre"></i></div>
             <ul class="succ-liste" data-r="liste"></ul>
           </div>`;
        const $r = n => el.querySelector(`[data-r="${n}"]`);
        const dessiner = () => {
          const vis = visibles();
          const n = vis.filter(a => faits[a.id]).length;
          $r('n').textContent = n + ' / ' + vis.length;
          $r('barre').style.width = (n / vis.length * 100) + '%';
          $r('liste').innerHTML = vis.map(a => {
            const ok = !!faits[a.id];
            const titre = ok || !a.secret ? a.titre : '???';
            const desc = ok || !a.secret ? a.desc : 'Un succès secret…';
            return `<li class="${ok ? 'ok' : ''}"><span class="succ-ico">${ok ? '🏆' : '🔒'}</span>
                    <span class="succ-txt"><b></b><small></small></span></li>`
                    .replace('<b></b>', '<b>' + titre.replace(/&/g, '&amp;').replace(/</g, '&lt;') + '</b>')
                    .replace('<small></small>', '<small>' + desc.replace(/&/g, '&amp;').replace(/</g, '&lt;') + '</small>');
          }).join('');
        };
        vues.add(dessiner); w.cleanup = () => vues.delete(dessiner);
        dessiner();
      }, { w: 460, h: 560 });
    }
  };
  window.Succes = API;
})();
