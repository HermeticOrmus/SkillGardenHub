# User Story 5: Exponential Credentialing (RuneScape Curve)

**As a** learner who wants to prove my knowledge,
**I want** a credentialing system where high levels genuinely mean something,
**So that** employers and peers can trust my demonstrated mastery.

---

## The XP Philosophy

```
EXPERIENCE REQUIRED

    ^
    |                                            / 99
    |                                          /
    |                                        /
    |                                      /
    |                                   /
    |                                /
    |                            /
    |                        /
    |                   /
    |             /
    |        /
    |    /
    |/
    +-------------------------------------------> Level
     1    10   20   30   40   50   60   70  80 92  99

    <-------- SAME EFFORT -------->  <- SAME ->
         Levels 1 to 92               92 to 99
```

**Why this works:**
- Levels 1-50 are encouraging. Progress is fast. Users stay engaged.
- Levels 50-80 require real effort. You're proving competence.
- Levels 80-92 require deep understanding. Most people plateau here.
- Levels 92-99 require as much effort as EVERYTHING BEFORE IT. Credentials become rare and meaningful.

**A Level 99 in any topic is a genuine signal of mastery that cannot be gamed.**

---

## XP Table

| Level | Total XP Required | Tier | Assessment Types |
|-------|-------------------|------|-----------------|
| 1-15 | 0 - 2,411 | Novice | Multiple choice |
| 16-30 | 2,411 - 13,363 | Apprentice | Short answer, explain in own words |
| 31-50 | 13,363 - 101,333 | Journeyman | Case studies, scenario analysis |
| 51-70 | 101,333 - 737,627 | Adept | Comparative analysis, debate identification |
| 71-85 | 737,627 - 3,258,594 | Expert | Steelman defense, Socratic voice debate |
| 86-92 | 3,258,594 - 6,517,253 | Master | Teach-back, framework creation, human review |
| 93-99 | 6,517,253 - 13,034,431 | Grandmaster | Novel edge cases, original contribution, expert panel |

**XP Formula** (RuneScape-inspired):
```
xp_for_level(n) = floor(sum(floor(n + 300 * 2^(n/7)) / 4) for i=1 to n-1)
```

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

## The Credential Card

```
+-----------------------------------------------------+
| SkillGarden VERIFIED SKILL CREDENTIAL                |
|                                                      |
| Diego Bodart                                         |
|                                                      |
| AI Regulation & Compliance        Level 67 Adept     |
|   EU AI Act Framework             Lv 78 Expert       |
|   US AI Policy Landscape          Lv 54 Adept        |
|   Cross-jurisdictional Analysis   Lv 61 Adept        |
|   Compliance Implementation       Lv 45 Journeyman   |
|                                                      |
| Verification:                                        |
| - 847 claims validated in knowledge graph            |
| - 23 debate challenges completed                     |
| - 4 expert-reviewed assessments passed               |
| - 94-day active recall streak                        |
|                                                      |
| Credential ID: SG-2026-A7F3X                         |
| Verify: skillgarden.io/verify/SG-2026-A7F3X          |
|                                                      |
| Validated by:                                        |
| - White Circle AI (assessment integrity)             |
| - Perle (human expert verification at L86+)          |
+-----------------------------------------------------+
```

---

## Why Employers Trust It

| Traditional Credential | SkillGarden Credential |
|----------------------|----------------------|
| Passed a test once | Continuous validated mastery |
| Binary: pass/fail | Granular: 0-99 with tier context |
| Tests memorization | Tests recall, application, debate, synthesis |
| Self-reported | Cryptographically verifiable |
| Stale after graduation | Decays if not maintained |
| No perspective testing | Proves multi-perspective fluency |
| Human-only evaluation | AI + human evaluation pipeline |

---

## Skill Decay

If you stop reviewing, your level decays:

```
Level 67 ---- 30 days no activity ----> Level 64
              Blaxel detects decay
              Pushes review challenge
              ElevenLabs: "Quick check -- still got it?"
```

Your credential shows CURRENT level, not peak level. Peak shown separately.

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

---

## Adaptive Difficulty

Blaxel maintains a persistent learner profile:

```
When user ingests new content:
-> Anthropic checks user's current level
-> Pre-test calibrated to their tier
-> Content delivery adapted to gaps
-> Quiz difficulty matches their frontier
-> Never too easy (boring) or too hard (frustrating)

Finny matches content to the level boundary:
"You're Level 67 in AI Regulation.
 To reach 71 (Expert tier), you need to master
 cross-jurisdictional comparison.
 Here are 3 sources that target exactly that."
```

---

## The Pitch Line

> "LinkedIn says you know AI regulation because you typed it. SkillGarden proves it because you defended it, debated it, taught it, and maintained it -- verified by AI and human experts on an exponential mastery curve where Level 99 means something."

---

## Tool Integration Summary

| Tool | Role |
|------|------|
| Anthropic | Tier-appropriate assessments, response evaluation, adaptive difficulty |
| White Circle AI | Assessment integrity, question leakage prevention, AI grading audit |
| Perle | Human expert evaluation for Level 86+, Grandmaster certification |
| ElevenLabs | Voice assessments at Expert+ tiers, adversarial questioning |
| BizCrush | Captures voice assessment responses |
| Blaxel | XP tracking, skill decay, level calculations, spaced repetition |
| Finny | Content recommendations targeting level boundary |
| Lovable | Skill dashboard, XP bars, credential cards, CV export |
