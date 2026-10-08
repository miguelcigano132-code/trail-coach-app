'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Droplets, Zap, Clock, MapPin, CheckCircle2 } from 'lucide-react';

interface Checkpoint {
  id: string;
  name: string;
  km: number;
  carbs_g: number;
  flasks_count: number;
  flask_vol_ml: number;
}

interface RacePlanProps {
  raceId: string;
  athletePaceMinPerKm?: number; // Ex: 6.5 para 6m30s/km
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
      const { data, error } = await supabase
        .from('checkpoints')
        .select('*')
        .eq('race_id', raceId)
        .order('km', { ascending: true });

      if (error) throw error;
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
      <div className="bg-[#0a1122] p-4 rounded-2xl border border-slate-800 text-center text-xs text-slate-400">
        Nenhum PAC definido para esta prova.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-extrabold uppercase tracking-wider text-emerald-400 flex items-center gap-2">
        <MapPin className="w-4 h-4" /> Plano Nutricional & Hidratação por PAC
      </h3>

      <div className="grid gap-3">
        {checkpoints.map((cp, idx) => {
          // Cálculo do segmento entre PACs
          const prevKm = idx === 0 ? 0 : checkpoints[idx - 1].km;
          const segmentDist = cp.km - prevKm;
          const estimatedMin = Math.round(segmentDist * athletePaceMinPerKm);
          const hours = Math.floor(estimatedMin / 60);
          const mins = estimatedMin % 60;
          const timeFormatted = hours > 0 ? `${hours}h${mins}m` : `${mins}m`;

          const totalMl = cp.flasks_count * cp.flask_vol_ml;

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
                  <h4 className="font-bold text-white text-sm">{cp.name}</h4>
                </div>
                <p className="text-xs text-slate-400 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  Segmento: {segmentDist.toFixed(1)} km (~{timeFormatted})
                </p>
              </div>

              {/* Métricas de Nutrição e Hidratação */}
              <div className="flex flex-wrap items-center gap-3">
                {/* Flasks / Água */}
                <div className="bg-[#050914] border border-slate-800 px-3 py-2 rounded-xl flex items-center gap-2">
                  <Droplets className="w-4 h-4 text-cyan-400" />
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Hidratação</p>
                    <p className="text-xs font-mono font-bold text-cyan-300">
                      {cp.flasks_count}x Flasks {cp.flask_vol_ml}ml ({totalMl}ml)
                    </p>
                  </div>
                </div>

                {/* Hidratos de Carbono */}
                <div className="bg-[#050914] border border-slate-800 px-3 py-2 rounded-xl flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-400" />
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Nutrição</p>
                    <p className="text-xs font-mono font-bold text-amber-300">
                      {cp.carbs_g}g HC (~{Math.round(cp.carbs_g / 30)} geles)
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
