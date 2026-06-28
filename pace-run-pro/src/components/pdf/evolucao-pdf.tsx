import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";

Font.registerHyphenationCallback((word) => [word]);

const PRIMARY = "#C6F24E";
const BG = "#0A0C0F";
const CARD = "#13161B";
const TEXT = "#F2F0EB";
const MUTED = "#6B7280";
const BORDER = "#1F2937";

const styles = StyleSheet.create({
  page: { backgroundColor: BG, color: TEXT, fontFamily: "Helvetica", padding: 32, fontSize: 9 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: BORDER },
  logo: { fontSize: 18, fontFamily: "Helvetica-Bold", color: PRIMARY, letterSpacing: 1 },
  headerRight: { alignItems: "flex-end" },
  athleteName: { fontSize: 14, fontFamily: "Helvetica-Bold", color: TEXT },
  subtitle: { fontSize: 8, color: MUTED, marginTop: 2 },
  row: { flexDirection: "row", gap: 10, marginBottom: 10 },
  card: { flex: 1, backgroundColor: CARD, borderRadius: 6, padding: 10, borderWidth: 1, borderColor: BORDER },
  cardFull: { flex: 1, backgroundColor: CARD, borderRadius: 6, padding: 10, borderWidth: 1, borderColor: BORDER, marginBottom: 10 },
  sectionTitle: { fontSize: 7, fontFamily: "Helvetica-Bold", color: MUTED, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 },
  big: { fontSize: 22, fontFamily: "Helvetica-Bold", color: PRIMARY },
  label: { fontSize: 8, color: MUTED, marginTop: 2 },
  tableHeader: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: BORDER, paddingBottom: 4, marginBottom: 4 },
  th: { fontSize: 7, fontFamily: "Helvetica-Bold", color: MUTED, textTransform: "uppercase", letterSpacing: 0.5 },
  tr: { flexDirection: "row", paddingVertical: 3, borderBottomWidth: 1, borderBottomColor: BORDER },
  td: { fontSize: 8, color: TEXT },
  col1: { flex: 2 },
  col2: { flex: 1, textAlign: "right" },
  barContainer: { height: 6, backgroundColor: "#1F2937", borderRadius: 3, marginTop: 2 },
  bar: { height: 6, backgroundColor: PRIMARY, borderRadius: 3 },
  footer: { marginTop: 16, paddingTop: 8, borderTopWidth: 1, borderTopColor: BORDER, flexDirection: "row", justifyContent: "space-between" },
  footerText: { fontSize: 7, color: MUTED },
  pill: { backgroundColor: PRIMARY + "1A", borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2, marginRight: 4 },
  pillText: { fontSize: 7, color: PRIMARY, fontFamily: "Helvetica-Bold" },
});

function paceLabel(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, "0")}/km`;
}

function avg(arr: number[]) {
  if (!arr.length) return 0;
  return Math.round(arr.reduce((a, b) => a + b, 0) / arr.length);
}

interface EvolucaoData {
  weeklyVolume: { label: string; km: number }[];
  avgPace: { label: string; paceSec: number }[];
  avgHr: { label: string; hr: number }[];
  trainingLoad: { label: string; load: number }[];
  weightHistory: { label: string; kg: number }[];
  vo2History: { label: string; vo2: number }[];
  races: { distance: string; date: string; time: string; pace: string }[];
  checkins: { date: string; rpe: number; sleep: number; fatigue: number; pain: number; mood: number }[];
}

export interface EvolucaoPDFProps {
  athleteName: string;
  generatedAt: string;
  data: EvolucaoData;
  selectedVars: string[];
}

export function EvolucaoPDF({ athleteName, generatedAt, data, selectedVars }: EvolucaoPDFProps) {
  const include = (key: string) => selectedVars.includes(key);

  const totalKm = data.weeklyVolume.reduce((a, b) => a + b.km, 0);
  const maxKm = Math.max(...data.weeklyVolume.map((w) => w.km), 1);
  const avgPaceSec = avg(data.avgPace.map((p) => p.paceSec));
  const avgHrVal = avg(data.avgHr.map((h) => h.hr));
  const avgSleep = avg(data.checkins.map((c) => c.sleep));
  const avgFatigue = avg(data.checkins.map((c) => c.fatigue));
  const avgMood = avg(data.checkins.map((c) => c.mood));
  const latestVo2 = data.vo2History.length ? data.vo2History[data.vo2History.length - 1].vo2 : null;
  const latestWeight = data.weightHistory.length ? data.weightHistory[data.weightHistory.length - 1].kg : null;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.logo}>PACE RUN PRO</Text>
            <Text style={[styles.subtitle, { marginTop: 4 }]}>Relatório de Evolução — Últimas 12 semanas</Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.athleteName}>{athleteName}</Text>
            <Text style={styles.subtitle}>Gerado em {generatedAt}</Text>
          </View>
        </View>

        {/* Summary KPIs */}
        <View style={styles.row}>
          {include("volume") && (
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Volume total</Text>
              <Text style={styles.big}>{totalKm.toFixed(0)} km</Text>
              <Text style={styles.label}>12 semanas</Text>
            </View>
          )}
          {include("pace") && avgPaceSec > 0 && (
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Ritmo médio</Text>
              <Text style={styles.big}>{paceLabel(avgPaceSec)}</Text>
              <Text style={styles.label}>Média ponderada</Text>
            </View>
          )}
          {include("fc") && avgHrVal > 0 && (
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>FC média</Text>
              <Text style={styles.big}>{avgHrVal} bpm</Text>
              <Text style={styles.label}>Média dos treinos</Text>
            </View>
          )}
          {include("vo2") && latestVo2 && (
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>VO₂máx</Text>
              <Text style={styles.big}>{latestVo2}</Text>
              <Text style={styles.label}>ml/kg/min</Text>
            </View>
          )}
        </View>

        {/* Wellness KPIs */}
        {include("wellness") && data.checkins.length > 0 && (
          <View style={styles.row}>
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Sono médio</Text>
              <Text style={styles.big}>{avgSleep}/10</Text>
              <Text style={styles.label}>Check-ins recentes</Text>
            </View>
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Fadiga média</Text>
              <Text style={styles.big}>{avgFatigue}/10</Text>
              <Text style={styles.label}>Check-ins recentes</Text>
            </View>
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Humor médio</Text>
              <Text style={styles.big}>{avgMood}/10</Text>
              <Text style={styles.label}>Check-ins recentes</Text>
            </View>
            {latestWeight && include("peso") && (
              <View style={styles.card}>
                <Text style={styles.sectionTitle}>Peso atual</Text>
                <Text style={styles.big}>{latestWeight} kg</Text>
                <Text style={styles.label}>Última medição</Text>
              </View>
            )}
          </View>
        )}

        {/* Weekly volume bars */}
        {include("volume") && data.weeklyVolume.length > 0 && (
          <View style={styles.cardFull}>
            <Text style={styles.sectionTitle}>Volume semanal (km)</Text>
            {data.weeklyVolume.slice(-8).map((w) => (
              <View key={w.label} style={{ flexDirection: "row", alignItems: "center", marginBottom: 5 }}>
                <Text style={[styles.td, { width: 40, color: MUTED }]}>{w.label}</Text>
                <View style={[styles.barContainer, { flex: 1, marginLeft: 8 }]}>
                  <View style={[styles.bar, { width: `${(w.km / maxKm) * 100}%` }]} />
                </View>
                <Text style={[styles.td, { width: 36, textAlign: "right", color: PRIMARY }]}>{w.km.toFixed(1)}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Races table */}
        {include("provas") && data.races.length > 0 && (
          <View style={styles.cardFull}>
            <Text style={styles.sectionTitle}>Provas recentes</Text>
            <View style={styles.tableHeader}>
              <Text style={[styles.th, styles.col1]}>Distância</Text>
              <Text style={[styles.th, { flex: 1.5 }]}>Data</Text>
              <Text style={[styles.th, styles.col2]}>Tempo</Text>
            </View>
            {data.races.map((r, i) => (
              <View key={i} style={styles.tr}>
                <Text style={[styles.td, styles.col1]}>{r.distance}</Text>
                <Text style={[styles.td, { flex: 1.5 }]}>{r.date}</Text>
                <Text style={[styles.td, styles.col2, { color: PRIMARY }]}>{r.time}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Check-in table */}
        {include("wellness") && data.checkins.length > 0 && (
          <View style={styles.cardFull}>
            <Text style={styles.sectionTitle}>Check-ins recentes</Text>
            <View style={styles.tableHeader}>
              <Text style={[styles.th, styles.col1]}>Data</Text>
              <Text style={[styles.th, styles.col2]}>RPE</Text>
              <Text style={[styles.th, styles.col2]}>Sono</Text>
              <Text style={[styles.th, styles.col2]}>Fadiga</Text>
              <Text style={[styles.th, styles.col2]}>Humor</Text>
            </View>
            {data.checkins.slice(0, 8).map((c, i) => (
              <View key={i} style={styles.tr}>
                <Text style={[styles.td, styles.col1, { color: MUTED }]}>{c.date}</Text>
                <Text style={[styles.td, styles.col2]}>{c.rpe || "—"}</Text>
                <Text style={[styles.td, styles.col2]}>{c.sleep || "—"}</Text>
                <Text style={[styles.td, styles.col2]}>{c.fatigue || "—"}</Text>
                <Text style={[styles.td, styles.col2]}>{c.mood || "—"}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>PACE RUN PRO · pacerunpro.com.br</Text>
          <View style={{ flexDirection: "row" }}>
            {selectedVars.map((v) => (
              <View key={v} style={styles.pill}><Text style={styles.pillText}>{v}</Text></View>
            ))}
          </View>
        </View>
      </Page>
    </Document>
  );
}
