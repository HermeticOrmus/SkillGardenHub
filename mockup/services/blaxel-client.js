// SkillGarden -- Blaxel Agent Client
// Calls the sg-skill-tree-maker agent hosted on Blaxel
// Returns: { success, tree: { topic, clusters, nodes, connections }, metadata }

const BlaxelClient = {
  /**
   * Generate a skill tree from a topic or URL.
   * @param {string} topic - The topic, article title, or URL to generate a tree for
   * @param {object} [options]
   * @param {string} [options.depth] - 'shallow' | 'medium' | 'deep'
   * @param {string} [options.context] - Additional context for the agent
   * @returns {Promise<{success: boolean, tree: object, metadata: object}>}
   */
  async generateSkillTree(topic, options = {}) {
    const { depth = 'medium', context = '' } = options;

    const response = await fetch(CONFIG.blaxel.skillTreeUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Blaxel-Workspace': CONFIG.blaxel.workspace,
        'X-Blaxel-Authorization': `Bearer ${CONFIG.blaxel.apiKey}`,
      },
      body: JSON.stringify({ topic, depth, context }),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      throw new Error(`Blaxel agent error (${response.status}): ${errorText}`);
    }

    return response.json();
  },
};
