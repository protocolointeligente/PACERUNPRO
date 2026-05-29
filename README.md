# ARENA — Guia de configuração (Rota A)

Tempo total: ~10–15 min, uma única vez. Depois é só criar campeonatos.

---

## 1. Criar o projeto Firebase (grátis)

1. Acesse **console.firebase.google.com** e entre com sua conta Google.
2. **Adicionar projeto** → dê um nome (ex.: `arena-campeonatos`) → pode desativar o Google Analytics → **Criar**.

## 2. Registrar um app Web e pegar a config

1. Na tela inicial do projeto, clique no ícone **`</>`** (Web).
2. Dê um apelido (ex.: `arena`) → **Registrar app**.
3. O console mostra um bloco `const firebaseConfig = { ... }`. **Copie só o objeto** `{ ... }` (de `{` a `}`).

## 3. Ligar o login (Authentication)

1. Menu lateral → **Authentication** → **Começar**.
2. Aba **Sign-in method** → **E-mail/senha** → **Ativar** → **Salvar**.

## 4. Criar o banco (Firestore)

1. Menu lateral → **Firestore Database** → **Criar banco de dados**.
2. Escolha uma região (ex.: `southamerica-east1` — São Paulo) → pode iniciar em modo de produção.
3. Aba **Regras (Rules)** → apague tudo e cole exatamente isto → **Publicar**:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /championships/{id} {
      allow read: if resource.data.public == true
                  || (request.auth != null && request.auth.uid == resource.data.ownerUid);
      allow create: if request.auth != null
                    && request.resource.data.ownerUid == request.auth.uid;
      allow update, delete: if request.auth != null
                    && request.auth.uid == resource.data.ownerUid;
    }
  }
}
```

> O que isso faz: qualquer pessoa com o link **lê** o campeonato (acompanhar), mas **só o dono** (logado) cria e edita.

## 5. Colocar a config no app

Duas opções (escolha uma):

- **A)** Abra o arquivo `arena-campeonatos.html` num editor de texto, ache o bloco `const FIREBASE_CONFIG = {` no topo do `<script>` e substitua os `"COLE_AQUI"` pelos valores que você copiou. **(Recomendado — funciona em qualquer lugar.)**
- **B)** Abra o app sem editar nada: ele mostra uma tela **"Configurar ARENA"** onde você cola o objeto e clica em salvar. *(Guarda no navegador; pode não persistir dentro de certos embeds — por isso a opção A é mais segura.)*

> Se quiser, me mande a config aqui que eu já devolvo o arquivo com ela colada.

## 6. Hospedar o arquivo (sem instalar nada)

1. Acesse **app.netlify.com/drop**.
2. **Arraste** o `arena-campeonatos.html` para a página.
3. Ele gera um endereço `https://...netlify.app`. Esse é o seu link.

> Alternativas equivalentes: Cloudflare Pages, GitHub Pages.

## 7. Autorizar os domínios no Firebase (passo que todo mundo esquece)

No Firebase → **Authentication** → **Settings** → **Authorized domains** → **Add domain** e adicione:

- o domínio do **Netlify** (ex.: `seuapp.netlify.app`)
- o domínio do seu **Google Sites** (ex.: `sites.google.com`)

Sem isso, o login dá erro de domínio não autorizado.

## 8. Embutir no Google Sites

1. No editor do Sites → **Inserir** → **Incorporar** → aba **Por URL**.
2. Cole o endereço do Netlify → **Inserir**.
3. Publique.

---

## Como o compartilhamento funciona

- Você (logado) cria o campeonato. Dentro dele aparece **"🔗 Link de acompanhamento"** → botão **Copiar**.
- Esse link (ex.: `https://seuapp.netlify.app/?ver=ID`) abre o app em **modo somente leitura, ao vivo**: quem abrir vê a classificação se atualizando sozinha quando você lança resultados. Não precisa de conta nem de login para acompanhar.
- Você pode mandar esse link por WhatsApp, colar no seu Google Sites, etc.

## Recursos do app

- 4 formatos: Pontos Corridos, Fase de Grupos, Grupo × Grupo (interzonas), Mata-Mata.
- Sorteio animado com cabeças-de-chave.
- Classificação automática, artilharia, data/hora/local nos jogos e no mata-mata.
- **Download em PDF** (botão ⬇ PDF): exporta classificação/chaveamento + artilharia.
- Exportar/importar `.json` para backup.

## Limites do plano gratuito (folgam para o seu uso)

50.000 leituras e 20.000 gravações por dia no Firestore, 1 GB de dados, até 50.000 contas. **Sem cartão cadastrado, não há risco de cobrança** — se um dia estourasse, o app só pausaria até o dia seguinte.

## Observações honestas

- Cada campeonato é salvo como um documento (limite de 1 MB por documento do Firestore). Para escolas/bairros isso nunca é problema; só seria em algo gigante (milhares de jogos com muitos artilheiros).
- A versão do Firebase usada é a `10.12.2`. Se algum dia o link da biblioteca falhar, troque o número da versão nas 3 linhas `<script src=".../firebasejs/10.12.2/...">` no topo do arquivo.
