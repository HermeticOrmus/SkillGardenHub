// SkillGarden Agent: Skill Tree Maker
// Takes a topic and generates an interconnected skill tree with:
// - Clusters (knowledge domains)
// - Nodes (individual skills/concepts)
// - Connections (prerequisites between nodes)
// - Tiers mapped to OSRS levels (1-99)

const Anthropic = require('@anthropic-ai/sdk');

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
      "bloom_level": 1-6,
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

async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { topic, depth, context } = req.body || {};

    if (!topic) {
      return res.status(400).json({ error: 'topic is required' });
    }

    const depthGuide = depth === 'shallow' ? '15-20 nodes, 3 clusters' :
                       depth === 'deep' ? '25-35 nodes, 5-6 clusters' :
                       '20-25 nodes, 4-5 clusters';

    const message = await client.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [{
        role: 'user',
        content: `Generate a complete skill tree for: "${topic}"

Depth: ${depthGuide}
${context ? `Additional context: ${context}` : ''}

Think about:
- What are the foundational concepts someone needs first?
- What are the distinct knowledge clusters within this topic?
- Where do different clusters overlap and create synthesis opportunities?
- What does grandmaster-level mastery look like?
- What connections create "aha moments" when learned together?

Return ONLY valid JSON, no markdown.`
      }]
    });

    const text = message.content[0].text;
    const tree = JSON.parse(text);

    return res.status(200).json({
      success: true,
      tree,
      metadata: {
        node_count: tree.nodes?.length || 0,
        cluster_count: tree.clusters?.length || 0,
        connection_count: tree.connections?.length || 0,
        agent: 'sg-skill-tree-maker',
      }
    });
  } catch (err) {
    console.error('[SkillTreeMaker] Error:', err);
    return res.status(500).json({ error: err.message, agent: 'sg-skill-tree-maker' });
  }
}

module.exports = handler;
