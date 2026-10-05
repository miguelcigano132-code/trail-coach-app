import { GPXPoint } from '@/components/ElevationProfile';

function calculateHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Raio da Terra em km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Lê um ficheiro de texto simples ou comprimido (.gz / .gpx.gz)
 */
export async function readCompressedOrTextFile(file: File): Promise<string> {
  if (file.name.endsWith('.gz') || file.type.includes('gzip')) {
    try {
      const ds = new DecompressionStream('gzip');
      const decompressedStream = file.stream().pipeThrough(ds);
      const response = new Response(decompressedStream);
      return await response.text();
    } catch (err) {
      console.error('Erro ao descomprimir ficheiro .gz:', err);
      throw new Error('Não foi possível descomprimir o ficheiro .gz.');
    }
  }
  return await file.text();
}

export function parseGPXString(xmlText: string): { points: GPXPoint[]; totalDistanceKm: number; elevationGainM: number } {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
  const trkpts = xmlDoc.getElementsByTagName('trkpt');

  const points: GPXPoint[] = [];
  let totalDistanceKm = 0;
  let elevationGainM = 0;

  for (let i = 0; i < trkpts.length; i++) {
    const pt = trkpts[i];
    const lat = parseFloat(pt.getAttribute('lat') || '0');
    const lon = parseFloat(pt.getAttribute('lon') || '0');
    const eleNode = pt.getElementsByTagName('ele')[0];
    const ele = eleNode ? parseFloat(eleNode.textContent || '0') : 0;

    if (i > 0) {
      const prev = points[i - 1];
      const dist = calculateHaversineDistance(prev.lat, prev.lon, lat, lon);
      totalDistanceKm += dist;

      const eleDiff = ele - prev.ele;
      if (eleDiff > 0) {
        elevationGainM += eleDiff;
      }
    }

    points.push({
      lat,
      lon,
      ele,
      distanceKm: parseFloat(totalDistanceKm.toFixed(2)),
    });
  }

  return {
    points,
    totalDistanceKm: parseFloat(totalDistanceKm.toFixed(1)),
    elevationGainM: Math.round(elevationGainM),
  };
}
