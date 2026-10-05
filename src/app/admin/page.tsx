'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { parseGPXString, readCompressedOrTextFile } from '@/lib/gpxParser';
import ElevationProfile, { GPXPoint } from '@/components/ElevationProfile';
import { Mountain, Plus, CheckCircle2, User, Upload, FileText, Settings, Activity } from 'lucide-react';

export default function AdminPage() {
  // Estado de Navegação/Aba do Admin
  const [activeStep, setActiveStep] = useState<'RACE' | 'ATHLETE'>('RACE');

  // Estados para Criar Prova + GPX
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [raceDate, setRaceDate] = useState('');
  const [distance, setDistance] = useState('');
  const [elevation, setElevation] = useState('');
  const [gpxFile, setGpxFile] = useState<File | null>(null);
  const [gpxPoints, setGpxPoints] = useState<GPXPoint[]>([]);
  const [loadingRace, setLoadingRace] = useState(false);
  const [raceSuccess, setRaceSuccess] = useState(false);

  // Estados para Atribuir a Atleta
  const [races, setRaces] = useState<any[]>([]);
  const [selectedRace, setSelectedRace] = useState<string>('');
  const [profiles, setProfiles] = useState<any[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<string>('');
  
  // MODO DE DADOS DO ATLETA (TrainingPeaks vs Manual)
  const [inputMode, setInputMode] = useState<'MANUAL' | 'TRAININGPEAKS'>('MANUAL');
  const [carbsPerHour, setCarbsPerHour] = useState('75');
  const [waterPerHour, setWaterPerHour] = useState('600');
  const [targetPace, setTargetPace] = useState('7:30');
  const [tpFile, setTpFile] = useState<File | null>(null);
  const [coachNotes, setCoachNotes] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);

  useEffect(() => {
    async function loadData() {
      // Carregar Atletas
      const { data: profData } = await supabase.from('profiles').select('*');
      if (profData && profData.length > 0) {
        setProfiles(profData);
        setSelectedProfile(profData[0].id);
      }

      // Carregar Provas Criadas
      const { data: raceData } = await supabase.from('races').select('*').order('created_at', { ascending: false });
      if (raceData && raceData.length > 0) {
        setRaces(raceData);
        setSelectedRace(raceData[0].id);
      }
    }
    loadData();
  }, []);

  // Processar ficheiro GPX/GZ localmente
  const handleGpxFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setGpxFile(file);
    try {
      const text = await readCompressedOrTextFile(file);
      const { points, totalDistanceKm, elevationGainM } = parseGPXString(text);

      setGpxPoints(points);
      if (totalDistanceKm > 0) setDistance(totalDistanceKm.toString());
      if (elevationGainM > 0) setElevation(elevationGainM.toString());
    } catch (err) {
      alert('Erro ao processar o ficheiro GPX/.GZ selecionado.');
    }
  };

  // Handler para Criar Prova
  const handleCreateRace = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingRace(true);
    setRaceSuccess(false);

    let gpxUrl = null;

    if (gpxFile) {
      const fileExt = gpxFile.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const { data: storageData, error: storageErr } = await supabase.storage
        .from('avatars')
        .upload(`gpx/${fileName}`, gpxFile);

      if (!storageErr && storageData) {
        gpxUrl = storageData.path;
      }
    }

    const { data: newRace, error } = await supabase.from('races').insert([
      {
        title,
        location,
        race_date: raceDate,
        distance_km: parseFloat(distance),
        elevation_gain_m: parseInt(elevation),
        gpx_url: gpxUrl,
        is_public: true,
      },
    ]).select().single();

    setLoadingRace(false);
    if (!error) {
      setRaceSuccess(true);
      setTitle('');
      setLocation('');
      setDistance('');
      setElevation('');
      setGpxFile(null);
      setGpxPoints([]);
      if (newRace) {
        setRaces([newRace, ...races]);
        setSelectedRace(newRace.id);
      }
    } else {
      alert(`Erro ao criar prova: ${error.message}`);
    }
  };

  // Handler para Guardar Atribuição do Atleta
  const handleSaveAthletePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProfile) {
      alert('Por favor seleciona um atleta.');
      return;
    }

    setSavingProfile(true);
    setProfileSuccess(false);

    try {
      let extractedData: Record<string, any> = {};

      if (inputMode === 'TRAININGPEAKS' && tpFile) {
        try {
          const fileContent = await readCompressedOrTextFile(tpFile);
          if (tpFile.name.endsWith('.json')) {
            const parsed = JSON.parse(fileContent);
            if (parsed.carbs) extractedData.carbs_target_g = parsed.carbs;
            if (parsed.water) extractedData.water_target_ml = parsed.water;
            if (parsed.pace) extractedData.target_pace = parsed.pace;
          }
        } catch (fErr) {
          console.warn('Ficheiro processado sem extração JSON direta:', fErr);
        }
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          carbs_target_g: parseInt(carbsPerHour) || 75,
          water_target_ml: parseInt(waterPerHour) || 600,
          target_pace: targetPace || '7:30',
          coach_notes: coachNotes,
          ...extractedData,
        })
        .eq('id', selectedProfile);

      if (error) throw error;

      setProfileSuccess(true);
    } catch (err: any) {
      alert(`Erro ao atualizar o plano do atleta: ${err.message || err}`);
    } finally {
      setSavingProfile(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-12 space-y-8">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400">
              <Mountain className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl font-black uppercase text-white">Painel do Treinador</h1>
              <p className="text-xs text-slate-400">Gestão de Provas (GPX) e Planos Individuais de Atletas</p>
            </div>
          </div>

          {/* Seletor de Passo */}
          <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs font-bold">
            <button
              type="button"
              onClick={() => setActiveStep('RACE')}
              className={`px-4 py-2 rounded-lg transition-all ${
                activeStep === 'RACE' ? 'bg-emerald-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white'
              }`}
            >
              1. Criar Prova & GPX
            </button>
            <button
              type="button"
              onClick={() => setActiveStep('ATHLETE')}
              className={`px-4 py-2 rounded-lg transition-all ${
                activeStep === 'ATHLETE' ? 'bg-emerald-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white'
              }`}
            >
              2. Personalizar Atleta
            </button>
          </div>
        </div>

        {/* --- PASSO 1: CRIAR PROVA & UPLOAD DE GPX/GZ --- */}
        {activeStep === 'RACE' && (
          <form onSubmit={handleCreateRace} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Plus className="w-5 h-5 text-emerald-400" /> Nova Prova de Trail + Percurso GPX
            </h2>

            {raceSuccess && (
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm rounded-xl flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5" /> Prova e GPX registados com sucesso! Podes agora personalizar os atletas no Passo 2.
              </div>
            )}

            {/* UPLOAD DO GPX / GZ */}
            <div className="border-2 border-dashed border-slate-800 bg-slate-950/50 rounded-2xl p-6 text-center hover:border-emerald-500/50 transition-colors">
              <Upload className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
              <label className="block text-xs font-bold text-slate-300 uppercase cursor-pointer">
                Carregar Ficheiro GPX / GZ da Prova
                <input
                  type="file"
                  accept=".gpx,.gz,.gpx.gz"
                  onChange={handleGpxFileChange}
                  className="hidden"
                />
              </label>
              <p className="text-[11px] text-slate-500 mt-1">
                {gpxFile ? `Ficheiro Selecionado: ${gpxFile.name}` : 'Suporta ficheiros .gpx e .gz (descompressão automática)'}
              </p>
            </div>

            {/* GRÁFICO DE ALTIMETRIA EM TEMPO REAL */}
            {gpxPoints.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase">
                  <Activity className="w-4 h-4" /> Altimetria Extraída do Ficheiro GPX
                </div>
                <ElevationProfile points={gpxPoints} />
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Nome da Prova</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Trail São João"
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
                  placeholder="Ex: Vila Nova de Gaia, Portugal"
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
                  placeholder="32"
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
                  placeholder="2100"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-4 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loadingRace}
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-3 rounded-xl transition-all disabled:opacity-50"
            >
              {loadingRace ? 'A guardar Prova e GPX...' : 'Guardar Prova & Avançar'}
            </button>
          </form>
        )}

        {/* --- PASSO 2: ATRIBUIR PROVA E PERSONALIZAR ATLETA --- */}
        {activeStep === 'ATHLETE' && (
          <form onSubmit={handleSaveAthletePlan} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <User className="w-5 h-5 text-emerald-400" /> Selecionar Prova & Personalizar Métricas do Atleta
              </h2>
              {profileSuccess && (
                <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" /> Plano guardado com sucesso!
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">1. Selecionar Prova Atribuição</label>
                <select
                  value={selectedRace}
                  onChange={(e) => setSelectedRace(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-4 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                >
                  {races.length > 0 ? (
                    races.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.title} ({r.distance_km}K)
                      </option>
                    ))
                  ) : (
                    <option value="">Cria uma prova no Passo 1 primeiro</option>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">2. Selecionar Atleta</label>
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
                    <option value="">Nenhum atleta encontrado na base de dados</option>
                  )}
                </select>
              </div>
            </div>

            {/* SELETOR DE MODO: TRAININGPEAKS vs MANUAL */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
              <label className="block text-xs font-bold text-slate-400 uppercase">Modo de Configuração de Métricas</label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setInputMode('MANUAL')}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border transition-all ${
                    inputMode === 'MANUAL'
                      ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400'
                      : 'border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <Settings className="w-4 h-4" /> Entrada Manual de Valores
                </button>
                <button
                  type="button"
                  onClick={() => setInputMode('TRAININGPEAKS')}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border transition-all ${
                    inputMode === 'TRAININGPEAKS'
                      ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400'
                      : 'border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <FileText className="w-4 h-4" /> Importar Ficheiro TrainingPeaks
                </button>
              </div>
            </div>

            {/* CAMPOS DEPENDENDO DO MODO SELECIONADO */}
            {inputMode === 'MANUAL' ? (
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
            ) : (
              <div className="border-2 border-dashed border-emerald-500/30 bg-emerald-500/5 rounded-2xl p-6 text-center space-y-2">
                <FileText className="w-8 h-8 text-emerald-400 mx-auto" />
                <label className="block text-xs font-bold text-emerald-400 uppercase cursor-pointer">
                  CARREGAR FICHEIRO DO TRAININGPEAKS (.CSV / .JSON / .FIT / .GZ)
                  <input
                    type="file"
                    accept=".csv,.json,.fit,.gz,.zip"
                    onChange={(e) => setTpFile(e.target.files?.[0] || null)}
                    className="hidden"
                  />
                </label>
                <p className="text-[11px] text-slate-400">
                  {tpFile ? `Ficheiro Carregado: ${tpFile.name}` : 'As métricas de VMA, Limiar e Carga serão extraídas automaticamente'}
                </p>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Notas Táticas Personalizadas do Treinador</label>
              <textarea
                rows={3}
                value={coachNotes}
                onChange={(e) => setCoachNotes(e.target.value)}
                placeholder="Instruções específicas sobre subidas, zonas de ritmo e nutrição para este atleta nesta prova..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-4 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <button
              type="submit"
              disabled={savingProfile || !selectedProfile}
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-3 rounded-xl transition-all disabled:opacity-50"
            >
              {savingProfile ? 'A Guardar Plano...' : 'Guardar Plano Individual do Atleta'}
            </button>
          </form>
        )}

      </div>
    </div>
  );
}
