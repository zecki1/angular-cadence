# Case study — Cadence

Design system acessível consumido pelos outros projetos do roadmap. Semana 6,
pilar **Arquitetura**.

## Contexto

O roadmap Angular + Supabase tem vários apps que repetem botões, inputs, cards,
tokens de cor e estados de foco. Sem uma base comum, cada projeto reinventa esses
elementos — e a acessibilidade vira sorte, não contrato. O **Cadence** existe para
ser essa base: uma fonte única de tokens e componentes, publicada e consumível.

## Desafio

- Definir tokens (cor, superfície, borda, foco) que funcionem **em AA** no tema
  escuro sem depender de ajuste manual em cada componente.
- Entregar um shell navegável (headless, sem login) que sirva de *showcase* e de
  documentação viva dos componentes.
- Manter a barreira de qualidade alta: lint, build, unit, E2E, axe e Lighthouse
  verdes a cada PR.
- Rodar **sem backend**: o app sobe em modo demo quando o Supabase não está
  configurado, para E2E e demos serem determinísticos.

## Solução

- **Tokens em CSS** (`src/styles.css`): `--fundo`, `--superficie`, `--texto`,
  `--tenue`, `--acento`, `--acento-forte` e `--borda` (via `color-mix`). O acento
  de marca (`#6366f1`) é para foco/realce; os preenchimentos sólidos usam
  `--acento-forte` (`#4f46e5`), que aceita texto branco em AA — separar os dois
  foi a correção que zerou o `color-contrast` do axe.
- **Shell acessível** (`app.html`): link “Pular para o conteúdo”, `aria-expanded`
  e `aria-controls` no botão de menu, `<main id="conteudo">` e foco visível em
  `--acento`.
- **Rotas** `/playground` (health-check do Supabase + cartões) e `/componentes`
  (catálogo planejado). `/` redireciona para `/playground`.
- **Modo demo**: `temSupabase()` decide entre cliente real e aviso na tela
  (`role="status"`); o E2E nunca depende de credenciais.
- **Qualidade automatizada**: Vitest para unit, Playwright + `@axe-core/playwright`
  para E2E/a11y, Lighthouse CI para performance/SEO/acessibilidade, e GitHub
  Actions com lint → build → unit → E2E.

## Métricas

- **Unit (Vitest):** 4/4 testes · 75,25% statements · 71,18% branches · 76,61% lines
- **E2E (Playwright):** 5/5 (axe nas 2 rotas + 4 screenshots desktop/mobile)
- **Acessibilidade (axe):** 0 violações graves/críticas · relatório em
  [`docs/a11y/relatorio-axe.json`](./a11y/relatorio-axe.json)
- **Lighthouse:** Performance 99 · Acessibilidade 100 · Boas práticas 100 · SEO 100
- **ESLint:** 0 erros

## O que aprendi

- **Contraste é token, não detalhe.** O `#6366f1` como preenchimento sólido falha
  em AA (4,46:1). Enxergar isso como “preciso de um segundo token de acento”
  resolve o problema na raiz em vez de corrigir botão a botão.
- **Demo determinístico é infraestrutura de teste.** O modo demo deixa a suíte E2E
  rodar sem rede/credenciais — o teste mede o app, não o Supabase.
- **A mesma falha em dois auditores não é redundância.** axe (com tags WCAG) e
  Lighthouse checam contraste por caminhos diferentes; usar os dois como portões
  evita confiar em uma única heurística.

## Links

- Demo: https://zecki1.github.io/angular-cadence/
- Repo: https://github.com/zecki1/angular-cadence
