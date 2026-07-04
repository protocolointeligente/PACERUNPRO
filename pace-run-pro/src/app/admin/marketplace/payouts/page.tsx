"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, DollarSign, Loader2, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface CoachPayout {
  coachId: string;
  coachName: string | null;
  coachEmail: string;
  netCents: number;
  commissionIds: string[];
}

function fmtCurrency(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function PayoutsPage() {
  const [coaches, setCoaches] = useState<CoachPayout[]>([]);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState<string | null>(null);
  const [pixKeys, setPixKeys] = useState<Record<string, string>>({});
  const [paid, setPaid] = useState<string[]>([]);

  const load = () => {
    setLoading(true);
    fetch("/api/admin/marketplace/payouts")
      .then((r) => r.ok ? r.json() : null)
      .then((d: { coaches: CoachPayout[] } | null) => { if (d) setCoaches(d.coaches); })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  async function handlePay(coachId: string) {
    setPaying(coachId);
    const res = await fetch("/api/admin/marketplace/payouts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ coachId, pixKey: pixKeys[coachId] || undefined, method: "PIX" }),
    });
    if (res.ok) {
      setPaid((p) => [...p, coachId]);
      load();
    }
    setPaying(null);
  }

  const total = coaches.reduce((s, c) => s + c.netCents, 0);

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-8 sm:px-6">
      <div>
        <Badge variant="primary" className="mb-2">Admin · Marketplace</Badge>
        <h1 className="font-display text-2xl font-bold text-text">Repasses pendentes</h1>
        <p className="text-sm text-text-muted mt-0.5">
          Comissões aprovadas aguardando repasse manual via PIX para os treinadores.
        </p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-5 flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-danger/10">
              <DollarSign className="h-5 w-5 text-danger" />
            </div>
            <div>
              <p className="text-xs text-text-muted">Total a repassar</p>
              <p className="font-display text-xl font-bold text-danger">{fmtCurrency(total)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-text-muted">Treinadores</p>
              <p className="font-display text-xl font-bold text-text">{coaches.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : coaches.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-border py-16 text-center">
          <CheckCircle2 className="h-10 w-10 text-success/50" />
          <div>
            <p className="font-semibold text-text">Tudo em dia!</p>
            <p className="text-sm text-text-muted">Nenhum repasse pendente no momento.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {coaches.map((c) => {
            const isDone = paid.includes(c.coachId);
            return (
              <Card key={c.coachId} className={isDone ? "opacity-50" : ""}>
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-text">{c.coachName ?? "Coach"}</p>
                        <Badge variant="outline" className="text-[10px]">{c.commissionIds.length} comissões</Badge>
                      </div>
                      <p className="text-xs text-text-muted mt-0.5">{c.coachEmail}</p>
                      <p className="font-display text-lg font-bold text-success mt-2">{fmtCurrency(c.netCents)}</p>
                    </div>

                    {!isDone ? (
                      <div className="flex flex-col gap-2 shrink-0 min-w-[200px]">
                        <input
                          type="text"
                          placeholder="Chave PIX (opcional)"
                          value={pixKeys[c.coachId] ?? ""}
                          onChange={(e) => setPixKeys((p) => ({ ...p, [c.coachId]: e.target.value }))}
                          className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-text placeholder:text-text-muted/50 outline-none focus:border-primary/60 transition-colors"
                        />
                        <Button
                          onClick={() => handlePay(c.coachId)}
                          disabled={paying === c.coachId}
                          className="gap-2"
                          size="sm"
                        >
                          {paying === c.coachId ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <CheckCircle2 className="h-3.5 w-3.5" />
                          )}
                          Marcar como pago
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-sm text-success shrink-0">
                        <CheckCircle2 className="h-4 w-4" /> Pago
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
