// Génère bureau.js à partir du contenu réel du dossier "bureau".
// Utilisation : node generer.js   (Netlify le lance tout seul à chaque mise en ligne)
const fs = require('fs');
const path = require('path');

const racine = path.join(__dirname, 'bureau');
const ignores = new Set(['.DS_Store', 'Thumbs.db', 'desktop.ini', '.gitkeep']);

function lire(dossier) {
  return fs.readdirSync(dossier, { withFileTypes: true })
    .filter(e => !e.name.startsWith('.') && !ignores.has(e.name))
    .sort((a, b) => b.isDirectory() - a.isDirectory() || a.name.localeCompare(b.name, 'fr', { numeric: true }))
    .map(e => e.isDirectory()
      ? { name: e.name, children: lire(path.join(dossier, e.name)) }
      : e.name);
}

if (!fs.existsSync(racine)) {
  console.error('Dossier "bureau" introuvable à côté de generer.js');
  process.exit(1);
}

const contenu = '// Fichier généré par generer.js : ne pas modifier à la main.\n' +
  'window.BUREAU = ' + JSON.stringify(lire(racine), null, 2) + ';\n';
fs.writeFileSync(path.join(__dirname, 'bureau.js'), contenu);
console.log('bureau.js mis à jour.');
