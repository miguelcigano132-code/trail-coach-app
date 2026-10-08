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
  Flag,
  Trash2
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

  // Função para apagar prova
  const handleDeleteRace = async (raceId: string, raceTitle: string) => {
    const confirmDelete = window.confirm(`Tem a certeza de que pretende eliminar a prova "${raceTitle}"?`);
    if (!confirmDelete) return;

    setLoading(true);
    try {
      // 1. Eliminar postos de abastecimento associados (se existirem)
      await supabase.from('checkpoints').delete().eq('race_id', raceId);

      // 2. Eliminar a prova na tabela "races"
      const { error } = await supabase
        .from('races')
        .delete()
        .eq('id', raceId);

      if (error) throw error;

      showNotification(`Prova "${raceTitle}" eliminada com sucesso!`);
      fetchInitialData();
    } catch (err: any) {
      console.error('Erro ao apagar prova:', err);
      alert('Erro ao eliminar a prova: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Função para calcular distância entre coordenadas (Fórmula Haversine em km)
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

  // Leitura e Parsing do Ficheiro GPX (Extrai percurso e Waypoints reais)
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

      // 1. Processar pontos do trajeto (trkpt)
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

      const finalDistKm = Number(totalDist.toFixed(1));
      const finalElevationM = Math.round(totalElevationGain);

      setGpxData(parsedPoints);
      setNewRaceDistance(finalDistKm.toString());
      setNewRaceElevation(finalElevationM.toString());

      if (!newRaceTitle) {
        const titleFromFilename = file.name.replace(/\.gpx$/i, '').replace(/_/g, ' ');
        setNewRaceTitle(titleFromFilename);
      }

      // 2. Extrair os Waypoints (<wpt>) georreferenciados do GPX
      const wpts = Array.from(xmlDoc.querySelectorAll('wpt'));
      const extractedCheckpoints: AutoCheckpoint[] = [];

      wpts.forEach((wpt, index) => {
        const wptLat = parseFloat(wpt.getAttribute('lat') || '0');
        const wptLon = parseFloat(wpt.getAttribute('lon') || '0');
        const nameNode = wpt.querySelector('name');
        const wptName = nameNode?.textContent?.trim() || `PAC ${index + 1}`;

        // Encontrar o ponto do trajeto (trkpt) mais próximo do waypoint para saber o KM exato
        let minDistance = Infinity;
        let matchedKm = 0;

        parsedPoints.forEach((point) => {
          const distToWpt = calcDistance(wptLat, wptLon, point.lat, point.lon);
          if (distToWpt < minDistance) {
            minDistance = distToWpt;
            matchedKm = point.dist;
          }
        });

        extractedCheckpoints.push({
          name: wptName,
          km: matchedKm,
          carbs_g: 60,
          water_ml: 500
        });
      });

      // Ordenar os postos pelo quilómetro do trajeto
      extractedCheckpoints.sort((a, b) => a.km - b.km);
      setCheckpoints(extractedCheckpoints);

    } catch (err) {
      console.error('Erro ao processar ficheiro GPX:', err);
      alert('Erro ao ler o ficheiro GPX. Verifica o formato do ficheiro.');
    }
  };

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

        const { error: cpError } = await supabase.from('checkpoints').insert(cpDataToInsert);
        if (cpError) console.error('Erro ao gravar abastecimentos:', cpError);
      }

      showNotification('Prova e PACs reais do GPX guardados com sucesso!');
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
