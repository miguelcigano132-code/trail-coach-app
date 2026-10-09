'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Droplets, Zap, Clock, MapPin, Mountain } from 'lucide-react';

interface Checkpoint {
  id: string;
  name: string;
  km: number;
  elevation_gain?: number; // Desnível acumulado opcional no segmento
  carbs_g: number;
  flasks_count: number;
  flask_vol_ml: number;
}

interface RacePlanProps {
  raceId: string;
  athletePaceMinPerKm?: number; // Ritmo base em plano (ex: 6.0 min/km)
}

export default function AthleteRacePlan({ raceId, athletePaceMinPerKm = 6.0 }: RacePlanProps) {
  const [checkpoints, setCheckpoints] = useState<Checkpoint[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (raceId) {
      fetchCheckpoints();
    }
  }, [raceId]);

  async function fetchCheckpoints() {
    setLoading(true);
    try {
      let { data, error } = await supabase
        .from('checkpoints')
        .select('*')
        .eq('race_id', raceId)
        .order('km', { ascending: true });

      if (error || !data || data.length === 0) {
        const { data: altData } = await supabase
          .from('aid_stations')
          .select('*')
          .eq('race_id', raceId)
          .order('km', { ascending: true });
        
        if (altData) {
          data = altData;
        }
      }

      setCheckpoints(data || []);
    } catch (err) {
      console.error('Erro ao carregar PACs:', err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <p className="text-xs text-slate-400 italic">A carregar plano de PACs...</p>;
  }

  if (checkpoints.length === 0) {
    return (
      <div className="bg-[#0a1122] p-6 rounded-2xl border border-slate-800 text-center text-xs text-slate-400 space-y-2">
        <p className="font-bold text-slate-300">Nenhum PAC definido para esta prova.</p>
        <p className="text-[11px] text-slate-500">Certifica-te de adicionar checkpoints/postos de abastecimento para esta prova no painel de administração.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-extrabold uppercase tracking-wider text-emerald-400 flex items-center gap-2">
        <MapPin className="w-4 h-4" /> Plano Nutricional & Estimativa de Esforço por PAC
      </h3>

      <div className="grid gap-3">
        {checkpoints.map((cp, idx) => {
          const prevKm = idx === 0 ? 0 : checkpoints[idx - 1].km;
          const segmentDist = cp.km - prevKm;
          
          // --- Ajuste Naismith para o Segmento ---
          // Tempo base em minutos = distância * ritmo (min/km)
          const baseMinutes = segmentDist * athletePaceMinPerKm;
          // Penalização de subida estimada (se houver ganho de elevação registado, senão assume estimativa proporcional, ex: 10m por km)
          const segGain = cp.elevation_gain || (segmentDist * 30); 
          const climbPenaltyMinutes = (segGain / 600) * 60; // +60 min por cada 600m de subida
          
          const estimatedMin = Math.round(baseMinutes + climbPenaltyMinutes);
          const hours = Math.floor(estimatedMin / 60);
          const mins = estimatedMin % 60;
          const timeFormatted = hours > 0 ? `${hours}h${mins}m` : `${mins}m`;

          const flasksCount = cp.flasks_count || 1;
          const flaskVol = cp.flask_vol_ml || 500;
          const totalMl = flasksCount * flaskVol;
          const carbs = cp.carbs_g || 0;

          return (
            <div 
              key={cp.id || idx}
              className="bg-[#0a1122] border border-slate-800/80 p-4 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-slate-700 transition-all"
            >
              {/* Informação do PAC */}
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-black px-2 py-0.5 rounded-md">
                    KM {cp.km}
                  </span>
                  <h4 className="font-bold text-white text-sm">{cp.name || `PAC ${idx + 1}`}</h4>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-400">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    Segmento: {segmentDist.toFixed(1)} km (~{timeFormatted})
                  </span>
                  {segGain > 0 && (
                    <span className="flex items-center gap-1 text-amber-400/90 font-medium">
                      <Mountain className="w-3.5 h-3.5" />
                      +{Math.round(segGain)}m D+
                    </span>
                  )}
                </div>
              </div>

              {/* Métricas de Nutrição e Hidratação */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="bg-[#050914] border border-slate-800 px-3 py-2 rounded-xl flex items-center gap-2">
                  <Droplets className="w-4 h-4 text-cyan-400" />
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Hidratação</p>
                    <p className="text-xs font-mono font-bold text-cyan-300">
                      {flasksCount}x Flasks {flaskVol}ml ({totalMl}ml)
                    </p>
                  </div>
                </div>

                <div className="bg-[#050914] border border-slate-800 px-3 py-2 rounded-xl flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-400" />
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Nutrição</p>
                    <p className="text-xs font-mono font-bold text-amber-300">
                      {carbs}g HC (~{Math.round(carbs / 30)} geles)
                    </p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
