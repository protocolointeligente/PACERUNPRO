// A single executable step in the player (expanded from blocks)
export type PlayerPhase = "WARMUP" | "WORK" | "RECOVERY" | "COOLDOWN" | "REST" | "TRANSITION";
export type PlayerTargetType = "PACE" | "HR" | "POWER" | "RPE" | "CSS" | "FREE";
export type PlayerDurationType = "TIME" | "DISTANCE" | "OPEN";

export interface PlayerStep {
  id: string;
  phase: PlayerPhase;
  sport: string; // "RUN" | "BIKE" | "SWIM" etc
  label: string;
  instruction: string;
  durationType: PlayerDurationType;
  durationSeconds: number; // 0 if OPEN
  distanceMeters: number;  // 0 if TIME
  targetType: PlayerTargetType;
  targetMin: number;  // pace sec/km, watts, hr bpm, etc.
  targetMax: number;
  targetUnit: string; // "sec/km" | "W" | "bpm" | "RPE" | "sec/100m"
  zone: string; // "Z1"-"Z5" or "CSS" etc.
  zoneColor: string; // hex color
  audioCueStart?: string;
  audioCueEnd?: string;
  countdownEnabled: boolean;
  autoAdvance: boolean;
  vibrationEnabled: boolean;
  repeatIndex?: number;   // which rep (0-based) this is
  repeatTotal?: number;   // total reps in this group
  groupLabel?: string;    // "Intervalo 3 de 8"
}

export interface PlayerSession {
  workoutId: string;
  workoutTitle: string;
  sport: string;
  steps: PlayerStep[];
  totalSteps: number;
  estimatedDurationSec: number;
}

export type ExecutionState = "idle" | "countdown" | "running" | "paused" | "completed";

export interface ExecutionStatus {
  state: ExecutionState;
  currentStepIndex: number;
  currentStep: PlayerStep | null;
  nextStep: PlayerStep | null;
  stepElapsedSec: number;
  stepRemainingPercent: number;
  totalElapsedSec: number;
  countdownValue: number | null; // 3, 2, 1, null
  completedStepCount: number;
  currentRep: number;
  totalReps: number;
  progressPercent: number;
}

export interface WorkoutCompletionData {
  workoutId: string;
  durationSec: number;
  completedSteps: number;
  totalSteps: number;
  rpe?: number;
  painScore?: number;
  feeling?: "great" | "good" | "normal" | "tired" | "bad";
  notes?: string;
  distanceMeters?: number;
  avgPaceSecPerKm?: number;
}

// Audio cue types
export type AudioCueType =
  | "countdown_beep"
  | "start_block"
  | "end_block"
  | "recovery_start"
  | "recovery_end"
  | "workout_complete"
  | "off_target_slow"
  | "off_target_fast"
  | "halfway"
  | "last_rep"
  | "final_minute";

// Voice preferences
export type VoiceMode = "silent" | "sound_only" | "voice_only" | "sound_and_voice";

export interface PlayerPreferences {
  voiceMode: VoiceMode;
  volume: number; // 0-1
  alertFrequency: "low" | "medium" | "high";
  countdownEnabled: boolean;
  vibrationEnabled: boolean;
}

export const DEFAULT_PLAYER_PREFERENCES: PlayerPreferences = {
  voiceMode: "sound_and_voice",
  volume: 0.8,
  alertFrequency: "medium",
  countdownEnabled: true,
  vibrationEnabled: true,
};
