# Cadence — angular-cadence

> Semana(s): 6 · Pilar: **Arquitetura** · Teste unitário: **Vitest** · Milestone(s): `m1-cadence`
> Repo público: [github.com/zecki1/angular-cadence](https://github.com/zecki1/angular-cadence)

## Objetivo de entrevista

desenhar e publicar um design system acessível e escalável, consumido pelos outros projetos

## Stack

- **Angular 22** — standalone, signals, zoneless, OnPush por padrão
- **Supabase** — Postgres + Auth + RLS (projeto compartilhado `angular-portfolio`)
- **Tailwind CSS** · **ECharts** (dashboards) · **GSAP** (motion) · **three.js** (3D)
- **Vercel** — build estático (sem cold start, sempre online)

## Fluxo de trabalho (Git)

Ambientes preservados em **português brasileiro** (commits, PRs, issues, CI).

```
main      → produção (build estático; nunca push direto)
homolog   → validação/release de PRs (staging)
develop   → integração diária (merges das branches feat/*)
feature   → feat/<assunto> + PR para develop (boas práticas de código limpo)
```

- **Commits:** `feat:`, `fix:`, `test:`, `docs:`, `design:`, `ops:`, `backend:` (conventional commits)
- **PRs:** sempre via **pull request template**; revisados e mergeados por milestone
- **main:** protegida — merge somente via PR de `homolog`
- Rastreabilidade com issues, labels (`feat/test/design/ops/backend`), milestones e releases

## Rodando localmente

```bash
npm install
npm start            # ng serve
npm test             # unitário (Vitest)
npm run test:ci      # unitário em modo CI (coverage)
npm run e2e          # Playwright (local)
npm run e2e:ci       # Playwright (CI)
npm run build        # ng build
npm run analyze      # source-map-explorer (análise de bundle)
```

## Ambiente (Supabase)

Variáveis em `.env` (nunca commitadas):

```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_ROLE=demo
```

Dados usados: — (lib pura)

## Decisão de teste: Vitest

> Por que **Vitest** neste projeto? (justificativa detalhada a ser preenchida durante o desenvolvimento — ração §2 do planejamento)
> Cada repo alterna Karma/Vitest de propósito: agnóstico de ferramenta, escolha por contexto.

## Checklist DoD

- [ ] Build/lint/typecheck limpos
- [ ] Unit (Vitest) com cobertura ≥ 80%
- [ ] E2E Playwright + axe sem violações críticas
- [ ] Lighthouse ≥ 90 (Performance/SEO/A11y)
- [ ] Responsivo (mobile/tablet/desktop)
- [ ] README com screenshot + "o que aprendi" + decisão de teste
- [ ] Supabase configurado (quando aplicável)
- [ ] PR revisado + merged + release por milestone

## O que aprendi

_(preencher ao final da semana)_

## Screenshots

_(preencher ao final da semana)_

## Microsoft Clarity (mapa de calor)

Integração documentada em [`docs/clarity-integracao.md`](./docs/clarity-integracao.md).
Snippet só é ativado quando a variável `CLARITY_PROJECT_ID` estiver definida.

## Permanência online

Estratégia zero-standby documentada em [`docs/manter-online.md`](./docs/manter-online.md).

---

## Base navegavel (Semana 6)

Scaffold Angular 22 standalone + zoneless, com shell roteado, Tailwind 4 e o
mesmo codegen de ambiente usado no `vice-district`. Nenhum build foi executado
neste PR de proposito — a validacao de build ficou para o fim do dia.

### Rodar local

```bash
npm install          # o postinstall roda `npm run env` e gera o ambiente
cp .env.example .env # preencha VITE_SUPABASE_ANON_KEY
npm start            # http://localhost:4200
```

### Scripts

| script          | o que faz                                                        |
| --------------- | ---------------------------------------------------------------- |
| `npm run env`   | gera `src/environments/ambiente.local.ts` a partir do `.env`     |
| `npm start`     | `ng serve`                                                        |
| `npm run build` | build de producao (budget inicial: warning 350 kB / erro 500 kB)  |
| `npm test`      | unit (Vitest)                                                     |
| `npm run test:ci` | unit em modo nao interativo + coverage                         |
| `npm run lint`  | ESLint + angular-eslint                                           |

### Rotas

- `/playground` — Playground
- `/componentes` — Componentes

### Segredos

`.env` e `src/environments/ambiente.local.ts` sao gitignored. O que vai para o
repo e apenas o `.env.example`, com placeholders. A `service_role` key nunca
entra no front — a protecao real e o RLS.
