// ===============================================================
// INTRODUCTIONS DES FICHES
//
// Deux ou trois phrases d'usage en tête de chaque fiche de vocabulaire : quand
// employer telle formule plutôt que telle autre, quelle mécanique se cache
// derrière une liste, quel piège guette un francophone.
//
// POURQUOI CE FICHIER EST SÉPARÉ DE content.js
// content.js contient les 341 phrases, relues et validées par un locuteur natif.
// Ce fichier-ci contient du commentaire rédigé, qui n'a PAS reçu la même
// validation. Les garder distincts évite de mélanger ce qui est vérifié et ce
// qui ne l'est pas, et permet de faire relire l'ensemble en lisant un seul
// fichier. À faire valider avant de considérer ces textes comme acquis.
//
// La clé est l'identifiant de la feuille dans PHRASEBOOK. Une fiche sans entrée
// ici s'affiche simplement sans introduction : rien ne casse.
// ===============================================================

const FICHE_INTROS = {

  // ---------- Salutations ----------
  salutations:
    "« Salam » passe partout, à toute heure et avec tout le monde : c'est la salutation la plus sûre quand on débute. « Sbah lkhir » ne se dit que le matin, « msa lkhir » à partir de l'après-midi. Attention à « kif dayer » : la forme change selon la personne à qui tu t'adresses, « kif dayra » pour une femme. Le français ne marque pas cette différence, c'est l'erreur la plus fréquente des débutants.",

  salutations_2:
    "Accueillir et prendre des nouvelles sont deux moments où le darija est particulièrement fourni. « Marhba bik » est ce que dit celui qui reçoit à celui qui arrive ; on l'entend dès le seuil d'une maison comme d'une boutique. Plusieurs de ces formules invoquent Dieu — « Allah ys3ed sbahek », « Allah yhefdek » : ce sont des politesses du quotidien, pas des déclarations religieuses, et elles sont toujours bien reçues.",

  salutations_3:
    "« Assalamou 3alaykoum » est plus formel que « salam » et appelle une réponse fixe : « w 3alaykoum salam ». La donner sans hésiter change immédiatement la façon dont on te perçoit. « Sellem li 3la lwalidin », salue tes parents, se dit en quittant quelqu'un dont tu connais la famille : c'est une attention très ordinaire au Maroc, et son absence se remarque davantage que sa présence.",

  // ---------- Se présenter ----------
  presentation:
    "De quoi te présenter en une minute. « Smiti » signifie littéralement « mon nom » : on dit « smiti Karim », sans verbe, là où le français ajoute « je m'appelle ». Pour l'âge en revanche, la logique rejoint la nôtre : « 3andi tlatin 3am », j'ai trente ans, avec le verbe avoir.",

  presentation_2:
    "Parler de soi demande le présent, qui se forme en darija avec le préfixe « kan- » : « kanseken » (j'habite), « kankhdem » (je travaille), « kant3ellem » (j'apprends). Une fois ce préfixe repéré, tu reconnais le présent partout. Ces phrases se complètent librement : « kanseken f Paris », « kankhdem f Casablanca ».",

  presentation_3:
    "De quoi tenir la conversation au-delà des premières phrases. Retiens surtout « 3awed liya 3afak, bchwiya » — répète-moi doucement, s'il te plaît : c'est elle qui te permet de rester dans l'échange plutôt que de le laisser retomber. Annoncer « kanhder chwiya ddarija », je parle un peu le darija, ajuste aussi les attentes et incite ton interlocuteur à ralentir.",

  // ---------- Expressions courantes ----------
  expressions:
    "Le socle de la politesse. « 3afak » sert à la fois de « s'il te plaît » et de formule pour aborder quelqu'un poliment. « Choukran » est compris partout. « Inchallah » ponctue le quotidien bien au-delà du religieux : il accompagne toute intention future, même la plus banale. Enfin « ma fhemtch » suivi de « 3awed 3afak » est le duo qui te sortira du plus grand nombre de situations.",

  exp_2:
    "Les mots qui nuancent. « Bezzaf » (beaucoup, trop) et « chwiya » (un peu) sont les deux curseurs que tu emploieras le plus souvent. « Safi » clôt une discussion : c'est bon, on s'arrête là. Attention à « machi », qui nie un nom ou un adjectif — « machi mezyan », ce n'est pas bien — alors que la négation d'un verbe s'encadre autrement, avec « ma… ch ».",

  exp_3:
    "Dix mots interrogatifs suffisent à poser presque n'importe quelle question, et ils se placent en tête de phrase comme en français. « Wach » ouvre une question fermée, « wach 3andek… ? », mais il est très souvent omis : une simple montée de la voix suffit, exactement comme quand on dit « tu viens ? ».",

  exp_4:
    "Situer dans le temps demande peu de mots, et ce sont toujours les mêmes : « daba » (maintenant), « ghedda » (demain), « lbareh » (hier). « Bchwiya » mérite une attention particulière : il veut dire doucement, et sert autant à demander qu'on ralentisse le débit qu'à conseiller la prudence.",

  exp_5:
    "Dire ce qu'on ressent passe souvent par une construction sans équivalent en français : « fiya jjou3 », littéralement « en moi la faim », pour dire j'ai faim. Même chose pour la soif. Les autres états se disent avec un simple adjectif, « 3eyyan » (fatigué), « ferhan » (content), sans verbe être : il n'existe pas au présent en darija.",

  exp_6:
    "La trousse de secours. « Bchhal hada ? » pour un prix, « fin… ? » pour un lieu, « 3awenni 3afak » pour demander de l'aide. Ajouter « 3afak » à la fin de n'importe quelle demande la rend polie, exactement comme « s'il te plaît » chez nous — et son absence s'entend.",

  exp_7:
    "Donner son avis tient à une poignée d'adjectifs. « Mezyan » est le passe-partout pour dire bien, « zwin » pour beau. Ils prennent un -a au féminin : « mezyana », « zwina ». Pour un plat, on dit « bnin », délicieux : c'est le compliment qui fait toujours plaisir à celui qui a cuisiné.",

  exp_8:
    "Ce sont ces formules, plus que le vocabulaire, qui font qu'on te répond en darija plutôt qu'en français. « Allah y3tik sseha » remercie quelqu'un pour son effort ou son travail, et n'a pas d'équivalent direct chez nous. « Tbarkallah 3lik » accompagne un compliment : on l'ajoute pour que l'éloge ne porte pas malheur, et l'oublier peut mettre mal à l'aise.",

  exp_9:
    "Des expressions qu'aucune liste de vocabulaire ne t'apprendra. « Chwiya b chwiya », petit à petit, s'emploie pour tout ce qui prend du temps — ton apprentissage compris. « 3la qed lhal » est une formule de modestie, la réponse qu'on donne quand on vous demande comment vont les choses. « Allah ghaleb » exprime la résignation devant ce qu'on ne peut pas changer.",

  exp_10:
    "Les proverbes tiennent une place réelle dans la conversation marocaine, bien plus qu'en français. En placer un au bon moment marque une familiarité avec la langue que le vocabulaire seul ne donne pas. Commence par « lli fat mat », ce qui est passé est passé, ou « sabr meftah lfaraj », la patience est la clé : tous deux s'emploient dans des situations très ordinaires.",

  // Les cinq fiches de chiffres n'apparaissent pas ici volontairement : elles portent
  // déjà un champ `note` dans content.js, qui énonce la règle et a été relu. Le gabarit
  // affiche cette note en priorité, et n'utilise ce fichier que pour les fiches qui n'en
  // ont pas — inutile de dire deux fois la même chose sur une même page.

  // ---------- Transports et directions ----------
  transports:
    "Bonne nouvelle pour un francophone : une partie du vocabulaire des transports est empruntée au français et se reconnaît à l'oreille — « tobis », « tran », « taxi ». Les directions, elles, sont à apprendre : « 3la lymin » à droite, « 3la chmal » à gauche, « nichan » tout droit. Ce sont les trois mots que tu prononceras le plus souvent dans un taxi.",

  transports_2:
    "Pour demander son chemin, tout part de « fin » (où). Remarque que le mot suivant change selon le genre du lieu : « fin kayn » devant un nom masculin, « fin kayna lmahatta » devant un nom féminin comme la gare. Les repères se donnent volontiers par rapport à un bâtiment connu — « hda jjame3 », à côté de la mosquée — plutôt que par un nom de rue.",

  transports_3:
    "De quoi gérer un trajet réel. Dans un petit taxi, « hett lcontour », mets le compteur, est la phrase la plus utile de cette fiche : elle évite la négociation et se dit sans agressivité. « Fin nnzel ? » sert dans un bus ou un grand taxi partagé, où les arrêts ne sont pas annoncés.",

  // ---------- Boissons et nourriture ----------
  nourriture:
    "Le thé à la menthe, « atay », dépasse largement le statut de boisson : il accompagne l'accueil, les visites et les négociations. Le refuser est possible mais se remarque ; en accepter un verre est la façon la plus simple d'entrer dans un échange. Le reste de cette fiche couvre les aliments que tu croiseras à chaque repas.",

  nourriture_2:
    "Regarde les transcriptions de cette fiche : « ssokkar », « zzit », mais « lmelha ». L'article se prononce différemment selon la première lettre du mot — devant certaines consonnes il se fond en doublant leur son, devant les autres il reste « l ». Personne ne t'en voudra de dire « lsokkar », mais comprendre pourquoi les Marocains disent « ssokkar » aide énormément à la compréhension orale.",

  nourriture_3:
    "Commander et apprécier. « Lhsab 3afak » demande l'addition. « Bnin bezzaf » est le compliment qui compte, à adresser à celui qui a cuisiné plutôt qu'au serveur. Et « bsahtek », littéralement à ta santé, se lance avant ou après le repas ; on y répond « Allah y3tik sseha »."

};

// Export pour server.js. Dans un navigateur `module` n'existe pas : la condition
// est fausse et cette ligne ne fait rien.
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { FICHE_INTROS };
}
