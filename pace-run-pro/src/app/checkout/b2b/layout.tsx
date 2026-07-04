import type { ReactNode } from "react";

// No shared nav for the checkout flow — the page renders its own minimal nav.
export default function B2BCheckoutLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
