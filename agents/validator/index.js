// SkillGarden Claim Validator Agent
// Deployed on Blaxel as serverless endpoint
// Validates claims via White Circle AI + Claude fallback

import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic();
const WHITE_CIRCLE_KEY = process.env.WHITE_CIRCLE_API_KEY;
const WHITE_CIRCLE_URL = process.env.WHITE_CIRCLE_URL || '';

const HOST = process.env.HOST || '0.0.0.0';
const PORT = process.env.PORT || 3000;

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
        case 'validate':
          result = await validateClaim(params.claim, params.context);
          break;
        case 'validate_batch':
          result = await validateBatch(params.claims, params.context);
          break;
        case 'extract':
          result = await extractClaims(params.transcript, params.source);
          break;
        case 'check_assessment':
          result = await checkAssessmentIntegrity(params.question);
          break;
        case 'extract_concepts':
          result = await extractConcepts(params.articleText, params.skillName);
          break;
        case 'build_tree':
          result = buildSkillTree(params.concepts);
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
  console.log(`[Validator Agent] Running on ${HOST}:${PORT}`);
});

// --- Helpers ---

// Strip markdown code fences that Claude sometimes wraps around JSON
function parseJSON(text) {
  const stripped = text.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/i, '').trim();
  return JSON.parse(stripped);
}

// --- Validation Logic ---

async function validateClaim(claimText, context = '') {
  // Try White Circle first
  if (WHITE_CIRCLE_KEY && WHITE_CIRCLE_URL) {
    try {
      const wcResult = await fetch(`${WHITE_CIRCLE_URL}/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${WHITE_CIRCLE_KEY}`,
        },
        body: JSON.stringify({ claim: claimText, context }),
      });
      if (wcResult.ok) {
        const data = await wcResult.json();
        return { ...data, provider: 'white_circle' };
      }
    } catch (e) {
      console.log('[Validator] White Circle unavailable, using Claude fallback');
    }
  }

  // Claude fallback
  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 512,
    messages: [{
      role: 'user',
      content: `Fact-check this claim rigorously:
"${claimText}"
${context ? `Context: ${context}` : ''}

JSON only:
{"status":"verified"|"unverified"|"disputed"|"false","confidence":0.0-1.0,"evidence":"...","nuance":"..."|null}`
    }]
  });

  const data = parseJSON(message.content[0].text);
  return {
    verified: data.status === 'verified',
    ...data,
    provider: 'claude_fallback',
  };
}

async function validateBatch(claims, context = '') {
  return Promise.all(claims.map(c => validateClaim(c.text || c, context)));
}

async function extractClaims(transcript, source = '') {
  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 1024,
    messages: [{
      role: 'user',
      content: `Extract verifiable factual claims from:
"${transcript}"
Source: ${source || 'Unknown'}

JSON only:
{"claims":[{"text":"...","category":"statistic|historical|company|market|regulatory"}],"total_claims":N,"summary":"..."}`
    }]
  });

  return parseJSON(message.content[0].text);
}

async function checkAssessmentIntegrity(question) {
  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 512,
    messages: [{
      role: 'user',
      content: `Validate this quiz question for accuracy and fairness:
${JSON.stringify(question)}

JSON only:
{"valid":true|false,"issues":["..."],"corrected_answer_index":N|null}`
    }]
  });

  return parseJSON(message.content[0].text);
}

// --- Skill Tree Extraction ---

// Difficulty tier mapping: 1=Novice, 2=Apprentice, 3=Journeyman, 4=Adept, 5=Expert
const DIFFICULTY_TIERS = {
  1: 'Novice',
  2: 'Apprentice',
  3: 'Journeyman',
  4: 'Adept',
  5: 'Expert',
};

async function extractConcepts(articleText, skillName = '') {
  const skillContext = skillName ? ` for the skill "${skillName}"` : '';
  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 2048,
    messages: [{
      role: 'user',
      content: `Extract 10-25 key concepts from this article${skillContext} to form a skill tree.

Article:
"""
${articleText}
"""

For each concept provide:
- name: short concept name (2-5 words)
- description: 1-2 sentence explanation of what this concept is
- difficulty: integer 1-5 (1=foundational/Novice, 5=advanced/Expert)
- prerequisites: array of other concept names from your list that must be understood first (empty array for root concepts)
- category: a short grouping label shared by related concepts

Rules:
- Order from foundational to advanced
- prerequisites must reference exact name values of other concepts in your list
- Root concepts (no prerequisites) should have difficulty 1 or 2
- Ensure no circular dependencies

JSON only — an array of concept objects:
[{"name":"...","description":"...","difficulty":1,"prerequisites":[],"category":"..."}]`
    }]
  });

  const concepts = parseJSON(message.content[0].text);
  return { concepts, skillName: skillName || null, total: concepts.length };
}

// Builds a structured skill tree from an extracted concepts array.
// Assigns unique IDs, resolves parent/child relationships, and annotates tiers.
function buildSkillTree(concepts) {
  if (!Array.isArray(concepts) || concepts.length === 0) {
    return { nodes: [], roots: [], totalNodes: 0 };
  }

  // Build a lookup map from concept name to a stable index-based ID
  const nameToId = new Map();
  concepts.forEach((concept, index) => {
    const id = `node_${index + 1}`;
    nameToId.set(concept.name, id);
  });

  // Build node objects with resolved IDs and tier labels
  const nodes = concepts.map((concept, index) => {
    const id = `node_${index + 1}`;
    const difficulty = Math.min(5, Math.max(1, Math.round(concept.difficulty)));
    const tier = DIFFICULTY_TIERS[difficulty];

    // Resolve prerequisite names to IDs, silently skip any unresolved references
    const prerequisiteIds = (concept.prerequisites || [])
      .map(prereqName => nameToId.get(prereqName))
      .filter(Boolean);

    return {
      id,
      name: concept.name,
      description: concept.description,
      difficulty,
      tier,
      category: concept.category || 'General',
      prerequisites: prerequisiteIds,
      children: [], // populated in the next pass
    };
  });

  // Build an ID-indexed lookup for the child-population pass
  const nodeById = new Map(nodes.map(n => [n.id, n]));

  // Populate children arrays by inverting the prerequisites relationships
  nodes.forEach(node => {
    node.prerequisites.forEach(prereqId => {
      const parent = nodeById.get(prereqId);
      if (parent && !parent.children.includes(node.id)) {
        parent.children.push(node.id);
      }
    });
  });

  // Identify root nodes (no prerequisites)
  const roots = nodes.filter(n => n.prerequisites.length === 0).map(n => n.id);

  return {
    nodes,
    roots,
    totalNodes: nodes.length,
    tiers: Object.entries(DIFFICULTY_TIERS).map(([level, name]) => ({
      level: parseInt(level, 10),
      name,
      nodeIds: nodes.filter(n => n.difficulty === parseInt(level, 10)).map(n => n.id),
    })),
  };
}
