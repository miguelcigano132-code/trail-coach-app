'use client';

export interface GPXPoint {
  lat: number;
  lon: number;
  ele: number;
  distanceKm: number;
  slope?: number; // Inclinação em %
}

interface ElevationProfileProps {
  points: GPXPoint[];
}

export default function ElevationProfile({ points }: ElevationProfileProps) {
  if (!points || points.length === 0) return null;

  const maxEle = Math.max(...points.map((p) => p.ele));
  const minEle = Math.min(...points.map((p) => p.ele));
  const totalDist = points[points.length - 1]?.distanceKm || 0;

  // Função para definir a cor da barra com base na inclinação do terreno (Trail Running)
  const getSlopeColor = (slope?: number) => {
    if (slope === undefined) return 'bg-emerald-500 hover:bg-emerald-400';
    if (slope > 15) return 'bg-rose-600 hover:bg-rose-500';     // Subida muito forte / Parede (> 15%)
    if (slope > 5) return 'bg-amber-500 hover:bg-amber-400';     // Subida moderada (5% a 15%)
    if (slope < -10) return 'bg-cyan-500 hover:bg-cyan-400';     // Descida técnica/acentuada (< -10%)
    return 'bg-emerald-500 hover:bg-emerald-400';                // Plano / Descida suave
  };

  return (
    <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
      <div className="flex justify-between text-xs font-bold text-slate-400">
        <span>Alt. Mínima: {Math.round(minEle)}m</span>
        <span>Alt. Máxima: {Math.round(maxEle)}m</span>
        <span>Distância: {totalDist.toFixed(1)} km</span>
      </div>

      {/* Legenda de Cores de Esforço */}
      <div className="flex items-center gap-4 text-[10px] text-slate-400 font-semibold pt-1">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-cyan-500"></span> Descida</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> Plano/Suave</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500"></span> Subida (&gt;5%)</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-600"></span> Parede (&gt;15%)</span>
      </div>

      {/* Gráfico Visual de Altimetria Dinâmico */}
      <div className="h-32 w-full flex items-end gap-[1px] bg-slate-900/50 p-2 rounded-lg overflow-x-auto">
        {points.map((pt, idx) => {
          const heightPercent = maxEle === minEle ? 50 : ((pt.ele - minEle) / (maxEle - minEle)) * 100;
          const colorClass = getSlopeColor(pt.slope);
          return (
            <div
              key={idx}
              className={`flex-1 min-w-[2px] ${colorClass} transition-all rounded-t-[1px]`}
              style={{ height: `${Math.max(heightPercent, 5)}%` }}
              title={`Km ${pt.distanceKm.toFixed(1)}: ${Math.round(pt.ele)}m | Inclinação: ${pt.slope !== undefined ? pt.slope + '%' : 'N/A'}`}
            />
          );
        })}
      </div>
    </div>
  );
}
