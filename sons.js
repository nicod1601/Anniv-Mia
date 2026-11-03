/* Sons façon vieux PC, fabriqués directement par le navigateur (aucun fichier audio à ajouter).
   Un bouton 🔊 dans la barre des tâches permet de les couper. */
(() => {
  'use strict';
  const CLE = 'bureau-son';
  let actif = true;
  try { actif = localStorage.getItem(CLE) !== '0'; } catch {}
  let ctx = null;

  // Le navigateur n'autorise le son qu'après un clic : on vérifie que c'est bon avant de jouer
  async function pret() {
    if (!actif) return false;
    try {
      if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
      if (ctx.state !== 'running') await Promise.race([ctx.resume(), new Promise(r => setTimeout(r, 250))]);
      return ctx.state === 'running';
    } catch { return false; }
  }
  function ton(freq, debut, duree, o = {}) {
    const { type = 'sine', vol = 0.12, glisse = null, attaque = 0.008 } = o;
    const t0 = ctx.currentTime + debut;
    const osc = ctx.createOscillator(), g = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (glisse) osc.frequency.exponentialRampToValueAtTime(glisse, t0 + duree);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol, t0 + attaque);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + duree);
    osc.connect(g); g.connect(ctx.destination);
    osc.start(t0); osc.stop(t0 + duree + 0.05);
  }
  const jouer = f => { pret().then(ok => { if (ok) f(); }); };

  const Sons = {
    get actif() { return actif; },
    basculer() {
      actif = !actif;
      try { localStorage.setItem(CLE, actif ? '1' : '0'); } catch {}
      if (actif) Sons.ding();
      return actif;
    },
    // petit « ding » (ouverture d'une fenêtre)
    ding() { jouer(() => { ton(880, 0, 0.45, { vol: 0.09 }); ton(1318.5, 0.07, 0.5, { vol: 0.06 }); }); },
    // bip d'erreur (dossier verrouillé, mauvais mot de passe)
    erreur() { jouer(() => { ton(220, 0, 0.14, { type: 'square', vol: 0.05 }); ton(165, 0.17, 0.24, { type: 'square', vol: 0.05 }); }); },
    // notification douce (succès)
    notif() { jouer(() => { ton(784, 0, 0.3, { vol: 0.08 }); ton(1174.7, 0.12, 0.45, { vol: 0.08 }); }); },
    // scintillement (personnage 5★)
    etoile() {
      jouer(() => [1046.5, 1318.5, 1568, 2093, 1568, 2349].forEach((f, i) => ton(f, i * 0.07, 0.5, { vol: 0.05 })));
    },
    // petite fanfare (objectif atteint, grand moment)
    fanfare() {
      jouer(() => {
        [261.63, 329.63, 392, 523.25].forEach((f, i) => ton(f, i * 0.13, 0.35, { type: 'triangle', vol: 0.1 }));
        [523.25, 659.25, 783.99].forEach(f => ton(f, 0.6, 1.4, { type: 'triangle', vol: 0.07 }));
        [1046.5, 1318.5, 1568].forEach((f, i) => ton(f, 0.75 + i * 0.09, 0.9, { vol: 0.04 }));
      });
    },
    // jingle de démarrage ; renvoie true s'il a pu être joué
    async demarrage() {
      if (!(await pret())) return false;
      [261.63, 329.63, 392, 493.88].forEach(f => ton(f, 0.9, 1.9, { type: 'triangle', vol: 0.05, attaque: 0.15 }));
      [[392, 0, 0.5], [523.25, 0.18, 0.5], [659.25, 0.36, 0.55], [783.99, 0.54, 0.6], [987.77, 0.9, 1.1]]
        .forEach(([f, t, d]) => ton(f, t, d, { vol: 0.08 }));
      ton(1318.5, 1.15, 1.3, { vol: 0.035 });
      return true;
    }
  };
  window.Sons = Sons;
})();
