// SkillGarden -- Dynamic Skill Tree Renderer
// Takes JSON from the Blaxel agent (clusters, nodes, connections)
// and renders an interactive PoE-style skill tree with auto-layout.

const DynamicTree = (function () {
  'use strict';

  // --- Tier color map (only shown after validation) ---
  const TIER_COLORS = {
    novice:      '#8D6E63',
    apprentice:  '#78909C',
    journeyman:  '#43A047',
    adept:       '#1E88E5',
    expert:      '#AB47BC',
    master:      '#FF8F00',
    grandmaster: '#D32F2F',
    locked:      '#4A5568',
  };

  const TIER_ORDER = ['novice', 'apprentice', 'journeyman', 'adept', 'expert', 'master', 'grandmaster'];

  // Neutral constellation color -- all nodes start as this
  const NEUTRAL_COLOR = '#7B93A8';
  const NEUTRAL_CONNECTION = '#5A7088';

  // Approximate level from tier name
  function levelFromTier(tier) {
    const map = { novice: 8, apprentice: 23, journeyman: 40, adept: 60, expert: 78, master: 89, grandmaster: 96 };
    return map[tier] || 0;
  }

  // Resolve node color: validated nodes get tier color, others get neutral
  function nodeColor(node) {
    if (validatedMap && validatedMap[node.id]) {
      return TIER_COLORS[validatedMap[node.id].tier] || NEUTRAL_COLOR;
    }
    return NEUTRAL_COLOR;
  }

  // --- State ---
  let canvas, ctx, W, H, dpr;
  let hoveredNode = null;
  let selectedNode = null;
  let animFrame = 0;
  let panX = 0, panY = 0, zoom = 1;
  let targetPanX = null, targetPanY = null, targetZoom = null;
  let isDragging = false, dragStartX = 0, dragStartY = 0, panStartX = 0, panStartY = 0;
  let dragDistance = 0;

  // Illumination state
  let illuminatedSet = null; // Set of illuminated node IDs, or null = show all
  let illuminationTime = 0;  // Frame when illumination started (for pulse animation)

  // Validation state -- nodes only get tier colors/levels after assessment
  // Map of nodeId -> { tier, level } or null (all neutral)
  let validatedMap = null;

  // Layout data
  let clusters = [];
  let nodes = [];
  let connections = [];
  let nodeMap = {};
  let clusterMap = {};

  // Design space
  const DESIGN_W = 1200;
  const DESIGN_H = 800;
  let scaleX, scaleY, offsetX, offsetY;

  function toCanvasX(nx) { return (offsetX + nx * scaleX) * zoom + panX; }
  function toCanvasY(ny) { return (offsetY + ny * scaleY) * zoom + panY; }

  // --- Auto-Layout Algorithm ---
  // Places clusters in a radial pattern, then nodes within each cluster
  function layoutTree(treeData) {
    clusters = treeData.clusters || [];
    const rawNodes = treeData.nodes || [];
    connections = treeData.connections || [];

    // Build cluster map
    clusterMap = {};
    clusters.forEach((c, i) => { clusterMap[c.id] = { ...c, index: i, nodes: [] }; });

    // Assign nodes to clusters
    rawNodes.forEach(n => {
      if (clusterMap[n.cluster]) {
        clusterMap[n.cluster].nodes.push(n);
      }
    });

    const clusterIds = Object.keys(clusterMap);
    const numClusters = clusterIds.length;

    // Position clusters in an elliptical ring
    const centerX = DESIGN_W / 2;
    const centerY = DESIGN_H / 2;
    const radiusX = DESIGN_W * 0.32;
    const radiusY = DESIGN_H * 0.28;

    clusterIds.forEach((cid, i) => {
      const angle = (i / numClusters) * Math.PI * 2 - Math.PI / 2;
      const c = clusterMap[cid];
      c.cx = centerX + Math.cos(angle) * radiusX;
      c.cy = centerY + Math.sin(angle) * radiusY;
      c.rx = 140 + c.nodes.length * 8;
      c.ry = 110 + c.nodes.length * 6;

      // Layout nodes within this cluster
      const clusterNodes = c.nodes;
      const largeNodes = clusterNodes.filter(n => n.size === 'large');
      const mediumNodes = clusterNodes.filter(n => n.size === 'medium');
      const smallNodes = clusterNodes.filter(n => n.size !== 'large' && n.size !== 'medium');

      // Place large nodes at cluster center
      largeNodes.forEach((n, j) => {
        const offset = largeNodes.length > 1 ? (j - (largeNodes.length - 1) / 2) * 40 : 0;
        n.x = c.cx + offset;
        n.y = c.cy;
      });

      // Place medium nodes in inner ring
      const innerRadius = 55;
      mediumNodes.forEach((n, j) => {
        const a = (j / Math.max(mediumNodes.length, 1)) * Math.PI * 2 - Math.PI / 2;
        n.x = c.cx + Math.cos(a) * innerRadius;
        n.y = c.cy + Math.sin(a) * innerRadius;
      });

      // Place small nodes in outer ring
      const outerRadius = 100;
      smallNodes.forEach((n, j) => {
        const a = (j / Math.max(smallNodes.length, 1)) * Math.PI * 2 + Math.PI / 6;
        n.x = c.cx + Math.cos(a) * outerRadius;
        n.y = c.cy + Math.sin(a) * outerRadius;
      });
    });

    // Build flat node list with layout positions and node map
    nodes = rawNodes.map(n => ({
      ...n,
      x: n.x || DESIGN_W / 2,
      y: n.y || DESIGN_H / 2,
      level: levelFromTier(n.tier),
      computedTier: n.tier || 'locked',
    }));

    nodeMap = {};
    nodes.forEach(n => { nodeMap[n.id] = n; });

    // Force-directed relaxation (simple spring model, few iterations)
    relaxLayout(60);
  }

  // Simple force-directed relaxation to reduce node overlap
  function relaxLayout(iterations) {
    const repulseStrength = 2000;
    const springStrength = 0.01;
    const damping = 0.85;

    // Initialize velocities
    nodes.forEach(n => { n.vx = 0; n.vy = 0; });

    for (let iter = 0; iter < iterations; iter++) {
      // Repulsion between all node pairs
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i];
          const b = nodes[j];
          let dx = a.x - b.x;
          let dy = a.y - b.y;
          let dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const minDist = 50;
          if (dist < minDist) dist = minDist;
          const force = repulseStrength / (dist * dist);
          const fx = (dx / dist) * force;
          const fy = (dy / dist) * force;
          a.vx += fx;
          a.vy += fy;
          b.vx -= fx;
          b.vy -= fy;
        }
      }

      // Spring attraction for connected nodes
      connections.forEach(([fromId, toId]) => {
        const a = nodeMap[fromId];
        const b = nodeMap[toId];
        if (!a || !b) return;
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const idealDist = 90;
        const force = (dist - idealDist) * springStrength;
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;
        a.vx += fx;
        a.vy += fy;
        b.vx -= fx;
        b.vy -= fy;
      });

      // Cluster gravity -- pull nodes toward their cluster center
      nodes.forEach(n => {
        const c = clusterMap[n.cluster];
        if (!c) return;
        const dx = c.cx - n.x;
        const dy = c.cy - n.y;
        n.vx += dx * 0.005;
        n.vy += dy * 0.005;
      });

      // Apply velocities with damping and boundary constraints
      nodes.forEach(n => {
        n.vx *= damping;
        n.vy *= damping;
        n.x += n.vx;
        n.y += n.vy;
        // Keep within bounds
        n.x = Math.max(60, Math.min(DESIGN_W - 60, n.x));
        n.y = Math.max(60, Math.min(DESIGN_H - 60, n.y));
      });
    }
  }

  // --- Node sizing ---
  function nodeRadius(node) {
    if (node.size === 'large') return 26;
    if (node.size === 'medium') return 18;
    return 12;
  }

  // --- Canvas setup ---
  function initCanvas(canvasId) {
    canvas = document.getElementById(canvasId);
    if (!canvas) return false;
    ctx = canvas.getContext('2d');
    dpr = window.devicePixelRatio || 1;
    resizeCanvas();
    return true;
  }

  function resizeCanvas() {
    const container = canvas.parentElement;
    const rect = container.getBoundingClientRect();
    const computedMin = parseFloat(getComputedStyle(canvas).minWidth) || 0;
    W = Math.max(rect.width - 48, computedMin, 600);
    H = Math.max(500, Math.min(700, W * 0.6));

    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const padX = 30;
    const padY = 20;
    scaleX = (W - padX * 2) / DESIGN_W;
    scaleY = (H - padY * 2) / DESIGN_H;
    const scale = Math.min(scaleX, scaleY);
    scaleX = scale;
    scaleY = scale;
    offsetX = (W - DESIGN_W * scale) / 2;
    offsetY = (H - DESIGN_H * scale) / 2;
  }

  // --- Drawing ---

  function drawBackground() {
    const bgGrad = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, W * 0.7);
    bgGrad.addColorStop(0, '#1a1c2e');
    bgGrad.addColorStop(1, '#0f1019');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    // Subtle grid
    ctx.strokeStyle = 'rgba(255,255,255,0.03)';
    ctx.lineWidth = 0.5;
    const gridSize = 40 * zoom;
    for (let gx = panX % gridSize; gx < W; gx += gridSize) {
      ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, H); ctx.stroke();
    }
    for (let gy = panY % gridSize; gy < H; gy += gridSize) {
      ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(W, gy); ctx.stroke();
    }
  }

  function drawClusters() {
    Object.values(clusterMap).forEach(c => {
      if (!c.cx) return;
      const cx = toCanvasX(c.cx);
      const cy = toCanvasY(c.cy);
      const rx = (c.rx || 130) * scaleX * zoom;
      const ry = (c.ry || 100) * scaleY * zoom;

      // Check if any node in this cluster is illuminated
      const clusterHasLit = !illuminatedSet || (c.nodes || []).some(n => illuminatedSet.has(n.id));
      const dimFactor = illuminatedSet && !clusterHasLit ? 0.12 : 1;

      if (illuminatedSet && !clusterHasLit) {
        ctx.globalAlpha = 0.12;
      }

      // Cluster glow
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(rx, ry));
      const tierColor = getClusterColor(c);
      const glowIntensity = clusterHasLit && illuminatedSet ? '25' : '15';
      grad.addColorStop(0, tierColor + glowIntensity);
      grad.addColorStop(0.7, tierColor + '08');
      grad.addColorStop(1, tierColor + '00');
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();

      // Dashed border
      ctx.strokeStyle = tierColor + (clusterHasLit && illuminatedSet ? '50' : '30');
      ctx.lineWidth = clusterHasLit && illuminatedSet ? 1.5 : 1;
      ctx.setLineDash([4, 4]);
      ctx.stroke();
      ctx.setLineDash([]);

      // Cluster label
      ctx.fillStyle = tierColor + (clusterHasLit && illuminatedSet ? 'CC' : '80');
      const fontSize = Math.max(9, 11 * scaleX * zoom);
      ctx.font = `600 ${fontSize}px "Plus Jakarta Sans", sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(c.label, cx, cy - ry + 6 * scaleY * zoom);

      ctx.globalAlpha = 1;
    });
  }

  function getClusterColor(cluster) {
    // If no nodes validated, use neutral
    if (!validatedMap) return NEUTRAL_COLOR;

    // Check if any node in this cluster is validated
    const clusterNodes = cluster.nodes || [];
    const validatedInCluster = clusterNodes.filter(n => validatedMap[n.id]);
    if (validatedInCluster.length === 0) return NEUTRAL_COLOR;

    // Determine dominant validated tier in cluster
    const tiers = validatedInCluster.map(n => validatedMap[n.id].tier);
    const tierCounts = {};
    tiers.forEach(t => { tierCounts[t] = (tierCounts[t] || 0) + 1; });
    const dominant = Object.entries(tierCounts).sort((a, b) => b[1] - a[1])[0][0];
    return TIER_COLORS[dominant] || NEUTRAL_COLOR;
  }

  function drawConnections() {
    connections.forEach(([fromId, toId]) => {
      const from = nodeMap[fromId];
      const to = nodeMap[toId];
      if (!from || !to) return;

      // Determine if this connection is illuminated
      const fromLit = !illuminatedSet || illuminatedSet.has(fromId);
      const toLit = !illuminatedSet || illuminatedSet.has(toId);
      const bothLit = fromLit && toLit;
      const eitherLit = fromLit || toLit;

      // Skip fully dimmed connections for cleaner look
      if (illuminatedSet && !eitherLit) {
        // Draw very faintly
        ctx.globalAlpha = 0.06;
      } else if (illuminatedSet && !bothLit) {
        ctx.globalAlpha = 0.15;
      }

      const x1 = toCanvasX(from.x);
      const y1 = toCanvasY(from.y);
      const x2 = toCanvasX(to.x);
      const y2 = toCanvasY(to.y);

      const fromColor = nodeColor(from);
      const toColor = nodeColor(to);

      // Gradient connection
      const gradient = ctx.createLinearGradient(x1, y1, x2, y2);
      const alpha = bothLit && illuminatedSet ? '80' : '50';
      gradient.addColorStop(0, fromColor + alpha);
      gradient.addColorStop(1, toColor + alpha);
      ctx.strokeStyle = gradient;
      ctx.lineWidth = (bothLit && illuminatedSet ? 2.5 : 1.5) * zoom;

      // Subtle bezier curve
      const midX = (x1 + x2) / 2;
      const midY = (y1 + y2) / 2;
      const dx = x2 - x1;
      const dy = y2 - y1;
      const len = Math.sqrt(dx * dx + dy * dy) || 1;
      const curveAmount = len * 0.06;
      const cpX = midX + (-dy / len) * curveAmount;
      const cpY = midY + (dx / len) * curveAmount;

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.quadraticCurveTo(cpX, cpY, x2, y2);
      ctx.stroke();

      ctx.globalAlpha = 1;
    });
  }

  function drawNodes() {
    // Draw dimmed nodes first, then illuminated on top (painter's algorithm)
    const sortedNodes = illuminatedSet
      ? [...nodes].sort((a, b) => {
          const aLit = illuminatedSet.has(a.id) ? 1 : 0;
          const bLit = illuminatedSet.has(b.id) ? 1 : 0;
          return aLit - bLit; // dimmed first, illuminated last (on top)
        })
      : nodes;

    sortedNodes.forEach(node => {
      const cx = toCanvasX(node.x);
      const cy = toCanvasY(node.y);
      const r = nodeRadius(node) * Math.min(scaleX, scaleY) * 1.2 * zoom;
      const color = nodeColor(node);
      const isHovered = hoveredNode === node;
      const isLarge = node.size === 'large';
      const isValidated = validatedMap && validatedMap[node.id];

      // Illumination state for this node
      const isIlluminated = !illuminatedSet || illuminatedSet.has(node.id);
      const isDimmed = illuminatedSet && !illuminatedSet.has(node.id);
      const pulsePhase = illuminatedSet ? (animFrame - illuminationTime) * 0.03 : 0;

      // Save context for dimming
      if (isDimmed) {
        ctx.globalAlpha = 0.15;
      }

      // Outer glow for hovered/large/illuminated nodes
      if (isHovered || isLarge || (isIlluminated && illuminatedSet)) {
        const pulseAdd = (isIlluminated && illuminatedSet) ? Math.sin(pulsePhase + node.x * 0.01) * 4 : 0;
        const glowR = r + (6 + Math.sin(animFrame * 0.04) * 2 + pulseAdd) * zoom;
        const glow = ctx.createRadialGradient(cx, cy, r * 0.5, cx, cy, glowR);
        const glowAlpha = (isIlluminated && illuminatedSet) ? '90' : '60';
        glow.addColorStop(0, color + glowAlpha);
        glow.addColorStop(1, color + '00');
        ctx.beginPath();
        ctx.arc(cx, cy, glowR, 0, Math.PI * 2);
        ctx.fillStyle = glow;
        ctx.fill();
      }

      // Node circle
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);

      // Filled gradient (grayscale for dimmed)
      if (isDimmed) {
        const gray = '#555566';
        const grad = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.3, 0, cx, cy, r);
        grad.addColorStop(0, '#777788');
        grad.addColorStop(1, gray);
        ctx.fillStyle = grad;
      } else {
        const grad = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.3, 0, cx, cy, r);
        grad.addColorStop(0, lightenColor(color, 40));
        grad.addColorStop(1, color);
        ctx.fillStyle = grad;
      }
      ctx.fill();

      // Border
      ctx.strokeStyle = isHovered ? '#FFFFFF' : isDimmed ? '#44445560' : lightenColor(color, 20);
      ctx.lineWidth = isHovered ? 2.5 * zoom : 1.5 * zoom;
      ctx.stroke();

      // Inner content
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      if (isValidated && node.size !== 'small') {
        // Show level number only for validated nodes
        ctx.fillStyle = isDimmed ? 'rgba(255,255,255,0.4)' : '#FFFFFF';
        const innerFont = Math.max(8, r * 0.6);
        ctx.font = `700 ${innerFont}px "JetBrains Mono", monospace`;
        ctx.fillText(validatedMap[node.id].level || '', cx, cy);
      } else {
        // Neutral inner dot for unvalidated nodes
        ctx.beginPath();
        ctx.arc(cx, cy, r * 0.3, 0, Math.PI * 2);
        ctx.fillStyle = isDimmed ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.85)';
        ctx.fill();
      }

      // Label below node
      const labelY = cy + r + 6 * zoom;
      const labelText = (node.label || '').replace(/\n/g, ' ');
      const fontSize = Math.max(7, (node.size === 'large' ? 10 : node.size === 'medium' ? 9 : 8) * Math.min(scaleX, 1) * zoom);
      ctx.font = `600 ${fontSize}px "Inter", sans-serif`;
      ctx.textBaseline = 'top';

      // Text shadow
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillText(labelText, cx + 0.5, labelY + 0.5);
      // Text
      ctx.fillStyle = isDimmed ? 'rgba(255,255,255,0.3)' : '#FFFFFF';
      ctx.fillText(labelText, cx, labelY);

      // Level badge for validated small nodes only
      if (isValidated && node.size === 'small') {
        const badgeX = cx + r + 2 * zoom;
        const badgeY = cy - r - 2 * zoom;
        ctx.font = `700 ${Math.max(6, 7 * scaleX * zoom)}px "JetBrains Mono", monospace`;
        ctx.textBaseline = 'bottom';
        ctx.fillStyle = isDimmed ? '#44445560' : color;
        ctx.fillText(validatedMap[node.id].level, badgeX, badgeY);
      }

      // Restore alpha
      if (isDimmed) {
        ctx.globalAlpha = 1;
      }
    });
  }

  function drawHoverTooltip() {
    if (!hoveredNode) return;
    const node = hoveredNode;
    const cx = toCanvasX(node.x);
    const cy = toCanvasY(node.y);
    const r = nodeRadius(node) * Math.min(scaleX, scaleY) * 1.2 * zoom;

    const color = nodeColor(node);
    const isValidated = validatedMap && validatedMap[node.id];

    const title = (node.label || '').replace(/\n/g, ' ');
    const line1 = isValidated
      ? `Level ${validatedMap[node.id].level} -- ${validatedMap[node.id].tier.charAt(0).toUpperCase() + validatedMap[node.id].tier.slice(1)}`
      : (clusterMap[node.cluster] || {}).label || node.cluster;
    const line2 = node.description || `Cluster: ${node.cluster}`;
    const line3 = isValidated && node.bloom_level ? `Bloom's Level ${node.bloom_level}` : '';

    // Measure
    ctx.font = '600 12px "Plus Jakarta Sans", sans-serif';
    const titleW = ctx.measureText(title).width;
    ctx.font = '500 10px "Inter", sans-serif';
    const line1W = ctx.measureText(line1).width;
    const line2W = ctx.measureText(line2.substring(0, 50)).width;
    const boxW = Math.max(titleW, line1W, line2W) + 28;
    const boxH = line3 ? 78 : 64;

    let tipX = cx - boxW / 2;
    let tipY = cy - r - boxH - 14;
    if (tipX < 8) tipX = 8;
    if (tipX + boxW > W - 8) tipX = W - boxW - 8;
    if (tipY < 8) tipY = cy + r + 14;

    // Shadow
    ctx.shadowColor = 'rgba(0,0,0,0.3)';
    ctx.shadowBlur = 16;
    ctx.shadowOffsetY = 4;

    ctx.beginPath();
    roundRect(ctx, tipX, tipY, boxW, boxH, 8);
    ctx.fillStyle = '#1a1c2e';
    ctx.fill();
    ctx.strokeStyle = color + '40';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;

    // Accent bar
    ctx.beginPath();
    roundRectTop(ctx, tipX, tipY, boxW, 3, 8);
    ctx.fillStyle = color;
    ctx.fill();

    // Text
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';

    ctx.fillStyle = '#FFFFFF';
    ctx.font = '600 12px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(title, tipX + 14, tipY + 10);

    ctx.fillStyle = color;
    ctx.font = '600 10px "JetBrains Mono", monospace';
    ctx.fillText(line1, tipX + 14, tipY + 28);

    ctx.fillStyle = '#8898AA';
    ctx.font = '400 9px "Inter", sans-serif';
    ctx.fillText(line2.substring(0, 50), tipX + 14, tipY + 44);

    if (line3) {
      ctx.fillStyle = '#6B7280';
      ctx.fillText(line3, tipX + 14, tipY + 58);
    }
  }

  // --- Helpers ---
  function roundRect(ctx, x, y, w, h, r) {
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.arcTo(x + w, y, x + w, y + r, r);
    ctx.lineTo(x + w, y + h - r);
    ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    ctx.lineTo(x + r, y + h);
    ctx.arcTo(x, y + h, x, y + h - r, r);
    ctx.lineTo(x, y + r);
    ctx.arcTo(x, y, x + r, y, r);
    ctx.closePath();
  }

  function roundRectTop(ctx, x, y, w, h, r) {
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.arcTo(x + w, y, x + w, y + r, Math.min(r, h));
    ctx.lineTo(x + w, y + h);
    ctx.lineTo(x, y + h);
    ctx.lineTo(x, y + r);
    ctx.arcTo(x, y, x + r, y, Math.min(r, h));
    ctx.closePath();
  }

  function lightenColor(hex, amount) {
    const num = parseInt(hex.replace('#', ''), 16);
    const r = Math.min(255, (num >> 16) + amount);
    const g = Math.min(255, ((num >> 8) & 0xff) + amount);
    const b = Math.min(255, (num & 0xff) + amount);
    return `rgb(${r},${g},${b})`;
  }

  // --- Hit Testing ---
  function hitTestNode(mx, my) {
    for (let i = nodes.length - 1; i >= 0; i--) {
      const node = nodes[i];
      const cx = toCanvasX(node.x);
      const cy = toCanvasY(node.y);
      const r = nodeRadius(node) * Math.min(scaleX, scaleY) * 1.2 * zoom + 8;
      const dx = mx - cx;
      const dy = my - cy;
      if (dx * dx + dy * dy <= r * r) return node;
    }
    return null;
  }

  // --- Smooth zoom animation ---
  function animateToTarget() {
    if (targetZoom !== null) {
      const easing = 0.08;
      zoom += (targetZoom - zoom) * easing;
      panX += (targetPanX - panX) * easing;
      panY += (targetPanY - panY) * easing;

      if (Math.abs(zoom - targetZoom) < 0.005) {
        zoom = targetZoom;
        panX = targetPanX;
        panY = targetPanY;
        targetZoom = null;
        targetPanX = null;
        targetPanY = null;
      }
    }
  }

  // --- Zoom to a specific node ---
  function zoomToNode(node) {
    selectedNode = node;
    const nodeCanvasX = offsetX + node.x * scaleX;
    const nodeCanvasY = offsetY + node.y * scaleY;

    targetZoom = 2.2;
    targetPanX = W / 2 - nodeCanvasX * targetZoom;
    targetPanY = H / 2 - nodeCanvasY * targetZoom;
  }

  // --- Node Detail Panel ---
  function showNodeDetail(node) {
    // Remove existing overlay
    const existing = document.querySelector('.node-detail-overlay');
    if (existing) existing.remove();

    const color = nodeColor(node);
    const isValidated = validatedMap && validatedMap[node.id];
    const name = (node.label || '').replace(/\n/g, ' ');

    // Find connected nodes
    const prereqs = [];
    const unlocks = [];
    connections.forEach(([fromId, toId]) => {
      if (toId === node.id && nodeMap[fromId]) prereqs.push(nodeMap[fromId]);
      if (fromId === node.id && nodeMap[toId]) unlocks.push(nodeMap[toId]);
    });

    const bloomLabels = ['', 'Remember', 'Understand', 'Apply', 'Analyze', 'Evaluate', 'Create'];
    const bloomText = bloomLabels[node.bloom_level] || '';

    // Build tier/level line based on validation state
    const tierLine = isValidated
      ? `${validatedMap[node.id].tier.charAt(0).toUpperCase() + validatedMap[node.id].tier.slice(1)} -- Level ${validatedMap[node.id].level}`
      : (clusterMap[node.cluster] || {}).label || node.cluster;
    const levelDisplay = isValidated ? validatedMap[node.id].level : '';

    const overlay = document.createElement('div');
    overlay.className = 'node-detail-overlay';
    overlay.innerHTML = `
      <div class="node-detail-card">
        <div class="node-detail-top" style="background: linear-gradient(135deg, ${color}, ${color}dd);">
          <button class="node-detail-close" aria-label="Close">&times;</button>
          <div class="node-detail-tier">${tierLine}</div>
          <div class="node-detail-name">${name}</div>
          ${levelDisplay ? `<div class="node-detail-level">${levelDisplay}</div>` : ''}
        </div>
        <div class="node-detail-body">
          <div class="node-detail-desc">${node.description || 'Master this concept to unlock deeper understanding in connected domains.'}</div>
          <div class="node-detail-meta">
            <div class="node-detail-meta-item">
              <div class="node-detail-meta-label">Cluster</div>
              <div class="node-detail-meta-value">${(clusterMap[node.cluster] || {}).label || node.cluster}</div>
            </div>
            ${bloomText ? `
            <div class="node-detail-meta-item">
              <div class="node-detail-meta-label">Bloom's Level</div>
              <div class="node-detail-meta-value">L${node.bloom_level}: ${bloomText}</div>
            </div>` : ''}
            <div class="node-detail-meta-item">
              <div class="node-detail-meta-label">Connections</div>
              <div class="node-detail-meta-value">${prereqs.length} prereqs, ${unlocks.length} unlocks</div>
            </div>
            ${isValidated ? `
            <div class="node-detail-meta-item">
              <div class="node-detail-meta-label">XP Range</div>
              <div class="node-detail-meta-value">${node.level_range ? node.level_range.join(' - ') : 'Varies'}</div>
            </div>` : ''}
          </div>
          ${prereqs.length > 0 ? `
            <div class="node-detail-connections">
              <h4>Prerequisites</h4>
              <div class="connection-list">
                ${prereqs.map(p => `<span class="connection-tag" style="background: ${nodeColor(p)};">${(p.label || '').replace(/\n/g, ' ')}</span>`).join('')}
              </div>
            </div>
          ` : ''}
          ${unlocks.length > 0 ? `
            <div class="node-detail-connections" style="margin-top: var(--space-md);">
              <h4>Unlocks</h4>
              <div class="connection-list">
                ${unlocks.map(u => `<span class="connection-tag" style="background: ${nodeColor(u)};">${(u.label || '').replace(/\n/g, ' ')}</span>`).join('')}
              </div>
            </div>
          ` : ''}
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    // Close handlers
    const closeBtn = overlay.querySelector('.node-detail-close');
    closeBtn.addEventListener('click', () => {
      overlay.remove();
      selectedNode = null;
      // Zoom back out
      targetZoom = 1;
      targetPanX = 0;
      targetPanY = 0;
    });
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        overlay.remove();
        selectedNode = null;
        targetZoom = 1;
        targetPanX = 0;
        targetPanY = 0;
      }
    });
  }

  // --- Render Loop ---
  let rafId = null;

  function render() {
    animFrame++;
    animateToTarget();
    ctx.clearRect(0, 0, W, H);
    drawBackground();
    drawClusters();
    drawConnections();
    drawNodes();
    drawHoverTooltip();
    rafId = requestAnimationFrame(render);
  }

  // --- Interaction ---
  function setupInteraction() {
    // Mouse hover
    canvas.addEventListener('mousemove', (e) => {
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;

      if (isDragging) {
        panX = panStartX + (e.clientX - dragStartX);
        panY = panStartY + (e.clientY - dragStartY);
        dragDistance += Math.abs(e.movementX) + Math.abs(e.movementY);
        return;
      }

      const hit = hitTestNode(mx, my);
      if (hit !== hoveredNode) {
        hoveredNode = hit;
        canvas.style.cursor = hit ? 'pointer' : 'grab';
      }
    });

    canvas.addEventListener('mouseleave', () => {
      hoveredNode = null;
      canvas.style.cursor = 'default';
    });

    // Pan + Click detection
    canvas.addEventListener('mousedown', (e) => {
      isDragging = true;
      dragDistance = 0;
      dragStartX = e.clientX;
      dragStartY = e.clientY;
      panStartX = panX;
      panStartY = panY;
      canvas.style.cursor = 'grabbing';
    });

    window.addEventListener('mouseup', (e) => {
      const wasDragging = isDragging;
      isDragging = false;
      canvas.style.cursor = hoveredNode ? 'pointer' : 'grab';

      // Click (not drag) -- zoom to node and show detail
      if (wasDragging && dragDistance < 5 && hoveredNode) {
        zoomToNode(hoveredNode);
        showNodeDetail(hoveredNode);
      }
    });

    // Zoom (scroll wheel)
    canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;

      const oldZoom = zoom;
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      zoom = Math.max(0.4, Math.min(3, zoom * delta));

      // Zoom toward cursor position
      panX = mx - (mx - panX) * (zoom / oldZoom);
      panY = my - (my - panY) * (zoom / oldZoom);
    }, { passive: false });

    // Touch support
    canvas.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        const touch = e.touches[0];
        const rect = canvas.getBoundingClientRect();
        const mx = touch.clientX - rect.left;
        const my = touch.clientY - rect.top;
        hoveredNode = hitTestNode(mx, my);

        isDragging = true;
        dragStartX = touch.clientX;
        dragStartY = touch.clientY;
        panStartX = panX;
        panStartY = panY;
      }
    }, { passive: true });

    canvas.addEventListener('touchmove', (e) => {
      if (e.touches.length === 1 && isDragging) {
        const touch = e.touches[0];
        panX = panStartX + (touch.clientX - dragStartX);
        panY = panStartY + (touch.clientY - dragStartY);
      }
    }, { passive: true });

    canvas.addEventListener('touchend', () => {
      isDragging = false;
      setTimeout(() => { hoveredNode = null; }, 2000);
    });

    // Resize
    window.addEventListener('resize', resizeCanvas);
  }

  // --- Legend ---
  function drawLegend(legendId) {
    const legendEl = document.getElementById(legendId);
    if (!legendEl) return;

    if (validatedMap) {
      // After validation: show tier legend
      const validatedTiers = new Set(Object.values(validatedMap).map(v => v.tier));
      const tierLabels = {
        novice: 'Novice (1-15)',
        apprentice: 'Apprentice (16-30)',
        journeyman: 'Journeyman (31-50)',
        adept: 'Adept (51-70)',
        expert: 'Expert (71-85)',
        master: 'Master (86-92)',
        grandmaster: 'Grandmaster (93-99)',
      };

      legendEl.innerHTML = TIER_ORDER
        .filter(t => validatedTiers.has(t))
        .map(t =>
          `<div class="tree-legend-item">
            <span class="tree-legend-dot" style="background: ${TIER_COLORS[t]};"></span>
            <span>${tierLabels[t]}</span>
          </div>`
        ).join('');
    } else {
      // Before validation: show cluster legend
      legendEl.innerHTML = clusters.map(c =>
        `<div class="tree-legend-item">
          <span class="tree-legend-dot" style="background: ${NEUTRAL_COLOR};"></span>
          <span>${c.label}</span>
        </div>`
      ).join('');
    }
  }

  // --- Public API ---
  function init(canvasId, legendId, treeData) {
    // Reset state
    panX = 0; panY = 0; zoom = 1;
    hoveredNode = null;
    animFrame = 0;
    validatedMap = null;
    illuminatedSet = null;
    illuminationTime = 0;

    if (rafId) cancelAnimationFrame(rafId);

    if (!initCanvas(canvasId)) return;

    layoutTree(treeData);
    setupInteraction();
    drawLegend(legendId);

    // Start entrance animation -- zoom from 0.5 to 1
    zoom = 0.5;
    panX = W * 0.25;
    panY = H * 0.25;
    const startTime = performance.now();
    const entranceDuration = 800;

    function entranceAnim(now) {
      const t = Math.min(1, (now - startTime) / entranceDuration);
      const eased = 1 - Math.pow(1 - t, 3); // ease-out cubic
      zoom = 0.5 + 0.5 * eased;
      panX = W * 0.25 * (1 - eased);
      panY = H * 0.25 * (1 - eased);

      if (t < 1) requestAnimationFrame(entranceAnim);
    }
    requestAnimationFrame(entranceAnim);

    render();
  }

  // --- Illuminate specific nodes ---
  function illuminate(nodeIds) {
    if (!nodeIds || nodeIds.length === 0) {
      illuminatedSet = null;
      return;
    }

    illuminatedSet = new Set(nodeIds);
    illuminationTime = animFrame;

    // Calculate bounding box of illuminated nodes and zoom to fit
    const litNodes = nodes.filter(n => illuminatedSet.has(n.id));
    if (litNodes.length === 0) return;

    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    litNodes.forEach(n => {
      minX = Math.min(minX, n.x);
      maxX = Math.max(maxX, n.x);
      minY = Math.min(minY, n.y);
      maxY = Math.max(maxY, n.y);
    });

    // Add padding
    const pad = 120;
    minX -= pad;
    maxX += pad;
    minY -= pad;
    maxY += pad;

    // Calculate zoom to fit illuminated area
    const spanX = (maxX - minX) * scaleX;
    const spanY = (maxY - minY) * scaleY;
    const fitZoom = Math.min(W / spanX, H / spanY, 2);
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    targetZoom = Math.max(0.6, Math.min(fitZoom, 1.8));
    targetPanX = W / 2 - (offsetX + centerX * scaleX) * targetZoom;
    targetPanY = H / 2 - (offsetY + centerY * scaleY) * targetZoom;
  }

  // --- Reset illumination ---
  function resetIllumination() {
    illuminatedSet = null;
    illuminationTime = 0;
    targetZoom = 1;
    targetPanX = 0;
    targetPanY = 0;
  }

  // --- Validate nodes (apply tier colors + levels after assessment) ---
  // validationData: { nodeId: { tier: 'novice', level: 8 }, ... }
  function validate(validationData) {
    validatedMap = validationData;
    // Redraw legend with tier info
    const legendEl = document.getElementById('masterTreeLegend');
    if (legendEl) drawLegend('masterTreeLegend');
  }

  // --- Reset validation (back to neutral constellation) ---
  function resetValidation() {
    validatedMap = null;
    const legendEl = document.getElementById('masterTreeLegend');
    if (legendEl) drawLegend('masterTreeLegend');
  }

  // --- Get current state ---
  function getNodes() {
    return nodes;
  }

  function getIlluminatedSet() {
    return illuminatedSet;
  }

  return { init, illuminate, resetIllumination, validate, resetValidation, getNodes, getIlluminatedSet };
})();
