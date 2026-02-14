// SkillGarden Claude Assessment Engine
// Uses Anthropic Claude API to generate and evaluate assessments
// Bloom's taxonomy-aware: Remember -> Understand -> Apply -> Analyze -> Evaluate -> Create

const BLOOM_LEVELS = [
  { level: 1, name: 'Remember',    verbs: 'define, list, recall, recognize' },
  { level: 2, name: 'Understand',  verbs: 'explain, summarize, interpret, compare' },
  { level: 3, name: 'Apply',       verbs: 'demonstrate, solve, use, implement' },
  { level: 4, name: 'Analyze',     verbs: 'differentiate, examine, deconstruct, contrast' },
  { level: 5, name: 'Evaluate',    verbs: 'judge, critique, defend, justify' },
  { level: 6, name: 'Create',      verbs: 'design, construct, develop, formulate' },
];

// Map skill level to appropriate Bloom's level
function bloomLevelForSkillLevel(skillLevel) {
  if (skillLevel <= 15) return 1;      // Novice: Remember
  if (skillLevel <= 30) return 2;      // Apprentice: Understand
  if (skillLevel <= 50) return 3;      // Journeyman: Apply
  if (skillLevel <= 70) return 4;      // Adept: Analyze
  if (skillLevel <= 85) return 5;      // Expert: Evaluate
  return 6;                             // Master+: Create
}

// Generate a quiz question using Claude
async function generateQuestion(skillName, subTopic, skillLevel) {
  const bloomLevel = bloomLevelForSkillLevel(skillLevel);
  const bloom = BLOOM_LEVELS[bloomLevel - 1];
  const tier = getTierForLevel(skillLevel);

  const prompt = `You are an assessment engine for SkillGarden, an educational mastery platform.

Generate a single assessment question for:
- Skill: ${skillName}
- Sub-topic: ${subTopic}
- User level: ${skillLevel} (${tier.name} tier)
- Bloom's taxonomy level: L${bloom.level} (${bloom.name}) - verbs: ${bloom.verbs}

Rules:
- Question must test at the specified Bloom's level, not lower
- For L1-L3: Generate a multiple-choice question with exactly 4 options, one correct
- For L4-L6: Generate an open-ended question requiring a written response
- Include a brief explanation of why this question tests at this Bloom's level
- Include the correct answer or evaluation rubric

Respond in JSON format:
{
  "question": "...",
  "bloom_level": ${bloom.level},
  "bloom_name": "${bloom.name}",
  "type": "multiple_choice" | "open_response",
  "options": ["A", "B", "C", "D"] | null,
  "correct_index": 0-3 | null,
  "rubric": "...",
  "explanation": "Why this tests at ${bloom.name} level",
  "xp_reward": number (25-200 based on difficulty)
}`;

  try {
    const response = await callClaude(prompt);
    return JSON.parse(response);
  } catch (err) {
    console.error('[Claude] generateQuestion error:', err);
    return generateFallbackQuestion(skillName, subTopic, bloomLevel);
  }
}

// Evaluate an open-ended response using Claude
async function evaluateResponse(question, userResponse, skillName, skillLevel) {
  const prompt = `You are an assessment evaluator for SkillGarden.

Evaluate this response:

Question: ${question}
Skill: ${skillName} (Level ${skillLevel})
User's Response: ${userResponse}

Score on these dimensions (0-100 each):
1. Accuracy - Are the facts correct?
2. Completeness - Did they address all aspects?
3. Depth - How deeply did they analyze?
4. Clarity - How well-structured is the response?

Rules:
- Be diagnostic, not praising. Identify specific gaps.
- Reference specific claims that are correct or incorrect.
- Suggest exactly which skill tree node to review for gaps.
- Calculate XP reward: base 50, +25 per dimension scoring >80

Respond in JSON format:
{
  "scores": { "accuracy": N, "completeness": N, "depth": N, "clarity": N },
  "overall": N,
  "correct_points": ["...", "..."],
  "gaps": ["...", "..."],
  "review_nodes": ["...", "..."],
  "feedback": "Diagnostic feedback paragraph",
  "xp_reward": N
}`;

  try {
    const response = await callClaude(prompt);
    return JSON.parse(response);
  } catch (err) {
    console.error('[Claude] evaluateResponse error:', err);
    return { scores: { accuracy: 0, completeness: 0, depth: 0, clarity: 0 }, overall: 0, feedback: 'Evaluation unavailable', xp_reward: 0 };
  }
}

// Generate a Feynman voice prompt (for voice assessment tab)
async function generateFeynmanPrompt(skillName, subTopic, skillLevel) {
  const prompt = `Generate a Feynman technique prompt for voice assessment.

Skill: ${skillName}
Sub-topic: ${subTopic}
Level: ${skillLevel}

The Feynman technique: "If you can't explain it simply, you don't understand it."

Create a prompt that asks the user to explain ${subTopic} to someone with no background.
Include a specific persona for the listener (e.g., "a retail investor", "a college freshman").
The explanation should take 1-3 minutes.

Respond in JSON:
{
  "prompt": "Explain...",
  "listener_persona": "...",
  "expected_topics": ["...", "..."],
  "time_target_seconds": N
}`;

  try {
    const response = await callClaude(prompt);
    return JSON.parse(response);
  } catch (err) {
    console.error('[Claude] generateFeynmanPrompt error:', err);
    return {
      prompt: `Explain ${subTopic} in ${skillName} as if I know nothing about it.`,
      listener_persona: 'a curious beginner',
      expected_topics: [subTopic],
      time_target_seconds: 120,
    };
  }
}

// Generate debate challenge
async function generateDebateChallenge(skillName, topic, userPosition, skillLevel) {
  const prompt = `Generate a Socratic debate challenge for SkillGarden.

Skill: ${skillName}
Debate topic: ${topic}
User's known position: ${userPosition}
Level: ${skillLevel}

Create a steelman challenge - the user must argue AGAINST their known position.
This tests true understanding: can they make the strongest possible case for the other side?

Respond in JSON:
{
  "challenge": "Make the strongest case that...",
  "position_to_argue": "...",
  "key_arguments_expected": ["...", "..."],
  "counter_challenges": ["If that's true, then why...", "..."],
  "synthesis_question": "Now reconcile both positions..."
}`;

  try {
    const response = await callClaude(prompt);
    return JSON.parse(response);
  } catch (err) {
    console.error('[Claude] generateDebateChallenge error:', err);
    return null;
  }
}

// --- Core API Call ---

async function callClaude(userMessage) {
  if (!CONFIG.anthropic.apiKey) {
    console.warn('[Claude] No API key configured. Using demo mode.');
    throw new Error('No API key');
  }

  const response = await fetch(`${CONFIG.anthropic.baseUrl}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': CONFIG.anthropic.apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: CONFIG.anthropic.model,
      max_tokens: 2048,
      messages: [{ role: 'user', content: userMessage }],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Claude API error ${response.status}: ${err}`);
  }

  const data = await response.json();
  return data.content[0].text;
}

// --- Fallback Questions (when API unavailable) ---

function generateFallbackQuestion(skillName, subTopic, bloomLevel) {
  const fallbacks = {
    'AI Boom in Finance': [
      {
        question: 'What distinguishes a high-risk AI system under the EU AI Act?',
        type: 'multiple_choice',
        bloom_level: 1,
        bloom_name: 'Remember',
        options: [
          'It uses more than 1B parameters',
          'It poses significant risk to health, safety, or fundamental rights',
          'It processes financial data',
          'It operates without human oversight',
        ],
        correct_index: 1,
        rubric: 'The EU AI Act classifies risk by impact on people, not by model size.',
        explanation: 'Tests recall of key regulatory framework definitions.',
        xp_reward: 25,
      },
      {
        question: 'Compare the current AI investment boom to the dot-com bubble of 1999-2000. What structural similarities and differences determine whether AI valuations are justified?',
        type: 'open_response',
        bloom_level: 5,
        bloom_name: 'Evaluate',
        options: null,
        correct_index: null,
        rubric: 'Score on: revenue fundamentals, market concentration, adoption curves, historical pattern analysis.',
        explanation: 'Tests ability to evaluate competing frameworks and form justified conclusions.',
        xp_reward: 150,
      },
    ],
  };

  const skillQuestions = fallbacks[skillName] || fallbacks['AI Boom in Finance'];
  const appropriate = skillQuestions.filter(q => q.bloom_level <= bloomLevel);
  return appropriate[appropriate.length - 1] || skillQuestions[0];
}
