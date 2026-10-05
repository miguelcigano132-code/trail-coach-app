'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mountain, ShieldCheck, User } from 'lucide-react';

export default function HomePage() {
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function checkAuth() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        router.push('/dashboard');
      } else {
        setLoading(false);
      }
    }
    checkAuth();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050914] flex items-center justify-center text-slate-400 text-sm">
        A carregar...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050914] text-slate-100 flex flex-col justify-center items-center p-6 font-sans">
      <div className="max-w-md w-full bg-[#0a1122]/90 border border-slate-800 rounded-3xl p-8 shadow-2xl text-center space-y-6">
        
        <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto">
          <Mountain className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-black uppercase tracking-wide text-white">
            Trail Tactical Plan
          </h1>
          <p className="text-xs text-slate-400">
            Plataforma de estratégia, altimetria e plano nutricional para atletas e treinadores.
          </p>
        </div>

        <div className="space-y-3 pt-4">
          <Link
            href="/login"
            className="w-full flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-3.5 rounded-2xl text-xs transition-all shadow-lg shadow-emerald-500/20"
          >
            <User className="w-4 h-4" /> Entrar como Atleta
          </Link>

          <Link
            href="/admin"
            className="w-full flex items-center justify-center gap-2 bg-[#050914] hover:bg-slate-900 border border-slate-800 text-slate-300 font-bold py-3.5 rounded-2xl text-xs transition-all"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-400" /> Painel do Treinador
          </Link>
        </div>

      </div>
    </div>
  );
}
