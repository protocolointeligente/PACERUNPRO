import { Badge } from "@/components/ui/badge";
import { VoucherManager } from "@/components/vouchers/voucher-manager";

export default function CoachVouchersPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <Badge variant="primary" className="mb-2">Promoções</Badge>
        <h1 className="font-display text-2xl font-bold text-text sm:text-3xl">Vouchers de desconto</h1>
        <p className="mt-1 text-sm text-text-muted">
          Crie cupons para presentear ou divulgar seus planos — desconto percentual ou meses grátis.
        </p>
      </div>

      <VoucherManager />
    </div>
  );
}
