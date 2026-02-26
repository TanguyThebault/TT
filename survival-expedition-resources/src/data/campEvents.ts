import type { Survivor } from '@/contexts/GameContext';

export interface CampEvent {
  id: string;
  message: string;
  time: number;
}

// ── Types ─────────────────────────────────────────────────────────────────────
export type SurvivorRef = { name: string; gender: 'male' | 'female' };

// ── Gender helpers ─────────────────────────────────────────────────────────────
function g(s: SurvivorRef) {
  const f = s.gender === 'female';
  return {
    il:  f ? 'elle'  : 'il',
    Il:  f ? 'Elle'  : 'Il',
    le:  f ? 'la'    : 'le',   // direct object
    lui: f ? 'elle'  : 'lui',  // stressed pronoun / "lui non plus"
    e:   f ? 'e'     : '',     // terminal -e for agreement
    eux: f ? 'elles' : 'eux',  // plural (solo context only)
  };
}

// Both-survivor helpers
function ils(s1: SurvivorRef, s2: SurvivorRef) {
  return (s1.gender === 'female' && s2.gender === 'female') ? 'Elles' : 'Ils';
}
function aucunE2(s1: SurvivorRef, s2: SurvivorRef) {
  return (s1.gender === 'female' && s2.gender === 'female') ? 'Aucune' : 'Aucun';
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function shuffled<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

// ── Template definition ───────────────────────────────────────────────────────
interface EventTemplate {
  minSurvivors: number;
  building?: string;
  generate: (survivors: SurvivorRef[]) => string;
}

// ── Templates ─────────────────────────────────────────────────────────────────
const TEMPLATES: EventTemplate[] = [

  // ── Solo ──────────────────────────────────────────────────────────────────
  { minSurvivors: 1, generate: ([s]) => `${s.name} observe l'horizon depuis la fenêtre. Encore une journée grise.` },
  { minSurvivors: 1, generate: ([s]) => `${s.name} fait des pompes derrière l'entrepôt. ${g(s).Il} s'arrête à trois. ${g(s).Il} dit que c'était prévu.` },
  { minSurvivors: 1, generate: ([s]) => `${s.name} siffle un air inconnu dans le couloir. Personne ne reconnaît la mélodie, ${g(s).lui} non plus.` },
  { minSurvivors: 1, generate: ([s]) => `${s.name} a trouvé une vieille revue d'avant l'effondrement. ${g(s).Il} la feuillette avec nostalgie.` },
  { minSurvivors: 1, generate: ([s]) => `${s.name} tourne en rond depuis une heure. Ça l'aide à réfléchir, paraît-${g(s).il}.` },
  { minSurvivors: 1, generate: ([s]) => `${s.name} s'est endormi${g(s).e} contre le mur. Personne n'ose ${g(s).le} réveiller.` },
  { minSurvivors: 1, generate: ([s]) => `${s.name} fait des abdos dans le couloir. Le résultat est mitigé.` },
  { minSurvivors: 1, generate: ([s]) => `${s.name} cherche quelque chose depuis vingt minutes. ${g(s).Il} a oublié quoi.` },
  { minSurvivors: 1, generate: ([s]) => `${s.name} fredonne une vieille chanson. ${g(s).Il} ne connaît que le refrain.` },
  { minSurvivors: 1, generate: ([s]) => `${s.name} compte les tuiles du plafond pour la deuxième fois. ${g(s).Il} retombe sur un nombre différent.` },
  { minSurvivors: 1, generate: ([s]) => `${s.name} s'est fabriqué un café avec des fonds de sachet. ${g(s).Il} dit que c'est "presque pareil".` },
  { minSurvivors: 1, generate: ([s]) => `${s.name} essaie de lire dans la pénombre. ${g(s).Il} refuse d'admettre qu'${g(s).il} n'y voit plus rien.` },
  { minSurvivors: 1, generate: ([s]) => `${s.name} a décidé de faire le tri dans ses affaires. Quarante minutes plus tard, ${g(s).il} n'a rien jeté.` },
  { minSurvivors: 1, generate: ([s]) => `${s.name} s'étire contre le mur avec l'air très concentré${g(s).e}. On n'ose pas demander pourquoi.` },
  { minSurvivors: 1, generate: ([s]) => `${s.name} contemple le mur en silence depuis un bon moment. ${g(s).Il} dit que ça "recharge les batteries".` },
  { minSurvivors: 1, generate: ([s]) => `${s.name} s'est improvisé${g(s).e} chef cuistot avec les restes du stock. Le résultat est… mangeable.` },

  // ── Social 2 survivants ────────────────────────────────────────────────────
  { minSurvivors: 2, generate: ([s1, s2]) => `${s1.name} et ${s2.name} débattent si les cafards survivraient à une autre apocalypse. Le débat est plus animé qu'il ne devrait l'être.` },
  { minSurvivors: 2, generate: ([s1, s2]) => `${s1.name} raconte une blague à ${s2.name}. ${s2.name} ne rit pas. ${s1.name} l'explique. ${s2.name} rit encore moins.` },
  { minSurvivors: 2, generate: ([s1, s2]) => `${s1.name} a caché les chaussures de ${s2.name}. ${s2.name} n'a pas trouvé ça drôle du tout.` },
  { minSurvivors: 2, generate: ([s1, s2]) => `${s1.name} et ${s2.name} font un bras de fer. Résultat : match nul, blessure d'orgueil des deux côtés.` },
  { minSurvivors: 2, generate: ([s1, s2]) => `${s1.name} se moque de la coupe de cheveux de ${s2.name}. ${s2.name} hausse les épaules. ${g(s2).Il} sait qu'${g(s2).il} a raison.` },
  { minSurvivors: 2, generate: ([s1, s2]) => `${s1.name} et ${s2.name} jouent aux cartes. ${s2.name} gagne pour la troisième fois. ${s1.name} demande à voir le jeu.` },
  { minSurvivors: 2, generate: ([s1, s2]) => `${s1.name} essaie d'apprendre à ${s2.name} à siffler. Mauvaise idée. Très mauvaise idée.` },
  { minSurvivors: 2, generate: ([s1, s2]) => `${s1.name} et ${s2.name} font la course dans le couloir. ${s1.name} prétend avoir laissé gagner.` },
  { minSurvivors: 2, generate: ([s1, s2]) => `${s1.name} emprunte les bottes de ${s2.name} sans demander. ${s2.name} ${g(s1).le} remarquera tôt ou tard.` },
  { minSurvivors: 2, generate: ([s1, s2]) => `${s1.name} et ${s2.name} parient sur la météo de demain. Personne ne gagnera vraiment.` },
  { minSurvivors: 2, generate: ([s1, s2]) => `${s1.name} essaie d'expliquer un rêve à ${s2.name}. ${s2.name} regrette d'avoir posé la question.` },
  { minSurvivors: 2, generate: ([s1, s2]) => `${s1.name} défie ${s2.name} au pierre-feuille-ciseaux. Meilleur des sept. Puis des neuf.` },
  { minSurvivors: 2, generate: ([s1, s2]) => `${s1.name} a dessiné un portrait de ${s2.name}. ${s2.name} affirme ne pas lui ressembler. C'est vrai.` },
  { minSurvivors: 2, generate: ([s1, s2]) => `${s1.name} demande à ${s2.name} si ça va. ${s2.name} dit "ouais ouais". Silence. Aucun des deux ne croit l'autre.` },
  { minSurvivors: 2, generate: ([s1, s2]) => `${s1.name} a essayé de faire une blague de timing à ${s2.name}. ${s2.name} n'était pas là. ${s1.name} l'a quand même expliquée après.` },
  { minSurvivors: 2, generate: ([s1, s2]) => {
    const eux = (s1.gender === 'female' && s2.gender === 'female') ? 'elles' : 'eux';
    return `${s1.name} et ${s2.name} boivent une bière tiède en silence. C'est leur façon à ${eux} de se détendre.`;
  }},
  { minSurvivors: 2, generate: ([s1, s2]) => `${s1.name} montre à ${s2.name} comment faire des nœuds. ${s2.name} fait semblant de comprendre.` },
  { minSurvivors: 2, generate: ([s1, s2]) => `${s1.name} imite ${s2.name} dans son dos. ${s2.name} se retourne. Silence. ${s1.name} regarde le plafond innocemment.` },

  // ── Social 3 survivants ────────────────────────────────────────────────────
  { minSurvivors: 3, generate: ([s1, s2, s3]) => `${s1.name}, ${s2.name} et ${s3.name} regardent un cafard traverser la salle. Personne ne bouge pendant deux minutes.` },
  { minSurvivors: 3, generate: ([s1, s2, s3]) => `${s1.name} organise un tournoi de bras de fer. ${s2.name} et ${s3.name} participent. ${s1.name} est éliminé${g(s1).e} en premier.` },
  { minSurvivors: 3, generate: ([s1, s2, s3]) => `${s1.name} tente d'arbitrer la dispute entre ${s2.name} et ${s3.name}. ${g(s1).Il} finit par se faire engueuler par les deux.` },
  { minSurvivors: 3, generate: ([s1, s2, s3]) => `${s1.name}, ${s2.name} et ${s3.name} jouent aux dés. ${s3.name} accuse ${s1.name} de tricher. ${s2.name} est d'accord.` },
  { minSurvivors: 3, generate: ([s1, s2, s3]) => `${s1.name} chante faux. ${s2.name} ${g(s1).le} rejoint en chantant encore plus faux. ${s3.name} quitte la pièce.` },

  // ── Atelier ────────────────────────────────────────────────────────────────
  { minSurvivors: 1, building: 'workshop', generate: ([s]) => `${s.name} passe une heure à l'atelier à réparer quelque chose qui n'était pas cassé.` },
  { minSurvivors: 1, building: 'workshop', generate: ([s]) => `${s.name} s'est coupé${g(s).e} le doigt à l'atelier. Pas grave, mais ${g(s).il} en parle encore.` },
  { minSurvivors: 2, building: 'workshop', generate: ([s1, s2]) => `${s1.name} et ${s2.name} se disputent à l'atelier sur la bonne façon de tenir un tournevis. ${aucunE2(s1, s2)} ne cède.` },
  { minSurvivors: 1, building: 'workshop', generate: ([s]) => `${s.name} fabrique quelque chose à l'atelier. ${g(s).Il} refuse de dire quoi. C'est probablement inutile.` },
  { minSurvivors: 1, building: 'workshop', generate: ([s]) => `${s.name} passe son temps libre à l'atelier à démonter un outil. ${g(s).Il} ne sait plus comment le remonter.` },

  // ── Infirmerie ─────────────────────────────────────────────────────────────
  { minSurvivors: 1, building: 'infirmary', generate: ([s]) => `${s.name} est passé${g(s).e} à l'infirmerie pour "juste vérifier un truc". ${g(s).Il} est resté${g(s).e} deux heures.` },
  { minSurvivors: 1, building: 'infirmary', generate: ([s]) => `${s.name} joue au médecin à l'infirmerie. Aucun patient volontaire à l'horizon.` },
  { minSurvivors: 2, building: 'infirmary', generate: ([s1, s2]) => `${s1.name} voulait tester le matériel médical. ${s2.name} lui a déconseillé. ${s1.name} n'a pas écouté.` },
  { minSurvivors: 1, building: 'infirmary', generate: ([s]) => `${s.name} lit les notices des médicaments à l'infirmerie. ${g(s).Il} est maintenant convaincu${g(s).e} d'avoir tous les effets secondaires.` },

  // ── Entrepôt ───────────────────────────────────────────────────────────────
  { minSurvivors: 1, building: 'storage', generate: ([s]) => `${s.name} réorganise les étagères de l'entrepôt pour la deuxième fois cette semaine. Personne ne lui a demandé.` },
  { minSurvivors: 1, building: 'storage', generate: ([s]) => `${s.name} a trouvé une canette de bière oubliée dans l'entrepôt. Elle date d'avant. ${g(s).Il} hésite longuement.` },
  { minSurvivors: 2, building: 'storage', generate: ([s1, s2]) => `${s1.name} et ${s2.name} comptent les boîtes de conserve. ${ils(s1, s2)} tombent sur des chiffres différents. Ce n'est pas la première fois.` },
  { minSurvivors: 1, building: 'storage', generate: ([s]) => `${s.name} classe les conserves par ordre alphabétique à l'entrepôt. Tout le monde va les mélanger dans l'heure.` },

  // ── Caserne ────────────────────────────────────────────────────────────────
  { minSurvivors: 1, building: 'barracks', generate: ([s]) => `${s.name} a organisé une partie de poker à la caserne. ${g(s).Il} a perdu ses chaussettes. Encore.` },
  { minSurvivors: 2, building: 'barracks', generate: ([s1, s2]) => `${s1.name} et ${s2.name} débattent du meilleur endroit pour dormir à la caserne. Ça dure depuis hier soir.` },
  { minSurvivors: 1, building: 'barracks', generate: ([s]) => `${s.name} fait le ménage à la caserne. Ce n'est pas son tour, mais ça ${g(s).le} détend.` },
  { minSurvivors: 2, building: 'barracks', generate: ([s1, s2]) => `${s1.name} ronfle à la caserne. ${s2.name} l'a noté sur un bout de papier comme preuve. ${g(s2).Il} ne sait pas encore quoi en faire.` },

  // ── Tour de guet ───────────────────────────────────────────────────────────
  { minSurvivors: 1, building: 'watchtower', generate: ([s]) => `${s.name} monte sur la tour de guet et fixe l'horizon. ${g(s).Il} redescend sans rien dire.` },
  { minSurvivors: 1, building: 'watchtower', generate: ([s]) => `${s.name} a passé l'heure sur la tour de guet à compter les corbeaux. ${g(s).Il} en a dénombré sept. Ou huit.` },
  { minSurvivors: 2, building: 'watchtower', generate: ([s1, s2]) => `${s1.name} emmène ${s2.name} sur la tour de guet. ${s2.name} a le vertige. ${g(s2).Il} ne l'avait pas mentionné.` },
  { minSurvivors: 1, building: 'watchtower', generate: ([s]) => `${s.name} philosophe depuis la tour de guet. "À quoi ça sert tout ça", dit-${g(s).il} à personne en particulier.` },
  { minSurvivors: 1, building: 'watchtower', generate: ([s]) => `${s.name} scrute l'horizon depuis la tour. ${g(s).Il} jure avoir vu bouger quelque chose. C'était probablement le vent.` },

  // ── Station radio ──────────────────────────────────────────────────────────
  { minSurvivors: 1, building: 'radio', generate: ([s]) => `${s.name} tripote les boutons de la radio. ${g(s).Il} capte des parasites et les écoute quand même.` },
  { minSurvivors: 1, building: 'radio', generate: ([s]) => `${s.name} essaie de capter une fréquence. ${g(s).Il} a entendu quelque chose. C'était peut-être juste du vent.` },
  { minSurvivors: 2, building: 'radio', generate: ([s1, s2]) => `${s1.name} et ${s2.name} écoutent les grésillements de la radio en silence. C'est devenu leur émission préférée.` },
  { minSurvivors: 1, building: 'radio', generate: ([s]) => `${s.name} parle dans le micro de la radio sans savoir si quelqu'un l'entend. ${g(s).Il} continue quand même.` },
  { minSurvivors: 1, building: 'radio', generate: ([s]) => `${s.name} a cru capter une station de musique. C'était en fait ${s.name} qui chantonnait sans s'en rendre compte.` },

  // ── Garage ─────────────────────────────────────────────────────────────────
  { minSurvivors: 1, building: 'garage', generate: ([s]) => `${s.name} passe du temps au garage à regarder le véhicule sans y toucher.` },
  { minSurvivors: 1, building: 'garage', generate: ([s]) => `${s.name} a prétendu réparer quelque chose au garage. Personne ne voit la différence.` },
  { minSurvivors: 2, building: 'garage', generate: ([s1, s2]) => `${s1.name} et ${s2.name} se disputent au garage sur la bonne façon de changer un pneu. ${aucunE2(s1, s2)} des deux ne l'a jamais fait.` },
  { minSurvivors: 1, building: 'garage', generate: ([s]) => `${s.name} a passé vingt minutes sous le véhicule. ${g(s).Il} en ressort couvert${g(s).e} de cambouis et très satisfait${g(s).e}.` },

  // ── Potager ────────────────────────────────────────────────────────────────
  { minSurvivors: 1, building: 'farm', generate: ([s]) => `${s.name} arrose le potager avec beaucoup trop d'eau. ${g(s).Il} pense bien faire.` },
  { minSurvivors: 2, building: 'farm', generate: ([s1, s2]) => `${s1.name} parle aux plantes du potager. ${s2.name} passe et fait semblant de n'avoir rien entendu.` },
  { minSurvivors: 1, building: 'farm', generate: ([s]) => `${s.name} goûte une tomate du potager. Son expression est difficile à interpréter.` },
  { minSurvivors: 2, building: 'farm', generate: ([s1, s2]) => `${s1.name} et ${s2.name} débattent si les légumes sont "vraiment bons" ou juste "meilleurs que rien". Le débat est philosophique.` },
  { minSurvivors: 1, building: 'farm', generate: ([s]) => `${s.name} a donné un prénom à chaque plant du potager. ${g(s).Il} dit que ça les fait pousser mieux.` },

  // ── Armurerie ─────────────────────────────────────────────────────────────
  { minSurvivors: 1, building: 'armory', generate: ([s]) => `${s.name} passe à l'armurerie pour nettoyer un équipement déjà propre. Deux fois.` },
  { minSurvivors: 2, building: 'armory', generate: ([s1, s2]) => `${s1.name} et ${s2.name} comparent leur équipement à l'armurerie. ${s1.name} est clairement ${s1.gender === 'female' ? 'jalouse' : 'jaloux'} mais ne le dit pas.` },
  { minSurvivors: 1, building: 'armory', generate: ([s]) => `${s.name} range l'armurerie et en profite pour essayer chaque pièce d'équipement devant un miroir imaginaire.` },
  { minSurvivors: 2, building: 'armory', generate: ([s1, s2]) => `${s1.name} propose à ${s2.name} un échange d'équipement. ${s2.name} décline poliment mais fermement.` },
];

// ── Generator ─────────────────────────────────────────────────────────────────
export function generateCampEvent(
  survivors: Survivor[],
  buildings: Record<string, number>
): CampEvent | null {
  const available: SurvivorRef[] = survivors
    .filter(s => s.status !== 'expedition')
    .map(s => ({ name: s.name.split(' ')[0], gender: s.gender }));

  if (available.length === 0) return null;

  const refs = shuffled(available);

  const eligible = TEMPLATES.filter(t => {
    if (t.minSurvivors > available.length) return false;
    if (t.building && (buildings[t.building] || 0) === 0) return false;
    return true;
  });

  if (eligible.length === 0) return null;

  const template = pickRandom(eligible);

  return {
    id: `camp-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    message: template.generate(refs),
    time: Date.now(),
  };
}
