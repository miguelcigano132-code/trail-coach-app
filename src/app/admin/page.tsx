'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Upload, Mountain, Plus, CheckCircle2 } from 'lucide-react';

export default function AdminPage() {
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [raceDate, setRaceDate] = useState('');
  const [distance, setDistance] = useState('');
  const [elevation, setElevation] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleCreateRace = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);

    const { error } = await supabase.from('races').insert([
      {
        title,
        location,
        race_date: raceDate,
        distance_km: parseFloat(distance),
        elevation_gain_m: parseInt(elevation),
        is_public: true,
      },
    ]);

    setLoading(false);
    if (!error) {
      setSuccess(true);
      setTitle('');
      setLocation('');
      setDistance('');
      setElevation('');
    } else {
      alert(`Erro ao criar prova: ${error.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-12">
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="flex items-center gap-3 border-b border-slate-800 pb-6">
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400">
            <Mountain className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-black uppercase text-white">Painel do Treinador</h1>
            <p className="text-xs text-slate-400">Adicionar novas provas e analisar ficheiros GPX</p>
          </div>
        </div>

        {success && (
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm rounded-xl flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5" /> Prova criada com sucesso no sistema!
          </div>
        )}

        <form onSubmit={handleCreateRace} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Plus className="w-5 h-5 text-emerald-400" /> Nova Prova de Trail
          </h2>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Nome da Prova</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Ultra Trail Peneda-Gerês"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-4 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Localização</label>
              <input
                type="text"
                required
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Ex: Gerês, Portugal"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-4 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Data da Prova</label>
              <input
                type="date"
                required
                value={raceDate}
                onChange={(e) => setRaceDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-4 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Distância (KM)</label>
              <input
                type="number"
                step="0.1"
                required
                value={distance}
                onChange={(e) => setDistance(e.target.value)}
                placeholder="45.5"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-4 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Desnível Positivo (D+ em metros)</label>
              <input
                type="number"
                required
                value={elevation}
                onChange={(e) => setElevation(e.target.value)}
                placeholder="2800"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-4 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-3 rounded-xl transition-all disabled:opacity-50"
          >
            {loading ? 'A guardar...' : 'Guardar Prova'}
          </button>
        </form>
      </div>
    </div>
  );
}
