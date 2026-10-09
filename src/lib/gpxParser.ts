// Distância em KM entre duas coordenadas GPS (Haversine)
function getHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
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
}

// Encontra o quilómetro exato no percurso para um Waypoint
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

export function parseGPX(xmlText: string, baseSpeedKmH: number = 8) {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlText, 'text/xml');

  // 1. Extrai os pontos de elevação/percurso (<trkpt>)
  const trkpts = Array.from(xmlDoc.querySelectorAll('trkpt'));
  
  let totalDistance = 0;
  let elevationGain = 0;
  let elevationLoss = 0;

  const routePoints = trkpts.map((pt, i) => {
    const lat = parseFloat(pt.getAttribute('lat') || '0');
    const lon = parseFloat(pt.getAttribute('lon') || '0');
    const ele = parseFloat(pt.querySelector('ele')?.textContent || '0');

    let segmentDistance = 0;
    let slope = 0;

    if (i > 0) {
      const prevLat = parseFloat(trkpts[i - 1].getAttribute('lat') || '0');
      const prevLon = parseFloat(trkpts[i - 1].getAttribute('lon') || '0');
      const prevEle = parseFloat(trkpts[i - 1].querySelector('ele')?.textContent || '0');

      segmentDistance = getHaversineDistance(prevLat, prevLon, lat, lon);
      totalDistance += segmentDistance;

      const eleDiff = ele - prevEle;
      if (eleDiff > 0) {
        elevationGain += eleDiff;
      } else {
        elevationLoss += Math.abs(eleDiff);
      }

      // Cálculo da inclinação em percentagem (%)
      const distanceMeters = segmentDistance * 1000;
      if (distanceMeters > 0) {
        slope = (eleDiff / distanceMeters) * 100;
      }
    }

    return {
      lat,
      lon,
      ele,
      distanceFromStart: parseFloat(totalDistance.toFixed(3)),
      slope: parseFloat(slope.toFixed(2)),
    };
  });

  // 2. Extrai os Postos de Abastecimento (<wpt>)
  const wpts = Array.from(xmlDoc.querySelectorAll('wpt'));
  const extractedPACs = wpts.map((wpt, index) => {
    const name = wpt.querySelector('name')?.textContent || `PAC ${index + 1}`;
    const lat = parseFloat(wpt.getAttribute('lat') || '0');
    const lon = parseFloat(wpt.getAttribute('lon') || '0');

    const km = calculateKmForWaypoint(lat, lon, routePoints);

    return {
      name: name,
      km: parseFloat(km.toFixed(1)),
      carbs_g: 60,   // Valor padrão
      water_ml: 500  // Valor padrão
    };
  });

  // 3. Regra de Naismith Modificada para Trail Running
  const baseTimeHours = totalDistance / Math.max(baseSpeedKmH, 1);
  const climbHours = elevationGain / 600; // +1 hora por cada 600m de subida
  const estimatedTimeMinutes = Math.round((baseTimeHours + climbHours) * 60);

  return { 
    routePoints, 
    extractedPACs, 
    totalDistance: parseFloat(totalDistance.toFixed(2)),
    elevationGain: Math.round(elevationGain),
    elevationLoss: Math.round(elevationLoss),
    estimatedTimeMinutes 
  };
}
