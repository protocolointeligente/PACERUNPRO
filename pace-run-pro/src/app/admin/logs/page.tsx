import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollText } from "lucide-react";

const MOCK_LOGS = [
  { id: "l-1", action: "assessoria.aprovada",     actor: "Ricardo Pace Jr.",  target: "Run Tribe Assessoria",  at: "19 jun 2026, 14:32" },
  { id: "l-2", action: "plano.upgrade",           actor: "Sistema",           target: "Runners BH → Assessoria", at: "18 jun 2026, 09:10" },
  { id: "l-3", action: "voucher.criado",          actor: "Ricardo Pace Jr.",  target: "CORRIDA20 (20%)",       at: "17 jun 2026, 17:55" },
  { id: "l-4", action: "assessoria.suspensa",     actor: "Ricardo Pace Jr.",  target: "Pace & Cia Esportes",   at: "15 jun 2026, 11:00" },
  { id: "l-5", action: "cobranca.falha",          actor: "Sistema",           target: "Ultra Training SP",     at: "14 jun 2026, 08:22" },
];

const ACTION_VARIANT: Record<string, "success" | "danger" | "warning" | "info" | "primary"> = {
  "assessoria.aprovada": "success",
  "plano.upgrade": "primary",
  "voucher.criado": "info",
  "assessoria.suspensa": "danger",
  "cobranca.falha": "warning",
};

export default function LogsPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-7">
      <div>
        <Badge variant="primary" className="mb-2">
          <ScrollText className="h-3 w-3" /> Logs e auditoria
        </Badge>
        <h1 className="font-display text-2xl font-bold text-text sm:text-3xl">Histórico administrativo</h1>
        <p className="mt-1.5 text-sm text-text-muted">
          Registro imutável de todas as ações realizadas no painel de admin.
        </p>
      </div>

      <Card>
        <CardContent className="p-0 divide-y divide-border/50">
          {MOCK_LOGS.map((log) => (
            <div key={log.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5">
              <div className="flex items-center gap-3">
                <Badge variant={ACTION_VARIANT[log.action] ?? "default"} className="font-mono text-[11px]">
                  {log.action}
                </Badge>
                <span className="text-sm text-text">{log.target}</span>
              </div>
              <div className="text-right">
                <p className="text-xs font-medium text-text-muted">{log.actor}</p>
                <p className="text-xs text-text-muted">{log.at}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
