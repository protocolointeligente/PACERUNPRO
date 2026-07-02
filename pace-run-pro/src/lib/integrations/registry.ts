import type { IProviderAdapter } from "@/lib/integrations/adapter";
import type { ProviderName } from "@/lib/integrations/types";
import { StravaAdapter } from "@/lib/integrations/adapters/strava.adapter";
import { GarminAdapter } from "@/lib/integrations/adapters/garmin.adapter";
import { PolarAdapter } from "@/lib/integrations/adapters/polar.adapter";
import { CorosAdapter } from "@/lib/integrations/adapters/coros.adapter";
import { SuuntoAdapter } from "@/lib/integrations/adapters/suunto.adapter";
import { AppleHealthAdapter } from "@/lib/integrations/adapters/apple-health.adapter";
import { GoogleFitAdapter } from "@/lib/integrations/adapters/google-fit.adapter";

class AdapterRegistry {
  private readonly adapters: Map<ProviderName, IProviderAdapter>;

  constructor() {
    this.adapters = new Map<ProviderName, IProviderAdapter>();
    this.adapters.set("STRAVA",      new StravaAdapter());
    this.adapters.set("GARMIN",      new GarminAdapter());
    this.adapters.set("POLAR",       new PolarAdapter());
    this.adapters.set("COROS",       new CorosAdapter());
    this.adapters.set("SUUNTO",      new SuuntoAdapter());
    this.adapters.set("APPLE_WATCH", new AppleHealthAdapter());
    this.adapters.set("GOOGLE_FIT",  new GoogleFitAdapter());
  }

  get(provider: ProviderName): IProviderAdapter {
    const adapter = this.adapters.get(provider);
    if (!adapter) throw new Error(`No adapter registered for provider: ${provider}`);
    return adapter;
  }

  has(provider: string): provider is ProviderName {
    return this.adapters.has(provider as ProviderName);
  }

  all(): IProviderAdapter[] {
    return [...this.adapters.values()];
  }

  /** Providers that support OAuth redirect flow */
  oauthProviders(): IProviderAdapter[] {
    return this.all().filter((a) => a.supportsOAuth);
  }

  /** Providers that require periodic polling */
  pollingProviders(): IProviderAdapter[] {
    return this.all().filter((a) => a.requiresPolling);
  }
}

const globalForRegistry = globalThis as unknown as { adapterRegistry?: AdapterRegistry };
export const adapterRegistry = globalForRegistry.adapterRegistry ?? new AdapterRegistry();
if (process.env.NODE_ENV !== "production") globalForRegistry.adapterRegistry = adapterRegistry;
