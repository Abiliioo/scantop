import { RHYTHM_LIMIT, MIN_IMAGES } from './config.js';
import { state } from './state.js';
import { favs, saveFavs } from './storage.js';
import { num, clean } from './utils.js';

export function inferCat(p) {
  if (p.catRaw) return p.catRaw;
  const n = p.name.toLowerCase();
  if (n.includes('disjuntor') || n.includes('quadro') || n.includes('barramento')) return 'Seg. elétrica';
  if (n.includes('tomada') || n.includes('extensão') || n.includes('extensao') || n.includes('filtro')) return 'Tomadas e extensões';
  if (n.includes('mangueira') || n.includes('jardim') || n.includes('irrig')) return 'Jardim';
  if (n.includes('nobreak') || n.includes('estabilizador')) return 'Energia';
  return 'Outros';
}

export function rhythm(t) {
  if (t == null) return { label: 'Estável', cls: 'flat', rank: 1 };
  if (t > RHYTHM_LIMIT) return { label: 'Crescente', cls: 'up', rank: 2 };
  if (t < -RHYTHM_LIMIT) return { label: 'Queda', cls: 'down', rank: 0 };
  return { label: 'Estável', cls: 'flat', rank: 1 };
}

export function hasClip(p) {
  if (state.marketplace === 'meli') return false;
  const raw = String(p.clip || '').trim();
  if (!raw) return false;
  const v = clean(raw);
  const source = clean(String(p.clipSource || ''));
  const falsy = ['0', '0.0', 'nao', 'não', 'no', 'false', 'falso', 'sem', 'none', 'n/a', '-', 'na'];
  if (falsy.includes(v)) return false;
  if (v.includes('sem clip') || v.includes('sem cupom') || v.includes('sem clipe') ||
      v.includes('nao possui') || v.includes('nao tem') || v.includes('nao tem') || v.includes('no clip')) return false;
  if (v.includes('inativo') || v.includes('inactive') || v.includes('nao ativo') ||
      v.includes('not active') || v.includes('desativado') || v.includes('expirado')) return false;
  const sourceIsClip = source.includes('clip') || source.includes('clipe') ||
    source.includes('cupom') || source.includes('coupon') || source.includes('video');
  if (['1', 'sim', 'yes', 'true', 'ativo', 'active', 'com', 'possui'].includes(v)) return true;
  if (v.includes('com clip') || v.includes('com clipe') || v.includes('clip ativo') ||
      v.includes('clipe ativo') || v.includes('possui clip') || v.includes('possui clipe')) return true;
  if (sourceIsClip && num(v) > 0) return true;
  return false;
}

export function revOf(p) {
  if (!p) return 0;
  const period = state.currentPeriod;
  if (period === 15 && p.rev15 > 0) return p.rev15;
  if (period === 7 && p.rev7 > 0) return p.rev7;
  return (p.rev || 0) * (period / 30);
}

export function unitsOf(p) {
  if (!p) return 0;
  const period = state.currentPeriod;
  if (period === 15 && p.units15 > 0) return p.units15;
  if (period === 7 && p.units7 > 0) return p.units7;
  return (p.units || 0) * (period / 30);
}

export function needsImages(p) { return (p.images || 0) < MIN_IMAGES; }

export function actionItems(products) {
  const meli = state.marketplace === 'meli';
  return products.filter(p => needsImages(p) || (!meli && !hasClip(p)) || rhythm(p.trend).cls === 'down');
}

export function recommendation(p) {
  const r = rhythm(p.trend).cls;
  if (state.marketplace !== 'meli' && !hasClip(p)) return 'Adicionar clip para elevar conversão';
  if (needsImages(p)) return 'Adicionar imagens: mínimo recomendado é 7';
  if (r === 'down') return 'Revisar preço, título e oferta';
  if (r === 'up') return 'Escalar estoque e campanha';
  return 'Testar desconto ou kit';
}

export function productStatus(p) {
  const r = rhythm(p.trend).cls;
  if (r === 'up') return '<span class="badge green">Escalar</span>';
  if (r === 'down') return '<span class="badge red">Revisar</span>';
  return '<span class="badge blue">Monitorar</span>';
}

export function topCategories(products) {
  const by = {};
  products.forEach(p => { by[p.cat] = (by[p.cat] || 0) + revOf(p); });
  const rows = Object.entries(by).sort((a, b) => b[1] - a[1]);
  const main = rows.slice(0, 4);
  const rest = rows.slice(4).reduce((a, r) => a + r[1], 0);
  if (rest > 0) main.push(['Outros', rest]);
  return main;
}

export function keyOf(p) {
  return p.id && p.id !== 'sem ID' ? p.id : p.name;
}

export function isFav(p) { return favs().has(keyOf(p)); }

export function toggleFavKey(key) {
  const set = favs();
  set.has(key) ? set.delete(key) : set.add(key);
  saveFavs(set);
}

// --- Novas análises ---

export function catalogHealthScore(products) {
  if (!products.length) return 0;
  const withImages = products.filter(p => !needsImages(p)).length / products.length;
  const growing    = products.filter(p => rhythm(p.trend).cls === 'up').length / products.length;
  const notFalling = products.filter(p => rhythm(p.trend).cls !== 'down').length / products.length;
  if (state.marketplace === 'meli') {
    return Math.round(withImages * 50 + growing * 25 + notFalling * 25);
  }
  const withClip = products.filter(hasClip).length / products.length;
  return Math.round(withClip * 35 + withImages * 30 + growing * 20 + notFalling * 15);
}

export function paretoInfo(products) {
  if (!products.length) return { count: 0, pct: 0 };
  const sorted = [...products].sort((a, b) => revOf(b) - revOf(a));
  const total = sorted.reduce((s, p) => s + revOf(p), 0);
  if (!total) return { count: 0, pct: 0 };
  let acc = 0, count = 0;
  for (const p of sorted) {
    acc += revOf(p);
    count++;
    if (acc >= total * 0.8) break;
  }
  return { count, pct: Math.round((count / products.length) * 100) };
}

export function clipLift(products) {
  const withClip = products.filter(hasClip);
  const noClip   = products.filter(p => !hasClip(p));
  const avgWith  = withClip.length ? withClip.reduce((s, p) => s + revOf(p), 0) / withClip.length : 0;
  const avgNo    = noClip.length   ? noClip.reduce((s, p) => s + revOf(p), 0)   / noClip.length   : 0;
  const lift     = avgNo > 0 ? ((avgWith - avgNo) / avgNo) * 100 : 0;
  return { avgWith, avgNo, lift };
}

export function salesVelocity(p) {
  return state.currentPeriod > 0 ? unitsOf(p) / state.currentPeriod : 0;
}
