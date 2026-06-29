import { state } from './state.js';
import {
  rhythm, hasClip, revOf, unitsOf, needsImages, actionItems,
  recommendation, productStatus, isFav, keyOf,
  catalogHealthScore, paretoInfo, clipLift,
} from './analytics.js';
import { money, small, esc } from './utils.js';
import { hist, accountName, loadHistoryFor, ensureAccounts, account } from './storage.js';
import { normalizeProduct } from './data.js';

// --- Helpers de HTML ---

export function rhythmHtml(p) {
  const r = rhythm(p.trend);
  const pct = p.trend == null ? '' : ' · ' + (p.trend >= 0 ? '+' : '') + p.trend.toFixed(1).replace('.', ',') + '%';
  return `<span class="badge ${r.cls}">${r.label}${pct}</span>`;
}

export function pcell(p) {
  return `<div class="pname"><b title="${esc(p.name)}">${esc(p.name)}</b><span>ID: ${esc(p.id)}</span></div>`;
}

export function starBtn(p) {
  const active = isFav(p) ? ' active' : '';
  const key = encodeURIComponent(keyOf(p));
  return `<button class="star${active}" title="Favoritar anúncio" onclick="window._toggleFav(decodeURIComponent('${key}'))">` +
    `<svg viewBox="0 0 24 24"><polygon points="12 2 15 8.5 22 9.3 16.8 13.9 18.2 21 12 17.3 5.8 21 7.2 13.9 2 9.3 9 8.5 12 2"/></svg></button>`;
}

// --- Header / conta ---

export function renderAccountLabel() {
  document.getElementById('accountLabel').textContent = accountName() + ' · clique para contas';
}

export function renderAccountList() {
  const list = ensureAccounts(), active = account().id;
  document.getElementById('accountList').innerHTML = list.map(a =>
    `<div class="account-row ${a.id === active ? 'active' : ''}">
      <div><b>${esc(a.name)}</b>
      <div style="color:var(--muted);font-size:12px">${loadHistoryFor(a.id).length} relatórios salvos</div></div>
      <button class="btn" onclick="window._switchAccount('${a.id}')">Abrir</button>
    </div>`
  ).join('');
}

// --- KPIs principais ---

export function periodLabel() { return state.currentPeriod + ' dias'; }

export function periodButtons() {
  const p = state.currentPeriod;
  return `<span class="period-toggle">
    <button class="${p === 30 ? 'active' : ''}" onclick="window._setPeriod(30)">30d</button>
    <button class="${p === 15 ? 'active' : ''}" onclick="window._setPeriod(15)">15d</button>
    <button class="${p === 7  ? 'active' : ''}" onclick="window._setPeriod(7)">7d</button>
  </span>`;
}

export function renderKpis(products) {
  const rev       = products.reduce((a, p) => a + revOf(p), 0);
  const units     = products.reduce((a, p) => a + unitsOf(p), 0);
  const clips     = products.filter(hasClip).length;
  const noClips   = products.length - clips;
  const needAction = actionItems(products).length;
  const needImgs  = products.filter(needsImages).length;
  const favCount  = products.filter(isFav).length;
  const health    = catalogHealthScore(products);

  document.getElementById('sub').textContent =
    accountName() + ' · ' + products.length + ' produtos · ' + new Date().toLocaleDateString('pt-BR');

  document.getElementById('statusRow').innerHTML =
    periodButtons() +
    `<button class="pill btn-pill" onclick="window._filterClips('with')"><strong>${clips}</strong> com clips</button>` +
    `<button class="pill btn-pill" onclick="window._filterClips('without')"><strong>${noClips}</strong> sem clips</button>` +
    `<span class="pill"><strong>${favCount}</strong> favoritos</span>` +
    `<span class="pill health-pill" title="Score de saúde: clips, imagens e ritmo"><strong>${health}</strong>/100 saúde</span>`;

  document.getElementById('kpis').innerHTML =
    kpiCard('Receita ' + periodLabel(),  money(rev),                    products.length + ' produtos analisados',      'bar')     +
    kpiCard('Unidades',                  small(units),                  'vendidas no período',                         'arrow')   +
    kpiCard('Ticket médio',              money(units ? rev / units : 0),'receita por unidade',                         'dollar')  +
    kpiCard('Plano de ação',             needAction,                    needImgs + ' anúncios com menos de 7 imagens', 'check');
}

function kpiCard(label, value, sub, icon) {
  const paths = {
    bar:    '<path d="M4 19V5"/><path d="M4 19h16"/><path d="M8 16V9"/><path d="M13 16V6"/><path d="M18 16v-4"/>',
    arrow:  '<path d="M3 12h18"/><path d="m15 6 6 6-6 6"/>',
    dollar: '<path d="M12 1v22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7H14a3.5 3.5 0 0 1 0 7H6"/>',
    check:  '<path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>',
  };
  return `<div class="card kpi"><small><svg class="ico" viewBox="0 0 24 24">${paths[icon]||''}</svg>${label}</small>` +
    `<strong>${value}</strong><span>${sub}</span></div>`;
}

// --- Plano de ação ---

export function renderActionPlan(products) {
  const nImgs  = products.filter(needsImages).length;
  const nClip  = products.filter(p => !hasClip(p)).length;
  const nDown  = products.filter(p => rhythm(p.trend).cls === 'down').length;
  const total  = actionItems(products).length;
  document.getElementById('actionPlanCount').textContent = total + ' itens para ajustar';
  document.getElementById('actionPlan').innerHTML = [
    { label: 'Imagens insuficientes', sub: 'Menos de 7 imagens no anúncio',    n: nImgs },
    { label: 'Sem clips',             sub: 'Ativar clip para testar conversão', n: nClip },
    { label: 'Em queda',              sub: 'Revisar preço, título e oferta',    n: nDown },
  ].map(x =>
    `<div class="action-item"><div><b>${x.label}</b><span>${x.sub}</span></div><div class="action-num">${x.n}</div></div>`
  ).join('');
}

// --- Insights visão geral (novas análises) ---

export function renderInsightsOverview(products) {
  const el = document.getElementById('overviewInsights');
  if (!el) return;
  const pareto = paretoInfo(products);
  const lift   = clipLift(products);
  const health = catalogHealthScore(products);
  const healthLabel = health >= 75 ? 'Catálogo saudável' : health >= 50 ? 'Catálogo com pontos a melhorar' : 'Catálogo precisa de atenção';

  el.innerHTML =
    `<div class="card insight">
      <b>Concentração 80/20</b>
      <p>${pareto.count} produto${pareto.count !== 1 ? 's' : ''} (${pareto.pct}% do catálogo) geram 80% da receita.</p>
    </div>
    <div class="card insight">
      <b>Impacto do clip</b>
      <p>Com clip: ${money(lift.avgWith)} médio. Sem clip: ${money(lift.avgNo)} médio.
        ${lift.lift > 0 ? `<b class="up">+${lift.lift.toFixed(0)}% de diferença</b>` : `<b class="down">${lift.lift.toFixed(0)}%</b>`}.</p>
    </div>
    <div class="card insight">
      <b>${healthLabel}</b>
      <p>Score ${health}/100 — ponderado por clips ativos (35%), imagens (30%), crescimento (20%) e ausência de queda (15%).</p>
    </div>`;
}

// --- Aba Ranking ---

export function buildRanking(products) {
  const cats = [...new Set(products.map(p => p.cat))].sort();
  document.getElementById('catFilter').innerHTML =
    '<option value="">Todas</option>' + cats.map(c => `<option>${esc(c)}</option>`).join('');
  renderRanking(products);
}

export function renderRanking(products) {
  const q = document.getElementById('searchRank').value.toLowerCase();
  const c = document.getElementById('catFilter').value;
  let list = [...products].sort((a, b) => revOf(b) - revOf(a));
  if (q) list = list.filter(p => (p.name + ' ' + p.id).toLowerCase().includes(q));
  if (c) list = list.filter(p => p.cat === c);
  document.getElementById('rankCount').textContent = list.length + ' produtos';
  document.getElementById('rankBody').innerHTML = list.map((p, i) =>
    `<tr>
      <td>${starBtn(p)}</td><td>${i + 1}</td><td>${pcell(p)}</td>
      <td>${esc(p.cat || 'Outros')}</td>
      <td>${money(p.price)}${p.old ? `<span class="old">${money(p.old)}</span>` : ''}</td>
      <td><b>${money(revOf(p))}</b></td>
      <td>${small(unitsOf(p))}</td>
      <td class="rhythm">${rhythmHtml(p)}</td>
      <td>${p.rating ? p.rating.toFixed(1).replace('.', ',') : '-'}</td>
      <td>${productStatus(p)}</td>
    </tr>`
  ).join('') || '<tr><td colspan="10" class="empty">Nenhum produto encontrado</td></tr>';
}

// --- Aba Todos ---

export function renderTodos(products) {
  const q        = document.getElementById('searchAll').value.toLowerCase();
  const sort     = document.getElementById('sortAll').value;
  const clipMode = document.getElementById('clipFilter').value;
  let list = [...products];
  if (clipMode === 'with')    list = list.filter(hasClip);
  if (clipMode === 'without') list = list.filter(p => !hasClip(p));
  if (q) list = list.filter(p => (p.name + ' ' + p.id).toLowerCase().includes(q));
  list.sort((a, b) =>
    sort === 'ritmo'     ? rhythm(b.trend).rank - rhythm(a.trend).rank :
    sort === 'preco'     ? b.price   - a.price   :
    sort === 'imagens'   ? b.images  - a.images  :
    sort === 'avaliacoes'? b.reviews - a.reviews  :
    revOf(b) - revOf(a)
  );
  document.getElementById('allCount').textContent = list.length + ' produtos';
  document.getElementById('allBody').innerHTML = list.map((p, i) =>
    `<tr>
      <td>${starBtn(p)}</td><td>${i + 1}</td><td>${pcell(p)}</td>
      <td>${money(p.price)}</td><td>${p.old ? money(p.old) : '-'}</td>
      <td>${money(revOf(p))}</td><td>${small(unitsOf(p))}</td>
      <td class="rhythm">${rhythmHtml(p)}</td>
      <td>${p.images ? Math.round(p.images) : '-'}</td>
      <td>${hasClip(p) ? '<span class="badge green">Sim</span>' : '<span class="badge amber">Não</span>'}</td>
    </tr>`
  ).join('') || '<tr><td colspan="10" class="empty">Nenhum produto encontrado</td></tr>';
}

// --- Aba Ritmo ---

export function renderRitmo(products) {
  const cres   = products.filter(p => rhythm(p.trend).cls === 'up');
  const queda  = products.filter(p => rhythm(p.trend).cls === 'down');
  const est    = products.filter(p => rhythm(p.trend).cls === 'flat');
  const semClip = products.filter(p => !hasClip(p));
  const risk   = queda.reduce((a, p) => a + revOf(p), 0);

  function kpi(filter, label, value, sub) {
    return `<div class="card kpi clickable ${state.ritmoFilter === filter ? 'active' : ''}" onclick="window._selectRitmoFilter('${filter}')">` +
      `<small>${label}</small><strong>${value}</strong><span>${sub}</span></div>`;
  }

  document.getElementById('ritmoKpis').innerHTML =
    kpi('up',     'Crescente',  cres.length,    'anúncios para escalar') +
    kpi('flat',   'Estável',    est.length,     'testar novas ofertas') +
    kpi('down',   'Queda',      queda.length,   money(risk) + ' em atenção') +
    kpi('noclip', 'Sem clips',  semClip.length, 'prioridade de mídia');

  document.getElementById('ritmoInsights').innerHTML =
    `<div class="card insight"><b>Escalar</b><p>Produtos crescentes devem receber estoque, campanha e proteção de preço.</p></div>` +
    `<div class="card insight"><b>Recuperar</b><p>Anúncios em queda pedem revisão de preço, foto principal, título e clip ativo.</p></div>` +
    `<div class="card insight"><b>Testar</b><p>Estáveis podem ganhar tração com kits, cupom leve e novas imagens.</p></div>`;

  const list = _ritmoList(products);
  const asc = !state.ritmoSortDesc;
  document.getElementById('ritmoSortBtn').innerHTML = asc
    ? '<svg class="ico" viewBox="0 0 24 24"><path d="M12 19V5"/><path d="m5 12 7-7 7 7"/></svg>Menor faturamento'
    : '<svg class="ico" viewBox="0 0 24 24"><path d="M12 5v14"/><path d="m19 12-7 7-7-7"/></svg>Maior faturamento';
  document.getElementById('ritmoCount').textContent = list.length + ' anúncios filtrados';
  document.getElementById('ritmoBody').innerHTML = list.map(p =>
    `<tr>
      <td>${starBtn(p)}</td><td>${pcell(p)}</td>
      <td class="rhythm">${rhythmHtml(p)}</td>
      <td>${money(revOf(p))}</td><td>${small(unitsOf(p))}</td>
      <td>${hasClip(p) ? '<span class="badge green">Sim</span>' : '<span class="badge amber">Não</span>'}</td>
      <td>${p.images ? Math.round(p.images) : '-'}</td>
      <td>${recommendation(p)}</td>
    </tr>`
  ).join('') || '<tr><td colspan="8" class="empty">Nenhum anúncio neste filtro</td></tr>';
}

function _ritmoList(products) {
  let list = [...products];
  if (state.ritmoFilter === 'up')     list = list.filter(p => rhythm(p.trend).cls === 'up');
  if (state.ritmoFilter === 'flat')   list = list.filter(p => rhythm(p.trend).cls === 'flat');
  if (state.ritmoFilter === 'down')   list = list.filter(p => rhythm(p.trend).cls === 'down');
  if (state.ritmoFilter === 'noclip') list = list.filter(p => !hasClip(p));
  return list.sort((a, b) => state.ritmoSortDesc ? revOf(b) - revOf(a) : revOf(a) - revOf(b));
}

// --- Aba Categorias ---

function categoryRows(products) {
  const groups = {};
  products.forEach(p => {
    const k = p.cat || 'Outros';
    if (!groups[k]) groups[k] = [];
    groups[k].push(p);
  });
  return Object.keys(groups).map(k => {
    const list = groups[k];
    return {
      cat: k, list,
      rev:   list.reduce((a, p) => a + revOf(p), 0),
      units: list.reduce((a, p) => a + unitsOf(p), 0),
      cres:  list.filter(p => rhythm(p.trend).cls === 'up').length,
      est:   list.filter(p => rhythm(p.trend).cls === 'flat').length,
      queda: list.filter(p => rhythm(p.trend).cls === 'down').length,
      sem:   list.filter(p => !hasClip(p)).length,
    };
  }).sort((a, b) => b.rev - a.rev);
}

export function renderCategories(products) {
  const rows = categoryRows(products);
  if (!rows.length) {
    document.getElementById('categoryCount').textContent = '0 categorias';
    document.getElementById('categoryCards').innerHTML = '';
    document.getElementById('categoryBody').innerHTML = '<tr><td colspan="8" class="empty">Nenhuma categoria encontrada</td></tr>';
    document.getElementById('categoryProductsBody').innerHTML = '';
    return;
  }
  if (!state.selectedCategory || !rows.find(r => r.cat === state.selectedCategory)) {
    state.selectedCategory = rows[0].cat;
  }
  document.getElementById('categoryCount').textContent = rows.length + ' categorias';
  document.getElementById('categoryCards').innerHTML = rows.map(r => {
    const enc = encodeURIComponent(r.cat);
    return `<div class="card category-card ${r.cat === state.selectedCategory ? 'active' : ''}" onclick="window._selectCategory(decodeURIComponent('${enc}'))">
      <b>${esc(r.cat)}</b>
      <div class="meta"><span>${r.list.length} anúncios</span><span>${money(r.rev)}</span><span>${r.cres} crescendo</span><span>${r.sem} sem clips</span></div>
    </div>`;
  }).join('');
  document.getElementById('categoryBody').innerHTML = rows.map(r => {
    const enc = encodeURIComponent(r.cat);
    return `<tr class="category-row ${r.cat === state.selectedCategory ? 'active' : ''}" onclick="window._selectCategory(decodeURIComponent('${enc}'))">
      <td><b>${esc(r.cat)}</b></td><td>${r.list.length}</td><td>${money(r.rev)}</td><td>${small(r.units)}</td>
      <td class="up">${r.cres}</td><td class="flat">${r.est}</td><td class="down">${r.queda}</td><td>${r.sem}</td>
    </tr>`;
  }).join('');
  _renderCategoryProducts(products);
}

function _renderCategoryProducts(products) {
  const rows = categoryRows(products);
  const row = rows.find(r => r.cat === state.selectedCategory) || rows[0];
  if (!row) { document.getElementById('categoryProductsBody').innerHTML = ''; return; }
  state.selectedCategory = row.cat;
  const list = [...row.list].sort((a, b) =>
    state.categorySortDesc ? revOf(b) - revOf(a) : revOf(a) - revOf(b)
  );
  document.getElementById('selectedCategoryTitle').textContent = 'Anúncios · ' + row.cat;
  document.getElementById('selectedCategoryMeta').textContent =
    row.list.length + ' anúncios · ' + money(row.rev) + ' gerados · ' + row.sem + ' sem clips';
  document.getElementById('categorySortBtn').innerHTML = state.categorySortDesc
    ? '<svg class="ico" viewBox="0 0 24 24"><path d="M12 5v14"/><path d="m19 12-7 7-7-7"/></svg>Maior faturamento'
    : '<svg class="ico" viewBox="0 0 24 24"><path d="M12 19V5"/><path d="m5 12 7-7 7 7"/></svg>Menor faturamento';
  document.getElementById('categoryProductsBody').innerHTML = list.map((p, i) =>
    `<tr>
      <td><span class="rank-icon">${i + 1}</span></td><td>${pcell(p)}</td>
      <td><b>${money(revOf(p))}</b></td><td>${small(unitsOf(p))}</td>
      <td class="rhythm">${rhythmHtml(p)}</td>
      <td>${hasClip(p) ? '<span class="badge green">Sim</span>' : '<span class="badge amber">Não</span>'}</td>
      <td>${p.images ? Math.round(p.images) : '-'}</td>
      <td>${recommendation(p)}</td>
    </tr>`
  ).join('') || '<tr><td colspan="8" class="empty">Nenhum anúncio nesta categoria</td></tr>';
}

// --- Aba Favoritos ---

export function renderFavorites(products) {
  const list   = products.filter(isFav);
  const rev    = list.reduce((a, p) => a + revOf(p), 0);
  const units  = list.reduce((a, p) => a + unitsOf(p), 0);
  const growing = list.filter(p => rhythm(p.trend).cls === 'up').length;
  const clips  = list.filter(hasClip).length;
  document.getElementById('favKpis').innerHTML =
    `<div class="card kpi"><small>Favoritos</small><strong>${list.length}</strong><span>anúncios salvos</span></div>` +
    `<div class="card kpi"><small>Receita favorita</small><strong>${money(rev)}</strong><span>${small(units)} unidades</span></div>` +
    `<div class="card kpi"><small>Crescentes</small><strong>${growing}</strong><span>favoritos em alta</span></div>` +
    `<div class="card kpi"><small>Clips</small><strong>${clips} / ${list.length - clips}</strong><span>com clips / sem clips</span></div>`;
  document.getElementById('favCount').textContent = list.length + ' anúncios';
  document.getElementById('favBody').innerHTML = list.map(p =>
    `<tr>
      <td>${starBtn(p)}</td><td>${pcell(p)}</td>
      <td>${money(revOf(p))}</td><td>${small(unitsOf(p))}</td>
      <td class="rhythm">${rhythmHtml(p)}</td>
      <td>${hasClip(p) ? '<span class="badge green">Sim</span>' : '<span class="badge amber">Não</span>'}</td>
      <td>${p.images ? Math.round(p.images) : '-'}</td>
      <td>${recommendation(p)}</td>
    </tr>`
  ).join('') || '<tr><td colspan="8" class="empty">Nenhum anúncio favoritado ainda. Use a estrela nas tabelas para salvar.</td></tr>';
}

// --- Aba Comparação ---

export function buildCompare() {
  const h = hist().sort((a, b) => a.uploadedAt - b.uploadedAt);
  const html = h.map(x =>
    `<option value="${x.id}">${new Date(x.uploadedAt).toLocaleDateString('pt-BR')} · ${esc(x.fileName)}</option>`
  ).join('');
  document.getElementById('cmpA').innerHTML = html;
  document.getElementById('cmpB').innerHTML = html;
  if (h.length >= 2) {
    document.getElementById('cmpA').value = h[h.length - 2].id;
    document.getElementById('cmpB').value = h[h.length - 1].id;
  }
  renderCompare();
}

export function renderCompare() {
  const h = hist();
  const a = h.find(x => x.id === document.getElementById('cmpA').value);
  const b = h.find(x => x.id === document.getElementById('cmpB').value);
  if (!a || !b || h.length < 2) {
    document.getElementById('cmpEmpty').style.display = 'block';
    document.getElementById('cmpContent').style.display = 'none';
    return;
  }
  document.getElementById('cmpEmpty').style.display = 'none';
  document.getElementById('cmpContent').style.display = 'block';
  a.products = (a.products || []).map(normalizeProduct);
  b.products = (b.products || []).map(normalizeProduct);
  const ra = a.products.reduce((s, p) => s + revOf(p), 0);
  const rb = b.products.reduce((s, p) => s + revOf(p), 0);
  const ua = a.products.reduce((s, p) => s + unitsOf(p), 0);
  const ub = b.products.reduce((s, p) => s + unitsOf(p), 0);
  document.getElementById('cmpKpis').innerHTML =
    ckpi('Receita', ra, rb, true) + ckpi('Unidade', ua, ub, false) +
    ckpi('Produtos', a.products.length, b.products.length, false) +
    ckpi('Ticket médio', ua ? ra / ua : 0, ub ? rb / ub : 0, true);
  const ma = Object.fromEntries(a.products.map(p => [keyOf(p), p]));
  const mb = Object.fromEntries(b.products.map(p => [keyOf(p), p]));
  const keys = [...new Set([...Object.keys(ma), ...Object.keys(mb)])];
  const list = keys.map(k => {
    const pa = ma[k] || {}, pb = mb[k] || {};
    const p = normalizeProduct(Object.assign({}, pa, pb, {
      name: pb.name || pa.name || k,
      id:   pb.id   || pa.id   || k,
      trend: pb.trend == null ? null : pb.trend,
    }));
    return { p, a: revOf(pa), b: revOf(pb), old: pa.price || pa.old || 0, now: pb.price || 0, d: revOf(pb) - revOf(pa) };
  }).sort((x, y) => Math.abs(y.d) - Math.abs(x.d)).slice(0, 40);
  document.getElementById('cmpCount').textContent = list.length + ' variações';
  document.getElementById('cmpBody').innerHTML = list.map(r =>
    `<tr>
      <td>${pcell(r.p)}</td>
      <td>${r.old ? money(r.old) : '-'}</td><td>${r.now ? money(r.now) : '-'}</td>
      <td>${money(r.a)}</td><td>${money(r.b)}</td>
      <td class="${r.d >= 0 ? 'up' : 'down'}">${r.d >= 0 ? '+' : '-'}${money(Math.abs(r.d))}</td>
      <td class="rhythm">${rhythmHtml(r.p)}</td>
    </tr>`
  ).join('');
}

function ckpi(l, a, b, isMoney) {
  const pct = a ? ((b - a) / a) * 100 : b ? 100 : 0;
  const cls = pct > 0.5 ? 'up' : pct < -0.5 ? 'down' : 'flat';
  const f = isMoney ? money : small;
  return `<div class="card kpi"><small>${l}</small><strong>${f(b)}</strong>` +
    `<span>antes: ${f(a)} · <b class="${cls}">${pct >= 0 ? '+' : ''}${pct.toFixed(1).replace('.', ',')}%</b></span></div>`;
}
