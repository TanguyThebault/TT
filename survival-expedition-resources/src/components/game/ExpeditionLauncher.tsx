import React, { useState } from 'react';
import { useGame } from '@/contexts/GameContext';
import { ZONES, getExpeditionDurationMultiplier, getDangerReduction } from '@/data/gameData';
import SurvivorCard from './SurvivorCard';
import {
  MapPin, AlertTriangle, Clock, Lock, Rocket, ChevronRight,
  Home, Building2, Shield, HeartPulse, Factory, FlaskConical, ArrowLeft
} from 'lucide-react';


const zoneIcons: Record<string, React.ReactNode> = {
  Home: <Home className="w-5 h-5" />,
  Building2: <Building2 className="w-5 h-5" />,
  Shield: <Shield className="w-5 h-5" />,
  Cross: <HeartPulse className="w-5 h-5" />,

  Factory: <Factory className="w-5 h-5" />,
  FlaskConical: <FlaskConical className="w-5 h-5" />,
};

const dangerLabels = ['', 'Faible', 'Modéré', 'Élevé', 'Très Élevé', 'Extrême'];
const dangerColors = ['', 'text-green-400', 'text-yellow-400', 'text-orange-400', 'text-red-400', 'text-red-500'];
const dangerBg = ['', 'bg-green-900/20', 'bg-yellow-900/20', 'bg-orange-900/20', 'bg-red-900/20', 'bg-red-900/30'];

const ExpeditionLauncher: React.FC = () => {
  const { state, launchExpedition } = useGame();
  const [selectedZone, setSelectedZone] = useState<string | null>(null);
  const [selectedSurvivors, setSelectedSurvivors] = useState<string[]>([]);

  const garageLevel = state.buildings['garage'] || 0;
  const durationMult = getExpeditionDurationMultiplier(garageLevel);
  const watchtowerLevel = state.buildings['watchtower'] || 0;
  const dangerReduction = getDangerReduction(watchtowerLevel);

  const availableSurvivors = state.survivors.filter(s => s.status === 'available');

  const handleLaunch = () => {
    if (!selectedZone || selectedSurvivors.length === 0) return;
    launchExpedition(selectedZone, selectedSurvivors);
    setSelectedZone(null);
    setSelectedSurvivors([]);
  };

  const toggleSurvivor = (id: string) => {
    setSelectedSurvivors(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  if (selectedZone) {
    const zone = ZONES.find(z => z.id === selectedZone)!;
    const duration = Math.floor(zone.baseDuration * durationMult);
    const hours = Math.floor(duration / 3600);
    const minutes = Math.floor((duration % 3600) / 60);
    const seconds = duration % 60;
    const timeStr = hours > 0
      ? `${hours}h ${minutes}m`
      : minutes > 0
        ? `${minutes}m ${seconds}s`
        : `${seconds}s`;

    return (
      <div className="space-y-3">
        <button
          onClick={() => { setSelectedZone(null); setSelectedSurvivors([]); }}
          className="flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-200 font-mono transition-colors"
        >
          <ArrowLeft className="w-3 h-3" />
          Retour aux zones
        </button>

        <div className={`bg-zinc-900/60 border border-zinc-700 rounded-lg p-4 ${dangerBg[zone.dangerLevel]}`}>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded bg-zinc-800 text-amber-500">
              {zoneIcons[zone.icon]}
            </div>
            <div>
              <h3 className="font-bold text-zinc-200">{zone.name}</h3>
              <p className="text-xs text-zinc-400">{zone.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-xs font-mono">
            <span className={`flex items-center gap-1 ${dangerColors[zone.dangerLevel]}`}>
              <AlertTriangle className="w-3 h-3" />
              Danger: {dangerLabels[zone.dangerLevel]}
              {dangerReduction > 0 && <span className="text-green-400 ml-1">(-{Math.round(dangerReduction * 100)}%)</span>}
            </span>
            <span className="flex items-center gap-1 text-blue-400">
              <Clock className="w-3 h-3" />
              Durée: {timeStr}
              {garageLevel > 0 && <span className="text-green-400 ml-1">(-{Math.round((1 - durationMult) * 100)}%)</span>}
            </span>
          </div>
          <div className="mt-2 text-xs text-zinc-500 font-mono">
            Butin possible: {zone.lootTable.map(l => l.name).join(', ')}
          </div>
        </div>

        <div className="text-sm text-zinc-400 font-mono">
          Sélectionnez les survivants ({selectedSurvivors.length} choisi{selectedSurvivors.length > 1 ? 's' : ''}):
        </div>

        {availableSurvivors.length === 0 ? (
          <div className="text-xs text-zinc-600 italic font-mono bg-zinc-900/40 rounded p-3">
            Aucun survivant disponible. Attendez le retour d'une expédition ou soignez les blessés.
          </div>
        ) : (
          <div className="space-y-2">
            {availableSurvivors.map(s => (
              <SurvivorCard
                key={s.id}
                survivor={s}
                selectable
                selected={selectedSurvivors.includes(s.id)}
                onToggleSelect={() => toggleSurvivor(s.id)}
              />
            ))}
          </div>
        )}

        <button
          onClick={handleLaunch}
          disabled={selectedSurvivors.length === 0}
          className={`w-full flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-bold font-mono uppercase tracking-wider transition-all ${
            selectedSurvivors.length > 0
              ? 'bg-amber-600 hover:bg-amber-500 text-black shadow-lg shadow-amber-900/30'
              : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
          }`}
        >
          <Rocket className="w-4 h-4" />
          Lancer l'Expédition ({timeStr})
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-bold text-amber-500 font-mono uppercase tracking-wider flex items-center gap-2">
        <MapPin className="w-5 h-5" />
        Zones d'Expédition
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {ZONES.map(zone => {
          const req = zone.requiredBuildingLevel;
          const isLocked = req ? (state.buildings[req.buildingId] || 0) < req.level : false;
          const duration = Math.floor(zone.baseDuration * durationMult);
          const minutes = Math.floor(duration / 60);
          const seconds = duration % 60;
          const timeStr = minutes > 0 ? `${minutes}m ${seconds > 0 ? seconds + 's' : ''}` : `${seconds}s`;

          return (
            <button
              key={zone.id}
              onClick={() => !isLocked && setSelectedZone(zone.id)}
              disabled={isLocked}
              className={`text-left bg-zinc-900/60 border rounded-lg p-4 transition-all duration-200 ${
                isLocked
                  ? 'border-zinc-800 opacity-50 cursor-not-allowed'
                  : 'border-zinc-700/50 hover:border-amber-500/50 hover:shadow-lg hover:shadow-amber-900/10 cursor-pointer'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className={`p-2 rounded ${isLocked ? 'bg-zinc-800 text-zinc-600' : 'bg-zinc-800 text-amber-500'}`}>
                    {isLocked ? <Lock className="w-5 h-5" /> : zoneIcons[zone.icon]}
                  </div>
                  <div>
                    <h3 className={`font-bold text-sm ${isLocked ? 'text-zinc-600' : 'text-zinc-200'}`}>{zone.name}</h3>
                    {isLocked && req && (
                      <span className="text-[10px] text-red-400 font-mono">
                        Requis: Station Radio Nv.{req.level}
                      </span>
                    )}
                  </div>
                </div>
                {!isLocked && <ChevronRight className="w-4 h-4 text-zinc-600" />}
              </div>
              <p className="text-xs text-zinc-500 mb-2">{zone.description}</p>
              <div className="flex items-center gap-3 text-xs font-mono">
                <span className={`flex items-center gap-1 ${dangerColors[zone.dangerLevel]}`}>
                  <AlertTriangle className="w-3 h-3" />
                  {dangerLabels[zone.dangerLevel]}
                </span>
                <span className="flex items-center gap-1 text-blue-400">
                  <Clock className="w-3 h-3" />
                  {timeStr}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default ExpeditionLauncher;
