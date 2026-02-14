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

  const data = JSON.parse(message.content[0].text);
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

  return JSON.parse(message.content[0].text);
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

  return JSON.parse(message.content[0].text);
}
