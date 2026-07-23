export const SHARED_COMPONENTS = ["Button", "Badge", "Card", "cn"] as const;
export const VISUAL_MODES = ["light", "dark"] as const;
export const INTERACTION_STATES = ["default", "hover", "focus", "disabled"] as const;
export const VIEWPORTS = ["mobile", "desktop"] as const;

export type SharedComponent = (typeof SHARED_COMPONENTS)[number];
export type VisualMode = (typeof VISUAL_MODES)[number];
export type InteractionState = (typeof INTERACTION_STATES)[number];
export type Viewport = (typeof VIEWPORTS)[number];

export const SHARED_COMPONENT_STATE_CASES = SHARED_COMPONENTS.flatMap((component) =>
  VISUAL_MODES.flatMap((mode) =>
    VIEWPORTS.flatMap((viewport) =>
      INTERACTION_STATES.map((state) => ({ component, mode, viewport, state })),
    ),
  ),
);

