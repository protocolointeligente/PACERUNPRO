"use client";

export interface GeoPoint {
  lat: number;
  lng: number;
  altM?: number;
  timestamp: number;
  accuracy?: number;
}

export interface LiveMetrics {
  distanceMeters: number;
  elapsedSec: number;
  currentPaceSecPerKm: number | null;  // null = no GPS / not moving
  avgPaceSecPerKm: number | null;
  currentSpeedMs: number | null;
  gpsStatus: "idle" | "requesting" | "active" | "denied" | "unsupported";
  lastPoint: GeoPoint | null;
  track: GeoPoint[];
}

type MetricsListener = (m: LiveMetrics) => void;

function haversineMeters(a: GeoPoint, b: GeoPoint): number {
  const R = 6371000;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);
  const c =
    sinLat * sinLat +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * sinLng * sinLng;
  return R * 2 * Math.atan2(Math.sqrt(c), Math.sqrt(1 - c));
}

const PACE_SMOOTH_WINDOW = 20; // seconds of smoothing for instant pace

export class LiveMetricsProvider {
  private listeners: MetricsListener[] = [];
  private metrics: LiveMetrics = {
    distanceMeters: 0,
    elapsedSec: 0,
    currentPaceSecPerKm: null,
    avgPaceSecPerKm: null,
    currentSpeedMs: null,
    gpsStatus: "idle",
    lastPoint: null,
    track: [],
  };

  private watchId: number | null = null;
  private timerInterval: ReturnType<typeof setInterval> | null = null;
  private startTime: number | null = null;
  private recentPoints: GeoPoint[] = []; // for smooth pace calculation

  // ── Start / Stop ──────────────────────────────────────────────────────────

  start(): void {
    if (typeof window === "undefined" || !("geolocation" in navigator)) {
      this.updateStatus("unsupported");
      this.startTimer();
      return;
    }

    this.updateStatus("requesting");
    this.startTime = Date.now();

    this.watchId = navigator.geolocation.watchPosition(
      (pos) => this.handlePosition(pos),
      (err) => {
        if (err.code === 1) this.updateStatus("denied");
        else this.updateStatus("unsupported");
        this.startTimer();
      },
      { enableHighAccuracy: true, maximumAge: 2000, timeout: 10000 }
    );

    this.startTimer();
  }

  stop(): void {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  destroy(): void {
    this.stop();
    this.listeners = [];
  }

  // ── Internal ──────────────────────────────────────────────────────────────

  private startTimer(): void {
    if (this.timerInterval) return;
    this.timerInterval = setInterval(() => {
      if (this.startTime) {
        this.metrics.elapsedSec = Math.round((Date.now() - this.startTime) / 1000);
        this.emit();
      }
    }, 1000);
  }

  private handlePosition(pos: GeolocationPosition): void {
    const point: GeoPoint = {
      lat: pos.coords.latitude,
      lng: pos.coords.longitude,
      altM: pos.coords.altitude ?? undefined,
      timestamp: pos.timestamp,
      accuracy: pos.coords.accuracy,
    };

    if (this.metrics.gpsStatus !== "active") {
      this.updateStatus("active");
    }

    const prev = this.metrics.lastPoint;
    if (prev) {
      const dist = haversineMeters(prev, point);
      // Filter jitter: ignore points < 2m or > 50m/s
      if (dist > 2) {
        this.metrics.distanceMeters += dist;
        this.metrics.track.push(point);
      }
    } else {
      this.metrics.track.push(point);
    }

    this.metrics.lastPoint = point;

    // Keep recent points for pace smoothing
    this.recentPoints.push(point);
    const cutoff = point.timestamp - PACE_SMOOTH_WINDOW * 1000;
    this.recentPoints = this.recentPoints.filter((p) => p.timestamp >= cutoff);

    // Calculate smooth pace from recent points
    if (this.recentPoints.length >= 2) {
      const oldest = this.recentPoints[0];
      const newest = this.recentPoints[this.recentPoints.length - 1];
      const dtSec = (newest.timestamp - oldest.timestamp) / 1000;
      let recentDist = 0;
      for (let i = 1; i < this.recentPoints.length; i++) {
        recentDist += haversineMeters(this.recentPoints[i - 1], this.recentPoints[i]);
      }
      if (recentDist > 5 && dtSec > 3) {
        const speedMs = recentDist / dtSec;
        this.metrics.currentSpeedMs = speedMs;
        this.metrics.currentPaceSecPerKm = speedMs > 0.1 ? 1000 / speedMs : null;
      }
    }

    // Average pace
    const totalSec = this.metrics.elapsedSec;
    if (this.metrics.distanceMeters > 10 && totalSec > 0) {
      this.metrics.avgPaceSecPerKm = (totalSec / this.metrics.distanceMeters) * 1000;
    }

    this.emit();
  }

  private updateStatus(status: LiveMetrics["gpsStatus"]): void {
    this.metrics.gpsStatus = status;
    this.emit();
  }

  private emit(): void {
    const snapshot = { ...this.metrics, track: this.metrics.track };
    this.listeners.forEach((l) => l(snapshot));
  }

  // ── Listeners ─────────────────────────────────────────────────────────────

  onMetrics(listener: MetricsListener): () => void {
    this.listeners.push(listener);
    return () => { this.listeners = this.listeners.filter((l) => l !== listener); };
  }

  getMetrics(): LiveMetrics { return { ...this.metrics }; }
}

// PaceAlertEngine lives in ./pace-alert-engine.ts (pure logic, importable server-side)
export { PaceAlertEngine } from "./pace-alert-engine";
export type { PaceAlertType, PaceAlert } from "./pace-alert-engine";
