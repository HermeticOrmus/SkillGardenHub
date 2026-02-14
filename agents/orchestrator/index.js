// SkillGarden Orchestrator Agent
// Deployed on Blaxel as the main frontend-facing endpoint
// Routes requests to specialized agents via blAgent() calls

// In production, uses blAgent() for inter-agent communication
// For demo/development, calls agents directly via HTTP

const HOST = process.env.HOST || '0.0.0.0';
const PORT = process.env.PORT || 3000;

// Agent endpoints (Blaxel workspace URLs when deployed)
const AGENTS = {
  assessment: process.env.ASSESSMENT_URL || 'http://localhost:3001',
  validator:  process.env.VALIDATOR_URL  || 'http://localhost:3002',
  xpEngine:   process.env.XP_ENGINE_URL  || 'http://localhost:3003',
};

import { createServer } from 'http';

const server = createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') { res.writeHead(200); res.end(); return; }

  // Health check
  if (req.method === 'GET' && req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', agents: Object.keys(AGENTS) }));
    return;
  }

  if (req.method !== 'POST') { res.writeHead(405); res.end('Method not allowed'); return; }

  let body = '';
  req.on('data', chunk => body += chunk);
  req.on('end', async () => {
    try {
      const { route, ...params } = JSON.parse(body);

      let result;
      switch (route) {
        // Assessment routes
        case 'assessment.generate':
          result = await callAgent('assessment', { action: 'generate', ...params });
          break;
        case 'assessment.evaluate':
          result = await callAgent('assessment', { action: 'evaluate', ...params });
          break;
        case 'assessment.feynman':
          result = await callAgent('assessment', { action: 'feynman', ...params });
          break;
        case 'assessment.debate':
          result = await callAgent('assessment', { action: 'debate', ...params });
          break;

        // Validation routes
        case 'validate.claim':
          result = await callAgent('validator', { action: 'validate', ...params });
          break;
        case 'validate.batch':
          result = await callAgent('validator', { action: 'validate_batch', ...params });
          break;
        case 'validate.extract':
          result = await callAgent('validator', { action: 'extract', ...params });
          break;

        // XP routes
        case 'xp.award':
          result = await callAgent('xpEngine', { action: 'award_xp', ...params });
          break;
        case 'xp.decay':
          result = await callAgent('xpEngine', { action: 'calculate_decay', ...params });
          break;
        case 'xp.info':
          result = await callAgent('xpEngine', { action: 'level_info', ...params });
          break;

        // Composite routes (orchestration across multiple agents)
        case 'ingest.panel':
          result = await ingestPanel(params);
          break;
        case 'assess.full':
          result = await fullAssessment(params);
          break;

        default:
          res.writeHead(400);
          res.end(JSON.stringify({ error: `Unknown route: ${route}` }));
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
  console.log(`[Orchestrator] Running on ${HOST}:${PORT}`);
  console.log(`[Orchestrator] Agents:`, AGENTS);
});

// --- Inter-Agent Communication ---

async function callAgent(agentName, payload) {
  const url = AGENTS[agentName];
  if (!url) throw new Error(`Unknown agent: ${agentName}`);

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Agent ${agentName} error: ${err}`);
  }

  return response.json();
}

// --- Composite Operations ---

// Full panel ingestion pipeline:
// 1. Extract claims from transcript
// 2. Validate each claim
// 3. Award XP for ingestion
async function ingestPanel(params) {
  const { transcript, source, userId, skillId, currentXP, currentLevel } = params;

  // Step 1: Extract claims
  const extracted = await callAgent('validator', {
    action: 'extract',
    transcript,
    source,
  });

  // Step 2: Validate each claim
  const validated = await callAgent('validator', {
    action: 'validate_batch',
    claims: extracted.claims,
    context: source,
  });

  // Step 3: Award XP (10 XP per verified claim)
  const verifiedCount = validated.filter(v => v.verified).length;
  const xpGained = verifiedCount * 10;

  const xpResult = await callAgent('xpEngine', {
    action: 'award_xp',
    currentXP,
    currentLevel,
    xpGained,
  });

  return {
    claims: extracted.claims.map((claim, i) => ({
      ...claim,
      validation: validated[i],
    })),
    summary: extracted.summary,
    xp: xpResult,
    stats: {
      totalClaims: extracted.total_claims,
      verified: verifiedCount,
      unverified: extracted.total_claims - verifiedCount,
    },
  };
}

// Full assessment pipeline:
// 1. Generate question
// 2. (User answers)
// 3. Validate question integrity
// 4. Evaluate response
// 5. Award XP
async function fullAssessment(params) {
  const { skillName, subTopic, skillLevel, userResponse, currentXP } = params;

  // Generate question
  const question = await callAgent('assessment', {
    action: 'generate',
    skillName,
    subTopic,
    skillLevel,
  });

  // If user already provided a response, evaluate it
  if (userResponse) {
    // Validate question integrity
    const integrity = await callAgent('validator', {
      action: 'check_assessment',
      question,
    });

    // Evaluate response
    const evaluation = await callAgent('assessment', {
      action: 'evaluate',
      question: question.question,
      response: userResponse,
      skillName,
      skillLevel,
    });

    // Award XP
    const xpResult = await callAgent('xpEngine', {
      action: 'award_xp',
      currentXP,
      currentLevel: skillLevel,
      xpGained: evaluation.xp_reward,
    });

    return { question, integrity, evaluation, xp: xpResult };
  }

  return { question };
}
