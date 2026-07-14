"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Camera, X } from "lucide-react";
import { ParticleBurst } from "@/components/particle-burst";

interface WorkoutShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  metrics: {
    distance?: number;
    pace?: string;
    duration: string;
    calories?: number;
    elevation?: number;
    avgHr?: number;
    sessionName?: string;
    exerciseCount?: number;
  };
  activityType: "corrida" | "forca" | "outro";
  isPersonalRecord?: boolean;
}

export function WorkoutShareModal({
  isOpen,
  onClose,
  metrics,
  activityType,
  isPersonalRecord = false,
}: WorkoutShareModalProps) {
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);
  const [caption, setCaption] = useState("");

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result;
      if (typeof result === "string") setPhotoDataUrl(result);
    };
    reader.readAsDataURL(file);
  }

  function drawOverlay(
    ctx: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    statFont: string,
    resolve: (b: Blob | null) => void
  ) {
    const darkGrad = ctx.createLinearGradient(0, 900, 0, 1920);
    darkGrad.addColorStop(0, "rgba(0,0,0,0)");
    darkGrad.addColorStop(1, "rgba(0,0,0,0.85)");
    ctx.fillStyle = darkGrad;
    ctx.fillRect(0, 0, 1080, 1920);

    ctx.fillStyle = "#ffffff";
    ctx.font = `800 180px ${statFont}`;
    ctx.textAlign = "center";
    const mainText = metrics.distance
      ? `${metrics.distance.toFixed(2).replace(".", ",")} km`
      : metrics.sessionName ?? "Treino concluído";
    ctx.fillText(mainText, 540, 1100);

    ctx.font = `700 72px ${statFont}`;
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    const subParts = [
      metrics.pace && `${metrics.pace} /km`,
      metrics.duration,
      metrics.avgHr && `${metrics.avgHr} bpm`,
      metrics.elevation && `↑${metrics.elevation}m`,
    ].filter(Boolean);
    ctx.fillText(subParts.join("  ·  "), 540, 1220);

    if (isPersonalRecord) {
      ctx.font = `800 56px ${statFont}`;
      ctx.fillStyle = "rgba(255,106,26,0.95)";
      ctx.fillText("🎉 NOVO RECORDE PESSOAL", 540, 1320);
    }

    ctx.font = "bold 52px Arial";
    ctx.fillStyle = "rgba(255,106,26,0.95)";
    ctx.fillText("⚡ PACE RUN PRO", 540, 1520);

    canvas.toBlob(resolve, "image/png");
  }

  async function generateShareImage(): Promise<Blob | null> {
    if (typeof document !== "undefined" && "fonts" in document) {
      await document.fonts.ready;
    }
    const statFont =
      getComputedStyle(document.documentElement)
        .getPropertyValue("--font-stat")
        .trim() || "Arial";

    return new Promise((resolve) => {
      const canvas = document.createElement("canvas");
      canvas.width = 1080;
      canvas.height = 1920;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(null);
        return;
      }

      if (photoDataUrl) {
        const img = new Image();
        img.onload = () => {
          ctx.drawImage(img, 0, 0, 1080, 1920);
          drawOverlay(ctx, canvas, statFont, resolve);
        };
        img.src = photoDataUrl;
      } else {
        const grad = ctx.createLinearGradient(0, 0, 1080, 1920);
        grad.addColorStop(0, "#14171C");
        grad.addColorStop(0.5, "#0A0C0F");
        grad.addColorStop(1, "#050608");
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 1080, 1920);
        drawOverlay(ctx, canvas, statFont, resolve);
      }
    });
  }

  async function handleSaveToGallery() {
    const blob = await generateShareImage();
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `treino-${Date.now()}.png`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleShare() {
    const blob = await generateShareImage();
    if (!blob) return;
    const file = new File([blob], `treino-${Date.now()}.png`, {
      type: "image/png",
    });
    if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: "Treino concluído!" });
      } catch {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = file.name;
        a.click();
        URL.revokeObjectURL(url);
      }
    } else {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = file.name;
      a.click();
      URL.revokeObjectURL(url);
    }
  }

  function handlePostToCommunity() {
    const post = {
      id: `post-${Date.now()}`,
      athleteName: "Você",
      athleteAvatar: "EU",
      avatarColor: "bg-primary text-[#0A0C0F]",
      timeAgo: "agora mesmo",
      caption:
        caption ||
        `${activityType === "corrida" ? "Treino de corrida" : "Treino de força"} concluído! 💪`,
      photoGradient:
        "linear-gradient(135deg, #14171C 0%, #0A0C0F 55%, #1A1E24 100%)",
      photoDataUrl: photoDataUrl || undefined,
      metrics: {
        distance: metrics.distance ?? 0,
        pace: metrics.pace ?? "—",
        duration: metrics.duration,
        elevation: metrics.elevation,
        calories: metrics.calories,
        avgHr: metrics.avgHr,
      },
      likes: 0,
      comments: [],
    };
    localStorage.setItem("newActivityPost", JSON.stringify(post));
    onClose();
  }

  const keyMetrics: { label: string; value: string }[] = [];
  if (metrics.distance) {
    keyMetrics.push({
      label: "Distância",
      value: `${metrics.distance.toFixed(2).replace(".", ",")} km`,
    });
  }
  if (metrics.pace) {
    keyMetrics.push({ label: "Pace", value: `${metrics.pace} /km` });
  }
  keyMetrics.push({ label: "Duração", value: metrics.duration });
  if (metrics.avgHr) {
    keyMetrics.push({ label: "FC média", value: `${metrics.avgHr} bpm` });
  }
  if (metrics.elevation && keyMetrics.length < 4) {
    keyMetrics.push({ label: "Elevação", value: `↑${metrics.elevation}m` });
  }
  if (metrics.exerciseCount && keyMetrics.length < 4) {
    keyMetrics.push({ label: "Exercícios", value: String(metrics.exerciseCount) });
  }
  if (metrics.calories && keyMetrics.length < 4) {
    keyMetrics.push({ label: "kcal", value: String(metrics.calories) });
  }
  const displayMetrics = keyMetrics.slice(0, 4);

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.80)" }}
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="relative w-full max-w-md overflow-y-auto rounded-2xl bg-card"
            style={{ maxHeight: "90vh" }}
            onClick={(e) => e.stopPropagation()}
          >
            {isPersonalRecord && <ParticleBurst />}

            <button
              onClick={onClose}
              className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-card-hover text-text-muted transition-colors hover:text-text"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="p-5 pb-2">
              <div className="flex items-center gap-3">
                <span className={`text-3xl ${isPersonalRecord ? "animate-glow-pulse rounded-full" : ""}`}>
                  {isPersonalRecord ? "🎉" : "🏆"}
                </span>
                <div>
                  <h2 className="font-bold text-text text-lg leading-tight">
                    {isPersonalRecord ? "Novo recorde pessoal!" : "Treino concluído!"}
                  </h2>
                  <p className="text-sm text-text-muted">
                    {isPersonalRecord ? "Você superou seu melhor tempo 🚀" : "Registrar sua conquista"}
                  </p>
                </div>
              </div>

              <div className={`mt-4 grid gap-2 ${displayMetrics.length > 3 ? "grid-cols-4" : "grid-cols-3"}`}>
                {displayMetrics.map((m) => (
                  <div
                    key={m.label}
                    className="flex flex-col items-center rounded-xl border border-border bg-background/50 py-2.5 px-1"
                  >
                    <span className="font-stat text-sm font-bold text-text leading-tight">
                      {m.value}
                    </span>
                    <span className="text-[10px] text-text-muted mt-0.5 text-center">
                      {m.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="px-5 pt-3">
              <div
                className="relative w-full overflow-hidden rounded-xl"
                style={{
                  aspectRatio: "9/16",
                  maxHeight: "400px",
                }}
              >
                <div
                  className="absolute inset-0"
                  style={{
                    background: photoDataUrl
                      ? undefined
                      : "linear-gradient(160deg, #14171C 0%, #0A0C0F 100%)",
                  }}
                >
                  {photoDataUrl && (
                    // eslint-disable-next-line @next/next/no-img-element -- data URL gerada via canvas, sem ganho de otimização do next/image
                    <img
                      src={photoDataUrl}
                      alt="Foto do treino"
                      className="h-full w-full object-cover"
                    />
                  )}
                </div>

                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      "linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 60%)",
                  }}
                />

                <div className="absolute top-3 left-3 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-[#0A0C0F]">
                  EU
                </div>

                <div className="absolute bottom-0 left-0 right-0 p-4 text-center">
                  {isPersonalRecord && (
                    <p className="mb-1 font-stat text-xs font-extrabold uppercase tracking-wider text-primary">
                      🎉 Novo recorde pessoal
                    </p>
                  )}
                  {metrics.distance ? (
                    <p className="font-stat text-3xl font-extrabold text-white leading-tight">
                      {metrics.distance.toFixed(2).replace(".", ",")} km
                    </p>
                  ) : (
                    <p className="font-stat text-2xl font-extrabold text-white leading-tight">
                      {metrics.sessionName ?? "Treino concluído"}
                    </p>
                  )}
                  <p className="mt-1 font-stat text-sm font-semibold text-white/80">
                    {[metrics.pace && `${metrics.pace} /km`, metrics.duration]
                      .filter(Boolean)
                      .join("  ·  ")}
                  </p>
                  <p className="mt-2 text-xs font-bold text-primary">
                    ⚡ PACE RUN PRO
                  </p>
                </div>

                {!photoDataUrl && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <label
                      htmlFor="photo-upload"
                      className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-5 py-4 text-white backdrop-blur-sm transition-colors hover:bg-white/20"
                    >
                      <Camera className="h-6 w-6" />
                      <span className="text-sm font-medium">
                        Adicionar foto
                      </span>
                    </label>
                    <input
                      id="photo-upload"
                      type="file"
                      accept="image/*"
                      capture="environment"
                      className="hidden"
                      onChange={handlePhotoChange}
                    />
                  </div>
                )}

                {photoDataUrl && (
                  <div className="absolute top-3 right-3">
                    <label
                      htmlFor="photo-upload-change"
                      className="flex cursor-pointer items-center gap-1.5 rounded-lg bg-black/50 px-2.5 py-1.5 text-xs text-white backdrop-blur-sm"
                    >
                      <Camera className="h-3.5 w-3.5" />
                      Trocar
                    </label>
                    <input
                      id="photo-upload-change"
                      type="file"
                      accept="image/*"
                      capture="environment"
                      className="hidden"
                      onChange={handlePhotoChange}
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="px-5 pt-3">
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Como foi o treino? 🏃"
                rows={2}
                className="w-full resize-none rounded-xl border border-border bg-background/50 px-3 py-2.5 text-sm text-text placeholder-text-muted outline-none focus:border-primary/50"
              />
            </div>

            <div className="flex flex-col gap-2.5 p-5 pt-3">
              <button
                onClick={handleSaveToGallery}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-card-hover py-3 text-sm font-semibold text-text transition-colors hover:border-primary/40 hover:bg-primary/10"
              >
                <span>📥</span> Salvar na galeria
              </button>
              <button
                onClick={handleShare}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-card-hover py-3 text-sm font-semibold text-text transition-colors hover:border-primary/40 hover:bg-primary/10"
              >
                <span>📤</span> Compartilhar
              </button>
              <button
                onClick={handlePostToCommunity}
                className="gradient-primary flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold text-[#0A0C0F]"
                style={{
                  background:
                    "linear-gradient(135deg, #D4FF5E 0%, #C6F24E 55%, #A6D43B 100%)",
                }}
              >
                <span>🚀</span> Postar na comunidade
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
