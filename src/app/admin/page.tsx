'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Mountain, Plus, CheckCircle2, User, Save, RefreshCw } from 'lucide-react';

export default function AdminPage() {
  // Estados para Prova
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [raceDate, setRaceDate] = useState('');
  const [distance, setDistance] = useState('');
  const [elevation, setElevation] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Estados para Atletas
  const [profiles, setProfiles] = useState<any[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<string>('');
  const [carbsPerHour, setCarbsPerHour] = useState('75');
  const [waterPerHour, setWaterPerHour] = useState('600');
  const [targetPace, setTargetPace] = useState('7:30');
  const [coachNotes, setCoachNotes] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);

  useEffect(() => {
    async function loadProfiles() {
      const { data } = await supabase.from('profiles').select('*');
      if (data && data.length > 0) {
        setProfiles(data);
        setSelectedProfile(data[0].id);
      }
    }
    loadProfiles();
  }, []);

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

  const handleSaveAthletePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProfile) return;

    setSavingProfile(true);
    setProfileSuccess(false);

    const { error } = await supabase
      .from('profiles')
      .update({
        carbs_target_g: parseInt(carbsPerHour),
        water_target_ml: parseInt(waterPerHour),
        target_pace: targetPace,
        coach_notes: coachNotes,
      })
      .eq('id', selectedProfile);

    setSavingProfile(false);
    if (!error) {
      setProfileSuccess(true);
    } else {
      alert(`Erro ao atualizar atleta: ${error.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-12 space-y-10">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-slate-800 pb-6">
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400">
            <Mountain className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-black uppercase text-white">Painel do Treinador</h1>
            <p className="text-xs text-slate-400">Gerir Provas e Planos Individuais de Atletas</p>
          </div>
        </div>

        {/* --- SECÇÃO 1: GERIR PLANO INDIVIDUAL DO ATLETA --- */}
        <form onSubmit={handleSaveAthletePlan} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <User className="w-5 h-5 text-emerald-400" /> Personalizar Atleta
            </h2>
            {profileSuccess && (
              <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> Plano atualizado!
              </span>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Selecionar Atleta</label>
            <select
              value={selectedProfile}
              onChange={(e) => setSelectedProfile(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-4 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
            >
              {profiles.length > 0 ? (
                profiles.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.full_name || p.email || p.id}
                  </option>
                ))
              ) : (
                <option value="">Nenhum atleta registado na base de dados</option>
              )}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Meta Carbs (g/hora)</label>
              <input
                type="number"
                value={carbsPerHour}
                onChange={(e) => setCarbsPerHour(e.target.value)}
                placeholder="75"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-4 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Hidratação (ml/hora)</label>
              <input
                type="number"
                value={waterPerHour}
                onChange={(e) => setWaterPerHour(e.target.value)}
                placeholder="600"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-4 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Ritmo Alvo (min/km)</label>
              <input
                type="text"
                value={targetPace}
                onChange={(e) => setTargetPace(e.target.value)}
                placeholder="7:30"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-4 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Notas Táticas do Treinador</label>
            <textarea
              rows={3}
              value={coachNotes}
              onChange={(e) => setCoachNotes(e.target.value)}
              placeholder="Instruções específicas sobre subidas, zonas de ritmo, hidratação..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-4 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <button
            type="submit"
            disabled={savingProfile || !selectedProfile}
            className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-3 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4" /> {savingProfile ? 'A guardar...' : 'Guardar Plano do Atleta'}
          </button>
        </form>

        {/* --- SECÇÃO 2: CRIAR PROVA --- */}
        <form onSubmit={handleCreateRace} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Plus className="w-5 h-5 text-emerald-400" /> Criar Nova Prova de Trail
          </h2>

          {success && (
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm rounded-xl flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5" /> Prova criada com sucesso!
            </div>
          )}

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
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Desnível Positivo (D+ m)</label>
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
            className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-3 rounded-xl transition-all disabled:opacity-50"
          >
            {loading ? 'A guardar...' : 'Guardar Prova'}
          </button>
        </form>

      </div>
    </div>
  );
}
