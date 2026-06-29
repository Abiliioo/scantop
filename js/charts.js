import { state } from './state.js';
import { rhythm, hasClip, revOf, needsImages, topCategories, recommendation } from './analytics.js';
import { money, small } from './utils.js';

export function destroyChart(id) {
  if (state.charts[id]) { state.charts[id].destroy(); delete state.charts[id]; }
}

function registerDepthPlugin() {
  if (!window.Chart || Chart._ecompulseDepth) return;
  Chart._ecompulseDepth = true;
  Chart.register({
    id: 'depth3d',
    beforeDatasetDraw(chart) {
      chart.ctx.save();
      chart.ctx.shadowColor = 'rgba(0,0,0,.28)';
      chart.ctx.shadowBlur = 16;
      chart.ctx.shadowOffsetX = 7;
      chart.ctx.shadowOffsetY = 10;
    },
    afterDatasetDraw(chart) { chart.ctx.restore(); },
  });
}

function cText() { return getComputedStyle(document.documentElement).getPropertyValue('--muted').trim(); }
function cGrid() { return getComputedStyle(document.documentElement).getPropertyValue('--line').trim(); }

function baseOptions(yMoney) {
  const text = cText(), grid = cGrid();
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { callbacks: { label: ctx => yMoney ? money(ctx.parsed.y) : ctx.formattedValue } },
    },
    scales: {
      x: { grid: { display: false, color: grid }, ticks: { color: text } },
      y: { grid: { color: grid }, ticks: { color: text, callback: v => yMoney ? 'R$ ' + small(v) : v } },
    },
  };
}

export function drawCharts(products) {
  registerDepthPlugin();
  const text = cText(), grid = cGrid();

  // Receita por categoria (barras horizontais)
  destroyChart('cat');
  const cats = topCategories(products);
  state.charts.cat = new Chart(document.getElementById('catChart'), {
    type: 'bar',
    data: {
      labels: cats.map(x => x[0].length > 22 ? x[0].slice(0, 22) + '…' : x[0]),
      datasets: [{
        data: cats.map(x => x[1]),
        backgroundColor: ['#2563eb', '#0ea5e9', '#12b76a', '#f79009', '#64748b'],
        borderRadius: 7,
        barThickness: 24,
      }],
    },
    options: {
      indexAxis: 'y', responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: ctx => money(ctx.parsed.x) } },
      },
      scales: {
        x: { grid: { color: grid }, ticks: { color: text, callback: v => 'R$ ' + small(v) } },
        y: { grid: { display: false }, ticks: { color: text, font: { size: 11 } } },
      },
    },
  });

  // Top 10 por receita
  destroyChart('top');
  const top = [...products].sort((a, b) => revOf(b) - revOf(a)).slice(0, 10).reverse();
  document.getElementById('topPeriodLabel').textContent = state.currentPeriod + ' dias';
  state.charts.top = new Chart(document.getElementById('topChart'), {
    type: 'bar',
    data: {
      labels: top.map(p => p.name.length > 30 ? p.name.slice(0, 30) + '…' : p.name),
      datasets: [{ data: top.map(p => revOf(p)), backgroundColor: '#0ea5e9', borderRadius: 6 }],
    },
    options: Object.assign(baseOptions(true), { indexAxis: 'y' }),
  });

  // Prioridade de melhoria
  destroyChart('priority');
  const priority = [...products].map(p => {
    const r = rhythm(p.trend).cls;
    const score = (revOf(p) || 0) * (r === 'down' ? 1.35 : r === 'flat' ? 0.75 : 0.45)
      + (!hasClip(p) ? Math.max(revOf(p) * 0.25, 100) : 0)
      + (needsImages(p) ? Math.max(revOf(p) * 0.15, 60) : 0);
    return { p, score };
  }).sort((a, b) => b.score - a.score).slice(0, 10).reverse();

  state.charts.priority = new Chart(document.getElementById('priorityChart'), {
    type: 'bar',
    data: {
      labels: priority.map(x => x.p.name.length > 28 ? x.p.name.slice(0, 28) + '…' : x.p.name),
      datasets: [{
        data: priority.map(x => x.score),
        backgroundColor: priority.map(x =>
          rhythm(x.p.trend).cls === 'down' ? '#f04438' :
          rhythm(x.p.trend).cls === 'up'   ? '#12b76a' : '#60a5fa'
        ),
        borderRadius: 6,
      }],
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: ctx => recommendation(priority[ctx.dataIndex].p) + ' · prioridade ' + small(priority[ctx.dataIndex].score),
          },
        },
      },
      scales: {
        x: { grid: { color: grid }, ticks: { color: text } },
        y: { grid: { display: false }, ticks: { color: text, font: { size: 11 } } },
      },
    },
  });

  // Distribuição de ritmo (donut) — novo
  destroyChart('rhythmDonut');
  const rUp   = products.filter(p => rhythm(p.trend).cls === 'up').length;
  const rFlat = products.filter(p => rhythm(p.trend).cls === 'flat').length;
  const rDown = products.filter(p => rhythm(p.trend).cls === 'down').length;
  const donutEl = document.getElementById('rhythmDonutChart');
  if (donutEl) {
    state.charts.rhythmDonut = new Chart(donutEl, {
      type: 'doughnut',
      data: {
        labels: ['Crescente', 'Estável', 'Queda'],
        datasets: [{
          data: [rUp, rFlat, rDown],
          backgroundColor: ['#12b76a', '#60a5fa', '#f04438'],
          borderWidth: 0,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '65%',
        plugins: {
          legend: { position: 'bottom', labels: { color: text, font: { size: 11 }, padding: 12 } },
          tooltip: { callbacks: { label: ctx => ctx.label + ': ' + ctx.parsed + ' produtos' } },
        },
      },
    });
  }
}
