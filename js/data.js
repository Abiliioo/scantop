import { S, MARKETPLACE_MAPS, MARKETPLACE_LABELS } from './config.js';
import { state } from './state.js';
import { detect, num, parseTrend, pid, uid, esc, toast } from './utils.js';
import { hist, saveHist } from './storage.js';
import { inferCat } from './analytics.js';

function applyMarketplaceMap(cols) {
  const preset = MARKETPLACE_MAPS[state.marketplace];
  if (!preset) return;
  Object.entries(preset).forEach(([key, colName]) => {
    state.map[key] = cols.includes(colName) ? colName : '';
  });
}

export const defs = [
  ['name',    'Nome do produto',        1, ['nome','produto','title','titulo','título','item']],
  ['id',      'ID do produto',          0, ['id','sku','codigo','código','produto id','item id']],
  ['price',   'Preço atual',            0, ['preço','preco','price','valor atual','sale price']],
  ['old',     'Preço anterior',         0, ['preço anterior','preco anterior','old price','antes','original']],
  ['rev',     'Receita 30d',            0, ['receita 30','receita','revenue','faturamento','gmv']],
  ['rev15',   'Receita 15d',            0, ['receita 15','revenue 15','faturamento 15','15d']],
  ['rev7',    'Receita 7d',             0, ['receita 7','revenue 7','faturamento 7','7d']],
  ['units',   'Unidades 30d',           0, ['unidades 30','units 30','unidades','units','vendas','sold','volume']],
  ['units15', 'Unidades 15d',           0, ['unidades 15','units 15','vendas 15','volume 15']],
  ['units7',  'Unidades 7d',            0, ['unidades 7','units 7','vendas 7','volume 7']],
  ['trend',   'Tendência (%)',          0, ['tendência','tendencia','trend','variação','variacao','crescimento']],
  ['rating',  'Nota',                   0, ['nota','rating','classificação','classificacao','estrela']],
  ['reviews', 'Avaliações',             0, ['avaliações','avaliacoes','reviews','comentários','comentarios']],
  ['images',  'Quantidade de imagens',  0, ['imagem','imagens','images','fotos','photos']],
  ['clip',    'Clip ativo',             0, ['clip','clipe','clips','tem clip','com clip','clip de desconto','cupom clip','coupon clip','video','vídeo']],
  ['cat',     'Categoria',              0, ['categoria','category','tipo']],
];

export function normalizeProduct(p) {
  p.price    = p.price    || 0;
  p.old      = p.old      || 0;
  p.rev      = p.rev      || 0;
  p.rev15    = p.rev15    || 0;
  p.rev7     = p.rev7     || 0;
  p.units    = p.units    || 0;
  p.units15  = p.units15  || 0;
  p.units7   = p.units7   || 0;
  p.images   = p.images   || 0;
  p.clip     = p.clip     || '';
  p.clipSource = p.clipSource || '';
  p.id       = p.id       || pid(p.name, '');
  p.cat      = p.cat      || inferCat(p);
  return p;
}

export function handleFile(f, onSuccess) {
  if (!f) return;
  state.fname = f.name;
  document.getElementById('loading').classList.add('open');
  const ext = f.name.split('.').pop().toLowerCase();
  const r = new FileReader();
  r.onload = e => {
    try {
      if (ext === 'csv') {
        const parsed = Papa.parse(e.target.result, { header: true, skipEmptyLines: true });
        openMap(parsed.data, onSuccess);
      } else {
        const wb = XLSX.read(e.target.result, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        openMap(XLSX.utils.sheet_to_json(ws, { defval: '' }), onSuccess);
      }
    } catch (err) {
      document.getElementById('loading').classList.remove('open');
      toast('Erro ao ler o arquivo. Verifique se é um CSV ou Excel válido.', 'error');
    }
  };
  ext === 'csv' ? r.readAsText(f, 'UTF-8') : r.readAsArrayBuffer(f);
}

export function openMap(data, onSuccess) {
  document.getElementById('loading').classList.remove('open');
  if (!data || !data.length) {
    toast('Nenhum dado encontrado no arquivo.', 'error');
    return;
  }
  state.rows = data;
  const cols = Object.keys(data[0]);
  state.map = {};

  if (state.marketplace) {
    applyMarketplaceMap(cols);
    if (state.map.name) {
      toast('Colunas do ' + MARKETPLACE_LABELS[state.marketplace] + ' detectadas automaticamente.', 'success');
      confirmMap(onSuccess);
      return;
    }
    toast('Arquivo não corresponde ao formato do ' + MARKETPLACE_LABELS[state.marketplace] + '. Confira o mapeamento.', 'error');
  }

  defs.forEach(d => { state.map[d[0]] = detect(cols, d[3]); });
  document.getElementById('map').innerHTML = defs.map(d =>
    `<label>${d[1]}${d[2] ? ' *' : ''}</label>` +
    `<select onchange="window._setMap('${d[0]}', this.value)">` +
    `<option value="">Não mapear</option>` +
    cols.map(c => `<option value="${esc(c)}"${state.map[d[0]] === c ? ' selected' : ''}>${esc(c)}</option>`).join('') +
    `</select>`
  ).join('');
  document.getElementById('modal').classList.add('open');
}

export function confirmMap(onSuccess) {
  if (!state.map.name) {
    toast('Mapeie o nome do produto antes de continuar.', 'error');
    return;
  }
  state.products = state.rows.map((row, i) => {
    const name = String(row[state.map.name] || 'Produto ' + (i + 1)).trim();
    const p = {
      name,
      id:        pid(name, state.map.id      ? row[state.map.id]      : ''),
      price:     state.map.price   ? num(row[state.map.price])   : 0,
      old:       state.map.old     ? num(row[state.map.old])     : 0,
      rev:       state.map.rev     ? num(row[state.map.rev])     : 0,
      rev15:     state.map.rev15   ? num(row[state.map.rev15])   : 0,
      rev7:      state.map.rev7    ? num(row[state.map.rev7])    : 0,
      units:     state.map.units   ? num(row[state.map.units])   : 0,
      units15:   state.map.units15 ? num(row[state.map.units15]) : 0,
      units7:    state.map.units7  ? num(row[state.map.units7])  : 0,
      trend:     state.map.trend   ? parseTrend(row[state.map.trend])  : null,
      rating:    state.map.rating  ? num(row[state.map.rating])  : 0,
      reviews:   state.map.reviews ? num(row[state.map.reviews]) : 0,
      images:    state.map.images  ? num(row[state.map.images])  : 0,
      clip:      state.map.clip    ? String(row[state.map.clip] || '').trim() : '',
      clipSource: state.map.clip || '',
      catRaw:    state.map.cat     ? String(row[state.map.cat] || '').trim()  : '',
    };
    p.cat = inferCat(p);
    return p;
  }).filter(p => p.name);
  document.getElementById('modal').classList.remove('open');
  saveSnap();
  onSuccess();
}

export function saveSnap() {
  const h = hist();
  const s = {
    id: uid(),
    fileName: state.fname,
    uploadedAt: Date.now(),
    marketplace: state.marketplace || null,
    products: state.products,
    total: state.products.reduce((a, p) => a + (p.rev || 0), 0),
  };
  h.push(s);
  saveHist(h);
  state.current = s.id;
  localStorage.setItem(S.snap, s.id);
}

export function openSnap(id, onSuccess) {
  const s = hist().find(x => x.id === id);
  if (!s) return;
  state.products = (s.products || []).map(normalizeProduct);
  state.current = s.id;
  state.marketplace = s.marketplace || null;
  localStorage.setItem(S.snap, s.id);
  onSuccess();
}
