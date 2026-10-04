'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import { User, LogOut, ShieldAlert, Award, Droplet, Flame } from 'lucide-react';

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 text-sm">
        A carregar dados do atleta...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-12">
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

        {/* Card Métricas do Atleta */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center gap-4">
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-xl">
              <Flame className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase font-bold">Meta Hidratos</p>
              <p className="text-xl font-black text-white">75g <span className="text-xs font-normal text-slate-400">/ hora</span></p>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center gap-4">
            <div className="p-3 bg-blue-500/10 border border-blue-500/30 text-blue-400 rounded-xl">
              <Droplet className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase font-bold">Hidratação</p>
              <p className="text-xl font-black text-white">600ml <span className="text-xs font-normal text-slate-400">/ hora</span></p>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center gap-4">
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-xl">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase font-bold">Tempo Alvo</p>
              <p className="text-xl font-black text-white">05h 45m</p>
            </div>
          </div>
        </div>

        {/* Recomendações do Treinador */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
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
