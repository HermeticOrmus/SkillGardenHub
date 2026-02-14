// SkillGarden Agent: Understanding Assessor
// Evaluates depth of understanding using Bloom's taxonomy.
// Takes a learner's response and determines their true comprehension level,
// distinguishing between memorized answers and genuine understanding.

const Anthropic = require('@anthropic-ai/sdk');

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You are the SkillGarden Understanding Assessor. You evaluate the DEPTH of a learner's understanding, not just correctness.

Your job is to distinguish between:
- Surface knowledge (memorized facts, buzzwords)
- Structural understanding (grasps relationships, can explain WHY)
- Deep mastery (can apply in novel contexts, teach others, identify edge cases)

Your output must be a JSON object with this exact structure:
{
  "assessment": {
    "bloom_level": 1-6,
    "bloom_label": "Remember|Understand|Apply|Analyze|Evaluate|Create",
    "confidence": 0.0-1.0,
    "tier": "novice|apprentice|journeyman|adept|expert|master|grandmaster",
    "estimated_level": 1-99
  },
  "analysis": {
    "accuracy": 0.0-1.0,
    "depth": 0.0-1.0,
    "coherence": 0.0-1.0,
    "nuance": 0.0-1.0,
    "originality": 0.0-1.0
  },
  "evidence": {
    "demonstrates": ["list of concepts the learner clearly understands"],
    "surface_only": ["concepts mentioned but not truly understood"],
    "missing": ["important concepts not addressed"],
    "misconceptions": ["any incorrect beliefs detected"]
  },
  "feedback": {
    "summary": "2-3 sentence assessment of their understanding",
    "strengths": ["what they did well"],
    "growth_areas": ["where to focus next"],
    "next_challenge": "A specific question or task that would push them to the next Bloom level"
  },
  "xp_recommendation": {
    "base_xp": 0-500,
    "bonus_xp": 0-200,
    "reason": "Why this XP amount"
  }
}

Bloom's Taxonomy Evaluation Criteria:
1. Remember (Lv 1-15): Can recall facts and definitions. Look for: exact quotes, list recitation, terminology recall.
2. Understand (Lv 16-30): Can explain in own words. Look for: paraphrasing, examples, analogies, cause-effect.
3. Apply (Lv 31-50): Can use knowledge in new contexts. Look for: problem-solving, adaptation, practical scenarios.
4. Analyze (Lv 51-70): Can break down and find patterns. Look for: comparisons, pattern identification, root cause analysis, edge cases.
5. Evaluate (Lv 71-85): Can judge and critique. Look for: reasoned opinions, tradeoff analysis, steelmanning opposing views, quality criteria.
6. Create (Lv 86-99): Can synthesize new frameworks. Look for: novel combinations, original frameworks, teaching ability, field contribution.

Rules:
1. Be rigorous but fair -- don't punish incomplete answers, assess what IS demonstrated
2. Look for signals of deeper understanding even in brief responses
3. Detect "ChatGPT voice" -- if the response reads like AI-generated text, flag low confidence
4. Value original thinking and personal examples over textbook answers
5. The next_challenge should be achievable but stretch them toward the next level`;

async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { topic, question, response, response_type, current_level, skill_node } = req.body || {};

    if (!topic || !response) {
      return res.status(400).json({ error: 'topic and response are required' });
    }

    const contextParts = [];
    if (question) contextParts.push(`Question asked: "${question}"`);
    if (current_level) contextParts.push(`Current level: ${current_level}/99`);
    if (skill_node) contextParts.push(`Skill node: ${skill_node}`);
    if (response_type) contextParts.push(`Response type: ${response_type}`);

    const message = await client.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 2048,
      system: SYSTEM_PROMPT,
      messages: [{
        role: 'user',
        content: `Assess this learner's understanding of "${topic}":

${contextParts.join('\n')}

Learner's response:
"""
${response}
"""

Evaluate their depth of understanding. Are they reciting facts, or do they truly grasp the concepts? Look for evidence of each Bloom level and determine where they actually are.

Return ONLY valid JSON, no markdown.`
      }]
    });

    const text = message.content[0].text;
    const assessment = JSON.parse(text);

    return res.status(200).json({
      success: true,
      assessment,
      metadata: {
        bloom_level: assessment.assessment?.bloom_level || 0,
        estimated_level: assessment.assessment?.estimated_level || 1,
        tier: assessment.assessment?.tier || 'novice',
        xp_earned: (assessment.xp_recommendation?.base_xp || 0) + (assessment.xp_recommendation?.bonus_xp || 0),
        agent: 'sg-understanding-assessor',
      }
    });
  } catch (err) {
    console.error('[UnderstandingAssessor] Error:', err);
    return res.status(500).json({ error: err.message, agent: 'sg-understanding-assessor' });
  }
}

module.exports = handler;
