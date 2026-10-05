'use client';

export interface GPXPoint {
  lat: number;
  lon: number;
  ele: number;
  distanceKm: number;
}

interface ElevationProfileProps {
  points: GPXPoint[];
}

export default function ElevationProfile({ points }: ElevationProfileProps) {
  if (!points || points.length === 0) return null;

  const maxEle = Math.max(...points.map((p) => p.ele));
  const minEle = Math.min(...points.map((p) => p.ele));
  const totalDist = points[points.length - 1]?.distanceKm || 0;

  return (
    <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
      <div className="flex justify-between text-xs font-bold text-slate-400">
        <span>Alt. Mínima: {Math.round(minEle)}m</span>
        <span>Alt. Máxima: {Math.round(maxEle)}m</span>
        <span>Distância: {totalDist} km</span>
      </div>
      <div className="h-32 w-full flex items-end gap-[1px] bg-slate-900/50 p-2 rounded-lg overflow-hidden">
        {points.map((pt, idx) => {
          const heightPercent = maxEle === minEle ? 50 : ((pt.ele - minEle) / (maxEle - minEle)) * 100;
          return (
            <div
              key={idx}
              className="flex-1 bg-emerald-500 hover:bg-emerald-400 transition-all rounded-t-[1px]"
              style={{ height: `${Math.max(heightPercent, 5)}%` }}
              title={`Distância: ${pt.distanceKm}km | Elevação: ${Math.round(pt.ele)}m`}
            />
          );
        })}
      </div>
    </div>
  );
}
