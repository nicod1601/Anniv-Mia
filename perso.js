/* Tous les textes personnels du site, au même endroit : modifie-les librement.
   Les blocs marqués EXEMPLE sont des textes d'essai à remplacer par les vrais. */
window.PERSO = {

  /* ---------- Dates (laisse null pour ne rien bloquer) ---------- */
  anniversaire: {
    // Le site reste fermé (compte à rebours) jusqu'à cette date. Format : 'AAAA-MM-JJTHH:MM'  ex : '2026-12-25T00:00'
    ouverture: null,
    // Le dossier verrouillé ne s'ouvre pas avant cette date, même si les jeux sont terminés
    cadeau: null,
    titre: 'Pas encore…',
    texte: 'Quelque chose t’attend ici, mais il faut encore un peu de patience.'
  },

  /* ---------- Écran de fête (les trois jeux sont terminés) ---------- */
  fete: {
    titre: 'Tu as tout terminé !',
    texte: 'Discord, Genshin, Honkai… tu es allée jusqu’au bout.\nUn dossier vient de se déverrouiller, et il est pour toi.',
    bouton: 'Ouvrir le dossier'
  },

  /* ---------- Bloc-notes caché (clic sur l'horloge) ---------- */
  secret: {
    titre: 'secret.txt',
    texte:
      'Si tu lis ça, c’est que tu es curieuse. Et c’est une des choses que j’aime bien chez toi.\n\n' +
      'Je voulais que ce site te fasse sourire, et peut-être un peu plus.\n' +
      'Merci d’être là, tout simplement.\n\n' +
      '— Nico'
  },

  /* ---------- Écran de fin (Démarrer > Arrêter l'ordinateur) ---------- */
  fin: {
    lignes: ['Un site fabriqué avec soin', 'par Nico', 'pour Mia'],
    message: 'Merci d’avoir pris le temps de tout explorer.\nJ’espère que ça t’a fait sourire.',
    bouton: 'Redémarrer'
  },

  /* ---------- Messenger : une conversation rejouée (EXEMPLE) ----------
     de : 'mia' (à droite) ou 'nico' (à gauche) — nouveau : true pour le message écrit rien que pour elle
     pause : (facultatif) attente en millisecondes avant le message                                       */
  messenger: {
    contact: 'Nico', statut: 'En ligne',
    intro: 'Une vieille conversation, rejouée…',
    messages: [
      { de: 'mia',  texte: 'Tu dors ?' },
      { de: 'nico', texte: 'Jamais avant 3h du matin, tu me connais.' },
      { de: 'mia',  texte: 'Mdr oui. Tu as vu le dernier flop de Shadow ?' },
      { de: 'nico', texte: 'Évidemment. Il bat des records.' },
      { de: 'mia',  texte: 'On ferait bien un petit jeu ce soir.' },
      { de: 'nico', texte: 'Carrément. Je te laisse choisir.' },
      { de: 'nico', texte: 'Et un message de plus, écrit rien que pour toi :', nouveau: true },
      { de: 'nico', texte: 'Merci d’être dans ma vie, Mia. Joyeux anniversaire.', nouveau: true }
    ]
  },

  /* ---------- Qui a dit ça ? : citations de vos vrais messages (EXEMPLE) ---------- */
  quiDitCa: {
    titre: 'Qui a dit ça ?',
    serveur: 'Serveur de Koki',
    joueuse: 'Mia',
    personnes: ['Mia', 'Nico', 'Navi', 'Shadow', 'Ronni', 'Koki', 'Eski'],
    citations: [
      { texte: 'J’arrive dans 5 minutes.', bonne: 'Shadow', note: '…il est arrivé 45 minutes plus tard.' },
      { texte: 'Quelqu’un a un plan pour ce soir ?', bonne: 'Navi' },
      { texte: 'Je n’ai pas flop, c’est le jeu qui a bugué.', bonne: 'Shadow', note: 'Classique.' },
      { texte: 'Je vous préviens, je ne dors pas ce soir.', bonne: 'Nico' },
      { texte: 'On se fait une partie ? Juste une.', bonne: 'Ronni', note: 'Il n’y en a jamais qu’une.' }
    ]
  },

  /* ---------- Lecteur de musique : tes chansons ----------
     Il apparaît sur le bureau dès que cette liste n'est plus vide.
     Mets tes fichiers mp3 dans le dossier « musique » à la racine du site, puis décommente / adapte :
  playlist: [
    { titre: 'Titre de la chanson', artiste: 'Artiste', fichier: 'musique/chanson1.mp3',
      note: 'Pourquoi cette chanson compte pour vous.' },
    { titre: 'Une autre', artiste: 'Artiste', fichier: 'musique/chanson2.mp3', note: 'Un souvenir lié.' }
  ]
  */
  playlist: []
};
