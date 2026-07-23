import { describe, expect, it } from "vitest";
import { SHARED_COMPONENTS, SHARED_COMPONENT_STATE_CASES, VISUAL_MODES, VIEWPORTS } from "@/lib/shared-component-state-matrix";

describe("shared component visual matrix", () => {
  it("covers every component in every theme, viewport, and interaction state", () => {
    expect(SHARED_COMPONENT_STATE_CASES).toHaveLength(SHARED_COMPONENTS.length * 2 * 2 * 4);
    for (const component of SHARED_COMPONENTS) {
      for (const mode of VISUAL_MODES) {
        for (const viewport of VIEWPORTS) {
          expect(SHARED_COMPONENT_STATE_CASES.filter((item) => item.component === component && item.mode === mode && item.viewport === viewport)).toHaveLength(4);
        }
      }
    }
  });
});
