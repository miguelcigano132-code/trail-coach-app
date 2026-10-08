'use client';

import React, { useState } from 'react';
import { 
  Calculator, 
  Heart, 
  Timer, 
  Activity, 
  TrendingUp, 
  TrendingDown 
} from 'lucide-react';
import { 
  calculateGAP, 
  formatPace, 
  parsePaceToSeconds, 
  calculateHrZones 
} from '@/lib/paceCalculator';

export default function PaceCalculatorComponent() {
  const [flatPace, setFlatPace] = useState('05:00');
  const [fcMax, setFcMax] = useState(185);
  const [lthr, setLthr] = useState(168);
  const [slope, setSlope] = useState(10); // 10% de inclinação padrão para simulação

  const flatPaceSec = parsePaceToSeconds(flatPace);
  const gapPaceSec = calculateGAP(flatPaceSec, slope);
  const hrZones = calculateHrZones(fcMax, lthr);

  return (
    <div className="bg-[#0a1122]/90 border border-slate-800/80 rounded-3xl p-6 md:p-8 space-y-6 shadow-2xl">
      <div className="flex items-center gap-3 pb-4 border-b border-slate-800/60">
        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
          <Calculator className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-base font-extrabold uppercase tracking-wide text-white">
            Calculadora GAP & Zonas de Intensidade
          </h2>
          <p className="text-xs text-slate-400">
            Ajuste de ritmo por inclinação de terreno e definição de zonas cardíacas do atleta.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Input Ritmo em Plano */}
        <div className="bg-[#050914] p-4 rounded-2xl border border-slate-800 space-y-2">
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Timer className="w-3.5 h-3.5 text-emerald-400" />
            Ritmo Base em Plano (min/km)
          </label>
          <input
            type="text"
            value={flatPace}
            onChange={(e) => setFlatPace(e.target.value)}
            placeholder="05:00"
            className="w-full bg-[#0a1122] border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* Input FC Máxima */}
        <div className="bg-[#050914] p-4 rounded-2xl border border-slate-800 space-y-2">
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Heart className="w-3.5 h-3.5 text-red-400" />
            FC Máxima (bpm)
          </label>
          <input
            type="number"
            value={fcMax}
            onChange={(e) => setFcMax(Number(e.target.value))}
            className="w-full bg-[#0a1122] border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* Input Limiar (LTHR) */}
        <div className="bg-[#050914] p-4 rounded-2xl border border-slate-800 space-y-2">
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
            Limiar Anaeróbico / LTHR (bpm)
          </label>
          <input
            type="number"
            value={lthr}
            onChange={(e) => setLthr(Number(e.target.value))}
            className="w-full bg-[#0a1122] border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Simulador GAP por Inclinação */}
      <div className="bg-[#050914] p-5 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex justify-between items-center">
          <label className="text-xs font-extrabold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            Simulação de Terreno: {slope > 0 ? `Subida (+${slope}%)` : slope < 0 ? `Descida (${slope}%)` : 'Plano (0%)'}
          </label>
          <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-lg border border-emerald-500/20">
            Ritmo Ajustado (GAP): {formatPace(gapPaceSec)}
          </span>
        </div>

        <input
          type="range"
          min="-20"
          max="30"
          step="1"
          value={slope}
          onChange={(e) => setSlope(Number(e.target.value))}
          className="w-full accent-emerald-500 cursor-pointer"
        />

        <div className="flex justify-between text-[10px] text-slate-500 font-mono">
          <span className="flex items-center gap-1"><TrendingDown className="w-3 h-3 text-emerald-400" /> Descida Técnica (-20%)</span>
          <span>Plano (0%)</span>
          <span className="flex items-center gap-1"><TrendingUp className="w-3 h-3 text-red-400" /> Subida Íngreme (+30%)</span>
        </div>
      </div>

      {/* Tabela de Zonas de Intensidade */}
      <div className="space-y-3">
        <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-300 flex items-center gap-2">
          <Heart className="w-4 h-4 text-red-400" />
          Zonas de Frequência Cardíaca Personalizadas
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
          {hrZones.map((zone) => (
            <div key={zone.zone} className="bg-[#050914] border border-slate-800 p-3 rounded-xl space-y-1 text-center">
              <span className="text-[10px] font-black uppercase text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                {zone.zone}
              </span>
              <p className="text-[11px] font-bold text-slate-300 truncate">{zone.name}</p>
              <p className="text-xs font-mono font-extrabold text-white">
                {zone.min} - {zone.max} <span className="text-[9px] text-slate-500">bpm</span>
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
