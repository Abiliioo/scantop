# CLAUDE.md

Este arquivo fornece orientações ao Claude Code (claude.ai/code) ao trabalhar com o código deste repositório.

## Projeto: EcomPulse (Scantop)

Dashboard de análise de e-commerce para vendedores brasileiros (Shopee / Mercado Livre). SPA 100% client-side — sem etapa de build, sem servidor, sem package.json. Abrir `ecompulse_dark.html` diretamente no navegador.

## Como executar

Abrir `ecompulse_dark.html` em qualquer navegador moderno. Nenhuma instalação ou servidor necessário. Toda a persistência usa `localStorage`.

## Arquitetura

### SPA em arquivo único
Toda a lógica vive em `ecompulse_dark.html`:
- **HTML** (linhas 1–94): estrutura de layout (cabeçalho, área de upload, dashboard com 7 abas, modais)
- **CSS** (dentro de `<style>`): temas escuro/claro via variáveis CSS; sem folha de estilo externa
- **JavaScript** (~2000 linhas minificadas, dentro de `<script>`): toda a lógica da aplicação

Versões legadas estão preservadas em `__check_ecompulse.mjs` (v1) e `__syntax_check.mjs` (v2) apenas para referência.

### Dependências CDN externas
- **Chart.js 4.4.1** — 4 gráficos (barras, barras horizontais, pizza, matriz de prioridade)
- **PapaParse 5.4.1** — parsing de CSV
- **XLSX 0.18.5** — parsing de Excel (.xlsx/.xls)

### Fluxo de dados
```
Usuário faz upload de CSV/XLSX
  → Detecção automática de colunas (16 tipos via matching aproximado)
  → Modal de mapeamento de colunas (usuário confirma)
  → normalizeProduct() → objetos de produto tipados
  → Armazenado em localStorage + array em memória
  → Motor de análise calcula KPIs, ritmo, score de prioridade
  → Renderização via Chart.js + DOM
```

### Chaves do localStorage (versionadas)
- Contas: `ecompulse_accounts_v5`, `ecompulse_active_account_v5`
- Histórico de relatórios: `ecompulse_net_eletrica_history_v3[_accountId]`
- Favoritos: `ecompulse_favorites_v4[_accountId]`
- Estado da UI: `ecompulse_theme`, `ecompulse_screen_v4`, `ecompulse_net_eletrica_tab_v3`
- Período: `ecompulse_revenue_period_v5` (valores: 30, 15, 7)

### Estrutura do objeto Produto
```js
{ name, id, price, old, rev, rev15, rev7, units, units15, units7,
  trend, rating, reviews, images, clip, clipSource, cat, catRaw }
```

## Lógica de Negócio Principal

**Limites de ritmo** (`RHYTHM_LIMIT = 15`):
- Crescente: `trend > +15`
- Estável: `-15 ≤ trend ≤ +15`
- Queda: `trend < -15`

**Fórmula do score de prioridade:**
```
score = receita * multiplicador + bônus_clip + bônus_imagem
multiplicador: 1.35 (queda) | 0.75 (estável) | 0.45 (crescente)
bônus_clip:    max(receita * 0.25, 100)  se sem clip detectado
bônus_imagem:  max(receita * 0.15, 60)   se imagens < 7
```

**Detecção de clip:** 30+ regras de padrão. Colunas numéricas de clip: valor > 0 = tem clip. Texto: "sim", "yes", "ativo", "com clip" = verdadeiro; "nao", "no", "sem", "0" = falso.

**Fallback de período:** Se colunas de 15d/7d estiverem ausentes, os valores são estimados como `receita30 * (X/30)`.

**Inferência de categoria** (função `cat()`): classifica produtos em elétrico, tomadas, jardim, energia ou outros com base em palavras-chave do nome.

## Abas e Telas
| Aba | Função principal |
|-----|----------------|
| Visão Geral | `drawCharts()` |
| Ritmo | `renderRitmo()` |
| Categorias | `renderCategories()` |
| Ranking | `buildRanking()` |
| Todos | `renderTodos()` |
| Favoritos | `renderFavorites()` |
| Comparação | `buildCompare()` |

---

## Plano MVP Cloud

### Estado atual
Aplicação puramente client-side com persistência em `localStorage`. Funciona por device/navegador — sem sincronização entre dispositivos, sem autenticação real.

### Fase 1 — Deploy estático (sem backend, gratuito, ~1 dia)
O app já funciona sem servidor. Basta hospedar o HTML:
- **Vercel**, **Netlify** ou **GitHub Pages** — conectar o repo `Abiliioo/scantop` e fazer deploy
- Usuário acessa via URL pública; `localStorage` continua funcionando por device
- **Ganho imediato:** URL compartilhável, acesso de qualquer navegador

### Fase 2 — Backend leve para persistência em nuvem (MVP real)
Substituir `localStorage` por API + banco de dados:

| Hoje (localStorage) | Equivalente em nuvem |
|---|---|
| Contas | Autenticação (Supabase Auth ou Clerk) |
| Histórico de relatórios | Tabela `reports` no PostgreSQL (Supabase) |
| Favoritos | Tabela `favorites` |
| Dados brutos de produtos | Object Storage (S3 / Supabase Storage) |
| Estado da UI (tema, aba) | Pode continuar no localStorage |

**Stack recomendada para MVP rápido:**
- **Supabase** (PostgreSQL + Auth + Storage + API REST automática) — gratuito até 500 MB, sem DevOps
- **Frontend:** refatorar o JS monolítico em módulos ES6 (ainda sem framework) com chamadas `fetch` ao Supabase
- **Hosting:** Vercel (conecta ao repo GitHub, deploy automático a cada push)

### Fase 3 — Produto SaaS
- Multi-tenant com planos (gratuito/pro)
- Import automático via API Shopee / Mercado Livre
- Alertas de queda de ritmo por e-mail ou WhatsApp
- Export PDF/Excel dos relatórios
- PWA mobile

### Próximas ações concretas
1. **Agora (Fase 1):** Conectar o repo ao Netlify/Vercel para ter URL pública imediatamente
2. **Semana 1:** Criar projeto no Supabase, modelar 3 tabelas (`accounts`, `reports`, `favorites`), criar client JS
3. **Semana 2:** Refatorar `ecompulse_dark.html` separando o JS em módulos e substituindo chamadas `localStorage` pela API Supabase
4. **Semana 3:** Auth com e-mail/senha — cada usuário com dados isolados na nuvem

### Mapeamento de substituição do localStorage
```
localStorage.getItem(S.accounts)   → supabase.auth.getUser()
localStorage.getItem(S.history)    → SELECT * FROM reports WHERE user_id = $1
localStorage.getItem(S.favorites)  → SELECT * FROM favorites WHERE user_id = $1
localStorage.setItem(S.history)    → INSERT INTO reports (...)
```
