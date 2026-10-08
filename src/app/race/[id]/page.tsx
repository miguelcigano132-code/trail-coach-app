'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { 
  Mountain, 
  Flag, 
  Clock, 
  Zap, 
  Droplet, 
  MessageSquare, 
  ChevronLeft,
  Share2,
  Calendar,
  AlertCircle
} from 'lucide-react';
import ElevationProfile from '@/components/ElevationProfile';
import Link from 'next/link';

interface Checkpoint {
  id: string;
  name: string;
  km: number;
  carbs_g: number;
  flasks_count: number;
  flask_vol_ml: number;
}

interface RaceData {
  id: string;
  title: string;
  race_date: string;
  distance_km: number;
  elevation_gain_m: number;
  coach_notes?: string;
  gpx_data?: any[];
}

export default function AthleteRaceViewPage() {
  const params = useParams();
  const raceId = params?.id as string;

  const [race, setRace] = useState<RaceData | null>(null);
  const [checkpoints, setCheckpoints] = useState<Checkpoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Ritmo estimado por defeito (6 min/km - pode ser parametrizável)
  const estimatedPaceMinPerKm = 6.0;

  useEffect(() => {
    if (!raceId) return;

    async function fetchRaceDetails() {
      try {
        setLoading(true);
        
        // 1. Procurar dados da prova
        const { data: raceData, error: raceErr } = await supabase
          .from('races')
          .select('*')
          .eq('id', raceId)
          .single();

        if (raceErr) throw raceErr;
        setRace(raceData);

        // 2. Procurar PACs / Checkpoints da prova
        const { data: cpData, error: cpErr } = await supabase
          .from('checkpoints')
          .select('*')
          .eq('race_id', raceId)
          .order('km', { ascending: true });

        if (cpErr) throw cpErr;
        setCheckpoints(cpData || []);

      } catch (err: any) {
        console.error('Erro ao carregar detalhes da prova:', err);
        setError('Não foi possível carregar os dados da prova.');
      } fontFinally: {
        setLoading(false);
      }
    }

    fetchRaceDetails();
  }, [raceId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050914] text-slate-100 flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">A carregar plano de prova...</p>
        </div>
      </div>
    );
  }

  if (error || !race) {
    return (
      <div className="min-h-screen bg-[#050914] text-slate-100 flex items-center justify-center p-4">
        <div className="text-center space-y-4 max-w-md">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto" />
          <h1 className="text-lg font-extrabold">Prova não encontrada</h1>
          <p className="text-xs text-slate-400">{error || 'A prova pedida não existe ou foi removida.'}</p>
          <Link 
            href="/admin" 
            className="inline-block bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all"
          >
            Voltar ao Painel
          </Link>
        </div>
      </div>
    );
  }

  // Cálculos rápidos para exibição
  const totalHours = (race.distance_km * estimatedPaceMinPerKm) / 60;
  const hours = Math.floor(totalHours);
  const minutes = Math.round((totalHours - hours) * 60);

  return (
    <div className="min-h-screen bg-[#050914] text-slate-100 p-4 md:p-8 font-sans pb-24">
      <div className="max-w-2xl mx-auto space-y-6">
        
        {/* Barra de Navegação Superior */}
        <div className="flex items-center justify-between">
          <Link 
            href="/admin" 
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors bg-[#0a1122] border border-slate-800 px-3 py-2 rounded-xl"
          >
            <ChevronLeft className="w-4 h-4" /> Voltar
          </Link>
          <button 
            onClick={() => navigator.share?.({ title: race.title, url: window.location.href })}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors bg-[#0a1122] border border-slate-800 px-3 py-2 rounded-xl"
          >
            <Share2 className="w-3.5 h-3.5" /> Partilhar
          </button>
        </div>

        {/* Cartão de Cabeçalho da Prova */}
        <div className="bg-gradient-to-br from-[#0a1122] to-[#050914] border border-slate-800/80 rounded-3xl p-6 space-y-4 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
          
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-widest">
            <Calendar className="w-3.5 h-3.5" /> {race.race_date ? new Date(race.race_date).toLocaleDateString('pt-PT') : 'Data a definir'}
          </div>

          <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">{race.title}</h1>

          {/* Métrica Resumo em Grelha */}
          <div className="grid grid-cols-3 gap-2 pt-2">
            <div className="bg-[#050914]/80 border border-slate-800 p-3 rounded-2xl text-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Distância</span>
              <span className="text-lg font-black text-white">{race.distance_km} <span className="text-xs font-normal text-slate-400">km</span></span>
            </div>

            <div className="bg-[#050914]/80 border border-slate-800 p-3 rounded-2xl text-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Desnível</span>
              <span className="text-lg font-black text-emerald-400">+{race.elevation_gain_m} <span className="text-xs font-normal text-slate-400">m</span></span>
            </div>

            <div className="bg-[#050914]/80 border border-slate-800 p-3 rounded-2xl text-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Tempo Est.</span>
              <span className="text-lg font-black text-white">{hours}h{minutes.toString().padStart(2, '0')}</span>
            </div>
          </div>
        </div>

        {/* Notas Táticas do Treinador */}
        {race.coach_notes && (
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-3xl p-5 space-y-2">
            <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider">
              <MessageSquare className="w-4 h-4" /> Notas Táticas do Treinador
            </div>
            <p className="text-xs text-amber-200/90 leading-relaxed font-medium whitespace-pre-line">
              {race.coach_notes}
            </p>
          </div>
        )}

        {/* Perfil Altimétrico (se disponível GPX) */}
        {race.gpx_data && race.gpx_data.length > 0 && (
          <div className="bg-[#0a1122]/90 border border-slate-800/80 rounded-3xl p-5 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-200 uppercase tracking-wider">
              <Mountain className="w-4 h-4 text-emerald-400" /> Perfil de Altimetria
            </div>
            <ElevationProfile points={race.gpx_data} />
          </div>
        )}

        {/* Tabela de PACs e Nutrição */}
        <div className="bg-[#0a1122]/90 border border-slate-800/80 rounded-3xl p-5 space-y-4 shadow-xl">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-200 uppercase tracking-wider">
              <Flag className="w-4 h-4 text-emerald-400" /> Pontos de Abastecimento ({checkpoints.length})
            </div>
            <span className="text-[10px] text-slate-400 font-mono">Pace: {estimatedPaceMinPerKm.toFixed(1)} m/km</span>
          </div>

          {checkpoints.length > 0 ? (
            <div className="space-y-3">
              {checkpoints.map((cp, index) => {
                const estTimeMin = cp.km * estimatedPaceMinPerKm;
                const h = Math.floor(estTimeMin / 60);
                const m = Math.round(estTimeMin % 60);
                const timeFormatted = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;

                return (
                  <div 
                    key={cp.id || index}
                    className="bg-[#050914] border border-slate-800/90 rounded-2xl p-4 space-y-3 hover:border-slate-700 transition-all"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md font-mono">
                          KM {cp.km}
                        </span>
                        <h3 className="font-bold text-white text-sm mt-1">{cp.name}</h3>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-mono font-bold text-slate-300 flex items-center gap-1 justify-end">
                          <Clock className="w-3 h-3 text-slate-500" /> {timeFormatted}
                        </span>
                        <span className="text-[10px] text-slate-500">passagem est.</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/60 text-xs">
                      <div className="flex items-center gap-2 bg-[#0a1122] p-2 rounded-xl border border-slate-800/50">
                        <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <div>
                          <span className="text-[9px] text-slate-400 block uppercase font-bold">Hidratos</span>
                          <span className="font-bold text-white font-mono">{cp.carbs_g}g</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 bg-[#0a1122] p-2 rounded-xl border border-slate-800/50">
                        <Droplet className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                        <div>
                          <span className="text-[9px] text-slate-400 block uppercase font-bold">Líquidos</span>
                          <span className="font-bold text-white font-mono">
                            {cp.flasks_count || 2}x {cp.flask_vol_ml || 500}ml
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-slate-500 italic text-center py-6">
              Nenhum PAC cadastrado para esta prova.
            </p>
          )}
        </div>

      </div>
    </div>
  );
}
