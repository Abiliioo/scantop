import { S, MARKETPLACE_LABELS } from './config.js';
import { state } from './state.js';
import { toast } from './utils.js';
import { ensureAccounts, hist, saveHist } from './storage.js';
import { handleFile, openMap, confirmMap, openSnap } from './data.js';
import { toggleFavKey, isFav } from './analytics.js';
import { drawCharts } from './charts.js';
import {
  renderAccountLabel, renderAccountList,
  renderKpis, renderActionPlan, renderInsightsOverview,
  buildRanking, renderRanking, renderTodos,
  renderRitmo, renderCategories, renderFavorites,
  buildCompare, renderCompare,
} from './render.js';

// --- Migração de dados ecompulse → scantop ---

function _migrateFromEcomPulse() {
  if (!localStorage.getItem('ecompulse_accounts_v5')) return;
  const direct = {
    'ecompulse_net_eletrica_history_v3': S.hist,
    'ecompulse_net_eletrica_active_v3':  S.snap,
    'ecompulse_net_eletrica_tab_v3':     S.tab,
    'ecompulse_screen_v4':               S.screen,
    'ecompulse_theme':                   S.theme,
    'ecompulse_favorites_v4':            S.fav,
    'ecompulse_accounts_v5':             S.accounts,
    'ecompulse_active_account_v5':       S.activeAccount,
    'ecompulse_revenue_period_v5':       S.period,
    'ecompulse_marketplace_v1':          S.marketplace,
  };
  Object.entries(direct).forEach(([old, neo]) => {
    const v = localStorage.getItem(old);
    if (v !== null && localStorage.getItem(neo) === null) localStorage.setItem(neo, v);
  });
  const prefixes = [
    ['ecompulse_net_eletrica_history_v3_', S.hist + '_'],
    ['ecompulse_favorites_v4_',            S.fav  + '_'],
  ];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    prefixes.forEach(([oldPfx, newPfx]) => {
      if (key && key.startsWith(oldPfx)) {
        const neo = newPfx + key.slice(oldPfx.length);
        const v = localStorage.getItem(key);
        if (v !== null && localStorage.getItem(neo) === null) localStorage.setItem(neo, v);
      }
    });
  }
}

// --- Orquestração ---

function build() {
  document.getElementById('upload').style.display = 'none';
  document.getElementById('dash').style.display = 'block';
  document.body.classList.toggle('meli-mode', state.marketplace === 'meli');
  localStorage.setItem(S.screen, 'dashboard');
  renderAccountLabel();
  renderKpis(state.products);
  renderActionPlan(state.products);
  renderInsightsOverview(state.products);
  drawCharts(state.products);
  _renderAllViews();
  showTab(localStorage.getItem(S.tab) || 'overview', false);
}

function _renderAllViews() {
  buildRanking(state.products);
  renderTodos(state.products);
  renderRitmo(state.products);
  renderCategories(state.products);
  renderFavorites(state.products);
  buildCompare();
  _updateHeaderFavState();
}

function _updateHeaderFavState() {
  const count = state.products.filter(p => isFav(p)).length;
  document.getElementById('favHeaderBtn').title = count + ' favoritos';
}

// --- Navegação ---

function showTab(id, persist = true) {
  if (!state.products.length && id !== 'overview') { window._showHome(); return; }
  document.getElementById('dash').style.display = 'block';
  document.getElementById('upload').style.display = 'none';
  localStorage.setItem(S.screen, 'dashboard');
  document.querySelectorAll('.pane').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  const tab = document.querySelector(`[data-tab="${id}"]`);
  if (tab) tab.classList.add('active');
  if (persist) localStorage.setItem(S.tab, id);
  _setHeaderActive(id);
  if (id === 'favorites') renderFavorites(state.products);
  if (id === 'categorias') renderCategories(state.products);
  if (id === 'compare') buildCompare();
}

function _setHeaderActive(screen) {
  document.getElementById('homeBtn').classList.toggle('nav-active',    screen === 'home');
  document.getElementById('favHeaderBtn').classList.toggle('nav-active', screen === 'favorites');
  document.getElementById('catHeaderBtn').classList.toggle('nav-active', screen === 'categorias');
}

function applyTheme(t) {
  document.documentElement.dataset.theme = t;
  document.getElementById('themeBtn').innerHTML = t === 'dark'
    ? '<svg class="ico" viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>'
    : '<svg class="ico" viewBox="0 0 24 24"><path d="M12 3a6 6 0 0 0 9 7.5A9 9 0 1 1 12 3Z"/></svg>';
}

// --- Drag & drop ---

const dz = document.getElementById('drop');
dz.addEventListener('dragover', e => { e.preventDefault(); dz.classList.add('drag'); });
dz.addEventListener('dragleave', () => dz.classList.remove('drag'));
dz.addEventListener('drop', e => {
  e.preventDefault();
  dz.classList.remove('drag');
  if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0], build);
});

function _updateMkButtons() {
  const mk = state.marketplace;
  document.querySelectorAll('.mk-btn').forEach(b => b.classList.toggle('selected', b.dataset.mk === mk));
  const badge = document.getElementById('mkBadge');
  const clear = document.getElementById('mkClear');
  if (!badge) return;
  if (mk) {
    badge.textContent = MARKETPLACE_LABELS[mk];
    badge.className = 'mk-badge ' + mk;
    badge.style.display = 'inline-flex';
    clear.style.display = 'inline-flex';
  } else {
    badge.style.display = 'none';
    clear.style.display = 'none';
  }
}

// --- Exposição global (usada por onclick no HTML) ---

window._showHome = function () {
  if (state.products.length) {
    document.getElementById('dash').style.display = 'block';
    document.getElementById('upload').style.display = 'none';
    showTab('overview');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    localStorage.setItem(S.screen, 'dashboard');
    _setHeaderActive('home');
  } else {
    document.getElementById('dash').style.display = 'none';
    document.getElementById('upload').style.display = 'grid';
    document.getElementById('file').value = '';
    localStorage.setItem(S.screen, 'home');
    _setHeaderActive('home');
    _updateMkButtons();
  }
};

window._newUpload = function () {
  document.getElementById('dash').style.display = 'none';
  document.getElementById('upload').style.display = 'grid';
  document.getElementById('file').value = '';
  localStorage.setItem(S.screen, 'upload');
  _setHeaderActive('upload');
  _updateMkButtons();
};

window._selectMarketplace = function (mk) {
  state.marketplace = mk;
  localStorage.setItem(S.marketplace, mk);
  _updateMkButtons();
};

window._clearMarketplace = function () {
  state.marketplace = null;
  localStorage.removeItem(S.marketplace);
  _updateMkButtons();
};

window._showTab = (id) => showTab(id);

window._openFavorites = function () {
  if (!state.products.length) { toast('Importe um arquivo primeiro.', 'info'); window._showHome(); return; }
  showTab('favorites');
};

window._openCategories = function () {
  if (!state.products.length) { toast('Importe um arquivo primeiro.', 'info'); window._showHome(); return; }
  showTab('categorias');
};

window._handleFile = (f) => handleFile(f, build);
window._setMap = (key, value) => { state.map[key] = value; };
window._confirmMap = () => confirmMap(build);
window._closeModal = () => document.getElementById('modal').classList.remove('open');
window._closeAccountModal = () => document.getElementById('accountModal').classList.remove('open');

window._toggleTheme = function () {
  const n = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  applyTheme(n);
  localStorage.setItem(S.theme, n);
  if (state.products.length) drawCharts(state.products);
};

window._setPeriod = function (days) {
  state.currentPeriod = Number(days);
  localStorage.setItem(S.period, state.currentPeriod);
  if (state.products.length) build();
};

window._filterClips = function (mode) {
  showTab('todos');
  document.getElementById('clipFilter').value = mode;
  renderTodos(state.products);
};

window._toggleFav = function (key) {
  toggleFavKey(key);
  _renderAllViews();
};

window._selectRitmoFilter = function (filter) {
  state.ritmoFilter = filter;
  renderRitmo(state.products);
};

window._toggleRitmoSort = function () {
  state.ritmoSortDesc = !state.ritmoSortDesc;
  renderRitmo(state.products);
};

window._selectCategory = function (cat) {
  state.selectedCategory = cat;
  renderCategories(state.products);
};

window._toggleCategorySort = function () {
  state.categorySortDesc = !state.categorySortDesc;
  renderCategories(state.products);
};

window._renderRanking = () => renderRanking(state.products);
window._renderTodos   = () => renderTodos(state.products);
window._renderCompare = () => renderCompare();

window._deleteReport = function () {
  const id = document.getElementById('cmpB').value || document.getElementById('cmpA').value;
  if (!id) return;
  const s = hist().find(x => x.id === id);
  if (!s || !confirm(`Excluir o relatório "${s.fileName}"?`)) return;
  const h = hist().filter(x => x.id !== id);
  saveHist(h);
  if (state.current === id) {
    if (h.length) openSnap(h[h.length - 1].id, build);
    else window._showHome();
  }
  buildCompare();
};

window._openAccountModal = function () {
  renderAccountList();
  document.getElementById('accountModal').classList.add('open');
  setTimeout(() => document.getElementById('newAccountName').focus(), 30);
};

window._createAccount = function () {
  const name = document.getElementById('newAccountName').value.trim();
  if (!name) { toast('Digite o nome da conta.', 'error'); return; }
  const list = ensureAccounts();
  const id = name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '-' + Date.now().toString(36);
  list.push({ id, name });
  localStorage.setItem(S.accounts, JSON.stringify(list));
  document.getElementById('newAccountName').value = '';
  window._switchAccount(id);
};

window._switchAccount = function (id) {
  localStorage.setItem(S.activeAccount, id);
  document.getElementById('accountModal').classList.remove('open');
  renderAccountLabel();
  const h = hist();
  if (h.length) openSnap(h[h.length - 1].id, build);
  else { state.products = []; state.current = null; window._showHome(); }
  renderAccountList();
};

// --- Init ---

(function init() {
  _migrateFromEcomPulse();
  ensureAccounts();
  renderAccountLabel();
  applyTheme(localStorage.getItem(S.theme) || 'dark');
  state.currentPeriod = Number(localStorage.getItem(S.period) || 30);
  const savedMk = localStorage.getItem(S.marketplace);
  if (savedMk) state.marketplace = savedMk;
  const h  = hist();
  const id = localStorage.getItem(S.snap);
  if (id && h.find(x => x.id === id) && localStorage.getItem(S.screen) !== 'home') {
    openSnap(id, build);
  } else if (h.length && localStorage.getItem(S.screen) !== 'home') {
    openSnap(h[h.length - 1].id, build);
  } else {
    window._showHome();
  }
})();
