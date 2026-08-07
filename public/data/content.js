// ===============================================================
// CONTENU PARTAGE - carnet de phrases et regles de langue
//
// Ce fichier est la SOURCE UNIQUE du contenu pedagogique. Il est lu deux fois :
//   - par le navigateur, via <script src="/data/content.js"> place AVANT le
//     script principal de app.html : les const deviennent des liaisons globales
//     que le reste de l'app utilise sans aucun changement ;
//   - par server.js, via require(), pour fabriquer les pages indexables.
//
// Toute modification ici se repercute des deux cotes. Ne jamais recopier ces
// tableaux dans app.html : la divergence serait silencieuse, l'app afficherait
// une chose et Google en indexerait une autre.
// ===============================================================

// ---------------------------------------------------------------
// CARNET DE PHRASES
// ---------------------------------------------------------------
const PHRASEBOOK = [
  { id:'salutations_groupe', icon:'👋', name:'Salutations', progressive:true, children:[
  { id:'salutations', icon:'👋', name:'1. Les bases', phrases:[
    {ar:'سلام',latin:'Salam',fr:'Salut'},
    {ar:'صباح الخير',latin:'Sbah lkhir',fr:'Bonjour (le matin)'},
    {ar:'مسا الخير',latin:'Msa lkhir',fr:'Bonsoir'},
    {ar:'كيف داير',latin:'Kif dayer',fr:'Comment ça va (à un homme)'},
    {ar:'كيف دايرة',latin:'Kif dayra',fr:'Comment ça va (à une femme)'},
    {ar:'لاباس، الحمد لله',latin:'Labas, lhamdulah',fr:'Ça va, merci Dieu'},
    {ar:'بسلامة',latin:'Bslama',fr:'Au revoir'},
    {ar:'تصبح على خير',latin:'Tsbah 3la khir',fr:'Bonne nuit'}
  ]},
  { id:'salutations_2', icon:'🤗', name:'2. Accueillir, prendre des nouvelles', phrases:[
    {ar:'مرحبا بيك',latin:'Marhba bik',fr:'Sois le bienvenu'},
    {ar:'أهلا وسهلا',latin:'Ahlan wa sahlan',fr:'Bienvenue (chaleureux)'},
    {ar:'كيف الحال؟',latin:'Kif lhal?',fr:'Comment vas-tu ? (neutre)'},
    {ar:'كلشي بخير؟',latin:'Koulchi bikhir?',fr:'Tout va bien ?'},
    {ar:'أش خبارك؟',latin:'Ach khbarek?',fr:'Quelles nouvelles ?'},
    {ar:'الله يسعد صباحك',latin:'Allah ys3ed sbahek',fr:'Que ta matinée soit heureuse'},
    {ar:'الله يحفظك',latin:'Allah yhefdek',fr:'Que Dieu te garde'},
    {ar:'تهلا',latin:'Thella',fr:'Porte-toi bien (au départ)'}
  ]},
  { id:'salutations_3', icon:'🎓', name:'3. Comme un habitué', phrases:[
    {ar:'السلام عليكم',latin:'Assalamou 3alaykoum',fr:'Salutation complète, respectueuse'},
    {ar:'وعليكم السلام',latin:'W 3alaykoum salam',fr:'Réponse à la salutation'},
    {ar:'شحال هادي ما تشاوفنا',latin:'Chhal hadi ma tchawefna',fr:"Ça fait longtemps qu'on ne s'est pas vus"},
    {ar:'كيداير مع الصحة؟',latin:'Kidayer m3a sseha?',fr:'Et la santé, ça va ?'},
    {ar:'الله يعاونك',latin:'Allah y3awnek',fr:"Bon courage (à quelqu'un qui travaille)"},
    {ar:'سلم لي على الوالدين',latin:'Sellem li 3la lwalidin',fr:'Salue tes parents de ma part'},
    {ar:'على الله نتلاقاو',latin:'3la Allah ntlaqaw',fr:'On se reverra, si Dieu veut'},
    {ar:'تهلا في راسك',latin:'Thella f rasek',fr:'Prends soin de toi'}
  ]}
  ]},
  { id:'presentation_groupe', icon:'🙋', name:'Se présenter', progressive:true, children:[
  { id:'presentation', icon:'🙋', name:'1. Qui tu es', phrases:[
    {ar:'سميتي...',latin:'Smiti...',fr:"Je m'appelle..."},
    {ar:'أسمك أشنو؟',latin:'Asmek achno?',fr:"Comment tu t'appelles ?",alt:['Kif smitek']},
    {ar:'منين انت؟',latin:'Mnin nta?',fr:"D'où es-tu ?"},
    {ar:'أنا من فرنسا',latin:'Ana men fransa',fr:'Je suis de France'},
    {ar:'شحال ف عمرك؟',latin:'Chhal f 3omrek?',fr:'Quel âge as-tu ?'},
    {ar:'عندي ... عام',latin:'3andi ... 3am',fr:"J'ai ... ans"},
    {ar:'فرحت بيك',latin:'Frahte bik',fr:'Ravi de te rencontrer'}
  ]},
  { id:'presentation_2', icon:'👨‍👩‍👧', name:'2. Ta vie, ta famille', phrases:[
    {ar:'أنا متزوج',latin:'Ana mzewwej',fr:'Je suis marié'},
    {ar:'أنا مزال',latin:'Ana mazal',fr:'Je suis encore célibataire'},
    {ar:'عندي وليدات',latin:'3andi wlidat',fr:"J'ai des enfants"},
    {ar:'كنسكن ف...',latin:'Kanseken f...',fr:"J'habite à..."},
    {ar:'كنخدم ف...',latin:'Kankhdem f...',fr:'Je travaille dans...'},
    {ar:'أنا طالب',latin:'Ana taleb',fr:'Je suis étudiant'},
    {ar:'كنتعلم الدارجة',latin:'Kant3ellem ddarija',fr:"J'apprends le darija"},
    {ar:'الوالد ديالي مغربي',latin:'Lwalid dyali maghrabi',fr:'Mon père est marocain'}
  ]},
  { id:'presentation_3', icon:'💬', name:'3. Aller plus loin', phrases:[
    {ar:'أصلي من المغرب',latin:'Asli men lmaghrib',fr:'Je suis d’origine marocaine'},
    {ar:'كنهضر شوية الدارجة',latin:'Kanhder chwiya ddarija',fr:'Je parle un peu le darija'},
    {ar:'مازال كنتعلم',latin:'Mazal kant3ellem',fr:"J'apprends encore"},
    {ar:'جيت هنا للعطلة',latin:'Jit hna l l3otla',fr:'Je suis venu ici en vacances'},
    {ar:'كنبغي المغرب بزاف',latin:'Kanebghi lmaghrib bezzaf',fr:"J'aime beaucoup le Maroc"},
    {ar:'أشمن مدينة كتسكن؟',latin:'Achmen mdina katseken?',fr:'Dans quelle ville habites-tu ?'},
    {ar:'أشنو كتخدم؟',latin:'Achnou katkhdem?',fr:'Tu fais quoi comme travail ?'},
    {ar:'عاود ليا عافاك، بشوية',latin:'3awed liya 3afak, bchwiya',fr:'Répète doucement, merci'}
  ]}
  ]},
  // Dix paliers de dix, débloqués l'un après l'autre : on ne voit le suivant qu'en
  // ayant validé le précédent. Le premier garde l'identifiant 'expressions' pour ne
  // pas effacer la progression des utilisateurs actuels.
  { id:'expressions_groupe', icon:'💬', name:'Expressions courantes', progressive:true, children:[
  { id:'expressions', icon:'🤝', name:'1. La politesse essentielle', phrases:[
    {ar:'عافاك',latin:'3afak',fr:"S'il te plaît"},
    {ar:'شكرا',latin:'Choukran',fr:'Merci'},
    {ar:'بلا جميل',latin:'Bla jmil',fr:'De rien'},
    {ar:'سمح لي',latin:'Smah li',fr:'Excuse-moi / pardon'},
    {ar:'واخا',latin:'Wakha',fr:"D'accord"},
    {ar:'إن شاء الله',latin:'Inchallah',fr:'Si Dieu le veut'},
    {ar:'ماشي مشكل',latin:'Machi mouchkil',fr:'Pas de souci'},
    {ar:'نعم / لا',latin:'Ih / Lla',fr:'Oui / Non'},
    {ar:'ما فهمتش',latin:'Ma fhemtch',fr:"Je n'ai pas compris"},
    {ar:'عاود عافاك',latin:'3awed 3afak',fr:"Répète s'il te plaît"}
  ]},
  { id:'exp_2', icon:'👌', name:'2. Approuver, nuancer', phrases:[
    {ar:'إيوا',latin:'Iwa',fr:'Oui, voilà'},
    {ar:'يمكن',latin:'Yemken',fr:'Peut-être'},
    {ar:'ماشي',latin:'Machi',fr:"Ce n'est pas"},
    {ar:'صافي',latin:'Safi',fr:"C'est bon, ça suffit"},
    {ar:'بزاف',latin:'Bezzaf',fr:'Beaucoup, trop'},
    {ar:'شوية',latin:'Chwiya',fr:'Un peu'},
    {ar:'كافي',latin:'Kafi',fr:'Assez'},
    {ar:'ياك؟',latin:'Yak?',fr:"N'est-ce pas ?"},
    {ar:'بالتأكيد',latin:'Bettakid',fr:'Certainement'},
    {ar:'على الأقل',latin:'3la lqell',fr:'Au moins'}
  ]},
  { id:'exp_3', icon:'❓', name:'3. Poser une question', phrases:[
    {ar:'شكون؟',latin:'Chkoun?',fr:'Qui ?'},
    {ar:'أشنو؟',latin:'Achnou?',fr:'Quoi ?'},
    {ar:'فين؟',latin:'Fin?',fr:'Où ?'},
    {ar:'إمتى؟',latin:'Imta?',fr:'Quand ?'},
    {ar:'علاش؟',latin:'3lach?',fr:'Pourquoi ?'},
    {ar:'كيفاش؟',latin:'Kifach?',fr:'Comment ?'},
    {ar:'شحال؟',latin:'Chhal?',fr:'Combien ?'},
    {ar:'واش...؟',latin:'Wach...?',fr:'Est-ce que... ?'},
    {ar:'أشمن واحد؟',latin:'Achmen wahed?',fr:'Lequel ?'},
    {ar:'فوقاش؟',latin:'Fouqach?',fr:'À quelle heure ?'}
  ]},
  { id:'exp_4', icon:'⏰', name:'4. Situer dans le temps', phrases:[
    {ar:'اليوم',latin:'Lyoum',fr:"Aujourd'hui"},
    {ar:'غدا',latin:'Ghedda',fr:'Demain'},
    {ar:'البارح',latin:'Lbareh',fr:'Hier'},
    {ar:'دابا',latin:'Daba',fr:'Maintenant'},
    {ar:'من بعد',latin:'Men be3d',fr:'Plus tard'},
    {ar:'دغيا',latin:'Deghya',fr:'Vite, tout de suite'},
    {ar:'بشوية',latin:'Bchwiya',fr:'Doucement'},
    {ar:'كل نهار',latin:'Koul nhar',fr:'Chaque jour'},
    {ar:'مرة مرة',latin:'Marra marra',fr:'De temps en temps'},
    {ar:'ديما',latin:'Dima',fr:'Toujours'}
  ]},
  { id:'exp_5', icon:'💗', name:'5. Dire ce que tu ressens', phrases:[
    {ar:'فرحان',latin:'Ferhan',fr:'Content'},
    {ar:'مقلق',latin:'Mqelleq',fr:'Contrarié'},
    {ar:'عيان',latin:'3eyyan',fr:'Fatigué'},
    {ar:'فيا الجوع',latin:'Fiya jjou3',fr:"J'ai faim"},
    {ar:'فيا العطش',latin:'Fiya l3tach',fr:"J'ai soif"},
    {ar:'كنبغي',latin:'Kanebghi',fr:"J'aime"},
    {ar:'ما كنبغيش',latin:'Ma kanebghich',fr:"Je n'aime pas"},
    {ar:'خايف',latin:'Khayef',fr:"J'ai peur"},
    {ar:'مستعجل',latin:'Msta3jel',fr:'Pressé',alt:['mzeroub']},
    {ar:'بخير',latin:'Bikhir',fr:'Je vais bien'}
  ]},
  { id:'exp_6', icon:'🧭', name:'6. Se débrouiller', phrases:[
    {ar:'عاوني عافاك',latin:'3awenni 3afak',fr:"Aide-moi s'il te plaît"},
    {ar:'ما عرفتش',latin:'Ma 3reftch',fr:'Je ne sais pas'},
    {ar:'ضاع ليا',latin:'Da3 liya',fr:"Je l'ai perdu",alt:['Woudartou']},
    {ar:'تكلم بشوية عافاك',latin:'Tkellem bchwiya 3afak',fr:'Parle doucement, merci'},
    {ar:'كتهضر لفرنسي؟',latin:'Katehder lfransi?',fr:'Tu parles français ?'},
    {ar:'بغيت نمشي ل...',latin:'Bghit nemchi l...',fr:'Je veux aller à...'},
    {ar:'عندك...؟',latin:'3andek...?',fr:'Est-ce que tu as... ?'},
    {ar:'بشحال هادا؟',latin:'Bchhal hada?',fr:'Combien coûte ceci ?'},
    {ar:'خلاص',latin:'Khlas',fr:"C'est réglé, terminé"},
    {ar:'وقف هنا عافاك',latin:'Wqef hna 3afak',fr:"Arrête-toi ici s'il te plaît"}
  ]},
  { id:'exp_7', icon:'⭐', name:'7. Donner ton avis', phrases:[
    {ar:'زوين',latin:'Zwin',fr:'Beau, joli'},
    {ar:'خايب',latin:'Khayb',fr:'Laid, mauvais'},
    {ar:'مزيان',latin:'Mezyan',fr:'Bien'},
    {ar:'ما مزيانش',latin:'Ma mezyanch',fr:'Pas bien'},
    {ar:'بنين',latin:'Bnin',fr:'Délicieux'},
    {ar:'غالي',latin:'Ghali',fr:'Cher'},
    {ar:'رخيص',latin:'Rkhis',fr:'Bon marché'},
    {ar:'صعيب',latin:'S3ib',fr:'Difficile'},
    {ar:'ساهل',latin:'Sahel',fr:'Facile'},
    {ar:'عجبني',latin:'3jebni',fr:"Ça m'a plu"}
  ]},
  { id:'exp_8', icon:'🙏', name:'8. Les formules qui font marocain', phrases:[
    {ar:'الله يعطيك الصحة',latin:'Allah y3tik sseha',fr:'Merci (littéralement : que Dieu te donne la santé)'},
    {ar:'الله يخليك',latin:'Allah ykhellik',fr:"Je t'en prie, de grâce"},
    {ar:'تبارك الله عليك',latin:'Tbarkallah 3lik',fr:'Bravo, félicitations'},
    {ar:'الحمد لله',latin:'Lhamdoullah',fr:'Dieu merci'},
    {ar:'مبروك',latin:'Mabrouk',fr:'Félicitations'},
    {ar:'الله يسهل',latin:'Allah ysehhel',fr:'Que Dieu facilite'},
    {ar:'تهلا في راسك',latin:'Thella f rasek',fr:'Prends soin de toi'},
    {ar:'بسلامة',latin:'Bslama',fr:'Va en paix'},
    {ar:'الله يرحم الوالدين',latin:'Allah yrhem lwalidin',fr:'Formule de remerciement appuyé'},
    {ar:'واه؟',latin:'Wah?',fr:'Ah bon ?'}
  ]},
  { id:'exp_9', icon:'🎭', name:'9. Expressions imagées', phrases:[
    {ar:'شوية بشوية',latin:'Chwiya b chwiya',fr:'Petit à petit'},
    {ar:'على قد الحال',latin:'3la qed lhal',fr:'Modestement, comme on peut'},
    {ar:'الله غالب',latin:'Allah ghaleb',fr:"On n'y peut rien, c'est ainsi"},
    {ar:'صافي بقيت أنا',latin:'Safi bqit ana',fr:"Ça suffit, j'arrête là"},
    {ar:'بصح؟',latin:'Bsseh?',fr:'Vraiment ?'},
    {ar:'ما كاين باس',latin:'Ma kayn bas',fr:'Il n’y a pas de mal'},
    {ar:'دير النية',latin:'Dir nniya',fr:'Fais-le de bon cœur'},
    {ar:'غير بشوية عليك',latin:'Ghir bchwiya 3lik',fr:'Vas-y doucement'},
    {ar:'واقيلا',latin:'Waqila',fr:'Il me semble que'},
    {ar:'زعما؟',latin:'Z3ma?',fr:'Ah bon, c’est-à-dire ?'}
  ]},
  { id:'exp_10', icon:'🏅', name:'10. Proverbes et sagesse', phrases:[
    {ar:'الصبر مفتاح الفرج',latin:'Sabr meftah lfaraj',fr:'La patience est la clé du salut'},
    {ar:'اللي فات مات',latin:'Lli fat mat',fr:'Ce qui est passé est passé'},
    {ar:'يد وحدة ما كتصفقش',latin:'Yed wehda ma katsefeqch',fr:"Une seule main n'applaudit pas"},
    {ar:'الجار قبل الدار',latin:'Ljar qbel ddar',fr:'Le voisin avant la maison'},
    {ar:'حبة حبة كتعمر الخابية',latin:'Hebba hebba kat3emmer lkhabya',fr:'Grain par grain, le pot se remplit'},
    {ar:'كل تأخيرة فيها خيرة',latin:'Koul takhira fiha khira',fr:'Tout retard a du bon'},
    {ar:'اللي بغا العسل يصبر لقريص النحل',latin:'Lli bgha l3sel ysber l qris nhel',fr:'Qui veut le miel supporte les piqûres'},
    {ar:'ديما الحق كيبان',latin:'Dima lhaq kayban',fr:'La vérité finit toujours par paraître'},
    {ar:'اللي ما عندو ما يخسر',latin:'Lli ma 3ando ma ykhser',fr:"Qui n'a rien n'a rien à perdre"},
    {ar:'الله يجيب الخير',latin:'Allah yjib lkhir',fr:'Que Dieu apporte le bien'}
  ]}
  ]}, // fin du groupe "Expressions courantes"
  // Nœud de regroupement : pas de "phrases", donc pas de progression propre — il ne
  // sert qu'à ranger les paliers de nombres sous une seule carte au premier niveau.
  { id:'chiffres_groupe', icon:'🔢', name:'Les chiffres', children:[
  { id:'chiffres', icon:'🔢', name:'1 à 10',
    note:"Ces dix mots sont la base de tout le système : les nombres jusqu'à 20, les dizaines, les centaines et les milliers se construisent tous à partir d'eux.",
    phrases:[
    {ar:'صفر',latin:'Sifr',fr:'Zéro (0)'},
    {ar:'واحد',latin:'Wahed',fr:'Un (1)'},
    {ar:'جوج',latin:'Jouj',fr:'Deux (2)'},
    {ar:'تلاتة',latin:'Tlata',fr:'Trois (3)'},
    {ar:'ربعة',latin:"Rab3a",fr:'Quatre (4)'},
    {ar:'خمسة',latin:'Khamsa',fr:'Cinq (5)'},
    {ar:'ستة',latin:'Setta',fr:'Six (6)'},
    {ar:'سبعة',latin:'Seb3a',fr:'Sept (7)'},
    {ar:'تمنية',latin:'Tmnya',fr:'Huit (8)'},
    {ar:'تسعة',latin:'Tes3a',fr:'Neuf (9)'},
    {ar:'عشرة',latin:'3achra',fr:'Dix (10)'}
  ]},
  { id:'chiffres_11_20', icon:'🔟', name:'Les chiffres 11 à 20', advanced:true,
    note:"<strong>La règle :</strong> de 13 à 19, on reprend le chiffre de base et on ajoute la terminaison <strong>-tach</strong> — tlata → tletach, rab3a → rba3tach, khamsa → khmestach. Seuls 11 et 12 sont irréguliers, et 20 change complètement de forme.",
    phrases:[
    {ar:'حضاش',latin:'Hdach',fr:'Onze (11) — irrégulier'},
    {ar:'طناش',latin:'Tnach',fr:'Douze (12) — irrégulier'},
    {ar:'تلطاش',latin:'Tletach',fr:'Treize (13) — tlata + tach'},
    {ar:'ربعطاش',latin:'Rba3tach',fr:'Quatorze (14) — rab3a + tach'},
    {ar:'خمسطاش',latin:'Khmestach',fr:'Quinze (15) — khamsa + tach'},
    {ar:'سطاش',latin:'Settach',fr:'Seize (16) — setta + tach'},
    {ar:'سبعطاش',latin:'Sba3tach',fr:'Dix-sept (17) — seb3a + tach'},
    {ar:'تمنطاش',latin:'Tmentach',fr:'Dix-huit (18) — tmnya + tach'},
    {ar:'تسعطاش',latin:'Tsa3tach',fr:'Dix-neuf (19) — tes3a + tach'},
    {ar:'عشرين',latin:'3ichrin',fr:'Vingt (20) — nouvelle forme'}
  ]},
  { id:'dizaines', icon:'💯', name:'Les dizaines (20 à 100)', advanced:true,
    note:"<strong>Deux règles.</strong> 1) Les dizaines prennent la terminaison <strong>-in</strong> sur le chiffre de base : tlata → tlatin, khamsa → khamsin. 2) Entre deux dizaines, on dit l'unité <strong>d'abord</strong>, puis « w » (et), puis la dizaine : 35 se dit « cinq et trente ». Avec ça tu sais dire n'importe quel nombre jusqu'à 99.",
    phrases:[
    {ar:'عشرين',latin:'3ichrin',fr:'Vingt (20)'},
    {ar:'تلاتين',latin:'Tlatin',fr:'Trente (30) — tlata + in'},
    {ar:'ربعين',latin:'Reb3in',fr:'Quarante (40) — rab3a + in'},
    {ar:'خمسين',latin:'Khamsin',fr:'Cinquante (50) — khamsa + in'},
    {ar:'ستين',latin:'Settin',fr:'Soixante (60) — setta + in'},
    {ar:'سبعين',latin:'Seb3in',fr:'Soixante-dix (70) — seb3a + in'},
    {ar:'تمانين',latin:'Tmanin',fr:'Quatre-vingts (80) — tmnya + in'},
    {ar:'تسعين',latin:'Tes3in',fr:'Quatre-vingt-dix (90) — tes3a + in'},
    {ar:'مية',latin:'Mya',fr:'Cent (100)'},
    {ar:'واحد و عشرين',latin:'Wahdou 3ichrin',fr:'Vingt-et-un (21) — « un et vingt »'},
    {ar:'خمسة و تلاتين',latin:'Khamsa w tlatin',fr:'Trente-cinq (35) — « cinq et trente »'},
    {ar:'تمنية و ربعين',latin:'Tmnya w reb3in',fr:'Quarante-huit (48) — « huit et quarante »'},
    {ar:'تسعة و تسعين',latin:'Tes3a w tes3in',fr:'Quatre-vingt-dix-neuf (99) — « neuf et quatre-vingt-dix »'}
  ]},
  { id:'centaines', icon:'🧮', name:'Les centaines', advanced:true,
    note:"<strong>La règle :</strong> à partir de 300, on place une forme raccourcie du chiffre devant <strong>mya</strong> (cent) — tlata → tlet mya. 200 est une forme spéciale à part, myatayn. On rattache ensuite le reste du nombre avec « w » : 350 = « trois-cents et cinquante ».",
    phrases:[
    {ar:'مية',latin:'Mya',fr:'Cent (100)'},
    {ar:'ميتين',latin:'Myatayn',fr:'Deux cents (200) — forme spéciale'},
    {ar:'تلت مية',latin:'Tlet mya',fr:'Trois cents (300)'},
    {ar:'ربع مية',latin:'Rbe3 mya',fr:'Quatre cents (400)'},
    {ar:'خمس مية',latin:'Khems mya',fr:'Cinq cents (500)'},
    {ar:'ست مية',latin:'Sett mya',fr:'Six cents (600)'},
    {ar:'سبع مية',latin:'Sbe3 mya',fr:'Sept cents (700)'},
    {ar:'تمن مية',latin:'Tmen mya',fr:'Huit cents (800)'},
    {ar:'تسع مية',latin:'Tse3 mya',fr:'Neuf cents (900)'},
    {ar:'تلت مية و خمسين',latin:'Tlet mya w khamsin',fr:'Trois cent cinquante (350)'},
    {ar:'خمس مية و ستة و تلاتين',latin:'Khems mya w setta w tlatin',fr:'Cinq cent trente-six (536)'}
  ]},
  { id:'grands_nombres', icon:'📈', name:'Mille et au-delà', advanced:true,
    note:"<strong>Même mécanique, un cran plus haut :</strong> alf (mille), alfayn (deux mille, forme spéciale comme myatayn), puis chiffre + <strong>alaf</strong> (pluriel) de 3 000 à 10 000. Ensuite on réutilise ce qu'on connaît déjà : mya alf = « cent mille ». Un grand nombre s'énonce bloc par bloc, du plus grand au plus petit, chaque bloc relié par « w ».",
    phrases:[
    {ar:'ألف',latin:'Alf',fr:'Mille (1 000)'},
    {ar:'ألفين',latin:'Alfayn',fr:'Deux mille (2 000) — forme spéciale'},
    {ar:'تلت آلاف',latin:'Tlet alaf',fr:'Trois mille (3 000) — chiffre + alaf'},
    {ar:'خمس آلاف',latin:'Khems alaf',fr:'Cinq mille (5 000)'},
    {ar:'عشرة آلاف',latin:'3achra alaf',fr:'Dix mille (10 000)'},
    {ar:'مية ألف',latin:'Mya alf',fr:'Cent mille (100 000) — mya (cent) + alf (mille)'},
    {ar:'مليون',latin:'Melyoun',fr:'Un million (1 000 000)'},
    {ar:'جوج ملايين',latin:'Jouj mlayen',fr:'Deux millions (2 000 000)'},
    {ar:'ألف و ميتين و ستة و خمسين',latin:'Alf w myatayn w setta w khamsin',fr:'Mille deux cent cinquante-six (1 256)'}
  ]}
  ]}, // fin du groupe "Les chiffres"
  { id:'transports_groupe', icon:'🚌', name:'Transports et directions', progressive:true, children:[
  { id:'transports', icon:'🚌', name:'1. Les mots essentiels', phrases:[
    {ar:'الطاكسي',latin:'Taxi',fr:'Le taxi'},
    {ar:'الطوبيس',latin:'Tobis',fr:'Le bus'},
    {ar:'الطيارة',latin:'Tyara',fr:"L'avion"},
    {ar:'الطران',latin:'Tran',fr:'Le train'},
    {ar:'فين كاين...؟',latin:'Fin kayn...?',fr:'Où se trouve... ?'},
    {ar:'على اليمين',latin:'3la lymin',fr:'À droite'},
    {ar:'على الشمال',latin:'3la chmal',fr:'À gauche'},
    {ar:'نيشان',latin:'Nichan',fr:'Tout droit'},
    {ar:'قريب',latin:'Qrib',fr:'Proche'},
    {ar:'بعيد',latin:"B3id",fr:'Loin'}
  ]},
  { id:'transports_2', icon:'🗺️', name:'2. Demander son chemin', phrases:[
    {ar:'فين كاينة المحطة؟',latin:'Fin kayna lmahatta?',fr:'Où est la gare ?'},
    {ar:'كيفاش نوصل ل...؟',latin:'Kifach nousel l...?',fr:'Comment aller à... ?'},
    {ar:'شحال بعيد من هنا؟',latin:'Chhal b3id men hna?',fr:"C'est à quelle distance d'ici ?"},
    {ar:'بشحال للمطار؟',latin:'Bchhal l lmatar?',fr:"Combien pour l'aéroport ?"},
    {ar:'وقف هنا عافاك',latin:'Wqef hna 3afak',fr:"Arrête-toi ici s'il te plaît"},
    {ar:'دوز على اليمين',latin:'Douz 3la lymin',fr:'Tourne à droite'},
    {ar:'حدا الجامع',latin:'Hda jjame3',fr:'À côté de la mosquée'},
    {ar:'قدام',latin:'Qeddam',fr:'Devant'},
    {ar:'مورا',latin:'Moura',fr:'Derrière'},
    {ar:'بين',latin:'Bin',fr:'Entre'}
  ]},
  { id:'transports_3', icon:'🧳', name:'3. Voyager pour de vrai', phrases:[
    {ar:'بغيت تيكي ل...',latin:'Bghit tiki l...',fr:'Je voudrais un billet pour...'},
    {ar:'فوقاش كيمشي الطران؟',latin:'Fouqach kaymchi tran?',fr:'À quelle heure part le train ?'},
    {ar:'مشا ليا الطوبيس',latin:'Mcha liya tobis',fr:"J'ai raté le bus"},
    {ar:'واش هاد الطريق مزيان؟',latin:'Wach had triq mezyan?',fr:'Est-ce que cette route est bonne ?'},
    {ar:'كاين الزحام',latin:'Kayn zzham',fr:'Il y a des embouteillages'},
    {ar:'بلا كونتور عافاك',latin:'Bla contour 3afak',fr:'Sans compteur, s’il te plaît'},
    {ar:'حط الكونتور',latin:'Hett lcontour',fr:'Mets le compteur'},
    {ar:'عندي الباكاج',latin:'3andi lbagaj',fr:"J'ai des bagages"},
    {ar:'فين نزل؟',latin:'Fin nnzel?',fr:'Où est-ce que je descends ?'},
    {ar:'صافي، وصلت',latin:'Safi, wselt',fr:'Voilà, je suis arrivé'}
  ]}
  ]},
  { id:'nourriture_groupe', icon:'🍽️', name:'Boissons et nourriture', progressive:true, children:[
  { id:'nourriture', icon:'🍽️', name:'1. À table', phrases:[
    {ar:'الما',latin:'Lma',fr:"L'eau"},
    {ar:'أتاي',latin:'Atay',fr:'Thé à la menthe'},
    {ar:'قهوة',latin:'Qahwa',fr:'Café'},
    {ar:'الخبز',latin:'Lkhobz',fr:'Le pain'},
    {ar:'الحليب',latin:'Lhlib',fr:'Le lait'},
    {ar:'الطاجين',latin:'Tajine',fr:'Le tajine'},
    {ar:'الكسكسو',latin:'Kesksou',fr:'Le couscous'},
    {ar:'الفاكية',latin:'Lfakya',fr:'Les fruits'},
    {ar:'الحوت',latin:'Lhout',fr:'Le poisson'},
    {ar:'اللحم',latin:'Llham',fr:'La viande'}
  ]},
  { id:'nourriture_2', icon:'🛒', name:'2. Faire ses courses', phrases:[
    {ar:'الخضرة',latin:'Lkhodra',fr:'Les légumes'},
    {ar:'الطماطم',latin:'Maticha',fr:'Les tomates'},
    {ar:'البصلة',latin:'Lbsla',fr:"L'oignon"},
    {ar:'البطاطا',latin:'Lbatata',fr:'Les pommes de terre'},
    {ar:'الزيت',latin:'Zzit',fr:"L'huile"},
    {ar:'السكر',latin:'Ssokkar',fr:'Le sucre'},
    {ar:'الملحة',latin:'Lmelha',fr:'Le sel'},
    {ar:'البيض',latin:'Lbeid',fr:'Les œufs'},
    {ar:'الجبن',latin:'Ljben',fr:'Le fromage'},
    {ar:'عطيني كيلو عافاك',latin:'3tini kilo 3afak',fr:'Donne-moi un kilo, merci'}
  ]},
  { id:'nourriture_3', icon:'👨‍🍳', name:'3. Commander et apprécier', phrases:[
    {ar:'بغيت نفطر',latin:'Bghit neftar',fr:'Je voudrais déjeuner'},
    {ar:'أشنو كاين اليوم؟',latin:'Achnou kayn lyoum?',fr:"Qu'y a-t-il aujourd'hui ?"},
    {ar:'بلا سكر عافاك',latin:'Bla soukkar 3afak',fr:'Sans sucre, merci'},
    {ar:'شوية من الملحة',latin:'Chwiya men lmelha',fr:'Un peu de sel'},
    {ar:'هادا بنين بزاف',latin:'Hada bnin bezzaf',fr:"C'est vraiment délicieux"},
    {ar:'شبعت، الحمد لله',latin:'Chbe3t, lhamdoullah',fr:"J'ai assez mangé, merci"},
    {ar:'الحساب عافاك',latin:'Lhsab 3afak',fr:"L'addition, s'il te plaît"},
    {ar:'ما كناكلش اللحم',latin:'Ma kanakoulch llham',fr:'Je ne mange pas de viande'},
    {ar:'عندي حساسية',latin:'3andi hassasiya',fr:"J'ai une allergie"},
    {ar:'بصحتك',latin:'Bsahtek',fr:'Bon appétit / à ta santé'}
  ]}
  ]}
];

// ---------------------------------------------------------------
// COMPRENDRE LA LANGUE
// Même structure que le carnet — un groupe progressif de paliers — mais chaque
// palier commence par la règle et se termine par un exercice de construction.
// Jamais de tableau seul : on lit la règle, puis on produit.
// ---------------------------------------------------------------
// Les paliers sont à la racine, sans groupe qui les enveloppe : la tuile d'accueil
// porte déjà le nom de la rubrique, un niveau de plus serait un clic pour rien.
// C'est openLibrary(..., progressive) qui transmet le déblocage progressif.
const GRAMMAR = [
  { id:'gram_pronoms', icon:'👤', name:'1. Les pronoms',
    note:"<strong>La règle :</strong> en darija le pronom se dit rarement, il est déjà contenu dans le verbe. On l'ajoute surtout pour <strong>insister</strong> ou pour lever une ambiguïté. Attention : « toi » change selon qu'on parle à un homme ou à une femme.",
    phrases:[
      {ar:'أنا',latin:'Ana',fr:'moi, je'},
      {ar:'نتا',latin:'Nta',fr:'toi (à un homme)'},
      {ar:'نتي',latin:'Nti',fr:'toi (à une femme)'},
      {ar:'هو',latin:'Houwa',fr:'lui'},
      {ar:'هي',latin:'Hiya',fr:'elle'},
      {ar:'حنا',latin:'Hna',fr:'nous'},
      {ar:'نتوما',latin:'Ntouma',fr:'vous'},
      {ar:'هوما',latin:'Houma',fr:'eux, elles'}
    ],
    drill:[
      { q:'___ men Fransa. (moi, je viens de France)', options:['Ana','Nta','Houwa'], answer:0, why:'Ana = moi.' },
      { q:'Tu parles à une femme. Tu dis :', options:['Nta','Nti','Ntouma'], answer:1, why:'Nti au féminin, Nta au masculin.' },
      { q:'« nous » se dit :', options:['Hna','Houma','Ntouma'], answer:0, why:'Hna = nous. Houma = eux.' },
      { q:'___ katakol. (elle mange)', options:['Houwa','Hiya','Hna'], answer:1, why:'Hiya = elle.' },
      { q:'« vous » se dit :', options:['Ntouma','Houma','Hna'], answer:0, why:'Ntouma = vous, Houma = eux.' },
      { q:'« eux, elles » :', options:['Houma','Ntouma','Hiya'], answer:0, why:'Houma pour la troisième personne du pluriel.' },
      { q:'Tu parles à un homme. Tu dis :', options:['Nta','Nti','Houwa'], answer:0, why:'Nta au masculin, Nti au féminin.' },
      { q:'Le verbe contient déjà la personne. Alors pourquoi ajouter le pronom ?', options:['pour insister',"c'est obligatoire",'pour marquer le passé'], answer:0, why:"On l'ajoute pour insister ou lever une ambiguïté." },
      { q:'« lui » :', options:['Houwa','Hiya','Houma'], answer:0, why:'Houwa = lui, Hiya = elle.' }
    ]
  },
  { id:'gram_possessifs', icon:'🔑', name:'2. À qui c\'est ?',
    note:"<strong>Deux façons.</strong> 1) On colle un suffixe au nom : <strong>-i</strong> (mon), <strong>-ek</strong> (ton), <strong>-ou</strong> (son, à lui), <strong>-ha</strong> (son, à elle), <strong>-na</strong> (notre). 2) On place <strong>dyal</strong> + pronom après le nom, plus insistant : « ddar dyali », la maison à moi.",
    phrases:[
      {ar:'داري',latin:'Dari',fr:'ma maison'},
      {ar:'دارك',latin:'Darek',fr:'ta maison'},
      {ar:'دارو',latin:'Daro',fr:'sa maison (à lui)'},
      {ar:'دارها',latin:'Darha',fr:'sa maison (à elle)'},
      {ar:'دارنا',latin:'Darna',fr:'notre maison'},
      {ar:'سميتي',latin:'Smiti',fr:'mon nom'},
      {ar:'الدار ديالي',latin:'Ddar dyali',fr:'la maison à moi'},
      {ar:'الكتاب ديالك',latin:'Lktab dyalek',fr:'ton livre'}
    ],
    drill:[
      { q:'« ma maison » :', options:['Dari','Darek','Daro'], answer:0, why:'Le suffixe -i marque la première personne.' },
      { q:'« sa maison, à elle » :', options:['Daro','Darha','Darna'], answer:1, why:'-ha pour elle, -ou pour lui.' },
      { q:'Autre façon de dire « mon livre » :', options:['Lktab dyali','Lktab dari','Dyali lktab'], answer:0, why:'dyal + pronom se place après le nom.' },
      { q:'« notre maison » :', options:['Darna','Darhoum','Darek'], answer:0, why:'-na pour nous.' },
      { q:'« ta maison » :', options:['Darek','Dari','Darha'], answer:0, why:'-ek marque la deuxième personne.' },
      { q:'« sa maison, à lui » :', options:['Daro','Darha','Darna'], answer:0, why:'-ou pour lui, -ha pour elle.' },
      { q:'« mon nom » :', options:['Smiti','Smitek','Smito'], answer:0, why:'Le même suffixe -i que dans dari.' },
      { q:'« ton livre » :', options:['Lktab dyalek','Lktab dyali','Dyalek lktab'], answer:0, why:'dyal + pronom se place toujours après le nom.' },
      { q:'Le suffixe -na marque :', options:['nous','vous','eux'], answer:0, why:'darna, notre maison.' }
    ]
  },
  { id:'gram_present', icon:'⚙️', name:'3. Le présent en ka-',
    note:"<strong>Le déclic de tout le darija.</strong> Présent = <strong>ka</strong> + préfixe de personne + verbe. Le préfixe : <strong>n-</strong> pour je, <strong>t-</strong> pour tu, <strong>y-</strong> pour il, <strong>t-</strong> pour elle aussi. Avec « kla » (manger) : kanakol, katakol, kayakol. Une fois ces trois préfixes acquis, tu conjugues n'importe quel verbe.",
    phrases:[
      {ar:'كناكل',latin:'Kanakol',fr:'je mange'},
      {ar:'كتاكل',latin:'Katakol',fr:'tu manges / elle mange'},
      {ar:'كياكل',latin:'Kayakol',fr:'il mange'},
      {ar:'كناكلو',latin:'Kanaklou',fr:'nous mangeons'},
      {ar:'كتاكلو',latin:'Kataklou',fr:'vous mangez'},
      {ar:'كياكلو',latin:'Kayaklou',fr:'ils mangent'},
      {ar:'كنشرب أتاي',latin:'Kancherb atay',fr:'je bois du thé'},
      {ar:'كنهضر الدارجة',latin:'Kanhder ddarija',fr:'je parle le darija'}
    ],
    drill:[
      { q:'Ana ___ atay. (je bois du thé)', options:['kancherb','katcherb','kaycherb'], answer:0, why:'ana → préfixe n- : kan-.' },
      { q:'Houwa ___ lkhobz. (il mange le pain)', options:['kanakol','katakol','kayakol'], answer:2, why:'houwa → préfixe y- : kay-.' },
      { q:'Le « ka- » marque :', options:['le présent','le passé','le futur'], answer:0, why:'ka- = action en cours ou habituelle.' },
      { q:'Nta ___ ddarija. (tu parles darija)', options:['kanhder','katehder','kayhder'], answer:1, why:'nta → préfixe t- : kat-.' },
      { q:'« nous mangeons » :', options:['Kanaklou','Kataklou','Kayaklou'], answer:0, why:'Préfixe n- et terminaison -ou au pluriel.' },
      { q:'« ils mangent » :', options:['Kayaklou','Kanaklou','Kataklou'], answer:0, why:'Préfixe y- au pluriel : kay…ou.' },
      { q:'Le préfixe de « je » est :', options:['n-','t-','y-'], answer:0, why:'kan- se décompose en ka + n.' },
      { q:'« Katakol » peut vouloir dire :', options:['tu manges ou elle mange','il mange','nous mangeons'], answer:0, why:'Le préfixe t- sert au tu comme au elle.' },
      { q:'« je parle le darija » :', options:['Kanhder ddarija','Kathder ddarija','Kayhder ddarija'], answer:0, why:'Première personne : kan-.' }
    ]
  },
  { id:'gram_negation', icon:'🚫', name:'4. Dire non',
    note:"<strong>La négation encadre le verbe :</strong> <strong>ma</strong> devant, <strong>ch</strong> collé derrière. kanakol → ma kanakl<strong>ch</strong>. Devant un nom ou un pronom, ce n'est pas ma…ch mais <strong>machi</strong> : « machi houwa », ce n'est pas lui.",
    phrases:[
      {ar:'ما كناكلش',latin:'Ma kanakoulch',fr:'je ne mange pas'},
      {ar:'ما كنشربش',latin:'Ma kancherbch',fr:'je ne bois pas'},
      {ar:'ما عرفتش',latin:'Ma 3reftch',fr:'je ne sais pas'},
      {ar:'ما فهمتش',latin:'Ma fhemtch',fr:"je n'ai pas compris"},
      {ar:'ما كاينش',latin:'Ma kaynch',fr:"il n'y a pas"},
      {ar:'ما بغيتش',latin:'Ma bghitch',fr:'je ne veux pas'},
      {ar:'ما عنديش',latin:'Ma 3andich',fr:"je n'ai pas"},
      {ar:'ماشي هو',latin:'Machi houwa',fr:"ce n'est pas lui"}
    ],
    drill:[
      { q:'Négation de « kanakol » :', options:['ma kanakoulch','ma kanakoul','kanakoulch'], answer:0, why:'ma devant ET ch derrière : les deux sont obligatoires.' },
      { q:'« je ne veux pas » :', options:['ma bghitch','bghitch','ma bghit'], answer:0, why:'Même encadrement au passé.' },
      { q:'Devant un nom ou un pronom, on utilise :', options:['machi','ma…ch','bla'], answer:0, why:'machi nie un mot, ma…ch nie un verbe.' },
      { q:'« il n\'y a pas » :', options:['ma kaynch','ma kayn','kaynch'], answer:0, why:'kayn (il y a) → ma kaynch.' },
      { q:'« je n\'ai pas compris » :', options:['Ma fhemtch','Ma fhemt','Fhemtch'], answer:0, why:'Les deux éléments sont indispensables.' },
      { q:'« je n\'ai pas » :', options:['Ma 3andich','Ma 3andi','3andich'], answer:0, why:'3andi (j\'ai) devient ma 3andich.' },
      { q:'« ce n\'est pas lui » :', options:['Machi houwa','Ma houwach','Ma houwa'], answer:0, why:'Devant un pronom, c\'est machi.' },
      { q:'« je ne bois pas » :', options:['Ma kancherbch','Ma kancherb','Kancherbch'], answer:0, why:'ma devant, ch derrière.' },
      { q:'« je ne sais pas » :', options:['Ma 3reftch','Ma 3reft','3reftch'], answer:0, why:'Le même encadrement fonctionne au passé.' }
    ]
  },
  { id:'gram_passe', icon:'⏪', name:'5. Le passé',
    note:"<strong>Changement de logique :</strong> au passé, plus de <strong>ka-</strong> et plus de préfixe — la personne est marquée par un <strong>suffixe</strong>. Avec « kla » (manger) : kli<strong>t</strong> (j'ai mangé), kli<strong>ti</strong> (tu as mangé), kla (il a mangé), kla<strong>t</strong> (elle a mangé), kli<strong>na</strong> (nous).",
    phrases:[
      {ar:'كليت',latin:'Klit',fr:"j'ai mangé"},
      {ar:'كليتي',latin:'Kliti',fr:'tu as mangé'},
      {ar:'كلا',latin:'Kla',fr:'il a mangé'},
      {ar:'كلات',latin:'Klat',fr:'elle a mangé'},
      {ar:'كلينا',latin:'Klina',fr:'nous avons mangé'},
      {ar:'مشيت',latin:'Mchit',fr:'je suis allé'},
      {ar:'مشا',latin:'Mcha',fr:'il est allé'},
      {ar:'شفت',latin:'Cheft',fr:"j'ai vu"}
    ],
    drill:[
      { q:'« j\'ai mangé » :', options:['Klit','Kanakol','Ghadi nakol'], answer:0, why:'Suffixe -t pour la première personne.' },
      { q:'Au passé, la personne est marquée par :', options:['un suffixe','le préfixe ka-','rien'], answer:0, why:'Le passé suffixe, le présent préfixe.' },
      { q:'Houwa ___ l souk. (il est allé au souk)', options:['mchit','mcha','kaymchi'], answer:1, why:'À la 3e personne masculine, pas de suffixe.' },
      { q:'« nous avons mangé » :', options:['Klina','Klitou','Klaw'], answer:0, why:'-na pour nous, -tou pour vous, -w pour eux.' },
      { q:'« tu as mangé » :', options:['Kliti','Klit','Klat'], answer:0, why:'-ti pour la deuxième personne.' },
      { q:'« elle a mangé » :', options:['Klat','Kla','Klina'], answer:0, why:'Le -t final marque le féminin.' },
      { q:'« j\'ai vu » :', options:['Cheft','Chaft','Kanchouf'], answer:0, why:'Le même suffixe -t que dans klit.' },
      { q:'« je suis allé » :', options:['Mchit','Mcha','Ghadi nemchi'], answer:0, why:'-t pour la première personne.' },
      { q:'Au passé, garde-t-on le ka- ?', options:['non','oui','seulement au pluriel'], answer:0, why:'ka- appartient au présent.' }
    ]
  },
  { id:'gram_futur', icon:'⏩', name:'6. Le futur avec ghadi',
    note:"<strong>Le plus simple des trois temps :</strong> <strong>ghadi</strong> + le verbe conjugué comme au présent, mais <strong>sans le ka-</strong>. ghadi nemchi, ghadi temchi, ghadi ymchi. À l'oral on entend souvent « gha- » tout court.",
    phrases:[
      {ar:'غادي نمشي',latin:'Ghadi nemchi',fr:'je vais aller'},
      {ar:'غادي تمشي',latin:'Ghadi temchi',fr:'tu vas aller'},
      {ar:'غادي يمشي',latin:'Ghadi ymchi',fr:'il va aller'},
      {ar:'غادية تمشي',latin:'Ghadya temchi',fr:'elle va aller'},
      {ar:'غادي ناكل',latin:'Ghadi nakol',fr:'je vais manger'},
      {ar:'غدا غادي نمشي',latin:'Ghedda ghadi nemchi',fr:'demain je vais partir'},
      {ar:'غادي نشوفك',latin:'Ghadi nchoufek',fr:'je vais te voir'},
      {ar:'ما غاديش نمشي',latin:'Ma ghadich nemchi',fr:'je ne vais pas aller'}
    ],
    drill:[
      { q:'« je vais manger » :', options:['Ghadi nakol','Kanakol','Klit'], answer:0, why:'ghadi + verbe sans ka-.' },
      { q:'Après ghadi, le verbe garde-t-il le ka- ?', options:['non','oui','parfois'], answer:0, why:'ka- et ghadi ne cohabitent jamais.' },
      { q:'Ana ___ nchouf. (je vais voir)', options:['ghadi','kan','ma'], answer:0, why:'ghadi marque l\'intention, le futur proche.' },
      { q:'Négation du futur :', options:['Ma ghadich nemchi','Ma nemchich','Ghadi ma nemchi'], answer:0, why:'C\'est ghadi qu\'on encadre, pas le verbe.' },
      { q:'« tu vas aller » :', options:['Ghadi temchi','Ghadi nemchi','Ghadi ymchi'], answer:0, why:'Le verbe garde son préfixe de présent, sans le ka-.' },
      { q:'« elle va aller » :', options:['Ghadya temchi','Ghadi ymchi','Ghadi nemchi'], answer:0, why:'ghadi s\'accorde : ghadya au féminin.' },
      { q:'« demain je vais partir » :', options:['Ghedda ghadi nemchi','Ghadi ghedda nemchi','Ghedda kanemchi'], answer:0, why:'Le mot de temps ouvre la phrase.' },
      { q:'« je vais te voir » :', options:['Ghadi nchoufek','Ghadi tchoufek','Kanchoufek'], answer:0, why:'Première personne : préfixe n-.' },
      { q:'À l\'oral, ghadi se réduit souvent en :', options:['gha-','ka-','ma-'], answer:0, why:'On entend « gha nemchi ».' }
    ]
  },
  { id:'gram_ordre', icon:'🔀', name:"7. L'ordre des mots",
    note:"<strong>Deux différences avec le français.</strong> 1) L'adjectif se place <strong>après</strong> le nom : ddar kbira, « la maison grande ». 2) Il n'y a <strong>pas de verbe « être » au présent</strong> : « ana ferhan » se dit mot à mot « moi content ».",
    phrases:[
      {ar:'الدار كبيرة',latin:'Ddar kbira',fr:'la grande maison'},
      {ar:'أنا فرحان',latin:'Ana ferhan',fr:'je suis content'},
      {ar:'الطاجين بنين',latin:'Tajine bnin',fr:'le tajine est bon'},
      {ar:'الما بارد',latin:'Lma bared',fr:"l'eau est froide"},
      {ar:'هاد الدار',latin:'Had ddar',fr:'cette maison'},
      {ar:'هادا الكتاب',latin:'Hada lktab',fr:'ceci est le livre'},
      {ar:'واحد الراجل مزيان',latin:'Wahed rajel mezyan',fr:'un homme bien'},
      {ar:'هو ف الدار',latin:'Houwa f ddar',fr:'il est à la maison'}
    ],
    drill:[
      { q:'« la grande maison » :', options:['Ddar kbira','Kbira ddar','Ddar dyal kbira'], answer:0, why:"L'adjectif suit toujours le nom." },
      { q:'Pour « je suis content », faut-il un verbe être ?', options:['non, on le sous-entend','oui, kan','oui, kayn'], answer:0, why:'Au présent, la phrase se passe du verbe être.' },
      { q:'« l\'eau est froide » :', options:['Lma bared','Bared lma','Lma kayn bared'], answer:0, why:'Nom puis adjectif, rien entre les deux.' },
      { q:'« cette maison » :', options:['Had ddar','Ddar had','Ddar hadi kbira'], answer:0, why:'Le démonstratif, lui, précède le nom.' },
      { q:'« le tajine est bon » :', options:['Tajine bnin','Bnin tajine','Tajine kayn bnin'], answer:0, why:'Nom puis adjectif, sans verbe être.' },
      { q:'« il est à la maison » :', options:['Houwa f ddar','Houwa kayn f ddar','F ddar houwa'], answer:0, why:'Pas de verbe être au présent.' },
      { q:'Le démonstratif se place :', options:['avant le nom','après le nom','à la fin de la phrase'], answer:0, why:'had ddar — contrairement à l\'adjectif.' },
      { q:'« un homme bien » :', options:['Wahed rajel mezyan','Wahed mezyan rajel','Rajel wahed mezyan'], answer:0, why:'wahed devant, l\'adjectif derrière.' },
      { q:'« ceci est le livre » :', options:['Hada lktab','Lktab hada','Hada kayn lktab'], answer:0, why:'Le démonstratif ouvre, et aucun verbe ne relie.' }
    ]
  },
  { id:'gram_questions', icon:'❔', name:'8. Poser une question',
    note:"<strong>Deux façons.</strong> Pour une question fermée : <strong>wach</strong> en tête, ou simplement <strong>l'intonation</strong> sans rien changer à la phrase. Pour une question ouverte, le mot interrogatif se met en tête : fin, chkoun, 3lach, kifach.",
    phrases:[
      {ar:'واش نتا مغربي؟',latin:'Wach nta maghribi?',fr:'Es-tu marocain ?'},
      {ar:'نتا مغربي؟',latin:'Nta maghribi?',fr:'Tu es marocain ? (à l\'intonation)'},
      {ar:'فين كاينة المحطة؟',latin:'Fin kayna lmahatta?',fr:'Où est la gare ?'},
      {ar:'شكون هادا؟',latin:'Chkoun hada?',fr:'Qui est-ce ?'},
      {ar:'شنو كتقول؟',latin:'Chnou katqoul?',fr:'Que dis-tu ?'},
      {ar:'كيفاش سميتك؟',latin:'Kifach smitek?',fr:"Comment t'appelles-tu ?",alt:['Kif smitek']},
      {ar:'واش عندك الوقت؟',latin:'Wach 3andek lweqt?',fr:'As-tu le temps ?'},
      {ar:'علاش؟',latin:'3lach?',fr:'Pourquoi ?'}
    ],
    drill:[
      { q:'Pour une question fermée, on peut mettre devant :', options:['wach','achnou','kifach'], answer:0, why:'wach = est-ce que.' },
      { q:'« Où est la gare ? »', options:['Fin kayna lmahatta?','Lmahatta fin kayn?','Wach lmahatta?'], answer:0, why:'Le mot interrogatif ouvre la phrase.' },
      { q:'Sans mot interrogatif, la question se marque par :', options:["l'intonation",'un suffixe','rien du tout'], answer:0, why:'La même phrase devient question à la voix.' },
      { q:'« qui est-ce ? »', options:['Chkoun hada?','Achnou hada?','Fin hada?'], answer:0, why:'chkoun pour une personne, achnou pour une chose.' },
      { q:'« Que dis-tu ? »', options:['Chnou katqoul?','Chkoun katqoul?','Fin katqoul?'], answer:0, why:'chnou interroge sur une chose.' },
      { q:'« Comment t\'appelles-tu ? »', options:['Kifach smitek?','Chkoun smitek?','Fin smitek?'], answer:0, why:'kifach interroge la manière.' },
      { q:'« As-tu le temps ? »', options:['Wach 3andek lweqt?','Fin 3andek lweqt?','3lach 3andek lweqt?'], answer:0, why:'wach ouvre une question fermée.' },
      { q:'chkoun sert à interroger sur :', options:['une personne','une chose','un lieu'], answer:0, why:'chkoun qui, chnou quoi, fin où.' },
      { q:'« Pourquoi ? »', options:['3lach?','Kifach?','Chkoun?'], answer:0, why:'3lach interroge la cause.' }
    ]
  },
  { id:'gram_liaison', icon:'🔗', name:'9. Les mots de liaison',
    note:"<strong>Huit mots qui transforment des phrases courtes en vrai discours.</strong> Le plus utile est <strong>lli</strong> (qui, que) : il permet d'enchaîner deux idées — « rajel lli kayhder », l'homme qui parle.",
    phrases:[
      {ar:'و',latin:'W',fr:'et'},
      {ar:'ولاكن',latin:'Walakin',fr:'mais'},
      {ar:'ولا',latin:'Wla',fr:'ou'},
      {ar:'حيت',latin:'Hit',fr:'parce que'},
      {ar:'باش',latin:'Bach',fr:'pour, afin de'},
      {ar:'اللي',latin:'Lli',fr:'qui, que'},
      {ar:'ملي',latin:'Melli',fr:'quand, dès que'},
      {ar:'إلا',latin:'Ila',fr:'si'}
    ],
    drill:[
      { q:'« mais » se dit :', options:['Walakin','Wla','Bach'], answer:0, why:'wla = ou, bach = pour.' },
      { q:'« parce que » :', options:['Hit','Bach','Lli'], answer:0, why:'hit introduit la cause.' },
      { q:'« l\'homme qui parle » :', options:['Rajel lli kayhder','Rajel bach kayhder','Rajel hit kayhder'], answer:0, why:'lli est le relatif, invariable.' },
      { q:'« pour apprendre » :', options:['Bach nt3ellem','Hit nt3ellem','Lli nt3ellem'], answer:0, why:'bach exprime le but.' },
      { q:'« ou » se dit :', options:['Wla','Walakin','W'], answer:0, why:'wla marque le choix, w relie simplement.' },
      { q:'« si » :', options:['Ila','Melli','Hit'], answer:0, why:'ila introduit la condition.' },
      { q:'« quand, dès que » :', options:['Melli','Ila','Bach'], answer:0, why:'melli situe dans le temps.' },
      { q:'Le relatif « qui, que » :', options:['Lli','Hit','Wla'], answer:0, why:'lli est invariable, quel que soit le nom.' },
      { q:'« et » se dit :', options:['W','Wla','Walakin'], answer:0, why:'Une seule lettre, et le mot le plus fréquent de la langue.' }
    ]
  },
  { id:'gram_nombres', icon:'🔢', name:'10. Compter avec les noms',
    note:"<strong>La règle qui surprend :</strong> de 3 à 10, le nom se met au <strong>pluriel</strong> et on intercale souvent <strong>d</strong> (« tlata d lqhawi »). Mais à partir de <strong>11</strong>, le nom repasse au <strong>singulier</strong>, avec un -n de liaison : hdache<strong>n</strong> 3am, onze ans.",
    phrases:[
      {ar:'واحد القهوة',latin:'Wahed lqahwa',fr:'un café'},
      {ar:'جوج قهاوي',latin:'Jouj qhawi',fr:'deux cafés'},
      {ar:'تلاتة د القهاوي',latin:'Tlata d lqhawi',fr:'trois cafés'},
      {ar:'خمسة دراهم',latin:'Khamsa drahem',fr:'cinq dirhams'},
      {ar:'عشرة دقايق',latin:'3achra dqayq',fr:'dix minutes'},
      {ar:'حضاشن عام',latin:'Hdachen 3am',fr:'onze ans'},
      {ar:'عشرين عام',latin:'3ichrin 3am',fr:'vingt ans'},
      {ar:'شحال من مرة',latin:'Chhal men marra',fr:'combien de fois'}
    ],
    drill:[
      { q:'À partir de 11, le nom se met :', options:['au singulier','au pluriel','au duel'], answer:0, why:'hdachen 3am, et non hdachen snin.' },
      { q:'« trois cafés » :', options:['Tlata d lqhawi','Tlata lqahwa','Lqahwa tlata'], answer:0, why:'De 3 à 10 : pluriel, souvent avec « d ».' },
      { q:'« onze ans » :', options:['Hdachen 3am','Hdach 3am','Hdach snin'], answer:0, why:'Le -n de liaison est obligatoire.' },
      { q:'De 3 à 10, le nom est :', options:['au pluriel','au singulier','invariable'], answer:0, why:"C'est l'inverse d'à partir de 11." },
      { q:'« un café » :', options:['Wahed lqahwa','Wahed qhawi','Qahwa wahed'], answer:0, why:'Avec 1, le nom reste au singulier.' },
      { q:'« deux cafés » :', options:['Jouj qhawi','Jouj lqahwa','Qhawi jouj'], answer:0, why:'Dès 2, le nom passe au pluriel.' },
      { q:'« cinq dirhams » :', options:['Khamsa drahem','Khamsa derhem','Drahem khamsa'], answer:0, why:'De 3 à 10 : nom au pluriel.' },
      { q:'« vingt ans » :', options:['3ichrin 3am','3ichrin snin','3ichrin d l3am'], answer:0, why:'Au-delà de 11, le nom repasse au singulier.' },
      { q:'Le « d » de « tlata d lqhawi » sert à :', options:['relier le nombre au nom','marquer le pluriel','marquer le passé'], answer:0, why:'On l\'intercale souvent de 3 à 10.' }
    ]
  }
];

// Le carnet est un arbre : un nœud a soit des "phrases" (c'est une feuille), soit des
// "children" (c'est un groupe). Seules les feuilles portent une progression, sous la
// clé phrasebook_<id> — un groupe n'est jamais "appris" en tant que tel.
function phrasebookLeaves(nodes){
  return nodes.flatMap(n => n.children ? phrasebookLeaves(n.children) : [n]);
}
const PHRASEBOOK_LEAVES = phrasebookLeaves(PHRASEBOOK);

// Les feuilles marquées "advanced" restent accessibles librement, mais ne comptent
// pas dans le parcours guidé ni dans le badge : sans ça, ajouter du contenu
// rallongerait l'étape 1 et retirerait un badge déjà gagné aux utilisateurs actuels.
const CORE_PHRASEBOOK = PHRASEBOOK_LEAVES.filter(c => !c.advanced);

// Export pour server.js. Dans un navigateur `module` n'existe pas : la condition
// est fausse et cette ligne ne fait rien.
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { PHRASEBOOK, GRAMMAR, PHRASEBOOK_LEAVES, CORE_PHRASEBOOK };
}
