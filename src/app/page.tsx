import { supabase } from '@/lib/supabaseClient';
import { Mountain, MapPin, Calendar, Activity, ShieldCheck, Coffee } from 'lucide-react';

export const revalidate = 0; // Garantir dados sempre atualizados

async function getRaceData() {
  const { data: races } = await supabase
    .from('races')
    .select('*, checkpoints(*)');
  return races || [];
}

export default async function HomePage() {
  const races = await getRaceData();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-12 font-sans">
      {/* Header da Equipa */}
      <header className="max-w-5xl mx-auto flex justify-between items-center border-b border-slate-800 pb-6 mb-10">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400">
            <Mountain className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-white uppercase">Trail Performance Team</h1>
            <p className="text-xs text-slate-400">Plano Tático & Estratégia de Nutrição</p>
          </div>
        </div>
        <span className="bg-emerald-500/20 text-emerald-400 text-xs px-3 py-1.5 rounded-full font-semibold border border-emerald-500/30">
          Época 2026
        </span>
      </header>

      {/* Conteúdo Principal */}
      <main className="max-w-5xl mx-auto space-y-12">
        {races.map((race) => (
          <section key={race.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 shadow-xl">
            {/* Detalhes da Prova */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
              <div>
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Próxima Prova</span>
                <h2 className="text-3xl font-extrabold text-white mt-1">{race.title}</h2>
                <div className="flex flex-wrap gap-4 mt-3 text-sm text-slate-400">
                  <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-emerald-400"/> {race.location}</span>
                  <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4 text-emerald-400"/> {race.race_date}</span>
                </div>
              </div>

              {/* Métrica de Distância e D+ */}
              <div className="flex gap-4 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
                <div className="text-center px-2">
                  <p className="text-xs text-slate-500 uppercase font-bold">Distância</p>
                  <p className="text-2xl font-black text-emerald-400">{race.distance_km} <span className="text-xs font-normal text-slate-400">km</span></p>
                </div>
                <div className="w-px bg-slate-800"></div>
                <div className="text-center px-2">
                  <p className="text-xs text-slate-500 uppercase font-bold">Desnível (D+)</p>
                  <p className="text-2xl font-black text-emerald-400">{race.elevation_gain_m} <span className="text-xs font-normal text-slate-400">m</span></p>
                </div>
              </div>
            </div>

            {/* Tabela de Abastecimentos (Checkpoints) */}
            <div className="mt-8">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5 text-emerald-400" /> 
                Postos de Abastecimento & Apoio Tático
              </h3>

              <div className="grid gap-3 md:grid-cols-2">
                {race.checkpoints?.map((cp: any) => (
                  <div key={cp.id} className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-4 flex flex-col justify-between">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-xs font-mono font-bold text-emerald-400">KM {cp.km_mark} ({cp.elevation_m}m D+)</span>
                        <h4 className="font-bold text-slate-200 text-base">{cp.name}</h4>
                      </div>
                      {cp.has_coach_support && (
                        <span className="bg-amber-500/20 text-amber-400 text-[10px] uppercase font-bold px-2 py-0.5 rounded border border-amber-500/30">
                          Apoio Treinador
                        </span>
                      )}
                    </div>

                    <div className="mt-3 pt-3 border-t border-slate-800/50 flex items-center justify-between text-xs text-slate-400">
                      <span className="flex items-center gap-1"><Coffee className="w-3.5 h-3.5 text-slate-500"/> {cp.supply_types?.join(' • ')}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        ))}
      </main>
    </div>
  );
}
