# User Story 3: Conflicting Source Validation

**As a** learner encountering contradictory information,
**I want** the platform to identify conflicts and use them as learning opportunities,
**So that** I develop multi-perspective fluency instead of memorizing one viewpoint.

---

## The Core Insight

> A student who memorizes one answer has knowledge.
> A student who can articulate why experts disagree has **mastery**.

Most platforms pick a side or flag conflicts as errors. SkillGarden treats legitimate disagreement as the richest learning material in the system.

---

## Two Types of Conflict

### Type 1: ERROR

One source is factually wrong. A correct answer exists.

**Example**: "AI Act passed in 2022" vs "AI Act passed March 2024"
- One is simply wrong
- Flag the error, teach the truth
- The error itself becomes a learning moment

### Type 2: LEGITIMATE DEBATE

Multiple valid perspectives exist. No single "right answer."

**Example**: "Risk-based regulation is best" vs "Prescriptive regulation is more effective" vs "Self-regulation is most adaptive"
- All have evidence
- All have merit
- Understanding the tension IS the knowledge

---

## How It Works

### Step 1: White Circle Detects the Conflict

```
Source A (Panel speaker):
  "Risk-based regulation is the only responsible approach"

Source B (Article):
  "Prescriptive regulation creates clearer compliance paths"

Source C (Podcast from last week):
  "Self-regulation by industry is more adaptive"

White Circle Analysis:
  Conflict type: LEGITIMATE DEBATE
  Perspectives identified: 3
  Verdict: NOT a factual error
  All perspectives enter knowledge graph as DEBATE CLUSTER
```

### Step 2: Anthropic Structures the Debate

```
DEBATE CLUSTER: "AI Regulation Approach"

Perspective 1: Risk-Based
  Core argument: Proportional to harm
  Evidence: EU AI Act, academic studies
  Strengths: Flexible, scalable
  Weaknesses: Subjective risk assessment

Perspective 2: Prescriptive
  Core argument: Clear rules, easier compliance
  Evidence: GDPR success metrics
  Strengths: Predictability
  Weaknesses: Rigid, slow to adapt

Perspective 3: Self-Regulation
  Core argument: Industry knows its own risks
  Evidence: Voluntary AI principles
  Strengths: Speed, technical accuracy
  Weaknesses: Fox guarding henhouse

Common Ground: All agree unregulated AI is risky
Key Tension: Control vs. innovation speed
Open Questions: Who defines "risk"?
```

### Step 3: Blaxel Stores as Debate Cluster

Not a single fact node -- a multi-perspective cluster in the knowledge graph.

### Step 4: Mastery Testing on Debates

Escalating challenge levels:

| Level | Challenge | What It Tests |
|-------|-----------|--------------|
| Recognize | "Name three approaches to AI regulation" | Basic awareness |
| Understand | "Explain the risk-based approach in your own words" | Comprehension |
| Compare | "What's the key trade-off between prescriptive and risk-based?" | Analysis |
| **Steelman** | "You prefer risk-based. Make the strongest case FOR prescriptive." | Perspective fluency |
| Synthesize | "Could elements of all three combine? Design a hybrid." | Creative synthesis |
| Defend | "Take a position. Defend it against counterarguments." | Conviction + depth |

**The steelman test is the mastery differentiator.** Anyone can argue their own side. Only someone with true mastery can argue the opposing side convincingly.

---

## The Socratic Voice Debate

ElevenLabs agent takes the opposing position:

```
Agent: "You believe risk-based regulation is best. But
        prescriptive rules gave us GDPR, which standardized
        privacy globally. Why wouldn't the same work for AI?"

User speaks their response.
BizCrush captures it clearly.

Agent: "Interesting. But you haven't addressed the compliance
        cost argument. Small startups under prescriptive rules
        know exactly what to build. Under risk-based, they're
        guessing. Respond to that."

Anthropic evaluates:
  Did the user address the counterargument?
  Did they use evidence from their sources?
  Can they hold their position under pressure?

MASTERY SCORE: Perspective Fluency 78%
"You argued your side well but struggled to counter the
 compliance cost point. Review Source B, section 3."
```

---

## Mastery Dashboard for Debates

```
+-----------------------------------------------------+
| AI Regulation -- MASTERY BREAKDOWN                   |
|                                                      |
| FACTS (single truth)                                 |
| [check] EU AI Act timeline          ============ 100%|
| [check] Risk classification system  ===========  92% |
| [check] Territorial scope           =========    80% |
|                                                      |
| DEBATES (multiple perspectives)                      |
| [diamond] Regulation approach                        |
|   Perspective coverage:                              |
|   Risk-based:     Understand [check] Steelman [check]|
|   Prescriptive:   Understand [check] Steelman [ ]    |
|   Self-regulation: Understand [ ]    Steelman [ ]    |
|   Synthesis ability: ======------            55%     |
|                                                      |
| OVERALL: Facts 91% | Debates 72% | Combined 82%     |
+-----------------------------------------------------+
```

---

## The Mastery Hierarchy

```
EXPOSURE        "I read about it"           <-- Most platforms stop here
    |
RECALL          "I can state the fact"      <-- Flashcard apps stop here
    |
UNDERSTANDING   "I can explain it"          <-- NotebookLM stops here
    |
PERSPECTIVE     "I know the debate"         <-- SkillGarden starts here
    |
STEELMAN        "I can argue any side"      <-- SkillGarden differentiator
    |
SYNTHESIS       "I can integrate views"     <-- True mastery
```

---

## Tool Integration Summary

| Tool | Role |
|------|------|
| White Circle AI | Classifies conflicts as ERROR vs LEGITIMATE DEBATE, validates evidence per perspective |
| Anthropic | Structures debates, generates steelman challenges, evaluates responses |
| ElevenLabs | Socratic debate partner, takes opposing positions |
| BizCrush | Captures spoken debate responses |
| Perle | Reviews when conflict type is ambiguous, validates perspective mappings |
| Blaxel | Stores debate clusters, tracks per-perspective mastery |
| Finny | Prospects sources to strengthen underrepresented perspectives |
| Lovable | Debate visualization, perspective coverage dashboard |
