import React, { useState, useEffect } from 'react';
import { useGame, type PendingRecruit } from '@/contexts/GameContext';
import { UserPlus, UserX, Clock, Sword, Search, Stethoscope, Cog } from 'lucide-react';

const TRAIT_FEMININE: Record<string, string> = {
  'Éclaireur':       'Éclaireuse',
  'Ingénieur':       'Ingénieure',
  'Combattant':      'Combattante',
  'Pilleur':         'Pilleuse',
  'Tacticien':       'Tacticienne',
  'Mécanicien':      'Mécanicienne',
  "Tireur d'élite":  "Tireuse d'élite",
};

function traitLabel(trait: string, gender: 'male' | 'female'): string {
  if (gender === 'female') return TRAIT_FEMININE[trait] ?? trait;
  return trait;
}

function formatCountdown(ms: number): string {
  if (ms <= 0) return 'Expiré';
  const totalSec = Math.ceil(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}h ${String(m).padStart(2, '0')}m`;
  if (m > 0) return `${m}m ${String(s).padStart(2, '0')}s`;
  return `${s}s`;
}

interface Props {
  recruit: PendingRecruit;
  isCampFull: boolean;
}

const PendingRecruitCard: React.FC<Props> = ({ recruit, isCampFull }) => {
  const { acceptRecruit, declineRecruit } = useGame();
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const msLeft    = recruit.expiresAt - now;
  const isExpired = msLeft <= 0;
  const isUrgent  = msLeft < 300_000 && !isExpired; // < 5 min
  const s         = recruit.survivor;

  const skills = [
    { key: 'combat',      label: 'Combat',    color: '#f87171', icon: <Sword       className="w-3 h-3" />, value: s.skills.combat      },
    { key: 'scavenging',  label: 'Pillage',   color: '#4ade80', icon: <Search      className="w-3 h-3" />, value: s.skills.scavenging  },
    { key: 'medical',     label: 'Médical',   color: '#f472b6', icon: <Stethoscope className="w-3 h-3" />, value: s.skills.medical     },
    { key: 'engineering', label: 'Ingénierie',color: '#60a5fa', icon: <Cog         className="w-3 h-3" />, value: s.skills.engineering },
  ];

  const borderColor = isExpired ? 'rgba(80,80,80,0.4)' : isUrgent ? 'rgba(220,38,38,0.55)' : 'rgba(34,197,94,0.4)';
  const glowColor   = isExpired ? 'none' : isUrgent ? '0 0 14px rgba(220,38,38,0.15)' : '0 0 14px rgba(34,197,94,0.10)';

  return (
    <div
      className="rounded-lg border p-3 space-y-2.5 relative overflow-hidden"
      style={{
        backgroundColor: 'rgba(10, 18, 6, 0.88)',
        borderColor,
        boxShadow: glowColor,
      }}
    >
      {/* Badge top-right */}
      <div
        className="absolute top-0 right-0 px-2.5 py-0.5 text-[9px] font-mono font-bold uppercase tracking-widest"
        style={{
          backgroundColor: isExpired ? 'rgba(80,80,80,0.6)' : isUrgent ? 'rgba(185,28,28,0.85)' : 'rgba(21,128,61,0.75)',
          color: '#fff',
        }}
      >
        {isExpired ? 'Expiré' : isUrgent ? '⚠ Urgent' : 'Recrue'}
      </div>

      {/* Header: avatar + name + timer */}
      <div className="flex items-start gap-2.5 pr-16">
        {/* Avatar initiale */}
        <div
          className="w-10 h-10 rounded flex items-center justify-center flex-shrink-0 text-sm font-bold font-mono"
          style={{
            backgroundColor: isExpired ? 'rgba(40,40,40,0.6)' : 'rgba(34,197,94,0.12)',
            border: `1px solid ${isExpired ? 'rgba(80,80,80,0.4)' : 'rgba(34,197,94,0.35)'}`,
            color: isExpired ? '#555' : '#4ade80',
          }}
        >
          {s.name.charAt(0)}
        </div>

        <div className="flex-1 min-w-0">
          <div className="font-bold text-zinc-100 text-sm font-mono truncate">{s.name}</div>
          <div className="text-[10px] font-mono uppercase tracking-wide mt-0.5"
            style={{ color: isExpired ? 'rgba(100,100,100,0.6)' : 'rgba(74,222,128,0.75)' }}>
            {traitLabel(s.trait, s.gender)}
          </div>
          {/* Countdown */}
          <div className="flex items-center gap-1 mt-1">
            <Clock className={`w-2.5 h-2.5 flex-shrink-0 ${isUrgent ? 'text-red-400' : isExpired ? 'text-zinc-600' : 'text-zinc-500'}`} />
            <span className={`text-[10px] font-mono font-bold tabular-nums ${
              isExpired ? 'text-zinc-600' : isUrgent ? 'text-red-400' : 'text-zinc-400'
            }`}>
              {formatCountdown(msLeft)}
            </span>
          </div>
        </div>
      </div>

      {/* Skills grid */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
        {skills.map(sk => (
          <div key={sk.key} className="flex items-center gap-1.5">
            <span style={{ color: isExpired ? 'rgba(80,80,80,0.5)' : sk.color, flexShrink: 0 }}>{sk.icon}</span>
            <span className="text-[10px] font-mono text-zinc-500 w-14">{sk.label}</span>
            <div className="flex gap-0.5 flex-1">
              {Array.from({ length: 10 }).map((_, i) => (
                <div
                  key={i}
                  className="w-2 h-2 rounded-sm"
                  style={{
                    backgroundColor: i < sk.value
                      ? (isExpired ? 'rgba(80,80,80,0.4)' : sk.color)
                      : 'rgba(45,45,45,0.6)',
                  }}
                />
              ))}
            </div>
            <span className="text-[10px] font-mono text-zinc-400 w-4 text-right">{sk.value}</span>
          </div>
        ))}
      </div>

      {/* Camp plein avertissement */}
      {isCampFull && !isExpired && (
        <p className="text-[10px] font-mono text-amber-500/80 text-center">
          Camp complet — améliorez la Caserne pour accepter de nouveaux survivants
        </p>
      )}

      {/* Buttons */}
      <div className="flex gap-2">
        <button
          onClick={() => acceptRecruit(recruit.id)}
          disabled={isCampFull || isExpired}
          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded text-xs font-bold font-mono transition-all"
          style={{
            backgroundColor: (isCampFull || isExpired) ? 'rgba(25,25,25,0.5)' : 'rgba(34,197,94,0.18)',
            border: `1px solid ${(isCampFull || isExpired) ? 'rgba(70,70,70,0.3)' : 'rgba(34,197,94,0.55)'}`,
            color: (isCampFull || isExpired) ? 'rgba(90,90,90,0.6)' : '#4ade80',
            cursor: (isCampFull || isExpired) ? 'not-allowed' : 'pointer',
          }}
          title={isCampFull ? 'Camp complet — améliorez la Caserne' : isExpired ? 'Offre expirée' : 'Accepter dans le camp'}
        >
          <UserPlus className="w-3.5 h-3.5" />
          Accepter
        </button>

        <button
          onClick={() => !isExpired && declineRecruit(recruit.id)}
          disabled={isExpired}
          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded text-xs font-bold font-mono transition-all"
          style={{
            backgroundColor: 'rgba(30,15,15,0.55)',
            border: `1px solid ${isExpired ? 'rgba(60,40,40,0.3)' : 'rgba(185,28,28,0.45)'}`,
            color: isExpired ? 'rgba(80,60,60,0.5)' : 'rgba(248,113,113,0.85)',
            cursor: isExpired ? 'not-allowed' : 'pointer',
          }}
        >
          <UserX className="w-3.5 h-3.5" />
          Refuser
        </button>
      </div>
    </div>
  );
};

export default PendingRecruitCard;
