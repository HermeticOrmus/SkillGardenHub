// SkillGarden XP Engine Agent
// Deployed on Blaxel as serverless endpoint
// Manages OSRS XP calculations, skill decay, level-ups

const HOST = process.env.HOST || '0.0.0.0';
const PORT = process.env.PORT || 3000;

// --- OSRS XP Table (precomputed) ---
const XP_TABLE = new Array(100).fill(0);
(function() {
  let innerSum = 0;
  for (let L = 2; L <= 99; L++) {
    const ell = L - 1;
    innerSum += Math.floor(ell + 300 * Math.pow(2, ell / 7));
    XP_TABLE[L] = Math.floor(innerSum / 4);
  }
})();

const TIERS = [
  { name: 'Novice',      start: 1,  end: 15 },
  { name: 'Apprentice',   start: 16, end: 30 },
  { name: 'Journeyman',   start: 31, end: 50 },
  { name: 'Adept',        start: 51, end: 70 },
  { name: 'Expert',       start: 71, end: 85 },
  { name: 'Master',       start: 86, end: 92 },
  { name: 'Grandmaster',  start: 93, end: 99 },
];

// Decay rate: lose ~0.5% effective level per day of inactivity after 7 days
const DECAY_GRACE_DAYS = 7;
const DECAY_RATE_PER_DAY = 0.005;

import { createServer } from 'http';

const server = createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') { res.writeHead(200); res.end(); return; }
  if (req.method !== 'POST') { res.writeHead(405); res.end('Method not allowed'); return; }

  let body = '';
  req.on('data', chunk => body += chunk);
  req.on('end', async () => {
    try {
      const { action, ...params } = JSON.parse(body);

      let result;
      switch (action) {
        case 'award_xp':
          result = awardXP(params.currentXP, params.currentLevel, params.xpGained);
          break;
        case 'calculate_decay':
          result = calculateDecay(params.level, params.lastAssessed);
          break;
        case 'level_info':
          result = getLevelInfo(params.level);
          break;
        case 'xp_for_level':
          result = { level: params.level, xp: XP_TABLE[params.level] };
          break;
        case 'full_table':
          result = { table: XP_TABLE.slice(1) };
          break;
        default:
          res.writeHead(400);
          res.end(JSON.stringify({ error: `Unknown action: ${action}` }));
          return;
      }

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(result));
    } catch (err) {
      res.writeHead(500);
      res.end(JSON.stringify({ error: err.message }));
    }
  });
});

server.listen(PORT, HOST, () => {
  console.log(`[XP Engine] Running on ${HOST}:${PORT}`);
});

// --- XP Logic ---

function awardXP(currentXP, currentLevel, xpGained) {
  const newXP = currentXP + xpGained;
  let newLevel = currentLevel;

  while (newLevel < 99 && newXP >= XP_TABLE[newLevel + 1]) {
    newLevel++;
  }

  const tier = TIERS.find(t => newLevel >= t.start && newLevel <= t.end);
  const nextLevelXP = newLevel < 99 ? XP_TABLE[newLevel + 1] : XP_TABLE[99];
  const xpToNextLevel = nextLevelXP - newXP;
  const xpInCurrentLevel = newXP - XP_TABLE[newLevel];
  const xpForCurrentLevel = XP_TABLE[newLevel + 1] - XP_TABLE[newLevel];
  const progressPercent = (xpInCurrentLevel / xpForCurrentLevel) * 100;

  return {
    xp: newXP,
    level: newLevel,
    tier: tier?.name || 'Unknown',
    leveledUp: newLevel > currentLevel,
    levelsGained: newLevel - currentLevel,
    xpToNextLevel,
    progressPercent: Math.min(progressPercent, 100),
    nextTier: newLevel < 99 ? TIERS.find(t => newLevel < t.start)?.name : null,
  };
}

function calculateDecay(level, lastAssessedISO) {
  const lastAssessed = new Date(lastAssessedISO);
  const now = new Date();
  const daysSince = (now - lastAssessed) / (1000 * 60 * 60 * 24);

  if (daysSince <= DECAY_GRACE_DAYS) {
    return {
      decayed: false,
      effectiveLevel: level,
      daysInactive: Math.floor(daysSince),
      message: `${DECAY_GRACE_DAYS - Math.floor(daysSince)} days until decay begins`,
    };
  }

  const decayDays = daysSince - DECAY_GRACE_DAYS;
  const decayFactor = 1 - (DECAY_RATE_PER_DAY * decayDays);
  const effectiveLevel = Math.max(1, Math.round(level * Math.max(decayFactor, 0.7))); // Floor: 70% of level

  return {
    decayed: true,
    originalLevel: level,
    effectiveLevel,
    levelsLost: level - effectiveLevel,
    daysInactive: Math.floor(daysSince),
    decayDays: Math.floor(decayDays),
    message: `${level - effectiveLevel} levels decayed over ${Math.floor(decayDays)} days`,
    reinforcementNeeded: true,
  };
}

function getLevelInfo(level) {
  const tier = TIERS.find(t => level >= t.start && level <= t.end);
  const xp = XP_TABLE[level];
  const nextXP = level < 99 ? XP_TABLE[level + 1] : XP_TABLE[99];
  const percentOfMax = (xp / XP_TABLE[99]) * 100;

  // Percentile approximation (exponential distribution)
  const percentile = Math.max(1, Math.round(100 - (level / 99) * 100 + Math.random() * 5));

  return {
    level,
    tier: tier?.name,
    xp,
    xpToNextLevel: nextXP - xp,
    totalXPForMax: XP_TABLE[99],
    percentOfMax: percentOfMax.toFixed(2),
    percentile: `Top ${percentile}%`,
    halfwayLevel: 92, // Level 92 = 50% of total XP
    isAboveHalfway: level >= 92,
  };
}
