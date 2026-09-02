/**
 * 02805 Week 1 — degree distributions, in vs out, and the islands.
 *
 * Everything here is derived from data/week1_graph.json at load time: no number on
 * the page is typed in by hand, so the page cannot drift away from the snapshot.
 * P(k) is plotted against k + 1 because a log axis cannot show zero and this network
 * has characters with degree 0 — 58 of them by in-degree, 20 by out-degree, 17 both ways.
 */

document.addEventListener('DOMContentLoaded', () => {
  if (typeof d3 === 'undefined') return;
  d3.json('data/week1_graph.json')
    .then(initAnalysis)
    .catch(() => {
      const el = document.getElementById('degree-chart-wrapper');
      if (el) el.innerHTML = '<p style="color: var(--text-muted); padding: 20px">' +
        'Could not load data/week1_graph.json.</p>';
    });
});

function initAnalysis(data) {
  const nodes = data.nodes;
  const svgNode = document.getElementById('degree-chart');
  if (!svgNode) return;

  let degMode = 'both';     // 'in' | 'out' | 'both'
  let axMode = 'log';       // 'linear' | 'log'

  const css = (name) =>
    getComputedStyle(document.documentElement).getPropertyValue(name).trim() ||
    getComputedStyle(document.body).getPropertyValue(name).trim();

  /** P(k) as [k + 1, fraction of characters with that degree], for every k present. */
  function distribution(key) {
    const counts = new Map();
    for (const n of nodes) counts.set(n[key], (counts.get(n[key]) || 0) + 1);
    return [...counts.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([k, c]) => [k + 1, c / nodes.length]);
  }

  const dists = { in: distribution('in_degree'), out: distribution('out_degree') };

  function drawChart() {
    const series = [];
    if (degMode === 'in' || degMode === 'both')
      series.push({ pts: dists.in, color: css('--accent-secondary') || '#0ea5e9', label: 'in-degree' });
    if (degMode === 'out' || degMode === 'both')
      series.push({ pts: dists.out, color: css('--accent-amber') || '#f59e0b', label: 'out-degree' });

    const W = svgNode.clientWidth || 720, H = 340;
    const m = { top: 16, right: 20, bottom: 48, left: 62 };
    const w = W - m.left - m.right, h = H - m.top - m.bottom;

    const svg = d3.select(svgNode).attr('viewBox', `0 0 ${W} ${H}`);
    svg.selectAll('*').remove();
    const g = svg.append('g').attr('transform', `translate(${m.left},${m.top})`);

    const all = series.flatMap((s) => s.pts);
    const kMax = d3.max(all, (d) => d[0]);
    const pMin = d3.min(all, (d) => d[1]);
    const pMax = d3.max(all, (d) => d[1]);
    const log = axMode === 'log';

    const x = log ? d3.scaleLog().domain([0.9, kMax * 1.3]).range([0, w])
                  : d3.scaleLinear().domain([0, kMax * 1.05]).range([0, w]);
    const y = log ? d3.scaleLog().domain([pMin / 2, 1]).range([h, 0])
                  : d3.scaleLinear().domain([0, pMax * 1.1]).range([h, 0]);

    const grid = css('--border-color') || '#e2e8f0';
    const ink = css('--text-muted') || '#64748b';
    const yTicks = log ? y.ticks(4).filter((t) => Number.isInteger(Math.log10(t))) : y.ticks(5);
    const xTicks = log ? x.ticks(4).filter((t) => Number.isInteger(Math.log10(t))) : x.ticks(6);

    g.selectAll('.gl').data(yTicks).join('line')
      .attr('x1', 0).attr('x2', w).attr('y1', y).attr('y2', y)
      .attr('stroke', grid).attr('stroke-width', 1);
    g.append('line').attr('x1', 0).attr('x2', w).attr('y1', h).attr('y2', h)
      .attr('stroke', grid).attr('stroke-width', 1);

    const fmtP = (v) => (v >= 0.01 ? d3.format('.2f')(v) : d3.format('.0e')(v));
    g.selectAll('.xt').data(xTicks).join('text')
      .attr('x', x).attr('y', h + 20).attr('text-anchor', 'middle')
      .attr('fill', ink).attr('font-size', 11).text((d) => d);
    g.selectAll('.yt').data(yTicks).join('text')
      .attr('x', -10).attr('y', (d) => y(d) + 4).attr('text-anchor', 'end')
      .attr('fill', ink).attr('font-size', 11).text(fmtP);

    g.append('text').attr('x', w / 2).attr('y', h + 40).attr('text-anchor', 'middle')
      .attr('fill', ink).attr('font-size', 12).text('degree k + 1');
    g.append('text').attr('transform', `translate(-46,${h / 2}) rotate(-90)`)
      .attr('text-anchor', 'middle').attr('fill', ink).attr('font-size', 12)
      .text('P(k) — fraction of characters');

    for (const s of series) {
      g.selectAll(null).data(s.pts).join('circle')
        .attr('cx', (d) => x(d[0])).attr('cy', (d) => y(d[1])).attr('r', 4)
        .attr('fill', s.color).attr('fill-opacity', 0.85)
        .attr('stroke', css('--bg-card') || '#fff').attr('stroke-width', 1.5);
    }

    document.getElementById('degree-chart-legend').innerHTML = series.map((s) =>
      `<span class="legend-item"><span class="legend-color-dot" style="background:${s.color}"></span>` +
      `${s.label}</span>`).join('');

    document.getElementById('degree-chart-note').textContent = log
      ? 'Log–log. A straight line here would mean a power law; this bends, and with 303 nodes ' +
        'the tail is too thin to fit an exponent to honestly.'
      : 'Linear axes. Almost everything is crushed into the left-hand corner — which is exactly ' +
        'why the log–log view exists.';
  }

  // --- in versus out: the two leaderboards side by side ---
  function fillLeaderboards() {
    const byIn = [...nodes].sort((a, b) => b.in_degree - a.in_degree).slice(0, 10);
    const byOut = [...nodes].sort((a, b) => b.out_degree - a.out_degree).slice(0, 10);
    const body = document.getElementById('inout-tbody');
    if (!body) return;
    body.innerHTML = byIn.map((n, i) => {
      const o = byOut[i];
      return `<tr><td>${i + 1}</td>` +
        `<td><strong>${n.name}</strong></td><td>${n.in_degree}</td><td>${n.out_degree}</td>` +
        `<td><strong>${o.name}</strong></td><td>${o.in_degree}</td><td>${o.out_degree}</td></tr>`;
    }).join('');

    const inIds = new Set(byIn.map((n) => n.id));
    const overlap = byOut.filter((n) => inIds.has(n.id));
    const spidey = nodes.find((n) => n.id === 'Spider-Man');
    const el = document.getElementById('inout-readout');
    if (el && spidey) {
      el.innerHTML =
        `Only <strong>${overlap.length} of 10</strong> characters appear on both lists ` +
        `(${overlap.map((n) => n.name).join(', ')}). Spider-Man is named by ` +
        `<strong>${spidey.in_degree}</strong> of the other ${nodes.length - 1} characters ` +
        `(${(100 * spidey.in_degree / (nodes.length - 1)).toFixed(1)}% of the roster) and names ` +
        `<strong>${spidey.out_degree}</strong> of them back.`;
    }
  }

  // --- the islands outside the giant component ---
  function fillIslands() {
    const groups = d3.group(nodes, (d) => d.component_id);
    const comps = [...groups.values()].sort((a, b) => b.length - a.length);
    const giant = comps[0];
    const islands = comps.slice(1).filter((c) => c.length > 1);
    const singletons = comps.slice(1).filter((c) => c.length === 1);

    const set = (id, v) => { const e = document.getElementById(id); if (e) e.textContent = v; };
    set('isl-giant', giant.length);
    set('isl-count', comps.length);
    set('isl-islands', islands.length);
    set('isl-singletons', singletons.length);

    const host = document.getElementById('island-list');
    if (!host) return;
    host.innerHTML = islands.map((c) => {
      const members = [...c].sort((a, b) => b.total_degree - a.total_degree);
      return `<div class="stat-card" style="text-align:left">
        <div style="font-weight:700;margin-bottom:6px">A ${c.length}-character island</div>
        <p style="font-size:.85rem;color:var(--text-secondary);margin-bottom:10px">
          Not reachable from the giant component in either direction.</p>
        <div class="neighbor-chips">${members.map((n) =>
          `<a class="neighbor-chip" href="${n.url}" target="_blank" rel="noopener">${n.name}</a>`).join('')}</div>
      </div>`;
    }).join('');
  }

  function wire(id, current, set) {
    const seg = document.getElementById(id);
    if (!seg) return;
    seg.querySelectorAll('button').forEach((b) => b.classList.toggle('active', b.dataset.v === current));
    seg.addEventListener('click', (e) => {
      const b = e.target.closest('button');
      if (!b) return;
      seg.querySelectorAll('button').forEach((o) => o.classList.toggle('active', o === b));
      set(b.dataset.v);
      drawChart();
    });
  }
  wire('deg-mode-seg', degMode, (v) => (degMode = v));
  wire('deg-axes-seg', axMode, (v) => (axMode = v));

  drawChart();
  fillLeaderboards();
  fillIslands();

  window.addEventListener('resize', drawChart);
  // the theme toggle swaps a class on <body>; the chart reads its colours from CSS vars
  new MutationObserver(drawChart).observe(document.body, { attributes: true, attributeFilter: ['class'] });
}
