"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { TopBar } from "@/components/layout/top-bar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/lib/store/useAppStore";
import { RESUMO_PERSONAL } from "@/lib/data/mock-personal";

function getIniciais(nome: string): string {
  return nome
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

export default function PersonalPerfilPage() {
  const router = useRouter();
  const usuario = useAppStore((s) => s.usuario);
  const logout = useAppStore((s) => s.logout);

  function handleLogout() {
    logout();
    router.push("/");
  }

  const adesaoMediaPct = Math.round(RESUMO_PERSONAL.adesaoMedia * 100);

  return (
    <>
      <TopBar title="Perfil" />

      <div className="flex flex-col gap-4 px-4 py-4">
        <Card className="flex flex-col items-center gap-3 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full gradient-primary font-display text-2xl font-bold text-background">
            {getIniciais(usuario?.nome ?? "?")}
          </div>
          <div>
            <p className="font-display text-lg font-bold text-text">{usuario?.nome ?? "Personal"}</p>
            <p className="text-sm text-text-muted">{usuario?.email ?? "—"}</p>
          </div>
          <Badge variant="default">Personal Trainer</Badge>
        </Card>

        <Card>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="flex flex-col gap-1">
              <p className="font-display text-xl font-extrabold text-text">
                {RESUMO_PERSONAL.totalAlunos}
              </p>
              <p className="text-xs text-text-muted">Alunos</p>
            </div>
            <div className="flex flex-col gap-1">
              <p className="font-display text-xl font-extrabold text-success">
                {RESUMO_PERSONAL.emDia}
              </p>
              <p className="text-xs text-text-muted">Em dia</p>
            </div>
            <div className="flex flex-col gap-1">
              <p className="font-display text-xl font-extrabold text-primary">{adesaoMediaPct}%</p>
              <p className="text-xs text-text-muted">Adesão média</p>
            </div>
          </div>
        </Card>

        <Button variant="danger" className="w-full" size="lg" onClick={handleLogout}>
          <LogOut className="h-4 w-4" />
          Sair
        </Button>
      </div>
    </>
  );
}
