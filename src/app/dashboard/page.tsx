'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import { User, LogOut, ShieldAlert, Utensils, Mountain, CheckCircle, Share2, MapPin, Flag, Droplet, Flame, Activity } from 'lucide-react';
import ElevationProfile from '@/components/ElevationProfile';

type TabType = 'D-3' | 'D-2' | 'D-1' | 'RACE_DAY';

interface Meal {
  time: string;
  desc: string;
}

interface NutritionPlan {
  title: string;
  targetCarbs: string;
  water: string;
  focus: string;
  meals: Meal[];
}

const NUTRITION_SCHEDULE: Record<TabType, NutritionPlan> = {
  'D-3': {
    title: 'Início da Carga de Hidratos',
    targetCarbs: '6-8 g/kg',
    water: '2.5 L',
    focus: 'Aumentar consumo de arroz, massa, batata e aveia. Reduzir gorduras e fibras.',
    meals: [
      { time: 'Pequeno-almoço', desc: 'Papa de aveia com banana e mel + Sumo de laranja' },
      { time: 'Almoço', desc: 'Peito de frango com arroz branco abundante' },
      { time: 'Lanche', desc: 'Panquecas de aveia com compota ou mel' },
      { time: 'Jantar', desc: 'Massa com atum ao natural e molho de tomate ligeiro' }
    ]
  },
  'D-2': {
    title: 'Saturação de Glicogénio',
    targetCarbs: '8-10 g/kg',
    water: '3.0 L + Eletrólitos',
    focus: 'Dia de carga máxima. Hidratação constante com eletrólitos.',
    meals: [
      { time: 'Pequeno-almoço', desc: 'Pão branco com compota + 1 banana + Bebida vegetal' },
      { time: 'Almoço', desc: 'Batata doce cozida com filete de peixe branco' },
      { time: 'Lanche', desc: 'Batido de banana, leite de arroz e maltodextrina' },
      { time: 'Jantar', desc: 'Arroz branco com peito de perú e azeite' }
    ]
  },
  'D-1': {
    title: 'Repouso Digestivo & Descanso',
    targetCarbs: '8 g/kg',
    water: '2.5 L',
    focus: 'Comer refeições simples e de fácil absorção. Jantar cedo (máximo 19h30).',
    meals: [
      { time: 'Pequeno-almoço', desc: 'Pão de forma com mel + Sumo de maçã' },
      { time: 'Almoço', desc: 'Arroz de frango simples (pouca gordura)' },
      { time: 'Lanche', desc: 'Bolachas Maria ou gaufrettes com geleia' },
      { time: 'Jantar (Cedo)', desc: 'Massa pevide ou arroz branco com ovo cozido' }
    ]
  },
  'RACE_DAY': {
    title: 'Estratégia do Dia da Prova',
    targetCarbs: '75g / hora',
    water: '600 ml / hora',
    focus: 'Pequeno-almoço 3h antes da partida. Ingerir gel/sólido a cada 30-40 minutos.',
    meals: [
      { time: 'Pré-Prova (-3h)', desc: 'Pão branco com marmelada + Banana madura + Café' },
      { time: 'Pré-Partida (-15m)', desc: '1 Gel de pré-partida + 200ml de água' },
      { time: 'Em Prova', desc: 'Alternar entre géis de 30g de carbs e barras moles nos PACs' },
      { time: 'Pós-Prova', desc: 'Batido de proteína + hidratos nas primeiras 30 min' }
    ]
  }
};

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<TabType>('D-1');
  const [race, setRace] = useState<any>(null);
  const [checkpoints, setCheckpoints] = useState<any[]>([]);
  const router = useRouter();

  useEffect(() => {
    async function fetchData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
      setUser(user);

      // Busca a prova incluindo explicitamente a coluna gpx_data
      // COMO DEVE FICAR:
    const { data: raceData } = await supabase
    .from('races')
    .select('id, title, location, distance_km, elevation_gain_m, race_date, gpx_data, target_carbs, target_hydration, target_pace, created_at')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

      if (raceData) {
        setRace(raceData);

        const { data: cpData } = await supabase
          .from('checkpoints')
          .select('*')
          .eq('race_id', raceData.id)
          .order('km', { ascending: true });

        if (cpData && cpData.length > 0) {
          setCheckpoints(cpData);
        } else {
          const defaultDistance = raceData.distance_km || 45;
          setCheckpoints([
            { name: 'PAC 1 - Inicio Subida', km: (defaultDistance * 0.25).toFixed(1), carbs_g: 40, water_ml: 500 },
            { name: 'PAC 2 - Merujal (Dropbag)', km: (defaultDistance * 0.55).toFixed(1), carbs_g: 75, water_ml: 750 },
            { name: 'PAC 3 - Final Cume', km: (defaultDistance * 0.80).toFixed(1), carbs_g: 50, water_ml: 500 }
          ]);
        }
      }
      setLoading(false);
    }

    fetchData();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `Plano Tático - ${race?.title || 'Trail Running'}`,
        text: 'Estratégia de nutrição e abastecimentos para a minha próxima prova!',
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Link do teu plano tático copiado para a área de transferência!');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 text-sm">
        A carregar estratégia da prova...
      </div>
    );
  }

  const currentPlan = NUTRITION_SCHEDULE[activeTab];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-10 font-sans">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Cabeçalho */}
        <div className="flex justify-between items-center border-b border-slate-800 pb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-bold">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Plano Tático Individual</h1>
              <p className="text-xs text-slate-400">{user?.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-3.5 py-2 rounded-xl text-xs font-extrabold transition-colors"
            >
              <Share2 className="w-4 h-4" /> Partilhar
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-300 transition-colors"
            >
              <LogOut className="w-4 h-4 text-slate-400" /> Sair
            </button>
          </div>
        </div>

        {/* Cartão Principal da Prova */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/40 border border-slate-800 p-6 md:p-8 shadow-2xl">
          <div className="absolute -right-10 -bottom-10 opacity-5 text-emerald-400 pointer-events-none">
            <Mountain size={280} />
          </div>

          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border-2 border-emerald-500/50 flex items-center justify-center text-emerald-400 font-black text-2xl">
                TP
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/20">
                  {race ? race.location || 'Prova Ativa' : 'Sem Prova Registada'}
                </span>
                <h2 className="text-2xl font-black text-white mt-1">
                  {race ? `${race.title} (${race.distance_km}K)` : 'Carregando Prova...'}
                </h2>
                <p className="text-xs text-slate-400">
                  Desnível: {race?.elevation_gain_m || 0}m D+ • Data: {race?.race_date || 'A definir'}
                </p>
              </div>
            </div>

            {/* COMO DEVE FICAR (Lê os dados da prova do Supabase): */}
<div className="flex gap-3 w-full md:w-auto">
  <div className="flex-1 md:flex-initial bg-slate-950/80 border border-slate-800 p-3 rounded-2xl text-center min-w-[90px]">
    <p className="text-[10px] font-bold text-slate-500 uppercase">Carbs/Hora</p>
    <p className="text-lg font-black text-emerald-400">
      {race?.target_carbs || '75g'}
    </p>
  </div>

  <div className="flex-1 md:flex-initial bg-slate-950/80 border border-slate-800 p-3 rounded-2xl text-center min-w-[90px]">
    <p className="text-[10px] font-bold text-slate-500 uppercase">Hidratação</p>
    <p className="text-lg font-black text-blue-400">
      {race?.target_hydration || '600ml'}
    </p>
  </div>

  {race?.target_pace && (
    <div className="flex-1 md:flex-initial bg-slate-950/80 border border-slate-800 p-3 rounded-2xl text-center min-w-[90px]">
      <p className="text-[10px] font-bold text-slate-500 uppercase">Ritmo Alvo</p>
      <p className="text-lg font-black text-amber-400">{race.target_pace}</p>
    </div>
  )}
</div>
            </div>
          </div>
        </div>

        {/* --- GRÁFICO DE ALTIMETRIA DA PROVA DO ATLETA --- */}
        {race?.gpx_data && race.gpx_data.length > 0 && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-4">
              <Activity className="w-5 h-5 text-emerald-400" />
              <h2 className="text-lg font-bold text-white uppercase tracking-wider">Perfil Altimétrico da Prova</h2>
            </div>
            <ElevationProfile points={race.gpx_data} />
          </div>
        )}

        {/* Postos de Abastecimento */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-4">
            <Flag className="w-5 h-5 text-emerald-400" />
            <h2 className="text-lg font-bold text-white">Postos de Abastecimento & Plano de Ação em Prova</h2>
          </div>

          <div className="grid gap-4">
            {checkpoints.map((cp, idx) => (
              <div key={idx} className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center font-bold text-xs text-emerald-400">
                    {idx + 1}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">{cp.name}</p>
                    <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3 text-emerald-400" /> Quilómetro {cp.km} km
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs">
                  <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-xl text-emerald-400">
                    <Flame className="w-3.5 h-3.5" />
                    <span>Recarregar: <strong>{cp.carbs_g || 60}g Carbs</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-blue-500/10 border border-blue-500/20 px-3 py-1.5 rounded-xl text-blue-400">
                    <Droplet className="w-3.5 h-3.5" />
                    <span>Bidões: <strong>{cp.water_ml || 500}ml</strong></span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Plano de Nutrição Pré-Prova */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div className="flex items-center gap-2">
              <Utensils className="w-5 h-5 text-emerald-400" />
              <h2 className="text-lg font-bold text-white">Plano de Nutrição Pré-Prova</h2>
            </div>

            <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-bold">
              {(['D-3', 'D-2', 'D-1', 'RACE_DAY'] as TabType[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    activeTab === tab
                      ? 'bg-emerald-500 text-slate-950 font-black shadow-lg'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {tab === 'RACE_DAY' ? 'Prova' : tab}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-950/60 border border-slate-800/80 p-4 rounded-2xl">
              <span className="text-[10px] font-bold uppercase text-slate-500">Objetivo do Dia</span>
              <p className="text-sm font-extrabold text-white mt-0.5">{currentPlan.title}</p>
            </div>
            <div className="bg-slate-950/60 border border-slate-800/80 p-4 rounded-2xl">
              <span className="text-[10px] font-bold uppercase text-slate-500">Alvo de Hidratos</span>
              <p className="text-sm font-extrabold text-emerald-400 mt-0.5">{currentPlan.targetCarbs}</p>
            </div>
            <div className="bg-slate-950/60 border border-slate-800/80 p-4 rounded-2xl">
              <span className="text-[10px] font-bold uppercase text-slate-500">Líquidos</span>
              <p className="text-sm font-extrabold text-blue-400 mt-0.5">{currentPlan.water}</p>
            </div>
          </div>

          <p className="text-xs text-slate-300 bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-xl">
            💡 <strong>Foco Tático:</strong> {currentPlan.focus}
          </p>

          <div className="space-y-3 pt-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Refeições Recomendadas</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              {currentPlan.meals.map((meal, index) => (
                <div key={index} className="bg-slate-950/80 border border-slate-800 p-4 rounded-2xl flex items-start gap-3">
                  <CheckCircle className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-emerald-400">{meal.time}</p>
                    <p className="text-xs text-slate-200 mt-1">{meal.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Notas Táticas do Treinador */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
          <h2 className="text-base font-bold text-white mb-2 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-amber-400" />
            Notas Táticas do Treinador
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            Atenção à primeira subida aos 10km. Mantém o ritmo controlado e não forces a Frequência Cardíaca acima da Z3. No PAC 2 terás o teu dropbag pronto com eletrólitos e reforço de géis.
          </p>
        </div>

      </div>
    </div>
  );
}
