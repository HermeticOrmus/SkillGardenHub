// SkillGarden -- PoE-Style Interconnected Skill Tree
// Canvas-based interactive visualization with clusters, connections, and node states
// Inspired by Path of Exile's passive skill tree

(function () {
  'use strict';

  // --- Tier color map (matches CSS variables) ---
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

  function tierForLevel(lv) {
    if (lv >= 93) return 'grandmaster';
    if (lv >= 86) return 'master';
    if (lv >= 71) return 'expert';
    if (lv >= 51) return 'adept';
    if (lv >= 31) return 'journeyman';
    if (lv >= 16) return 'apprentice';
    if (lv >= 1)  return 'novice';
    return 'locked';
  }

  // Map API difficulty (1-5) to a representative level for tier color selection
  function tierForDifficulty(difficulty) {
    const diffToTier = {
      1: 'novice',
      2: 'apprentice',
      3: 'journeyman',
      4: 'adept',
      5: 'expert',
    };
    return diffToTier[difficulty] || 'novice';
  }

  // --- Default hardcoded data (preserved as demo) ---
  const DEFAULT_CLUSTERS = [
    {
      id: 'ai',
      label: 'AI / Machine Learning',
      cx: 200, cy: 200,
      rx: 180, ry: 160,
      color: 'rgba(30, 136, 229, 0.06)',
      borderColor: 'rgba(30, 136, 229, 0.15)',
    },
    {
      id: 'finance',
      label: 'Finance / Markets',
      cx: 800, cy: 200,
      rx: 180, ry: 160,
      color: 'rgba(255, 143, 0, 0.06)',
      borderColor: 'rgba(255, 143, 0, 0.15)',
    },
    {
      id: 'intersection',
      label: 'AI in Finance',
      cx: 500, cy: 280,
      rx: 200, ry: 140,
      color: 'rgba(171, 71, 188, 0.06)',
      borderColor: 'rgba(171, 71, 188, 0.18)',
    },
    {
      id: 'ethics',
      label: 'Ethics & Governance',
      cx: 200, cy: 520,
      rx: 170, ry: 120,
      color: 'rgba(67, 160, 71, 0.06)',
      borderColor: 'rgba(67, 160, 71, 0.15)',
    },
    {
      id: 'product',
      label: 'Product Strategy',
      cx: 800, cy: 520,
      rx: 170, ry: 120,
      color: 'rgba(141, 110, 99, 0.06)',
      borderColor: 'rgba(141, 110, 99, 0.15)',
    },
  ];

  const DEFAULT_NODES = [
    // === Central Hub ===
    { id: 'ai-boom',          label: 'AI Boom\nin Finance',       level: 76, x: 500, y: 340, cluster: 'intersection', size: 'large', primary: true },

    // === AI / ML Cluster ===
    { id: 'ml-foundations',    label: 'ML\nFoundations',           level: 58, x: 200, y: 220, cluster: 'ai', size: 'medium' },
    { id: 'supervised',        label: 'Supervised\nLearning',      level: 65, x: 110, y: 130, cluster: 'ai', size: 'small' },
    { id: 'neural-nets',       label: 'Neural\nNetworks',          level: 52, x: 290, y: 130, cluster: 'ai', size: 'small' },
    { id: 'feature-eng',       label: 'Feature\nEngineering',      level: 48, x: 200, y: 80,  cluster: 'ai', size: 'small' },
    { id: 'nlp-llms',          label: 'NLP &\nLLMs',               level: 44, x: 100, y: 260, cluster: 'ai', size: 'small' },
    { id: 'deep-learning',     label: 'Deep\nLearning',            level: 0,  x: 310, y: 280, cluster: 'ai', size: 'small' },
    { id: 'reinforcement',     label: 'Reinforcement\nLearning',   level: 0,  x: 100, y: 340, cluster: 'ai', size: 'small' },

    // === Finance Cluster ===
    { id: 'fin-markets',       label: 'Financial\nMarkets',        level: 70, x: 800, y: 220, cluster: 'finance', size: 'medium' },
    { id: 'valuation',         label: 'Valuation\nModels',         level: 73, x: 890, y: 130, cluster: 'finance', size: 'small' },
    { id: 'risk-analysis',     label: 'Risk\nAnalysis',            level: 68, x: 710, y: 130, cluster: 'finance', size: 'small' },
    { id: 'regulatory',        label: 'Regulatory\nFrameworks',    level: 45, x: 800, y: 80,  cluster: 'finance', size: 'small' },
    { id: 'portfolio',         label: 'Portfolio\nTheory',         level: 55, x: 900, y: 260, cluster: 'finance', size: 'small' },
    { id: 'derivatives',       label: 'Derivatives',               level: 0,  x: 700, y: 280, cluster: 'finance', size: 'small' },

    // === AI in Finance Intersection ===
    { id: 'ai-market-dyn',     label: 'AI Market\nDynamics',       level: 82, x: 500, y: 200, cluster: 'intersection', size: 'medium' },
    { id: 'bubble-value',      label: 'Bubble vs\nValue',          level: 70, x: 380, y: 280, cluster: 'intersection', size: 'small' },
    { id: 'ai-invest-thesis',  label: 'AI Investment\nThesis',     level: 72, x: 620, y: 280, cluster: 'intersection', size: 'small' },
    { id: 'ai-trading',        label: 'AI Trading\nSystems',       level: 55, x: 400, y: 440, cluster: 'intersection', size: 'small' },
    { id: 'ai-due-diligence',  label: 'AI Due\nDiligence',         level: 60, x: 600, y: 440, cluster: 'intersection', size: 'small' },

    // === Ethics & Governance ===
    { id: 'ai-ethics',         label: 'AI Ethics &\nGovernance',   level: 41, x: 200, y: 480, cluster: 'ethics', size: 'medium' },
    { id: 'bias-fairness',     label: 'Bias &\nFairness',          level: 47, x: 100, y: 540, cluster: 'ethics', size: 'small' },
    { id: 'gov-frameworks',    label: 'Governance\nFrameworks',    level: 38, x: 200, y: 590, cluster: 'ethics', size: 'small' },
    { id: 'responsible-ai',    label: 'Responsible\nAI',           level: 30, x: 310, y: 560, cluster: 'ethics', size: 'small' },

    // === Product Strategy ===
    { id: 'product-strategy',  label: 'AI Product\nStrategy',      level: 33, x: 800, y: 480, cluster: 'product', size: 'medium' },
    { id: 'market-sizing',     label: 'Market\nSizing',            level: 40, x: 700, y: 540, cluster: 'product', size: 'small' },
    { id: 'gtm',               label: 'Go-to-\nMarket',            level: 28, x: 800, y: 590, cluster: 'product', size: 'small' },
    { id: 'competitive',       label: 'Competitive\nAnalysis',     level: 25, x: 900, y: 540, cluster: 'product', size: 'small' },

    // === Grandmaster Gate ===
    { id: 'original-thesis',   label: 'Original\nThesis',          level: 0,  x: 500, y: 560, cluster: 'intersection', size: 'medium', grandmaster: true },
  ];

  const DEFAULT_CONNECTIONS = [
    // Central hub connections
    ['ai-boom', 'ai-market-dyn'],
    ['ai-boom', 'bubble-value'],
    ['ai-boom', 'ai-invest-thesis'],
    ['ai-boom', 'ai-trading'],
    ['ai-boom', 'ai-due-diligence'],
    ['ai-boom', 'ai-ethics'],
    ['ai-boom', 'product-strategy'],

    // AI cluster internal
    ['ml-foundations', 'supervised'],
    ['ml-foundations', 'neural-nets'],
    ['ml-foundations', 'feature-eng'],
    ['ml-foundations', 'nlp-llms'],
    ['neural-nets', 'deep-learning'],
    ['nlp-llms', 'reinforcement'],

    // AI cluster -> intersection
    ['ml-foundations', 'ai-market-dyn'],
    ['ml-foundations', 'ai-boom'],
    ['nlp-llms', 'ai-trading'],
    ['deep-learning', 'ai-trading'],

    // Finance cluster internal
    ['fin-markets', 'valuation'],
    ['fin-markets', 'risk-analysis'],
    ['fin-markets', 'regulatory'],
    ['fin-markets', 'portfolio'],
    ['risk-analysis', 'derivatives'],

    // Finance cluster -> intersection
    ['fin-markets', 'ai-market-dyn'],
    ['fin-markets', 'ai-boom'],
    ['valuation', 'ai-invest-thesis'],
    ['risk-analysis', 'bubble-value'],
    ['portfolio', 'ai-due-diligence'],

    // Ethics connections
    ['ai-ethics', 'bias-fairness'],
    ['ai-ethics', 'gov-frameworks'],
    ['ai-ethics', 'responsible-ai'],
    ['ai-ethics', 'regulatory'],

    // Product connections
    ['product-strategy', 'market-sizing'],
    ['product-strategy', 'gtm'],
    ['product-strategy', 'competitive'],
    ['product-strategy', 'ai-due-diligence'],

    // Cross-cluster bridges
    ['bubble-value', 'ai-trading'],
    ['ai-invest-thesis', 'ai-due-diligence'],
    ['ai-trading', 'original-thesis'],
    ['ai-due-diligence', 'original-thesis'],
    ['ai-ethics', 'original-thesis'],
    ['product-strategy', 'original-thesis'],
  ];

  // --- Live data (mutable, starts as the defaults) ---
  let CLUSTERS = DEFAULT_CLUSTERS.slice();
  let NODES = DEFAULT_NODES.slice();
  let CONNECTIONS = DEFAULT_CONNECTIONS.slice();

  // --- Build lookup maps ---
  let nodeMap = {};
  function rebuildNodeMap() {
    nodeMap = {};
    NODES.forEach(n => { nodeMap[n.id] = n; });
  }
  rebuildNodeMap();

  // --- Node sizes ---
  function nodeRadius(node) {
    if (node.size === 'large') return 28;
    if (node.size === 'medium') return 20;
    return 14;
  }

  // --- Canvas State ---
  let canvas, ctx, W, H, dpr;
  let hoveredNode = null;
  let animFrame = 0;
  let mouseX = -1, mouseY = -1;

  // Coordinate scaling: design space is 1000x680, scale to fit canvas
  let scaleX, scaleY, offsetX, offsetY;

  function toCanvasX(nx) { return offsetX + nx * scaleX; }
  function toCanvasY(ny) { return offsetY + ny * scaleY; }

  function initCanvas() {
    canvas = document.getElementById('skillTreeCanvas');
    if (!canvas) return false;

    ctx = canvas.getContext('2d');
    dpr = window.devicePixelRatio || 1;

    resizeCanvas();
    return true;
  }

  function resizeCanvas() {
    const container = canvas.parentElement;
    const rect = container.getBoundingClientRect();

    // Respect CSS min-width (for mobile scrolling)
    const computedMin = parseFloat(getComputedStyle(canvas).minWidth) || 0;
    W = Math.max(rect.width, computedMin);
    H = Math.max(500, Math.min(680, W * 0.68));

    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Calculate scaling from design space (1000x680) to canvas
    const designW = 1000;
    const designH = 680;
    const padX = 40;
    const padY = 30;

    scaleX = (W - padX * 2) / designW;
    scaleY = (H - padY * 2) / designH;

    // Maintain aspect ratio (use smaller scale)
    const scale = Math.min(scaleX, scaleY);
    scaleX = scale;
    scaleY = scale;

    offsetX = (W - designW * scale) / 2;
    offsetY = (H - designH * scale) / 2;
  }

  // --- Drawing Functions ---

  function drawClusters() {
    CLUSTERS.forEach(c => {
      const cx = toCanvasX(c.cx);
      const cy = toCanvasY(c.cy);
      const rx = c.rx * scaleX;
      const ry = c.ry * scaleY;

      // Ellipse background
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
      ctx.fillStyle = c.color;
      ctx.fill();
      ctx.strokeStyle = c.borderColor;
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.stroke();
      ctx.setLineDash([]);

      // Cluster label (top of ellipse)
      ctx.fillStyle = c.borderColor.replace(/[\d.]+\)$/, '0.5)');
      ctx.font = `600 ${Math.max(9, 11 * scaleX)}px "Plus Jakarta Sans", sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(c.label, cx, cy - ry + 8 * scaleY);
    });
  }

  function drawConnections() {
    CONNECTIONS.forEach(([fromId, toId]) => {
      const from = nodeMap[fromId];
      const to = nodeMap[toId];
      if (!from || !to) return;

      const x1 = toCanvasX(from.x);
      const y1 = toCanvasY(from.y);
      const x2 = toCanvasX(to.x);
      const y2 = toCanvasY(to.y);

      const fromActive = from.level > 0 || !!from.difficultyTier;
      const toActive = to.level > 0 || !!to.difficultyTier;
      const bothActive = fromActive && toActive;

      // Resolve tier color: demo nodes use level, API nodes use difficultyTier
      function getNodeTierColor(node) {
        if (node.level > 0) return TIER_COLORS[tierForLevel(node.level)];
        if (node.difficultyTier) return TIER_COLORS[node.difficultyTier] || TIER_COLORS.novice;
        return TIER_COLORS.locked;
      }

      // Connection style based on state
      if (bothActive) {
        // Active connection - tier-colored gradient
        const gradient = ctx.createLinearGradient(x1, y1, x2, y2);
        gradient.addColorStop(0, getNodeTierColor(from) + '60');
        gradient.addColorStop(1, getNodeTierColor(to) + '60');
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 2;
      } else if (fromActive || toActive) {
        ctx.strokeStyle = 'rgba(74, 85, 104, 0.25)';
        ctx.lineWidth = 1.5;
      } else {
        ctx.strokeStyle = 'rgba(74, 85, 104, 0.12)';
        ctx.lineWidth = 1;
      }

      // Draw as subtle bezier curve for organic feel
      const midX = (x1 + x2) / 2;
      const midY = (y1 + y2) / 2;
      // Slight curve offset perpendicular to line
      const dx = x2 - x1;
      const dy = y2 - y1;
      const len = Math.sqrt(dx * dx + dy * dy);
      const curveAmount = len * 0.08;
      const cpX = midX + (-dy / len) * curveAmount;
      const cpY = midY + (dx / len) * curveAmount;

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.quadraticCurveTo(cpX, cpY, x2, y2);
      ctx.stroke();
    });
  }

  function drawNodes() {
    NODES.forEach(node => {
      const cx = toCanvasX(node.x);
      const cy = toCanvasY(node.y);
      const r = nodeRadius(node) * Math.min(scaleX, scaleY) * 1.2;
      const unlocked = node.level > 0;
      const tier = unlocked ? tierForLevel(node.level) : (node.difficultyTier || 'locked');
      const color = TIER_COLORS[tier] || TIER_COLORS.locked;
      const isHovered = hoveredNode === node;
      const isPrimary = node.primary;
      const isGrandmaster = node.grandmaster;

      // Outer glow for primary/hovered nodes (works for both demo and API nodes)
      if ((unlocked || node.difficultyTier) && (isPrimary || isHovered)) {
        const glowR = r + 8 + Math.sin(animFrame * 0.04) * 3;
        const glow = ctx.createRadialGradient(cx, cy, r, cx, cy, glowR);
        glow.addColorStop(0, color + '40');
        glow.addColorStop(1, color + '00');
        ctx.beginPath();
        ctx.arc(cx, cy, glowR, 0, Math.PI * 2);
        ctx.fillStyle = glow;
        ctx.fill();
      }

      // Grandmaster locked glow
      if (isGrandmaster) {
        const glowR = r + 6 + Math.sin(animFrame * 0.03) * 2;
        const glow = ctx.createRadialGradient(cx, cy, r, cx, cy, glowR);
        glow.addColorStop(0, TIER_COLORS.grandmaster + '20');
        glow.addColorStop(1, TIER_COLORS.grandmaster + '00');
        ctx.beginPath();
        ctx.arc(cx, cy, glowR, 0, Math.PI * 2);
        ctx.fillStyle = glow;
        ctx.fill();
      }

      // Node circle
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);

      if (unlocked) {
        // Filled node with gradient (demo data with real levels)
        const grad = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.3, 0, cx, cy, r);
        grad.addColorStop(0, lightenColor(color, 30));
        grad.addColorStop(1, color);
        ctx.fillStyle = grad;
        ctx.fill();

        // Border
        ctx.strokeStyle = darkenColor(color, 20);
        ctx.lineWidth = isHovered ? 3 : 2;
        ctx.stroke();
      } else if (node.difficultyTier) {
        // API node: filled with full difficulty color (same style as unlocked demo nodes)
        const grad = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.3, 0, cx, cy, r);
        grad.addColorStop(0, lightenColor(color, 30));
        grad.addColorStop(1, color);
        ctx.fillStyle = grad;
        ctx.fill();

        ctx.strokeStyle = darkenColor(color, 20);
        ctx.lineWidth = isHovered ? 3 : 2;
        ctx.stroke();
      } else {
        // Locked: hollow with dashed border
        ctx.fillStyle = 'rgba(26, 26, 46, 0.4)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(74, 85, 104, 0.3)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([3, 3]);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Inner icon: level number for active nodes, difficulty badge for API nodes, lock for locked
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      if (!unlocked && !node.difficultyTier) {
        // Lock icon
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.font = `${Math.max(8, r * 0.7)}px sans-serif`;
        ctx.fillText('\u{1F512}', cx, cy);
      } else if (node.difficultyTier && !unlocked) {
        // API-sourced nodes: show difficulty number inside (like demo shows levels)
        if (node.size !== 'small') {
          ctx.fillStyle = '#FFFFFF';
          ctx.font = `700 ${Math.max(10, r * 0.65)}px "JetBrains Mono", monospace`;
          ctx.fillText(node.difficulty || '', cx, cy);
        } else {
          // Small dot of white in center (like demo small nodes)
          ctx.beginPath();
          ctx.arc(cx, cy, r * 0.25, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(255,255,255,0.8)';
          ctx.fill();
        }
      } else if (node.size !== 'small') {
        // Level number inside larger nodes
        ctx.fillStyle = '#FFFFFF';
        ctx.font = `700 ${Math.max(10, r * 0.65)}px "JetBrains Mono", monospace`;
        ctx.fillText(node.level, cx, cy);
      } else {
        // Small dot of white in center
        ctx.beginPath();
        ctx.arc(cx, cy, r * 0.25, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,255,255,0.8)';
        ctx.fill();
      }

      // Node label (below node)
      const labelY = cy + r + 8;
      const lines = node.label.split('\n');
      const fontSize = Math.max(8, (node.size === 'large' ? 11 : node.size === 'medium' ? 10 : 9) * Math.min(scaleX, 1));

      ctx.font = `600 ${fontSize}px "Inter", sans-serif`;
      ctx.textBaseline = 'top';

      lines.forEach((line, i) => {
        // Text shadow for readability
        ctx.fillStyle = 'rgba(250, 243, 224, 0.85)';
        ctx.fillText(line, cx, labelY + i * (fontSize + 2));
        // Actual text
        ctx.fillStyle = (unlocked || node.difficultyTier) ? '#1A1A2E' : '#8898AA';
        ctx.fillText(line, cx, labelY + i * (fontSize + 2));
      });

      // Level/difficulty badge for small nodes
      if (node.size === 'small' && (unlocked || node.difficultyTier)) {
        const badgeX = cx + r + 2;
        const badgeY = cy - r - 2;
        ctx.font = `700 ${Math.max(7, 8 * scaleX)}px "JetBrains Mono", monospace`;
        ctx.textBaseline = 'bottom';
        ctx.fillStyle = color;
        ctx.fillText(unlocked ? node.level : node.difficulty, badgeX, badgeY);
      }
    });
  }

  function drawHoverTooltip() {
    if (!hoveredNode) return;
    const node = hoveredNode;
    const cx = toCanvasX(node.x);
    const cy = toCanvasY(node.y);
    const r = nodeRadius(node) * Math.min(scaleX, scaleY) * 1.2;

    const unlocked = node.level > 0;
    const tier = unlocked ? tierForLevel(node.level) : (node.difficultyTier || 'locked');
    const tierName = tier.charAt(0).toUpperCase() + tier.slice(1);
    const color = TIER_COLORS[tier] || TIER_COLORS.locked;

    // Tooltip content
    const title = node.label.replace('\n', ' ');
    let line1, line2;

    if (unlocked) {
      line1 = `Level ${node.level} -- ${tierName}`;
      line2 = `Cluster: ${CLUSTERS.find(c => c.id === node.cluster)?.label || ''}`;
    } else if (node.difficultyTier) {
      line1 = `Difficulty ${node.difficulty || ''} -- ${tierName}`;
      line2 = node.description
        ? (node.description.length > 50 ? node.description.slice(0, 50) + '...' : node.description)
        : (`Cluster: ${CLUSTERS.find(c => c.id === node.cluster)?.label || ''}`);
    } else {
      line1 = 'Locked';
      line2 = 'Complete prerequisites to unlock';
    }

    // Measure tooltip
    ctx.font = '600 12px "Plus Jakarta Sans", sans-serif';
    const titleW = ctx.measureText(title).width;
    ctx.font = '500 10px "Inter", sans-serif';
    const line1W = ctx.measureText(line1).width;
    const line2W = ctx.measureText(line2).width;
    const boxW = Math.max(titleW, line1W, line2W) + 24;
    const boxH = 64;

    // Position above node
    let tipX = cx - boxW / 2;
    let tipY = cy - r - boxH - 12;

    // Keep in bounds
    if (tipX < 8) tipX = 8;
    if (tipX + boxW > W - 8) tipX = W - boxW - 8;
    if (tipY < 8) tipY = cy + r + 12; // flip below if too high

    // Shadow
    ctx.shadowColor = 'rgba(0,0,0,0.15)';
    ctx.shadowBlur = 12;
    ctx.shadowOffsetY = 4;

    // Background
    ctx.beginPath();
    roundRect(ctx, tipX, tipY, boxW, boxH, 8);
    ctx.fillStyle = '#1A1A2E';
    ctx.fill();

    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;

    // Top color accent bar
    ctx.beginPath();
    roundRectTop(ctx, tipX, tipY, boxW, 3, 8);
    ctx.fillStyle = color;
    ctx.fill();

    // Text
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';

    ctx.fillStyle = '#FFFFFF';
    ctx.font = '600 12px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(title, tipX + 12, tipY + 10);

    ctx.fillStyle = color;
    ctx.font = '600 10px "JetBrains Mono", monospace';
    ctx.fillText(line1, tipX + 12, tipY + 28);

    ctx.fillStyle = '#8898AA';
    ctx.font = '400 9px "Inter", sans-serif';
    ctx.fillText(line2, tipX + 12, tipY + 44);
  }

  // --- Helper: rounded rectangle ---
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

  // --- Color Helpers ---
  function lightenColor(hex, amount) {
    const num = parseInt(hex.replace('#', ''), 16);
    const r = Math.min(255, (num >> 16) + amount);
    const g = Math.min(255, ((num >> 8) & 0xff) + amount);
    const b = Math.min(255, (num & 0xff) + amount);
    return `rgb(${r},${g},${b})`;
  }

  function darkenColor(hex, amount) {
    const num = parseInt(hex.replace('#', ''), 16);
    const r = Math.max(0, (num >> 16) - amount);
    const g = Math.max(0, ((num >> 8) & 0xff) - amount);
    const b = Math.max(0, (num & 0xff) - amount);
    return `rgb(${r},${g},${b})`;
  }

  // --- Hit Testing ---
  function hitTestNode(mx, my) {
    // Reverse iterate so top-drawn nodes get priority
    for (let i = NODES.length - 1; i >= 0; i--) {
      const node = NODES[i];
      const cx = toCanvasX(node.x);
      const cy = toCanvasY(node.y);
      const r = nodeRadius(node) * Math.min(scaleX, scaleY) * 1.2 + 6; // extra hit area
      const dx = mx - cx;
      const dy = my - cy;
      if (dx * dx + dy * dy <= r * r) return node;
    }
    return null;
  }

  // --- Render Loop ---
  function render() {
    animFrame++;

    ctx.clearRect(0, 0, W, H);

    // Background gradient (subtle)
    const bgGrad = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, W * 0.6);
    bgGrad.addColorStop(0, 'rgba(250, 243, 224, 1)');
    bgGrad.addColorStop(1, 'rgba(248, 245, 236, 1)');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    drawClusters();
    drawConnections();
    drawNodes();
    drawHoverTooltip();

    requestAnimationFrame(render);
  }

  // --- Mouse Interaction ---
  function setupInteraction() {
    canvas.addEventListener('mousemove', (e) => {
      const rect = canvas.getBoundingClientRect();
      mouseX = e.clientX - rect.left;
      mouseY = e.clientY - rect.top;
      const hit = hitTestNode(mouseX, mouseY);
      if (hit !== hoveredNode) {
        hoveredNode = hit;
        canvas.style.cursor = hit ? 'pointer' : 'default';
      }
    });

    canvas.addEventListener('mouseleave', () => {
      hoveredNode = null;
      canvas.style.cursor = 'default';
    });

    // Touch support
    canvas.addEventListener('touchstart', (e) => {
      const rect = canvas.getBoundingClientRect();
      const touch = e.touches[0];
      mouseX = touch.clientX - rect.left;
      mouseY = touch.clientY - rect.top;
      hoveredNode = hitTestNode(mouseX, mouseY);
    }, { passive: true });

    canvas.addEventListener('touchend', () => {
      // Keep tooltip visible briefly on touch
      setTimeout(() => { hoveredNode = null; }, 2000);
    });

    // Resize handling
    window.addEventListener('resize', () => {
      resizeCanvas();
    });
  }

  // --- Legend ---
  function drawLegend() {
    const legendEl = document.getElementById('skillTreeLegend');
    if (!legendEl) return;

    const tiers = [
      { name: 'Novice (1-15)', color: TIER_COLORS.novice },
      { name: 'Apprentice (16-30)', color: TIER_COLORS.apprentice },
      { name: 'Journeyman (31-50)', color: TIER_COLORS.journeyman },
      { name: 'Adept (51-70)', color: TIER_COLORS.adept },
      { name: 'Expert (71-85)', color: TIER_COLORS.expert },
      { name: 'Master (86-92)', color: TIER_COLORS.master },
      { name: 'Grandmaster (93-99)', color: TIER_COLORS.grandmaster },
      { name: 'Locked', color: TIER_COLORS.locked },
    ];

    legendEl.innerHTML = tiers.map(t =>
      `<div class="tree-legend-item">
        <span class="tree-legend-dot" style="background: ${t.color};"></span>
        <span>${t.name}</span>
      </div>`
    ).join('');
  }

  // ============================================================
  // --- API: Load Skill Tree from API Response ---
  // ============================================================
  //
  // Layout algorithm:
  //   1. Assign each node a layer = longest BFS depth from any root.
  //   2. Within each layer, group nodes by category, then space evenly.
  //   3. Auto-generate CLUSTERS from unique categories.
  //   4. Design space: 1000x680, padding 80px from edges.
  //
  // treeData shape:
  //   { nodes: [{id, name, description, difficulty, tier, category, prerequisites, children}],
  //     roots: [id, ...], totalNodes, tiers: [{level, name, nodeIds}] }
  // ============================================================

  window.loadSkillTreeFromAPI = function(treeData) {
    if (!treeData || !Array.isArray(treeData.nodes) || treeData.nodes.length === 0) {
      console.warn('loadSkillTreeFromAPI: invalid or empty treeData');
      return;
    }

    var apiNodes = treeData.nodes;
    var roots = treeData.roots || [];

    // Build lookup
    var apiNodeById = {};
    apiNodes.forEach(function(n) { apiNodeById[n.id] = n; });

    // Find roots if not declared
    if (!roots.length) {
      roots = apiNodes
        .filter(function(n) { return !n.prerequisites || n.prerequisites.length === 0; })
        .map(function(n) { return n.id; });
    }
    if (!roots.length && apiNodes.length) roots = [apiNodes[0].id];

    // Count connections per node (for hub detection)
    var connectionCount = {};
    apiNodes.forEach(function(n) {
      connectionCount[n.id] = (connectionCount[n.id] || 0) + (n.children || []).length + (n.prerequisites || []).length;
    });

    // --- Gather unique categories ---
    var categorySet = {};
    apiNodes.forEach(function(n) { categorySet[n.category || 'General'] = true; });
    var categories = Object.keys(categorySet);

    // Group nodes by category
    var nodesByCategory = {};
    categories.forEach(function(cat) { nodesByCategory[cat] = []; });
    apiNodes.forEach(function(n) { nodesByCategory[n.category || 'General'].push(n); });

    // Cluster color palette
    var clusterPalettes = [
      { color: 'rgba(30, 136, 229, 0.06)',  borderColor: 'rgba(30, 136, 229, 0.15)' },
      { color: 'rgba(255, 143, 0, 0.06)',   borderColor: 'rgba(255, 143, 0, 0.15)' },
      { color: 'rgba(171, 71, 188, 0.06)',  borderColor: 'rgba(171, 71, 188, 0.18)' },
      { color: 'rgba(67, 160, 71, 0.06)',   borderColor: 'rgba(67, 160, 71, 0.15)' },
      { color: 'rgba(141, 110, 99, 0.06)',  borderColor: 'rgba(141, 110, 99, 0.15)' },
      { color: 'rgba(211, 47, 47, 0.06)',   borderColor: 'rgba(211, 47, 47, 0.15)' },
      { color: 'rgba(0, 150, 136, 0.06)',   borderColor: 'rgba(0, 150, 136, 0.15)' },
      { color: 'rgba(121, 85, 72, 0.06)',   borderColor: 'rgba(121, 85, 72, 0.15)' },
    ];

    // ============================================================
    // RADIAL CLUSTER LAYOUT (PoE-style)
    // Design space: 1000 x 680
    // Center: 500, 340
    // Categories are placed radially around center
    // Nodes within each category orbit their cluster center
    // ============================================================

    var centerX = 500, centerY = 340;
    var numCats = categories.length;

    // Determine cluster center positions radially
    // If few categories, use specific pleasing arrangements
    var clusterCenters = {};
    if (numCats === 1) {
      clusterCenters[categories[0]] = { cx: centerX, cy: centerY };
    } else if (numCats === 2) {
      clusterCenters[categories[0]] = { cx: 300, cy: 300 };
      clusterCenters[categories[1]] = { cx: 700, cy: 300 };
    } else if (numCats === 3) {
      clusterCenters[categories[0]] = { cx: 250, cy: 220 };
      clusterCenters[categories[1]] = { cx: 750, cy: 220 };
      clusterCenters[categories[2]] = { cx: 500, cy: 500 };
    } else {
      // Radial placement with first cluster at top-left
      var startAngle = -Math.PI * 0.75; // start at ~top-left
      var radiusX = numCats <= 5 ? 250 : 280;
      var radiusY = numCats <= 5 ? 180 : 200;
      categories.forEach(function(cat, i) {
        var angle = startAngle + (2 * Math.PI * i / numCats);
        clusterCenters[cat] = {
          cx: centerX + Math.cos(angle) * radiusX,
          cy: centerY + Math.sin(angle) * radiusY,
        };
      });
    }

    // --- Position nodes within each cluster ---
    var positionOf = {};

    categories.forEach(function(cat) {
      var nodes = nodesByCategory[cat];
      var cc = clusterCenters[cat];
      var count = nodes.length;

      // Sort nodes: highest-connection nodes first (hub nodes at center)
      nodes.sort(function(a, b) {
        return (connectionCount[b.id] || 0) - (connectionCount[a.id] || 0);
      });

      if (count === 1) {
        positionOf[nodes[0].id] = { x: cc.cx, y: cc.cy };
      } else if (count === 2) {
        positionOf[nodes[0].id] = { x: cc.cx, y: cc.cy };
        positionOf[nodes[1].id] = { x: cc.cx + 80, y: cc.cy + 60 };
      } else {
        // Hub node (most connected) at cluster center
        positionOf[nodes[0].id] = { x: cc.cx, y: cc.cy };

        // Remaining nodes orbit the hub
        var orbitR = Math.min(120, 55 + count * 12);
        for (var i = 1; i < count; i++) {
          var angle = (-Math.PI / 2) + (2 * Math.PI * (i - 1) / (count - 1));
          // Alternate orbit radius slightly for organic feel
          var r = orbitR * (0.85 + (i % 2) * 0.3);
          positionOf[nodes[i].id] = {
            x: cc.cx + Math.cos(angle) * r,
            y: cc.cy + Math.sin(angle) * r * 0.8, // squash vertically
          };
        }
      }
    });

    // --- Simple force-based collision nudging (3 passes) ---
    var nodeIds = apiNodes.map(function(n) { return n.id; });
    for (var pass = 0; pass < 3; pass++) {
      for (var i = 0; i < nodeIds.length; i++) {
        for (var j = i + 1; j < nodeIds.length; j++) {
          var a = positionOf[nodeIds[i]];
          var b = positionOf[nodeIds[j]];
          var dx = b.x - a.x;
          var dy = b.y - a.y;
          var dist = Math.sqrt(dx * dx + dy * dy);
          var minDist = 70;
          if (dist < minDist && dist > 0) {
            var push = (minDist - dist) / 2;
            var nx = dx / dist;
            var ny = dy / dist;
            a.x -= nx * push;
            a.y -= ny * push;
            b.x += nx * push;
            b.y += ny * push;
          }
        }
      }
    }

    // Clamp positions to design bounds
    nodeIds.forEach(function(id) {
      var p = positionOf[id];
      p.x = Math.max(60, Math.min(940, p.x));
      p.y = Math.max(60, Math.min(620, p.y));
    });

    // --- Build cluster ellipses from actual node positions ---
    var newClusters = categories.map(function(cat, i) {
      var nodes = nodesByCategory[cat];
      var palette = clusterPalettes[i % clusterPalettes.length];
      var minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
      nodes.forEach(function(n) {
        var p = positionOf[n.id];
        if (p.x < minX) minX = p.x;
        if (p.x > maxX) maxX = p.x;
        if (p.y < minY) minY = p.y;
        if (p.y > maxY) maxY = p.y;
      });
      return {
        id: 'cat_' + i,
        label: cat,
        cx: (minX + maxX) / 2,
        cy: (minY + maxY) / 2,
        rx: Math.max(70, (maxX - minX) / 2 + 65),
        ry: Math.max(60, (maxY - minY) / 2 + 55),
        color: palette.color,
        borderColor: palette.borderColor,
      };
    });

    var categoryClusterMap = {};
    categories.forEach(function(cat, i) { categoryClusterMap[cat] = 'cat_' + i; });

    // --- Node size from difficulty ---
    function sizeForDifficulty(diff, isHub) {
      if (isHub) return 'large';
      if (diff >= 5) return 'large';
      if (diff >= 3) return 'medium';
      return 'small';
    }

    // --- Build NODES ---
    var newNodes = apiNodes.map(function(n, idx) {
      var pos = positionOf[n.id] || { x: centerX, y: centerY };
      var cat = n.category || 'General';
      var diff = n.difficulty || 1;
      var diffTier = tierForDifficulty(diff);
      var isHub = (connectionCount[n.id] || 0) >= 5;

      // Wrap long names into two lines
      var rawName = n.name || ('Node ' + (idx + 1));
      var label = rawName;
      if (rawName.length > 14) {
        var mid = Math.floor(rawName.length / 2);
        var breakIdx = rawName.lastIndexOf(' ', mid);
        if (breakIdx === -1) breakIdx = rawName.indexOf(' ', mid);
        if (breakIdx !== -1) {
          label = rawName.slice(0, breakIdx) + '\n' + rawName.slice(breakIdx + 1);
        }
      }

      return {
        id: n.id,
        label: label,
        level: 0,
        difficulty: diff,
        difficultyTier: diffTier,
        description: n.description || '',
        x: pos.x,
        y: pos.y,
        cluster: categoryClusterMap[cat] || 'cat_0',
        size: sizeForDifficulty(diff, isHub),
        primary: isHub || (roots.indexOf(n.id) !== -1),
      };
    });

    // --- Build CONNECTIONS from prerequisites ---
    var newConnections = [];
    apiNodes.forEach(function(n) {
      if (Array.isArray(n.prerequisites)) {
        n.prerequisites.forEach(function(prereqId) {
          newConnections.push([prereqId, n.id]);
        });
      }
    });

    // --- Swap data and rebuild ---
    CLUSTERS = newClusters;
    NODES = newNodes;
    CONNECTIONS = newConnections;
    hoveredNode = null;
    rebuildNodeMap();

    // Update header
    var headerEl = document.querySelector('#skill-tree .section-header h2');
    if (headerEl && treeData.skillName) {
      headerEl.textContent = 'Skill Tree: ' + treeData.skillName;
    }
    var subHeaderEl = document.querySelector('#skill-tree .section-header p');
    if (subHeaderEl) {
      subHeaderEl.textContent =
        treeData.totalNodes + ' nodes across ' + categories.length + ' categories -- generated from your article';
    }

    // Update legend to show difficulty tiers instead of levels
    var legendEl = document.getElementById('skillTreeLegend');
    if (legendEl) {
      var diffTiers = [
        { name: 'D1 Novice', color: TIER_COLORS.novice },
        { name: 'D2 Apprentice', color: TIER_COLORS.apprentice },
        { name: 'D3 Journeyman', color: TIER_COLORS.journeyman },
        { name: 'D4 Adept', color: TIER_COLORS.adept },
        { name: 'D5 Expert', color: TIER_COLORS.expert },
      ];
      legendEl.innerHTML = diffTiers.map(function(t) {
        return '<div class="tree-legend-item">' +
          '<span class="tree-legend-dot" style="background: ' + t.color + ';"></span>' +
          '<span>' + t.name + '</span></div>';
      }).join('');
    }
  };

  // ============================================================
  // --- API: Reset to hardcoded demo data ---
  // ============================================================
  window.resetSkillTree = function() {
    CLUSTERS = DEFAULT_CLUSTERS.slice();
    NODES = DEFAULT_NODES.slice();
    CONNECTIONS = DEFAULT_CONNECTIONS.slice();
    hoveredNode = null;
    rebuildNodeMap();

    var headerEl = document.querySelector('#skill-tree .section-header h2');
    if (headerEl) headerEl.textContent = 'Skill Tree: AI Boom in Finance';
    var subHeaderEl = document.querySelector('#skill-tree .section-header p');
    if (subHeaderEl) subHeaderEl.textContent = 'Interconnected knowledge graph -- every node feeds into mastery';

    // Restore full legend
    drawLegend();
  };

  // --- Initialize ---
  function init() {
    if (!initCanvas()) return;
    setupInteraction();
    drawLegend();
    render();
  }

  // Run when DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
