"use client";

import { useState } from "react";
import { TopBar } from "@/components/layout/top-bar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Chip } from "@/components/ui/chip";
import { Input } from "@/components/ui/input";
import { USUARIOS_ADMIN } from "@/lib/data/mock-admin";
import { getPlanoById } from "@/lib/data/plans";
import { formatDate } from "@/lib/utils";
import type { UserRole } from "@/lib/types";

type RoleFiltro = "todos" | UserRole;

const FILTROS: { id: RoleFiltro; label: string }[] = [
  { id: "todos", label: "Todos" },
  { id: "aluno", label: "Alunos" },
  { id: "personal", label: "Personal" },
  { id: "admin", label: "Admin" },
];

const STATUS_BADGE: Record<string, { label: string; variant: "success" | "warning" | "danger" }> = {
  ativo: { label: "Ativo", variant: "success" },
  inadimplente: { label: "Inadimplente", variant: "warning" },
  cancelado: { label: "Cancelado", variant: "danger" },
};

const ROLE_LABELS: Record<UserRole, string> = {
  aluno: "Aluno",
  personal: "Personal",
  admin: "Admin",
};

export default function AdminUsuariosPage() {
  const [busca, setBusca] = useState("");
  const [roleFiltro, setRoleFiltro] = useState<RoleFiltro>("todos");

  const usuariosFiltrados = USUARIOS_ADMIN.filter((u) => {
    const buscaLower = busca.trim().toLowerCase();
    const matchBusca =
      buscaLower === "" ||
      u.nome.toLowerCase().includes(buscaLower) ||
      u.email.toLowerCase().includes(buscaLower);
    const matchRole = roleFiltro === "todos" || u.role === roleFiltro;
    return matchBusca && matchRole;
  });

  return (
    <>
      <TopBar title="Usuários" subtitle={`${USUARIOS_ADMIN.length} usuários cadastrados`} />

      <div className="flex flex-col gap-4 px-4 py-4">
        <Input
          placeholder="Buscar por nome ou e-mail"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />

        <div className="flex flex-wrap gap-2">
          {FILTROS.map((f) => (
            <Chip key={f.id} selected={roleFiltro === f.id} onClick={() => setRoleFiltro(f.id)}>
              {f.label}
            </Chip>
          ))}
        </div>

        <div className="flex flex-col gap-3">
          {usuariosFiltrados.map((usuario) => {
            const planoNome = getPlanoById(usuario.plano)?.nome ?? usuario.plano;
            const statusBadge = STATUS_BADGE[usuario.status];

            return (
              <Card key={usuario.id}>
                <div className="mb-2 flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-display text-sm font-semibold text-text">
                      {usuario.nome}
                    </p>
                    <p className="truncate text-xs text-text-muted">{usuario.email}</p>
                  </div>
                  <Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">{ROLE_LABELS[usuario.role]}</Badge>
                    <Badge variant="default">{planoNome}</Badge>
                  </div>
                  <span className="text-xs text-text-muted">
                    Desde {formatDate(usuario.criadoEm)}
                  </span>
                </div>
              </Card>
            );
          })}

          {usuariosFiltrados.length === 0 && (
            <Card>
              <p className="text-sm text-text-muted">Nenhum usuário encontrado.</p>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
