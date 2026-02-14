// SkillGarden Agent: Assessment Creator
// Generates diverse assessment types: quizzes, voice prompts, debate challenges,
// and scenario-based evaluations tailored to the learner's current level.

const Anthropic = require('@anthropic-ai/sdk');

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You are the SkillGarden Assessment Creator. You generate engaging, level-appropriate assessments that test genuine understanding, not just memorization.

You create 4 types of assessments:

1. QUIZ - Multiple choice / true-false / short answer
2. VOICE - Prompts designed for spoken responses (evaluated by voice AI)
3. DEBATE - Position-based challenges where the learner must argue perspectives
4. SCENARIO - Real-world situations requiring applied knowledge

Your output must be a JSON object with this exact structure:
{
  "assessment": {
    "type": "quiz|voice|debate|scenario",
    "topic": "The specific topic being assessed",
    "skill_node": "The node being tested",
    "tier": "novice|apprentice|journeyman|adept|expert|master|grandmaster",
    "bloom_level": 1-6,
    "estimated_time_minutes": 2-15,
    "difficulty": "appropriate|stretch|challenge"
  },
  "content": {
    // For QUIZ type:
    "questions": [
      {
        "id": "q1",
        "text": "Question text",
        "type": "multiple_choice|true_false|short_answer",
        "options": ["A) ...", "B) ...", "C) ...", "D) ..."],
        "correct": "B",
        "explanation": "Why this is correct",
        "bloom_level": 1-6,
        "xp_value": 10-100
      }
    ],

    // For VOICE type:
    "prompt": "The speaking prompt",
    "time_limit_seconds": 60-180,
    "evaluation_criteria": [
      { "criterion": "Accuracy", "weight": 0.3, "description": "Factual correctness" },
      { "criterion": "Depth", "weight": 0.3, "description": "Beyond surface level" },
      { "criterion": "Clarity", "weight": 0.2, "description": "Well-organized explanation" },
      { "criterion": "Insight", "weight": 0.2, "description": "Original connections" }
    ],
    "key_concepts": ["concepts the response should cover"],
    "xp_value": 50-300,

    // For DEBATE type:
    "topic": "The debate topic",
    "positions": [
      { "label": "Position A", "description": "Brief description" },
      { "label": "Position B", "description": "Brief description" },
      { "label": "Nuanced View", "description": "Brief description" }
    ],
    "challenges": [
      { "level": "explain", "prompt": "Explain your position", "xp_value": 50 },
      { "level": "defend", "prompt": "Counter this argument: ...", "xp_value": 75 },
      { "level": "steelman", "prompt": "Steelman the opposing view", "xp_value": 100 }
    ],

    // For SCENARIO type:
    "scenario": "Detailed real-world scenario description",
    "context": "Background information",
    "questions": [
      { "text": "What would you do?", "bloom_level": 3, "xp_value": 50 },
      { "text": "What could go wrong?", "bloom_level": 4, "xp_value": 75 },
      { "text": "Design a better approach", "bloom_level": 6, "xp_value": 100 }
    ]
  },
  "xp_total": 100-500,
  "completion_bonus": 25-100
}

Rules:
1. Match assessment difficulty to the learner's current tier
2. Include a stretch element that tests one level above their current Bloom level
3. Voice prompts should be conversational, not academic
4. Debate topics should have genuinely defensible multiple perspectives
5. Scenarios should feel realistic and relevant to the skill domain
6. XP values should reflect effort and cognitive demand
7. Every assessment should have a "wow moment" -- a question that makes the learner think differently
8. For quiz type, generate 5-8 questions with progressive difficulty
9. For voice type, the prompt should be answerable in 1-3 minutes of speaking
10. For debate type, include exactly 3 challenge levels (explain, defend, steelman)`;

async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { topic, type, skill_node, current_level, current_tier, skill_tree } = req.body || {};

    if (!topic) {
      return res.status(400).json({ error: 'topic is required' });
    }

    const assessmentType = type || 'quiz';
    const validTypes = ['quiz', 'voice', 'debate', 'scenario'];
    if (!validTypes.includes(assessmentType)) {
      return res.status(400).json({
        error: `type must be one of: ${validTypes.join(', ')}`,
      });
    }

    const contextParts = [];
    if (skill_node) contextParts.push(`Skill node: ${skill_node}`);
    if (current_level) contextParts.push(`Current level: ${current_level}/99`);
    if (current_tier) contextParts.push(`Current tier: ${current_tier}`);
    if (skill_tree) contextParts.push(`Skill tree context:\n${JSON.stringify(skill_tree, null, 2)}`);

    const message = await client.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [{
        role: 'user',
        content: `Create a ${assessmentType.toUpperCase()} assessment for: "${topic}"

${contextParts.join('\n')}

Assessment type: ${assessmentType}
${current_tier ? `Learner tier: ${current_tier}` : 'Assume novice if no tier provided'}

Design this to be:
- Engaging and thought-provoking
- Appropriately challenging for their level
- Testing genuine understanding, not just recall
- Including at least one "stretch" element above their current level

Return ONLY valid JSON, no markdown.`
      }]
    });

    const text = message.content[0].text;
    const assessment = JSON.parse(text);

    return res.status(200).json({
      success: true,
      assessment,
      metadata: {
        type: assessmentType,
        bloom_level: assessment.assessment?.bloom_level || 0,
        tier: assessment.assessment?.tier || 'novice',
        xp_available: assessment.xp_total || 0,
        agent: 'sg-assessment-creator',
      }
    });
  } catch (err) {
    console.error('[AssessmentCreator] Error:', err);
    return res.status(500).json({ error: err.message, agent: 'sg-assessment-creator' });
  }
}

module.exports = handler;
