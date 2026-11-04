/* Programmes du bureau : Messenger, « Qui a dit ça ? » et le lecteur de musique.
   Tout leur contenu (conversation, citations, chansons) se règle dans perso.js. */
(() => {
  'use strict';
  const P = () => window.PERSO || {};
  const S = id => { try { window.Succes && window.Succes.debloquer(id); } catch {} };
  const son = n => { try { window.Sons && window.Sons[n] && window.Sons[n](); } catch {} };
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const pause = ms => new Promise(r => setTimeout(r, ms));
  const lire = (k, d) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } };
  const ecrire = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };

  const SVG = {
    messenger: '<svg viewBox="0 0 64 64"><rect x="6" y="8" width="52" height="40" rx="14" fill="#2f8cff"/><path d="M16 46l-4 10 14-8z" fill="#2f8cff"/><circle cx="22" cy="28" r="4" fill="#fff"/><circle cx="32" cy="28" r="4" fill="#fff"/><circle cx="42" cy="28" r="4" fill="#fff"/></svg>',
    qui: '<svg viewBox="0 0 64 64"><rect x="6" y="8" width="52" height="40" rx="12" fill="#5865f2"/><path d="M18 46l-4 10 14-8z" fill="#5865f2"/><text x="32" y="38" text-anchor="middle" font-family="Segoe UI, Arial" font-weight="700" font-size="30" fill="#fff">?</text></svg>',
    musique: '<svg viewBox="0 0 64 64"><rect x="6" y="8" width="52" height="48" rx="6" fill="#2b2f38"/><rect x="11" y="13" width="42" height="18" rx="2" fill="#0b130d"/><path d="M15 28v-6M20 28v-10M25 28v-8M30 28v-12M35 28v-7M40 28v-11M45 28v-5" stroke="#7dff7d" stroke-width="3"/><circle cx="20" cy="43" r="5" fill="#8d95a3"/><circle cx="32" cy="43" r="5" fill="#8d95a3"/><circle cx="44" cy="43" r="5" fill="#8d95a3"/></svg>'
  };

  const nb = (o, k) => (o && Array.isArray(o[k])) ? o[k].length : 0;
  const LISTE = [
    { id: 'messenger', nom: 'Messenger',       svg: SVG.messenger, visible: () => nb(P().messenger, 'messages') > 0 },
    { id: 'qui',       nom: 'Qui a dit ça ?',  svg: SVG.qui,       visible: () => nb(P().quiDitCa, 'citations') > 0 },
    { id: 'musique',   nom: 'Lecteur',         svg: SVG.musique,   visible: () => Array.isArray(P().playlist) && P().playlist.length > 0 }
  ];

  /* =========================== MESSENGER =========================== */
  function ouvrirMessenger(ctx) {
    const M = P().messenger, msgs = M.messages;
    ctx.openWindow('Messenger', (el, w) => {
      el.querySelector('.content').innerHTML =
        `<div class="jeu msn">
           <div class="msn-top"><div class="msn-av">${esc((M.contact || 'N')[0])}</div>
             <div><b>${esc(M.contact || 'Nico')}</b><small>${esc(M.statut || 'En ligne')}</small></div></div>
           <div class="msn-fil" role="log" aria-live="polite" data-r="fil"></div>
           <div class="msn-bas"><span class="msn-intro">${esc(M.intro || '')}</span><span class="sp"></span>
             <button type="button" class="msn-btn" data-r="btn">Passer ›</button></div>
         </div>`;
      const $r = n => el.querySelector(`[data-r="${n}"]`);
      const fil = $r('fil'), btn = $r('btn');
      let annule = false, rapide = false, tour = 0;
      w.cleanup = () => { annule = true; };
      const bas = () => { fil.scrollTop = fil.scrollHeight; };

      function bulle(m, premierNouveau) {
        if (premierNouveau) fil.insertAdjacentHTML('beforeend', '<div class="msn-sep"><span>Nouveau message</span></div>');
        const d = document.createElement('div');
        d.className = 'msn-ligne ' + (m.de === 'mia' ? 'moi' : 'lui');
        d.innerHTML = '<div class="msn-bulle' + (m.nouveau ? ' nouveau' : '') + '">' + esc(m.texte) + '</div>';
        fil.appendChild(d); bas();
      }
      async function jouer() {
        const mon = ++tour;
        fil.innerHTML = ''; rapide = false;
        btn.textContent = 'Passer ›'; btn.dataset.a = 'passer';
        let dejaNouveau = false;
        for (const m of msgs) {
          if (annule || mon !== tour) return;
          const long = Math.min(2200, Math.max(700, m.texte.length * 38));
          if (!rapide && m.de !== 'mia') {                       // « Nico écrit… »
            const t = document.createElement('div');
            t.className = 'msn-ligne lui';
            t.innerHTML = '<div class="msn-bulle ecrit"><i></i><i></i><i></i></div>';
            fil.appendChild(t); bas();
            await pause(m.pause != null ? m.pause : long); t.remove();
          } else if (!rapide) await pause(m.pause != null ? m.pause : Math.min(900, long));
          if (annule || mon !== tour) return;
          const premier = m.nouveau && !dejaNouveau; if (m.nouveau) dejaNouveau = true;
          bulle(m, premier);
          if (m.nouveau && !rapide) son('notif');
        }
        if (annule || mon !== tour) return;
        S('messenger');
        btn.textContent = 'Rejouer ↺'; btn.dataset.a = 'rejouer';
      }
      btn.addEventListener('click', () => { if (btn.dataset.a === 'passer') rapide = true; else jouer(); });
      jouer();
    }, { w: 420, h: 600 });
  }

  /* ========================= QUI A DIT ÇA ? ========================= */
  function ouvrirQui(ctx) {
    const Q = P().quiDitCa, cit = Q.citations, gens = Q.personnes || [];
    const joueuse = Q.joueuse || 'Mia';
    ctx.openWindow(Q.titre || 'Qui a dit ça ?', (el, w) => {
      el.querySelector('.content').innerHTML =
        `<div class="jeu jeu-discord">
           <div class="d-top"><span class="d-hash">#</span><b>qui-a-dit-ca</b><span class="d-serveur">${esc(Q.serveur || 'Serveur de Koki')}</span>
             <span class="sp"></span><span class="chip" data-r="prog"></span></div>
           <div class="d-log" role="log" aria-live="polite" data-r="log"></div>
           <div class="d-saisie" data-r="saisie"></div>
         </div>`;
      const $r = n => el.querySelector(`[data-r="${n}"]`);
      const log = $r('log'), saisie = $r('saisie');
      let annule = false, score = 0;
      w.cleanup = () => { annule = true; };
      const heure = () => 'Aujourd’hui à ' + new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
      function msg(qui, html) {
        const bot = qui === 'bot';
        const d = document.createElement('div'); d.className = 'd-msg';
        d.innerHTML = `<div class="d-av ${bot ? 'bot' : 'moi'}">${bot ? '<img src="jeux/icones/discord.png" alt="">' : esc(joueuse[0])}</div>
          <div class="d-corps"><div class="d-nom"><span class="${bot ? 'bot' : 'moi'}">${bot ? 'Quiz Bot' : esc(joueuse)}</span>${bot ? '<i class="d-tag">BOT</i>' : ''}<time>${heure()}</time></div><div class="d-txt">${html}</div></div>`;
        log.appendChild(d); log.scrollTop = log.scrollHeight;
      }
      async function ecrire(ms) {
        const t = document.createElement('div'); t.className = 'd-typing';
        t.innerHTML = 'Quiz Bot est en train d’écrire<span>.</span><span>.</span><span>.</span>';
        log.appendChild(t); log.scrollTop = log.scrollHeight; await pause(ms); t.remove();
      }
      async function poser(i) {
        if (annule) return;
        $r('prog').textContent = i >= cit.length ? 'Terminé ✓' : 'Citation ' + (i + 1) + ' / ' + cit.length;
        if (i >= cit.length) return fin();
        const c = cit[i], options = c.options || gens;
        await ecrire(500 + Math.random() * 300); if (annule) return;
        msg('bot', 'Qui a dit ça ?<blockquote class="q-citation">' + esc(c.texte) + '</blockquote>');
        saisie.innerHTML = options.map(o => `<button type="button" class="d-btn" data-o="${esc(o)}">${esc(o)}</button>`).join('');
        saisie.onclick = async e => {
          const b = e.target.closest('[data-o]'); if (!b) return;
          saisie.onclick = null; saisie.innerHTML = '';
          const rep = b.dataset.o, ok = rep === c.bonne;
          if (ok) score++;
          msg('moi', esc(rep));
          await ecrire(500); if (annule) return;
          msg('bot', (ok ? 'Bien vu ! ' : 'Raté… c’était ' + esc(c.bonne) + '. ') + (c.note ? esc(c.note) : ''));
          poser(i + 1);
        };
      }
      async function fin() {
        await ecrire(600); if (annule) return;
        const pct = score / cit.length;
        const mot = pct === 1 ? 'Sans faute, tu as une mémoire de serveur !' : pct >= 0.6 ? 'Pas mal du tout !' : 'Il va falloir relire l’historique…';
        msg('bot', 'Score : <b>' + score + ' / ' + cit.length + '</b>. ' + esc(mot));
        S('qui'); if (pct === 1) S('parfait');
        saisie.innerHTML = '<button type="button" class="d-btn sec" data-a="rejouer">Rejouer</button>';
        saisie.onclick = e => { if (e.target.closest('[data-a]')) { saisie.onclick = null; score = 0; log.innerHTML = ''; poser(0); } };
      }
      poser(0);
    }, { w: 580, h: 600 });
  }

  /* ======================== LECTEUR DE MUSIQUE ======================== */
  function ouvrirMusique(ctx) {
    const L = P().playlist;
    ctx.openWindow('Lecteur', (el, w) => {
      el.querySelector('.content').innerHTML =
        `<div class="wa">
           <div class="wa-ecran">
             <div class="wa-vis" data-r="vis" aria-hidden="true">${'<i></i>'.repeat(18)}</div>
             <div class="wa-infos"><div class="wa-titre"><span data-r="titre">—</span></div><div class="wa-temps" data-r="temps">00:00</div></div>
           </div>
           <input type="range" class="wa-seek" data-r="seek" min="0" max="1000" value="0" aria-label="Position dans la chanson">
           <div class="wa-ctrl">
             <button type="button" data-a="prec" aria-label="Précédent">⏮</button>
             <button type="button" data-a="play" data-r="play" aria-label="Lecture">▶</button>
             <button type="button" data-a="suiv" aria-label="Suivant">⏭</button>
             <span class="sp"></span>
             <label class="wa-vol">Vol <input type="range" data-r="vol" min="0" max="100" value="80" aria-label="Volume"></label>
           </div>
           <div class="wa-note" data-r="note"></div>
           <ol class="wa-liste" data-r="liste"></ol>
         </div>`;
      const $r = n => el.querySelector(`[data-r="${n}"]`);
      const audio = new Audio(); audio.preload = 'metadata'; audio.volume = 0.8;
      let i = 0, joue = false;
      const fmt = s => isFinite(s) ? String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(Math.floor(s % 60)).padStart(2, '0') : '00:00';
      const barres = [...$r('vis').children];
      const anim = setInterval(() => barres.forEach(b => { b.style.height = (joue ? 8 + Math.random() * 92 : 6) + '%'; }), 130);
      w.cleanup = () => { clearInterval(anim); audio.pause(); audio.removeAttribute('src'); audio.load(); };

      $r('liste').innerHTML = L.map((t, k) => `<li data-k="${k}"><span class="wa-n">${k + 1}.</span><span>${esc(t.titre)}${t.artiste ? ' — ' + esc(t.artiste) : ''}</span></li>`).join('');
      const maj = () => {
        const t = L[i];
        $r('titre').textContent = (t.titre || '') + (t.artiste ? ' — ' + t.artiste : '');
        $r('note').textContent = t.note ? '« ' + t.note + ' »' : '';
        $r('liste').querySelectorAll('li').forEach((li, k) => li.classList.toggle('on', k === i));
        $r('play').textContent = joue ? '⏸' : '▶';
      };
      function charger(k, lire) {
        i = (k + L.length) % L.length;
        audio.src = L[i].fichier; audio.load();
        $r('seek').value = 0; $r('temps').textContent = '00:00';
        joue = false; maj();
        if (lire) audio.play().catch(() => {});
      }
      audio.addEventListener('play', () => { joue = true; maj(); S('musique'); });
      audio.addEventListener('pause', () => { joue = false; maj(); });
      audio.addEventListener('ended', () => charger(i + 1, true));
      audio.addEventListener('timeupdate', () => {
        $r('temps').textContent = fmt(audio.currentTime) + ' / ' + fmt(audio.duration);
        if (audio.duration) $r('seek').value = Math.round(audio.currentTime / audio.duration * 1000);
      });
      audio.addEventListener('error', () => { joue = false; maj(); $r('note').textContent = 'Fichier introuvable : ' + L[i].fichier; });
      $r('seek').addEventListener('input', e => { if (audio.duration) audio.currentTime = e.target.value / 1000 * audio.duration; });
      $r('vol').addEventListener('input', e => { audio.volume = e.target.value / 100; });
      el.querySelector('.wa-ctrl').addEventListener('click', e => {
        const b = e.target.closest('[data-a]'); if (!b) return;
        if (b.dataset.a === 'play') { audio.paused ? audio.play().catch(() => {}) : audio.pause(); }
        else if (b.dataset.a === 'prec') charger(i - 1, true);
        else if (b.dataset.a === 'suiv') charger(i + 1, true);
      });
      $r('liste').addEventListener('click', e => { const li = e.target.closest('li[data-k]'); if (li) charger(+li.dataset.k, true); });
      charger(0, false);
    }, { w: 420, h: 560 });
  }

  window.Apps = {
    liste: () => LISTE.filter(a => a.visible()),
    visible: id => { const a = LISTE.find(x => x.id === id); return !!a && a.visible(); },
    ouvrir(id, ctx) {
      if (id === 'messenger') return ouvrirMessenger(ctx);
      if (id === 'qui') return ouvrirQui(ctx);
      if (id === 'musique') return ouvrirMusique(ctx);
    }
  };
})();
