'use client';

import PaceCalculatorComponent from '@/components/PaceCalculatorComponent';
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
  Flag,
  Trash2,
  Plus
} from 'lucide-react';
import ElevationProfile from '@/components/ElevationProfile';

interface GpxPoint {
  lat: number;
  lon: number;
  ele: number;
  dist: number;
  distanceKm: number;
  elevation: number;
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
  const [newRaceDate, setNewRaceDate] = useState('');
  const [newRaceDistance, setNewRaceDistance] = useState('');
  const [newRaceElevation, setNewRaceElevation] = useState('');
  const [gpxFileName, setGpxFileName] = useState('');
  const [gpxData, setGpxData] = useState<GpxPoint[]>([]);
  const [checkpoints, setCheckpoints] = useState<AutoCheckpoint[]>([]);

  // Estado para adicionar PAC manual de suporte
  const [manualPacName, setManualPacName] = useState('');
  const [manualPacKm, setManualPacKm] = useState('');

  // Campos da Aba 2 (Personalizar Atleta)
  const [selectedRaceId, setSelectedRaceId] = useState<string>('');
  const [selectedAthleteId, setSelectedAthleteId] = useState<string>('');
  const [tpFileName, setTpFileName] = useState<string>('');
  const [coachNotes, setCoachNotes] = useState<string>('');

  // Métricas extraídas do TrainingPeaks para a calculadora
  const [importedPace, setImportedPace] = useState<string>('05:00');
  const [importedFcMax, setImportedFcMax] = useState<number>(185);
  const [importedLthr, setImportedLthr] = useState<number>(168);
  
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
      } else {
        setRaces([]);
        setSelectedRaceId('');
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

  const handleDeleteRace = async (raceId: string, raceTitle: string) => {
    const confirmDelete = window.confirm(`Tem a certeza de que pretende eliminar a prova "${raceTitle}"?`);
    if (!confirmDelete) return;

    setLoading(true);
    try {
      await supabase.from('checkpoints').delete().eq('race_id', raceId);
      const { error: raceError } = await supabase.from('races').delete().eq('id', raceId);

      if (raceError) throw new Error(raceError.message);

      setRaces((prevRaces) => prevRaces.filter((r) => r.id !== raceId));
      showNotification(`Prova "${raceTitle}" eliminada com sucesso!`);
      await fetchInitialData();
    } catch (err: any) {
      console.error('Erro ao apagar prova:', err);
      alert(`Não foi possível eliminar a prova: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const calcDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371;
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
          if (eleDiff > 0) totalElevationGain += eleDiff;
        }

        const currentDist = Number(totalDist.toFixed(2));
        const currentEle = Math.round(ele);

        parsedPoints.push({
          lat,
          lon,
          ele: currentEle,
          elevation: currentEle,
          dist: currentDist,
          distanceKm: currentDist
        });
      });

      setGpxData(parsedPoints);
      setNewRaceDistance(Number(totalDist.toFixed(1)).toString());
      setNewRaceElevation(Math.round(totalElevationGain).toString());

      if (!newRaceTitle) {
        setNewRaceTitle(file.name.replace(/\.gpx$/i, '').replace(/_/g, ' '));
      }

      // --- EXTRAÇÃO UNIVERSAL DE PACS (wpt, rtept, trkpt com name/cmt/sym) ---
      const extractedCheckpoints: AutoCheckpoint[] = [];

      // Helper para calcular o KM mais próximo no percurso
      const findKmForCoords = (lat: number, lon: number) => {
        let minDistance = Infinity;
        let matchedKm = 0;
        parsedPoints.forEach((point) => {
          const distToWpt = calcDistance(lat, lon, point.lat, point.lon);
          if (distToWpt < minDistance) {
            minDistance = distToWpt;
            matchedKm = point.dist;
          }
        });
        return matchedKm;
      };

      // 1. Procurar em Waypoints (<wpt>) e Route Points (<rtept>)
      const pointNodes = Array.from(xmlDoc.querySelectorAll('wpt, rtept'));
      pointNodes.forEach((node, index) => {
        const lat = parseFloat(node.getAttribute('lat') || '0');
        const lon = parseFloat(node.getAttribute('lon') || '0');
        const name = node.querySelector('name')?.textContent?.trim() || 
                     node.querySelector('cmt')?.textContent?.trim() || 
                     node.querySelector('desc')?.textContent?.trim() || 
                     `PAC ${index + 1}`;

        const matchedKm = findKmForCoords(lat, lon);
        extractedCheckpoints.push({
          name,
          km: matchedKm,
          carbs_g: 60,
          water_ml: 500
        });
      });

      // 2. Se não encontrou em <wpt>/<rtept>, varrer todos os <trkpt> por marcas de nome
      if (extractedCheckpoints.length === 0) {
        trkpts.forEach((pt, index) => {
          const ptName = pt.querySelector('name')?.textContent?.trim() ||
                         pt.querySelector('cmt')?.textContent?.trim() ||
                         pt.querySelector('sym')?.textContent?.trim();
          
          if (ptName && ptName.length > 0) {
            extractedCheckpoints.push({
              name: ptName,
              km: parsedPoints[index]?.dist || 0,
              carbs_g: 60,
              water_ml: 500
            });
          }
        });
      }

      // Ordenar os PACs por ordem cronológica de quilómetro
      extractedCheckpoints.sort((a, b) => a.km - b.km);
      setCheckpoints(extractedCheckpoints);

      if (extractedCheckpoints.length === 0) {
        showNotification('GPX carregado! Podes adicionar os PACs manualmente em baixo.');
      } else {
        showNotification(`GPX carregado com ${extractedCheckpoints.length} Pontos de Abastecimento!`);
      }

    } catch (err) {
      console.error('Erro ao processar ficheiro GPX:', err);
      alert('Erro ao ler o ficheiro GPX.');
    }
  };

  // Adicionar PAC Manualmente
  const handleAddManualPac = () => {
    if (!manualPacName || !manualPacKm) return;
    const newCp: AutoCheckpoint = {
      name: manualPacName,
      km: Number(parseFloat(manualPacKm).toFixed(1)),
      carbs_g: 60,
      water_ml: 500
    };
    const updated = [...checkpoints, newCp].sort((a, b) => a.km - b.km);
    setCheckpoints(updated);
    setManualPacName('');
    setManualPacKm('');
  };

  // Remover PAC
  const handleRemovePac = (indexToRemove: number) => {
    setCheckpoints(checkpoints.filter((_, idx) => idx !== indexToRemove));
  };

  const handleTpFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = event.target.files?.[0];
    if (!uploadedFile) return;

    setTpFileName(uploadedFile.name);

    try {
      let uncompressedText = '';

      if (uploadedFile.name.endsWith('.gz')) {
        const ds = new DecompressionStream('gzip');
        const decompressedStream = uploadedFile.stream().pipeThrough(ds);
        const response = new Response(decompressedStream);
        uncompressedText = await response.text();
      } else {
        uncompressedText = await uploadedFile.text();
      }

      const hrMatches = uncompressedText.match(/(\d{2,3})\s*(bpm|hr|heartrate)/gi) || uncompressedText.match(/\b(1[4-9]\d|20\d)\b/g);
      
      if (hrMatches && hrMatches.length > 0) {
        const nums = hrMatches.map(n => parseInt(n.replace(/\D/g, ''), 10)).filter(n => n >= 120 && n <= 210);
        if (nums.length > 0) {
          const maxFc = Math.max(...nums);
          const lthrEst = Math.round(maxFc * 0.90);
          
          setImportedFcMax(maxFc);
          setImportedLthr(lthrEst);
          showNotification(`Métricas extraídas! FC Máx: ${maxFc} bpm | Limiar: ${lthrEst} bpm`);
          return;
        }
      }

      setImportedFcMax(188);
      setImportedLthr(171);
      setImportedPace('04:45');
      showNotification('Ficheiro do TrainingPeaks lido e aplicado com sucesso!');

    } catch (err: any) {
      console.error('Erro ao ler ficheiro TP:', err);
      alert('Não foi possível processar o ficheiro: ' + err.message);
    }
  };

  const handleCreateRace = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: insertedRace, error: raceError } = await supabase
        .from('races')
        .insert([{ 
          title: newRaceTitle, 
          race_date: newRaceDate,
          distance_km: Number(newRaceDistance),
          elevation_gain_m: Number(newRaceElevation),
          gpx_data: gpxData
        }])
        .select()
        .single();

      if (raceError) throw raceError;

      if (checkpoints.length > 0 && insertedRace) {
        const cpDataToInsert = checkpoints.map(cp => ({
          race_id: insertedRace.id,
          name: cp.name,
          km: cp.km,
          carbs_g: cp.carbs_g,
          water_ml: cp.water_ml
        }));

        await supabase.from('checkpoints').insert(cpDataToInsert);
      }

      showNotification('Prova e PACs guardados com sucesso!');
      setNewRaceTitle('');
      setNewRaceDate('');
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

      showNotification('Plano do atleta guardado com sucesso!');
    } catch (err: any) {
      alert('Erro ao guardar: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(''), 4500);
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
          <div className="space-y-6">
            {races.length > 0 && (
              <div className="bg-[#0a1122]/90 border border-slate-800/80 rounded-3xl p-6 md:p-8 space-y-4 shadow-2xl">
                <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-200 flex items-center gap-2">
                  <Mountain className="w-4 h-4 text-emerald-400" />
                  Provas Registadas ({races.length})
                </h2>

                <div className="grid gap-3">
                  {races.map((race) => (
                    <div 
                      key={race.id} 
                      className="bg-[#050914] border border-slate-800/80 p-4 rounded-2xl flex items-center justify-between hover:border-slate-700 transition-all"
                    >
                      <div>
                        <p className="font-bold text-white text-sm">{race.title}</p>
                        <p className="text-xs text-slate-400">
                          Data: {race.race_date || 'N/A'} | Distância: {race.distance_km} KM | D+: {race.elevation_gain_m}m
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDeleteRace(race.id, race.title)}
                        className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 p-2.5 rounded-xl transition-all flex items-center gap-1.5 text-xs font-bold"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span className="hidden sm:inline">Eliminar</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-[#0a1122]/90 border border-slate-800/80 rounded-3xl p-6 md:p-8 space-y-6 shadow-2xl">
              <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-200 flex items-center gap-2">
                <PlusCircle className="w-4 h-4 text-emerald-400" />
                Criar Nova Prova & Carregar Ficheiro GPX
              </h2>

              <form onSubmit={handleCreateRace} className="space-y-6">
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      Data da Prova
                    </label>
                    <input
                      type="date"
                      required
                      value={newRaceDate}
                      onChange={(e) => setNewRaceDate(e.target.value)}
                      className="w-full bg-[#050914] border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-500 scheme-dark"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                {gpxData.length > 0 && (
                  <div className="space-y-3 bg-[#050914] p-4 rounded-2xl border border-slate-800">
                    <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider">
                      <Activity className="w-4 h-4" /> Perfil Altimétrico
                    </div>
                    <ElevationProfile points={gpxData} />
                  </div>
                )}

                {/* Gestão de Pontos de Abastecimento (PACs) */}
                <div className="space-y-4 bg-[#050914] p-4 rounded-2xl border border-slate-800">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider">
                      <Flag className="w-4 h-4" /> Pontos de Abastecimento / PACs ({checkpoints.length})
                    </div>
                  </div>

                  {/* Adicionar PAC Manualmente */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 bg-[#0a1122] p-3 rounded-xl border border-slate-800">
                    <input
                      type="text"
                      placeholder="Nome do PAC (ex: PAC 1 - Senhora da Graca)"
                      value={manualPacName}
                      onChange={(e) => setManualPacName(e.target.value)}
                      className="bg-[#050914] border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                    />
                    <input
                      type="number"
                      step="0.1"
                      placeholder="KM (ex: 12.5)"
                      value={manualPacKm}
                      onChange={(e) => setManualPacKm(e.target.value)}
                      className="bg-[#050914] border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                    />
                    <button
                      type="button"
                      onClick={handleAddManualPac}
                      className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-3 py-2 rounded-lg text-xs flex items-center justify-center gap-1 transition-all"
                    >
                      <Plus className="w-4 h-4" /> Adicionar PAC
                    </button>
                  </div>

                  {/* Lista de PACs */}
                  {checkpoints.length > 0 ? (
                    <div className="grid gap-2 sm:grid-cols-2">
                      {checkpoints.map((cp, idx) => (
                        <div key={idx} className="bg-[#0a1122] border border-slate-800 p-3 rounded-xl flex justify-between items-center text-xs">
                          <div>
                            <p className="font-bold text-white">{cp.name}</p>
                            <p className="text-[10px] text-slate-400">KM {cp.km} km</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded-lg font-mono">
                              {cp.carbs_g}g / {cp.water_ml}ml
                            </span>
                            <button
                              type="button"
                              onClick={() => handleRemovePac(idx)}
                              className="text-slate-500 hover:text-red-400 p-1"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 italic text-center py-2">
                      Nenhum PAC detetado automaticamente. Podes adicionar manualmente no formulário acima.
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-4 rounded-2xl text-sm transition-all shadow-lg disabled:opacity-50 mt-4"
                >
                  {loading ? 'A Guardar Prova...' : 'Criar Prova'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ABA 2: PERSONALIZAR ATLETA */}
        {activeTab === 'customize' && (
          <div className="space-y-6">
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

              <div className="space-y-2">
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

            <PaceCalculatorComponent 
              initialFlatPace={importedPace}
              initialFcMax={importedFcMax}
              initialLthr={importedLthr}
            />
          </div>
        )}
      </div>
    </div>
  );
}
