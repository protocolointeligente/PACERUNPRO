# ENKY OS

# Documento 07 — Ubiquitous Language

**Versão:** 2.0  
**Status:** Documento Oficial de Linguagem de Domínio  
**Prioridade:** Máxima  
**Classificação:** Permanente

---

# Objetivo

Este documento define a linguagem oficial da ENKY.

Toda comunicação entre:

- produto;
- engenharia;
- UX;
- ciência;
- IA;
- documentação;
- APIs;
- banco de dados;

deverá utilizar exatamente os termos definidos neste documento.

Não existirão sinônimos internos.

Uma entidade terá apenas um nome.

Um conceito terá apenas um significado.

---

# Filosofia

Uma plataforma científica precisa falar uma única língua.

Quando engenharia, treinadores e pesquisadores utilizam nomes diferentes para o mesmo conceito, surgem:

- bugs;
- duplicidade;
- interpretações erradas;
- documentação inconsistente;
- código difícil de manter.

A Linguagem Ubíqua elimina esse problema.

---

# Regra Geral

## Backend

Sempre em inglês.

---

## Banco de Dados

Sempre em inglês.

---

## APIs

Sempre em inglês.

---

## Código

Sempre em inglês.

---

## Interface

Traduzida para o idioma do usuário.

---

# Estrutura Oficial

```text
Usuário

↓

Organização

↓

Pessoa

↓

Objetivo

↓

Avaliação

↓

Ciência

↓

Plano

↓

Periodização

↓

Sessão

↓

Execução

↓

Performance

↓

Recomendação

↓

Nova decisão
```

---

# Identity

## User

Pessoa autenticada.

Nunca utilizar:

- Account
- Login
- Cliente

---

## Role

Perfil de acesso.

---

## Permission

Permissão individual.

---

## Session

Sessão autenticada.

---

# Organizations

## Organization

Qualquer instituição.

Exemplos.

Assessoria.

Clube.

Academia.

Universidade.

Equipe.

Centro de treinamento.

Nunca utilizar:

Empresa.

Assessoria (como entidade principal).

---

## Membership

Relacionamento entre Person e Organization.

---

# People

## Person

Entidade principal.

Nunca criar tabelas separadas.

Coach.

Athlete.

Evaluator.

Nutritionist.

Administrator.

São papéis.

Não entidades independentes.

---

## Coach

Treinador.

Nunca utilizar:

Trainer.

Professor.

Personal.

Instrutor.

Na interface pode aparecer "Treinador".

No domínio permanece Coach.

---

## Athlete

Atleta.

Nunca:

Aluno.

Cliente.

Runner.

Cyclist.

Swimmer.

Essas são modalidades.

Não pessoas.

---

# Assessment

## Assessment

Avaliação.

Nunca utilizar:

Teste.

Ficha.

Anamnese.

Questionário.

Esses são componentes.

---

## Assessment Protocol

Protocolo científico.

Exemplo.

Cooper.

ISAK.

FMS.

FTP.

---

## Assessment Result

Resultado.

---

## Assessment Engine

Motor responsável pelas avaliações.

---

# Training

## Goal

Objetivo.

Nunca utilizar:

Meta.

Target.

---

## Season

Temporada.

---

## Macrocycle

Macrociclo.

---

## Mesocycle

Mesociclo.

---

## Microcycle

Microciclo.

---

## Training Plan

Plano completo.

Nunca utilizar:

Planilha.

Programa.

Ficha.

---

## Training Week

Semana.

---

## Training Day

Dia.

---

## Training Session

Sessão prescrita.

Nunca:

Workout.

Treino.

Treino do dia.

Workout será apenas tradução.

---

## Session Block

Bloco da sessão.

Exemplo.

Aquecimento.

Principal.

Resfriamento.

---

## Exercise

Exercício.

Nunca:

Movimento.

Atividade.

---

## Workout Builder

Construtor de sessões.

Nunca:

Editor.

Gerador.

---

## Execution

Treino executado.

Nunca:

Activity.

Workout.

Recorded Workout.

---

## Feedback

Retorno do atleta.

---

## Competition

Competição.

Nunca:

Race.

Prova.

Evento.

Na interface pode aparecer "Prova".

Internamente permanece Competition.

---

# Performance

## Metric

Qualquer indicador.

---

## Metric Value

Valor da métrica.

---

## Readiness

Prontidão.

---

## Recovery

Recuperação.

---

## Fatigue

Fadiga.

---

## Adaptation

Adaptação.

---

## Prediction

Predição.

---

## Risk

Risco.

---

## Benchmark

Comparação.

---

# Science

## Science Engine

Motor científico.

Nunca utilizar:

IA.

Algoritmo.

Motor de cálculo.

---

## Scientific Framework

Constituição científica.

---

## Scientific Registry

Registro científico.

---

## Knowledge Graph

Grafo de conhecimento.

---

## Recommendation

Recomendação.

Nunca:

Sugestão.

Conselho.

---

## Decision

Decisão científica.

---

## Confidence Score

Nível de confiança.

---

## Evidence Level

Nível de evidência.

---

# Analytics

## Dashboard

Painel.

---

## Widget

Componente.

---

## KPI

Indicador estratégico.

---

## Insight

Interpretação relevante.

---

## Alert

Alerta.

---

## Trend

Tendência.

---

# Marketplace

## Marketplace Product

Produto comercial.

---

## Plan

Plano comercial.

---

## Template

Modelo reutilizável.

---

## License

Licença.

---

# Communication

## Conversation

Conversa.

---

## Message

Mensagem.

---

## Notification

Notificação.

---

## Reminder

Lembrete.

---

# Integrations

## Connected Account

Conta conectada.

---

## Synchronization

Sincronização.

---

## Device

Dispositivo.

---

## Provider

Fornecedor da integração.

---

# AI

## AI Request

Solicitação.

---

## AI Response

Resposta.

---

## Scientific Explanation

Explicação científica.

---

## Summary

Resumo.

---

# Research

## Article

Artigo científico.

---

## Guideline

Diretriz.

---

## Systematic Review

Revisão sistemática.

---

## Meta-analysis

Meta-análise.

---

## Validation Study

Estudo de validação.

---

## Reference

Referência bibliográfica.

---

# Métricas Proprietárias

Todos os algoritmos proprietários utilizarão prefixo E.

## E-Load™

Carga normalizada.

---

## E-Stress™

Estresse fisiológico.

---

## E-Recovery™

Recuperação.

---

## E-Readiness™

Prontidão.

---

## E-Adapt™

Adaptação.

---

## E-Execution™

Qualidade da execução.

---

## E-Environment™

Normalização ambiental.

---

## E-Consistency™

Consistência.

---

## E-Predict™

Predição.

---

## E-Precision™

Qualidade das informações disponíveis.

---

## E-Health™

Estado geral do atleta.

---

## E-Risk™

Risco esportivo.

---

# Termos Proibidos

Nunca utilizar internamente:

❌ Runner

❌ Swimmer

❌ Cyclist

❌ Cliente

❌ Aluno

❌ Professor

❌ Personal

❌ Planilha

❌ Ficha

❌ Treino (como entidade)

❌ Teste (como entidade)

❌ Avaliação Física (como entidade geral)

❌ Workout Plan

❌ Workout Week

❌ Workout Day

❌ Activity (para sessão prescrita)

---

# Convenções de Código

Classes:

```text
TrainingSession
AssessmentProtocol
WorkoutBuilder
ScienceEngine
RecommendationEngine
```

---

Métodos:

```text
calculateReadiness()

publishWorkout()

generateRecommendation()

executeAssessment()

syncGarmin()

predictPerformance()
```

---

Eventos:

```text
WorkoutPublished

AssessmentCompleted

RecommendationGenerated

ScienceUpdated

DeviceSynced

PerformancePredicted
```

---

# Convenções de Banco

Tabela:

```text
training_sessions

assessment_protocols

metric_values

recommendations

performance_predictions
```

---

Colunas:

```text
created_at

updated_at

deleted_at

organization_id

athlete_id

coach_id
```

---

# Regra de Ouro

Sempre que surgir um novo conceito:

1. verificar se já existe um termo oficial;

2. caso não exista, adicionar neste documento;

3. somente depois implementar no código.

Este documento é a única fonte oficial da linguagem da ENKY.

---

# Declaração Final

Uma arquitetura sólida começa por uma linguagem sólida.

Quando ciência, engenharia, UX e produto falam exatamente a mesma língua, o software torna-se mais consistente, mais escalável e mais fácil de evoluir.

A Linguagem Ubíqua da ENKY é parte da sua arquitetura e deve ser preservada com o mesmo rigor que o código-fonte.

---

> **"Um conceito. Um nome. Um significado."**

**ENKY OS v2.0**
