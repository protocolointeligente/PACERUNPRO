# ENKY OS

# Documento 05 — Business Domain

**Versão:** 2.0  
**Status:** Documento Oficial de Domínio  
**Prioridade:** Máxima  
**Classificação:** Interno

---

# Objetivo

Este documento define o modelo de domínio da ENKY.

Ele representa a linguagem oficial da plataforma e estabelece:

- quais entidades existem;
- quais responsabilidades possuem;
- como elas se relacionam;
- quais são as regras de negócio.

Todo o banco de dados, APIs, regras, interfaces e integrações deverão ser derivados deste documento.

---

# Filosofia

A ENKY não é organizada por telas.

Ela é organizada por domínios de negócio.

Cada domínio representa um problema real do treinamento esportivo.

Nenhum domínio deverá conhecer detalhes internos de outro domínio.

A comunicação ocorrerá por contratos bem definidos.

---

# Arquitetura dos Domínios

```text
ENKY

├── Identity
├── Organizations
├── People
├── Assessment
├── Training
├── Performance
├── Science
├── Analytics
├── Communication
├── Marketplace
├── Billing
├── Integrations
├── AI
├── Platform
└── Research
```

---

# Domínio 1 — Identity

Responsável por identidade e autenticação.

## Entidades

- User
- Role
- Permission
- Session
- Authentication Provider
- Audit Login

## Responsabilidades

- login;
- autenticação;
- autorização;
- MFA;
- recuperação de senha;
- sessões.

---

# Domínio 2 — Organizations

Representa qualquer organização.

Não existe apenas "Assessoria".

Pode ser:

- assessoria esportiva;
- clube;
- equipe;
- academia;
- universidade;
- federação;
- centro de treinamento;
- personal trainer independente.

## Entidades

- Organization
- Unit
- Membership
- Department
- CoachAssignment

---

# Domínio 3 — People

Representa todas as pessoas.

Nunca criaremos tabelas separadas para treinador e atleta.

Existe apenas:

## Person

Especializações:

- Coach
- Athlete
- Evaluator
- Administrator
- Nutritionist
- Physiotherapist
- Physician
- Guest

Uma pessoa pode exercer vários papéis simultaneamente.

---

# Domínio 4 — Assessment

Responsável por todo o processo avaliativo.

## Entidades

- Assessment
- Assessment Protocol
- Assessment Engine
- Assessment Result
- Assessment Version
- Assessment Template
- Assessment Schedule

Subdomínios:

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

# Domínio 5 — Training

Maior domínio da plataforma.

## Entidades

Goal

Season

Macrocycle

Mesocycle

Microcycle

Training Plan

Training Week

Training Day

Training Session

Session Block

Exercise

Exercise Library

Workout Builder

Training Zone

Training Objective

Execution

Feedback

Recovery Session

Competition

Event

Availability

Restriction

---

# Regra Fundamental

Existe apenas um modelo de treinamento.

A modalidade altera apenas parâmetros.

Nunca a estrutura.

---

# Domínio 6 — Performance

Responsável por indicadores esportivos.

## Entidades

Metric

Metric Category

Metric Value

Performance Trend

Benchmark

Prediction

Performance Profile

Performance Zone

Readiness

Recovery

Fatigue

Risk

Adaptation

---

Este domínio conversa diretamente com o Science Engine.

---

# Domínio 7 — Science

Principal ativo intelectual.

## Entidades

Scientific Framework

Scientific Registry

Formula

Equation

Variable

Calculation

Evidence

Recommendation

Decision

Algorithm

Scientific Version

Confidence Score

E-Precision™

Knowledge Graph Node

Knowledge Graph Relation

---

Nenhuma recomendação existe fora deste domínio.

---

# Domínio 8 — Analytics

Responsável pelos dashboards.

## Entidades

Dashboard

Widget

Report

Insight

KPI

Alert

Trend

Comparison

Export

Snapshot

---

Todos os dashboards são configuráveis.

---

# Domínio 9 — Communication

Comunicação entre treinador e atleta.

## Entidades

Message

Conversation

Announcement

Notification

Reminder

Task

Comment

Reaction

Attachment

---

# Domínio 10 — Marketplace

Ecossistema comercial.

## Entidades

Marketplace Product

Plan

Course

Assessment Template

Workout Template

Exercise Package

Subscription

Purchase

Review

License

Coupon

---

Marketplace não conhece treinamento.

Conhece apenas produtos.

---

# Domínio 11 — Billing

Financeiro.

## Entidades

Invoice

Payment

Subscription

Plan

Transaction

Refund

PIX

Credit Card

Webhook

---

# Domínio 12 — Integrations

Toda integração passa por aqui.

## Entidades

Connected Account

Provider

Import Job

Export Job

Webhook

Synchronization

Device

Credential

Health Data

---

Provedores previstos

Garmin

Strava

Polar

Coros

Suunto

Apple Health

Health Connect

Zwift

TrainerRoad

---

# Domínio 13 — AI

Responsável apenas pela inteligência conversacional.

## Entidades

Prompt

Conversation

AI Request

AI Response

Recommendation Explanation

Scientific Citation

Summary

---

Importante.

A IA nunca calcula.

Ela interpreta.

---

# Domínio 14 — Platform

Infraestrutura.

## Entidades

Audit Log

Feature Flag

Settings

Theme

Language

Region

Storage

Queue

Job

Error

Telemetry

---

# Domínio 15 — Research

Responsável pelo conhecimento científico.

## Entidades

Article

Guideline

Systematic Review

Meta-analysis

Protocol

Validation Study

Evidence Level

Reference

Citation

---

Este domínio alimenta o Science Engine.

---

# Relações Principais

```text
Organization

↓

Coach

↓

Athlete

↓

Assessment

↓

Science Engine

↓

Training Plan

↓

Training Session

↓

Execution

↓

Performance

↓

Analytics

↓

Recommendation

↓

Nova Prescrição
```

---

# Entidades Fundamentais

As entidades abaixo são consideradas permanentes.

Nunca deverão ser duplicadas.

- User
- Person
- Organization
- Athlete
- Coach
- Assessment
- Training Plan
- Training Session
- Exercise
- Competition
- Metric
- Dashboard
- Notification
- Marketplace Product
- Recommendation
- Formula
- Algorithm

---

# Regras Arquiteturais

Cada entidade possui:

- responsabilidade única;
- identificador único;
- versionamento;
- auditoria;
- histórico.

---

# Eventos de Negócio

Todo domínio produz eventos.

Exemplo.

Assessment Completed

↓

Science Updated

↓

Recommendation Updated

↓

Workout Updated

↓

Notification Sent

↓

Dashboard Updated

↓

Audit Registered

---

# Linguagem Oficial

Todos os nomes internos serão escritos em inglês.

Interface traduzida.

Exemplo.

Training Session

↓

Sessão de Treino

Assessment Protocol

↓

Protocolo de Avaliação

Recovery

↓

Recuperação

---

# Objetivo do Modelo

Este modelo deve suportar:

✔ dezenas de modalidades;

✔ milhões de atletas;

✔ milhares de treinadores;

✔ centenas de protocolos científicos;

✔ centenas de métricas;

✔ evolução contínua sem necessidade de remodelagem estrutural.

---

# Declaração Final

O domínio representa a realidade do treinamento esportivo.

As telas mudarão.

As tecnologias mudarão.

As integrações mudarão.

Mas o domínio deverá permanecer estável durante toda a evolução da ENKY.

Toda decisão técnica deverá proteger este modelo.

---

> **"O domínio é a linguagem comum entre ciência, tecnologia e esporte."**

**ENKY OS v2.0**
