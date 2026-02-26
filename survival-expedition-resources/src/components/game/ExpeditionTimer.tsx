import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

interface ExpeditionTimerProps {
  startTime: number;
  duration: number; // seconds
  compact?: boolean;
}

const ExpeditionTimer: React.FC<ExpeditionTimerProps> = ({ startTime, duration, compact }) => {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const elapsed = (now - startTime) / 1000;
  const remaining = Math.max(0, duration - elapsed);
  const progress = Math.min(100, (elapsed / duration) * 100);
  const isComplete = remaining <= 0;

  const hours = Math.floor(remaining / 3600);
  const minutes = Math.floor((remaining % 3600) / 60);
  const seconds = Math.floor(remaining % 60);

  const timeStr = hours > 0
    ? `${hours}h ${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(2, '0')}s`
    : minutes > 0
      ? `${minutes}m ${String(seconds).padStart(2, '0')}s`
      : `${seconds}s`;

  const phase = progress < 33.33 ? 1 : progress < 66.66 ? 2 : 3;
  const phaseLabel = phase === 1 ? 'Aller' : phase === 2 ? 'Sur place' : 'Retour';
  const phaseColor = phase === 3 ? 'text-amber-400' : phase === 2 ? 'text-violet-400' : 'text-blue-400';
  const barColor   = phase === 3 ? 'bg-amber-500'  : phase === 2 ? 'bg-violet-500'   : 'bg-blue-500';

  if (compact) {
    return (
      <div className="flex items-center gap-1.5">
        {isComplete ? (
          <span className="text-xs font-mono text-amber-400 animate-pulse font-bold">TERMINÉE</span>
        ) : (
          <>
            <Clock className={`w-3 h-3 ${phaseColor}`} />
            <span className={`text-xs font-mono ${phaseColor}`}>{timeStr}</span>
            <span className="text-[10px] font-mono text-zinc-600">— {phaseLabel}</span>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Clock className={`w-4 h-4 ${isComplete ? 'text-amber-400' : phaseColor}`} />
          {isComplete ? (
            <span className="text-sm font-mono text-amber-400 animate-pulse font-bold">EXPÉDITION TERMINÉE</span>
          ) : (
            <>
              <span className={`text-sm font-mono ${phaseColor}`}>{timeStr}</span>
              <span className={`text-xs font-mono px-1.5 py-0.5 rounded border ${
                phase === 3 ? 'border-amber-700/40 text-amber-400/80' :
                phase === 2 ? 'border-violet-700/40 text-violet-400/80' :
                              'border-blue-700/40 text-blue-400/80'
              }`}>{phaseLabel}</span>
            </>
          )}
        </div>
        <span className="text-xs font-mono text-zinc-500">{Math.round(progress)}%</span>
      </div>
      <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden relative">
        <div
          className={`h-full rounded-full transition-all duration-1000 ${isComplete ? 'bg-amber-500 animate-pulse' : barColor}`}
          style={{ width: `${progress}%` }}
        />
        {/* Phase dividers */}
        <div className="absolute top-0 bottom-0 w-px bg-zinc-600/60" style={{ left: '33.33%' }}/>
        <div className="absolute top-0 bottom-0 w-px bg-zinc-600/60" style={{ left: '66.66%' }}/>
      </div>
    </div>
  );
};

export default ExpeditionTimer;
