'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { 
  FileUp, 
  SlidersHorizontal, 
  CheckCircle2, 
  Mountain, 
  UserCheck 
} from 'lucide-react';

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<'create' | 'customize'>('customize');
  const [mode, setMode] = useState<'manual' | 'trainingpeaks'>('trainingpeaks');
  
  const [races, setRaces] = useState<any[]>([]);
  const [athletes, setAthletes] = useState<any[]>([]);
  
  const [selectedRaceId, setSelectedRaceId] = useState<string>('');
  const [selectedAthleteId, setSelectedAthleteId] = useState<string>('');
  
  const [fileName, setFileName] = useState<string>('');
  const [coachNotes, setCoachNotes] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  async function fetchInitialData() {
    const { data: racesData } = await supabase.from('races').select('*').order('created_at', { ascending: false });
    if (racesData) {
      setRaces(racesData);
      if (racesData.length > 0) setSelectedRaceId(racesData[0].id);
    }

    const { data: athletesData } = await supabase.from('profiles').select('*');
    if (athletesData) {
      setAthletes(athletesData);
      if (athletesData.length > 0) setSelectedAthleteId(athletesData[0].id);
    }
  }

  // Leitura de ficheiros comprimidos (.gz) via API nativa do browser (sem dependências)
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = event.target.files?.[0];
    if (!uploadedFile) return;

    setFileName(uploadedFile.name);

    try {
      let fileText = '';

      if (uploadedFile.name.endsWith('.gz')) {
        const ds = new DecompressionStream('gzip');
        const decompressedStream = uploadedFile.stream().pipeThrough(ds);
        const response = new Response(decompressedStream);
        fileText = await response.text();
      } else {
        fileText = await uploadedFile.text();
      }

      console.log('Ficheiro lido com sucesso:', fileText.substring(0, 100));
    } catch (err) {
      console.error('Erro ao ler ficheiro:', err);
      alert('Erro ao ler o ficheiro. Confirma se o ficheiro não está corrompido.');
    }
  };

  const handleSavePlan = async () => {
    setLoading(true);
    setSuccessMessage(false);

    try {
      const { error } = await supabase
        .from('races')
        .update({
          athlete_id: selectedAthleteId,
          coach_notes: coachNotes
        })
        .eq('id', selectedRaceId);

      if (error) throw error;

      setSuccessMessage(true);
      setTimeout(() => setSuccessMessage(false), 4000);
    } catch (err: any) {
      alert('Erro ao guardar: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Topo do Painel */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <Mountain className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-black uppercase tracking-wide text-white">Painel do Treinador</h1>
              <p className="text-xs text-slate-400">Gestão de Provas (GPX) e Planos Individuais de Atletas</p>
            </div>
          </div>

          <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs font-bold">
            <button
              onClick={() => setActiveTab('create')}
              className={`px-4 py-2 rounded-lg transition-all ${
                activeTab === 'create'
                  ? 'bg-emerald-500 text-slate-950 font-black shadow-lg'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              1. Criar Prova & GPX
            </button>
            <button
              onClick={() => setActiveTab('customize')}
              className={`px-4 py-2 rounded-lg transition-all ${
                activeTab === 'customize'
                  ? 'bg-emerald-500 text-slate-950 font-black shadow-lg'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              2. Personalizar Atleta
            </button>
          </div>
        </div>

        {activeTab === 'customize' && (
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 md:p-8 space-y-6 relative shadow-2xl">
            
            <div className="flex justify-between items-center">
              <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-200 flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-emerald-400" />
                Selecionar Prova & Personalizar Métricas do Atleta
              </h2>
              {successMessage && (
                <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" /> Plano guardado com sucesso!
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                  1. Selecionar Prova Atribuição
                </label>
                <select
                  value={selectedRaceId}
                  onChange={(e) => setSelectedRaceId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-500"
                >
                  {races.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.title} ({r.distance_km}K)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                  2. Selecionar Atleta
                </label>
                <select
                  value={selectedAthleteId}
                  onChange={(e) => setSelectedAthleteId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-500"
                >
                  {athletes.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.email || a.full_name || 'Atleta'}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-3">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Modo de Configuração de Métricas
              </label>
              <div className="grid grid-cols-2 gap-3 p-1.5 bg-slate-950 rounded-2xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setMode('manual')}
                  className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    mode === 'manual'
                      ? 'bg-slate-800 text-emerald-400 border border-slate-700'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <SlidersHorizontal className="w-4 h-4" /> Entrada Manual de Valores
                </button>

                <button
                  type="button"
                  onClick={() => setMode('trainingpeaks')}
                  className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    mode === 'trainingpeaks'
                      ? 'bg-slate-800 text-emerald-400 border border-emerald-500/40'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <FileUp className="w-4 h-4" /> Importar Ficheiro TrainingPeaks
                </button>
              </div>
            </div>

            {mode === 'trainingpeaks' && (
              <label className="border-2 border-dashed border-emerald-500/30 hover:border-emerald-500/60 bg-emerald-500/5 hover:bg-emerald-500/10 transition-all rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer text-center group">
                <input
                  type="file"
                  accept=".csv,.json,.fit,.gz"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <FileUp className="w-8 h-8 text-emerald-400 mb-2 group-hover:scale-110 transition-transform" />
                <p className="text-xs font-black uppercase tracking-wider text-emerald-400">
                  Carregar Ficheiro do TrainingPeaks (.CSV / .JSON / .FIT / .GZ)
                </p>
                <p className="text-[11px] text-slate-400 mt-2 font-mono">
                  {fileName ? `Ficheiro Carregado: ${fileName}` : 'Clica ou arrasta um ficheiro comprimido .gz aqui'}
                </p>
              </label>
            )}

            <div className="space-y-2">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Notas Táticas Personalizadas do Treinador
              </label>
              <textarea
                value={coachNotes}
                onChange={(e) => setCoachNotes(e.target.value)}
                rows={4}
                placeholder="Instruções específicas sobre subidas, zonas de ritmo e nutrição para este atleta nesta prova..."
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 resize-none"
              />
            </div>

            <button
              onClick={handleSavePlan}
              disabled={loading}
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-4 rounded-2xl text-sm transition-all shadow-lg hover:shadow-emerald-500/20 disabled:opacity-50"
            >
              {loading ? 'A Guardar...' : 'Guardar Plano Individual do Atleta'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
