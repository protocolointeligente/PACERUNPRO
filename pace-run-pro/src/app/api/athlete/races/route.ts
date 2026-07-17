import { legacyAthleteApi } from "../_legacy";

export function GET() {
  return legacyAthleteApi("/api/atleta/races");
}

export function POST() {
  return legacyAthleteApi("/api/atleta/races");
}
