export interface GeoPoint {
  lat: number;
  lng: number;
  alt: number | null;
  accuracy: number;
  speed: number | null;
  timestamp: number;
}

const EARTH_RADIUS_M = 6371000;

function toRad(deg: number) {
  return (deg * Math.PI) / 180;
}

/** Distância em metros entre dois pontos GPS (fórmula de Haversine). */
export function haversineMeters(a: GeoPoint, b: GeoPoint): number {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const sinDLat = Math.sin(dLat / 2);
  const sinDLng = Math.sin(dLng / 2);
  const h =
    sinDLat * sinDLat +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * sinDLng * sinDLng;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Distância total percorrida (m), ignorando ruído de GPS menor que a precisão do sinal. */
export function totalDistanceMeters(points: GeoPoint[]): number {
  let total = 0;
  for (let i = 1; i < points.length; i++) {
    const seg = haversineMeters(points[i - 1], points[i]);
    const noiseFloor = Math.min(points[i - 1].accuracy, points[i].accuracy, 30);
    if (seg > noiseFloor) total += seg;
  }
  return total;
}

/** Ganho de elevação acumulado (m), somando apenas subidas quando altitude está disponível. */
export function elevationGainMeters(points: GeoPoint[]): number {
  let gain = 0;
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1].alt;
    const b = points[i].alt;
    if (a != null && b != null && b > a) gain += b - a;
  }
  return gain;
}

/** Pace (s/km) calculado nos últimos `windowMs` ms de rota para suavizar ruído de GPS. */
export function computeInstantPace(points: GeoPoint[], windowMs = 20000): number | null {
  if (points.length < 2) return null;
  const now = points[points.length - 1].timestamp;
  const window = points.filter((p) => now - p.timestamp <= windowMs);
  if (window.length < 2) return null;
  const distM = totalDistanceMeters(window);
  const timeSec = (window[window.length - 1].timestamp - window[0].timestamp) / 1000;
  if (distM < 2 || timeSec < 1) return null;
  return timeSec / (distM / 1000);
}

/**
 * Converte uma rota GPS em um path SVG escalado para caber no viewBox.
 * Usa projeção equiretangular — precisa suficiente para trajetos de corrida.
 */
export function buildRoutePath(
  points: GeoPoint[],
  width: number,
  height: number,
  padding = 24,
): string {
  if (points.length < 2) return "";

  const lat0 = points[0].lat;
  const metersPerDegLat = 110540;
  const metersPerDegLng = 111320 * Math.cos(toRad(lat0));

  const coords = points.map((p) => ({
    x: (p.lng - points[0].lng) * metersPerDegLng,
    y: -(p.lat - points[0].lat) * metersPerDegLat,
  }));

  const xs = coords.map((c) => c.x);
  const ys = coords.map((c) => c.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);

  const rangeX = Math.max(maxX - minX, 1);
  const rangeY = Math.max(maxY - minY, 1);
  const availW = width - padding * 2;
  const availH = height - padding * 2;
  const scale = Math.min(availW / rangeX, availH / rangeY);

  const offsetX = padding + (availW - rangeX * scale) / 2;
  const offsetY = padding + (availH - rangeY * scale) / 2;

  return coords
    .map((c, i) => {
      const sx = (c.x - minX) * scale + offsetX;
      const sy = (c.y - minY) * scale + offsetY;
      return `${i === 0 ? "M" : "L"}${sx.toFixed(1)} ${sy.toFixed(1)}`;
    })
    .join(" ");
}
