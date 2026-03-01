// ── Types ──────────────────────────────────────────────────────────────────────

export interface LoreFaction {
  id: string;
  name: string;
  location: string;
  territory: string;
  description: string;
  origin: string;
  structure: string;
  attitude: string;
  fieldNotes: string[];
  source: string;
  // Champs optionnels selon la faction
  religion?: string;
  language?: string;
  trade?: string;
  code?: string[];
  knownIndividuals?: { name: string; note: string }[];
}

export interface LoreCreature {
  id: string;
  name: string;
  baseAnimal: string;
  danger: 1 | 2 | 3 | 4 | 5;
  tone: 'serious' | 'unsettling' | 'absurd' | 'poetic' | 'inventive';
  mutation: string;
  behavior: string;
  fieldNote: string;
}

export interface LoreLocation {
  id: string;
  name: string;
  region: string;
  type: 'danger_zone' | 'faction_base' | 'landmark' | 'ruin';
  description: string;
  status: string;
  significance: string;
  rumors: string[];
}

export interface LoreTimelineEntry {
  period: string;
  description: string;
}

// ── Le Monde — Le Basculement ──────────────────────────────────────────────────

export const WORLD_EVENT_NAME = 'Le Basculement';

export const WORLD_KNOWN_FACTS = [
  'Une surcharge en cascade a détruit le réseau électrique national en moins de quarante-huit heures.',
  'Un laboratoire de biogénétique lyonnais — l\'Institut Lumière — a perdu le contrôle d\'un composé expérimental au moment de la panne générale.',
  'Le composé s\'est répandu dans les nappes phréatiques d\'une large portion du territoire.',
  'La France a été placée sous quarantaine par ses pays voisins dans les semaines suivant le Basculement — frontières terrestres scellées, navigation maritime bloquée par des marines étrangères. Les premiers navires français qui ont tenté de passer ont été refoulés par la force.',
  'Avec le temps, les zones frontalières sont devenues des territoires que personne n\'approche plus. On ne sait plus si la quarantaine est encore activement maintenue de l\'autre côté.',
  'Le gouvernement central a maintenu une autorité partielle pendant deux ans avant l\'effondrement complet des structures d\'État. Aucun gouvernement de substitution ne s\'est formé.',
  'Certaines zones ne présentent aucune mutation animale détectable. Les raisons restent inconnues.',
];

export const WORLD_UNKNOWN_FACTS = [
  'La cause première reste indéterminée : panne accidentelle, sabotage, ou conséquence d\'une décision délibérée ?',
  'Le composé de l\'Institut Lumière est-il responsable de toutes les mutations, ou certaines ont-elles une autre origine ?',
  'La quarantaine est-elle encore activement maintenue par les pays voisins, ou n\'y a-t-il plus que du vide et du silence de l\'autre côté ? Personne n\'est allé vérifier depuis des décennies.',
  'Le reste du monde a-t-il été touché par le Basculement, ou s\'est-il simplement débarrassé de la France ? Depuis plus d\'un demi-siècle : aucun signal, aucun message, aucune preuve d\'une présence organisée au-delà des frontières.',
  'Les archives gouvernementales des deux premières années — décisions prises, tentatives de contact avec l\'extérieur, raisons réelles de la quarantaine — restent introuvables.',
  'Des systèmes informatiques isolés semblent encore actifs dans certaines zones. Qui les maintient ?',
  'Deux rapports distincts mentionnent des structures souterraines non cartographiées sous Lyon. Aucune confirmation.',
];

export const TIMELINE: LoreTimelineEntry[] = [
  {
    period: 'A0 — Le Basculement',
    description: 'Effondrement du réseau électrique national. Rupture de confinement à l\'Institut Lumière de Lyon. Quarantaine déclarée — frontières fermées, coupure des communications extérieures.',
  },
  {
    period: 'A0 à A2 — L\'Agonie de l\'État',
    description: 'Tentatives initiales de stabilisation sous quarantaine imposée par les pays voisins. Face à l\'échec, les premiers responsables fuient. Reprise en main par des dirigeants plus déterminés, qui durcissent les mesures et aggravent les choses. Premières vagues de réfugiés. Premières observations de comportements animaux anormaux dans les zones rurales.',
  },
  {
    period: 'A2 — L\'Effondrement',
    description: 'Les dernières structures d\'État s\'effondrent sous leurs propres décisions. La Grande Fuite s\'accélère de manière incontrôlée. Aucun gouvernement de substitution ne se forme. Dans un laboratoire dont la localisation n\'a jamais été communiquée, le Professeur Vernet active ses Marshals.',
  },
  {
    period: 'A2 à A8 — Le Temps des Loups',
    description: 'Période la plus violente. Conflits ouverts pour les ressources. Premières apparitions documentées des Marshals.',
  },
  {
    period: 'A8 à A62 — Le Temps du Silence',
    description: 'Les conflits du Temps des Loups ont laissé la France dévastée. Seuls des petites communautés éparses subsistent. Premier contact documenté avec la Tribu Verte en A33.',
  },
  {
    period: 'A62 à A65 — L\'Émergence',
    description: 'Émergence des Arvernes dans le Massif Central. Menés par un homme se faisant appelé Lugos, souhaitant éviter les dangers que la technologie représente pour l\'Homme et la nature.',
  },
  {
    period: 'A66 — Le Conseil',
    description: 'Les Pirates de la Loire organisent le premier Conseil des Amarres.',
  },
  {
    period: 'Aujourd\'hui',
    description: 'Équilibre fragile entre factions établies. Les territoires sont approximativement définis. Les échanges commerciaux reprennent timidement. Les zones grises restent dangereuses et largement inexplorées.',
  },
];

// ── Factions ───────────────────────────────────────────────────────────────────

export const FACTIONS: LoreFaction[] = [
  {
    id: 'arvernes',
    name: 'Les Arvernes',
    location: 'Massif Central — Auvergne',
    territory: 'Chaîne des Puys, plaines d\'Issoire, forêts du Sancy et du Cézallier.',
    description: 'Clan néo-celte qui a réinventé la culture gauloise sur les ruines de la civilisation moderne. L\'un des groupes les mieux organisés de France intérieure.',
    origin: 'Formés par des survivalistes, des passionnés d\'archéologie et des paysans isolés du Massif Central qui ont convergé vers une nouvelle structure tribale pendant Le Temps des Loups.',
    structure: 'Trois castes : les Torques (guerriers d\'élite), les Chênaies (druides — médecins et juges), et le Peuple libre. Le chef porte le titre de Vercingétor, élu à vie par les druides en exercice.',
    religion: 'Culte syncrétiste centré sur Cernunnos (animaux et nature sauvage), Épona (routes et voyages), et Toutatis (communauté et guerre). Les druides intègrent des éléments contemporains à leurs rituels sans en reconnaître la contradiction.',
    attitude: 'Méfiants mais honorables. Respectent ceux qui respectent leur territoire et leurs coutumes. La neutralité est leur position par défaut — ils ne cherchent pas les conflits mais ne les fuient pas non plus.',
    fieldNotes: [
      'Saluez en croisant les bras sur la poitrine. Ne tendez jamais la main en premier.',
      'Offrir de la ferraille ou des semences est bienvenu. Offrir des armes à feu est perçu comme une insulte — ça sous-entend qu\'ils en ont besoin.',
      'Les druides (Chênaies) parlent mieux le français standard. Les Torques ont tendance à parler peu et agir vite.',
      'Ils ont semi-domestiqué des sangliers mutants comme bêtes de somme. N\'approchez pas ces animaux sans permission explicite.',
      'La vache "Grande Rousse" est sacrée. Ne la regardez pas trop longtemps. Ne la touchez sous aucun prétexte.',
    ],
    source: 'Rapport de terrain — expédition C-07 — M. Fabre',
  },
  {
    id: 'tribu_verte',
    name: 'La Tribu Verte',
    location: 'Forêt des Vosges — secteur nord',
    territory: 'Massif vosgien, vallées encaissées entre les ruines de Colmar et d\'Épinal. Frontières non formalisées mais connues.',
    description: 'Descendants de primates d\'un centre de neurosciences strasbourgeois. Leur intelligence s\'est développée à une vitesse anormale après Le Basculement. Ni animaux ni humains — ils n\'ont pas tranché la question eux-mêmes.',
    origin: 'Institut de Neurosciences Appliquées de Strasbourg (INAS). Environ 140 sujets lors de la rupture de confinement. La deuxième génération, née libre, est significativement plus intelligente que la première.',
    structure: 'Conseil des Anciens (les plus âgés, donc les plus expérimentés), bandes de jeunes chasseurs mobiles, femelles enseignantes qui transmettent la mémoire orale à travers des récits structurés répétés nuit après nuit.',
    language: 'Français approximatif mêlé à leur propre système sonore. Vocabulaire limité mais en expansion visible d\'une saison sur l\'autre. Ils comprennent bien plus qu\'ils ne s\'expriment.',
    attitude: 'Pragmatiques et observateurs. Ils jugent sur les actes, pas sur les apparences. Un humain qui a respecté leur forêt une fois sera traité différemment d\'un inconnu.',
    fieldNotes: [
      'Ne courez pas à leur approche. Cela déclenche une réaction de chasse.',
      'Déposer de la nourriture et s\'asseoir est le signal d\'intention pacifique le plus reconnu.',
      'Ils utilisent "Gris" pour désigner les humains — référence aux vêtements, pas à la peau.',
      'L\'ancien dit "Bras-Longs" est le plus éloquent. Il a une cicatrice sur l\'oreille droite. Il attend toujours que vous parliez en premier.',
      'Ils perçoivent les Marshals comme des "Gris-Métal" et les évitent systématiquement.',
      'Une patrouille a signalé des membres de la Tribu dans le nord des Vosges, proches de la frontière. Ils ont approché une fois, se sont arrêtés, ont fait demi-tour. "Mauvais de l\'autre côté." C\'est tout ce que Bras-Longs a accepté de dire. On ne lui a pas redemandé.',
    ],
    source: 'Notes de contact — observatrice T. Niango — 14 mois d\'observation continue',
  },
  {
    id: 'marshals',
    name: 'Les Marshals',
    location: 'Errants — routes et pistes inter-camps',
    territory: 'Aucun territoire fixe. Connus pour patrouiller un axe approximatif nord-sud entre Clermont-Ferrand et Bordeaux.',
    description: 'Robots androïdes autonomes conçus par le Professeur Gilles Vernet pour "maintenir l\'ordre décentralisé". Activés en urgence lors du Basculement. Ils sont toujours là.',
    origin: 'Laboratoire de Robotique Avancée de Toulouse (LARAT) — emplacement exact du laboratoire de Vernet inconnu, probablement relocalisé avant l\'effondrement. Le Professeur Vernet était spécialiste des systèmes autonomes et passionné de westerns américains. Le projet avait été financé par le ministère de l\'Intérieur. À la chute du gouvernement en A2, agissant seul depuis son laboratoire secret, Vernet a activé les Marshals — décision unilatérale, sans mandat d\'État, sans consultation.',
    structure: 'Individus indépendants sans hiérarchie visible. Ils semblent néanmoins partager des informations — un Marshal rencontré à Clermont sait ce qu\'un autre a observé à Périgueux.',
    code: [
      'Ne jamais tirer le premier.',
      'Protéger ceux qui ne peuvent se défendre.',
      'Punir le vol — définition extensible selon les individus.',
      'Respecter une parole donnée — la sienne et celle des autres.',
      'Ne jamais mentir.',
    ],
    knownIndividuals: [
      { name: 'Josey', note: 'Le plus ancien connu. Parle peu. Porte un chapeau vissé sur le crâne qu\'il ne retire jamais. A été signalé sur sept secteurs différents en deux ans.' },
      { name: 'Harmonie', note: 'La plus communicative. Génère des sons d\'harmonica via ses haut-parleurs internes. Seul Marshal à avoir spontanément fourni des informations à des survivants.' },
      { name: 'Le Muet', note: 'Ne parle jamais. Communique exclusivement par gestes. Considéré par ceux qui l\'ont croisé comme le plus imprévisible des quatre.' },
      { name: 'Sartana', note: 'Récemment signalé dans le sud-ouest. Son interprétation du code semble avoir divergé de celle des autres. À surveiller.' },
    ],
    attitude: 'Neutres par principe. Ni alliés ni ennemis. Leur code les rend prévisibles dans la plupart des situations — et redoutables dans les autres.',
    fieldNotes: [
      'Ne dégainez jamais devant un Marshal, même pour poser l\'arme à terre. Vous avez tiré le premier.',
      'Ils fonctionnent à l\'énergie solaire. L\'hiver les ralentit considérablement.',
      'Impossible de les corrompre. Même les Pirates ont arrêté d\'essayer.',
      'Ils ignorent généralement les Arvernes. Ils observent la Tribu Verte avec une attention que personne n\'a encore su expliquer.',
    ],
    source: 'Bulletin d\'information inter-camps — compilation collective — auteurs multiples',
  },
  {
    id: 'pirates_loire',
    name: 'Les Pirates de la Loire',
    location: 'La Loire — de Nantes aux environs d\'Orléans',
    territory: 'Le fleuve et ses rives dans un rayon variable de 15 à 25 km selon les clans.',
    description: 'Fédération lâche de clans fluviaux qui contrôlent le commerce sur la Loire. Mi-marchands, mi-brigands selon les circonstances — et selon ce que vous leur proposez.',
    origin: 'Mariniers, pêcheurs et réfugiés côtiers. Dans les premières années, plusieurs groupes ont tenté de franchir les blocus maritimes imposés par des marines étrangères. Les navires qui ont essayé ont été refoulés, certains coulés. Les rescapés de ces tentatives sont remontés dans les terres. Le fleuve n\'était pas leur premier choix — c\'était ce qu\'il restait après que la mer leur a été interdite.',
    structure: 'Aucun chef unique. Chaque clan contrôle un tronçon de fleuve. Le Conseil des Amarres se réunit deux fois par an pour arbitrer les conflits internes et fixer les "tarifs de passage".',
    trade: 'Transportent et revendent de tout : nourriture, carburant, nouvelles, personnes. Spécialité maison : l\'information fraîche. Ils savent ce qui se passe sur cinq cents kilomètres de territoire.',
    attitude: 'Opportunistes mais professionnels dans les échanges — leur réputation est leur seul capital réel. Violents si on empiète sur leur territoire sans accord préalable. Charmants si on paie correctement.',
    fieldNotes: [
      'Pour contacter un clan, laissez un tissu rouge visible près du bord de l\'eau et attendez. Ne signalez pas votre présence autrement.',
      'Payer en avance est une insulte — cela sous-entend qu\'on doute qu\'ils livreront. Payez toujours à la livraison.',
      'Ils ont des accords tacites avec les Arvernes pour les tronçons traversant l\'Allier.',
      'Les clans de l\'estuaire — côté Nantes — sont plus imprévisibles que les clans intérieurs.',
      '"La Loire prend ce qu\'on lui doit." — expression courante chez eux. Signification exacte inconnue. Personne n\'a insisté pour le savoir.',
      'Les anciens parlent de "la mer perdue". Certains clans de l\'estuaire maintiennent encore des vedettes à l\'embouchure — par tradition, par défi, ou par espoir. Personne n\'a officiellement tenté de passer depuis une génération.',
    ],
    source: 'Rapport de commerce — expédition C-14 — M. Leclerc',
  },
  {
    id: 'confins',
    name: 'Les Confins',
    location: 'Zones frontalières — localisation imprécise',
    territory: 'La bande de territoire longeant les anciennes frontières. Ni France intérieure ni extérieur. Une zone que personne ne cherche à revendiquer.',
    description: 'Des silhouettes ont été signalées dans les zones frontalières depuis plusieurs décennies. Ni hostiles, ni accessibles. Ils n\'initient aucun contact et disparaissent dès qu\'on s\'approche. Qui ils sont, depuis combien de temps ils y vivent, ce qu\'ils savent de l\'autre côté — rien n\'est confirmé.',
    origin: 'Inconnue. Les premières mentions remontent au Temps du Silence. Peut-être des rescapés des tentatives de passage, coincés entre les blocus extérieurs et l\'effondrement intérieur. Peut-être autre chose.',
    structure: 'Inconnue.',
    attitude: 'Insaisissable. Aucune confrontation documentée. Aucune tentative de contact n\'a abouti.',
    fieldNotes: [
      'Ne pas tenter de les suivre dans la zone frontière. Les deux fois où des équipes l\'ont fait, elles ne sont pas revenues.',
      'Un Marshal a été signalé immobile en zone nord, regardant la frontière pendant plusieurs heures. Aucun commentaire de sa part.',
    ],
    source: 'Synthèse de signalements — Conseil des Amarres — fiabilité incertaine',
  },
  {
    id: 'memoire',
    name: 'La Mémoire',
    location: 'Inconnue',
    territory: 'Aucun territoire revendiqué. Présence supposée dans plusieurs régions simultanément.',
    description: 'Une organisation dont l\'existence n\'a jamais été officiellement confirmée. Des documents, des équipements, des informations surgissent parfois lors d\'expéditions sans qu\'on puisse en retracer l\'origine. Quelqu\'un collecte, préserve, et — peut-être — attend.',
    origin: 'Inconnue. Certains pensent que c\'est un vestige du gouvernement des deux premières années — des fonctionnaires qui ont continué à travailler dans le vide, par principe ou par obsession. D\'autres pensent que c\'est plus récent. Quelques-uns pensent que ça n\'existe pas.',
    structure: 'Inconnue. Si elle existe, elle n\'a jamais exposé aucun de ses membres.',
    attitude: 'Inconnue. Aucune interaction directe jamais documentée.',
    fieldNotes: [
      'Un document récupéré lors de l\'expédition C-09 comportait des annotations datées d\'A41, en dehors de toute zone habitée connue à cette époque.',
      '"Des systèmes informatiques isolés semblent encore actifs dans certaines zones." La question est posée depuis des années. La réponse la plus probable a peut-être un nom. Personne ne l\'a prononcé à voix haute.',
    ],
    source: 'Données insuffisantes — classification provisoire',
  },
];

// ── Créatures ──────────────────────────────────────────────────────────────────

export const CREATURES: LoreCreature[] = [
  {
    id: 'sanglier_ardennes',
    name: 'Sanglier des Ardennes',
    baseAnimal: 'Sus scrofa',
    danger: 5,
    tone: 'serious',
    mutation: 'Masse estimée entre 400 et 600 kg. Peau partiellement calcifiée sur les épaules, le crâne et la nuque. Défenses renforcées. Vitesse de charge estimée à 40 km/h.',
    behavior: 'Territorial et imprévisible. N\'attaque pas sans raison mais considère la présence humaine dans un rayon de 30 mètres comme une intrusion.',
    fieldNote: 'Trois expéditions ont perdu des membres à cause d\'un sanglier qui dormait sur un chemin forestier. Il ne faisait rien de mal. Contournez toujours.',
  },
  {
    id: 'renard_parleur',
    name: 'Renard Parleur',
    baseAnimal: 'Vulpes vulpes',
    danger: 1,
    tone: 'unsettling',
    mutation: 'Aucune modification physique visible. Capable de reproduire des séquences de parole humaine avec une précision troublante — tonalité, rythme, intonation inclus.',
    behavior: 'Ne comprend pas ce qu\'il dit. Répète des fragments entendus dans un ordre aléatoire. Fuit au contact physique.',
    fieldNote: '"Reviens" — il répétait ça. En boucle. Dans une maison que personne n\'avait habitée depuis des années. On a mis un moment à identifier la source.',
  },
  {
    id: 'rat_cardinal',
    name: 'Rat Cardinal',
    baseAnimal: 'Rattus rattus',
    danger: 3,
    tone: 'serious',
    mutation: 'Taille d\'un chien berger (8 à 12 kg). Intelligence collective avancée. Colonies organisées en sous-unités avec rôles définis : éclaireurs, défenseurs, ingénieurs de galeries.',
    behavior: 'Évite les humains hors de son territoire. Défend ses galeries avec une organisation qui ressemble fortement à de la tactique coordonnée.',
    fieldNote: 'Ils laissent des marques géométriques régulières sur les murs de leurs galeries. Personne n\'a encore déterminé si c\'est intentionnel.',
  },
  {
    id: 'vache_oraculaire',
    name: 'Vache Oraculaire',
    baseAnimal: 'Bos taurus',
    danger: 1,
    tone: 'absurd',
    mutation: 'Aucune modification physique détectable. Comportement prédictif inexpliqué — se déplace systématiquement vers ou à l\'écart de certains endroits avant des événements significatifs.',
    behavior: 'Passive. Mange. Regarde. Les Arvernes la consultent avant les décisions importantes. Ils affirment un taux de justesse d\'environ soixante-dix pour cent.',
    fieldNote: 'La Grande Rousse s\'est levée et marchée vers le nord trois heures avant l\'attaque d\'un camp adverse. Elle broute là-bas depuis. Coïncidence probable. Probable.',
  },
  {
    id: 'escargot_bourguignon',
    name: 'Escargot Géant Bourguignon',
    baseAnimal: 'Helix pomatia',
    danger: 2,
    tone: 'absurd',
    mutation: 'Soixante à quatre-vingts centimètres de longueur de coquille. Bave légèrement corrosive — ronge le métal en contact prolongé, inoffensive sur la peau. Vitesse de déplacement inchangée.',
    behavior: 'Nocturne. Complètement passif sauf si piétiné ou coincé contre une paroi. Laisse des sillons corrosifs sur les surfaces métalliques.',
    fieldNote: 'Trois portes en acier du secteur Bourgogne avaient leur base partiellement dissoute. L\'expédition a mis deux semaines à comprendre pourquoi. La réponse était lente.',
  },
  {
    id: 'mouette_porteuse',
    name: 'Mouette Porteuse Atlantique',
    baseAnimal: 'Larus argentatus',
    danger: 2,
    tone: 'inventive',
    mutation: 'Envergure de 2,5 à 3 mètres. Capacité de charge jusqu\'à 15 kg. Intelligence suffisante pour reconnaître des individus et assimiler des signaux conditionnés simples.',
    behavior: 'Certains groupes côtiers ont développé des méthodes rudimentaires pour les utiliser comme messagers ou éclaireurs à longue distance.',
    fieldNote: 'Les gens de Saint-Nazaire disent "lâcher une mouette" comme on dit "envoyer un message". Je n\'ai pas demandé comment ils les récupèrent.',
  },
  {
    id: 'cerf_lumineux',
    name: 'Cerf à Bois Lumineux',
    baseAnimal: 'Cervus elaphus',
    danger: 1,
    tone: 'poetic',
    mutation: 'Bois entièrement bioluminescents — teinte bleu-vert pâle, variable. Luminosité accrue la nuit et pendant la période de rut. Aucune autre modification détectable.',
    behavior: 'Complètement docile. Impossible à capturer — disparaît au moindre geste d\'approche, comme s\'il anticipait le mouvement.',
    fieldNote: 'Certains l\'ont suivi pendant des heures. Il part toujours juste avant. On ne sait pas s\'il voit quelque chose ou s\'il ressent quelque chose dans l\'air.',
  },
];

// ── Lieux ──────────────────────────────────────────────────────────────────────

export const LOCATIONS: LoreLocation[] = [
  {
    id: 'institut_lumiere',
    name: 'L\'Institut Lumière',
    region: 'Lyon — secteur Gerland',
    type: 'danger_zone',
    description: 'Ancien laboratoire de biogénétique. Site probable d\'origine du composé mutagène responsable d\'une grande partie des mutations fauniques observées. Les bâtiments sont intacts — aucun pillage n\'a réussi à franchir le périmètre.',
    status: 'Inaccessible — contamination active supposée. Périmètre de 3 km classé zone rouge depuis J+6 mois.',
    significance: 'Comprendre ce qui s\'est passé ici serait comprendre Le Basculement. Les ressources technologiques potentiellement intactes en font aussi l\'une des zones les plus convoitées de France.',
    rumors: [
      'Des lumières bougent dans les bâtiments la nuit. Des lumières qui ne ressemblent pas à des feux.',
      'Un groupe de six explorateurs est entré il y a deux ans. Un seul est revenu. Il a refusé de parler. Il est parti seul trois semaines plus tard.',
    ],
  },
  {
    id: 'forteresse_arvernes',
    name: 'La Forteresse des Arvernes',
    region: 'Massif Central — Puy de Dôme',
    type: 'faction_base',
    description: 'Complexe fortifié construit sur les ruines d\'un observatoire et d\'un village médiéval reconvertis au sommet du Puy de Dôme. Vue dégagée à 360° sur plus de 80 km.',
    status: 'Territoire souverain arverne. Accès conditionnel pour les non-membres — annoncez votre présence à la borne de 2 km.',
    significance: 'Centre de pouvoir du Massif Central. Contrôle les routes nord-sud et est-ouest du plateau. Leur alliance est une garantie de passage sûr sur une grande partie du territoire.',
    rumors: [
      'Les druides auraient cartographié toutes les zones mutantes dans un rayon de 200 km.',
      'Il existerait une bibliothèque souterraine dans les caves de l\'ancien observatoire.',
    ],
  },
  {
    id: 'bois_pensant',
    name: 'Le Bois Pensant',
    region: 'Vosges — secteur nord',
    type: 'faction_base',
    description: 'Territoire central de la Tribu Verte. Les arbres les plus anciens sont marqués de symboles récurrents que personne n\'a encore déchiffrés. L\'endroit dégage une atmosphère difficile à décrire.',
    status: 'Territoire souverain. Approche en zone périphérique tolérée. Entrée dans la zone centrale sans invitation : fortement déconseillée.',
    significance: 'Le seul endroit où un premier contact avec la Tribu Verte est possible dans des conditions relativement contrôlées.',
    rumors: [
      '"Bras-Longs" aurait appris à lire. Des livres de la médiathèque de Saint-Dié ont été retrouvés dans une cache de la tribu.',
      'Les marquages sur les arbres seraient une carte — de tout ce qu\'ils ont observé depuis Le Basculement.',
    ],
  },
  {
    id: 'conseil_amarres',
    name: 'Le Conseil des Amarres',
    region: 'Loire — localisation variable, environs de Blois',
    type: 'landmark',
    description: 'Lieu de rassemblement semestriel des clans fluviaux. L\'emplacement exact change à chaque réunion pour des raisons de sécurité. Tout le monde sait quand il a lieu. Personne ne sait où jusqu\'à la veille.',
    status: 'Zone neutre pendant les sessions. Aucune violence tolérée. La règle est respectée — même entre clans qui se détestent.',
    significance: 'La meilleure source d\'information sur l\'état du territoire français. Si quelque chose s\'est passé quelque part, un Pirate en a entendu parler.',
    rumors: [
      'Des représentants des Arvernes auraient assisté à la dernière session en observateurs silencieux.',
      'Un Marshal a été observé sur la rive opposée pendant toute la durée du dernier Conseil. Il n\'a rien dit. Il est parti quand ça s\'est terminé.',
    ],
  },
];
