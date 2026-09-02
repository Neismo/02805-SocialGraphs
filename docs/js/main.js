/**
 * Social Graphs & Interactions - Interactive Visualizations & Controls
 */

document.addEventListener('DOMContentLoaded', () => {
  initThemeToggle();
  initMobileMenu();
  initScrollSpy();
  initNetworkSimulation();
});

/* --------------------------------------------------
   Theme Switcher (Dark / Light Mode)
   -------------------------------------------------- */
function initThemeToggle() {
  const themeToggleBtn = document.getElementById('theme-toggle');
  const themeIcon = themeToggleBtn.querySelector('.theme-icon');
  
  // Check persisted or OS preference
  const savedTheme = localStorage.getItem('sg-theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  
  if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
    document.body.classList.remove('theme-light');
    document.body.classList.add('theme-dark');
    themeIcon.textContent = '☀️';
  } else {
    document.body.classList.remove('theme-dark');
    document.body.classList.add('theme-light');
    themeIcon.textContent = '🌙';
  }

  themeToggleBtn.addEventListener('click', () => {
    if (document.body.classList.contains('theme-dark')) {
      document.body.classList.remove('theme-dark');
      document.body.classList.add('theme-light');
      themeIcon.textContent = '🌙';
      localStorage.setItem('sg-theme', 'light');
    } else {
      document.body.classList.remove('theme-light');
      document.body.classList.add('theme-dark');
      themeIcon.textContent = '☀️';
      localStorage.setItem('sg-theme', 'dark');
    }
  });
}

/* --------------------------------------------------
   Mobile Navigation Menu Toggle
   -------------------------------------------------- */
function initMobileMenu() {
  const menuBtn = document.getElementById('mobile-menu-btn');
  const navLinks = document.getElementById('nav-links');
  
  if (!menuBtn || !navLinks) return;

  menuBtn.addEventListener('click', () => {
    navLinks.classList.toggle('open');
  });

  navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      navLinks.classList.remove('open');
    });
  });
}

/* --------------------------------------------------
   Scroll Spy for Active Nav Item
   -------------------------------------------------- */
function initScrollSpy() {
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-link');

  window.addEventListener('scroll', () => {
    let currentId = '';
    const scrollPos = window.scrollY + 100;

    sections.forEach(sec => {
      const top = sec.offsetTop;
      const height = sec.offsetHeight;
      if (scrollPos >= top && scrollPos < top + height) {
        currentId = sec.getAttribute('id');
      }
    });

    navLinks.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href') === `#${currentId}`) {
        link.classList.add('active');
      }
    });
  });
}

/* --------------------------------------------------
   D3.js Force-Directed Interactive Network Simulation
   -------------------------------------------------- */
function initNetworkSimulation() {
  const container = document.getElementById('network-graph');
  if (!container || typeof d3 === 'undefined') return;

  // Generate a realistic synthetic modular network for demonstration
  const graphData = generateSampleNetwork();

  const width = container.clientWidth || 800;
  const height = container.clientHeight || 520;

  const colorScale = d3.scaleOrdinal()
    .domain([0, 1, 2, 3, 4])
    .range(['#4F46E5', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899']);

  const communityNames = {
    0: 'Core Systems',
    1: 'AI & Algorithms',
    2: 'Policy & Law',
    3: 'Industry & Tech',
    4: 'Social & Media'
  };

  // SVG Setup
  d3.select(container).selectAll('*').remove();

  const svg = d3.select(container)
    .append('svg')
    .attr('width', '100%')
    .attr('height', '100%')
    .attr('viewBox', [0, 0, width, height]);

  // Zoom wrapper
  const g = svg.append('g');

  const zoom = d3.zoom()
    .scaleExtent([0.3, 5])
    .on('zoom', (event) => {
      g.attr('transform', event.transform);
    });

  svg.call(zoom);

  // Force Simulation
  const simulation = d3.forceSimulation(graphData.nodes)
    .force('link', d3.forceLink(graphData.links).id(d => d.id).distance(45))
    .force('charge', d3.forceManyBody().strength(-80))
    .force('center', d3.forceCenter(width / 2, height / 2))
    .force('collision', d3.forceCollide().radius(d => d.radius + 4));

  // Render Links
  const link = g.append('g')
    .attr('class', 'links')
    .selectAll('line')
    .data(graphData.links)
    .join('line')
    .attr('stroke', 'rgba(150, 150, 150, 0.35)')
    .attr('stroke-width', d => Math.sqrt(d.value || 1) * 1.2);

  // Render Nodes
  const node = g.append('g')
    .attr('class', 'nodes')
    .selectAll('circle')
    .data(graphData.nodes)
    .join('circle')
    .attr('r', d => d.radius)
    .attr('fill', d => colorScale(d.community))
    .attr('stroke', '#ffffff')
    .attr('stroke-width', 1.5)
    .style('cursor', 'pointer')
    .call(d3.drag()
      .on('start', dragstarted)
      .on('drag', dragged)
      .on('end', dragended)
    );

  // Node Labels for prominent hubs
  const labels = g.append('g')
    .attr('class', 'labels')
    .selectAll('text')
    .data(graphData.nodes.filter(d => d.degree > 6))
    .join('text')
    .text(d => d.name)
    .attr('font-size', '10px')
    .attr('font-family', 'Inter, sans-serif')
    .attr('font-weight', '600')
    .attr('fill', 'var(--text-primary)')
    .attr('dx', 10)
    .attr('dy', 4)
    .attr('pointer-events', 'none');

  // Simulation Tick
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

  // Node click - Inspector details
  const inspector = document.getElementById('node-inspector');
  const inspectorName = document.getElementById('inspector-name');
  const inspectorCommunity = document.getElementById('inspector-community');
  const inspectorDegree = document.getElementById('inspector-degree');
  const inspectorBetweenness = document.getElementById('inspector-betweenness');
  const inspectorNeighbors = document.getElementById('inspector-neighbors');
  const inspectorClose = document.getElementById('inspector-close');

  node.on('click', (event, d) => {
    event.stopPropagation();
    
    // Highlight node & adjacent neighbors
    const neighborSet = new Set();
    neighborSet.add(d.id);
    graphData.links.forEach(l => {
      if (l.source.id === d.id) neighborSet.add(l.target.id);
      if (l.target.id === d.id) neighborSet.add(l.source.id);
    });

    node.attr('opacity', n => neighborSet.has(n.id) ? 1 : 0.2);
    link.attr('opacity', l => (l.source.id === d.id || l.target.id === d.id) ? 1 : 0.08);

    // Update inspector
    inspectorName.textContent = d.name;
    inspectorCommunity.textContent = `Community ${d.community} (${communityNames[d.community] || 'General'})`;
    inspectorDegree.textContent = `${d.degree} connections`;
    inspectorBetweenness.textContent = `${(d.betweenness || 0.024).toFixed(4)}`;
    inspectorNeighbors.textContent = `${neighborSet.size - 1} linked peers`;
    
    inspector.classList.remove('hidden');
  });

  svg.on('click', () => {
    node.attr('opacity', 1);
    link.attr('opacity', 0.5);
    inspector.classList.add('hidden');
  });

  if (inspectorClose) {
    inspectorClose.addEventListener('click', () => {
      node.attr('opacity', 1);
      link.attr('opacity', 0.5);
      inspector.classList.add('hidden');
    });
  }

  // Filter by Community
  const communityFilter = document.getElementById('community-filter');
  if (communityFilter) {
    communityFilter.addEventListener('change', (e) => {
      const selected = e.target.value;
      if (selected === 'all') {
        node.attr('display', 'block');
        link.attr('display', 'block');
        labels.attr('display', 'block');
      } else {
        const commId = parseInt(selected, 10);
        node.attr('display', d => d.community === commId ? 'block' : 'none');
        link.attr('display', l => (l.source.community === commId && l.target.community === commId) ? 'block' : 'none');
        labels.attr('display', d => d.community === commId ? 'block' : 'none');
      }
    });
  }

  // Search Node
  const searchInput = document.getElementById('search-node');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const query = e.target.value.trim().toLowerCase();
      if (!query) {
        node.attr('opacity', 1);
        return;
      }
      node.attr('opacity', d => d.name.toLowerCase().includes(query) ? 1 : 0.15);
    });
  }

  // Reset Zoom
  const resetBtn = document.getElementById('btn-reset-zoom');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      svg.transition().duration(500).call(
        zoom.transform,
        d3.zoomIdentity
      );
    });
  }

  // Pause / Resume Physics
  let isPhysicsRunning = true;
  const physicsBtn = document.getElementById('btn-toggle-physics');
  if (physicsBtn) {
    physicsBtn.addEventListener('click', () => {
      if (isPhysicsRunning) {
        simulation.stop();
        physicsBtn.textContent = 'Resume Simulation';
      } else {
        simulation.restart();
        physicsBtn.textContent = 'Pause Simulation';
      }
      isPhysicsRunning = !isPhysicsRunning;
    });
  }

  // Drag behaviors
  function dragstarted(event, d) {
    if (!event.active) simulation.alphaTarget(0.3).restart();
    d.fx = d.x;
    d.fy = d.y;
  }

  function dragged(event, d) {
    d.fx = event.x;
    d.fy = event.y;
  }

  function dragended(event, d) {
    if (!event.active) simulation.alphaTarget(0);
    d.fx = null;
    d.fy = null;
  }
}

/* --------------------------------------------------
   Generate Sample Graph Dataset with Louvain-like Clusters
   -------------------------------------------------- */
function generateSampleNetwork() {
  const nodes = [];
  const links = [];
  const numCommunities = 5;
  const nodesPerCommunity = 12;

  let idCounter = 0;

  // Create nodes with cluster centers
  for (let c = 0; c < numCommunities; c++) {
    for (let i = 0; i < nodesPerCommunity; i++) {
      const id = idCounter++;
      nodes.push({
        id: id,
        name: `Node ${id}`,
        community: c,
        degree: 0,
        betweenness: Math.random() * 0.05,
        radius: 5
      });
    }
  }

  // Intra-community edges (dense)
  for (let c = 0; c < numCommunities; c++) {
    const commNodes = nodes.filter(n => n.community === c);
    for (let i = 0; i < commNodes.length; i++) {
      for (let j = i + 1; j < commNodes.length; j++) {
        if (Math.random() < 0.28) {
          links.push({
            source: commNodes[i].id,
            target: commNodes[j].id,
            value: 1
          });
          commNodes[i].degree++;
          commNodes[j].degree++;
        }
      }
    }
  }

  // Inter-community edges (sparse bridge edges)
  for (let c1 = 0; c1 < numCommunities; c1++) {
    for (let c2 = c1 + 1; c2 < numCommunities; c2++) {
      const n1 = nodes.filter(n => n.community === c1);
      const n2 = nodes.filter(n => n.community === c2);
      
      const bridgeCount = Math.floor(Math.random() * 3) + 1;
      for (let b = 0; b < bridgeCount; b++) {
        const u = n1[Math.floor(Math.random() * n1.length)];
        const v = n2[Math.floor(Math.random() * n2.length)];
        links.push({
          source: u.id,
          target: v.id,
          value: 0.5
        });
        u.degree += 2;
        v.degree += 2;
        u.betweenness += 0.04;
        v.betweenness += 0.04;
      }
    }
  }

  // Adjust radius based on degree
  nodes.forEach(n => {
    n.radius = Math.max(5, Math.min(16, 5 + n.degree * 1.1));
  });

  return { nodes, links };
}
