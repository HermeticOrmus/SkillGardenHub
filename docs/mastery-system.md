# SkillGarden Mastery System

## Core Philosophy

> Consuming is not learning. Recall is learning.

SkillGarden doesn't just give you a smart notebook. It gives you a smart tutor that won't let you forget.

---

## The Mastery Pipeline

### Phase 1: Ingest (Any Source)

Supported sources:
- Articles (URL or paste)
- Panel recordings (BizCrush audio capture)
- Podcasts (URL or upload)
- YouTube videos (URL)
- Textbooks (upload/paste)
- Claude conversations (paste)

Anthropic extracts:
- Core concepts
- Key claims
- Relationships between ideas
- Bloom's taxonomy classification

### Phase 2: Pre-Test (Establish Baseline)

**Before the user studies**, we test what they already know.

5 quick questions generated from the content BEFORE the user sees it:
- Multiple choice for factual recall
- Open-ended for conceptual understanding
- Voice input option

**Result**: Baseline score per concept. Knowledge gaps identified.

| Tool | Role in Pre-Test |
|------|-----------------|
| Anthropic | Generates Bloom's-leveled questions from content |
| White Circle AI | Validates questions are fair and test target concept |
| ElevenLabs | Voice-based pre-test option |
| BizCrush | Captures spoken responses |
| Blaxel | Records baseline scores per concept |

### Phase 3: Learn (Guided by Gaps)

Content delivery personalized to user's gaps:
- **Focus areas**: Concepts they didn't know (prioritized)
- **Already knew**: Available for review but not forced
- **Audio recap**: ElevenLabs generates focused recap of gap areas only

Finny "prospects" the content -- identifies which pieces close the user's specific knowledge gaps.

### Phase 4: Active Recall Testing

Three interaction modes:

#### Mode A: Quiz (Multiple Choice + Open-Ended)

Questions at escalating Bloom's levels:

| Level | Type | Example |
|-------|------|---------|
| Remember | Recall | "Which category does facial recognition fall under?" |
| Understand | Explain | "Explain WHY facial recognition is high-risk" |
| Apply | Scenario | "A startup builds an AI hiring tool. Does it need to comply?" |
| Analyze | Compare | "Compare the EU approach to AI regulation with the US approach" |
| Evaluate | Judge | "Is the EU AI Act's risk-based framework effective? Defend." |
| Create | Design | "Design a compliance checklist for a startup deploying AI in the EU" |

#### Mode B: Feynman Voice Test

> "If you can't explain it simply, you don't understand it."

ElevenLabs voice agent prompts: "Explain high-risk AI classification to me like I'm a startup founder who's never heard of the EU AI Act."

BizCrush captures the user's explanation. Anthropic evaluates:
- **Accuracy**: Did they get the facts right?
- **Completeness**: Did they cover all key points?
- **Clarity**: Was it understandable?

Feedback: "Good explanation. You missed the open-source exemption. Want to review that?"

#### Mode C: Socratic Dialogue

ElevenLabs voice agent conducts a back-and-forth:

```
Agent: "You said US companies need to comply. But what if they
        only serve US customers?"
User:  "Hmm... I think if they process EU citizen data..."
Agent: "Close. The trigger is actually market availability
        in the EU, not data processing. Want to dig into
        the territorial scope?"
```

### Phase 5: Spaced Repetition (Long-Term Retention)

Based on the Ebbinghaus forgetting curve:

```
100% |*
     | \    * Review 1
     |  \  / \    * Review 2
     |   \/   \  / \    * Review 3
     |         \/   \  /\-------- 90%
  0% |-------------------------------
     Day1 Day3 Day7 Day14 Day30
```

Blaxel agent runs on schedule:
- **Day 3**: Push notification quiz (2 questions)
- **Day 7**: Deeper recall test
- **Day 14**: Application-level question
- **Day 30**: Teach-it-back challenge

| Tool | Role in Spaced Repetition |
|------|--------------------------|
| Blaxel | Tracks forgetting curves per concept, triggers reviews |
| Anthropic | Generates fresh questions each cycle (never same quiz twice) |
| ElevenLabs | Morning audio quiz: "On your commute, answer this..." |
| White Circle AI | Ensures difficulty progression is calibrated |
| Perle | Routes uncertain AI scores to human evaluator |

### Phase 6: Mastery Validation

Dashboard shows:
- Per-skill level (0-99)
- Per-concept mastery percentage
- Fact mastery vs debate mastery (separate scores)
- Active recall streak
- Next review schedule
- Credential status (active, decaying, expired)

---

## Assessment Types by Tier

### Levels 1-30: AI-Evaluated (Fast, Scalable)

Anthropic generates and grades automatically. Low stakes, high volume, rapid feedback.

### Levels 31-50: Scenario-Based (Applied Knowledge)

Open-ended written or voice responses. Claude evaluates for completeness and accuracy. Partial credit: XP proportional to coverage.

### Levels 51-70: Debate Fluency (Multi-Perspective)

Must demonstrate understanding of ALL sides of a debate. Voice debate with ElevenLabs agent. XP scales with perspective fluency score.

### Levels 71-85: Steelman Defense (Adversarial)

ElevenLabs voice agent becomes adversarial. User must defend their position against attacks from multiple angles. Anthropic scores argument quality. Perle routes borderline scores to human evaluators.

### Levels 86-92: Teach-Back and Framework Creation

User creates original frameworks, then explains them verbally. Anthropic evaluates soundness. Perle: human experts validate the framework.

### Levels 93-99: Grandmaster Certification (Human-Verified)

Each level requires as much effort as ~13 levels at lower tiers. Novel scenarios with no existing answers. Edge cases not covered in source material. ALL responses routed to domain experts via Perle. Cannot be memorized. Cannot be gamed.

---

## XP Multipliers

| Activity | Multiplier | Rationale |
|----------|-----------|-----------|
| Multiple choice correct | 1x | Recall is baseline |
| Explain in own words | 2x | Understanding > recall |
| Apply to scenario | 3x | Application is harder |
| Compare perspectives | 4x | Analysis requires depth |
| Steelman opposing view | 6x | Hardest common skill |
| Create original framework | 8x | Synthesis is rare |
| Pass human expert review | 10x | Validated mastery |
| Teach-back scored 90%+ | 10x | If you can teach it, you own it |
| Maintain streak (spaced rep) | 1.5x bonus | Consistency rewarded |

---

## Skill Decay (Keeps Credentials Honest)

If you stop reviewing:

```
Level 67 ---- 30 days no activity ----> Level 64
              Blaxel detects decay
              Pushes review challenge
              ElevenLabs: "Quick check -- still got it?"
```

Your credential shows CURRENT level, not peak level. Peak is shown separately.

```
+---------------------+
| AI Regulation       |
| Current: Lv 64      |
| Peak:    Lv 67      |
| Status:  Decaying   |
| [Review now]        |
+---------------------+
```

This is radical honesty. A credential that decays is more trustworthy than one that doesn't.
