# ENKY OS

# Documento 06 — Bounded Contexts

**Versão:** 2.0  
**Status:** Documento Arquitetural Oficial  
**Prioridade:** Máxima  
**Classificação:** Interno

---

# Objetivo

Este documento define os **Bounded Contexts** da ENKY.

Cada contexto representa um limite claro de responsabilidade dentro da plataforma.

Seu objetivo é impedir:

- acoplamento excessivo;
- duplicação de regras;
- duplicação de entidades;
- dependências circulares;
- crescimento desorganizado.

Todo novo desenvolvimento deverá respeitar estes limites.

---

# Filosofia

A ENKY é um único produto.

Mas internamente ela é composta por diversos contextos independentes.

Cada contexto:

- possui sua própria linguagem;
- possui suas próprias regras;
- possui suas próprias entidades;
- expõe apenas contratos públicos.

Nenhum contexto acessa diretamente o banco de dados de outro.

Toda comunicação acontece através de APIs internas ou eventos de domínio.

---

# Arquitetura Geral

```text
                    ENKY

        ┌─────────────────────────────┐
        │        Identity             │
        └────────────┬────────────────┘
                     │
        ┌────────────▼────────────────┐
        │      Organizations          │
        └────────────┬────────────────┘
                     │
        ┌────────────▼────────────────┐
        │          People             │
        └────────────┬────────────────┘
                     │
     ┌───────────────┼────────────────┐
     ▼               ▼                ▼

 Assessment      Training      Marketplace

     ▼               ▼                ▼

 Performance    Analytics      Billing

           ▼          ▼

      Science Engine

           ▼

     Recommendation

           ▼

       AI Engine

           ▼

    Notification Engine

```

---

# Contexto 1 — Identity

## Responsabilidade

Gerenciar identidade dos usuários.

## Possui

- User
- Login
- Sessão
- MFA
- Permissões
- Tokens

## Nunca conhece

Treinos.

Avaliações.

Marketplace.

Science.

---

# Eventos

UserCreated

UserLoggedIn

PasswordChanged

RoleUpdated

---

# Contexto 2 — Organizations

## Responsabilidade

Representar organizações.

Exemplo:

Assessoria

Academia

Clube

Universidade

Federação

Centro de treinamento

---

## Possui

Organization

Membership

Department

Units

---

## Nunca conhece

Workout.

Assessment.

Science.

---

# Eventos

OrganizationCreated

CoachAdded

AthleteAdded

MemberRemoved

---

# Contexto 3 — People

Responsável pelas pessoas.

Existe apenas uma entidade principal.

Person.

Especializações.

Coach

Athlete

Evaluator

Admin

Nutritionist

Physician

---

Eventos.

PersonCreated

ProfileUpdated

AthleteActivated

CoachActivated

---

# Contexto 4 — Assessment

Maior domínio científico.

Responsável por:

Protocolos

Avaliações

Resultados

Interpretação

Histórico

Agenda

---

Subcontextos.

Anthropometry Engine

Cardiorespiratory Engine

Running Engine

Cycling Engine

Swimming Engine

Strength Engine

Functional Engine

Flexibility Engine

Injury Engine

Wellness Engine

Nutrition Engine

Performance Engine

Laboratory Engine

---

Eventos.

AssessmentScheduled

AssessmentCompleted

AssessmentUpdated

AssessmentDeleted

---

Publica.

AssessmentResult

AssessmentMetrics

AssessmentRecommendations

---

# Contexto 5 — Training

Maior contexto operacional.

Responsável por.

Goal

Season

Macrocycle

Mesocycle

Training Plan

Training Week

Training Session

Exercise

Workout Builder

Execution

Feedback

Competition

---

Eventos.

WorkoutCreated

WorkoutPublished

WorkoutExecuted

WorkoutUpdated

WorkoutSkipped

CompetitionRegistered

---

# Contexto 6 — Performance

Responsável pelos indicadores.

Inclui.

Metrics

Recovery

Fatigue

Adaptation

Readiness

Prediction

Risk

Benchmark

---

Eventos.

PerformanceUpdated

RiskDetected

ReadinessUpdated

PredictionGenerated

---

# Contexto 7 — Science

Principal contexto da plataforma.

Nenhum cálculo acontece fora dele.

---

Possui.

Scientific Framework

Algorithms

Equations

Variables

Calculation Engine

Decision Engine

Recommendation Engine

Knowledge Graph

E-Precision

---

Recebe.

Assessment

Workout

Execution

Recovery

Environment

---

Produz.

Recommendations

Predictions

Insights

Scientific Scores

---

Eventos.

ScienceCalculated

RecommendationGenerated

RiskDetected

AlgorithmUpdated

---

# Contexto 8 — Analytics

Responsável pelos dashboards.

Possui.

Dashboard

Widget

Report

KPI

Alert

Trend

Snapshot

---

Recebe eventos.

Nunca consulta diretamente outros módulos.

---

# Contexto 9 — Communication

Responsável por.

Mensagens

Comentários

Anexos

Notificações

Chat

Lembretes

---

Eventos.

MessageSent

NotificationDelivered

ReminderTriggered

---

# Contexto 10 — Marketplace

Responsável pela comercialização.

Possui.

Products

Plans

Templates

Courses

Licenses

Reviews

Purchases

---

Nunca conhece.

Workout.

Assessment.

Science.

Conhece apenas produtos.

---

# Contexto 11 — Billing

Responsável por.

Pagamentos

PIX

Assinaturas

Faturas

Reembolsos

Cobranças

---

Eventos.

PaymentSucceeded

PaymentFailed

SubscriptionActivated

SubscriptionExpired

---

# Contexto 12 — Integrations

Responsável por todas as APIs externas.

Nunca permitir acesso direto.

Toda integração passa por aqui.

---

Providers.

Garmin

Strava

Coros

Polar

Apple

Health Connect

Zwift

TrainerRoad

---

Eventos.

SyncStarted

SyncCompleted

DeviceConnected

ImportFinished

---

# Contexto 13 — AI

Responsável por.

Chat

Explicações

Resumos

Insights

Perguntas

Documentação

---

Importante.

Não calcula.

Nunca altera dados.

Sempre consulta.

---

# Contexto 14 — Platform

Infraestrutura.

Feature Flags

Settings

Logs

Auditoria

Storage

Jobs

Queues

Observabilidade

---

# Contexto 15 — Research

Maior ativo intelectual.

Possui.

Artigos

Guidelines

Meta-análises

Revisões Sistemáticas

Protocolos

Scientific Registry

Assessment Registry

Exercise Registry

Metrics Registry

Knowledge Graph

---

Alimenta.

Science Engine.

---

# Regras de Comunicação

## Comunicação permitida

Assessment

↓

Science

↓

Recommendation

↓

Training

↓

Notification

---

Training

↓

Execution

↓

Performance

↓

Science

---

Integrations

↓

Assessment

Training

Performance

---

# Comunicação proibida

Marketplace

❌

Science

---

Billing

❌

Workout

---

Analytics

❌

Atualizar dados

Analytics apenas observa.

---

AI

❌

Modificar entidades

Ela apenas interpreta.

---

# Eventos Globais

AssessmentCompleted

↓

ScienceUpdated

↓

RecommendationUpdated

↓

WorkoutAdjusted

↓

NotificationCreated

↓

DashboardUpdated

↓

AuditRegistered

---

# Princípio da Fonte Única

Cada informação possui apenas um proprietário.

Exemplo.

| Informação | Proprietário |
|------------|--------------|
| Usuário | Identity |
| Organização | Organizations |
| Pessoa | People |
| Avaliações | Assessment |
| Treinos | Training |
| Métricas | Performance |
| Algoritmos | Science |
| Produtos | Marketplace |
| Pagamentos | Billing |
| Integrações | Integrations |
| Dashboards | Analytics |
| Conhecimento Científico | Research |

Nenhum contexto poderá manter cópias independentes dessas informações.

---

# Contratos Públicos

Cada contexto expõe apenas:

- comandos;
- consultas;
- eventos.

Nunca entidades internas.

Isso permite evolução sem quebrar outros módulos.

---

# Benefícios

Esta arquitetura permite:

✔ escalabilidade

✔ testes independentes

✔ evolução modular

✔ múltiplas equipes de desenvolvimento

✔ APIs públicas futuras

✔ microsserviços quando necessário

✔ manutenção simplificada

---

# Declaração Final

Os Bounded Contexts existem para proteger o crescimento da ENKY.

Eles permitem que cada parte da plataforma evolua de forma independente sem comprometer a integridade do sistema.

Sempre que houver dúvida sobre onde uma funcionalidade pertence, a resposta deverá ser encontrada neste documento.

Um contexto deve ser especialista no seu domínio e ignorar detalhes internos dos demais.

Essa separação é um dos pilares que permitirá à ENKY crescer de forma sustentável durante muitos anos.

---

> **"Contextos bem definidos produzem software sustentável."**

**ENKY OS v2.0**
