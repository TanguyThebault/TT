import React, { useState } from 'react';
import { BookOpen, FileText, ChevronRight } from 'lucide-react';
import {
  WORLD_EVENT_NAME, WORLD_KNOWN_FACTS, WORLD_UNKNOWN_FACTS, TIMELINE,
  FACTIONS, CREATURES, LOCATIONS,
  type LoreFaction,
} from '@/data/loreData';
import { useGame } from '@/contexts/GameContext';

// ── Types ─────────────────────────────────────────────────────────────────────

interface LoreDoc {
  id: string;
  title: string;
  subtitle: string;
  group: string;
  content: React.ReactNode;
}

// ── Shared UI helpers ─────────────────────────────────────────────────────────

const Def: React.FC<{ label: string; text: string }> = ({ label, text }) => (
  <div className="text-[12px] leading-snug">
    <span className="text-amber-400/80 font-bold">{label}</span>
    <span className="text-zinc-600"> — </span>
    <span className="text-zinc-400">{text}</span>
  </div>
);

const Section: React.FC<{ num: string; heading: string; children: React.ReactNode }> = ({
  num, heading, children,
}) => (
  <section className="space-y-3">
    <h3 className="text-[11px] font-bold uppercase tracking-[0.3em] text-amber-500/80 flex items-center gap-2">
      <span className="text-amber-800/60">{num}</span>
      {heading}
      <span className="flex-1 border-t border-zinc-800 ml-1" />
    </h3>
    {children}
  </section>
);

const InfoHead: React.FC<{ heading: string }> = ({ heading }) => (
  <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-amber-600/70 flex items-center gap-2">
    {heading}
    <span className="flex-1 border-t border-zinc-800/60 ml-1" />
  </div>
);

const Note: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <blockquote className="text-[11px] italic text-amber-700/65 bg-zinc-900/50 border-l-2 border-amber-800/40 pl-3 py-1.5 rounded-r">
    {children}
  </blockquote>
);

const FieldNoteBox: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="text-[11px] italic text-zinc-500 bg-zinc-900/40 border border-zinc-800/50 px-3 py-2 rounded font-mono">
    {children}
  </div>
);

const DocEnd: React.FC = () => (
  <div className="text-[10px] text-zinc-700 uppercase tracking-[0.35em] pt-4 border-t border-zinc-800/60 text-center">
    ── fin du document ──
  </div>
);

const Bullet: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="text-[12px] text-zinc-400 flex gap-2">
    <span className="text-amber-700/60 shrink-0">▸</span>
    <span>{children}</span>
  </div>
);

const UnknownBullet: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="text-[12px] text-zinc-500 flex gap-2">
    <span className="text-red-900/60 shrink-0">?</span>
    <span>{children}</span>
  </div>
);

// ── Danger level indicator ────────────────────────────────────────────────────

const DANGER_COLORS: Record<number, string> = {
  1: '#6ab04c', 2: '#badc58', 3: '#f9ca24', 4: '#e17055', 5: '#d63031',
};
const DANGER_LABELS: Record<number, string> = {
  1: 'Faible', 2: 'Modéré', 3: 'Élevé', 4: 'Très élevé', 5: 'Extrême',
};

const DangerLevel: React.FC<{ level: 1|2|3|4|5 }> = ({ level }) => (
  <span className="flex items-center gap-1">
    {[1, 2, 3, 4, 5].map(i => (
      <span key={i} style={{ color: i <= level ? DANGER_COLORS[level] : '#3f3f46', fontSize: '9px' }}>
        {i <= level ? '●' : '○'}
      </span>
    ))}
    <span className="text-[10px] font-mono ml-1 font-bold" style={{ color: DANGER_COLORS[level] }}>
      {DANGER_LABELS[level]}
    </span>
  </span>
);

// ── Content builders ──────────────────────────────────────────────────────────

function buildTutorialContent(): React.ReactNode {
  return (
    <div className="space-y-7 font-mono text-[13px] leading-relaxed text-zinc-300 max-w-3xl">

      <div className="text-[10px] text-zinc-600 uppercase tracking-[0.3em] pb-3 border-b border-zinc-800/60">
        Document de récupération · classification interne · auteur non identifié
      </div>

      <Note>
        « Si vous lisez ceci, vous avez traversé ce que d'autres n'ont pas survécu.
        Vous avez trouvé un abri, quelques vivants autour de vous, et assez de lucidité pour chercher à organiser.
        C'est suffisant pour commencer. Ce manuel ne vous dira pas comment le monde en est arrivé là.
        Vous le savez déjà, ou vous vous en moquez — dans les deux cas, ça ne change rien à vos prochaines décisions. »
      </Note>

      <Section num="§ 01" heading="Votre Base">
        <p className="text-zinc-400">
          La base n'est pas un luxe. C'est la condition de tout le reste. Chaque bâtiment amélioré élargit vos
          capacités. Ne construisez pas ce que vous n'utilisez pas encore — chaque ressource dépensée doit servir
          un besoin immédiat.
        </p>
        <div className="space-y-2 pl-4 border-l border-zinc-800">
          <Def label="Entrepôt"       text="Fixe un plafond à vos ressources. Négligez-le et vous jetterez ce que vous récoltez. C'est une erreur courante." />
          <Def label="Infirmerie"     text="Accélère la guérison des blessés. Un camp sans infirmerie finit par n'avoir plus personne disponible." />
          <Def label="Atelier"        text="Permet de fabriquer de l'équipement. Chaque niveau déverrouille des objets plus efficaces — et plus coûteux." />
          <Def label="Caserne"        text="Fixe votre effectif maximum. Un camp complet ne peut accueillir personne. Anticipez." />
          <Def label="Tour de Guet"   text="Réduit les risques en expédition. Priorité si vos équipes reviennent souvent blessées ou décimées." />
          <Def label="Station Radio"  text="Ouvre l'accès à des zones plus lointaines — et plus rentables. Chaque niveau repousse la frontière, et les dangers avec elle." />
          <Def label="Garage"         text="Stocke les véhicules récupérés en mission. Un véhicule bien utilisé peut réduire considérablement la durée des opérations." />
          <Def label="Potager"        text="Produit de la nourriture passivement. Un investissement lent, mais qui supprime une dépendance critique à long terme." />
          <Def label="Armurerie"      text="Augmente la capacité de votre inventaire d'équipements. Si elle est pleine, les objets récoltés en mission sont perdus." />
        </div>
      </Section>

      <Section num="§ 02" heading="Les Ressources">
        <p className="text-zinc-400">
          Six types de ressources circulent dans votre camp. Chacune a son usage. Aucune n'est dispensable à
          long terme. Toutes sont plafonnées par la capacité de votre Entrepôt — planifiez vos expéditions en conséquence.
        </p>
        <div className="space-y-2 pl-4 border-l border-zinc-800">
          <Def label="Nourriture"   text="Consommée lors de chaque départ, proportionnellement au nombre de partants et à la durée de la mission. Sans elle, personne ne bouge." />
          <Def label="Ferraille"    text="Composant de base pour presque toute fabrication et construction. Abondante dans les zones proches, elle reste indispensable." />
          <Def label="Matériaux"    text="Plus polyvalents que la ferraille pour les projets avancés. Moins accessibles dans les zones faciles." />
          <Def label="Carburant"    text="Rare et stratégique. Nécessaire pour certaines fabrications et pour exploiter les véhicules. Ne le gaspillez pas." />
          <Def label="Médicaments"  text="Servent à soigner les blessés. Un survivant non soigné ne récupère pas seul assez vite." />
          <Def label="Électronique" text="La ressource la plus difficile à trouver. Indispensable pour les équipements et bâtiments de haut niveau. Stockez-la avec soin." />
        </div>
      </Section>

      <Section num="§ 03" heading="Les Expéditions">
        <p className="text-zinc-400">
          C'est ainsi que vous survivez : en envoyant des équipes récupérer ce que le monde a abandonné.
          Sélectionnez une zone sur la carte, désignez vos survivants, confirmez le départ. L'équipe revient
          automatiquement — votre rôle est de préparer la mission et de gérer ce qu'elle rapporte.
        </p>
        <div className="space-y-2 pl-4 border-l border-zinc-800">
          <Def label="Niveau de danger"      text="Plus il est élevé, plus les risques de combat augmentent — mais plus le butin potentiel est intéressant. Ne sous-estimez pas le danger." />
          <Def label="Pillage"               text="La compétence qui augmente la quantité et la qualité des ressources récoltées. Privilégiez les pilleurs dans les zones riches." />
          <Def label="Combat"                text="Réduit les dégâts reçus lors des affrontements. Indispensable dans les zones à danger élevé." />
          <Def label="Véhicules"             text="Embarquer un véhicule réduit la durée si tous les membres ont une place. Un convoi bruyant attire davantage d'hostilités." />
          <Def label="Catégories de zones"   text="Chaque type de territoire — sauvage, résidentiel, industriel, militaire, scientifique — génère un butin de catégorie en bonus." />
          <Def label="Nourriture consommée"  text="Chaque expédition coûte de la nourriture. Surveillez vos stocks avant de lancer de longues missions avec plusieurs survivants." />
        </div>
      </Section>

      <Section num="§ 04" heading="Vos Survivants">
        <p className="text-zinc-400">
          Ils ne sont pas des ressources. Oubliez ça et vous vous retrouverez seul.
        </p>
        <div className="space-y-2 pl-4 border-l border-zinc-800">
          <Def label="Blessures"    text="Un blessé ne part pas en mission. Soignez-le avec des médicaments ou via l'Infirmerie. Un blessé ignoré peut mourir." />
          <Def label="Repos"        text="Après chaque mission, un survivant se repose un certain temps. Planifiez vos rotations pour ne pas vous retrouver sans personne disponible." />
          <Def label="Entraînement" text="Améliore les compétences combat, médecine ou ingénierie. Requiert un bâtiment approprié à niveau suffisant. Immobilise le survivant le temps de la session." />
          <Def label="Recyclage"    text="Un survivant ingénieur peut démonter un équipement pour en récupérer une partie des matériaux. Utile pour nettoyer un inventaire trop plein." />
          <Def label="Fabrication"  text="Un survivant peut prendre en charge la production d'un objet à l'Atelier, libérant votre attention pour d'autres décisions." />
          <Def label="Recrues"      text="Des individus isolés se présentent parfois après une mission. L'offre est limitée dans le temps. À vous de décider si vous avez la place." />
        </div>
      </Section>

      <Section num="§ 05" heading="L'Équipement">
        <p className="text-zinc-400">
          Chaque survivant peut porter trois objets : une <span className="text-zinc-300">arme</span>, une{' '}
          <span className="text-zinc-300">armure</span>, et un <span className="text-zinc-300">sac à dos</span>.
          Ces objets s'usent à chaque mission — surveillez leur durabilité. Un équipement détruit est définitivement perdu.
        </p>
        <p className="text-zinc-400">
          Les objets se trouvent lors des expéditions ou se fabriquent à l'Atelier. Le <span className="text-zinc-300">tier</span> d'un
          objet détermine ses performances et le niveau d'Atelier nécessaire à sa fabrication. Réparez vos équipements
          avant qu'ils atteignent zéro — chaque mission les détériore.
        </p>
      </Section>

      <Section num="§ 06" heading="Le Troc">
        <p className="text-zinc-400">
          Il existe d'autres survivants. Certains sont organisés, certains échangent. Une fois le contact établi
          via la Station Radio, il devient possible de troquer des ressources ou des équipements contre d'autres.
          Les termes varient. La prudence reste de mise.
        </p>
      </Section>

      <Note>
        « Ce document était dans la poche d'un homme retrouvé à l'entrée du camp.
        Il était seul. Il ne bougeait plus. Le manuel, lui, était intact. »
        <span className="block mt-1 text-zinc-700 not-italic">— annotation non signée</span>
      </Note>

      <DocEnd />
    </div>
  );
}

function buildWorldContent(): React.ReactNode {
  return (
    <div className="space-y-7 font-mono text-[13px] leading-relaxed text-zinc-300 max-w-3xl">

      <div className="text-[10px] text-zinc-600 uppercase tracking-[0.3em] pb-3 border-b border-zinc-800/60">
        Rapport de synthèse — classification restreinte — sources multiples
      </div>

      <Section num="§ 01" heading={WORLD_EVENT_NAME}>
        <p className="text-zinc-400">
          On l'appelle {WORLD_EVENT_NAME}. Le nom s'est imposé de lui-même, sans qu'on le décide.
          Il désigne moins un événement précis qu'une rupture irréversible — le moment où les systèmes
          qui maintenaient le monde en état ont cessé de fonctionner assez longtemps pour ne plus jamais vraiment reprendre.
        </p>
      </Section>

      <Section num="§ 02" heading="Ce que l'on sait">
        <div className="space-y-2 pl-4 border-l border-zinc-800">
          {WORLD_KNOWN_FACTS.map((fact, i) => <Bullet key={i}>{fact}</Bullet>)}
        </div>
      </Section>

      <Section num="§ 03" heading="Ce que l'on ignore encore">
        <div className="space-y-2 pl-4 border-l border-red-900/30">
          {WORLD_UNKNOWN_FACTS.map((fact, i) => <UnknownBullet key={i}>{fact}</UnknownBullet>)}
        </div>
      </Section>

      <Section num="§ 04" heading="Chronologie approximative">
        <div className="space-y-4">
          {TIMELINE.map((entry, i) => (
            <div key={i} className="pl-4 border-l-2 border-zinc-700/50">
              <div className="text-[10px] font-bold text-amber-500/70 uppercase tracking-wider">{entry.period}</div>
              <div className="text-[12px] text-zinc-400 mt-0.5">{entry.description}</div>
            </div>
          ))}
        </div>
      </Section>

      <Note>
        « Cette chronologie est une reconstruction partielle. Les dates sont estimées.
        Les événements réels — notamment ceux des deux premières années — restent largement non documentés. »
        <span className="block mt-1 text-zinc-700 not-italic">— note d'archivage, auteur non identifié</span>
      </Note>

      <DocEnd />
    </div>
  );
}

// ── Reputation bar ─────────────────────────────────────────────────────────────

const FACTION_NAMES_DISPLAY: Record<string, string> = {
  arvernes:      'Les Arvernes',
  tribu_verte:   'La Tribu Verte',
  pirates_loire: 'Les Pirates de la Loire',
  marshals:      'Les Marshals',
};

function repColor(rep: number): string {
  if (rep >= 4) return 'bg-green-500';
  if (rep >= 1) return 'bg-green-700';
  if (rep >= -1) return 'bg-zinc-600';
  if (rep >= -4) return 'bg-orange-700';
  return 'bg-red-600';
}

function repLabel(rep: number): string {
  if (rep >= 7) return 'Allié';
  if (rep >= 3) return 'Favorable';
  if (rep >= 0) return 'Neutre';
  if (rep >= -3) return 'Méfiant';
  return 'Hostile';
}

function repTextColor(rep: number): string {
  if (rep >= 3) return 'text-green-400';
  if (rep >= 0) return 'text-zinc-400';
  if (rep >= -3) return 'text-orange-400';
  return 'text-red-400';
}

function ReputationBar({ rep }: { rep: number }) {
  // rep is -10 to +10; render 20 slots
  const filled = rep + 10; // 0..20
  return (
    <div className="flex gap-0.5 items-center">
      {Array.from({ length: 20 }, (_, i) => (
        <div
          key={i}
          className={`h-2 w-2 rounded-sm ${i < filled ? repColor(rep) : 'bg-zinc-800'}`}
        />
      ))}
    </div>
  );
}

function buildReputationContent(
  factionReputation: Record<string, number>,
  discoveredFactions: string[],
): React.ReactNode {
  if (discoveredFactions.length === 0) {
    return (
      <div className="space-y-4 font-mono text-[13px] text-zinc-300">
        <div className="text-[10px] text-zinc-600 uppercase tracking-[0.3em] pb-3 border-b border-zinc-800/60">
          Données relationnelles — statut inconnu
        </div>
        <p className="text-zinc-500 text-[12px] italic">
          Aucune faction rencontrée pour l'instant. Partez en expédition sur des tuiles de faction pour établir des contacts.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-mono text-[13px] leading-relaxed text-zinc-300 max-w-3xl">
      <div className="text-[10px] text-zinc-600 uppercase tracking-[0.3em] pb-3 border-b border-zinc-800/60">
        Données relationnelles — rapport de terrain
      </div>
      <p className="text-zinc-400 text-[12px]">
        La réputation mesure la relation entre votre camp et chaque faction, de −10 (hostilité déclarée) à +10 (alliance).
        Elle évolue lors des rencontres en expédition.
      </p>
      <div className="space-y-5">
        {discoveredFactions.map(fid => {
          const rep = factionReputation[fid] ?? 0;
          const fName = FACTION_NAMES_DISPLAY[fid] ?? fid;
          const fData = FACTIONS.find(f => f.id === fid);
          return (
            <div key={fid} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[12px] font-bold text-zinc-200">{fName}</span>
                <span className={`text-[11px] font-bold ${repTextColor(rep)}`}>
                  {rep >= 0 ? '+' : ''}{rep} — {repLabel(rep)}
                </span>
              </div>
              <ReputationBar rep={rep} />
              {fData && (
                <p className="text-[11px] text-zinc-500 italic">{fData.attitude}</p>
              )}
            </div>
          );
        })}
      </div>
      <DocEnd />
    </div>
  );
}

function buildFactionContent(faction: LoreFaction, reputation?: number): React.ReactNode {
  const hasReputation = reputation !== undefined;
  return (
    <div className="space-y-6 font-mono text-[13px] leading-relaxed text-zinc-300 max-w-3xl">

      <div className="text-[10px] text-zinc-600 uppercase tracking-[0.3em] pb-3 border-b border-zinc-800/60">
        Rapport de terrain — {faction.source}
      </div>

      {hasReputation && (
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-lg p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-widest text-zinc-600">Réputation</span>
            <span className={`text-[11px] font-bold ${repTextColor(reputation!)}`}>
              {reputation! >= 0 ? '+' : ''}{reputation} — {repLabel(reputation!)}
            </span>
          </div>
          <ReputationBar rep={reputation!} />
        </div>
      )}

      <div className="space-y-1">
        <div className="text-[10px] text-zinc-500 uppercase tracking-widest">{faction.location}</div>
        <div className="text-[11px] text-zinc-600 italic">{faction.territory}</div>
        <p className="text-zinc-300 mt-2">{faction.description}</p>
      </div>

      <div className="space-y-2">
        <InfoHead heading="Origine" />
        <p className="text-zinc-400 text-[12px]">{faction.origin}</p>
      </div>

      <div className="space-y-2">
        <InfoHead heading="Structure" />
        <p className="text-zinc-400 text-[12px]">{faction.structure}</p>
      </div>

      {faction.religion && (
        <div className="space-y-2">
          <InfoHead heading="Croyances" />
          <p className="text-zinc-400 text-[12px]">{faction.religion}</p>
        </div>
      )}

      {faction.language && (
        <div className="space-y-2">
          <InfoHead heading="Langue" />
          <p className="text-zinc-400 text-[12px]">{faction.language}</p>
        </div>
      )}

      {faction.trade && (
        <div className="space-y-2">
          <InfoHead heading="Commerce" />
          <p className="text-zinc-400 text-[12px]">{faction.trade}</p>
        </div>
      )}

      {faction.code && (
        <div className="space-y-2">
          <InfoHead heading="Code de conduite" />
          <div className="space-y-1.5 pl-4 border-l border-zinc-800">
            {faction.code.map((rule, i) => (
              <div key={i} className="text-[12px] text-zinc-400 flex gap-2">
                <span className="text-amber-700/60 shrink-0 font-bold">{i + 1}.</span>
                <span>{rule}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {faction.knownIndividuals && (
        <div className="space-y-3">
          <InfoHead heading="Individus connus" />
          <div className="space-y-3">
            {faction.knownIndividuals.map((ind, i) => (
              <div key={i} className="pl-4 border-l-2 border-amber-900/40">
                <div className="text-[11px] font-bold text-amber-400/80 uppercase tracking-wide">{ind.name}</div>
                <div className="text-[12px] text-zinc-400 mt-0.5">{ind.note}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-2">
        <InfoHead heading="Attitude générale" />
        <p className="text-zinc-400 text-[12px]">{faction.attitude}</p>
      </div>

      <div className="space-y-3">
        <InfoHead heading="Notes de terrain" />
        <div className="space-y-2">
          {faction.fieldNotes.map((note, i) => <Bullet key={i}>{note}</Bullet>)}
        </div>
      </div>

      <DocEnd />
    </div>
  );
}

function buildBestiaryContent(): React.ReactNode {
  const TONE_LABELS: Record<string, string> = {
    serious: 'Sérieux', unsettling: 'Troublant', absurd: 'Absurde', poetic: 'Poétique', inventive: 'Inventif',
  };
  const TONE_COLORS: Record<string, string> = {
    serious: '#71717a', unsettling: '#d97706', absurd: '#16a34a', poetic: '#9333ea', inventive: '#2563eb',
  };

  return (
    <div className="space-y-8 font-mono text-[13px] leading-relaxed text-zinc-300 max-w-3xl">

      <div className="text-[10px] text-zinc-600 uppercase tracking-[0.3em] pb-3 border-b border-zinc-800/60">
        Compilation de signalements — observations de terrain — statuts non vérifiés
      </div>

      <p className="text-zinc-400 text-[12px]">
        Les mutations post-Basculement n'ont pas suivi de logique uniforme. Certaines espèces ont évolué
        vers plus de danger ; d'autres ont pris des directions que personne n'avait anticipées.
        Cette compilation ne prétend pas à l'exhaustivité. Elle documente ce qui a été observé et survécu.
      </p>

      <div className="space-y-8">
        {CREATURES.map(creature => (
          <div key={creature.id} className="space-y-3 pb-6 border-b border-zinc-800/40 last:border-0 last:pb-0">

            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-sm font-bold text-zinc-200">{creature.name}</div>
                <div className="text-[10px] text-zinc-600 italic mt-0.5">{creature.baseAnimal}</div>
              </div>
              <div className="flex flex-col items-end gap-1.5 shrink-0">
                <DangerLevel level={creature.danger} />
                <span
                  className="text-[10px] font-mono px-1.5 py-0.5 rounded"
                  style={{
                    color: TONE_COLORS[creature.tone],
                    backgroundColor: TONE_COLORS[creature.tone] + '18',
                    border: `1px solid ${TONE_COLORS[creature.tone]}30`,
                  }}
                >
                  {TONE_LABELS[creature.tone]}
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-[10px] text-zinc-500 uppercase tracking-wider">Mutation</div>
              <p className="text-zinc-400 text-[12px]">{creature.mutation}</p>
            </div>

            <div className="space-y-1">
              <div className="text-[10px] text-zinc-500 uppercase tracking-wider">Comportement</div>
              <p className="text-zinc-400 text-[12px]">{creature.behavior}</p>
            </div>

            <FieldNoteBox>{creature.fieldNote}</FieldNoteBox>
          </div>
        ))}
      </div>

      <DocEnd />
    </div>
  );
}

function buildLocationsContent(): React.ReactNode {
  const TYPE_LABELS: Record<string, string> = {
    danger_zone: 'Zone rouge', faction_base: 'Base de faction', landmark: 'Point stratégique', ruin: 'Ruine',
  };
  const TYPE_COLORS: Record<string, string> = {
    danger_zone: '#dc2626', faction_base: '#2563eb', landmark: '#d97706', ruin: '#71717a',
  };

  return (
    <div className="space-y-8 font-mono text-[13px] leading-relaxed text-zinc-300 max-w-3xl">

      <div className="text-[10px] text-zinc-600 uppercase tracking-[0.3em] pb-3 border-b border-zinc-800/60">
        Compilation cartographique — sites d'intérêt — données partielles
      </div>

      <div className="space-y-8">
        {LOCATIONS.map(loc => (
          <div key={loc.id} className="space-y-3 pb-6 border-b border-zinc-800/40 last:border-0 last:pb-0">

            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-sm font-bold text-zinc-200">{loc.name}</div>
                <div className="text-[10px] text-zinc-600 uppercase tracking-widest mt-0.5">{loc.region}</div>
              </div>
              <span
                className="text-[10px] font-mono px-2 py-0.5 rounded shrink-0"
                style={{
                  color: TYPE_COLORS[loc.type],
                  backgroundColor: TYPE_COLORS[loc.type] + '18',
                  border: `1px solid ${TYPE_COLORS[loc.type]}30`,
                }}
              >
                {TYPE_LABELS[loc.type]}
              </span>
            </div>

            <p className="text-zinc-400 text-[12px]">{loc.description}</p>

            <div className="space-y-1">
              <div className="text-[10px] text-zinc-500 uppercase tracking-wider">Statut actuel</div>
              <p className="text-zinc-400 text-[12px]">{loc.status}</p>
            </div>

            <div className="space-y-1">
              <div className="text-[10px] text-zinc-500 uppercase tracking-wider">Intérêt stratégique</div>
              <p className="text-zinc-400 text-[12px]">{loc.significance}</p>
            </div>

            {loc.rumors.length > 0 && (
              <div className="space-y-2">
                <div className="text-[10px] text-zinc-500 uppercase tracking-wider">Rumeurs</div>
                <div className="space-y-1.5">
                  {loc.rumors.map((rumor, i) => (
                    <FieldNoteBox key={i}>« {rumor} »</FieldNoteBox>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <DocEnd />
    </div>
  );
}

// ── Static docs (no game state) ───────────────────────────────────────────────

const STATIC_DOCS_BASE: Omit<LoreDoc, 'content'>[] = [
  { id: 'guide_commandant', title: 'Guide du Commandant', subtitle: 'Manuel opérationnel — usage interne', group: 'fondamentaux' },
  { id: 'basculement',      title: 'Le Basculement',      subtitle: 'Rapport de synthèse — chronologie',  group: 'monde' },
  { id: 'reputation',       title: 'Réputation',           subtitle: 'Relations avec les factions',       group: 'factions' },
  ...FACTIONS.map(f => ({ id: `faction_${f.id}`, title: f.name, subtitle: f.location, group: 'factions' })),
  { id: 'bestiaire',        title: 'Bestiaire Partiel',   subtitle: `${CREATURES.length} espèces documentées`,       group: 'bestiaire' },
  { id: 'lieux_notables',   title: 'Sites Notables',      subtitle: `${LOCATIONS.length} emplacements référencés`,   group: 'lieux' },
];

// ── Sidebar group config ──────────────────────────────────────────────────────

const DOC_GROUPS = [
  { id: 'fondamentaux', label: 'Fondamentaux' },
  { id: 'monde',        label: 'Le Monde' },
  { id: 'factions',     label: 'Factions' },
  { id: 'bestiaire',    label: 'Bestiaire' },
  { id: 'lieux',        label: 'Lieux' },
];

// ── Main component ────────────────────────────────────────────────────────────

const LorePanel: React.FC = () => {
  const { state } = useGame();
  const [selectedId, setSelectedId] = useState<string>(STATIC_DOCS_BASE[0].id);

  const factionReputation = state.factionReputation ?? {};
  const discoveredFactions = state.discoveredFactions ?? [];

  const DOCS: LoreDoc[] = STATIC_DOCS_BASE.map(base => {
    let content: React.ReactNode;
    if (base.id === 'guide_commandant') content = buildTutorialContent();
    else if (base.id === 'basculement') content = buildWorldContent();
    else if (base.id === 'reputation') content = buildReputationContent(factionReputation, discoveredFactions);
    else if (base.id === 'bestiaire') content = buildBestiaryContent();
    else if (base.id === 'lieux_notables') content = buildLocationsContent();
    else {
      const factionId = base.id.replace('faction_', '');
      const faction = FACTIONS.find(f => f.id === factionId);
      const rep = discoveredFactions.includes(factionId) ? (factionReputation[factionId] ?? 0) : undefined;
      content = faction ? buildFactionContent(faction, rep) : null;
    }
    return { ...base, content };
  });

  const doc = DOCS.find(d => d.id === selectedId) ?? DOCS[0];

  return (
    <div className="flex gap-4" style={{ minHeight: '640px', height: 'calc(100vh - 380px)' }}>

      {/* ── Left: document content ────────────────────────────────────────── */}
      <div className="flex-1 bg-zinc-900/60 border border-zinc-800 rounded-lg overflow-hidden flex flex-col">
        <div className="shrink-0 border-b border-zinc-800 px-6 py-3 flex items-center gap-3">
          <BookOpen className="w-4 h-4 text-amber-500/60 shrink-0" />
          <div>
            <div className="text-sm font-bold text-zinc-200 font-mono tracking-wide">{doc.title}</div>
            <div className="text-[10px] text-zinc-600 font-mono uppercase tracking-[0.25em]">{doc.subtitle}</div>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-8 py-6">
          {doc.content}
        </div>
      </div>

      {/* ── Right: document list ──────────────────────────────────────────── */}
      <div className="w-64 shrink-0 bg-zinc-900/60 border border-zinc-800 rounded-lg overflow-hidden flex flex-col">
        <div className="shrink-0 border-b border-zinc-800 px-3 py-2.5">
          <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-zinc-600">Documents</span>
          <span className="text-[10px] font-mono text-zinc-700 ml-2">[{DOCS.length}]</span>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-3">
          {DOC_GROUPS.map(group => {
            const groupDocs = DOCS.filter(d => d.group === group.id);
            if (groupDocs.length === 0) return null;
            return (
              <div key={group.id} className="space-y-0.5">
                <div className="px-3 py-1">
                  <span className="text-[9px] font-mono uppercase tracking-[0.3em] text-zinc-700">
                    {group.label}
                  </span>
                </div>
                {groupDocs.map(d => {
                  const isActive = selectedId === d.id;
                  return (
                    <button
                      key={d.id}
                      onClick={() => setSelectedId(d.id)}
                      className={`w-full text-left px-3 py-2 rounded transition-all flex items-start gap-2 ${
                        isActive
                          ? 'bg-amber-600/12 border border-amber-600/25'
                          : 'border border-transparent hover:bg-zinc-800/50'
                      }`}
                    >
                      <FileText className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${isActive ? 'text-amber-500/70' : 'text-zinc-600'}`} />
                      <div className="flex-1 min-w-0">
                        <div className={`text-[11px] font-mono font-bold leading-tight truncate ${isActive ? 'text-amber-400' : 'text-zinc-400'}`}>
                          {d.title}
                        </div>
                        <div className="text-[10px] font-mono text-zinc-600 mt-0.5 leading-tight truncate">{d.subtitle}</div>
                      </div>
                      {isActive && <ChevronRight className="w-3 h-3 shrink-0 mt-1 text-amber-600/60" />}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};

export default LorePanel;
