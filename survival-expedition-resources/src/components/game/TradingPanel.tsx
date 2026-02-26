import React, { useState } from 'react';
import { useGame, type TradeGive, type TradeReceive } from '@/contexts/GameContext';
import { RESOURCES, RESOURCE_RARITY, getEquipmentTradeValue, type EquipmentDef } from '@/data/gameData';
import { Radio, ArrowLeftRight, Sword, Shield, Backpack } from 'lucide-react';

const TIER_COLORS = ['', 'text-zinc-400', 'text-green-400', 'text-blue-400', 'text-purple-400', 'text-amber-400'];

const SLOT_ICON: Record<string, React.ReactNode> = {
  weapon:   <Sword   className="w-3 h-3" />,
  armor:    <Shield  className="w-3 h-3" />,
  backpack: <Backpack className="w-3 h-3" />,
};

type Mode = 'resource' | 'equipment';

function eqVal(eq: EquipmentDef): number { return getEquipmentTradeValue(eq.tier); }
function resVal(id: string, qty: number): number { return qty * (RESOURCE_RARITY[id] ?? 1); }

const TradingPanel: React.FC = () => {
  const { state, executeTrade } = useGame();
  const camp = state.traderCamp;

  // Receive side (what player wants from camp)
  const [recMode, setRecMode] = useState<Mode>('resource');
  const [recResId, setRecResId] = useState('medicine');
  const [recQty, setRecQty]   = useState(1);
  const [recEqIdx, setRecEqIdx] = useState<number | null>(null);

  // Give side (what player offers to camp)
  const [giveMode, setGiveMode] = useState<Mode>('resource');
  const [giveResId, setGiveResId] = useState('food');
  const [giveQty, setGiveQty]   = useState(1);
  const [giveEqIdx, setGiveEqIdx] = useState<number | null>(null);

  if (!state.traderCampDiscovered || !camp) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-3">
        <Radio className="w-12 h-12 text-zinc-700" />
        <p className="text-zinc-500 font-mono text-sm uppercase tracking-wider">Aucun contact établi</p>
        <p className="text-zinc-600 font-mono text-xs text-center max-w-xs">
          Explorez la <span className="text-amber-600">Fréquence Inconnue</span> avec la Station Radio nv.2
          pour établir un contact avec un camp allié.
        </p>
      </div>
    );
  }

  const recvEquip  = recMode === 'equipment'  && recEqIdx  !== null ? camp.equipment[recEqIdx]      : null;
  const giveEquip  = giveMode === 'equipment' && giveEqIdx !== null ? state.inventory[giveEqIdx]    : null;

  const receiveValue = recMode  === 'resource' ? resVal(recResId,  recQty)  : (recvEquip  ? eqVal(recvEquip)  : 0);
  const giveValue    = giveMode === 'resource' ? resVal(giveResId, giveQty) : (giveEquip  ? eqVal(giveEquip)  : 0);

  const tierViolation      = recvEquip && giveEquip && Math.abs(recvEquip.tier - giveEquip.tier) > 1;
  const insufficientOffer  = giveValue < receiveValue;
  const noPlayerRes        = giveMode === 'resource'  && (state.resources[giveResId] || 0) < giveQty;
  const noCampRes          = recMode  === 'resource'  && (camp.resources[recResId]   || 0) < recQty;
  const recvSelected       = recMode  === 'resource'  || recEqIdx  !== null;
  const giveSelected       = giveMode === 'resource'  || giveEqIdx !== null;

  const canTrade = (
    recvSelected && giveSelected && receiveValue > 0 && giveValue > 0 &&
    !tierViolation && !insufficientOffer && !noPlayerRes && !noCampRes &&
    !(recMode === 'equipment' && camp.equipment.length === 0) &&
    !(giveMode === 'equipment' && state.inventory.length === 0)
  );

  function handleTrade() {
    if (!canTrade) return;
    const give: TradeGive = giveMode === 'resource'
      ? { kind: 'resource', resourceId: giveResId, quantity: giveQty }
      : { kind: 'equipment', inventoryIndex: giveEqIdx! };
    const receive: TradeReceive = recMode === 'resource'
      ? { kind: 'resource', resourceId: recResId, quantity: recQty }
      : { kind: 'equipment', campEquipIndex: recEqIdx! };
    executeTrade(give, receive);
    setRecEqIdx(null);
    setGiveEqIdx(null);
    setRecQty(1);
    setGiveQty(1);
  }

  const campResEntries = Object.entries(camp.resources).filter(([, v]) => v > 0);

  return (
    <div className="space-y-4">

      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-amber-500 font-mono uppercase tracking-wider flex items-center gap-2">
          <ArrowLeftRight className="w-5 h-5" />
          Troc — {camp.name}
        </h2>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-green-500/30 text-green-400 bg-green-900/10 uppercase tracking-widest">
          Contact établi
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

        {/* ── RECEIVE column (what player wants) ─────────────────────────── */}
        <div className="space-y-3 p-3 rounded"
          style={{ border: '1px solid rgba(74,222,128,0.15)', backgroundColor: 'rgba(15,30,15,0.5)' }}>

          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-wider text-green-400">Je reçois</span>
            <div className="flex gap-1">
              {(['resource', 'equipment'] as Mode[]).map(m => (
                <button key={m}
                  onClick={() => { setRecMode(m); setRecEqIdx(null); }}
                  className={`text-[10px] font-mono px-2 py-0.5 rounded border transition-colors ${
                    recMode === m ? 'border-green-500/50 text-green-400 bg-green-900/20' : 'border-zinc-700 text-zinc-500 hover:text-zinc-300'
                  }`}>
                  {m === 'resource' ? 'Ressource' : 'Équipement'}
                </button>
              ))}
            </div>
          </div>

          {recMode === 'resource' ? (
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-1.5">
                {campResEntries.map(([resId, avail]) => {
                  const rDef = RESOURCES.find(r => r.id === resId);
                  return (
                    <button key={resId} onClick={() => setRecResId(resId)}
                      className={`flex items-center gap-1.5 px-2 py-1.5 rounded border text-left transition-colors ${
                        recResId === resId
                          ? 'border-green-500/60 bg-green-900/20 text-green-300'
                          : 'border-zinc-700/50 hover:border-zinc-600 text-zinc-400'
                      }`}>
                      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: rDef?.color }} />
                      <span className="text-[10px] font-mono truncate">{rDef?.name ?? resId}</span>
                      <span className="text-[10px] font-mono text-zinc-500 ml-auto">{avail}</span>
                    </button>
                  );
                })}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono text-zinc-400">Quantité :</span>
                <input type="number" min={1} max={camp.resources[recResId] || 1}
                  value={recQty}
                  onChange={e => setRecQty(Math.max(1, Math.min(camp.resources[recResId] || 1, parseInt(e.target.value) || 1)))}
                  className="w-16 bg-zinc-800 border border-zinc-700 text-zinc-200 text-xs font-mono rounded px-2 py-1 text-center" />
                <span className="text-[10px] font-mono text-zinc-600">
                  val.&nbsp;<span className="text-zinc-400">{resVal(recResId, recQty)}</span>
                </span>
              </div>
            </div>
          ) : (
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {camp.equipment.length === 0
                ? <p className="text-xs font-mono text-zinc-600 italic">Pas d'équipement disponible.</p>
                : camp.equipment.map((eq, idx) => (
                  <button key={idx} onClick={() => setRecEqIdx(recEqIdx === idx ? null : idx)}
                    className={`w-full flex items-center gap-2 px-2 py-1.5 rounded border text-left transition-colors ${
                      recEqIdx === idx ? 'border-green-500/60 bg-green-900/20' : 'border-zinc-700/50 hover:border-zinc-600'
                    }`}>
                    <span className={TIER_COLORS[eq.tier]}>{SLOT_ICON[eq.slot]}</span>
                    <span className={`text-[10px] font-mono ${TIER_COLORS[eq.tier]}`}>{eq.name}</span>
                    <span className="text-[9px] font-mono text-zinc-600 ml-auto">
                      T{eq.tier} · val.{eqVal(eq)}
                    </span>
                  </button>
                ))
              }
            </div>
          )}
        </div>

        {/* ── GIVE column (what player offers) ───────────────────────────── */}
        <div className="space-y-3 p-3 rounded"
          style={{ border: '1px solid rgba(180,120,30,0.2)', backgroundColor: 'rgba(25,18,5,0.5)' }}>

          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-wider text-amber-400">J'offre</span>
            <div className="flex gap-1">
              {(['resource', 'equipment'] as Mode[]).map(m => (
                <button key={m}
                  onClick={() => { setGiveMode(m); setGiveEqIdx(null); }}
                  className={`text-[10px] font-mono px-2 py-0.5 rounded border transition-colors ${
                    giveMode === m ? 'border-amber-500/50 text-amber-400 bg-amber-900/20' : 'border-zinc-700 text-zinc-500 hover:text-zinc-300'
                  }`}>
                  {m === 'resource' ? 'Ressource' : 'Équipement'}
                </button>
              ))}
            </div>
          </div>

          {giveMode === 'resource' ? (
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-1.5">
                {RESOURCES.map(rDef => {
                  const avail = state.resources[rDef.id] || 0;
                  return (
                    <button key={rDef.id} onClick={() => avail > 0 && setGiveResId(rDef.id)}
                      disabled={avail === 0}
                      className={`flex items-center gap-1.5 px-2 py-1.5 rounded border text-left transition-colors ${
                        avail === 0
                          ? 'border-zinc-800 text-zinc-700 opacity-40 cursor-not-allowed'
                          : giveResId === rDef.id
                            ? 'border-amber-500/60 bg-amber-900/20 text-amber-300'
                            : 'border-zinc-700/50 hover:border-zinc-600 text-zinc-400'
                      }`}>
                      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: rDef.color }} />
                      <span className="text-[10px] font-mono truncate">{rDef.name}</span>
                      <span className="text-[10px] font-mono text-zinc-500 ml-auto">{avail}</span>
                    </button>
                  );
                })}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono text-zinc-400">Quantité :</span>
                <input type="number" min={1} max={state.resources[giveResId] || 1}
                  value={giveQty}
                  onChange={e => setGiveQty(Math.max(1, Math.min(state.resources[giveResId] || 1, parseInt(e.target.value) || 1)))}
                  className="w-16 bg-zinc-800 border border-zinc-700 text-zinc-200 text-xs font-mono rounded px-2 py-1 text-center" />
                <span className="text-[10px] font-mono text-zinc-600">
                  val.&nbsp;<span className="text-zinc-400">{resVal(giveResId, giveQty)}</span>
                </span>
              </div>
            </div>
          ) : (
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {state.inventory.length === 0
                ? <p className="text-xs font-mono text-zinc-600 italic">Inventaire vide.</p>
                : state.inventory.map((eq, idx) => (
                  <button key={idx} onClick={() => setGiveEqIdx(giveEqIdx === idx ? null : idx)}
                    className={`w-full flex items-center gap-2 px-2 py-1.5 rounded border text-left transition-colors ${
                      giveEqIdx === idx ? 'border-amber-500/60 bg-amber-900/20' : 'border-zinc-700/50 hover:border-zinc-600'
                    }`}>
                    <span className={TIER_COLORS[eq.tier]}>{SLOT_ICON[eq.slot]}</span>
                    <span className={`text-[10px] font-mono ${TIER_COLORS[eq.tier]}`}>{eq.name}</span>
                    <span className="text-[9px] font-mono text-zinc-600 ml-auto">
                      T{eq.tier} · val.{eqVal(eq)}
                    </span>
                  </button>
                ))
              }
            </div>
          )}
        </div>
      </div>

      {/* ── Trade summary & validation ─────────────────────────────────────── */}
      <div className="p-3 rounded space-y-2"
        style={{ border: '1px solid rgba(100,80,30,0.3)', backgroundColor: 'rgba(12,10,4,0.7)' }}>

        <div className="flex items-center justify-between text-xs font-mono">
          <span>
            <span className="text-zinc-500">Valeur offerte : </span>
            <span className={giveValue >= receiveValue && giveValue > 0 ? 'text-green-400' : 'text-red-400'}>
              {giveValue} pts
            </span>
          </span>
          <ArrowLeftRight className="w-3.5 h-3.5 text-zinc-700" />
          <span>
            <span className="text-zinc-500">Valeur demandée : </span>
            <span className="text-zinc-300">{receiveValue} pts</span>
          </span>
        </div>

        {/* Rarity legend */}
        <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[9px] font-mono text-zinc-700">
          {RESOURCES.map(r => (
            <span key={r.id}>
              <span style={{ color: r.color }}>●</span> {r.name} = {RESOURCE_RARITY[r.id] ?? 1}pt
            </span>
          ))}
          <span className="text-zinc-700">Équip: T1=1 / T2=5 / T3=25 / T4=125</span>
        </div>

        {/* Validation messages */}
        {tierViolation && (
          <p className="text-[11px] font-mono text-red-400">
            ⚠ Écart de tiers trop important — l'échange d'équipement est limité à 1 tier d'écart.
          </p>
        )}
        {!tierViolation && insufficientOffer && receiveValue > 0 && (
          <p className="text-[11px] font-mono text-red-400">
            Offre insuffisante — il manque {receiveValue - giveValue} pts de valeur.
          </p>
        )}
        {noPlayerRes && (
          <p className="text-[11px] font-mono text-red-400">Ressources insuffisantes dans votre stock.</p>
        )}
        {noCampRes && (
          <p className="text-[11px] font-mono text-red-400">Le camp n'a pas assez de cette ressource.</p>
        )}

        <button
          onClick={handleTrade}
          disabled={!canTrade}
          className={`w-full flex items-center justify-center gap-2 py-2.5 rounded font-mono font-bold text-sm uppercase tracking-wider transition-all ${
            canTrade
              ? 'bg-amber-600/80 hover:bg-amber-500 text-black border border-amber-500/50'
              : 'bg-zinc-800/50 text-zinc-600 border border-zinc-700/30 cursor-not-allowed'
          }`}
        >
          <ArrowLeftRight className="w-4 h-4" />
          Valider le troc
        </button>
      </div>
    </div>
  );
};

export default TradingPanel;
