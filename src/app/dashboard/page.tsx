'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import { User, LogOut, ShieldAlert, Award, Droplet, Flame, Utensils, Calendar, Share2, Mountain, CheckCircle } from 'lucide-react';

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'D-3' | 'D-2' | 'D-1' | 'RACE_DAY'>('D-1');
  const router = useRouter();

  useEffect(() => {
    async function getUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
      } else {
        setUser(user);
      }
      setLoading(false);
    }
    getUser();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  // Planos de Nutrição Pré-Prova
  const nutritionSchedule = {
    'D-3': {
      title: 'Início da Carga de Hidratos',
      targetCarbs: '6-8 g/kg',
      water: '2.5 L',
      focus: 'Aumentar consumo de arroz, massa, batata e aveia. Reduzir gorduras e fibras para facilitar a digestão.',
      meals: [
        { time: 'Pequeno-almoço', desc: 'Papa de aveia com banana e mel + Sumo de laranja' },
        { time: 'Almoço', desc: 'Peito de frango com arroz branco abundante e cozido' },
        { time: 'Lanche', desc: 'Panquecas de aveia com compota ou mel' },
        { time: 'Jantar', desc: 'Massa com atum ao natural e molho de tomate ligeiro' }
      ]
    },
    'D-2': {
      title: 'Saturação de Glicogénio',
      targetCarbs: '8-10 g/kg',
      water: '3.0 L + Eletrólitos',
      focus: 'Dia de carga máxima. Hidratação constante com eletrólitos. Evitar alimentos pesados ou novos.',
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
      focus: 'Pequeno-almoço 3h antes da partida. Ingerir gel/sólido a cada 30-40 minutos no percurso.',
      meals: [
        { time: 'Pré-Prova (-3h)', desc: 'Pão branco com marmelada + Banana madura + Café' },
        { time: 'Pré-Partida (-15m)', desc: '1 Gel de pré-partida + 200ml de água' },
        { time: 'Em Prova', desc: 'Alternar entre géis de 30g de carbs e barras moles nos PACs' },
        { time: 'Pós-Prova', desc: 'Batido de proteína + hidratos nas primeiras 30 min' }
      ]
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 text-sm">
        A carregar dados do atleta...
      </div>
    );
  }

  const currentPlan = nutritionSchedule[activeTab];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-10 font-sans">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Top bar */}
        <div className="flex justify-between items-center border-b border-slate-800 pb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-bold text-lg">
              <User className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Plano Tático Individual</h1>
              <p className="text-xs text-slate-400">{user?.email}</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 transition-colors"
          >
            <LogOut className="w-4 h-4 text-slate-400" /> Sair
          </button>
        </div>

        {/* --- CARTÃO VISUAL DO ATLETA (Estilo Redes Sociais) --- */}
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
                  Atleta Oficial
                </span>
                <h2 className="text-2xl font-black text-white mt-1">Trail Serra da Freita 45K</h2>
                <p className="text-xs text-slate-400">Meta: 05h 45m • Ritmo Alvo: 7:30 min/km</p>
              </div>
            </div>

            <div className="flex gap-3 w-full md:w-auto">
              <div className="flex-1 md:flex-initial bg-slate-950/80 border border-slate-800 p-3 rounded-2xl text-center min-w-[90px]">
                <p className="text-[10px] font-bold text-slate-500 uppercase">Carbs/Hora</p>
                <p className="text-lg font-black text-emerald-400">75g</p>
              </div>
              <div className="flex-1 md:flex-initial bg-slate-950/80 border border-slate-800 p-3 rounded-2xl text-center min-w-[90px]">
                <p className="text-[10px] font-bold text-slate-500 uppercase">Hidratação</p>
                <p className="text-lg font-black text-blue-400">600ml</p>
              </div>
            </div>
          </div>
        </div>

        {/* --- PLANO DE NUTRIÇÃO PRÉ-PROVA --- */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div className="flex items-center gap-2">
              <Utensils className="w-5 h-5 text-emerald-400" />
              <h2 className="text-lg font-bold text-white">Plano de Nutrição Pré-Prova</h2>
            </div>

            {/* Tabs para D-3, D-2, D-1 e Dia da Prova */}
            <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-bold">
              {(['D-3', 'D-2', 'D-1', 'RACE_DAY'] as const).map((tab) => (
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

          {/* Resumo do dia selecionado */}
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

          {/* Lista de Refeições */}
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

        {/* Recomendações do Treinador */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
          <h2 className="text-base font-bold text-white mb-2 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-amber-400" />
            Notas Táticas do Treinador
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            Atenção à primeira subida aos 10km (Mizarela). Mantém o ritmo controlado e não forces a Frequência Cardíaca acima da Z3. No PAC 2 (Merujal) terás o teu dropbag pronto com eletrólitos e reforço de géis.
          </p>
        </div>

      </div>
    </div>
  );
}
