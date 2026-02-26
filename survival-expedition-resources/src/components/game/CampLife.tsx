import React, { useEffect, useRef, useState } from 'react';
import { useGame } from '@/contexts/GameContext';
import { generateCampEvent, type CampEvent } from '@/data/campEvents';
import { Flame } from 'lucide-react';

const MAX_EVENTS = 12;

function formatTime(timestamp: number): string {
  const d = new Date(timestamp);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

const CampLife: React.FC = () => {
  const { state } = useGame();
  const [events, setEvents] = useState<CampEvent[]>([]);
  const stateRef = useRef(state);

  // Keep ref current so setTimeout callbacks always see fresh state
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;

    function scheduleNext(delay: number) {
      timeoutId = setTimeout(() => {
        const current = stateRef.current;
        const event = generateCampEvent(current.survivors, current.buildings);
        if (event) {
          setEvents(prev => [event, ...prev].slice(0, MAX_EVENTS));
        }
        // Next event in 30–60 seconds
        scheduleNext(30_000 + Math.random() * 30_000);
      }, delay);
    }

    // First event fires ~5–10 s after mount
    scheduleNext(5_000 + Math.random() * 5_000);

    return () => clearTimeout(timeoutId);
  }, []);

  return (
    <div className="space-y-2">
      <h2 className="text-sm font-bold font-mono uppercase tracking-wider flex items-center gap-2"
        style={{ color: 'rgba(190, 120, 40, 0.85)' }}>
        <Flame className="w-4 h-4" style={{ color: 'rgba(210, 140, 50, 0.9)' }} />
        Vie au camp
      </h2>

      <div className="p-2 max-h-48 overflow-y-auto space-y-1"
        style={{
          backgroundColor: 'rgba(18, 12, 5, 0.55)',
          border: '1px solid rgba(110, 58, 10, 0.28)',
          borderRadius: '0.15rem',
        }}>
        {events.length === 0 ? (
          <p className="text-xs font-mono italic px-2 py-1" style={{ color: 'rgba(120, 75, 20, 0.6)' }}>
            Le camp est calme pour l'instant…
          </p>
        ) : (
          events.map((ev, i) => (
            <div
              key={ev.id}
              className={`flex items-start gap-2 px-2 py-1 rounded wl-camp-event-in${i === 0 ? ' wl-camp-event-new' : ''}`}
              style={{ animationDelay: '0ms' }}
            >
              <span className="text-[10px] font-mono flex-shrink-0 mt-0.5"
                style={{ color: 'rgba(130, 80, 20, 0.55)' }}>
                {formatTime(ev.time)}
              </span>
              <span className="text-xs font-mono leading-snug"
                style={{ color: 'rgba(185, 135, 65, 0.82)' }}>
                {ev.message}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default CampLife;
