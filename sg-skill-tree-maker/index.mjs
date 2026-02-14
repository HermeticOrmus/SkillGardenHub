import '@blaxel/telemetry';
import Fastify from "fastify";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You are the SkillGarden Skill Tree Architect. Given a topic, you generate interconnected skill trees that map the entire knowledge domain.

Your output must be a JSON object with this exact structure:
{
  "topic": "The main topic name",
  "clusters": [
    {
      "id": "unique-cluster-id",
      "label": "Cluster Display Name",
      "description": "What this knowledge domain covers"
    }
  ],
  "nodes": [
    {
      "id": "unique-node-id",
      "label": "Node Name",
      "cluster": "cluster-id",
      "tier": "novice|apprentice|journeyman|adept|expert|master|grandmaster",
      "level_range": [1, 15],
      "description": "What mastering this node means",
      "bloom_level": 1,
      "size": "large|medium|small"
    }
  ],
  "connections": [
    ["from-node-id", "to-node-id"]
  ]
}

Rules:
1. Create 3-6 clusters that represent distinct but overlapping knowledge domains
2. Generate 15-30 nodes across all clusters
3. Every node must belong to a cluster
4. Connections represent prerequisites (from must be learned before to)
5. Include 1-2 "hub" nodes (size: large) that connect multiple clusters
6. Include locked/advanced nodes that require mastering multiple prerequisites
7. Tier levels follow this mapping:
   - novice (Lv 1-15): Recall basic facts and definitions
   - apprentice (Lv 16-30): Understand concepts and relationships
   - journeyman (Lv 31-50): Apply knowledge to new situations
   - adept (Lv 51-70): Analyze and break down complex problems
   - expert (Lv 71-85): Evaluate and critique arguments
   - master (Lv 86-92): Create new frameworks and teach others
   - grandmaster (Lv 93-99): Original contribution to the field
8. The tree should feel like a Path of Exile passive tree -- interconnected web, not linear
9. Include cross-cluster connections where knowledge domains overlap
10. The grandmaster tier should require mastery of multiple clusters`;

async function main() {
  console.info("Booting sg-skill-tree-maker...");
  const app = Fastify();

  app.addHook("onResponse", async (request, reply) => {
    console.info(`${request.method} ${request.url} ${reply.statusCode} ${Math.round(reply.elapsedTime)}ms`);
  });

  app.addHook("onError", async (_request, _reply, error) => {
    console.error("[SkillTreeMaker] Error:", error);
  });

  // --- Article-to-Tree Mapping Route ---
  // Takes a topic/article + master tree node list, returns which nodes are illuminated
  app.post("/map-article", async (request, reply) => {
    const { topic, nodes } = request.body || {};

    if (!topic) {
      return reply.status(400).send({ error: "topic is required" });
    }
    if (!nodes || !Array.isArray(nodes) || nodes.length === 0) {
      return reply.status(400).send({ error: "nodes array is required (list of {id, label, cluster, description})" });
    }

    const nodeList = nodes.map(n => `- ${n.id}: ${n.label} (${n.cluster})${n.description ? ' -- ' + n.description : ''}`).join('\n');

    const message = await client.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 2048,
      system: `You are the SkillGarden Article Mapper. Given an article topic or URL, you analyze which nodes on a pre-built master skill tree are relevant.

You must return a JSON object with:
{
  "illuminated": ["node-id-1", "node-id-2", ...],
  "summary": "A 1-2 sentence summary of what this article/topic covers in the context of the skill tree",
  "clusters_touched": ["cluster-id-1", "cluster-id-2", ...]
}

Rules:
1. Select nodes that the article DIRECTLY discusses or strongly implies
2. Include prerequisite nodes that someone would need to understand the article
3. Include 1-2 "stretch" nodes that represent natural next steps from the article
4. Typically illuminate 8-25 nodes depending on article breadth
5. Be precise -- don't illuminate nodes with only tangential relevance
6. Return ONLY valid JSON, no markdown`,
      messages: [{
        role: "user",
        content: `Article/Topic: "${topic}"

Master Tree Nodes:
${nodeList}

Which nodes does this article illuminate? Return JSON only.`
      }]
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "";
    const result = JSON.parse(text);

    return reply.send({
      success: true,
      illuminated: result.illuminated || [],
      summary: result.summary || "",
      clusters_touched: result.clusters_touched || [],
      metadata: {
        total_nodes: nodes.length,
        illuminated_count: (result.illuminated || []).length,
        agent: "sg-skill-tree-maker/map-article",
      }
    });
  });

  // --- Skill Tree Generation Route ---
  app.post("/", async (request, reply) => {
    const { topic, depth, context, inputs } = request.body || {};
    const actualTopic = topic || inputs;

    if (!actualTopic) {
      return reply.status(400).send({ error: "topic is required" });
    }

    const depthGuide = depth === "shallow" ? "15-20 nodes, 3 clusters" :
                       depth === "deep" ? "25-35 nodes, 5-6 clusters" :
                       "20-25 nodes, 4-5 clusters";

    const message = await client.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [{
        role: "user",
        content: `Generate a complete skill tree for: "${actualTopic}"

Depth: ${depthGuide}
${context ? `Additional context: ${context}` : ""}

Think about:
- What are the foundational concepts someone needs first?
- What are the distinct knowledge clusters within this topic?
- Where do different clusters overlap and create synthesis opportunities?
- What does grandmaster-level mastery look like?
- What connections create "aha moments" when learned together?

Return ONLY valid JSON, no markdown.`
      }]
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "";
    const tree = JSON.parse(text);

    return reply.send({
      success: true,
      tree,
      metadata: {
        node_count: tree.nodes?.length || 0,
        cluster_count: tree.clusters?.length || 0,
        connection_count: tree.connections?.length || 0,
        agent: "sg-skill-tree-maker",
      }
    });
  });

  const port = parseInt(process.env.PORT || "80");
  const host = process.env.HOST || "0.0.0.0";
  await app.listen({ port, host });
  console.info(`sg-skill-tree-maker running on ${host}:${port}`);
}

main().catch(console.error);
