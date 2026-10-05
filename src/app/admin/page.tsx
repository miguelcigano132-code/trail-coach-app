'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import {
  Plus,
  Trash2,
  Save,
  Upload,
  Mountain,
  Flag,
  ShieldAlert,
  Check,
  LayoutDashboard,
  User,
} from 'lucide-react';
import ElevationProfile from '@/components/ElevationProfile';

// Função para calcular a distância em KM entre duas coordenadas GPS (Haversine)
function getHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
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
}

// Função para encontrar o KM aproximado no percurso para um Waypoint
function calculateKmForWaypoint(wptLat: number, wptLon: number, routePoints: any[]) {
  let accumulatedDistance = 0;
  let minDistance = Infinity;
  let closestKm = 0;

  for (let i = 0; i < routePoints.length; i++) {
    if (i > 0) {
      accumulatedDistance += getHaversineDistance(
        routePoints[i - 1].lat,
        routePoints[i - 1].lon,
        routePoints[i].lat,
        routePoints[i].lon
      );
    }

    const distToWpt = getHaversineDistance(wptLat, wptLon, routePoints[i].lat, routePoints[i].lon);
    if (distToWpt < minDistance) {
      minDistance = distToWpt;
      closestKm = accumulatedDistance;
    }
  }

  return closestKm;
}

export default function AdminPage() {
  // Lista de Atletas e Seleção
  const [athletes, setAthletes] = useState<any[]>([]);
  const [selectedAthleteId, setSelectedAthleteId] = useState<string>('');

  // ID da prova existente (caso seja uma atualização)
  const [editingRaceId, setEditingRaceId] = useState<string | null>(null);

  // Dados da Prova
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [raceDate, setRaceDate] = useState('');
  const [distance, setDistance] = useState('');
  const [elevation, setElevation] = useState('');

  // Metas Táticas & Notas
  const [targetCarbs, setTargetCarbs] = useState('75g');
  const [targetHydration, setTargetHydration] = useState('500ml (1 Flask/h)');
  const [targetPace, setTargetPace] = useState('6:00 min/km');
  const [coachNotes, setCoachNotes] = useState('');

  // GPX & Ficheiros
  const [gpxFile, setGpxFile] = useState<File | null>(null);
  const [gpxPoints, setGpxPoints] = useState<any[]>([]);

  // Postos de Abastecimento (PACs)
  const [checkpoints, setCheckpoints] = useState<
    Array<{ name: string; km: string; carbs_g: number; water_ml: number }>
  >([
    { name: 'PAC 1 - Inicio Subida', km: '10', carbs_g: 40, water_ml: 500 },
    { name: 'PAC 2 - Merujal (Dropbag)', km: '22', carbs_g: 75, water_ml: 1000 },
  ]);

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Procurar atletas ao carregar a página
  useEffect(() => {
    async function fetchAthletes() {
      const { data, error } = await supabase.from('profiles').select('*');
      if (!error && data) {
        setAthletes(data);
        if (data.length > 0) setSelectedAthleteId(data[0].id);
      }
    }
    fetchAthletes();
  }, []);

  // Procurar dados da prova existente ao mudar de atleta selecionado
  useEffect(() => {
    if (!selectedAthleteId) return;

    async function loadAthleteRace() {
      const { data: race, error } = await supabase
        .from('races')
        .select('*, checkpoints(*)')
        .eq('athlete_id', selectedAthleteId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!error && race) {
        setEditingRaceId(race.id);
        setTitle(race.title || '');
        setLocation(race.location || '');
        setRaceDate(race.race_date || '');
        setDistance(race.distance_km ? race.distance_km.toString() : '');
        setElevation(race.elevation_gain_m ? race.elevation_gain_m.toString() : '');
        setTargetCarbs(race.target_carbs || '75g');
        setTargetHydration(race.target_hydration || '500ml (1 Flask/h)');
        setTargetPace(race.target_pace || '6:00 min/km');
        setCoachNotes(race.coach_notes || '');
        if (race.gpx_data) setGpxPoints(race.gpx_data);

        if (race.checkpoints && race.checkpoints.length > 0) {
          const sortedCps = race.checkpoints
            .sort((a: any, b: any) => a.km - b.km)
            .map((cp: any) => ({
              name: cp.name,
              km: cp.km.toString(),
              carbs_g: cp.carbs_g,
              water_ml: cp.water_ml,
            }));
          setCheckpoints(sortedCps);
        }
      } else {
        // Se o atleta não tiver prova associada, repõe o formulário
        setEditingRaceId(null);
        setTitle('');
        setLocation('');
        setRaceDate('');
        setDistance('');
        setElevation('');
        setGpxPoints([]);
        setCheckpoints([
          { name: 'PAC 1 - Inicio Subida', km: '10', carbs_g: 40, water_ml: 500 },
          { name: 'PAC 2 - Merujal (Dropbag)', km: '22', carbs_g: 75, water_ml: 1000 },
        ]);
      }
    }

    loadAthleteRace();
  }, [selectedAthleteId]);

  const handleAddCheckpoint = () => {
    setCheckpoints([
      ...checkpoints,
      { name: `PAC ${checkpoints.length + 1}`, km: '', carbs_g: 60, water_ml: 500 },
    ]);
  };

  const handleRemoveCheckpoint = (index: number) => {
    setCheckpoints(checkpoints.filter((_, i) => i !== index));
  };

  const handleCheckpointChange = (index: number, field: string, value: any) => {
    const updated = [...checkpoints];
    updated[index] = { ...updated[index], [field]: value };
    setCheckpoints(updated);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setGpxFile(file);

    const text = await file.text();
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(text, 'text/xml');

    // 1. Processar pontos do percurso (trkpt)
    const trkpts = Array.from(xmlDoc.querySelectorAll('trkpt'));
    let totalDist = 0;
    const points: any[] = [];

    trkpts.forEach((pt, idx) => {
      const lat = parseFloat(pt.getAttribute('lat') || '0');
      const lon = parseFloat(pt.getAttribute('lon') || '0');
      const ele = parseFloat(pt.querySelector('ele')?.textContent || '0');

      if (idx > 0) {
        const prev = points[idx - 1];
        totalDist += getHaversineDistance(prev.lat, prev.lon, lat, lon);
      }

      points.push({ lat, lon, ele, distanceKm: totalDist });
    });

    setGpxPoints(points);

    if (points.length > 0) {
      setDistance(totalDist.toFixed(1));
      const maxEle = Math.max(...points.map((p) => p.ele));
      const minEle = Math.min(...points.map((p) => p.ele));
      setElevation(Math.round(maxEle - minEle).toString());
    }

    // 2. Extrair Waypoints/Postos de Abastecimento (<wpt>)
    const wpts = Array.from(xmlDoc.querySelectorAll('wpt'));
    if (wpts.length > 0 && points.length > 0) {
      const extractedPACs = wpts.map((wpt, index) => {
        const name = wpt.querySelector('name')?.textContent || `PAC ${index + 1}`;
        const lat = parseFloat(wpt.getAttribute('lat') || '0');
        const lon = parseFloat(wpt.getAttribute('lon') || '0');

        const kmCalculated = calculateKmForWaypoint(lat, lon, points);

        return {
          name: name,
          km: kmCalculated.toFixed(1),
          carbs_g: 60,
          water_ml: 500,
        };
      });

      extractedPACs.sort((a, b) => parseFloat(a.km) - parseFloat(b.km));
      setCheckpoints(extractedPACs);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);

    try {
      let gpxUrl = null;
      if (gpxFile) {
        const fileExt = gpxFile.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const { data: storageData } = await supabase.storage
          .from('avatars')
          .upload(`gpx/${fileName}`, gpxFile);
        if (storageData) gpxUrl = storageData.path;
      }

      const racePayload = {
        athlete_id: selectedAthleteId || null,
        title,
        location,
        race_date: raceDate,
        distance_km: parseFloat(distance) || 0,
        elevation_gain_m: parseInt(elevation) || 0,
        ...(gpxUrl && { gpx_url: gpxUrl }),
        ...(gpxPoints.length > 0 && { gpx_data: gpxPoints }),
        target_carbs: targetCarbs,
        target_hydration: targetHydration,
        target_pace: targetPace,
        coach_notes: coachNotes,
        is_public: true,
      };

      let raceData = null;

      if (editingRaceId) {
        // Se a prova já existe, atualiza-a em vez de criar um duplicado
        const { data, error } = await supabase
          .from('races')
          .update(racePayload)
          .eq('id', editingRaceId)
          .select()
          .single();

        if (error) throw error;
        raceData = data;
      } else {
        // Se não existe, cria uma prova nova
        const { data, error } = await supabase
          .from('races')
          .insert([racePayload])
          .select()
          .single();

        if (error) throw error;
        raceData = data;
        setEditingRaceId(raceData.id);
      }

      // Atualiza os PACs: apaga os antigos da prova e insere os novos
      if (raceData) {
        await supabase.from('checkpoints').delete().eq('race_id', raceData.id);

        if (checkpoints.length > 0) {
          const formattedCheckpoints = checkpoints.map((cp) => ({
            race_id: raceData.id,
            name: cp.name,
            km: parseFloat(cp.km) || 0,
            carbs_g: cp.carbs_g,
            water_ml: cp.water_ml,
          }));

          const { error: cpError } = await supabase.from('checkpoints').insert(formattedCheckpoints);
          if (cpError) console.error('Erro ao guardar PACs:', cpError.message);
        }
      }

      setSuccess(true);
    } catch (err: any) {
      alert(`Erro ao criar/atualizar prova: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-10 font-sans">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Cabeçalho */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-6">
          <div>
            <h1 className="text-2xl font-black text-white flex items-center gap-2">
              <Mountain className="w-7 h-7 text-emerald-400" /> PAINEL DO TREINADOR
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Gestão de Provas, Metas Táticas e Postos de Abastecimento
            </p>
          </div>

          <Link
            href="/dashboard"
            className="flex items-center gap-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-emerald-400 hover:text-emerald-300 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md"
          >
            <LayoutDashboard className="w-4 h-4" /> Ver Vista do Atleta
          </Link>
        </div>

        {success && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-4 rounded-2xl flex items-center gap-2 text-sm font-bold">
            <Check className="w-5 h-5" /> Prova e Plano Tático salvos com sucesso!
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Seleção do Atleta */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
            <h2 className="text-sm font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
              <User className="w-4 h-4" /> Atribuir Atleta
            </h2>
            <div>
              <label className="text-slate-400 font-bold block mb-1 text-xs">Atleta</label>
              <select
                value={selectedAthleteId}
                onChange={(e) => setSelectedAthleteId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white text-xs focus:outline-none focus:border-emerald-500"
              >
                {athletes.length === 0 ? (
                  <option value="">Nenhum atleta encontrado</option>
                ) : (
                  athletes.map((athlete) => (
                    <option key={athlete.id} value={athlete.id}>
                      {athlete.full_name || athlete.email || athlete.id}
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>

          {/* Ficheiro GPX */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
            <h2 className="text-sm font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
              <Upload className="w-4 h-4" /> 1. Carregar Percurso GPX / GZ
            </h2>
            <input
              type="file"
              accept=".gpx,.gz"
              onChange={handleFileChange}
              className="block w-full text-xs text-slate-400 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-extrabold file:bg-emerald-500 file:text-slate-950 hover:file:bg-emerald-400 cursor-pointer"
            />
            {gpxPoints.length > 0 && <ElevationProfile points={gpxPoints} />}
          </div>

          {/* Detalhes da Prova */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              2. Dados da Prova
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="text-slate-400 font-bold block mb-1">Nome da Prova</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Trail Serra da Freita"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="text-slate-400 font-bold block mb-1">Localização</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Ex: Arouca, Portugal"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="text-slate-400 font-bold block mb-1">Distância (KM)</label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={distance}
                  onChange={(e) => setDistance(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="text-slate-400 font-bold block mb-1">Desnível (D+ M)</label>
                <input
                  type="number"
                  required
                  value={elevation}
                  onChange={(e) => setElevation(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="text-slate-400 font-bold block mb-1">Data da Prova</label>
                <input
                  type="date"
                  required
                  value={raceDate}
                  onChange={(e) => setRaceDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Metas Táticas */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              3. Metas Táticas do Atleta
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="text-slate-400 font-bold block mb-1">Carbs / Hora</label>
                <input
                  type="text"
                  value={targetCarbs}
                  onChange={(e) => setTargetCarbs(e.target.value)}
                  placeholder="Ex: 75g"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="text-slate-400 font-bold block mb-1">
                  Hidratação / Hora (Flasks de 500ml)
                </label>
                <input
                  type="text"
                  value={targetHydration}
                  onChange={(e) => setTargetHydration(e.target.value)}
                  placeholder="Ex: 500ml (1 Flask)"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="text-slate-400 font-bold block mb-1">Ritmo Alvo</label>
                <input
                  type="text"
                  value={targetPace}
                  onChange={(e) => setTargetPace(e.target.value)}
                  placeholder="Ex: 6:30 min/km"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Postos de Abastecimento (PACs) */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Flag className="w-4 h-4 text-emerald-400" /> 4. Postos de Abastecimento (PACs)
              </h2>
              <button
                type="button"
                onClick={handleAddCheckpoint}
                className="flex items-center gap-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-3 py-1.5 rounded-xl text-xs font-bold hover:bg-emerald-500/20"
              >
                <Plus className="w-3.5 h-3.5" /> Adicionar PAC
              </button>
            </div>

            <div className="space-y-3">
              {checkpoints.map((cp, idx) => (
                <div
                  key={idx}
                  className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 grid grid-cols-1 sm:grid-cols-5 gap-3 items-center text-xs"
                >
                  <div className="sm:col-span-2">
                    <label className="text-slate-500 text-[10px] uppercase font-bold block">
                      Nome do Posto
                    </label>
                    <input
                      type="text"
                      value={cp.name}
                      onChange={(e) => handleCheckpointChange(idx, 'name', e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-slate-500 text-[10px] uppercase font-bold block">
                      KM
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={cp.km}
                      onChange={(e) => handleCheckpointChange(idx, 'km', e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-slate-500 text-[10px] uppercase font-bold block">
                      Carbs (g)
                    </label>
                    <input
                      type="number"
                      value={cp.carbs_g}
                      onChange={(e) =>
                        handleCheckpointChange(idx, 'carbs_g', parseInt(e.target.value) || 0)
                      }
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white mt-1"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1">
                      <label className="text-slate-500 text-[10px] uppercase font-bold block">
                        Líquidos (ml / Flasks)
                      </label>
                      <input
                        type="number"
                        step="250"
                        value={cp.water_ml}
                        onChange={(e) =>
                          handleCheckpointChange(idx, 'water_ml', parseInt(e.target.value) || 0)
                        }
                        placeholder="500ml = 1 Flask"
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white mt-1"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveCheckpoint(idx)}
                      className="text-rose-400 hover:text-rose-300 p-2 mt-4"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Notas Táticas do Treinador */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-400" /> 5. Notas Táticas para o Atleta
            </h2>
            <textarea
              rows={3}
              value={coachNotes}
              onChange={(e) => setCoachNotes(e.target.value)}
              placeholder="Ex: Levar 2 flasks de 500ml cheios na partida (1 com água, 1 com eletrólitos). A primeira subida requer atenção..."
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-xs text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Submeter */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-4 rounded-2xl text-sm transition-colors flex items-center justify-center gap-2"
          >
            <Save className="w-5 h-5" />{' '}
            {loading ? 'A guardar prova...' : 'Guardar Prova e Plano Tático'}
          </button>
        </form>
      </div>
    </div>
  );
}
