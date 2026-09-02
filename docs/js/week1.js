/**
 * 02805 Social Graphs - Week 1 Interactive Marvel Network Visualization
 */

document.addEventListener('DOMContentLoaded', () => {
  initWeek1Network();
});

function initWeek1Network() {
  const container = document.getElementById('graph-container');
  if (!container || typeof d3 === 'undefined') return;

  const tooltip = document.getElementById('graph-tooltip');
  const inspector = document.getElementById('node-inspector');
  const searchInput = document.getElementById('search-superhero');
  const searchDropdown = document.getElementById('search-dropdown');
  const communityFilter = document.getElementById('filter-community');
  const colorModeSelect = document.getElementById('select-color-mode');
  const sizeModeSelect = document.getElementById('select-size-mode');
  const toggleIsolatesBtn = document.getElementById('btn-toggle-isolates');
  const togglePhysicsBtn = document.getElementById('btn-toggle-physics');
  const toggleLabelsBtn = document.getElementById('btn-toggle-labels');
  const resetZoomBtn = document.getElementById('btn-reset-zoom');
  const zoomInBtn = document.getElementById('btn-zoom-in');
  const zoomOutBtn = document.getElementById('btn-zoom-out');
  const inspectorCloseBtn = document.getElementById('inspector-close');

  let rawData = null;
  let currentNodes = [];
  let currentLinks = [];
  let simulation = null;
  let selectedNode = null;
  let hideIsolates = false;
  let labelMode = 'hubs'; // 'all', 'hubs', 'none'
  let isPhysicsRunning = true;
  let minDegreeFilter = 0;

  // Colors
  const communityColors = {
    0: "#3B82F6", // Street Level
    1: "#EC4899", // X-Men
    2: "#8B5CF6", // Cosmic Marvel
    3: "#EF4444", // Spider-Verse
    4: "#10B981", // Gamma / Avengers
    5: "#F59E0B", // Midnight Sons
    6: "#06B6D4", // Classic Avengers
    7: "#6366F1", // Strikeforce Morituri
    8: "#94A3B8"  // Isolates / Other
  };

  // Dimensions
  let width = container.clientWidth || 900;
  let height = container.clientHeight || 640;

  // SVG Setup
  const svg = d3.select('#graph-svg')
    .attr('viewBox', [0, 0, width, height]);

  // Arrow markers definition
  const defs = svg.append('defs');

  // Default link arrow
  defs.append('marker')
    .attr('id', 'arrow-default')
    .attr('viewBox', '0 -5 10 10')
    .attr('refX', 18)
    .attr('refY', 0)
    .attr('markerWidth', 5)
    .attr('markerHeight', 5)
    .attr('orient', 'auto')
    .append('path')
    .attr('d', 'M0,-4L8,0L0,4')
    .attr('fill', 'rgba(148, 163, 184, 0.45)');

  // Outgoing link arrow (amber/orange)
  defs.append('marker')
    .attr('id', 'arrow-outgoing')
    .attr('viewBox', '0 -5 10 10')
    .attr('refX', 20)
    .attr('refY', 0)
    .attr('markerWidth', 6)
    .attr('markerHeight', 6)
    .attr('orient', 'auto')
    .append('path')
    .attr('d', 'M0,-4L8,0L0,4')
    .attr('fill', '#f59e0b');

  // Incoming link arrow (cyan/blue)
  defs.append('marker')
    .attr('id', 'arrow-incoming')
    .attr('viewBox', '0 -5 10 10')
    .attr('refX', 20)
    .attr('refY', 0)
    .attr('markerWidth', 6)
    .attr('markerHeight', 6)
    .attr('orient', 'auto')
    .append('path')
    .attr('d', 'M0,-4L8,0L0,4')
    .attr('fill', '#06b6d4');

  // Main Zoomable Group
  const g = svg.append('g').attr('class', 'graph-main-group');

  const zoom = d3.zoom()
    .scaleExtent([0.15, 6])
    .on('zoom', (event) => {
      g.attr('transform', event.transform);
    });

  svg.call(zoom);

  // Group layers
  const linkGroup = g.append('g').attr('class', 'links-layer');
  const nodeGroup = g.append('g').attr('class', 'nodes-layer');
  const labelGroup = g.append('g').attr('class', 'labels-layer');

  // Load Data
  fetch('data/week1_graph.json')
    .then(res => {
      if (!res.ok) throw new Error('Could not fetch week1_graph.json');
      return res.json();
    })
    .then(data => {
      rawData = data;
      initControls(data);
      updateGraphData();
      renderSuperheroesTable(data.nodes);
    })
    .catch(err => {
      console.warn('Falling back to local data loading...', err);
    });

  /* --------------------------------------------------
     Initialize Controls & Event Listeners
     -------------------------------------------------- */
  function initControls(data) {
    // Populate Community Filter Options
    if (communityFilter && data.communities) {
      communityFilter.innerHTML = '<option value="all">All Communities (303 nodes)</option>';
      data.communities.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c.id;
        opt.textContent = `${c.name} (${c.count})`;
        communityFilter.appendChild(opt);
      });
      communityFilter.addEventListener('change', updateGraphData);
    }

    if (colorModeSelect) {
      colorModeSelect.addEventListener('change', updateNodeStyles);
    }

    if (sizeModeSelect) {
      sizeModeSelect.addEventListener('change', updateNodeStyles);
    }

    if (toggleIsolatesBtn) {
      toggleIsolatesBtn.addEventListener('click', () => {
        hideIsolates = !hideIsolates;
        toggleIsolatesBtn.classList.toggle('active', hideIsolates);
        toggleIsolatesBtn.textContent = hideIsolates ? 'Show 17 Isolates' : 'Hide 17 Isolates';
        updateGraphData();
      });
    }

    if (togglePhysicsBtn) {
      togglePhysicsBtn.addEventListener('click', () => {
        if (isPhysicsRunning) {
          simulation.stop();
          togglePhysicsBtn.textContent = '▶ Resume Physics';
          togglePhysicsBtn.classList.remove('active');
        } else {
          simulation.alpha(0.3).restart();
          togglePhysicsBtn.textContent = '⏸ Pause Physics';
          togglePhysicsBtn.classList.add('active');
        }
        isPhysicsRunning = !isPhysicsRunning;
      });
    }

    if (toggleLabelsBtn) {
      toggleLabelsBtn.addEventListener('click', () => {
        if (labelMode === 'hubs') {
          labelMode = 'all';
          toggleLabelsBtn.textContent = '🏷️ Labels: All';
        } else if (labelMode === 'all') {
          labelMode = 'none';
          toggleLabelsBtn.textContent = '🏷️ Labels: Off';
        } else {
          labelMode = 'hubs';
          toggleLabelsBtn.textContent = '🏷️ Labels: Hubs';
        }
        updateLabelsVisibility();
      });
    }

    if (resetZoomBtn) {
      resetZoomBtn.addEventListener('click', resetZoom);
    }

    if (zoomInBtn) {
      zoomInBtn.addEventListener('click', () => {
        svg.transition().duration(300).call(zoom.scaleBy, 1.3);
      });
    }

    if (zoomOutBtn) {
      zoomOutBtn.addEventListener('click', () => {
        svg.transition().duration(300).call(zoom.scaleBy, 1 / 1.3);
      });
    }

    if (inspectorCloseBtn) {
      inspectorCloseBtn.addEventListener('click', closeInspector);
    }

    // Search Box Autocomplete
    if (searchInput && searchDropdown) {
      searchInput.addEventListener('input', (e) => {
        const query = e.target.value.trim().toLowerCase();
        if (!query) {
          searchDropdown.classList.remove('open');
          searchDropdown.innerHTML = '';
          return;
        }

        const matches = rawData.nodes
          .filter(n => n.name.toLowerCase().includes(query) || n.id.toLowerCase().includes(query))
          .slice(0, 10);

        if (matches.length === 0) {
          searchDropdown.innerHTML = '<div class="search-dropdown-item" style="color:var(--text-muted);">No matching superhero</div>';
          searchDropdown.classList.add('open');
          return;
        }

        searchDropdown.innerHTML = '';
        matches.forEach(m => {
          const item = document.createElement('div');
          item.className = 'search-dropdown-item';
          item.innerHTML = `
            <span><strong>${m.name}</strong></span>
            <span class="badge-pill" style="font-size:0.75rem;">${m.in_degree} in-links</span>
          `;
          item.addEventListener('click', () => {
            searchInput.value = m.name;
            searchDropdown.classList.remove('open');
            selectAndFocusNode(m.id);
          });
          searchDropdown.appendChild(item);
        });
        searchDropdown.classList.add('open');
      });

      document.addEventListener('click', (e) => {
        if (!searchInput.contains(e.target) && !searchDropdown.contains(e.target)) {
          searchDropdown.classList.remove('open');
        }
      });
    }

    // Window Resize
    window.addEventListener('resize', () => {
      width = container.clientWidth || 900;
      height = container.clientHeight || 640;
      svg.attr('viewBox', [0, 0, width, height]);
      if (simulation) {
        simulation.force('center', d3.forceCenter(width / 2, height / 2));
        simulation.alpha(0.1).restart();
      }
    });

    // Background Click clears selection
    svg.on('click', (e) => {
      if (e.target.tagName === 'svg' || e.target.classList.contains('graph-main-group')) {
        clearSelection();
      }
    });
  }

  /* --------------------------------------------------
     Update Filtered Data and Simulation
     -------------------------------------------------- */
  function updateGraphData() {
    if (!rawData) return;

    const selectedComm = communityFilter ? communityFilter.value : 'all';

    // Filter nodes
    let filteredNodes = rawData.nodes.filter(n => {
      if (hideIsolates && n.is_isolate) return false;
      if (selectedComm !== 'all' && n.community_id !== parseInt(selectedComm, 10)) return false;
      return true;
    });

    const nodeIds = new Set(filteredNodes.map(n => n.id));

    // Filter links
    let filteredLinks = rawData.links.filter(l => {
      const src = typeof l.source === 'object' ? l.source.id : l.source;
      const tgt = typeof l.target === 'object' ? l.target.id : l.target;
      return nodeIds.has(src) && nodeIds.has(tgt);
    }).map(l => ({
      source: typeof l.source === 'object' ? l.source.id : l.source,
      target: typeof l.target === 'object' ? l.target.id : l.target
    }));

    currentNodes = filteredNodes.map(n => ({ ...n }));
    currentLinks = filteredLinks;

    renderGraph();
  }

  /* --------------------------------------------------
     Render D3 Force Graph
     -------------------------------------------------- */
  function renderGraph() {
    // Stop previous simulation
    if (simulation) simulation.stop();

    // Render Links
    const link = linkGroup.selectAll('line')
      .data(currentLinks, d => `${d.source}-${d.target}`)
      .join(
        enter => enter.append('line')
          .attr('stroke', 'rgba(148, 163, 184, 0.35)')
          .attr('stroke-width', 1.2)
          .attr('marker-end', 'url(#arrow-default)'),
        update => update,
        exit => exit.remove()
      );

    // Render Nodes
    const node = nodeGroup.selectAll('circle')
      .data(currentNodes, d => d.id)
      .join(
        enter => enter.append('circle')
          .attr('stroke', '#ffffff')
          .attr('stroke-width', 1.5)
          .style('cursor', 'pointer')
          .call(d3.drag()
            .on('start', dragstarted)
            .on('drag', dragged)
            .on('end', dragended)
          )
          .on('mouseover', handleNodeMouseOver)
          .on('mousemove', handleNodeMouseMove)
          .on('mouseout', handleNodeMouseOut)
          .on('click', handleNodeClick),
        update => update,
        exit => exit.remove()
      );

    // Render Labels
    const labels = labelGroup.selectAll('text')
      .data(currentNodes, d => d.id)
      .join(
        enter => enter.append('text')
          .attr('font-size', '10px')
          .attr('font-family', 'var(--font-sans)')
          .attr('font-weight', '600')
          .attr('fill', 'var(--text-primary)')
          .attr('stroke', 'var(--bg-surface)')
          .attr('stroke-width', 3)
          .attr('paint-order', 'stroke fill')
          .attr('dx', 10)
          .attr('dy', 4)
          .attr('pointer-events', 'none')
          .text(d => d.name),
        update => update.text(d => d.name),
        exit => exit.remove()
      );

    updateNodeStyles();
    updateLabelsVisibility();

    // Create Force Simulation
    simulation = d3.forceSimulation(currentNodes)
      .force('link', d3.forceLink(currentLinks).id(d => d.id).distance(45).strength(0.4))
      .force('charge', d3.forceManyBody().strength(d => d.is_isolate ? -25 : -90).distanceMax(350))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(d => getNodeRadius(d) + 3))
      .force('x', d3.forceX(width / 2).strength(0.04))
      .force('y', d3.forceY(height / 2).strength(0.04));

    simulation.on('tick', () => {
      link
        .attr('x1', d => d.source.x)
        .attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x)
        .attr('y2', d => d.target.y);

      node
        .attr('cx', d => d.x)
        .attr('cy', d => d.y);

      labels
        .attr('x', d => d.x)
        .attr('y', d => d.y);
    });

    if (!isPhysicsRunning) {
      simulation.stop();
    }
  }

  /* --------------------------------------------------
     Node Styling & Metrics
     -------------------------------------------------- */
  function getNodeRadius(d) {
    const mode = sizeModeSelect ? sizeModeSelect.value : 'in_degree';
    switch (mode) {
      case 'in_degree':
        return Math.max(4.5, Math.min(24, 4 + Math.sqrt(d.in_degree) * 2.1));
      case 'out_degree':
        return Math.max(4.5, Math.min(24, 4 + Math.sqrt(d.out_degree) * 2.8));
      case 'total_degree':
        return Math.max(4.5, Math.min(26, 4 + Math.sqrt(d.total_degree) * 1.8));
      case 'pagerank':
        return Math.max(4.5, Math.min(26, 4 + (d.pagerank * 320)));
      case 'uniform':
      default:
        return 7;
    }
  }

  function getNodeColor(d) {
    const mode = colorModeSelect ? colorModeSelect.value : 'community';
    if (mode === 'community') {
      return d.community_color || communityColors[d.community_id] || "#94A3B8";
    } else if (mode === 'in_degree') {
      const scale = d3.scaleSequential(d3.interpolateBlues).domain([0, 60]);
      return scale(d.in_degree);
    } else if (mode === 'out_degree') {
      const scale = d3.scaleSequential(d3.interpolateWarm).domain([0, 25]);
      return scale(d.out_degree);
    } else if (mode === 'pagerank') {
      const scale = d3.scaleSequential(d3.interpolateViridis).domain([0, 0.03]);
      return scale(d.pagerank);
    }
    return "#6366F1";
  }

  function updateNodeStyles() {
    nodeGroup.selectAll('circle')
      .transition().duration(300)
      .attr('r', d => getNodeRadius(d))
      .attr('fill', d => getNodeColor(d));

    if (simulation) {
      simulation.force('collision', d3.forceCollide().radius(d => getNodeRadius(d) + 3));
      simulation.alpha(0.15).restart();
    }
  }

  function updateLabelsVisibility() {
    labelGroup.selectAll('text')
      .style('display', d => {
        if (labelMode === 'all') return 'block';
        if (labelMode === 'none') return 'none';
        // 'hubs' mode: show if in_degree >= 18 or out_degree >= 18
        return (d.in_degree >= 18 || d.out_degree >= 18) ? 'block' : 'none';
      });
  }

  /* --------------------------------------------------
     Interactions: Hover & Tooltip
     -------------------------------------------------- */
  function handleNodeMouseOver(event, d) {
    if (tooltip) {
      tooltip.innerHTML = `
        <strong>${d.name}</strong><br>
        <span style="color:#94a3b8; font-size:0.75rem;">${d.community_name}</span><br>
        <span style="color:#38bdf8;">In-degree: <strong>${d.in_degree}</strong></span> • 
        <span style="color:#f59e0b;">Out-degree: <strong>${d.out_degree}</strong></span>
      `;
      tooltip.style.opacity = '1';
    }
  }

  function handleNodeMouseMove(event) {
    if (tooltip) {
      const rect = container.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      tooltip.style.left = `${x}px`;
      tooltip.style.top = `${y}px`;
    }
  }

  function handleNodeMouseOut() {
    if (tooltip) {
      tooltip.style.opacity = '0';
    }
  }

  /* --------------------------------------------------
     Interactions: Click & Node Inspector
     -------------------------------------------------- */
  function handleNodeClick(event, d) {
    event.stopPropagation();
    selectAndFocusNode(d.id);
  }

  function selectAndFocusNode(nodeId) {
    const targetNode = currentNodes.find(n => n.id === nodeId);
    if (!targetNode) return;

    selectedNode = targetNode;

    const inSet = new Set(targetNode.in_neighbors || []);
    const outSet = new Set(targetNode.out_neighbors || []);
    const neighborSet = new Set([...inSet, ...outSet, targetNode.id]);

    // Highlight nodes
    nodeGroup.selectAll('circle')
      .attr('opacity', n => neighborSet.has(n.id) ? 1 : 0.12)
      .attr('stroke', n => n.id === targetNode.id ? '#f59e0b' : '#ffffff')
      .attr('stroke-width', n => n.id === targetNode.id ? 3.5 : 1.5);

    // Highlight links & apply directional arrows
    linkGroup.selectAll('line')
      .attr('opacity', l => {
        const srcId = typeof l.source === 'object' ? l.source.id : l.source;
        const tgtId = typeof l.target === 'object' ? l.target.id : l.target;
        return (srcId === targetNode.id || tgtId === targetNode.id) ? 1 : 0.04;
      })
      .attr('stroke', l => {
        const srcId = typeof l.source === 'object' ? l.source.id : l.source;
        const tgtId = typeof l.target === 'object' ? l.target.id : l.target;
        if (srcId === targetNode.id) return '#f59e0b'; // Outgoing link
        if (tgtId === targetNode.id) return '#06b6d4'; // Incoming link
        return 'rgba(148, 163, 184, 0.35)';
      })
      .attr('stroke-width', l => {
        const srcId = typeof l.source === 'object' ? l.source.id : l.source;
        const tgtId = typeof l.target === 'object' ? l.target.id : l.target;
        return (srcId === targetNode.id || tgtId === targetNode.id) ? 2.5 : 1.2;
      })
      .attr('marker-end', l => {
        const srcId = typeof l.source === 'object' ? l.source.id : l.source;
        const tgtId = typeof l.target === 'object' ? l.target.id : l.target;
        if (srcId === targetNode.id) return 'url(#arrow-outgoing)';
        if (tgtId === targetNode.id) return 'url(#arrow-incoming)';
        return 'url(#arrow-default)';
      });

    // Populate Inspector
    populateInspector(targetNode);
    if (inspector) inspector.classList.add('open');

    // Pan gently towards the node if coordinates exist
    if (targetNode.x !== undefined && targetNode.y !== undefined) {
      const currentTransform = d3.zoomTransform(svg.node());
      const targetScale = Math.max(currentTransform.k, 1.2);
      const targetX = width / 2 - targetNode.x * targetScale;
      const targetY = height / 2 - targetNode.y * targetScale;

      svg.transition().duration(600).call(
        zoom.transform,
        d3.zoomIdentity.translate(targetX, targetY).scale(targetScale)
      );
    }
  }

  function clearSelection() {
    selectedNode = null;
    nodeGroup.selectAll('circle')
      .attr('opacity', 1)
      .attr('stroke', '#ffffff')
      .attr('stroke-width', 1.5);

    linkGroup.selectAll('line')
      .attr('opacity', 0.5)
      .attr('stroke', 'rgba(148, 163, 184, 0.35)')
      .attr('stroke-width', 1.2)
      .attr('marker-end', 'url(#arrow-default)');

    if (inspector) inspector.classList.remove('open');
  }

  function closeInspector() {
    clearSelection();
  }

  function populateInspector(d) {
    document.getElementById('insp-name').textContent = d.name;
    document.getElementById('insp-id').textContent = d.id;
    document.getElementById('insp-desc').textContent = d.description || 'No description blurb available in snapshot.';
    
    const wikiLink = document.getElementById('insp-wiki-link');
    if (wikiLink) {
      wikiLink.href = d.url || `https://en.wikipedia.org/wiki/${encodeURIComponent(d.id)}`;
    }

    const commBadge = document.getElementById('insp-community-badge');
    if (commBadge) {
      commBadge.textContent = d.community_name;
      commBadge.style.backgroundColor = `${d.community_color || '#3B82F6'}22`;
      commBadge.style.color = d.community_color || '#3B82F6';
      commBadge.style.borderColor = d.community_color || '#3B82F6';
    }

    document.getElementById('insp-in-degree').textContent = d.in_degree;
    document.getElementById('insp-out-degree').textContent = d.out_degree;
    document.getElementById('insp-total-degree').textContent = d.total_degree;
    document.getElementById('insp-pagerank').textContent = (d.pagerank || 0).toFixed(4);

    // Incoming Links Chips
    const inContainer = document.getElementById('insp-in-neighbors');
    if (inContainer) {
      inContainer.innerHTML = '';
      if (!d.in_neighbors || d.in_neighbors.length === 0) {
        inContainer.innerHTML = '<span style="font-size:0.8rem; color:var(--text-muted);">None</span>';
      } else {
        d.in_neighbors.forEach(nid => {
          const chip = document.createElement('button');
          chip.className = 'neighbor-chip';
          const match = rawData.nodes.find(n => n.id === nid);
          chip.textContent = match ? match.name : nid;
          chip.addEventListener('click', () => selectAndFocusNode(nid));
          inContainer.appendChild(chip);
        });
      }
    }

    // Outgoing Links Chips
    const outContainer = document.getElementById('insp-out-neighbors');
    if (outContainer) {
      outContainer.innerHTML = '';
      if (!d.out_neighbors || d.out_neighbors.length === 0) {
        outContainer.innerHTML = '<span style="font-size:0.8rem; color:var(--text-muted);">None</span>';
      } else {
        d.out_neighbors.forEach(nid => {
          const chip = document.createElement('button');
          chip.className = 'neighbor-chip';
          const match = rawData.nodes.find(n => n.id === nid);
          chip.textContent = match ? match.name : nid;
          chip.addEventListener('click', () => selectAndFocusNode(nid));
          outContainer.appendChild(chip);
        });
      }
    }
  }

  /* --------------------------------------------------
     Top Superheroes Table
     -------------------------------------------------- */
  function renderSuperheroesTable(nodes) {
    const tableBody = document.getElementById('top-superheroes-tbody');
    if (!tableBody) return;

    const topNodes = [...nodes].sort((a, b) => b.in_degree - a.in_degree).slice(0, 10);
    tableBody.innerHTML = '';

    topNodes.forEach((node, idx) => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td><strong>#${idx + 1}</strong></td>
        <td>
          <a href="javascript:void(0)" class="table-char-link" style="font-weight:600;">${node.name}</a>
        </td>
        <td>
          <span class="badge-pill" style="background:${node.community_color}22; color:${node.community_color};">
            ${node.community_name}
          </span>
        </td>
        <td><strong>${node.in_degree}</strong></td>
        <td>${node.out_degree}</td>
        <td>${(node.pagerank || 0).toFixed(4)}</td>
        <td>
          <a href="${node.url}" target="_blank" class="btn btn-outline btn-sm" style="padding:2px 8px; font-size:0.75rem;">Wikipedia ↗</a>
        </td>
      `;
      row.querySelector('.table-char-link').addEventListener('click', () => {
        window.scrollTo({ top: document.getElementById('network-visualization').offsetTop - 80, behavior: 'smooth' });
        selectAndFocusNode(node.id);
      });
      tableBody.appendChild(row);
    });
  }

  /* --------------------------------------------------
     Reset Zoom
     -------------------------------------------------- */
  function resetZoom() {
    svg.transition().duration(600).call(
      zoom.transform,
      d3.zoomIdentity
    );
  }

  /* --------------------------------------------------
     Drag Handlers
     -------------------------------------------------- */
  function dragstarted(event, d) {
    if (!event.active && simulation && isPhysicsRunning) simulation.alphaTarget(0.3).restart();
    d.fx = d.x;
    d.fy = d.y;
  }

  function dragged(event, d) {
    d.fx = event.x;
    d.fy = event.y;
  }

  function dragended(event, d) {
    if (!event.active && simulation && isPhysicsRunning) simulation.alphaTarget(0);
    d.fx = null;
    d.fy = null;
  }
}
