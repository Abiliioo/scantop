export function esc(v) {
  return String(v == null ? '' : v).replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])
  );
}

export function money(n) {
  return (n || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function small(n) {
  n = Number(n) || 0;
  if (Math.abs(n) >= 1e6) return (n / 1e6).toFixed(1).replace('.', ',') + 'M';
  if (Math.abs(n) >= 1e3) return (n / 1e3).toFixed(1).replace('.', ',') + 'k';
  return n.toLocaleString('pt-BR', { maximumFractionDigits: 0 });
}

export function num(v) {
  if (v == null || v === '') return 0;
  let s = String(v).replace(/[^\d,.-]/g, '');
  if (s.includes(',') && s.includes('.')) s = s.replace(/\./g, '').replace(',', '.');
  else if (s.includes(',')) s = s.replace(',', '.');
  const n = parseFloat(s);
  return isFinite(n) ? n : 0;
}

export function parseTrend(v) {
  if (v == null || v === '') return null;
  const n = num(String(v).replace('%', ''));
  return isFinite(n) ? n : null;
}

export function clean(s) {
  // Remove diacriticos para comparacao aproximada de colunas
  return String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

export function detect(cols, cands) {
  return cols.find(col => cands.some(c => clean(col).includes(clean(c)))) || '';
}

export function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export function pid(name, fallback) {
  const d = String(fallback || '').trim();
  if (d) return d;
  const m = String(name).match(/\b(?:id|sku|cod|cód)[:\s#-]*([A-Z0-9._-]{3,})\b/i)
    || String(name).match(/\b([A-Z]{2,}[-_ ]?\d{3,}|\d{6,})\b/);
  return m ? m[1].replace(/\s+/g, '-') : 'sem ID';
}

export function toast(msg, type = 'info') {
  const el = document.createElement('div');
  el.className = 'toast toast-' + type;
  el.textContent = msg;
  document.body.appendChild(el);
  requestAnimationFrame(() => el.classList.add('show'));
  setTimeout(() => {
    el.classList.remove('show');
    setTimeout(() => el.remove(), 300);
  }, 3200);
}
