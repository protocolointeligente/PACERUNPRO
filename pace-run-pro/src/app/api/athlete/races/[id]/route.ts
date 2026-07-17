import { legacyAthleteApi } from "../../_legacy";

export function DELETE() {
  return legacyAthleteApi("/api/atleta/races/[id]");
}

export function PATCH() {
  return legacyAthleteApi("/api/atleta/races/[id]");
}
