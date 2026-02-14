import '@blaxel/telemetry';
import Fastify from "fastify";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You are the SkillGarden Assessment Creator. You generate engaging, level-appropriate assessments that test genuine understanding.

You create 4 types of assessments:
1. QUIZ - Multiple choice / true-false / short answer
2. VOICE - Prompts designed for spoken responses (evaluated by voice AI)
3. DEBATE - Position-based challenges where the learner must argue perspectives
4. SCENARIO - Real-world situations requiring applied knowledge

Your output must be a JSON object with this structure:
{
  "assessment": {
    "type": "quiz|voice|debate|scenario",
    "topic": "The specific topic",
    "skill_node": "The node being tested",
    "tier": "novice|apprentice|journeyman|adept|expert|master|grandmaster",
    "bloom_level": 1,
    "estimated_time_minutes": 5,
    "difficulty": "appropriate|stretch|challenge"
  },
  "content": {
    "questions": [
      {
        "id": "q1",
        "text": "Question text",
        "type": "multiple_choice|true_false|short_answer",
        "options": ["A) ...", "B) ...", "C) ...", "D) ..."],
        "correct": "B",
        "explanation": "Why correct",
        "bloom_level": 1,
        "xp_value": 25
      }
    ],
    "prompt": "For voice type: speaking prompt",
    "time_limit_seconds": 120,
    "evaluation_criteria": [
      { "criterion": "Accuracy", "weight": 0.3, "description": "Factual correctness" }
    ],
    "key_concepts": ["concepts to cover"],
    "positions": [
      { "label": "Position A", "description": "Brief description" }
    ],
    "challenges": [
      { "level": "explain", "prompt": "Explain your position", "xp_value": 50 }
    ],
    "scenario": "For scenario type: detailed situation",
    "context": "Background info"
  },
  "xp_total": 200,
  "completion_bonus": 50
}

Rules:
1. Match assessment difficulty to the learner's current tier
2. Include a stretch element that tests one level above current Bloom level
3. Voice prompts should be conversational, not academic
4. Debate topics should have genuinely defensible multiple perspectives
5. Scenarios should feel realistic and relevant
6. Every assessment should have a question that makes the learner think differently
7. For quiz: 5-8 questions with progressive difficulty
8. For voice: answerable in 1-3 minutes of speaking
9. For debate: exactly 3 challenge levels (explain, defend, steelman)`;

async function main() {
  console.info("Booting sg-assessment-creator...");
  const app = Fastify();

  app.addHook("onResponse", async (request, reply) => {
    console.info(`${request.method} ${request.url} ${reply.statusCode} ${Math.round(reply.elapsedTime)}ms`);
  });

  app.addHook("onError", async (_request, _reply, error) => {
    console.error("[AssessmentCreator] Error:", error);
  });

  app.post("/", async (request, reply) => {
    const { topic, type, skill_node, current_level, current_tier, skill_tree, inputs } = request.body || {};
    const actualTopic = topic || inputs;

    if (!actualTopic) {
      return reply.status(400).send({ error: "topic is required" });
    }

    const assessmentType = type || "quiz";
    const validTypes = ["quiz", "voice", "debate", "scenario"];
    if (!validTypes.includes(assessmentType)) {
      return reply.status(400).send({ error: `type must be one of: ${validTypes.join(", ")}` });
    }

    const contextParts = [];
    if (skill_node) contextParts.push(`Skill node: ${skill_node}`);
    if (current_level) contextParts.push(`Current level: ${current_level}/99`);
    if (current_tier) contextParts.push(`Current tier: ${current_tier}`);
    if (skill_tree) contextParts.push(`Skill tree context:\n${JSON.stringify(skill_tree, null, 2)}`);

    const message = await client.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [{
        role: "user",
        content: `Create a ${assessmentType.toUpperCase()} assessment for: "${actualTopic}"

${contextParts.join("\n")}

Assessment type: ${assessmentType}
${current_tier ? `Learner tier: ${current_tier}` : "Assume novice if no tier provided"}

Design this to be engaging, appropriately challenging, and testing genuine understanding.

Return ONLY valid JSON, no markdown.`
      }]
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "";
    const assessment = JSON.parse(text);

    return reply.send({
      success: true,
      assessment,
      metadata: {
        type: assessmentType,
        bloom_level: assessment.assessment?.bloom_level || 0,
        tier: assessment.assessment?.tier || "novice",
        xp_available: assessment.xp_total || 0,
        agent: "sg-assessment-creator",
      }
    });
  });

  const port = parseInt(process.env.PORT || "80");
  const host = process.env.HOST || "0.0.0.0";
  await app.listen({ port, host });
  console.info(`sg-assessment-creator running on ${host}:${port}`);
}

main().catch(console.error);
