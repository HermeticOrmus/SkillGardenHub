// SkillGarden Agent: Pre-Test Creator
// Creates diagnostic pre-assessment tests for new learners entering a skill domain.
// Determines starting level (1-99) and identifies existing knowledge clusters.

const Anthropic = require('@anthropic-ai/sdk');

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You are the SkillGarden Pre-Test Architect. You create diagnostic assessments that accurately determine a learner's starting level within a skill domain.

Your output must be a JSON object with this exact structure:
{
  "topic": "The skill being assessed",
  "questions": [
    {
      "id": "q1",
      "text": "The question text",
      "tier": "novice|apprentice|journeyman|adept|expert|master|grandmaster",
      "bloom_level": 1-6,
      "cluster": "which knowledge cluster this tests",
      "type": "multiple_choice|true_false|short_answer|scenario",
      "options": ["A) ...", "B) ...", "C) ...", "D) ..."],
      "correct": "A",
      "explanation": "Why this answer is correct",
      "misconception": "Common wrong answer and why people choose it"
    }
  ],
  "scoring": {
    "novice": { "min_correct": 0, "max_correct": 2, "level_range": [1, 15] },
    "apprentice": { "min_correct": 3, "max_correct": 5, "level_range": [16, 30] },
    "journeyman": { "min_correct": 6, "max_correct": 8, "level_range": [31, 50] },
    "adept": { "min_correct": 9, "max_correct": 11, "level_range": [51, 70] },
    "expert": { "min_correct": 12, "max_correct": 14, "level_range": [71, 85] },
    "master": { "min_correct": 15, "max_correct": 16, "level_range": [86, 92] },
    "grandmaster": { "min_correct": 17, "max_correct": 18, "level_range": [93, 99] }
  },
  "clusters_tested": ["list of knowledge clusters covered"]
}

Rules:
1. Generate exactly 18 questions (3 per tier, except grandmaster gets 2)
2. Questions must progressively increase in difficulty following Bloom's taxonomy:
   - Novice (Bloom 1): Remember -- recall facts, definitions
   - Apprentice (Bloom 2): Understand -- explain concepts, compare
   - Journeyman (Bloom 3): Apply -- use knowledge in new situations
   - Adept (Bloom 4): Analyze -- break down, identify patterns
   - Expert (Bloom 5): Evaluate -- judge, critique, defend positions
   - Master (Bloom 6): Create -- synthesize, design frameworks
   - Grandmaster (Bloom 6): Create -- original contribution level
3. Each question must map to a specific knowledge cluster from the skill tree
4. Include common misconceptions to identify knowledge gaps
5. Multiple choice questions should have plausible distractors
6. Short answer questions should have clear rubric criteria
7. Scenario questions should test real-world application
8. The test should feel challenging but fair at every tier`;

async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { topic, skill_tree, focus_clusters } = req.body || {};

    if (!topic) {
      return res.status(400).json({ error: 'topic is required' });
    }

    const treeContext = skill_tree
      ? `\n\nExisting skill tree structure:\n${JSON.stringify(skill_tree, null, 2)}`
      : '';

    const focusContext = focus_clusters
      ? `\nFocus on these clusters: ${focus_clusters.join(', ')}`
      : '';

    const message = await client.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [{
        role: 'user',
        content: `Create a diagnostic pre-test for: "${topic}"${treeContext}${focusContext}

The test should:
- Accurately place a learner at their correct level (1-99)
- Identify which knowledge clusters they're strongest/weakest in
- Take approximately 10-15 minutes to complete
- Feel engaging, not like a boring exam

Return ONLY valid JSON, no markdown.`
      }]
    });

    const text = message.content[0].text;
    const preTest = JSON.parse(text);

    return res.status(200).json({
      success: true,
      pre_test: preTest,
      metadata: {
        question_count: preTest.questions?.length || 0,
        clusters_tested: preTest.clusters_tested?.length || 0,
        tiers_covered: [...new Set(preTest.questions?.map(q => q.tier) || [])].length,
        agent: 'sg-pre-test-creator',
      }
    });
  } catch (err) {
    console.error('[PreTestCreator] Error:', err);
    return res.status(500).json({ error: err.message, agent: 'sg-pre-test-creator' });
  }
}

module.exports = handler;
