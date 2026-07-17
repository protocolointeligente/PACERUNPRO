import { legacyAthleteApi } from "../_legacy";

export function GET() {
  return legacyAthleteApi("/api/atleta/training-load");
}
