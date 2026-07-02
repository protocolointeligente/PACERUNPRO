"use client";

import type { VoiceMode } from "./types";

const VOICE_CUES_PT: Record<string, string> = {
  prepare: "Prepare-se",
  three: "Três",
  two: "Dois",
  one: "Um",
  start: "Começar",
  recovery: "Recuperação",
  next_interval: "Próximo intervalo",
  last_rep: "Última repetição",
  workout_complete: "Treino concluído. Parabéns!",
  off_target_slow: "Você está acima do ritmo alvo. Acelere levemente.",
  off_target_fast: "Você está abaixo do ritmo alvo. Reduza levemente.",
  maintain_pace: "Mantenha o ritmo",
  reduce_intensity: "Reduza a intensidade",
  increase_pace: "Acelere levemente",
  halfway: "Metade do treino concluída",
  final_minute: "Último minuto",
  cooldown: "Início do desaquecimento",
};

export class VoiceCueEngine {
  private mode: VoiceMode = "sound_and_voice";
  private volume: number = 0.8;
  private rate: number = 1.1;
  private lastSpoken: Record<string, number> = {};
  private cooldownMs: number = 5000;

  setMode(mode: VoiceMode): void {
    this.mode = mode;
  }

  setVolume(vol: number): void {
    this.volume = Math.max(0, Math.min(1, vol));
  }

  private canSpeak(): boolean {
    return (
      typeof window !== "undefined" &&
      "speechSynthesis" in window &&
      (this.mode === "voice_only" || this.mode === "sound_and_voice")
    );
  }

  speak(cueKey: string, overrideCooldown = false): void {
    if (!this.canSpeak()) return;
    const now = Date.now();
    if (!overrideCooldown && this.lastSpoken[cueKey] && now - this.lastSpoken[cueKey] < this.cooldownMs) return;
    const text = VOICE_CUES_PT[cueKey] ?? cueKey;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "pt-BR";
    utterance.rate = this.rate;
    utterance.volume = this.volume;
    // Prefer female PT-BR voice if available
    const voices = window.speechSynthesis.getVoices();
    const ptVoice = voices.find((v) => v.lang.startsWith("pt") && v.name.toLowerCase().includes("female"))
      ?? voices.find((v) => v.lang.startsWith("pt"))
      ?? null;
    if (ptVoice) utterance.voice = ptVoice;
    window.speechSynthesis.cancel(); // avoid queue buildup
    window.speechSynthesis.speak(utterance);
    this.lastSpoken[cueKey] = now;
  }

  speakCountdown(value: 3 | 2 | 1): void {
    const keys: Record<number, string> = { 3: "three", 2: "two", 1: "one" };
    this.speak(keys[value], true);
  }

  speakCustom(text: string): void {
    if (!this.canSpeak()) return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "pt-BR";
    utterance.rate = this.rate;
    utterance.volume = this.volume;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  }

  cancel(): void {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  }
}
