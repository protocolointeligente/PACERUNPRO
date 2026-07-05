/**
 * /loja (PlanProduct store) is now merged into /marketplace (MarketplaceProduct store).
 * Individual plan pages at /loja/[slug] continue to work for direct links.
 */
import { redirect } from "next/navigation";

export default function LojaPage() {
  redirect("/marketplace");
}
