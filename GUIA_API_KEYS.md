# 🔑 Guia: como pegar as chaves de API

Este projeto usa três serviços externos: **TMDB** (filmes em cartaz) e
**Google Maps Platform** (autocomplete de lugares + rota) — ambos com
fallback pra dados de exemplo em [`lib/mockData.ts`](lib/mockData.ts) se
não configurados — e **Upstash Redis** (salva os convites e respostas,
sem fallback, é essencial pro convite funcionar). Abaixo está o passo a
passo para gerar cada chave e onde colocá-la.

Depois de gerar, cole os valores em **`.env.local`** (já criado na raiz do
projeto, e já ignorado pelo git — nunca vai parar em um commit).

---

## 1. TMDB (The Movie Database) — filmes em cartaz

1. Acesse **https://www.themoviedb.org/** e crie uma conta gratuita (botão
   "Join TMDB" no canto superior direito).
2. Confirme o e-mail de verificação.
3. Já logado, vá em **Configurações da conta** → menu lateral **API**
   (ou direto: `https://www.themoviedb.org/settings/api`).
4. Clique em **"Create"** / **"Solicitar uma chave de API"**.
5. Escolha o tipo **"Developer"** (uso não-comercial — serve perfeitamente
   para este projeto).
6. Preencha o formulário curto (nome da aplicação, ex: "Date Planner",
   URL pode ser `http://localhost:3000`, descrição de uso: app pessoal de
   convite para encontros).
7. Ao aprovar (geralmente instantâneo), você verá duas credenciais:
   - **API Key (v3 auth)** — uma string curta.
   - **API Read Access Token (v4 auth)** — um token JWT longo, começando
     com `eyJ...`.
8. **Use o token v4** (o JWT longo) — é o que o header `Authorization: Bearer`
   espera. Cole em `.env.local`:
   ```
   TMDB_API_TOKEN=eyJhbGciOiJIUzI1NiJ9...
   ```

> A TMDB é gratuita para uso pessoal/não-comercial, sem cartão de crédito.

---

## 2. Google Maps Platform — Places Autocomplete + Directions

Essa parte exige uma conta Google Cloud e **cartão de crédito para verificação**
(o Google dá uma cota mensal gratuita generosa — US$200/mês em créditos — que
cobre uso pessoal tranquilamente, mas pede o cartão como garantia).

1. Acesse **https://console.cloud.google.com/** e faça login com sua conta
   Google.
2. No topo, clique no seletor de projeto → **"Novo Projeto"**. Dê um nome
   (ex: `date-planner`) → **Criar**.
3. Com o projeto selecionado, vá em **APIs e Serviços → Biblioteca**
   (menu ☰ no canto superior esquerdo).
4. Ative a API que o app usa (busque pelo nome exato e clique em **Ativar**):
   - **Places API (New)** — atenção: é diferente da "Places API" legada
     que aparece primeiro na busca. O app usa a versão **(New)**
     especificamente (endpoint `places:autocomplete`).

   > 💡 Se você já colou a chave em `.env.local` e testou, e viu o erro
   > `PERMISSION_DENIED — Places API (New) has not been used...`, é
   > exatamente isso: falta ativar essa API específica. O próprio erro
   > traz um link direto pra ativação.
5. Vá em **APIs e Serviços → Credenciais** → **+ Criar Credenciais** →
   **Chave de API**.
6. Uma chave é gerada na hora, algo como `AIzaSy...`. Copie.
7. **Restrinja a chave por API** (importante, mesmo que ela nunca chegue ao
   navegador — o app chama a Places API pelo servidor, em
   [`app/api/places/route.ts`](app/api/places/route.ts)):
   - Clique na chave recém-criada para editar.
   - Em **Restrições de aplicativo**, deixe **"Nenhum"** — não se aplica
     aqui, já que a chamada não sai do navegador.
   - Em **Restrições de API**, escolha **Restringir chave** e marque
     apenas **"Places API (New)"**.
   - Salvar.
8. Ative o **faturamento** do projeto (obrigatório mesmo dentro da cota
   gratuita): menu ☰ → **Faturamento** → vincule uma conta de faturamento
   (cartão). Você não será cobrado dentro do crédito mensal gratuito para
   uso pessoal de um app pequeno.
9. Cole a chave em `.env.local`:
   ```
   NEXT_PUBLIC_GOOGLE_MAPS_KEY=AIzaSy...
   ```

---

## 3. Upstash Redis — salvar convites e respostas

Isso é o banco de dados que guarda o convite do Host e as respostas do
Guest, pra você poder ver as respostas depois em vez de depender só do
WhatsApp. Convites expiram sozinhos em 30 dias.

1. Acesse **https://vercel.com/marketplace/upstash** (logado na sua conta
   Vercel).
2. Clique em **Install** / **Add Integration**.
3. Quando perguntar, escolha **"Deixar a Vercel gerenciar uma conta
   Upstash pra você"** (mais simples — não precisa criar conta separada
   na Upstash).
4. Selecione o projeto **date-planner** para conectar a integração.
5. Escolha criar um banco novo (tipo **Redis**, plano gratuito já serve
   bastante para uso pessoal).
6. Ao concluir, a Vercel injeta variáveis automaticamente no seu projeto
   (aba **Settings → Environment Variables**). O nome exato **varia**
   dependendo de como a integração foi conectada — na prática apareceu
   como `UPSTASH_REDIS_REST_KV_REST_API_URL` e
   `UPSTASH_REDIS_REST_KV_REST_API_TOKEN` (em vez dos nomes "limpos"
   `UPSTASH_REDIS_REST_URL`/`TOKEN`). [`lib/store.ts`](lib/store.ts) já
   reconhece as variações mais comuns automaticamente, então não precisa
   mexer em nada — só **conferir se a integração está conectada ao
   projeto certo**.

   > ⚠️ Se for copiar manualmente algum dia: use a variável que termina
   > em `_URL` mas contém `REST_API` no nome (o endpoint `https://`).
   > Existe também uma variante tipo `..._KV_URL` que é uma connection
   > string `redis://` — essa **não funciona** com o cliente que o app usa.

7. **Para testar local** (opcional), copie os valores da aba
   **Settings → Environment Variables** do projeto na Vercel e cole no
   seu `.env.local`, usando os mesmos nomes que aparecerem lá.

> Sem essas variáveis, o app continua funcionando normalmente — só que
> gerar um convite/link vai falhar com um erro, já que não tem onde
> salvar. TMDB e Google Places não dependem disso.

---

## 4. Depois de preencher o `.env.local`

Reinicie o servidor de desenvolvimento para as variáveis serem lidas:

```bash
npm run dev
```

✅ As três integrações já estão conectadas de verdade:

- **TMDB** → aba Cinema busca em [`app/api/movies/route.ts`](app/api/movies/route.ts)
  (rota server-side).
- **Google Places** → aba Lugares busca em [`app/api/places/route.ts`](app/api/places/route.ts)
  assim que você digita (com um pequeno atraso/debounce).
- **Upstash Redis** → convites e respostas em
  [`lib/store.ts`](lib/store.ts) e [`app/api/plan/`](app/api/plan/).

Se a chave da TMDB ou do Google estiver ausente/inválida, o app cai
automaticamente nos dados de exemplo (`lib/mockData.ts`) — não quebra. Já o
Upstash é essencial pro fluxo de convite: sem ele, "Gerar Link do Convite"
mostra uma mensagem de erro, já que não tem onde salvar.
