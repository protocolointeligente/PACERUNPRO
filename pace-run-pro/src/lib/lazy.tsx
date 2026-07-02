/**
 * Dynamic import helpers — avoids repeating next/dynamic boilerplate.
 * Usage:
 *   const HeavyChart = lazyClient(() => import("@/components/heavy-chart"), "HeavyChart");
 */

import dynamic from "next/dynamic";
import type { ComponentType } from "react";

type DynamicOptions = {
  ssr?: boolean;
  loading?: () => React.ReactNode;
};

/**
 * Load a client-only component lazily (no SSR).
 * The `displayName` param is required so React DevTools show a sensible label.
 */
export function lazyClient<P extends object>(
  loader: () => Promise<{ default: ComponentType<P> } | ComponentType<P>>,
  displayName: string,
  opts: DynamicOptions = {},
): ComponentType<P> {
  const Component = dynamic(
    loader as Parameters<typeof dynamic>[0],
    {
      ssr: opts.ssr ?? false,
      loading: opts.loading as never,
    },
  );
  Component.displayName = displayName;
  return Component as ComponentType<P>;
}

/**
 * Load a component with SSR support (for server-renderable heavy components).
 */
export function lazySSR<P extends object>(
  loader: () => Promise<{ default: ComponentType<P> } | ComponentType<P>>,
  displayName: string,
  opts: Omit<DynamicOptions, "ssr"> = {},
): ComponentType<P> {
  return lazyClient(loader, displayName, { ...opts, ssr: true });
}
