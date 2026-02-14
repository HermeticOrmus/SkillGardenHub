// SkillGarden Mockup -- Interactive Demo
// Scroll reveals, tabs, XP curve, animations

document.addEventListener('DOMContentLoaded', () => {

  // --- Scroll Reveal Animation ---
  const revealElements = document.querySelectorAll('.reveal, .reveal-stagger');
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

  revealElements.forEach(el => revealObserver.observe(el));

  // --- Tab Switching (with ARIA + keyboard nav) ---
  const tabs = document.querySelectorAll('.tab');
  const tabContents = document.querySelectorAll('.tab-content');

  function activateTab(tab) {
    const target = tab.dataset.tab;

    // Deactivate all
    tabs.forEach(t => {
      t.classList.remove('active');
      t.setAttribute('aria-selected', 'false');
      t.setAttribute('tabindex', '-1');
    });
    tabContents.forEach(tc => tc.classList.remove('active'));

    // Activate selected
    tab.classList.add('active');
    tab.setAttribute('aria-selected', 'true');
    tab.setAttribute('tabindex', '0');
    document.getElementById(`tab-${target}`).classList.add('active');
  }

  tabs.forEach(tab => {
    tab.addEventListener('click', () => activateTab(tab));

    // Keyboard navigation: arrow keys between tabs
    tab.addEventListener('keydown', (e) => {
      const tabsArray = Array.from(tabs);
      const idx = tabsArray.indexOf(tab);

      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        const next = tabsArray[(idx + 1) % tabsArray.length];
        next.focus();
        activateTab(next);
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        const prev = tabsArray[(idx - 1 + tabsArray.length) % tabsArray.length];
        prev.focus();
        activateTab(prev);
      }
    });
  });

  // Set initial tabindex
  tabs.forEach((tab, i) => {
    tab.setAttribute('tabindex', i === 0 ? '0' : '-1');
  });

  // --- Smooth Scroll for Nav Links ---
  document.querySelectorAll('.nav-links a').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = link.getAttribute('href');
      const target = document.querySelector(targetId);
      if (target) {
        const navHeight = document.querySelector('.nav').offsetHeight;
        const targetPos = target.getBoundingClientRect().top + window.pageYOffset - navHeight;
        window.scrollTo({ top: targetPos, behavior: 'smooth' });
      }

      document.querySelectorAll('.nav-links a').forEach(l => l.classList.remove('active'));
      link.classList.add('active');
    });
  });

  // --- Active Nav on Scroll ---
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-links a');

  const navObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.getAttribute('id');
        navLinks.forEach(link => {
          link.classList.toggle('active', link.getAttribute('href') === `#${id}`);
        });
      }
    });
  }, { root: null, rootMargin: '-80px 0px -50% 0px', threshold: 0 });

  sections.forEach(section => navObserver.observe(section));

  // --- XP Bar Animation on Scroll ---
  const xpBars = document.querySelectorAll('.xp-bar');
  const xpObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const bar = entry.target;
        const targetWidth = bar.style.width;
        bar.style.width = '0%';
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            bar.style.width = targetWidth;
          });
        });
        xpObserver.unobserve(bar);
      }
    });
  }, { threshold: 0.2 });

  xpBars.forEach(bar => xpObserver.observe(bar));

  // --- Assessment Option Click ---
  document.querySelectorAll('.assessment-option').forEach(option => {
    option.setAttribute('role', 'button');
    option.setAttribute('tabindex', '0');

    const handleSelect = () => {
      const siblings = option.parentElement.querySelectorAll('.assessment-option');
      siblings.forEach(s => {
        s.classList.remove('selected');
        s.setAttribute('aria-pressed', 'false');
      });
      option.classList.add('selected');
      option.setAttribute('aria-pressed', 'true');
    };

    option.addEventListener('click', handleSelect);
    option.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleSelect();
      }
    });
  });

  // --- Stat Counter Animation ---
  const statValues = document.querySelectorAll('.stat-value');
  const statObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const target = parseInt(el.textContent);
        if (isNaN(target)) return;

        let current = 0;
        const duration = 1200;
        const step = target / (duration / 16);

        const counter = () => {
          current += step;
          if (current >= target) {
            el.textContent = target;
          } else {
            el.textContent = Math.floor(current);
            requestAnimationFrame(counter);
          }
        };

        el.textContent = '0';
        requestAnimationFrame(counter);
        statObserver.unobserve(el);
      }
    });
  }, { threshold: 0.5 });

  statValues.forEach(stat => statObserver.observe(stat));

  // --- Audio Wave Animation Pause/Play ---
  document.querySelectorAll('.capture-audio-bar').forEach(bar => {
    let playing = false;
    bar.setAttribute('role', 'button');
    bar.setAttribute('aria-label', 'Play audio recap');

    bar.addEventListener('click', () => {
      playing = !playing;
      const waves = bar.querySelectorAll('.audio-wave span');
      const btn = bar.querySelector('.play-btn');
      waves.forEach(w => {
        w.style.animationPlayState = playing ? 'running' : 'paused';
      });
      btn.textContent = playing ? '\u275A\u275A' : '\u25B6';
      bar.setAttribute('aria-label', playing ? 'Pause audio recap' : 'Play audio recap');
    });

    // Start paused
    bar.querySelectorAll('.audio-wave span').forEach(w => {
      w.style.animationPlayState = 'paused';
    });
  });

  // --- XP Curve Canvas ---
  drawXPCurve();

  // --- Nav Background on Scroll ---
  const nav = document.querySelector('.nav');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 40) {
      nav.style.background = 'rgba(27, 67, 50, 0.97)';
      nav.style.backdropFilter = 'blur(12px)';
    } else {
      nav.style.background = 'var(--deep-forest)';
      nav.style.backdropFilter = 'none';
    }
  }, { passive: true });

});

// --- XP Curve Drawing ---
// Exact RuneScape/OSRS formula: XP(L) = floor( sum_{ℓ=1}^{L-1} floor(ℓ + 300 * 2^(ℓ/7)) / 4 )
// Produces Level 99 = 13,034,431 XP (verified against OSRS wiki)
function drawXPCurve() {
  const canvas = document.getElementById('xpCurveCanvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;

  // Scale for crisp rendering
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  ctx.scale(dpr, dpr);

  const W = rect.width;
  const H = rect.height;
  const pad = { top: 20, right: 30, bottom: 40, left: 60 };
  const plotW = W - pad.left - pad.right;
  const plotH = H - pad.top - pad.bottom;

  // Generate XP data -- exact OSRS formula
  // xpTable[L] = total XP required to reach level L
  const xpTable = new Array(100).fill(0);
  let innerSum = 0;
  for (let L = 2; L <= 99; L++) {
    const ell = L - 1;
    innerSum += Math.floor(ell + 300 * Math.pow(2, ell / 7));
    xpTable[L] = Math.floor(innerSum / 4);
  }
  const maxXP = xpTable[99];

  // Tier boundaries and colors
  const tiers = [
    { start: 1, end: 15, color: '#8D6E63' },
    { start: 16, end: 30, color: '#78909C' },
    { start: 31, end: 50, color: '#43A047' },
    { start: 51, end: 70, color: '#1E88E5' },
    { start: 71, end: 85, color: '#AB47BC' },
    { start: 86, end: 92, color: '#FF8F00' },
    { start: 93, end: 99, color: '#D32F2F' },
  ];

  function x(level) { return pad.left + (level / 99) * plotW; }
  function y(xp) { return pad.top + plotH - (xp / maxXP) * plotH; }

  // Grid lines
  ctx.strokeStyle = 'rgba(226, 232, 240, 0.5)';
  ctx.lineWidth = 0.5;
  for (let i = 0; i <= 4; i++) {
    const gy = pad.top + (plotH / 4) * i;
    ctx.beginPath();
    ctx.moveTo(pad.left, gy);
    ctx.lineTo(W - pad.right, gy);
    ctx.stroke();
  }

  // Draw curve segments per tier
  tiers.forEach(tier => {
    ctx.beginPath();
    ctx.strokeStyle = tier.color;
    ctx.lineWidth = 2.5;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    for (let n = tier.start; n <= tier.end; n++) {
      const px = x(n);
      const py = y(xpTable[n]);
      if (n === tier.start) {
        ctx.moveTo(px, py);
      } else {
        ctx.lineTo(px, py);
      }
    }
    ctx.stroke();

    // Fill area under curve (subtle)
    ctx.beginPath();
    ctx.moveTo(x(tier.start), y(xpTable[tier.start]));
    for (let n = tier.start; n <= tier.end; n++) {
      ctx.lineTo(x(n), y(xpTable[n]));
    }
    ctx.lineTo(x(tier.end), pad.top + plotH);
    ctx.lineTo(x(tier.start), pad.top + plotH);
    ctx.closePath();
    ctx.fillStyle = tier.color + '10';
    ctx.fill();
  });

  // Level 92 marker
  ctx.setLineDash([4, 4]);
  ctx.strokeStyle = '#BF360C';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x(92), pad.top);
  ctx.lineTo(x(92), pad.top + plotH);
  ctx.stroke();
  ctx.setLineDash([]);

  // Label: "Lv 92 = halfway"
  ctx.fillStyle = '#BF360C';
  ctx.font = '600 10px "JetBrains Mono", monospace';
  ctx.textAlign = 'center';
  ctx.fillText('Lv 92', x(92), pad.top + plotH + 24);
  ctx.font = '400 9px "JetBrains Mono", monospace';
  ctx.fillText('= 50% of total XP', x(92), pad.top + plotH + 36);

  // Current level marker (76 -- Yavuz's AI Boom in Finance)
  const lvl = 76;
  ctx.beginPath();
  ctx.arc(x(lvl), y(xpTable[lvl]), 5, 0, Math.PI * 2);
  ctx.fillStyle = '#AB47BC';
  ctx.fill();
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = '#AB47BC';
  ctx.font = '600 10px "JetBrains Mono", monospace';
  ctx.textAlign = 'left';
  ctx.fillText('You: Lv 76', x(lvl) + 10, y(xpTable[lvl]) + 4);

  // Axis labels
  ctx.fillStyle = '#8898AA';
  ctx.font = '500 10px "Inter", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Level', W / 2, H - 4);

  ctx.save();
  ctx.translate(12, H / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText('Experience Required', 0, 0);
  ctx.restore();

  // Level ticks
  [1, 15, 30, 50, 70, 85, 92, 99].forEach(n => {
    ctx.fillStyle = '#8898AA';
    ctx.font = '500 9px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(n, x(n), pad.top + plotH + 14);
  });
}
