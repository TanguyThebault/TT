import React from 'react';
import { useGame } from '@/contexts/GameContext';
import { ScrollText, Info, CheckCircle, AlertTriangle, AlertOctagon } from 'lucide-react';

const typeIcons: Record<string, React.ReactNode> = {
  info: <Info className="w-3 h-3 text-blue-400" />,
  success: <CheckCircle className="w-3 h-3 text-green-400" />,
  danger: <AlertOctagon className="w-3 h-3 text-red-400" />,
  warning: <AlertTriangle className="w-3 h-3 text-yellow-400" />,
};

const typeColors: Record<string, string> = {
  info: 'text-blue-300',
  success: 'text-green-300',
  danger: 'text-red-300',
  warning: 'text-yellow-300',
};

function formatTime(timestamp: number): string {
  const d = new Date(timestamp);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

const GameLog: React.FC = () => {
  const { state } = useGame();

  return (
    <div className="space-y-2">
      <h2 className="text-sm font-bold text-zinc-400 font-mono uppercase tracking-wider flex items-center gap-2">
        <ScrollText className="w-4 h-4" />
        Journal
      </h2>
      <div className="bg-zinc-900/40 border border-zinc-800 rounded-lg p-2 max-h-48 overflow-y-auto space-y-1 scrollbar-thin">
        {state.gameLog.length === 0 ? (
          <p className="text-xs text-zinc-600 font-mono italic p-2">Aucun événement.</p>
        ) : (
          state.gameLog.map(log => (
            <div key={log.id} className="flex items-start gap-2 px-2 py-1 rounded hover:bg-zinc-800/30">
              <span className="text-[10px] text-zinc-600 font-mono mt-0.5 flex-shrink-0">{formatTime(log.time)}</span>
              {typeIcons[log.type]}
              <span className={`text-xs font-mono ${typeColors[log.type]}`}>{log.message}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default GameLog;
