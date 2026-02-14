// SkillGarden Configuration
// API keys and service endpoints
// NOTE: For hackathon demo only. In production, keys go server-side.

const CONFIG = {
  // Supabase
  supabase: {
    url: 'https://sephyidadrygdydqnuue.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlcGh5aWRhZHJ5Z2R5ZHFudXVlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEwODcwNTEsImV4cCI6MjA4NjY2MzA1MX0.9EoMfhuaFCxp8SpUv0q71gwiy5STPK38-xZmrH0ufnI',
  },

  // Anthropic (Claude)
  anthropic: {
    apiKey: '',   // Fill: sk-ant-...
    model: 'claude-sonnet-4-5-20250929',
    baseUrl: 'https://api.anthropic.com/v1',
  },

  // ElevenLabs
  elevenlabs: {
    apiKey: 'sk_4cbf4173f580827f4ff5afe0e512c6301a24da56e39754b8',
    baseUrl: 'https://api.elevenlabs.io/v1',
    voiceId: 'EXAVITQu4vr4xnSDxMaL', // Default: Sarah
  },

  // Blaxel (Agent hosting platform)
  blaxel: {
    apiKey: 'bl_aaabfbn6atqdqcsn8gnf05n2gvxddg5p',
    workspace: 'skillgardenhub',
    skillTreeUrl: 'https://agt-sg-skill-tree-maker-gjvgic.bl.run',
  },

  // White Circle AI (AI safety + content verification)
  // Endpoints: /policies/verify, /metrics/evaluate
  whitecircle: {
    apiKey: 'wc-83d40f857681173f9d02bfe1567db311',
    baseUrl: 'https://api.whitecircle.ai/v1',
  },

  // XP System (OSRS formula constants)
  xp: {
    maxLevel: 99,
    // Tier boundaries
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
// XP(L) = floor( sum_{l=1}^{L-1} floor(l + 300 * 2^(l/7)) / 4 )
const XP_TABLE = new Array(100).fill(0);
(function computeXPTable() {
  let innerSum = 0;
  for (let L = 2; L <= 99; L++) {
    const ell = L - 1;
    innerSum += Math.floor(ell + 300 * Math.pow(2, ell / 7));
    XP_TABLE[L] = Math.floor(innerSum / 4);
  }
})();

// Helper: Get tier info for a level
function getTierForLevel(level) {
  return CONFIG.xp.tiers.find(t => level >= t.start && level <= t.end) || CONFIG.xp.tiers[0];
}

// Helper: XP needed for a specific level
function xpForLevel(level) {
  return XP_TABLE[Math.min(level, 99)];
}

// Helper: XP between two levels
function xpBetweenLevels(from, to) {
  return xpForLevel(to) - xpForLevel(from);
}
