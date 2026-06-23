# Casos de Teste — Pace Run Pro
**Criado em:** 21/06/2026  
**Versão do sistema:** última build em produção (branch `claude/pace-run-pro-saas-7s87H`)

---

## Como usar este documento

- Cada caso de teste tem: **Pré-condições → Passos → Resultado esperado → O que fazer se falhar**
- Execute os casos na ordem apresentada (dependências entre seções)
- Anote o resultado de cada caso: ✅ Passou / ❌ Falhou / ⚠️ Parcialmente
- Qualquer resultado diferente do esperado = bug a reportar

---

## SEÇÃO 1 — AUTENTICAÇÃO

### CT-001: Login com credenciais corretas (ATLETA)

**Pré-condições:** Conta de Rafaela existe no banco com senha definida via recuperação de senha.

**Passos:**
1. Abra o navegador em modo normal (não incógnito)
2. Acesse `/login`
3. Digite o e-mail de Rafaela e a senha definida na recuperação
4. Clique em **Entrar**
5. Aguarde o carregamento

**Resultado esperado:**
- Spinner aparece brevemente no botão
- Redirecionamento automático para `/atleta/dashboard`
- Dashboard mostra "Bom dia/tarde/noite, Rafaela 👋"
- Sidebar lateral esquerda aparece com itens de menu do atleta
- Nenhuma mensagem de erro aparece

**Se falhar:**
- Se aparecer "E-mail ou senha incorretos" → verificar se o link de redefinição foi usado corretamente (links expiram em 24h)
- Se aparecer tela "Ops" → reportar como bug crítico com screenshot e URL
- Se ficar na página de login sem mensagem → checar console do navegador (F12 → Console) e copiar o erro

---

### CT-002: Login com credenciais erradas

**Pré-condições:** Nenhuma.

**Passos:**
1. Acesse `/login`
2. Digite qualquer e-mail válido e uma senha errada propositalmente
3. Clique em **Entrar**

**Resultado esperado:**
- Mensagem vermelha: "E-mail ou senha incorretos."
- Usuário permanece na tela de login
- Nenhum redirecionamento

---

### CT-003: Login como TREINADOR (Ricardo)

**Pré-condições:** Conta de Ricardo existe com role COACH.

**Passos:**
1. Acesse `/login`
2. Digite e-mail e senha de Ricardo
3. Clique em **Entrar**

**Resultado esperado:**
- Redirecionamento para `/treinador/dashboard`
- Sidebar mostra itens do treinador (Atletas, Planos, etc.)
- Nome "Ricardo" aparece no rodapé da sidebar

**Se falhar:**
- Se for para `/atleta/dashboard` → bug de role no JWT; reportar
- Se aparecer tela "Ops" → bug crítico; reportar com URL no momento do erro

---

### CT-004: Login como ADMIN (Super Admin)

**Pré-condições:** Conta de admin existe (e-mail listado em `ADMIN_EMAILS` no `.env`).

**Passos:**
1. Acesse `/login`
2. Digite e-mail e senha do admin
3. Clique em **Entrar**

**Resultado esperado:**
- Redirecionamento para `/admin/dashboard`
- Sidebar mostra itens de admin

---

### CT-005: Recuperação de senha — fluxo completo

**Pré-condições:** E-mail do usuário existe no banco; serviço de e-mail configurado.

**Passos:**
1. Acesse `/recuperar-senha`
2. Digite o e-mail cadastrado
3. Clique em enviar
4. Abra o e-mail recebido e clique no link de redefinição
5. Digite nova senha (mínimo 8 caracteres)
6. Confirme a senha
7. Clique em redefinir
8. Tente fazer login com a nova senha

**Resultado esperado:**
- Passo 3: Mensagem de confirmação na tela
- Passo 4: Link direciona para `/redefinir-senha?token=...`
- Passo 7: Mensagem de sucesso
- Passo 8: Login funciona normalmente

**Se falhar:**
- Se o link expirou → links duram 24h; solicitar novo link
- Se "token inválido" → verificar se não houve dois pedidos de recuperação (o segundo invalida o primeiro)

---

### CT-006: Sidebar recolhida não causa erro de hidratação

**Objetivo:** Garantir que o bug do AppShell (localStorage) foi corrigido.

**Pré-condições:** Usuário logado como atleta.

**Passos:**
1. Faça login como atleta
2. No dashboard, clique no ícone de menu (≡) na barra superior da sidebar para recolher
3. A sidebar deve ficar com largura reduzida (apenas ícones)
4. **Recarregue a página** (F5)
5. Navegue para outra rota, ex: `/atleta/treinos`
6. Recarregue novamente

**Resultado esperado:**
- A sidebar permanece recolhida após reload
- Nenhuma tela "Ops" aparece em nenhum momento
- Navegação funciona normalmente com sidebar recolhida

**Se falhar:**
- Tela "Ops" após reload com sidebar recolhida = bug de hidratação (localStorage); reportar

---

## SEÇÃO 2 — DASHBOARD DO ATLETA

### CT-007: Dashboard carrega sem erros

**Pré-condições:** Rafaela logada.

**Passos:**
1. Acesse `/atleta/dashboard`
2. Aguarde carregamento completo (até 3 segundos)

**Resultado esperado:**
- Saudação personalizada: "Bom dia/tarde/noite, Rafaela 👋"
- Card de "Treino de hoje" carrega (pode mostrar treino ou mensagem de aguardo)
- Card de "Check-in diário" visível
- Card de "Complete seu perfil" visível
- Nenhum spinner permanente (depois de 3s)

---

### CT-008: Treino do dia quando existe treino para hoje

**Pré-condições:** Treinador criou um treino com data = hoje para Rafaela; semana está liberada.

**Passos:**
1. Faça login como Rafaela
2. Acesse `/atleta/dashboard`
3. Observe o card "Treino de hoje"

**Resultado esperado:**
- Card mostra título do treino
- Badges "Treino de hoje" e "Liberado" visíveis
- Dados do treino (distância, duração, RPE) visíveis se preenchidos
- Botões "Ver detalhes do treino" e "Iniciar treino" funcionais

---

### CT-009: Dashboard quando não há treino para hoje

**Pré-condições:** Nenhum treino cadastrado para a data de hoje.

**Passos:**
1. Faça login como Rafaela
2. Acesse `/atleta/dashboard`

**Resultado esperado:**
- Card mostra: "Aguardando prescrição do treinador"
- Mensagem explicativa sobre notificação quando treinos forem liberados
- Não é um erro — é comportamento esperado

---

## SEÇÃO 3 — ÁREA DO TREINADOR

### CT-010: Dashboard do treinador carrega

**Pré-condições:** Ricardo logado como COACH.

**Passos:**
1. Acesse `/treinador/dashboard`
2. Aguarde carregamento

**Resultado esperado:**
- Título "Dashboard" ou similar
- Sem tela "Ops"
- Sem erro 401/403

---

### CT-011: Lista de atletas do treinador

**Pré-condições:** Ricardo tem Rafaela como atleta vinculada.

**Passos:**
1. Acesse `/treinador/atletas`
2. Aguarde carregamento

**Resultado esperado:**
- Rafaela aparece na lista
- Nome e e-mail visíveis
- Nenhum atleta fantasma ou duplicado

---

### CT-012: Perfil detalhado do atleta — aba Treinos & Histórico

**Pré-condições:** Rafaela tem pelo menos 1 semana liberada no plano de treinamento.

**Passos:**
1. Acesse `/treinador/atletas`
2. Clique no nome/card de Rafaela para abrir o perfil
3. Clique na aba **"Treinos & histórico"**
4. Aguarde carregamento

**Resultado esperado:**
- Seção "Plano ativo" visível com nome do plano
- Semanas listadas numericamente (Semana 1, Semana 2, etc.)
- Semanas liberadas têm badge "Liberada"
- Semanas não liberadas têm badge "Não liberada"
- Cada semana expandida mostra treinos com data, título e tipo
- Se não houver plano → mensagem "Nenhum plano ativo"

**Se falhar:**
- Se mostrar "Nenhum treino registrado ainda" → bug; o plano pode existir mas a consulta não está encontrando
- Se tela "Ops" → bug crítico

---

### CT-013: Adicionar novo atleta

**Pré-condições:** Ricardo logado como treinador.

**Passos:**
1. Acesse `/treinador/atletas/convidar` (ou botão "Adicionar atleta")
2. Preencha: Nome completo + E-mail (use e-mail que NÃO existe no sistema)
3. Clique em adicionar/convidar

**Resultado esperado:**
- Mensagem de sucesso
- Senha temporária é exibida (copie e guarde)
- Atleta aparece na lista em `/treinador/atletas`

**Variação — e-mail já existente:**
- Se digitar e-mail de um atleta já cadastrado → mensagem de que o atleta foi vinculado (não cria duplicata)
- Se digitar e-mail de uma conta não-atleta → mensagem de erro "Este e-mail já está em uso por outra conta."

---

### CT-014: Criar plano de treinamento

**Pré-condições:** Atleta existe e está vinculado ao treinador.

**Passos:**
1. Acesse o perfil do atleta
2. Localize a opção de criar/ver plano de treinamento
3. Crie um plano com nome, data de início, e pelo menos 1 semana com 1 treino

**Resultado esperado:**
- Plano salvo com sucesso
- Aparece na aba "Treinos & histórico" do perfil do atleta

---

### CT-015: Liberar semana de treino para atleta

**Pré-condições:** Plano existe com pelo menos 1 semana não liberada.

**Passos:**
1. No perfil do atleta → aba "Treinos & histórico"
2. Localize uma semana com badge "Não liberada"
3. Clique em "Liberar" (ou botão equivalente)

**Resultado esperado:**
- Badge muda para "Liberada" sem reload de página
- O atleta agora consegue ver os treinos dessa semana em seu dashboard

---

## SEÇÃO 4 — PAINEL SUPER ADMIN

### CT-016: Dashboard admin mostra Ricardo

**Pré-condições:** Ricardo cadastrado como COACH no banco; logado como ADMIN.

**Passos:**
1. Faça login como admin
2. Acesse `/admin/dashboard`
3. Aguarde carregamento dos dados

**Resultado esperado:**
- "Total de Assessorias": número > 0
- "Treinadores Ativos": número > 0
- Ricardo deve aparecer na lista de assessorias

**Se falhar:**
- Se mostrar zeros → bug na API `/api/admin/coaches`; verificar se Ricardo tem registro na tabela `Coach` do banco

---

### CT-017: Página de assessorias lista Ricardo

**Pré-condições:** Ricardo cadastrado como COACH; logado como ADMIN.

**Passos:**
1. Acesse `/admin/assessorias`
2. Aguarde carregamento
3. Procure por "Ricardo" na lista ou use o campo de busca

**Resultado esperado:**
- Card de Ricardo aparece com:
  - Nome correto
  - Cidade (se preenchido) ou "—"
  - Plan badge (Starter, Pro, etc.)
  - Status (Ativo ou Pendente)
  - Número de atletas

---

### CT-018: Filtros na página de assessorias

**Pré-condições:** Pelo menos 1 assessoria listada.

**Passos:**
1. Acesse `/admin/assessorias`
2. Teste o campo de busca com nome ou cidade
3. Teste os filtros de plano (Starter, Pro, etc.)
4. Teste os filtros de status (Ativas, Pendentes)

**Resultado esperado:**
- Lista filtra em tempo real conforme digitação/clique
- Contador "X resultado(s)" atualiza corretamente
- "Nenhuma assessoria encontrada." quando nenhum resultado

---

### CT-019: Aprovar assessoria pendente

**Pré-condições:** Existe pelo menos 1 assessoria com status "Pendente".

**Passos:**
1. Acesse `/admin/assessorias`
2. Localize card com badge "Pendente"
3. Clique em **Aprovar**

**Resultado esperado:**
- Badge muda de "Pendente" para "Ativo" instantaneamente (sem reload)
- Contadores de stats atualizam
- Botão "Aprovar" desaparece do card

---

## SEÇÃO 5 — FLUXO DE RECUPERAÇÃO DE SENHA (ATLETA NOVO)

### CT-020: Atleta com senha temporária deve trocar senha

**Objetivo:** Garantir que um atleta recém-criado consegue acessar o sistema.

**Pré-condições:** Treinador acabou de criar atleta (CT-013) e tem a senha temporária.

**Passos:**
1. Abra aba anônima/privada no navegador
2. Acesse `/login`
3. Digite e-mail do novo atleta + senha temporária
4. Clique em **Entrar**

**Resultado esperado — Cenário A (senha temporária válida):**
- Login funciona normalmente e vai para `/atleta/dashboard`

**Resultado esperado — Cenário B (senha temporária inválida/fluxo de reset):**
- Se login falhar → use o fluxo de recuperação de senha (CT-005) com o e-mail do atleta
- Após redefinir, tente logar novamente

---

## SEÇÃO 6 — NAVEGAÇÃO E ROTAS PROTEGIDAS

### CT-021: Acesso não autenticado é bloqueado

**Pré-condições:** Sem sessão ativa (aba anônima ou logout).

**Passos:**
1. Tente acessar diretamente: `/atleta/dashboard`
2. Tente acessar: `/treinador/dashboard`
3. Tente acessar: `/admin/dashboard`

**Resultado esperado:**
- Em todos os casos: redirecionamento automático para `/login?callbackUrl=...`
- Nenhuma tela de erro — apenas login

---

### CT-022: Atleta não acessa rotas de treinador

**Pré-condições:** Rafaela logada como ATHLETE.

**Passos:**
1. Tente acessar diretamente: `/treinador/dashboard`

**Resultado esperado:**
- Redirecionamento para `/atleta/dashboard` (role incorreto)

---

### CT-023: Callback URL funciona após login

**Pré-condições:** Sem sessão ativa.

**Passos:**
1. Tente acessar `/atleta/treinos` sem estar logado
2. É redirecionado para `/login?callbackUrl=%2Fatleta%2Ftreinos`
3. Faça login como Rafaela
4. Observe para onde vai após o login

**Resultado esperado:**
- Após login vai para `/atleta/treinos` (respeitando o callbackUrl)

---

## SEÇÃO 7 — TESTES DE REGRESSÃO (ERROS ANTERIORES)

### CT-024: Tela "Ops" não aparece em nenhum fluxo normal

**Objetivo:** Confirmar que os bugs de hidratação foram todos corrigidos.

**Passos:**
1. Faça login como Rafaela
2. Navegue por TODAS as páginas do atleta:
   - `/atleta/dashboard`
   - `/atleta/treinos`
   - `/atleta/checkin`
   - `/atleta/perfil`
   - `/atleta/historico` (se existir)
3. Em cada página, faça um reload (F5)
4. Repita com sidebar recolhida

**Resultado esperado:**
- Em nenhum momento aparece a tela "Ops"
- Em nenhum momento aparece um erro no console do tipo "Hydration failed"

**Como verificar o console:**
- Pressione F12
- Clique na aba "Console"
- Qualquer linha vermelha com "Hydration" ou "Error" deve ser reportada como bug

---

### CT-025: Admin dashboard não mostra zeros após correção

**Objetivo:** Confirmar que o bug de mock data foi corrigido.

**Pré-condições:** Admin logado; Ricardo existe como COACH no banco.

**Passos:**
1. Acesse `/admin/dashboard`
2. Observe os cards de estatísticas

**Resultado esperado:**
- "Assessorias ativas" ≥ 1
- "Treinadores ativos" ≥ 1
- Os números refletem dados reais do banco

---

### CT-026: Aba "Treinos & histórico" não mostra "Nenhum treino" quando há plano

**Objetivo:** Confirmar que o bug de query foi corrigido.

**Pré-condições:** Rafaela tem plano com pelo menos 1 semana liberada.

**Passos:**
1. Login como treinador (Ricardo)
2. Abrir perfil de Rafaela
3. Clicar em "Treinos & histórico"

**Resultado esperado:**
- Plano listado com semanas
- NÃO aparece "Nenhum treino registrado ainda" se há plano ativo

---

## SEÇÃO 8 — TESTES DE BORDA

### CT-027: Login com e-mail inexistente

**Passos:**
1. Acesse `/login`
2. Digite e-mail que não existe no banco
3. Digite qualquer senha
4. Clique em **Entrar**

**Resultado esperado:**
- Mensagem "E-mail ou senha incorretos."
- NÃO deve revelar se o e-mail existe ou não (segurança)

---

### CT-028: Campos obrigatórios no formulário

**Passos:**
1. Acesse `/login`
2. Tente enviar o formulário sem preencher e-mail
3. Tente enviar sem preencher senha

**Resultado esperado:**
- Browser mostra validação nativa "Preencha este campo"
- Formulário não é enviado

---

### CT-029: Navegação em mobile (sidebar mobile)

**Pré-condições:** Acesse com celular ou DevTools no modo mobile (F12 → ícone de celular).

**Passos:**
1. Faça login como atleta em tela mobile (< 1024px)
2. A sidebar desktop deve estar OCULTA
3. Clique no ícone de menu (≡) no topo
4. O drawer lateral deve deslizar da esquerda
5. Clique em algum item de menu
6. O drawer deve fechar e navegar para a rota

**Resultado esperado:**
- Overlay escuro aparece quando drawer está aberto
- Clicar fora do drawer também fecha
- Nenhum glitch visual

---

## CHECKLIST FINAL

Após executar todos os casos, confirme:

| # | Caso | Status |
|---|------|--------|
| CT-001 | Login Rafaela | |
| CT-002 | Login senha errada | |
| CT-003 | Login Ricardo (coach) | |
| CT-004 | Login Admin | |
| CT-005 | Recuperação de senha | |
| CT-006 | Sidebar recolhida sem erro | |
| CT-007 | Dashboard atleta carrega | |
| CT-008 | Treino do dia visível | |
| CT-009 | Dashboard sem treino | |
| CT-010 | Dashboard treinador | |
| CT-011 | Lista atletas treinador | |
| CT-012 | Aba Treinos & histórico | |
| CT-013 | Adicionar atleta | |
| CT-014 | Criar plano | |
| CT-015 | Liberar semana | |
| CT-016 | Admin dashboard Ricardo | |
| CT-017 | Página assessorias lista Ricardo | |
| CT-018 | Filtros assessorias | |
| CT-019 | Aprovar assessoria | |
| CT-020 | Atleta senha temporária | |
| CT-021 | Acesso não autenticado | |
| CT-022 | Atleta não acessa coach routes | |
| CT-023 | Callback URL pós-login | |
| CT-024 | Tela Ops não aparece | |
| CT-025 | Admin sem zeros | |
| CT-026 | Aba treinos sem mock vazio | |
| CT-027 | E-mail inexistente | |
| CT-028 | Campos obrigatórios | |
| CT-029 | Mobile drawer | |

---

## Como reportar um bug

Para cada bug encontrado, informe:
1. **Caso de teste:** (ex: CT-012)
2. **Passo que falhou:** (ex: Passo 4)
3. **O que apareceu:** (screenshot ou descrição exata)
4. **URL no momento do erro:** (copie da barra de endereço)
5. **Console do navegador:** (F12 → Console → copiar erros vermelhos)
6. **Navegador e dispositivo:** (ex: Chrome 126, MacBook M2)
