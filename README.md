# 💌 Date Planner

Um convite interativo e elegante para alinhar **agendas, lugares, filmes e preferências**
entre um **Anfitrião (Host)** e um **Convidado (Guest)**. Mobile-first, minimalista,
com micro-interações e animação de _“Match!”_.

Stack: **Next.js 14 (App Router) · TypeScript · Tailwind CSS · Framer Motion · Lucide**.

---

## 🚀 Rodando

```bash
npm install
npm run dev
# abra http://localhost:3000
```

O app roda com dados de exemplo pra TMDB/Google Places sem chave nenhuma, mas
**precisa** do Upstash Redis configurado pra gerar convites (é onde eles ficam
salvos). Veja o passo a passo de todas as chaves em
[GUIA_API_KEYS.md](GUIA_API_KEYS.md) e preencha o `.env.local`.

---

## 🔄 Como funciona o fluxo Host → Guest

O app tem **uma única rota** (`/`) e decide o modo pela URL:

| URL | Modo | Pode fazer |
| --- | --- | --- |
| `/` | **Host** | Preenche tudo e gera o convite (nome é obrigatório) |
| `/?id=<id>` | **Host** | Revisita o convite salvo — vê as respostas do Guest |
| `/?mode=guest&id=<id>` | **Guest** | Só responde: seleciona/favorita e dá match |

O plano fica salvo no **Upstash Redis** (via [`lib/store.ts`](lib/store.ts)),
identificado por um id aleatório de 32 caracteres — sem login, o modelo de
acesso é "quem tem o link, acessa" (como um link de Google Docs). Expira
sozinho em 30 dias. O ponto-chave da regra de acesso unidirecional está em
[`lib/PlannerContext.tsx`](lib/PlannerContext.tsx):

- `mode = 'host'` → edições caem em `plan.host`
- `mode = 'guest'` → edições caem em `plan.guest` (o Guest **nunca** muta `plan.host`,
  apenas espelha/favorita para dentro do próprio lado)

O Guest tem **auto-save** (debounce de 800ms) pro backend a cada mudança —
o Host revisita o link de resultados quando quiser pra ver o que já foi
respondido, com um botão "Atualizar" pra buscar sem recarregar a página.

Pra testar o fluxo: preencha como Host → aba **Resumo** → nome obrigatório →
**Gerar Link do Convite** → copie o **link do convidado** e abra em outra aba
(ou guia anônima). Guarde também o **link de respostas** que aparece — é o
que o Host usa pra voltar depois.

---

## 🎯 Top 3, em ordem

Filmes, culinária, bebidas, atividades, lugares, restaurantes e bares usam o
mesmo mecanismo: toque em ordem na ordem da sua preferência — o primeiro
toque vira sua "①", o segundo "②", e assim por diante (ver
[`lib/ranking.ts`](lib/ranking.ts) e
[`components/RankTapButton.tsx`](components/RankTapButton.tsx)). Tocar num
item já marcado remove ele do ranking.

Culinária e bebidas permitem até **6** escolhas (`FOOD_MAX` em
[`FoodTab.tsx`](components/tabs/FoodTab.tsx)) — só as 3 primeiras contam como
"ranking" de verdade pra efeito de proximidade (①②③); as 3 seguintes são uma
reserva, pra sempre sobrar alguma coisa em comum mesmo se o top 3 não bater.
As outras categorias continuam limitadas a 3.

O match leva a posição em conta ([`lib/matching.ts`](lib/matching.ts)),
mas só dentro do top 3 real — um match nas posições 4–6 sempre cai no selo
mais simples:

| Situação | Selo |
| --- | --- |
| Os dois colocaram na mesma posição, dentro do top 3 | ✨ Match perfeito! |
| Posições próximas dentro do top 3 (diferença de 1) | 🌟 Quase igual! |
| Qualquer outro match (inclusive envolvendo a reserva 4–6) | 💫 Deram match! |

Lugares, restaurantes e bares funcionam por nome normalizado
(`lib/matching.ts › rankedPlaceIntersection`), já que o Host e o Guest podem
ter `Place.id`s diferentes para o mesmo lugar. Restaurantes e bares têm
buscadores próprios dentro da aba Comida (reaproveitando
[`components/PlacePicker.tsx`](components/PlacePicker.tsx)), com a busca do
Google já filtrada por tipo (`includedPrimaryTypes`).

---

## 🗂 Estrutura

```
app/
  layout.tsx          Fonte (Plus Jakarta Sans) + metadata
  page.tsx            Lê a URL (mode/id), carrega o plano do banco, decide Host vs Guest
  api/
    movies/route.ts   Proxy server-side pra TMDB now_playing
    places/route.ts   Proxy server-side pra Google Places Autocomplete (New), ?type= filtra restaurante/bar
    plan/route.ts     POST — cria um convite novo (Host)
    plan/[id]/route.ts  GET (carrega) / PATCH (Guest ou Host salvam respostas)
  globals.css         Paleta suave + componentes utilitários (.card/.chip/.btn)
components/
  DatePlanner.tsx     Orquestra abas, transições e o burst de "Match!"
  Header.tsx          Título contextual + medidor de sintonia + status de salvamento
  TabBar.tsx          Navegação inferior (pill animada com Framer Motion)
  MatchBurst.tsx      Animação sutil de "Match!"
  InviteNotFound.tsx  Tela amigável quando o id não existe/expirou
  PlacePicker.tsx     Buscador reutilizável (usado por restaurantes/bares na aba Comida)
  tabs/
    ScheduleTab.tsx   📅 Agenda & horários
    PlacesTab.tsx     📍 Lugares (genérico) + autocomplete + rota do match
    MoviesTab.tsx     🎬 Filmes em cartaz — toque em ordem, top 3
    FoodTab.tsx       🍷 Culinária/bebidas (top 6, ranking real só nas 3 primeiras) + restaurantes/bares
    ActivitiesTab.tsx 🎯 Atividades — toque em ordem, top 3
    SummaryTab.tsx    💡 Recado, gerar convite + ver respostas (Host) / confirmar (Guest)
lib/
  types.ts            Modelo de domínio (Person, PlanData…)
  store.ts            Persistência no Upstash Redis (criar/ler/atualizar, TTL 30 dias)
  ranking.ts           Lógica compartilhada de "top 3, em ordem" (toggleRank/rankOf)
  matching.ts         Cálculo puro dos matches (RankedMatch: perfect/close/match) + score
  mockData.ts         Dados de exemplo (filmes, lugares, culinárias, bebidas, atividades)
  useNowPlaying.ts    Hook compartilhado (MoviesTab + SummaryTab) pra buscar filmes
  PlannerContext.tsx  Store central + regra Host/Guest + auto-save do Guest
```

---

## 🔌 Trocando os mocks por APIs reais

O demo roda **sem nenhuma chave** (cai automaticamente nos dados de exemplo em
[`lib/mockData.ts`](lib/mockData.ts)), mas as duas integrações abaixo já estão
implementadas de verdade. Passo a passo para gerar as chaves:
[GUIA_API_KEYS.md](GUIA_API_KEYS.md).

### 🎬 TMDB (filmes em cartaz)
[`app/api/movies/route.ts`](app/api/movies/route.ts) é uma rota server-side que
busca `now_playing` na TMDB (região BR, pt-BR) + a lista de gêneros, e devolve
já no formato que a UI usa. [`MoviesTab`](components/tabs/MoviesTab.tsx) busca
essa rota no mount e cai no mock se ela vier vazia. Suporta tanto o token v4
(JWT, via `Authorization: Bearer`) quanto a chave v3 (via `?api_key=`) —
detectado automaticamente pelo formato do valor em `TMDB_API_TOKEN`.

`next.config.mjs` já libera `image.tmdb.org` para o `next/image`.

### 📍 Google Maps Places (autocomplete + rota)
[`app/api/places/route.ts`](app/api/places/route.ts) chama a **Places API
(New)** (`places:autocomplete`) — não a Places API legada, são serviços
distintos no Google Cloud e precisam ser ativados separadamente.
[`PlacesTab`](components/tabs/PlacesTab.tsx) consulta essa rota com debounce
de 300ms enquanto você digita, com fallback pro filtro local se a chamada
falhar. O card de match tem um botão **"Ver rota no Google Maps"** que abre
o trajeto direto no Google Maps (link simples, sem custo de Directions API).

Guarde a chave em `.env.local` (`NEXT_PUBLIC_GOOGLE_MAPS_KEY`) e restrinja por
API no Cloud Console.

### 🗄 Upstash Redis (persistência dos convites)
[`lib/store.ts`](lib/store.ts) guarda cada plano sob uma chave `plan:<id>`,
com `id` sendo um UUID v4 sem hífens (32 caracteres, gerado com
`crypto.randomUUID()`). `createPlan` seta TTL de 30 dias; `patchPlan` usa
`keepTtl: true` pra não resetar o prazo a cada resposta do Guest. Sem
autenticação — o id é o único "segredo" (mesmo modelo de um link de Google
Docs compartilhável). Setup: [GUIA_API_KEYS.md](GUIA_API_KEYS.md#3-upstash-redis--salvar-convites-e-respostas).

---

## 🎨 Design tokens

Paleta em [`tailwind.config.ts`](tailwind.config.ts): `cream · sand · blush · rose · wine · ink · mist`
— tons pastéis com vinho leve/rose sobre cinza neutro. Cantos bem arredondados,
sombras suaves (`shadow-soft` / `shadow-card`) e transições curtas em tudo que é tocável.
