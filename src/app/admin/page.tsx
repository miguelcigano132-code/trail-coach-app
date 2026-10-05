'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { 
  FileUp, 
  SlidersHorizontal, 
  CheckCircle2, 
  Mountain, 
  UserCheck,
  PlusCircle,
  Upload,
  Activity,
  Flag
} from 'lucide-react';
import ElevationProfile from '@/components/ElevationProfile';

interface GpxPoint {
  lat: number;
  lon: number;
  ele: number;
  dist: number;
}

interface AutoCheckpoint {
  name: string;
  km: number;
  carbs_g: number;
  water_ml: number;
}

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<'create' | 'customize'>('create');
  const [mode, setMode] = useState<'manual' | 'trainingpeaks'>('trainingpeaks');
  
  // Dados do Supabase
  const [races, setRaces] = useState<any[]>([]);
  const [athletes, setAthletes] = useState<any[]>([]);
  
  // Campos da Aba 1 (Criar Prova & GPX)
  const [newRaceTitle, setNewRaceTitle] = useState('');
  const [newRaceDistance, setNewRaceDistance] = useState('');
  const [newRaceElevation, setNewRaceElevation] = useState('');
  const [gpxFileName, setGpxFileName] = useState('');
  const [gpxData, setGpxData] = useState<GpxPoint[]>([]);
  const [checkpoints, setCheckpoints] = useState<AutoCheckpoint[]>([]);

  // Campos da Aba 2 (Personalizar Atleta)
  const [selectedRaceId, setSelectedRaceId] = useState<string>('');
  const [selectedAthleteId, setSelectedAthleteId] = useState<string>('');
  const [tpFileName, setTpFileName] = useState<string>('');
  const [coachNotes, setCoachNotes] = useState<string>('');
  
  // Feedback
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  async function fetchInitialData() {
    try {
      const { data: racesData } = await supabase
        .from('races')
        .select('*')
        .order('created_at', { ascending: false });

      if (racesData && racesData.length > 0) {
        setRaces(racesData);
        setSelectedRaceId(racesData[0].id);
      }

      const { data: athletesData } = await supabase.from('profiles').select('*');
      if (athletesData && athletesData.length > 0) {
        setAthletes(athletesData);
        setSelectedAthleteId(athletesData[0].id);
      }
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
    }
  }

  // Função para calcular distância entre coordenadas (Fórmula Haversine)
  const calcDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Raio da Terra em km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Leitura e Parsing do Ficheiro GPX
  const handleGpxUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setGpxFileName(file.name);

    try {
      const text = await file.text();
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(text, 'text/xml');
      const trkpts = Array.from(xmlDoc.querySelectorAll('trkpt'));

      if (trkpts.length === 0) {
        alert('Ficheiro GPX inválido ou sem pontos de trajeto.');
        return;
      }

      let totalDist = 0;
      let totalElevationGain = 0;
      const parsedPoints: GpxPoint[] = [];

      trkpts.forEach((pt, index) => {
        const lat = parseFloat(pt.getAttribute('lat') || '0');
        const lon = parseFloat(pt.getAttribute('lon') || '0');
        const eleNode = pt.querySelector('ele');
        const ele = eleNode ? parseFloat(eleNode.textContent || '0') : 0;

        if (index > 0) {
          const prev = parsedPoints[index - 1];
          const distIncrement = calcDistance(prev.lat, prev.lon, lat, lon);
          totalDist += distIncrement;

          const eleDiff = ele - prev.ele;
          if (eleDiff > 0) {
            totalElevationGain += eleDiff;
          }
        }

        parsedPoints.push({
          lat,
          lon,
          ele: Math.round(ele),
          dist: Number(totalDist.toFixed(2))
        });
      });

      // Atualizar Estados Automaticamente
      const finalDistKm = Number(totalDist.toFixed(1));
      const finalElevationM = Math.round(totalElevationGain);

      setGpxData(parsedPoints);
      setNewRaceDistance(finalDistKm.toString());
      setNewRaceElevation(finalElevationM.toString());

      if (!newRaceTitle) {
        const titleFromFilename = file.name.replace(/\.gpx$/i, '').replace(/_/g, ' ');
        setNewRaceTitle(titleFromFilename);
      }

      // Gerar Postos de Abastecimento Automáticos (a cada ~10km)
      const generatedCheckpoints: AutoCheckpoint[] = [];
      const interval = 10;
      for (let km = interval; km < finalDistKm; km += interval) {
        generatedCheckpoints.push({
          name: `PAC ${generatedCheckpoints.length + 1} (${km}K)`,
          km,
          carbs_g: 60,
          water_ml: 500
        });
      }
      setCheckpoints(generatedCheckpoints);

    } catch (err) {
      console.error('Erro ao processar ficheiro GPX:', err);
      alert('Erro ao ler o ficheiro GPX. Verifica o formato do ficheiro.');
    }
  };

  // Upload de ficheiros TrainingPeaks / GZ
  const handleTpFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = event.target.files?.[0];
    if (!uploadedFile) return;

    setTpFileName(uploadedFile.name);

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
      console.log('Ficheiro TP lido com sucesso:', fileText.substring(0, 100));
    } catch (err) {
      console.error('Erro ao ler ficheiro TP:', err);
      alert('Não foi possível ler o ficheiro TP.');
    }
  };

  // Guardar Nova Prova
  const handleCreateRace = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Inserir a prova
      const { data: insertedRace, error: raceError } = await supabase
        .from('races')
        .insert([{ 
          title: newRaceTitle, 
          distance_km: Number(newRaceDistance),
          elevation_gain_m: Number(newRaceElevation),
          gpx_data: gpxData
        }])
        .select()
        .single();

      if (raceError) throw raceError;

      // 2. Inserir os postos de abastecimento se existirem
      if (checkpoints.length > 0 && insertedRace) {
        const cpDataToInsert = checkpoints.map(cp => ({
          race_id: insertedRace.id,
          name: cp.name,
          km: cp.km,
          carbs_g: cp.carbs_g,
          water_ml: cp.water_ml
        }));

        const { error: cpError } = await supabase.from('checkpoints').insert(cpDataToInsert);
        if (cpError) console.error('Erro ao gravar abastecimentos:', cpError);
      }

      showNotification('Prova e mapa GPX criados com sucesso!');
      setNewRaceTitle('');
      setNewRaceDistance('');
      setNewRaceElevation('');
      setGpxFileName('');
      setGpxData([]);
      setCheckpoints([]);
      fetchInitialData();
    } catch (err: any) {
      alert('Erro ao criar prova: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Guardar Plano do Atleta
  const handleSavePlan = async () => {
    setLoading(true);

    try {
      const { error } = await supabase
        .from('races')
        .update({
          athlete_id: selectedAthleteId,
          coach_notes: coachNotes
        })
        .eq('id', selectedRaceId);

      if (error) throw error;

      showNotification('Plano guardado com sucesso!');
    } catch (err: any) {
      alert('Erro ao guardar: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(''), 4000);
  };

  return (
    <div className="min-h-screen bg-[#050914] text-slate-100 p-4 md:p-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Cabeçalho */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-800/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Mountain className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-black uppercase tracking-wide text-white">Painel do Treinador</h1>
              <p className="text-xs text-slate-400">Gestão de Provas (GPX) e Planos Individuais de Atletas</p>
            </div>
          </div>

          <div className="flex bg-[#0b1329] p-1 rounded-xl border border-slate-800 text-xs font-bold">
            <button
              type="button"
              onClick={() => setActiveTab('create')}
              className={`px-4 py-2 rounded-lg transition-all ${
                activeTab === 'create'
                  ? 'bg-emerald-500 text-slate-950 font-black shadow-lg shadow-emerald-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              1. Criar Prova & GPX
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('customize')}
              className={`px-4 py-2 rounded-lg transition-all ${
                activeTab === 'customize'
                  ? 'bg-emerald-500 text-slate-950 font-black shadow-lg shadow-emerald-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              2. Personalizar Atleta
            </button>
          </div>
        </div>

        {/* Notificação */}
        {successMessage && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-3 rounded-xl text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" /> {successMessage}
          </div>
        )}

        {/* ABA 1: CRIAR PROVA & GPX */}
        {activeTab === 'create' && (
          <div className="bg-[#0a1122]/90 border border-slate-800/80 rounded-3xl p-6 md:p-8 space-y-6 shadow-2xl">
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-200 flex items-center gap-2">
              <PlusCircle className="w-4 h-4 text-emerald-400" />
              Criar Nova Prova & Carregar Ficheiro GPX
            </h2>

            <form onSubmit={handleCreateRace} className="space-y-6">
              
              {/* Upload GPX */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Carregar Ficheiro GPX da Prova
                </label>
                <label className="border-2 border-dashed border-slate-800 hover:border-emerald-500/50 bg-[#050914] transition-all rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer text-center">
                  <input
                    type="file"
                    accept=".gpx"
                    onChange={handleGpxUpload}
                    className="hidden"
                  />
                  <Upload className="w-7 h-7 text-emerald-400 mb-2" />
                  <p className="text-xs font-bold text-slate-300">
                    {gpxFileName ? `Ficheiro GPX: ${gpxFileName}` : 'Clica para selecionar o ficheiro GPX'}
                  </p>
                </label>
              </div>

              {/* Formulário de Detalhes da Prova */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Nome da Prova
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Trail Sao Joao"
                    value={newRaceTitle}
                    onChange={(e) => setNewRaceTitle(e.target.value)}
                    className="w-full bg-[#050914] border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Distância Total (KM)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    placeholder="Ex: 32.1"
                    value={newRaceDistance}
                    onChange={(e) => setNewRaceDistance(e.target.value)}
                    className="w-full bg-[#050914] border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Desnível Acumulado (m D+)
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="Ex: 1800"
                    value={newRaceElevation}
                    onChange={(e) => setNewRaceElevation(e.target.value)}
                    className="w-full bg-[#050914] border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Preview da Altimetria */}
              {gpxData.length > 0 && (
                <div className="space-y-3 bg-[#050914] p-4 rounded-2xl border border-slate-800">
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider">
                    <Activity className="w-4 h-4" /> Pré-visualização do Perfil Altimétrico
                  </div>
                  <ElevationProfile points={gpxData} />
                </div>
              )}

              {/* Preview dos Abastecimentos Automáticos */}
              {checkpoints.length > 0 && (
                <div className="space-y-3 bg-[#050914] p-4 rounded-2xl border border-slate-800">
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider">
                    <Flag className="w-4 h-4" /> Postos de Abastecimento Detetados ({checkpoints.length})
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {checkpoints.map((cp, idx) => (
                      <div key={idx} className="bg-[#0a1122] border border-slate-800 p-3 rounded-xl flex justify-between items-center text-xs">
                        <span className="font-bold text-white">{cp.name}</span>
                        <span className="text-slate-400">{cp.carbs_g}g Carbs / {cp.water_ml}ml Água</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-4 rounded-2xl text-sm transition-all shadow-lg disabled:opacity-50 mt-4"
              >
                {loading ? 'A Guardar Prova...' : 'Criar Prova'}
              </button>
            </form>
          </div>
        )}

        {/* ABA 2: PERSONALIZAR ATLETA */}
        {activeTab === 'customize' && (
          <div className="bg-[#0a1122]/90 border border-slate-800/80 rounded-3xl p-6 md:p-8 space-y-6 shadow-2xl">
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-200 flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-emerald-400" />
              Selecionar Prova & Personalizar Métricas do Atleta
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                  1. Selecionar Prova Atribuição
                </label>
                <select
                  value={selectedRaceId}
                  onChange={(e) => setSelectedRaceId(e.target.value)}
                  className="w-full bg-[#050914] border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-500"
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
                  className="w-full bg-[#050914] border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-500"
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
              <div className="grid grid-cols-2 gap-3 p-1.5 bg-[#050914] rounded-2xl border border-slate-800">
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
                  onChange={handleTpFileUpload}
                  className="hidden"
                />
                <FileUp className="w-8 h-8 text-emerald-400 mb-2 group-hover:scale-110 transition-transform" />
                <p className="text-xs font-black uppercase tracking-wider text-emerald-400">
                  Carregar Ficheiro do TrainingPeaks (.CSV / .JSON / .FIT / .GZ)
                </p>
                <p className="text-[11px] text-slate-400 mt-2 font-mono">
                  {tpFileName ? `Ficheiro Carregado: ${tpFileName}` : 'Clica ou arrasta um ficheiro comprimido .gz aqui'}
                </p>
              </label>
            )}

            <div className="space-[#050914] space-y-2">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Notas Táticas Personalizadas do Treinador
              </label>
              <textarea
                value={coachNotes}
                onChange={(e) => setCoachNotes(e.target.value)}
                rows={4}
                placeholder="Instruções específicas sobre subidas, zonas de ritmo e nutrição para este atleta nesta prova..."
                className="w-full bg-[#050914] border border-slate-800 rounded-2xl p-4 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 resize-none"
              />
            </div>

            <button
              type="button"
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
