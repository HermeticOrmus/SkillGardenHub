// SkillGarden Supabase Client
// Handles all database operations: users, skills, progress, assessments

// Import Supabase via CDN (loaded in HTML)
// <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>

let supabase = null;

function initSupabase() {
  if (!CONFIG.supabase.url || !CONFIG.supabase.anonKey) {
    console.warn('[Supabase] No credentials configured. Using demo mode.');
    return null;
  }
  supabase = window.supabase.createClient(CONFIG.supabase.url, CONFIG.supabase.anonKey);
  console.log('[Supabase] Client initialized');
  return supabase;
}

// --- User Operations ---

async function getUser(userId) {
  if (!supabase) return DEMO_DATA.user;
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();
  if (error) { console.error('[Supabase] getUser:', error); return DEMO_DATA.user; }
  return data;
}

// --- Skill Operations ---

async function getUserSkills(userId) {
  if (!supabase) return DEMO_DATA.skills;
  const { data, error } = await supabase
    .from('user_skills')
    .select(`
      *,
      skill:skills(*),
      sub_nodes:user_skill_nodes(*)
    `)
    .eq('user_id', userId)
    .order('level', { ascending: false });
  if (error) { console.error('[Supabase] getUserSkills:', error); return DEMO_DATA.skills; }
  return data;
}

async function updateSkillXP(userId, skillId, xpGained) {
  if (!supabase) return;
  // Get current XP
  const { data: current } = await supabase
    .from('user_skills')
    .select('xp, level')
    .eq('user_id', userId)
    .eq('skill_id', skillId)
    .single();

  if (!current) return;

  const newXP = current.xp + xpGained;
  // Calculate new level from XP table
  let newLevel = current.level;
  while (newLevel < 99 && newXP >= XP_TABLE[newLevel + 1]) {
    newLevel++;
  }

  const { error } = await supabase
    .from('user_skills')
    .update({ xp: newXP, level: newLevel, updated_at: new Date().toISOString() })
    .eq('user_id', userId)
    .eq('skill_id', skillId);

  if (error) console.error('[Supabase] updateSkillXP:', error);
  return { xp: newXP, level: newLevel, leveledUp: newLevel > current.level };
}

// --- Assessment Operations ---

async function saveAssessment(assessment) {
  if (!supabase) return { id: 'demo-' + Date.now() };
  const { data, error } = await supabase
    .from('assessments')
    .insert(assessment)
    .select()
    .single();
  if (error) { console.error('[Supabase] saveAssessment:', error); return null; }
  return data;
}

async function getAssessmentHistory(userId, skillId) {
  if (!supabase) return DEMO_DATA.assessments;
  const { data, error } = await supabase
    .from('assessments')
    .select('*')
    .eq('user_id', userId)
    .eq('skill_id', skillId)
    .order('created_at', { ascending: false })
    .limit(20);
  if (error) { console.error('[Supabase] getAssessmentHistory:', error); return []; }
  return data;
}

// --- Claim Operations ---

async function saveClaim(claim) {
  if (!supabase) return { id: 'demo-claim-' + Date.now() };
  const { data, error } = await supabase
    .from('claims')
    .insert(claim)
    .select()
    .single();
  if (error) { console.error('[Supabase] saveClaim:', error); return null; }
  return data;
}

async function getUserClaims(userId, options = {}) {
  if (!supabase) return DEMO_DATA.claims;
  let query = supabase
    .from('claims')
    .select('*')
    .eq('user_id', userId);

  if (options.verified !== undefined) {
    query = query.eq('verified', options.verified);
  }
  if (options.skillId) {
    query = query.eq('skill_id', options.skillId);
  }

  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) { console.error('[Supabase] getUserClaims:', error); return []; }
  return data;
}

// --- Demo Data (fallback when Supabase not configured) ---

const DEMO_DATA = {
  user: {
    id: 'demo-yavuz',
    name: 'Yavuz',
    level: 76,
    tier: 'Expert',
    total_xp: 1336443,
    claims_validated: 1284,
    debates_completed: 37,
    last_assessed: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  skills: [
    {
      id: 'skill-ai-finance',
      name: 'AI Boom in Finance',
      level: 76,
      xp: 1336443,
      tier: 'Expert',
      sub_nodes: [
        { name: 'AI Market Dynamics', level: 82 },
        { name: 'Valuation Models', level: 73 },
        { name: 'Bubble vs Value Analysis', level: 70 },
        { name: 'Regulatory Risk Analysis', level: 68 },
      ],
    },
    {
      id: 'skill-ml-foundations',
      name: 'Machine Learning Foundations',
      level: 58,
      xp: 224466,
      tier: 'Adept',
      sub_nodes: [
        { name: 'Supervised Learning', level: 65 },
        { name: 'Neural Networks', level: 52 },
        { name: 'Feature Engineering', level: 48 },
      ],
    },
    {
      id: 'skill-ai-ethics',
      name: 'AI Ethics & Governance',
      level: 41,
      xp: 41171,
      tier: 'Journeyman',
      sub_nodes: [
        { name: 'Bias & Fairness', level: 47 },
        { name: 'Governance Frameworks', level: 38 },
        { name: 'Responsible AI Practices', level: 30 },
      ],
    },
    {
      id: 'skill-ai-product',
      name: 'AI Product Strategy',
      level: 33,
      xp: 18247,
      tier: 'Journeyman',
      sub_nodes: [
        { name: 'Market Sizing & TAM', level: 40 },
        { name: 'Go-to-Market Strategy', level: 28 },
        { name: 'Competitive Analysis', level: 25 },
      ],
    },
  ],
  assessments: [],
  claims: [
    { id: 'c1', text: 'NVIDIA controls 80%+ of the AI training GPU market', verified: true, sources: 4 },
    { id: 'c2', text: 'AI will add $15.7 trillion to global GDP by 2030', verified: false, sources: 1 },
    { id: 'c3', text: 'Enterprise AI adoption doubled year-over-year since 2024', verified: true, sources: 3 },
  ],
};
