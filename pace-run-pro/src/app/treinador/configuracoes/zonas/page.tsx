import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { Gauge, Settings2, Waves, Zap } from "lucide-react";
import { getSession } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

type ZonePreview = {
  name?: string;
  label?: string;
  min?: number | string;
  max?: number | string;
};

function asZones(value: unknown): ZonePreview[] {
  if (!Array.isArray(value)) return [];
  return value.filter((zone): zone is ZonePreview => Boolean(zone) && typeof zone === "object");
}

export default async function CoachZonesPage() {
  const session = await getSession();
  if (!session?.user?.id) redirect("/login");

  const coach = await prisma.coach.findUnique({
    where: { userId: session.user.id },
    select: {
      zoneModels: {
        orderBy: [{ sport: "asc" }, { updatedAt: "desc" }],
        select: { id: true, name: true, sport: true, method: true, zoneCount: true, zones: true, updatedAt: true },
      },
      athletes: {
        where: { deletedAt: null },
        select: {
          id: true,
          user: { select: { name: true } },
          loadParams: true,
        },
        orderBy: { user: { name: "asc" } },
      },
    },
  });

  if (!coach) redirect("/login");

  const athletesWithParams = coach.athletes.filter((athlete) => athlete.loadParams).length;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Badge variant="primary">Zonas de treino</Badge>
          <h1 className="mt-3 font-display text-3xl font-bold text-text">Modelos de intensidade</h1>
          <p className="mt-2 max-w-2xl text-sm text-text-muted">
            Configure e audite zonas por modalidade para que TSS, RPE, FC, FTP e pace usem a mesma referencia.
          </p>
        </div>
        <Link href="/treinador/atletas" className={cn(buttonVariants({ variant: "primary", size: "sm" }))}>
          Aplicar no calendario
        </Link>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <Metric label="Modelos" value={String(coach.zoneModels.length)} icon={<Settings2 className="h-5 w-5" />} />
        <Metric label="Atletas com parametros" value={`${athletesWithParams}/${coach.athletes.length}`} icon={<Gauge className="h-5 w-5" />} />
        <Metric label="Modalidades cobertas" value={String(new Set(coach.zoneModels.map((zone) => zone.sport)).size)} icon={<Zap className="h-5 w-5" />} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_0.75fr]">
        <div className="grid gap-4 md:grid-cols-2">
          {coach.zoneModels.length === 0 ? (
            <Card className="md:col-span-2">
              <CardContent className="flex flex-col gap-3 p-8">
                <Waves className="h-8 w-8 text-primary" />
                <h2 className="font-display text-xl font-bold text-text">Nenhum modelo cadastrado</h2>
                <p className="max-w-2xl text-sm text-text-muted">
                  Cadastre zonas padrao de corrida, ciclismo, natacao e forca para evitar prescricoes incoerentes entre periodizacao e calendario.
                </p>
              </CardContent>
            </Card>
          ) : coach.zoneModels.map((model) => {
            const zones = asZones(model.zones);
            return (
              <Card key={model.id}>
                <CardContent className="space-y-4 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="font-display text-lg font-bold text-text">{model.name}</h2>
                      <p className="text-sm text-text-muted">{model.sport} · {model.method}</p>
                    </div>
                    <Badge variant="info">{model.zoneCount} zonas</Badge>
                  </div>
                  <div className="space-y-2">
                    {zones.length === 0 ? (
                      <p className="text-sm text-text-muted">Sem faixas detalhadas cadastradas.</p>
                    ) : zones.slice(0, 6).map((zone, index) => (
                      <div key={`${model.id}-${index}`} className="flex items-center justify-between rounded-lg border border-border bg-card-hover/60 px-3 py-2 text-sm">
                        <span className="font-semibold text-text">{zone.name ?? zone.label ?? `Zona ${index + 1}`}</span>
                        <span className="text-text-muted">{zone.min ?? "-"} - {zone.max ?? "-"}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card>
          <CardContent className="space-y-4 p-5">
            <h2 className="font-display text-lg font-bold text-text">Parametros por atleta</h2>
            {coach.athletes.length === 0 ? (
              <p className="text-sm text-text-muted">Nenhum atleta vinculado.</p>
            ) : coach.athletes.map((athlete) => (
              <div key={athlete.id} className="rounded-xl border border-border bg-card-hover/60 p-3">
                <p className="font-semibold text-text">{athlete.user.name}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Badge variant={athlete.loadParams?.thresholdPaceSecPerKm ? "success" : "outline"}>Pace</Badge>
                  <Badge variant={athlete.loadParams?.ftpWatts ? "success" : "outline"}>FTP</Badge>
                  <Badge variant={athlete.loadParams?.swimThresholdSecPer100m ? "success" : "outline"}>Natacao</Badge>
                  <Badge variant={athlete.loadParams?.hrMax ? "success" : "outline"}>FC</Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Metric({ label, value, icon }: { label: string; value: string; icon: ReactNode }) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between p-5">
        <div>
          <p className="text-xs uppercase tracking-wide text-text-muted">{label}</p>
          <p className="mt-2 font-display text-2xl font-bold text-text">{value}</p>
        </div>
        <span className="text-primary">{icon}</span>
      </CardContent>
    </Card>
  );
}
