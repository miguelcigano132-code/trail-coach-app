'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { parseGPXString } from '@/lib/gpxParser';
import ElevationProfile, { GPXPoint } from '@/components/ElevationProfile';
import { Mountain, Plus, CheckCircle2, User, Save, Upload, FileText, Settings, Activity } from 'lucide-react';

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

  // Processar ficheiro GPX localmente assim que é selecionado
  const handleGpxFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setGpxFile(file);
    const text = await file.text();
    const { points, totalDistanceKm, elevationGainM } = parseGPXString(text);

    setGpxPoints(points);
    // Preenche automaticamente Distância e D+ extraídos do GPX
    if (totalDistanceKm > 0) setDistance(totalDistanceKm.toString());
    if (elevationGainM > 0) setElevation(elevationGainM.toString());
  };

  // Handler para Criar Prova
  const handleCreateRace = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingRace(true);
    setRaceSuccess(false);

    let gpxUrl = null;

    // Se houver ficheiro GPX, guarda no Supabase Storage
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
              onClick={() => setActiveStep('RACE')}
              className={`px-4 py-2 rounded-lg transition-all ${
                activeStep === 'RACE' ? 'bg-emerald-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white'
              }`}
            >
              1. Criar Prova & GPX
            </button>
            <button
              onClick={() => setActiveStep('ATHLETE')}
              className={`px-4 py-2 rounded-lg transition-all ${
                activeStep === 'ATHLETE' ? 'bg-emerald-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white'
              }`}
            >
              2. Personalizar Atleta
            </button>
          </div>
        </div>

        {/* --- PASSO 1: CRIAR PROVA & UPLOAD DE GPX --- */}
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

            {/* UPLOAD DO GPX */}
            <div className="border-2 border-dashed border-slate-800 bg-slate-950/50 rounded-2xl p-6 text-center hover:border-emerald-500/50 transition-colors">
              <Upload className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
              <label className="block text-xs font-bold text-slate-300 uppercase cursor-pointer">
                Carregar Ficheiro GPX da Prova
                <input
                  type="file"
                  accept=".gpx"
                  onChange={handleGpxFileChange}
                  className="hidden"
                />
              </label>
              <p className="text-[11px] text-slate-500 mt-1">
                {gpxFile ? `Ficheiro Selecionado: ${gpxFile.name}` : 'Carrega o ficheiro .gpx para calcular automaticamente altimetria, distância e D+'}
              </p>
            </div>

            {/* VISUALIZADOR DE ALTIMETRIA EM TEMPO REAL */}
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
                onChange={(e)
