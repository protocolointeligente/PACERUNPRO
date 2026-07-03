import { NextResponse } from "next/server";
import { auth } from "@/auth";

const spec = {
  openapi: "3.0.3",
  info: {
    title: "Pace Run Pro API",
    version: "1.0.0",
    description: "API para integração com a plataforma Pace Run Pro — atletas e treinadores.",
    contact: { name: "Pace Run Pro", url: "https://pacerunpro.com.br" },
  },
  servers: [{ url: "/api", description: "Production" }],
  tags: [
    { name: "Atleta", description: "Endpoints para atletas autenticados" },
    { name: "Treinador", description: "Endpoints para treinadores autenticados" },
    { name: "Loja", description: "Endpoints públicos da loja de planos" },
  ],
  paths: {
    "/atleta/perfil": {
      get: {
        tags: ["Atleta"],
        summary: "Retorna o perfil do atleta autenticado",
        security: [{ session: [] }],
        responses: {
          "200": { description: "Perfil do atleta" },
          "401": { description: "Não autenticado" },
        },
      },
      patch: {
        tags: ["Atleta"],
        summary: "Atualiza o perfil do atleta autenticado",
        security: [{ session: [] }],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  weightKg: { type: "number" },
                  heightCm: { type: "number" },
                  birthDate: { type: "string", format: "date" },
                  goal: { type: "string" },
                  level: { type: "string" },
                  weeklyAvailability: { type: "integer" },
                  availableMinutes: { type: "integer" },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Perfil atualizado" },
          "401": { description: "Não autenticado" },
        },
      },
    },
    "/atleta/workouts": {
      get: {
        tags: ["Atleta"],
        summary: "Lista os treinos da semana atual do atleta",
        security: [{ session: [] }],
        responses: {
          "200": {
            description: "Lista de treinos",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      id: { type: "string" },
                      date: { type: "string", format: "date" },
                      title: { type: "string" },
                      type: { type: "string" },
                      status: { type: "string" },
                      objective: { type: "string" },
                      targetDistanceKm: { type: "number" },
                      targetDurationMin: { type: "integer" },
                      targetRpe: { type: "integer" },
                    },
                  },
                },
              },
            },
          },
          "401": { description: "Não autenticado" },
        },
      },
    },
    "/atleta/training-load": {
      get: {
        tags: ["Atleta"],
        summary: "Retorna CTL, ATL, TSB e alertas de carga do atleta",
        security: [{ session: [] }],
        responses: {
          "200": {
            description: "Séries de carga e alertas",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    series: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          date: { type: "string" },
                          tss: { type: "number" },
                          ctl: { type: "number" },
                          atl: { type: "number" },
                          tsb: { type: "number" },
                        },
                      },
                    },
                    alerts: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          type: { type: "string", enum: ["spike", "overreaching", "detraining"] },
                          message: { type: "string" },
                          severity: { type: "string", enum: ["warning", "danger"] },
                        },
                      },
                    },
                    latest: {
                      type: "object",
                      nullable: true,
                      properties: {
                        date: { type: "string" },
                        tss: { type: "number" },
                        ctl: { type: "number" },
                        atl: { type: "number" },
                        tsb: { type: "number" },
                      },
                    },
                  },
                },
              },
            },
          },
          "401": { description: "Não autenticado" },
        },
      },
    },
    "/atleta/checkin": {
      post: {
        tags: ["Atleta"],
        summary: "Registra um check-in diário do atleta",
        security: [{ session: [] }],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  rpe: { type: "integer", minimum: 0, maximum: 10 },
                  sleep: { type: "integer", minimum: 0, maximum: 10 },
                  fatigue: { type: "integer", minimum: 0, maximum: 10 },
                  mood: { type: "integer", minimum: 0, maximum: 10 },
                  pain: { type: "integer", minimum: 0, maximum: 10 },
                  stress: { type: "integer", minimum: 0, maximum: 10 },
                  notes: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Check-in registrado" },
          "401": { description: "Não autenticado" },
        },
      },
    },
    "/atleta/races": {
      get: {
        tags: ["Atleta"],
        summary: "Lista as provas do atleta",
        security: [{ session: [] }],
        responses: {
          "200": { description: "Lista de provas" },
          "401": { description: "Não autenticado" },
        },
      },
      post: {
        tags: ["Atleta"],
        summary: "Adiciona uma prova ao calendário do atleta",
        security: [{ session: [] }],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name", "date", "distanceKm"],
                properties: {
                  name: { type: "string" },
                  date: { type: "string", format: "date" },
                  distanceKm: { type: "number" },
                  goalTime: { type: "string", description: "Ex: 1:45:00" },
                  resultTime: { type: "string", description: "Ex: 1:47:23 — atualiza VDOT automaticamente" },
                  location: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          "201": { description: "Prova criada" },
          "400": { description: "Dados inválidos" },
          "401": { description: "Não autenticado" },
        },
      },
    },
    "/atleta/achievements": {
      get: {
        tags: ["Atleta"],
        summary: "Lista as conquistas do atleta",
        security: [{ session: [] }],
        responses: {
          "200": { description: "Lista de conquistas" },
          "401": { description: "Não autenticado" },
        },
      },
    },
    "/ia-treinadora": {
      post: {
        tags: ["Atleta"],
        summary: "Envia mensagem para a IA Treinadora",
        security: [{ session: [] }],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["messages"],
                properties: {
                  messages: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        role: { type: "string", enum: ["user", "assistant"] },
                        content: { type: "string" },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Resposta da IA",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: { reply: { type: "string" } },
                },
              },
            },
          },
          "401": { description: "Não autenticado" },
          "429": { description: "Rate limit atingido" },
        },
      },
    },
    "/coach/prescriptions": {
      post: {
        tags: ["Treinador"],
        summary: "Prescreve treinos semanais para um ou mais atletas",
        security: [{ session: [] }],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["athleteIds", "sessions", "startDate"],
                properties: {
                  athleteIds: { type: "array", items: { type: "string" } },
                  startDate: { type: "string", format: "date", description: "Segunda-feira da semana" },
                  templateName: { type: "string" },
                  sessions: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        dayLabel: { type: "string", enum: ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"] },
                        title: { type: "string" },
                        type: { type: "string", enum: ["corrida", "forca", "descanso"] },
                        zone: { type: "string", enum: ["E", "M", "T", "I", "R"] },
                        distanceKm: { type: "number" },
                        description: { type: "string" },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Prescrição criada" },
          "400": { description: "Dados inválidos" },
          "401": { description: "Não autorizado" },
          "403": { description: "Atleta não pertence ao treinador" },
        },
      },
    },
    "/loja": {
      get: {
        tags: ["Loja"],
        summary: "Lista os planos publicados na loja",
        parameters: [
          { name: "sport", in: "query", schema: { type: "string" } },
          { name: "level", in: "query", schema: { type: "string" } },
          { name: "goal", in: "query", schema: { type: "string" } },
        ],
        responses: {
          "200": { description: "Lista de planos publicados" },
        },
      },
    },
    "/loja/{slug}": {
      get: {
        tags: ["Loja"],
        summary: "Retorna um plano da loja pelo slug",
        parameters: [
          { name: "slug", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: {
          "200": { description: "Plano encontrado" },
          "404": { description: "Plano não encontrado" },
        },
      },
    },
  },
  components: {
    securitySchemes: {
      session: {
        type: "apiKey",
        in: "cookie",
        name: "next-auth.session-token",
        description: "Sessão NextAuth — faça login em /auth/login para obter o cookie.",
      },
    },
  },
};

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }
  return NextResponse.json(spec);
}
