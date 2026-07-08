# ENKY OS

# Documento 13.1 — Engineering Standards

**Versão:** 2.0  
**Status:** Documento Oficial de Engenharia  
**Prioridade:** Máxima  
**Classificação:** Obrigatório

---

# Objetivo

Este documento estabelece os padrões oficiais de engenharia da ENKY.

Seu propósito é garantir que qualquer desenvolvedor, IA ou equipe trabalhe exatamente da mesma forma.

Este documento possui força normativa.

Nenhum código poderá ser aceito se não respeitar estes padrões.

---

# Filosofia

Código não é apenas software.

Código é patrimônio intelectual.

Toda decisão técnica deve priorizar:

- simplicidade;
- escalabilidade;
- legibilidade;
- previsibilidade;
- testabilidade.

---

# Princípios

## 1.

A arquitetura sempre vence a velocidade.

---

## 2.

Código legível vence código inteligente.

---

## 3.

Duplicação é proibida.

---

## 4.

Toda regra de negócio pertence ao domínio.

Nunca à interface.

---

## 5.

Toda decisão técnica deve ser reversível.

---

# Stack Oficial

## Frontend

- Next.js
- React
- TypeScript
- Tailwind CSS
- shadcn/ui
- TanStack Query
- React Hook Form
- Zod

---

## Backend

- Next.js API Routes (inicialmente)
- TypeScript
- Prisma ORM
- PostgreSQL

---

## Infraestrutura

- Vercel
- Neon PostgreSQL
- Upstash Redis
- Cloudflare
- S3 Compatible Storage

---

## Monitoramento

- Sentry
- OpenTelemetry
- Better Stack (ou similar)

---

# Arquitetura

A arquitetura oficial é:

## Modular Monolith

Organizada por domínio.

Nunca por tecnologia.

---

Exemplo.

```text
modules/

coach/

athlete/

assessment/

science/

training/

analytics/

marketplace/

identity/

organizations/
```

Nunca.

```text
controllers/

services/

utils/

pages/
```

como estrutura principal.

---

# Organização

Cada módulo possui.

```text
domain/

application/

infrastructure/

presentation/

tests/
```

---

# Domain First

Toda regra pertence ao domínio.

Nunca ao controller.

Nunca ao React.

Nunca ao Prisma.

---

# APIs

Toda API deve.

- validar entrada;
- validar autenticação;
- validar autorização;
- registrar auditoria;
- retornar erros padronizados.

---

# Banco de Dados

Regras.

Nunca acessar Prisma diretamente na UI.

Nunca escrever SQL na interface.

Nunca duplicar consultas.

Toda persistência passa por Repository.

---

# Eventos

Sempre que possível utilizar eventos.

Exemplo.

AssessmentCompleted

↓

ScienceUpdated

↓

RecommendationGenerated

↓

WorkoutUpdated

---

Nunca chamar módulos diretamente quando um evento resolver.

---

# Código

Obrigatório.

Funções pequenas.

Classes pequenas.

Arquivos pequenos.

---

Limites.

Arquivo

< 300 linhas.

Função

< 40 linhas.

Método

< 25 linhas.

---

# Nomeação

Sempre utilizar a Linguagem Ubíqua.

Exemplo.

TrainingSession

AssessmentProtocol

ScienceEngine

RecommendationEngine

---

Nunca.

WorkoutDataManager

TrainingStuff

HelperUtils

---

# Comentários

Comentários explicam.

"Por quê."

Nunca.

"O que."

Código deve explicar o que faz.

---

# Logs

Toda ação relevante gera log.

Exemplo.

Login.

Assessment.

Workout.

Pagamento.

Integração.

---

# Auditoria

Toda alteração gera histórico.

Quem.

Quando.

O que.

Antes.

Depois.

---

# Erros

Nunca lançar erro genérico.

Sempre.

Código.

Mensagem.

Contexto.

Sugestão.

---

# Segurança

Obrigatório.

RBAC.

LGPD.

Criptografia.

Soft Delete.

Versionamento.

Rate Limit.

MFA preparado.

---

# Testes

Pirâmide.

70%

Unitários.

20%

Integração.

10%

E2E.

---

Cobertura mínima.

90%.

---

# CI/CD

Todo Pull Request deve executar.

Lint.

Type Check.

Build.

Testes.

Cobertura.

---

Nenhum merge direto na main.

---

# Git Flow

main

↓

develop

↓

feature/*

↓

release/*

↓

hotfix/*

---

# Pull Request

Obrigatório conter.

Objetivo.

Impacto.

Screenshots.

Checklist.

Testes.

---

# Checklist de Code Review

☐ Segue Ubiquitous Language

☐ Segue Architecture Principles

☐ Segue Product Principles

☐ Segue Design System

☐ Não possui duplicação

☐ Não quebra APIs

☐ Possui testes

☐ Performance validada

☐ Segurança validada

☐ Logs implementados

☐ Auditoria implementada

---

# Performance

Objetivos.

API

< 300 ms.

Dashboard

< 2 segundos.

Pesquisa

< 500 ms.

Scroll

60 FPS.

---

# Observabilidade

Todos os módulos devem produzir.

Logs.

Métricas.

Tracing.

Health Check.

---

# Feature Flags

Toda funcionalidade grande.

Obrigatória.

Nunca lançar diretamente.

---

# Versionamento

Semantic Versioning.

Major.

Minor.

Patch.

---

# Documentação

Todo módulo possui.

README.

PRD.

Fluxo.

APIs.

Eventos.

Diagramas.

---

# Dependências

Nova biblioteca.

Responder.

Resolve problema real?

Existe alternativa?

É mantida?

Comunidade ativa?

Licença compatível?

---

# Definition of Ready

Uma tarefa só entra em desenvolvimento quando possuir.

☐ PRD

☐ Critérios de aceite

☐ UX

☐ Regras

☐ APIs

☐ Entidades

☐ Eventos

---

# Definition of Done

Uma tarefa só termina quando possuir.

☐ Código

☐ Testes

☐ Logs

☐ Auditoria

☐ Documentação

☐ Performance

☐ Segurança

☐ Review

☐ Deploy

---

# Dívida Técnica

Nunca acumular dívida crítica.

Toda dívida deve ser registrada.

Classificação.

Alta.

Média.

Baixa.

---

# Inteligência Artificial

IA pode.

Gerar código.

Refatorar.

Documentar.

Testar.

Nunca.

Tomar decisões arquiteturais sozinha.

---

# Regra de Ouro

Sempre que existir conflito entre.

Rapidez

e

Qualidade.

Escolher qualidade.

---

# Declaração Final

A engenharia da ENKY deve produzir software que continue compreensível, escalável e seguro daqui a dez anos.

Cada linha de código deve refletir a arquitetura, a ciência e os princípios definidos nos documentos fundadores.

A qualidade da plataforma será consequência direta da disciplina da engenharia.

---

> **"Código é um ativo estratégico. Cada decisão técnica deve proteger o futuro da ENKY."**

**ENKY OS v2.0**
