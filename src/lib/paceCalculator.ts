// src/lib/paceCalculator.ts

export interface PaceZone {
  zone: string;
  label: string;
  minHr?: number;
  maxHr?: number;
  minPaceSec: number; // segundos por km
  maxPaceSec: number;
}

/**
 * Calcula o ritmo ajustado à inclinação (GAP) em segundos/km.
 * Inclinação em percentagem (ex: 10% = 10, -5% = -5).
 */
export function calculateGAP(flatPaceSec: number, slopePercent: number): number {
  // Coeficiente simplificado de custo energético segundo a inclinação
  let factor = 1;

  if (slopePercent > 0) {
    // Em subida: cada 1% de inclinação aumenta a exigência em ~3.5%
    factor += slopePercent * 0.035;
  } else if (slopePercent < 0) {
    // Em descida suave (-1% a -10%): benefício de ritmo
    if (slopePercent >= -10) {
      factor += slopePercent * 0.015;
    } else {
      // Em descida muito técnica/acentuada (< -10%): o ritmo volta a abrandar pelo impacto/técnica
      factor = 0.85 + Math.abs(slopePercent + 10) * 0.02;
    }
  }

  return Math.round(flatPaceSec * factor);
}

/**
 * Formata segundos em string mm:ss
 */
export function formatPace(totalSeconds: number): string {
  const mins = Math.floor(totalSeconds / 60);
  const secs = Math.round(totalSeconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs} /km`;
}

/**
 * Converte string 'MM:SS' para segundos totais
 */
export function parsePaceToSeconds(paceStr: string): number {
  const parts = paceStr.split(':');
  if (parts.length !== 2) return 300; // Valor padrão: 5:00 min/km
  const mins = parseInt(parts[0], 10) || 0;
  const secs = parseInt(parts[1], 10) || 0;
  return mins * 60 + secs;
}

/**
 * Gera Zonas de Frequência Cardíaca a partir da FC Máxima e LTHR (Limiar Anaeróbico)
 */
export function calculateHrZones(fcMax: number, lthr: number) {
  return [
    { zone: 'Z1', name: 'Recuperação', min: Math.round(lthr * 0.65), max: Math.round(lthr * 0.80) },
    { zone: 'Z2', name: 'Aeróbico / Endurance', min: Math.round(lthr * 0.81), max: Math.round(lthr * 0.89) },
    { zone: 'Z3', name: 'Tempo / Limiar Inferior', min: Math.round(lthr * 0.90), max: Math.round(lthr * 0.94) },
    { zone: 'Z4', name: 'Limiar Anaeróbico (LTHR)', min: Math.round(lthr * 0.95), max: Math.round(lthr * 1.02) },
    { zone: 'Z5', name: 'Capacidade Anaeróbica / VO2 Max', min: Math.round(lthr * 1.03), max: fcMax },
  ];
}
