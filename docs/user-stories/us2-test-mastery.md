# User Story 2: Test Mastery, Enforce Recall

**As a** learner who ingests content from many sources,
**I want** my understanding tested and tracked over time,
**So that** I retain what I learn and can prove mastery -- not just exposure.

---

## The Core Insight

> Consuming is not learning. Recall is learning.

NotebookLM gives you a smart notebook. SkillGarden gives you a smart tutor that won't let you forget.

---

## The Flow

### Step 1: Ingest Any Source

Article, panel, podcast, YouTube, textbook, Claude chat -- all enter the same pipeline.

Anthropic extracts:
- Core concepts
- Key claims
- Relationships between ideas
- Bloom's taxonomy classification

Blaxel stores in persistent knowledge graph per user.

### Step 2: Pre-Test (Establish Baseline)

BEFORE the user studies, test what they already know. 5 quick questions.

```
+--------------------------------------------------+
| You added: "EU AI Regulation Panel"               |
|                                                   |
| Before we process this, let's see what you        |
| already know. 5 quick questions:                  |
|                                                   |
| Q1: What is the EU AI Act?                        |
| o A data privacy regulation                       |
| o A risk-based framework for AI systems    <--    |
| o A trade agreement                               |
| o I don't know                                    |
|                                                   |
| Q2: In your own words, what does "high-risk       |
|     AI" mean?                                     |
| +-------------------------------------------+     |
| | [voice input or text]                     |     |
| +-------------------------------------------+     |
|                                                   |
| Baseline: 2/5 concepts known                      |
| Knowledge gap: 3 concepts to master               |
+--------------------------------------------------+
```

### Step 3: Learn (Guided by Gaps)

Content delivery personalized to gaps:
- **Focus areas**: Concepts they didn't know (prioritized)
- **Already knew**: Available for review but not forced
- **Audio recap**: ElevenLabs generates focused 90-sec recap of gap areas only
- **Finny**: "Prospects" content pieces that close specific knowledge gaps

### Step 4: Active Recall Testing

#### Mode A: Quiz (Multiple Choice + Open-Ended)

Escalating Bloom's levels:

- **Level 1 -- REMEMBER**: "Which category does facial recognition fall under in the EU AI Act?"
- **Level 2 -- UNDERSTAND**: "Explain WHY facial recognition is classified as high-risk."
- **Level 3 -- APPLY**: "A startup builds an AI hiring tool. Does it need to comply? Why?"
- **Level 4 -- ANALYZE**: "Compare the EU approach to AI regulation with the US approach."
- **Level 5 -- EVALUATE**: "Is the EU AI Act's risk-based framework effective? Defend your position."
- **Level 6 -- CREATE**: "Design a compliance checklist for a startup deploying AI in the EU."

#### Mode B: Feynman Voice Test

> "If you can't explain it simply, you don't understand it."

```
+--------------------------------------------------+
| TEACH IT BACK                                     |
|                                                   |
| ElevenLabs voice agent:                           |
| "Explain high-risk AI classification to me        |
|  like I'm a startup founder who's never heard     |
|  of the EU AI Act."                               |
|                                                   |
| [Recording...]                                    |
|                                                   |
| BizCrush captures your explanation                |
| Anthropic evaluates:                              |
|  Accuracy: 85%                                    |
|  Completeness: 70% (missed exemptions)            |
|  Clarity: 90%                                     |
|                                                   |
| "Good explanation. You missed the open-source     |
|  exemption. Want to review that?"                 |
+--------------------------------------------------+
```

#### Mode C: Socratic Dialogue

```
Agent: "You said US companies need to comply. But what if
        they only serve US customers?"
User:  "Hmm... I think if they process EU citizen data..."
Agent: "Close. The trigger is actually market availability
        in the EU, not data processing. Want to dig into
        the territorial scope?"
```

### Step 5: Spaced Repetition (Long-Term Retention)

Forgetting curve management:

- **Day 3**: Push notification quiz (2 questions)
- **Day 7**: Deeper recall test
- **Day 14**: Application-level question
- **Day 30**: Teach-it-back challenge

Blaxel agent runs on schedule. Anthropic generates fresh questions each cycle (never same quiz twice). ElevenLabs delivers morning audio quizzes.

### Step 6: Mastery Dashboard

```
+--------------------------------------------------+
| MASTERY DASHBOARD                                 |
|                                                   |
| EU AI Regulation         ============--   85%     |
|   Risk Classification    ================ 100%    |
|   Compliance Timelines   ==========----   70%     |
|   Territorial Scope      ========------   60%     |
|   Open Source Exemptions ==============- 90%      |
|                                                   |
| Total Concepts Mastered: 47                       |
| Active Recall Streak: 12 days                     |
| Next Review: 3 concepts due tomorrow              |
+--------------------------------------------------+
```

---

## Tool Integration Summary

| Tool | Role |
|------|------|
| Anthropic | Question generation at all Bloom's levels, response evaluation, adaptive difficulty |
| ElevenLabs | Voice quizzing, Socratic dialogue, audio recaps, teach-back evaluation |
| BizCrush | Captures spoken explanations for evaluation |
| White Circle AI | Validates quiz fairness, checks AI grading for bias |
| Perle | Human experts score ambiguous responses, validate questions |
| Blaxel | Knowledge graph, forgetting curves, spaced repetition scheduling |
| Finny | Knowledge gap prospecting: recommends what to study next |
| Lovable | Quiz UI, mastery dashboard, progress visualization |
