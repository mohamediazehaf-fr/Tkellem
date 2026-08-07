// ===============================================================
// PAGES INDEXABLES
//
// L'application vit dans /app : une seule URL, tout en JavaScript, donc à peu
// près invisible pour un moteur de recherche. Ce module expose le MÊME contenu
// sous forme de pages HTML classiques, une par catégorie du carnet et une par
// règle de langue. C'est ce que Google peut lire, classer et proposer à
// quelqu'un qui cherche « comment dire bonjour en darija ».
//
// La source est /public/data/content.js, le fichier que le navigateur charge
// aussi. Pas de copie, donc pas de divergence possible entre ce qu'affiche
// l'app et ce qu'indexe Google.
//
// Ces routes sont enregistrées AVANT le limiteur de débit de server.js : un
// robot d'indexation parcourt beaucoup d'URL d'affilée et se ferait bloquer.
// ===============================================================

const fs = require('fs');
const path = require('path');
const { PHRASEBOOK, GRAMMAR } = require('./public/data/content.js');

// Date de dernière modification du contenu, pour le plan de site. On lit la date du
// fichier source : elle avance à chaque déploiement qui touche au contenu, et
// jamais autrement — ce qui est exactement le signal attendu par un moteur.
function dateContenu() {
  try {
    return fs.statSync(path.join(__dirname, 'public', 'data', 'content.js'))
             .mtime.toISOString().slice(0, 10);
  } catch (e) {
    return null; // plutôt aucune date qu'une date fausse
  }
}

// Origine utilisée pour les URL canoniques et le plan de site. En variable
// d'environnement pour qu'un changement de domaine ne demande pas de toucher au code.
const SITE = (process.env.SITE_ORIGIN || 'https://beldi-darija.fr').replace(/\/+$/, '');

// ---------------------------------------------------------------
// Utilitaires
// ---------------------------------------------------------------

// Échappement HTML. Le contenu vient de nos propres fichiers, mais une
// apostrophe ou une esperluette mal placée casserait le balisage.
function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Les noms portent un numéro de palier (« 1. Les bases ») utile dans l'app,
// inutile et laid dans un titre de page.
function cleanName(name) {
  return String(name).replace(/^\d+\.\s*/, '').trim();
}

// Le slug dérive de l'identifiant, pas du nom : les identifiants sont uniques et
// stables, alors que deux rubriques différentes peuvent avoir un palier « 1. Les
// bases ». Une URL qui change casserait l'indexation acquise.
function slug(id) {
  return String(id).replace(/_/g, '-');
}

// Le carnet est un arbre. On l'aplatit en gardant le groupe parent, qui sert à
// composer un titre explicite : « Salutations en darija : les bases ».
function flatten(nodes, parent) {
  return nodes.flatMap(n => n.children ? flatten(n.children, n) : [{ leaf: n, group: parent || null }]);
}

// Le filtre n'est pas décoratif : une feuille sans phrases produirait une page vide,
// que Google classerait comme du contenu de faible qualité — mieux vaut ne pas la publier.
const LEAVES = flatten(PHRASEBOOK, null)
  .filter(e => Array.isArray(e.leaf.phrases) && e.leaf.phrases.length > 0);

function leafTitle(entry) {
  const nom = cleanName(entry.leaf.name);
  return entry.group
    ? `${cleanName(entry.group.name)} en darija : ${nom.charAt(0).toLowerCase() + nom.slice(1)}`
    : `${nom} en darija marocain`;
}

function grammarTitle(rule) {
  return `${cleanName(rule.name)} en darija marocain`;
}

// ---------------------------------------------------------------
// Gabarit
// ---------------------------------------------------------------

const CSS = `
*{box-sizing:border-box}
body{margin:0;background:#FFFBF4;color:#17211F;font-family:'Nunito',system-ui,sans-serif;
     font-size:17px;line-height:1.6;-webkit-font-smoothing:antialiased}
.wrap{max-width:900px;margin:0 auto;padding:0 clamp(20px,4vw,40px)}
a{color:#0E4F56}
header.top{display:flex;align-items:center;gap:12px;max-width:900px;margin:0 auto;
     padding:18px clamp(20px,4vw,40px)}
.mark{width:38px;height:38px;border-radius:11px;background:#0E4F56;color:#FFFBF4;display:grid;
     place-items:center;font-family:'Cairo',serif;font-size:19px;font-weight:700}
.brand{font-family:'Baloo 2',sans-serif;font-weight:800;font-size:20px;color:#0E4F56;flex:1;
     text-decoration:none}
.btn{display:inline-block;background:#FFB238;color:#3D2A08;text-decoration:none;border-radius:15px;
     padding:13px 24px;font-family:'Baloo 2',sans-serif;font-weight:800;box-shadow:0 4px 0 #B87A0F}
nav.fil{font-size:14px;color:#7C8A88;padding:10px 0 0}
nav.fil a{color:#7C8A88}
h1{font-family:'Baloo 2',sans-serif;font-weight:800;font-size:clamp(27px,4.4vw,38px);
   line-height:1.15;color:#0E4F56;margin:16px 0 12px}
h2{font-family:'Baloo 2',sans-serif;font-weight:800;font-size:22px;color:#0E4F56;margin:38px 0 12px}
.intro{font-size:18px;max-width:70ch;margin:0 0 8px}
.regle{background:#fff;border:1.5px solid #EDE6D8;border-radius:16px;padding:18px 20px;margin:22px 0;
   max-width:78ch}
table{width:100%;border-collapse:collapse;background:#fff;border:1.5px solid #EDE6D8;
   border-radius:16px;overflow:hidden;margin:20px 0}
th,td{text-align:left;padding:12px 14px;border-bottom:1px solid #EDE6D8;vertical-align:top}
tr:last-child td{border-bottom:none}
th{background:#F7F2E7;font-family:'Baloo 2',sans-serif;font-size:14.5px;color:#0E4F56}
.ar{font-family:'Cairo',serif;font-size:20px;direction:rtl;font-weight:700;white-space:nowrap}
.la{font-style:italic;color:#186E77}
.cta{background:#fff;border:1.5px solid #EDE6D8;border-radius:18px;padding:22px;margin:34px 0;
   text-align:center}
.cta p{margin:0 0 14px;color:#4c463c}
.liens{display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:10px;margin:14px 0 0}
.liens a{display:block;background:#fff;border:1.5px solid #EDE6D8;border-radius:13px;padding:12px 15px;
   text-decoration:none;font-weight:700;font-size:15.5px}
footer{border-top:1px solid #EDE6D8;margin-top:44px;padding:22px 0 40px;font-size:14px;color:#7C8A88;
   text-align:center}
@media(max-width:620px){body{font-size:16px}.ar{white-space:normal}th,td{padding:10px}}
`;

// Le fil d'Ariane est décrit une seule fois, sous forme de données, puis rendu deux
// fois : en HTML pour le lecteur, en JSON-LD pour Google — qui l'affiche alors dans
// ses résultats à la place de l'URL brute. Une seule source, donc pas de divergence.
// Le dernier maillon est la page courante : il n'a pas de lien.
function filHtml(crumbs) {
  return crumbs.map(c => c.url ? `<a href="${esc(c.url)}">${esc(c.nom)}</a>` : esc(c.nom)).join(' › ');
}
function filJsonLd(crumbs) {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((c, i) => {
      const e = { '@type': 'ListItem', position: i + 1, name: c.nom };
      if (c.url) e.item = SITE + c.url;
      return e;
    })
  };
  // `<` échappé : un contenu contenant </script> couperait le bloc en deux.
  return JSON.stringify(data).replace(/</g, '\\u003c');
}

function layout({ title, description, canonical, crumbs, body }) {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(title)} | Beldi</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${esc(canonical)}">
<meta property="og:type" content="article">
<meta property="og:site_name" content="Beldi">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${esc(canonical)}">
<meta property="og:image" content="${SITE}/og-image.png">
<meta name="twitter:card" content="summary_large_image">
<meta property="og:locale" content="fr_FR">
<link rel="icon" href="/icons/icon-192.png">
<meta name="theme-color" content="#0E4F56">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Cairo:wght@700&family=Baloo+2:wght@700;800&family=Nunito:wght@400;600;700;800&display=swap" rel="stylesheet">
<script type="application/ld+json">${filJsonLd(crumbs)}</script>
<style>${CSS}</style>
</head>
<body>
<header class="top">
  <div class="mark">ب</div>
  <a class="brand" href="/">Beldi</a>
  <a class="btn" href="/app">Ouvrir l'app</a>
</header>
<main class="wrap">
  <nav class="fil">${filHtml(crumbs)}</nav>
  ${body}
  <div class="cta">
    <p><strong>Ces phrases s'écoutent et se répètent.</strong> Dans l'application, tu entends la
    prononciation, tu la répètes au micro et tu es corrigé.</p>
    <a class="btn" href="/app">Commencer, c'est gratuit</a>
  </div>
</main>
<footer><div class="wrap">Beldi — apprendre le darija marocain en le parlant</div></footer>
</body>
</html>`;
}

// Tableau des phrases, commun aux deux types de page.
function table(phrases) {
  const lignes = phrases.map(p => `    <tr>
      <td class="ar">${esc(p.ar)}</td>
      <td class="la">${esc(p.latin)}</td>
      <td>${esc(p.fr)}</td>
    </tr>`).join('\n');
  return `<table>
  <thead><tr><th>En arabe</th><th>Prononciation</th><th>En français</th></tr></thead>
  <tbody>
${lignes}
  </tbody>
</table>`;
}

// Liens vers les autres pages : c'est ce qui permet à un robot de tout parcourir
// depuis n'importe quelle page, et à un lecteur de continuer sa lecture.
function autresLiens(titre, liens) {
  if (!liens.length) return '';
  return `<h2>${esc(titre)}</h2>
<div class="liens">
${liens.map(l => `  <a href="${esc(l.url)}">${esc(l.nom)}</a>`).join('\n')}
</div>`;
}

// ---------------------------------------------------------------
// Enregistrement des routes
// ---------------------------------------------------------------

function registerSeoRoutes(app) {

  const urlFeuille = e => `/darija/${slug(e.leaf.id)}`;
  const urlRegle = r => `/grammaire/${slug(r.id)}`;

  // --- Sommaire ---
  app.get('/darija', (req, res) => {
    const body = `
<h1>Apprendre le darija marocain : toutes les fiches</h1>
<p class="intro">Le darija est la langue parlée au quotidien au Maroc. Chaque fiche donne les
expressions en écriture arabe, leur prononciation en lettres latines et leur traduction française.
${LEAVES.length} fiches de vocabulaire et ${GRAMMAR.length} règles de langue.</p>
${autresLiens('Vocabulaire par situation', LEAVES.map(e => ({ url: urlFeuille(e), nom: leafTitle(e) })))}
${autresLiens('Comprendre la langue', GRAMMAR.map(r => ({ url: urlRegle(r), nom: grammarTitle(r) })))}`;

    res.type('html').send(layout({
      title: 'Apprendre le darija marocain : vocabulaire et grammaire',
      description: `Toutes les fiches pour apprendre le darija marocain : ${LEAVES.length} listes de vocabulaire par situation et ${GRAMMAR.length} règles expliquées, avec écriture arabe, prononciation et traduction.`,
      canonical: `${SITE}/darija`,
      crumbs: [{ nom: 'Accueil', url: '/' }, { nom: 'Fiches de darija' }],
      body
    }));
  });

  // --- Une fiche de vocabulaire ---
  app.get('/darija/:slug', (req, res, next) => {
    const i = LEAVES.findIndex(e => slug(e.leaf.id) === req.params.slug);
    if (i === -1) return next();

    const e = LEAVES[i];
    const titre = leafTitle(e);
    const nb = e.leaf.phrases.length;
    const voisins = [LEAVES[i - 1], LEAVES[i + 1]].filter(Boolean)
      .map(v => ({ url: urlFeuille(v), nom: leafTitle(v) }));

    const body = `
<h1>${esc(titre)}</h1>
<p class="intro">${nb} expressions en darija marocain, avec l'écriture arabe, la prononciation
en lettres latines et la traduction en français.</p>
${table(e.leaf.phrases)}
${autresLiens('À lire ensuite', voisins.concat([{ url: '/darija', nom: 'Toutes les fiches' }]))}`;

    res.type('html').send(layout({
      title: titre,
      description: `${nb} expressions de darija marocain : ${e.leaf.phrases.slice(0, 3).map(p => p.fr).join(', ')}… Écriture arabe, prononciation et traduction française.`,
      canonical: `${SITE}${urlFeuille(e)}`,
      crumbs: [{ nom: 'Accueil', url: '/' }, { nom: 'Fiches de darija', url: '/darija' }, { nom: cleanName(e.leaf.name) }],
      body
    }));
  });

  // --- Une règle de langue ---
  app.get('/grammaire/:slug', (req, res, next) => {
    const i = GRAMMAR.findIndex(r => slug(r.id) === req.params.slug);
    if (i === -1) return next();

    const r = GRAMMAR[i];
    const titre = grammarTitle(r);
    const voisins = [GRAMMAR[i - 1], GRAMMAR[i + 1]].filter(Boolean)
      .map(v => ({ url: urlRegle(v), nom: grammarTitle(v) }));

    // r.note est du HTML que nous écrivons nous-mêmes (des <strong>), donc non échappé.
    const body = `
<h1>${esc(titre)}</h1>
${r.note ? `<div class="regle">${r.note}</div>` : ''}
<h2>Exemples</h2>
${table(r.phrases || [])}
${autresLiens('À lire ensuite', voisins.concat([{ url: '/darija', nom: 'Toutes les fiches' }]))}`;

    res.type('html').send(layout({
      title: titre,
      description: `${cleanName(r.name)} en darija marocain : la règle expliquée simplement, avec ${r.phrases.length} exemples en écriture arabe, prononciation et traduction.`,
      canonical: `${SITE}${urlRegle(r)}`,
      crumbs: [{ nom: 'Accueil', url: '/' }, { nom: 'Fiches de darija', url: '/darija' }, { nom: cleanName(r.name) }],
      body
    }));
  });

  // --- Plan de site ---
  app.get('/sitemap.xml', (req, res) => {
    const urls = ['/', '/darija']
      .concat(LEAVES.map(urlFeuille))
      .concat(GRAMMAR.map(urlRegle));
    const maj = dateContenu();
    const lastmod = maj ? `<lastmod>${maj}</lastmod>` : '';
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url><loc>${SITE}${u}</loc>${lastmod}</url>`).join('\n')}
</urlset>`;
    res.type('application/xml').send(xml);
  });

  // --- robots.txt ---
  // /api/ est interdit : ces routes coûtent de l'argent à chaque appel et n'ont
  // aucun intérêt pour un moteur de recherche.
  app.get('/robots.txt', (req, res) => {
    res.type('text/plain').send(
      `User-agent: *\nAllow: /\nDisallow: /api/\n\nSitemap: ${SITE}/sitemap.xml\n`
    );
  });
}

module.exports = { registerSeoRoutes, SITE };
