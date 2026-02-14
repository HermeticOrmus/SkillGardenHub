// SkillGarden Configuration TEMPLATE
// Copy this file to config.js and fill in your API keys
// cp config.example.js config.js
// NOTE: config.js is gitignored -- never commit API keys

const CONFIG = {
  // Supabase
  supabase: {
    url: '',      // Fill: https://xxx.supabase.co
    anonKey: '',  // Fill: public anon key (eyJ...)
  },

  // Anthropic (Claude)
  anthropic: {
    apiKey: '',   // Fill: sk-ant-...
    model: 'claude-sonnet-4-5-20250929',
    baseUrl: 'https://api.anthropic.com/v1',
  },

  // ElevenLabs
  elevenlabs: {
    apiKey: '',   // Fill: sk_...
    baseUrl: 'https://api.elevenlabs.io/v1',
    voiceId: 'EXAVITQu4vr4xnSDxMaL', // Default: Sarah
  },

  // Blaxel (Agent hosting platform)
  blaxel: {
    apiKey: '',   // Fill: bl_...
    baseUrl: '',  // Fill once agents deployed
  },

  // White Circle AI (AI safety + content verification)
  whitecircle: {
    apiKey: '',   // Fill: wc-...
    baseUrl: 'https://api.whitecircle.ai/v1',
  },

  // XP System (OSRS formula constants)
  xp: {
    maxLevel: 99,
    tiers: [
      { name: 'Novice',      start: 1,  end: 15, color: '#8D6E63' },
      { name: 'Apprentice',   start: 16, end: 30, color: '#78909C' },
      { name: 'Journeyman',   start: 31, end: 50, color: '#43A047' },
      { name: 'Adept',        start: 51, end: 70, color: '#1E88E5' },
      { name: 'Expert',       start: 71, end: 85, color: '#AB47BC' },
      { name: 'Master',       start: 86, end: 92, color: '#FF8F00' },
      { name: 'Grandmaster',  start: 93, end: 99, color: '#D32F2F' },
    ],
  },
};

// --- XP Table (OSRS formula, precomputed) ---
const XP_TABLE = new Array(100).fill(0);
(function computeXPTable() {
  let innerSum = 0;
  for (let L = 2; L <= 99; L++) {
    const ell = L - 1;
    innerSum += Math.floor(ell + 300 * Math.pow(2, ell / 7));
    XP_TABLE[L] = Math.floor(innerSum / 4);
  }
})();

function getTierForLevel(level) {
  return CONFIG.xp.tiers.find(t => level >= t.start && level <= t.end) || CONFIG.xp.tiers[0];
}

function xpForLevel(level) {
  return XP_TABLE[Math.min(level, 99)];
}

function xpBetweenLevels(from, to) {
  return xpForLevel(to) - xpForLevel(from);
}
