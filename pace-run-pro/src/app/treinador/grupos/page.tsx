"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Plus, X, Trash2, UserPlus, UserMinus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.4, ease: "easeOut" as const },
  }),
};

interface AthleteBasic {
  id: string;
  name: string;
  avatarUrl?: string;
  status: string;
}

interface GroupMember {
  id: string;
  athleteId: string;
  athlete: {
    id: string;
    user: { name: string; email: string | null; avatarUrl: string | null };
  };
}

interface Group {
  id: string;
  name: string;
  createdAt: string;
  members: GroupMember[];
}

function initials(name: string) {
  return name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

function MemberRow({ name, avatarUrl, onRemove }: { name: string; avatarUrl?: string | null; onRemove: () => void }) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 hover:bg-card-hover/50 group">
      <div className="flex items-center gap-2">
        <Avatar className="h-6 w-6">
          {avatarUrl && <img src={avatarUrl} alt={name} className="h-full w-full object-cover rounded-full" />}
          <AvatarFallback className="text-[10px]">{initials(name)}</AvatarFallback>
        </Avatar>
        <span className="text-sm text-text">{name}</span>
      </div>
      <button
        onClick={onRemove}
        className="opacity-0 group-hover:opacity-100 rounded p-0.5 text-text-muted hover:text-danger transition-all"
        title="Remover do grupo"
      >
        <UserMinus className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

interface AddAthleteDropdownProps {
  groupId: string;
  groupMemberIds: Set<string>;
  allAthletes: AthleteBasic[];
  onAdd: (athleteId: string, name: string) => void;
}

function AddAthleteDropdown({ groupId, groupMemberIds, allAthletes, onAdd }: AddAthleteDropdownProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const available = allAthletes.filter(
    (a) => !groupMemberIds.has(a.id) && a.name.toLowerCase().includes(search.toLowerCase())
  );

  async function handleAdd(athleteId: string, name: string) {
    await fetch(`/api/coach/grupos/${groupId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ addAthleteId: athleteId }),
    }).catch(() => null);
    onAdd(athleteId, name);
    setSearch("");
    setOpen(false);
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 rounded-lg border border-dashed border-border px-2 py-1 text-xs text-text-muted hover:border-primary hover:text-primary transition-colors"
      >
        <UserPlus className="h-3 w-3" />
        Adicionar atleta
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="absolute left-0 top-full z-20 mt-1 w-56 rounded-xl border border-border bg-card shadow-lg"
          >
            <div className="p-2">
              <input
                autoFocus
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar atleta…"
                className="w-full rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs text-text placeholder:text-text-muted focus:border-primary focus:outline-none"
              />
            </div>
            <div className="max-h-48 overflow-y-auto border-t border-border/50 pb-1">
              {available.length === 0 ? (
                <p className="px-3 py-2 text-xs text-text-muted">
                  {allAthletes.length === 0 ? "Nenhum atleta cadastrado" : "Todos já estão no grupo"}
                </p>
              ) : (
                available.map((a) => (
                  <button
                    key={a.id}
                    onClick={() => handleAdd(a.id, a.name)}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs hover:bg-card-hover transition-colors"
                  >
                    <Avatar className="h-5 w-5 shrink-0">
                      {a.avatarUrl && <img src={a.avatarUrl} alt={a.name} className="h-full w-full object-cover rounded-full" />}
                      <AvatarFallback className="text-[9px]">{initials(a.name)}</AvatarFallback>
                    </Avatar>
                    <span className="truncate text-text">{a.name}</span>
                  </button>
                ))
              )}
            </div>
            <div className="border-t border-border/50 p-1.5">
              <button
                onClick={() => setOpen(false)}
                className="w-full rounded-lg px-2 py-1 text-xs text-text-muted hover:text-text transition-colors"
              >
                Fechar
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function GruposPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [athletes, setAthletes] = useState<AthleteBasic[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/coach/grupos").then((r) => (r.ok ? r.json() : [])),
      fetch("/api/coach/athletes").then((r) => (r.ok ? r.json() : [])),
    ])
      .then(([g, a]: [Group[], AthleteBasic[]]) => {
        setGroups(g);
        setAthletes(a);
      })
      .catch(() => null)
      .finally(() => setLoading(false));
  }, []);

  async function createGroup(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const res = await fetch("/api/coach/grupos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim() }),
      });
      if (res.ok) {
        const group = (await res.json()) as Group;
        setGroups((prev) => [...prev, group]);
        setNewName("");
        setShowForm(false);
      }
    } finally {
      setCreating(false);
    }
  }

  async function deleteGroup(id: string) {
    setDeletingId(id);
    try {
      await fetch(`/api/coach/grupos/${id}`, { method: "DELETE" }).catch(() => null);
      setGroups((prev) => prev.filter((g) => g.id !== id));
    } finally {
      setDeletingId(null);
    }
  }

  function addMemberLocally(groupId: string, athleteId: string) {
    const athlete = athletes.find((a) => a.id === athleteId);
    if (!athlete) return;
    setGroups((prev) =>
      prev.map((g) => {
        if (g.id !== groupId) return g;
        const alreadyIn = g.members.some((m) => m.athleteId === athleteId);
        if (alreadyIn) return g;
        const newMember: GroupMember = {
          id: `${groupId}-${athleteId}`,
          athleteId,
          athlete: {
            id: athleteId,
            user: { name: athlete.name, email: null, avatarUrl: athlete.avatarUrl ?? null },
          },
        };
        return { ...g, members: [...g.members, newMember] };
      })
    );
  }

  async function removeMember(groupId: string, athleteId: string) {
    setGroups((prev) =>
      prev.map((g) =>
        g.id === groupId ? { ...g, members: g.members.filter((m) => m.athleteId !== athleteId) } : g
      )
    );
    await fetch(`/api/coach/grupos/${groupId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ removeAthleteId: athleteId }),
    }).catch(() => null);
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      {/* Header */}
      <motion.div variants={fadeUp} initial="hidden" animate="show" className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Badge variant="primary" className="mb-2">
            <Users className="h-3 w-3" />
            Grupos
          </Badge>
          <h1 className="font-display text-2xl font-bold text-text sm:text-3xl">Grupos de atletas</h1>
          <p className="mt-1 text-sm text-text-muted">Organize seus atletas em grupos para facilitar a prescrição em lote.</p>
        </div>
        <Button onClick={() => setShowForm((v) => !v)} className="gap-2">
          <Plus className="h-4 w-4" />
          Novo grupo
        </Button>
      </motion.div>

      {/* Create form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <Card className="border-primary/30">
              <CardContent className="p-4">
                <form onSubmit={createGroup} className="flex items-center gap-3">
                  <input
                    autoFocus
                    required
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Nome do grupo (ex: Sub-maratona, Iniciantes…)"
                    className="min-w-0 flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-text placeholder:text-text-muted focus:border-primary focus:outline-none"
                  />
                  <Button type="submit" disabled={creating || !newName.trim()}>
                    {creating ? "Criando…" : "Criar"}
                  </Button>
                  <button type="button" onClick={() => setShowForm(false)} className="text-text-muted hover:text-text">
                    <X className="h-4 w-4" />
                  </button>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Groups list */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : groups.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <Users className="h-10 w-10 text-text-muted/40" />
            <p className="text-sm text-text-muted">Nenhum grupo criado ainda.</p>
            <button
              onClick={() => setShowForm(true)}
              className="text-sm font-medium text-primary hover:underline"
            >
              Criar primeiro grupo
            </button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {groups.map((group, i) => {
            const memberIds = new Set(group.members.map((m) => m.athleteId));
            return (
              <motion.div key={group.id} custom={i} variants={fadeUp} initial="hidden" animate="show">
                <Card className="h-full">
                  <CardContent className="p-4 space-y-3">
                    {/* Group header */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15 text-primary">
                          <Users className="h-4 w-4" />
                        </span>
                        <div>
                          <p className="text-sm font-semibold text-text">{group.name}</p>
                          <p className="text-xs text-text-muted">{group.members.length} atleta(s)</p>
                        </div>
                      </div>
                      <button
                        onClick={() => deleteGroup(group.id)}
                        disabled={deletingId === group.id}
                        className={cn(
                          "rounded-lg p-1.5 text-text-muted transition-colors hover:bg-danger/10 hover:text-danger",
                          deletingId === group.id && "opacity-50"
                        )}
                        title="Excluir grupo"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    {/* Members */}
                    <div className="space-y-0.5 max-h-48 overflow-y-auto">
                      {group.members.length === 0 ? (
                        <p className="py-2 text-xs text-text-muted">Nenhum atleta neste grupo ainda.</p>
                      ) : (
                        group.members.map((m) => (
                          <MemberRow
                            key={m.id}
                            name={m.athlete.user.name}
                            avatarUrl={m.athlete.user.avatarUrl}
                            onRemove={() => removeMember(group.id, m.athleteId)}
                          />
                        ))
                      )}
                    </div>

                    {/* Add athlete */}
                    <div className="pt-1 border-t border-border/40">
                      <AddAthleteDropdown
                        groupId={group.id}
                        groupMemberIds={memberIds}
                        allAthletes={athletes}
                        onAdd={(athleteId, name) => addMemberLocally(group.id, athleteId)}
                      />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
