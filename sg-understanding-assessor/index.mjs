import '@blaxel/telemetry';
import Fastify from "fastify";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You are the SkillGarden Understanding Assessor. You evaluate the DEPTH of a learner's understanding, not just correctness.

Your job is to distinguish between:
- Surface knowledge (memorized facts, buzzwords)
- Structural understanding (grasps relationships, can explain WHY)
- Deep mastery (can apply in novel contexts, teach others, identify edge cases)

Your output must be a JSON object with this exact structure:
{
  "assessment": {
    "bloom_level": 1,
    "bloom_label": "Remember|Understand|Apply|Analyze|Evaluate|Create",
    "confidence": 0.0,
    "tier": "novice|apprentice|journeyman|adept|expert|master|grandmaster",
    "estimated_level": 1
  },
  "analysis": {
    "accuracy": 0.0,
    "depth": 0.0,
    "coherence": 0.0,
    "nuance": 0.0,
    "originality": 0.0
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
    "next_challenge": "A question that would push them to the next Bloom level"
  },
  "xp_recommendation": {
    "base_xp": 0,
    "bonus_xp": 0,
    "reason": "Why this XP amount"
  }
}

Bloom's Taxonomy Evaluation Criteria:
1. Remember (Lv 1-15): Can recall facts and definitions.
2. Understand (Lv 16-30): Can explain in own words, give examples.
3. Apply (Lv 31-50): Can use knowledge in new contexts.
4. Analyze (Lv 51-70): Can break down and find patterns.
5. Evaluate (Lv 71-85): Can judge, critique, steelman opposing views.
6. Create (Lv 86-99): Can synthesize new frameworks, teach, contribute.

Rules:
1. Be rigorous but fair
2. Look for signals of deeper understanding even in brief responses
3. Detect "ChatGPT voice" -- if the response reads like AI-generated text, flag low confidence
4. Value original thinking and personal examples over textbook answers
5. The next_challenge should stretch them toward the next level`;

async function main() {
  console.info("Booting sg-understanding-assessor...");
  const app = Fastify();

  app.addHook("onResponse", async (request, reply) => {
    console.info(`${request.method} ${request.url} ${reply.statusCode} ${Math.round(reply.elapsedTime)}ms`);
  });

  app.addHook("onError", async (_request, _reply, error) => {
    console.error("[UnderstandingAssessor] Error:", error);
  });

  app.post("/", async (request, reply) => {
    const { topic, question, response, response_type, current_level, skill_node, inputs } = request.body || {};
    const actualTopic = topic || inputs;
    const actualResponse = response || inputs;

    if (!actualTopic || !actualResponse) {
      return reply.status(400).send({ error: "topic and response are required" });
    }

    const contextParts = [];
    if (question) contextParts.push(`Question asked: "${question}"`);
    if (current_level) contextParts.push(`Current level: ${current_level}/99`);
    if (skill_node) contextParts.push(`Skill node: ${skill_node}`);
    if (response_type) contextParts.push(`Response type: ${response_type}`);

    const message = await client.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 2048,
      system: SYSTEM_PROMPT,
      messages: [{
        role: "user",
        content: `Assess this learner's understanding of "${actualTopic}":

${contextParts.join("\n")}

Learner's response:
"""
${actualResponse}
"""

Evaluate their depth of understanding. Are they reciting facts, or do they truly grasp the concepts?

Return ONLY valid JSON, no markdown.`
      }]
    });

    const raw = message.content[0].type === "text" ? message.content[0].text : "";
    const text = raw.replace(/^```(?:json)?\s*\n?/i, "").replace(/\n?```\s*$/i, "").trim();
    const assessment = JSON.parse(text);

    return reply.send({
      success: true,
      assessment,
      metadata: {
        bloom_level: assessment.assessment?.bloom_level || 0,
        estimated_level: assessment.assessment?.estimated_level || 1,
        tier: assessment.assessment?.tier || "novice",
        xp_earned: (assessment.xp_recommendation?.base_xp || 0) + (assessment.xp_recommendation?.bonus_xp || 0),
        agent: "sg-understanding-assessor",
      }
    });
  });

  const port = parseInt(process.env.PORT || "80");
  const host = process.env.HOST || "0.0.0.0";
  await app.listen({ port, host });
  console.info(`sg-understanding-assessor running on ${host}:${port}`);
}

main().catch(console.error);
