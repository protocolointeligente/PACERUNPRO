import { redirect } from "next/navigation";
import { Activity, ClipboardList, Dumbbell, HeartPulse, Mail, Ruler, Send } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getSession } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const sections = [
  { title: "Anamnese e saude", icon: HeartPulse, fields: ["Historico de lesoes", "Medicamentos", "Sono", "Dor atual"] },
  { title: "Antropometria", icon: Ruler, fields: ["Peso", "Estatura", "Dobras/perimetros", "Composicao corporal"] },
  { title: "Mobilidade e postura", icon: Activity, fields: ["Tornozelo", "Quadril", "Coluna", "Ombros"] },
  { title: "Forca e capacidade", icon: Dumbbell, fields: ["Agachamento", "Empurrar", "Puxar", "Core"] },
];

export default async function AvaliacaoPage() {
  const session = await getSession();
  if (!session?.user?.id) redirect("/login");

  const coach = await prisma.coach.findUnique({
    where: { userId: session.user.id },
    select: {
      id: true,
      athletes: {
        orderBy: { user: { name: "asc" } },
        select: {
          id: true,
          user: { select: { name: true, email: true, avatarUrl: true } },
        },
      },
    },
  }).catch(() => null);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Badge variant="primary">
            <ClipboardList className="h-3 w-3" />
            Avaliacao fisica
          </Badge>
          <h1 className="mt-3 font-display text-3xl font-bold text-text">Coleta e avaliacao completa</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-text-muted">
            Envie um formulario para o atleta ou preencha manualmente. Estes dados devem alimentar zonas, restricoes,
            prescricao de forca e decisoes de carga sem criar outra rota de treino.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" size="sm">
            <Mail className="h-4 w-4" />
            Enviar coleta
          </Button>
          <Button variant="primary" size="sm">
            <ClipboardList className="h-4 w-4" />
            Preencher manualmente
          </Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Atletas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {!coach ? (
              <p className="rounded-xl border border-warning/30 bg-warning/10 p-4 text-sm text-warning">
                Nao foi possivel carregar atletas agora. Confira banco e migrations.
              </p>
            ) : coach.athletes.length === 0 ? (
              <p className="rounded-xl border border-dashed border-border p-4 text-sm text-text-muted">
                Nenhum atleta vinculado para avaliar.
              </p>
            ) : (
              coach.athletes.slice(0, 10).map((athlete, index) => (
                <div
                  key={athlete.id}
                  className={`flex items-center gap-3 rounded-xl border p-3 ${
                    index === 0 ? "border-primary/40 bg-primary/10" : "border-border bg-background/50"
                  }`}
                >
                  {athlete.user.avatarUrl ? (
                    <img src={athlete.user.avatarUrl} alt="" className="h-10 w-10 rounded-full object-cover" />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/15 text-sm font-bold text-primary">
                      {athlete.user.name.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-text">{athlete.user.name}</p>
                    <p className="truncate text-xs text-text-muted">{athlete.user.email}</p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Formulario da avaliacao</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              {sections.map((section) => {
                const Icon = section.icon;
                return (
                  <div key={section.title} className="rounded-2xl border border-border bg-background/60 p-4">
                    <div className="mb-4 flex items-center gap-2">
                      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <Icon className="h-4 w-4" />
                      </span>
                      <h2 className="font-display text-base font-bold text-text">{section.title}</h2>
                    </div>
                    <div className="space-y-3">
                      {section.fields.map((field) => (
                        <label key={field} className="block space-y-1">
                          <span className="text-xs font-semibold text-text-muted">{field}</span>
                          <input
                            className="h-11 w-full rounded-xl border border-border bg-card px-3 text-sm text-text outline-none focus:border-primary"
                            placeholder="Registrar dado"
                          />
                        </label>
                      ))}
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex flex-col gap-3 p-5 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="font-semibold text-text">Resultado e conduta</p>
                <p className="text-sm text-text-muted">
                  Salve a avaliacao, gere alertas para o treinador e exponha ao atleta apenas o que for liberado.
                </p>
              </div>
              <Button variant="success">
                <Send className="h-4 w-4" />
                Salvar avaliacao
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
