import Link from "next/link";
import { redirect } from "next/navigation";
import { TicketPercent } from "lucide-react";
import { getSession } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function CoachVouchersPage() {
  const session = await getSession();
  if (!session?.user?.id) redirect("/login");

  const vouchers = await prisma.voucher.findMany({
    where: { createdById: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 30,
    select: {
      id: true,
      code: true,
      type: true,
      value: true,
      audience: true,
      maxUses: true,
      usedCount: true,
      expiresAt: true,
      active: true,
      note: true,
    },
  }).catch(() => []);

  const activeCount = vouchers.filter((voucher) => voucher.active).length;
  const usedCount = vouchers.reduce((sum, voucher) => sum + voucher.usedCount, 0);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Badge variant="primary">Vouchers</Badge>
          <h1 className="mt-3 font-display text-3xl font-bold text-text">Convites, testes e descontos</h1>
          <p className="mt-2 max-w-2xl text-sm text-text-muted">
            Controle vouchers criados por este usuário. Vouchers administrativos continuam no painel Super Admin.
          </p>
        </div>
        <Link href="/admin/vouchers" className={cn(buttonVariants({ variant: "secondary", size: "sm" }))}>
          Painel admin
        </Link>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <Metric label="Vouchers" value={String(vouchers.length)} />
        <Metric label="Ativos" value={String(activeCount)} />
        <Metric label="Usos" value={String(usedCount)} />
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="border-b border-border px-5 py-4">
            <h2 className="font-display text-lg font-bold text-text">Lista de vouchers</h2>
            <p className="text-sm text-text-muted">Útil para treinadores convidados, testes e campanhas isoladas.</p>
          </div>
          <div className="divide-y divide-border">
            {vouchers.length === 0 ? (
              <div className="px-5 py-10 text-sm text-text-muted">Nenhum voucher criado por este treinador.</div>
            ) : vouchers.map((voucher) => (
              <div key={voucher.id} className="grid gap-3 px-5 py-4 md:grid-cols-[1fr_auto_auto] md:items-center">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/12 text-primary">
                    <TicketPercent className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="font-semibold text-text">{voucher.code}</p>
                    <p className="text-xs text-text-muted">{voucher.note ?? `${voucher.type} · ${voucher.audience}`}</p>
                  </div>
                </div>
                <p className="text-sm text-text-muted">{voucher.usedCount}/{voucher.maxUses ?? "∞"} usos</p>
                <Badge variant={voucher.active ? "success" : "outline"}>{voucher.active ? "Ativo" : "Inativo"}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent className="p-5">
        <p className="text-xs uppercase tracking-wide text-text-muted">{label}</p>
        <p className="mt-2 font-display text-3xl font-bold text-text">{value}</p>
      </CardContent>
    </Card>
  );
}
