// SkillGarden Assessment Agent
// Deployed on Blaxel as serverless endpoint
// Generates Bloom's taxonomy questions and evaluates responses using Claude

import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic();

const BLOOM_LEVELS = [
  { level: 1, name: 'Remember',   verbs: 'define, list, recall, recognize' },
  { level: 2, name: 'Understand', verbs: 'explain, summarize, interpret, compare' },
  { level: 3, name: 'Apply',      verbs: 'demonstrate, solve, use, implement' },
  { level: 4, name: 'Analyze',    verbs: 'differentiate, examine, deconstruct, contrast' },
  { level: 5, name: 'Evaluate',   verbs: 'judge, critique, defend, justify' },
  { level: 6, name: 'Create',     verbs: 'design, construct, develop, formulate' },
];

function bloomLevelForSkillLevel(skillLevel) {
  if (skillLevel <= 15) return 1;
  if (skillLevel <= 30) return 2;
  if (skillLevel <= 50) return 3;
  if (skillLevel <= 70) return 4;
  if (skillLevel <= 85) return 5;
  return 6;
}

// HTTP server entrypoint
const HOST = process.env.HOST || '0.0.0.0';
const PORT = process.env.PORT || 3000;

import { createServer } from 'http';

const server = createServer(async (req, res) => {
  // CORS
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
        case 'generate':
          result = await generateQuestion(params.skillName, params.subTopic, params.skillLevel);
          break;
        case 'evaluate':
          result = await evaluateResponse(params.question, params.response, params.skillName, params.skillLevel);
          break;
        case 'feynman':
          result = await generateFeynmanPrompt(params.skillName, params.subTopic, params.skillLevel);
          break;
        case 'debate':
          result = await generateDebateChallenge(params.skillName, params.topic, params.position, params.skillLevel);
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
  console.log(`[Assessment Agent] Running on ${HOST}:${PORT}`);
});

// --- Agent Logic ---

async function generateQuestion(skillName, subTopic, skillLevel) {
  const bloomLevel = bloomLevelForSkillLevel(skillLevel);
  const bloom = BLOOM_LEVELS[bloomLevel - 1];

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 1024,
    messages: [{
      role: 'user',
      content: `Generate a single assessment question for:
- Skill: ${skillName}, Sub-topic: ${subTopic}, Level: ${skillLevel}
- Bloom's L${bloom.level} (${bloom.name}): ${bloom.verbs}

For L1-L3: multiple-choice (4 options). For L4-L6: open-ended.

JSON response only:
{"question":"...","bloom_level":${bloom.level},"bloom_name":"${bloom.name}","type":"multiple_choice"|"open_response","options":["A","B","C","D"]|null,"correct_index":0-3|null,"rubric":"...","xp_reward":25-200}`
    }]
  });

  return JSON.parse(message.content[0].text);
}

async function evaluateResponse(question, userResponse, skillName, skillLevel) {
  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 1024,
    messages: [{
      role: 'user',
      content: `Evaluate this assessment response:
Question: ${question}
Skill: ${skillName} (Level ${skillLevel})
Response: ${userResponse}

Score: accuracy, completeness, depth, clarity (0-100 each). Be diagnostic.

JSON only:
{"scores":{"accuracy":N,"completeness":N,"depth":N,"clarity":N},"overall":N,"correct_points":["..."],"gaps":["..."],"feedback":"...","xp_reward":N}`
    }]
  });

  return JSON.parse(message.content[0].text);
}

async function generateFeynmanPrompt(skillName, subTopic, skillLevel) {
  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 512,
    messages: [{
      role: 'user',
      content: `Feynman prompt for voice assessment:
Skill: ${skillName}, Topic: ${subTopic}, Level: ${skillLevel}
Ask user to explain to a specific persona. JSON:
{"prompt":"...","listener_persona":"...","expected_topics":["..."],"time_target_seconds":N}`
    }]
  });

  return JSON.parse(message.content[0].text);
}

async function generateDebateChallenge(skillName, topic, position, skillLevel) {
  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 1024,
    messages: [{
      role: 'user',
      content: `Steelman debate challenge:
Skill: ${skillName}, Topic: ${topic}, User position: ${position}, Level: ${skillLevel}
User must argue AGAINST their position. JSON:
{"challenge":"...","position_to_argue":"...","key_arguments_expected":["..."],"counter_challenges":["..."]}`
    }]
  });

  return JSON.parse(message.content[0].text);
}
