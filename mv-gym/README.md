# MV GYM

**Sua jornada de performance.**

MV GYM é um app premium de musculação e performance combinando treino gerado por
IA, nutrição, check-ins diários, evolução física, gamificação e áreas dedicadas
para Aluno, Personal Trainer e Administrador.

## Stack

- Next.js 15 (App Router) + React 19 + TypeScript
- Tailwind CSS v4 (`@theme inline`, dark theme com tokens em `src/app/globals.css`)
- Zustand v5 com `persist` (localStorage) para estado do app
- Radix UI (Dialog, Tabs) + class-variance-authority
- recharts para gráficos
- lucide-react para ícones

## Rodando localmente

```bash
npm install
npm run dev
```

Abra `http://localhost:3000`. Na tela de login, use o **modo demonstração**
para entrar instantaneamente como Aluno, Personal Trainer ou Administrador
(sem precisar criar conta) — cada perfil carrega dados de exemplo já
configurados.

## Estrutura principal

```
src/app/
  (splash)/page.tsx          # tela inicial
  login/, cadastro/          # autenticação (mock, local)
  onboarding/                # objetivo, avaliação física, preferências
  aluno/                      # dashboard, treino, nutrição, check-in,
                               # evolução, conquistas, AI Coach, planos, perfil
  personal/                   # dashboard, alunos, avaliações, perfil
  admin/                       # dashboard, usuários, assinaturas, financeiro

src/lib/
  store/useAppStore.ts        # estado global (Zustand + persist)
  ai/coach.ts                  # motor de "IA" baseado em regras
  gamification.ts              # XP, nível, conquistas, streak
  data/                        # exercícios, opções, planos, mocks de
                                # personal/admin
  types.ts                     # modelo de domínio
```

## Escopo desta versão (MVP)

Este projeto foi construído como um **MVP funcional completo**, cobrindo todos
os fluxos principais com dados mock e persistência local — sem depender de
serviços externos. As decisões abaixo foram tomadas para entregar uma
experiência de ponta a ponta dentro do escopo viável:

- **Dados e persistência**: tudo é armazenado no `localStorage` do navegador
  via Zustand `persist` (chave `mv-gym-storage`). Não há backend nem banco de
  dados real — recarregar em outro dispositivo/navegador não preserva os
  dados.
- **Autenticação**: login/cadastro são formulários locais (sem senha real,
  sem JWT, sem OAuth). O "modo demonstração" cria um usuário local
  instantaneamente para cada papel (aluno/personal/admin).
- **AI Coach**: motor **baseado em regras** (`src/lib/ai/coach.ts`) que gera
  planos de treino/nutrição, detecta estagnação, sugere progressão de carga e
  responde no chat — não há chamada a um LLM externo.
- **Banco de exercícios**: conjunto curado (não as centenas de exercícios de
  apps como Hevy/Strong).
- **Pagamentos**: a tela de planos/assinatura simula a escolha de
  método de pagamento (cartão, Pix, Mercado Pago) e atualiza o plano local —
  não há integração real com Stripe/Mercado Pago/Pix.
- **Painel Personal/Admin**: usam listas de alunos/usuários/transações mock
  (`src/lib/data/mock-personal.ts`, `mock-admin.ts`), não conectadas aos dados
  reais de alunos cadastrados.
- **PWA mobile-first**: layout otimizado para `max-w-md` (≈448px), pensado
  para uso em celular dentro do navegador. Não há build nativo iOS/Android.

## Roadmap de produção

Para evoluir do MVP para um produto de produção, os principais passos seriam:

1. **Backend real**
   - Banco de dados (Postgres/Supabase) substituindo o `localStorage`.
   - API para usuários, planos de treino, registros, avaliações, check-ins,
     mensagens do coach, etc.
   - Sincronização multi-dispositivo.

2. **Autenticação**
   - Login real com hash de senha / JWT.
   - OAuth (Google, Apple) para cadastro/login social.
   - Recuperação de senha por e-mail.

3. **Pagamentos**
   - Integração real com Stripe (cartão recorrente), Mercado Pago e Pix
     (geração de QR Code, webhooks de confirmação).
   - Gestão de assinaturas, upgrades/downgrades, cancelamento, faturas.

4. **AI Coach com LLM**
   - Substituir/complementar o motor de regras por um LLM (ex.: Claude) com
     contexto do histórico real do usuário, permitindo respostas mais ricas e
     personalizadas, geração de planos sob demanda e ajuste fino de
     periodização.

5. **Banco de exercícios e conteúdo**
   - Expandir para 500+ exercícios com vídeos/GIFs de execução.
   - Biblioteca de receitas e alimentos para o módulo de nutrição (com busca
     de alimentos via API tipo TACO/USDA).

6. **Notificações**
   - Push notifications (Firebase Cloud Messaging) para lembretes de treino,
     hidratação, check-in diário e mensagens do coach.

7. **Apps nativos**
   - Empacotar como app nativo iOS/Android (Capacitor/Expo) a partir da base
     PWA atual, com acesso a câmera (fotos de progresso), notificações push
     nativas e Apple Health / Google Fit.

8. **Painéis Personal/Admin reais**
   - Conectar o painel do Personal aos alunos reais vinculados à sua conta
     (convites, vínculo aluno↔personal).
   - Conectar o painel Admin a métricas reais (MRR, churn, usuários) a partir
     do backend/billing.

9. **Qualidade**
   - Testes automatizados (unitários para `lib/ai`, `lib/gamification`; E2E
     para os fluxos principais).
   - Monitoramento de erros (Sentry) e analytics de produto.
