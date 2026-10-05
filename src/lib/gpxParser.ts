import gpxParser from 'gpxparser';

export interface CheckpointEstimate {
  name: string;
  km: number;
  elevation: number;
  estimatedTimeMinutes: number;
  carbsNeededGrams: number;
  waterNeededMl: number;
}

/**
 * Processa o ficheiro GPX e calcula o tempo estimado em cada posto de abastecimento
 * com base no ritmo ajustado à inclinação (GAP - Graded Adjusted Pace)
 */
export function calculateRaceStrategy(
  gpxXmlContent: string,
  checkpointsKm: number[],
  flatPaceMinPerKm: number = 6.0, // ex: 6:00 min/km em plano
  carbsTargetPerHour: number = 60 // ex: 60g de hidratos/hora
) {
  const gpx = new gpxParser();
  gpx.parse(gpxXmlContent);

  const totalDistance = gpx.tracks[0].distance.total / 1000; // km
  const totalElevationGain = gpx.tracks[0].elevation.pos; // D+

  // Algoritmo simplificado de estimação considerando desnível (Regla Naismith/GAP)
  // Cada 100m D+ adicionam o equivalente a ~1km plano em tempo
  const equivalentFlatKm = totalDistance + (totalElevationGain / 100);
  const totalEstimatedMinutes = equivalentFlatKm * flatPaceMinPerKm;

  // Calcular estímulo e nutrição para cada posto
  const calculatedCheckpoints: CheckpointEstimate[] = checkpointsKm.map((kmMark, index) => {
    const progressRatio = kmMark / totalDistance;
    const estimatedTimeMinutes = Math.round(totalEstimatedMinutes * progressRatio);
    
    // Cálculo do consumo nutricional acumulado até ao posto
    const hoursElapsed = estimatedTimeMinutes / 60;
    const carbsNeededGrams = Math.round(hoursElapsed * carbsTargetPerHour);
    const waterNeededMl = Math.round(hoursElapsed * 600); // Média de 600ml/h

    return {
      name: `PAC ${index + 1}`,
      km: kmMark,
      elevation: 0, // Pode ser extraído do ponto exato da trégua do GPX
      estimatedTimeMinutes,
      carbsNeededGrams,
      waterNeededMl,
    };
  });

  return {
    totalDistance: totalDistance.toFixed(1),
    totalElevationGain: Math.round(totalElevationGain),
    totalEstimatedMinutes,
    checkpoints: calculatedCheckpoints,
  };
}
