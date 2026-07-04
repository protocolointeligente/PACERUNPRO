"use client";

import { useEffect, useState } from "react";
import { Loader2, ScrollText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

interface AuditEntry {
  id: string;
  userId: string | null;
  action: string;
  entity: string;
  entityId: string | null;
  meta: Record<string, unknown> | null;
  createdAt: string;
}

const ACTION_COLORS: Record<string, string> = {
  PRODUCT_APPROVED:  "text-success",
  PRODUCT_SUSPENDED: "text-danger",
  PRODUCT_DRAFT:     "text-text-muted",
  PAYOUT_CREATED:    "text-primary",
};

export default function AuditoriaMarketplacePage() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/marketplace/auditoria")
      .then((r) => r.ok ? r.json() : null)
      .then((d: { entries: AuditEntry[] } | null) => { if (d) setEntries(d.entries); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6">
      <div>
        <Badge variant="primary" className="mb-2">Admin · Marketplace</Badge>
        <h1 className="font-display text-2xl font-bold text-text">Auditoria</h1>
        <p className="text-sm text-text-muted mt-0.5">
          Trilha imutável de todas as ações de moderação e repasses.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : entries.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-border py-16 text-center">
          <ScrollText className="h-10 w-10 text-text-muted/30" />
          <p className="font-semibold text-text">Nenhuma entrada no log ainda</p>
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {entries.map((e) => (
                <div key={e.id} className="flex items-start gap-4 px-5 py-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`font-mono text-xs font-semibold ${ACTION_COLORS[e.action] ?? "text-text"}`}>{e.action}</span>
                      <span className="text-xs text-text-muted">{e.entity}</span>
                      {e.entityId && <span className="font-mono text-[10px] text-text-muted/60 truncate max-w-[120px]">{e.entityId}</span>}
                    </div>
                    {e.meta && (
                      <p className="text-[11px] text-text-muted/70 mt-0.5 font-mono">
                        {JSON.stringify(e.meta)}
                      </p>
                    )}
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-xs text-text-muted">{new Date(e.createdAt).toLocaleString("pt-BR")}</p>
                    {e.userId && <p className="text-[10px] text-text-muted/60 font-mono truncate max-w-[100px]">{e.userId}</p>}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
