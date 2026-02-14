# User Story 4: Structured Skill Trees

**As a** learner,
**I want** a structured learning path with prerequisites,
**So that** I build knowledge on solid foundations instead of wandering randomly.

---

## The RuneScape Principle

```
RUNESCAPE                              SKILLGARDEN
Normal tree -> Oak -> Willow -> Yew    Definitions -> Frameworks -> Analysis -> Synthesis
Can't cut Yew at Lv30                  Can't debate regulation at Lv30
Cooking != Woodcutting XP              Privacy law != AI Regulation XP
Path is fixed, pace is yours           Structure is fixed, style is yours
```

Two non-negotiable rules:

**Rule 1: Prerequisites are gates, not suggestions.**
You prove mastery before you advance. Period.

**Rule 2: XP goes where it belongs.**
Content maps to specific skills. No cross-contamination.

---

## Skill Tree Structure

Each skill has 6 tiers with prerequisite gates:

```
TIER 1: FOUNDATIONS (Lv 1-15)
  Basic terminology and concepts
  GATE: Pass Foundations Quiz
    |
TIER 2: FRAMEWORKS (Lv 16-35)
  Theoretical models and structures
  GATE: Framework Comparison Essay
    |
TIER 3: APPLICATION (Lv 36-55)
  Using knowledge in scenarios
  GATE: Scenario Analysis
    |
TIER 4: ANALYSIS (Lv 56-75)
  Comparing, evaluating, debating
  GATE: Steelman Debate
    |
TIER 5: MASTERY (Lv 76-92)
  Teaching, creating frameworks
  GATE: Human Expert Review (Perle)
    |
TIER 6: GRANDMASTER (Lv 93-99)
  Novel edge cases, original contribution
  GATE: Expert Panel Review
```

---

## XP Isolation: Content Maps to Skills

### The Problem Without Isolation

```
User reads 50 articles about data privacy
Platform says "You're Level 60 in AI Regulation"
They can't explain the EU AI Act risk tiers
Credential is meaningless
```

### How It Works With Isolation

```
User reads 50 articles about data privacy
Platform says:
  "You're Level 60 in Data Privacy"
  "You're Level 3 in AI Regulation"
  "These fields are related. Want to start
   the AI Regulation tree? Your Data Privacy
   knowledge gives you a 1.2x XP bonus on
   overlapping concepts."
```

### Content-to-Skill Mapping

```
User ingests: "How GDPR Influenced the EU AI Act"
                    |
                    v
         Anthropic analyzes content
         Maps claims to skill trees
                    |
    +---------------+---------------+
    v               v               v
Data Privacy   AI Regulation    EU Law
  (primary)     (secondary)    (tertiary)

XP Distribution:
  Data Privacy:    100 XP (primary topic)
  AI Regulation:    30 XP (referenced, not taught)
  EU Law:           15 XP (contextual mention)

White Circle validates:
  Is this mapping accurate?
  Does the content actually teach AI Regulation
    or just mention it?
  No inflated XP for tangential references
```

---

## Prerequisite Enforcement

### What Happens When You Try to Skip

```
+-----------------------------------------------------+
| You ingested: "Advanced Cross-Border AI Compliance"  |
|                                                      |
| This content maps to:                                |
| AI Regulation -> Tier 3 -> Cross-border operations   |
| Required level: 48                                   |
| Your level: 22                                       |
|                                                      |
| CONTENT LOCKED                                       |
|                                                      |
| This material requires understanding of:             |
| [check] EU AI Act structure (Lv 16)    Complete      |
| [check] Risk classification (Lv 22)    Complete      |
| [ ]     US approach (Lv 28)            Not started   |
| [ ]     Compliance basics (Lv 36)      Locked        |
|                                                      |
| The content is saved. It will unlock when you        |
| reach Level 48.                                      |
|                                                      |
| RECOMMENDED NEXT:                                    |
| -> "US AI Policy: A Sector-Specific Approach"        |
|    Maps to: Lv 28 (your next milestone)              |
|                                                      |
| Or take the shortcut:                                |
| -> [Test out of Lv 28] Prove you already know it     |
+-----------------------------------------------------+
```

### Test-Out Option

The path is structured, but you can test out of any node if you already know it.

- Generates Lv 28-equivalent assessment
- Must score 80%+ to skip
- White Circle ensures skip test matches earned difficulty
- If passed: XP awarded, node marked complete
- If failed: "You scored 55%. Here's what you missed. These 2 resources will get you there."

---

## Personalized Paths (Style Adapts, Structure Doesn't)

```
STRUCTURE IS FIXED              STYLE ADAPTS
(what you learn)                (how you learn)

Foundations -> Frameworks       Visual learner?
-> Application -> Analysis      -> Diagrams, charts, infographics

Same prerequisites              Auditory learner?
Same gates                      -> ElevenLabs audio lessons
Same assessments                -> Podcast content prioritized

                                Reading learner?
                                -> Articles, papers, textbooks

                                Hands-on learner?
                                -> Scenario simulations
                                -> Build compliance checklists
```

Blaxel detects learning style by tracking:
- Completes audio lessons 2.3x faster -> auditory
- Voice debates score 15% higher -> verbal
- Skips infographics -> not visual

Content delivery adapts. Gate rigor never does.

---

## Cross-Skill Relationships

Skills don't bleed into each other, but they can have synergy bonuses:

| Skill A | Skill B | Synergy | Bonus |
|---------|---------|---------|-------|
| Finance | Game Theory | Market strategy as game theory | +15% XP |
| Health | Categorical Math | Formal modeling of feedback loops | +10% XP |
| Film | Finance | Entertainment industry economics | +10% XP |
| Game Theory | Categorical Math | Formal game theory foundations | +20% XP |

### Cross-Skill Quests

Like RuneScape quests requiring multiple skills:

```
"The Compliance Odyssey"
  Requirements:
  - AI Regulation Lv 36+
  - Data Privacy Lv 30+
  - EU Law Lv 20+
  Reward:
  - 500 XP in each skill
  - Unlocks "Regulatory Generalist" badge
  - New content tier: Cross-domain analysis
```

---

## Tool Integration Summary

| Tool | Role |
|------|------|
| Anthropic | Maps content to skill nodes, generates prerequisite-appropriate assessments |
| White Circle AI | Validates content-to-skill mapping, ensures XP accuracy, validates test-out difficulty |
| Perle | Human curriculum designers validate tree structure, expert review for gates |
| ElevenLabs | Delivers lessons in preferred style, voice-based gate assessments |
| BizCrush | Captures content, maps to correct skill nodes |
| Blaxel | Skill tree state, learning style detection, prerequisite enforcement, XP calculations |
| Finny | Prospects content for user's exact next milestone |
| Lovable | Skill tree visualization, progress map, gate UI, cross-skill explorer |
