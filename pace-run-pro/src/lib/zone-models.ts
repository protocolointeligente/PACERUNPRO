// Training zone model definitions and preset templates

export interface ZoneDef {
  number: number;
  name: string;
  color: string;         // hex or tailwind color token
  minPct: number;        // % of reference value (HR max, FTP, threshold pace)
  maxPct: number;
  rpeRange?: [number, number];
  description?: string;
}

export interface ZoneModelPreset {
  name: string;
  sport: string;
  method: string;
  zoneCount: number;
  zones: ZoneDef[];
}

export const SPORT_LABELS: Record<string, string> = {
  CORRIDA:  "Corrida",
  CICLISMO: "Ciclismo",
  NATACAO:  "Natação",
  FORCA:    "Força",
  GERAL:    "Geral",
};

export const METHOD_LABELS: Record<string, string> = {
  FC_MAXIMA: "FC Máxima",
  LIMIAR:    "FC Limiar",
  FTP:       "FTP (Potência)",
  PACE:      "Pace Limiar",
  RPE:       "RPE / Esforço",
};

export const ZONE_PRESETS: ZoneModelPreset[] = [
  {
    name: "Corrida 5 Zonas (FC Máxima)",
    sport: "CORRIDA",
    method: "FC_MAXIMA",
    zoneCount: 5,
    zones: [
      { number: 1, name: "Recuperação Ativa",   color: "#4ade80", minPct: 50, maxPct: 60, rpeRange: [1,2],  description: "Conversação fácil" },
      { number: 2, name: "Base Aeróbica",        color: "#38bdf8", minPct: 60, maxPct: 70, rpeRange: [3,4],  description: "Respiração confortável" },
      { number: 3, name: "Aeróbico Moderado",    color: "#a78bfa", minPct: 70, maxPct: 80, rpeRange: [5,6],  description: "Ritmo de conversa difícil" },
      { number: 4, name: "Limiar Anaeróbico",    color: "#fb923c", minPct: 80, maxPct: 90, rpeRange: [7,8],  description: "Ritmo de corrida sustentado" },
      { number: 5, name: "VO2máx / Neuromuscular", color: "#f87171", minPct: 90, maxPct: 100, rpeRange: [9,10], description: "Esforço máximo" },
    ],
  },
  {
    name: "Corrida FC Limiar",
    sport: "CORRIDA",
    method: "LIMIAR",
    zoneCount: 5,
    zones: [
      { number: 1, name: "Recuperação",    color: "#4ade80", minPct: 70, maxPct: 80, description: "< 80% FC Limiar" },
      { number: 2, name: "Aeróbico",       color: "#38bdf8", minPct: 80, maxPct: 88, description: "80-88% FC Limiar" },
      { number: 3, name: "Tempo",          color: "#a78bfa", minPct: 88, maxPct: 94, description: "88-94% FC Limiar" },
      { number: 4, name: "Limiar",         color: "#fb923c", minPct: 94, maxPct: 100, description: "94-100% FC Limiar" },
      { number: 5, name: "VO2máx+",       color: "#f87171", minPct: 100, maxPct: 115, description: "> FC Limiar" },
    ],
  },
  {
    name: "Corrida Pace Limiar",
    sport: "CORRIDA",
    method: "PACE",
    zoneCount: 5,
    zones: [
      { number: 1, name: "Regenerativo",   color: "#4ade80", minPct: 120, maxPct: 999, description: "> 120% pace limiar (muito fácil)" },
      { number: 2, name: "Leve",           color: "#38bdf8", minPct: 110, maxPct: 120, description: "110-120% pace limiar" },
      { number: 3, name: "Moderado",       color: "#a78bfa", minPct: 105, maxPct: 110, description: "105-110% pace limiar" },
      { number: 4, name: "Limiar",         color: "#fb923c", minPct: 100, maxPct: 105, description: "100-105% pace limiar" },
      { number: 5, name: "VO2máx / Pista", color: "#f87171", minPct: 85,  maxPct: 100, description: "< 100% pace limiar" },
    ],
  },
  {
    name: "Ciclismo 7 Zonas (FTP)",
    sport: "CICLISMO",
    method: "FTP",
    zoneCount: 7,
    zones: [
      { number: 1, name: "Recuperação Ativa",      color: "#4ade80", minPct: 0,   maxPct: 55,  rpeRange: [1,2],  description: "< 55% FTP" },
      { number: 2, name: "Resistência",            color: "#38bdf8", minPct: 55,  maxPct: 75,  rpeRange: [2,3],  description: "55-75% FTP" },
      { number: 3, name: "Ritmo/Tempo",            color: "#34d399", minPct: 75,  maxPct: 90,  rpeRange: [4,5],  description: "75-90% FTP" },
      { number: 4, name: "Limiar Lactato",         color: "#fb923c", minPct: 90,  maxPct: 105, rpeRange: [6,7],  description: "90-105% FTP" },
      { number: 5, name: "VO2máx",                 color: "#f87171", minPct: 105, maxPct: 120, rpeRange: [7,8],  description: "105-120% FTP" },
      { number: 6, name: "Cap. Anaeróbica",        color: "#ef4444", minPct: 120, maxPct: 150, rpeRange: [9,9],  description: "120-150% FTP" },
      { number: 7, name: "Potência Neuromuscular", color: "#dc2626", minPct: 150, maxPct: 999, rpeRange: [10,10], description: "> 150% FTP" },
    ],
  },
  {
    name: "Ciclismo FC Limiar",
    sport: "CICLISMO",
    method: "LIMIAR",
    zoneCount: 5,
    zones: [
      { number: 1, name: "Recuperação",  color: "#4ade80", minPct: 0,   maxPct: 80,  description: "< 80% FC Limiar" },
      { number: 2, name: "Aeróbico",    color: "#38bdf8", minPct: 80,  maxPct: 87,  description: "80-87% FC Limiar" },
      { number: 3, name: "Tempo",       color: "#a78bfa", minPct: 87,  maxPct: 93,  description: "87-93% FC Limiar" },
      { number: 4, name: "Limiar",      color: "#fb923c", minPct: 93,  maxPct: 100, description: "93-100% FC Limiar" },
      { number: 5, name: "Anaeróbico", color: "#f87171", minPct: 100, maxPct: 115, description: "> FC Limiar" },
    ],
  },
  {
    name: "Natação 5 Zonas (Pace)",
    sport: "NATACAO",
    method: "PACE",
    zoneCount: 5,
    zones: [
      { number: 1, name: "Recuperação",          color: "#4ade80", minPct: 115, maxPct: 999, description: "Fácil / técnica" },
      { number: 2, name: "Base Aeróbica",        color: "#38bdf8", minPct: 108, maxPct: 115, description: "Longo e aeróbico" },
      { number: 3, name: "Desenvolvimento",      color: "#a78bfa", minPct: 103, maxPct: 108, description: "Desenvolvimento aeróbico" },
      { number: 4, name: "Limiar Anaeróbico",   color: "#fb923c", minPct: 100, maxPct: 103, description: "Pace limiar de natação (CSS)" },
      { number: 5, name: "VO2máx / Competição", color: "#f87171", minPct: 90,  maxPct: 100, description: "Ritmo de prova" },
    ],
  },
  // ── Ciclismo — Potência (FTP) ─────────────────────────────────────────────
  {
    name: "Ciclismo 7 Zonas — Potência (FTP)",
    sport: "CICLISMO",
    method: "FTP",
    zoneCount: 7,
    zones: [
      { number: 1, name: "Recuperação Ativa",      color: "#4ade80", minPct: 0,   maxPct: 55,  rpeRange: [1,2],  description: "< 55% FTP — recuperação muito fácil" },
      { number: 2, name: "Resistência",            color: "#38bdf8", minPct: 55,  maxPct: 75,  rpeRange: [2,3],  description: "55–75% FTP — base aeróbica longa" },
      { number: 3, name: "Tempo / Sweet Spot",     color: "#34d399", minPct: 75,  maxPct: 90,  rpeRange: [4,5],  description: "75–90% FTP — tempo e sweet spot" },
      { number: 4, name: "Limiar de Lactato",      color: "#fb923c", minPct: 90,  maxPct: 105, rpeRange: [6,7],  description: "90–105% FTP — esforço de limiar" },
      { number: 5, name: "VO2máx",                 color: "#f87171", minPct: 105, maxPct: 120, rpeRange: [7,8],  description: "105–120% FTP — intervalados curtos" },
      { number: 6, name: "Cap. Anaeróbica",        color: "#ef4444", minPct: 120, maxPct: 150, rpeRange: [9,9],  description: "120–150% FTP — sprints curtos" },
      { number: 7, name: "Potência Neuromuscular", color: "#dc2626", minPct: 150, maxPct: 999, rpeRange: [10,10], description: "> 150% FTP — sprints máximos" },
    ],
  },
  {
    name: "Ciclismo 5 Zonas — FC Limiar",
    sport: "CICLISMO",
    method: "LIMIAR",
    zoneCount: 5,
    zones: [
      { number: 1, name: "Recuperação",   color: "#4ade80", minPct: 0,   maxPct: 80,  description: "< 80% FC Limiar" },
      { number: 2, name: "Aeróbico",     color: "#38bdf8", minPct: 80,  maxPct: 87,  description: "80–87% FC Limiar" },
      { number: 3, name: "Tempo",        color: "#a78bfa", minPct: 87,  maxPct: 93,  description: "87–93% FC Limiar" },
      { number: 4, name: "Limiar",       color: "#fb923c", minPct: 93,  maxPct: 100, description: "93–100% FC Limiar" },
      { number: 5, name: "Anaeróbico",   color: "#f87171", minPct: 100, maxPct: 115, description: "> FC Limiar" },
    ],
  },
  // ── Natação — CSS (Pace) ──────────────────────────────────────────────────
  {
    name: "Natação 5 Zonas (CSS Pace)",
    sport: "NATACAO",
    method: "PACE",
    zoneCount: 5,
    zones: [
      { number: 1, name: "Recuperação",          color: "#4ade80", minPct: 115, maxPct: 999, description: "≥ 115% CSS — fácil / técnica" },
      { number: 2, name: "Base Aeróbica",        color: "#38bdf8", minPct: 108, maxPct: 115, description: "108–115% CSS — ritmo longo" },
      { number: 3, name: "Desenvolvimento",      color: "#a78bfa", minPct: 103, maxPct: 108, description: "103–108% CSS — desenvolvimento aeróbico" },
      { number: 4, name: "Limiar / CSS",         color: "#fb923c", minPct: 100, maxPct: 103, description: "100–103% CSS — ritmo CSS" },
      { number: 5, name: "VO2máx / Prova",       color: "#f87171", minPct: 90,  maxPct: 100, description: "90–100% CSS — sprint e prova" },
    ],
  },
  {
    name: "Natação 5 Zonas (RPE)",
    sport: "NATACAO",
    method: "RPE",
    zoneCount: 5,
    zones: [
      { number: 1, name: "Recuperação Ativa",    color: "#4ade80", minPct: 0, maxPct: 0, rpeRange: [1,3],  description: "Técnica e recuperação" },
      { number: 2, name: "Resistência",          color: "#38bdf8", minPct: 0, maxPct: 0, rpeRange: [4,5],  description: "Ritmo de longa distância" },
      { number: 3, name: "Desenvolvimento",      color: "#a78bfa", minPct: 0, maxPct: 0, rpeRange: [5,6],  description: "Ritmo progressivo" },
      { number: 4, name: "Limiar",               color: "#fb923c", minPct: 0, maxPct: 0, rpeRange: [7,8],  description: "Séries de limiar" },
      { number: 5, name: "Sprint / VO2máx",      color: "#f87171", minPct: 0, maxPct: 0, rpeRange: [9,10], description: "Sprints e tiros máximos" },
    ],
  },
  // ── Força ─────────────────────────────────────────────────────────────────
  {
    name: "Força — Zonas por RPE",
    sport: "FORCA",
    method: "RPE",
    zoneCount: 5,
    zones: [
      { number: 1, name: "Ativação / Aquecimento", color: "#4ade80", minPct: 0, maxPct: 0, rpeRange: [1,4],  description: "Mobilidade e ativação" },
      { number: 2, name: "Hipertrofia Leve",       color: "#38bdf8", minPct: 0, maxPct: 0, rpeRange: [5,6],  description: "Séries de resistência muscular" },
      { number: 3, name: "Hipertrofia",            color: "#a78bfa", minPct: 0, maxPct: 0, rpeRange: [7,8],  description: "Séries para hipertrofia" },
      { number: 4, name: "Força Máxima",           color: "#fb923c", minPct: 0, maxPct: 0, rpeRange: [8,9],  description: "Cargas elevadas, baixas reps" },
      { number: 5, name: "Potência / Pico",        color: "#f87171", minPct: 0, maxPct: 0, rpeRange: [9,10], description: "Explosão máxima" },
    ],
  },
];
