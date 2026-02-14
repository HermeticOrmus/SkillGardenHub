# SkillGarden Architecture

## System Flow

```
ANY SOURCE (Article, Panel, Podcast, YouTube, Textbook, Claude Chat)
        |
        v
+------------------+
|    BizCrush      |  Audio --> structured text
|    (if audio)    |
+--------+---------+
         |
         v
+------------------+
|   Anthropic      |  Extracts discrete claims
|   (Claude)       |  Speaker attribution
|                  |  Topic segmentation
+--------+---------+
         |
         v
+==========================================+
|       WHITE CIRCLE AI - TRUTH GATE       |
|                                          |
|  1. SOURCE VALIDATION                    |
|     - Source credibility                 |
|     - Known misinformation vectors      |
|     - Content freshness                  |
|                                          |
|  2. CLAIM VERIFICATION                   |
|     - Cross-reference trusted sources    |
|     - Hallucinated statistics detection  |
|     - Missing context detection          |
|                                          |
|  3. AI FIDELITY                          |
|     - Extraction faithful to original?   |
|     - Summary preserves meaning?         |
|     - No hallucinated claims added?      |
|                                          |
|  OUTPUT per claim:                       |
|  VERIFIED    --> Knowledge Graph         |
|  UNCERTAIN   --> Perle (human review)    |
|  INVALID     --> Blocked + explanation   |
|  OUTDATED    --> Flagged + current data  |
+==========================================+
         |
    +----+----+----+
    |         |    |
    v         v    v
 Verified  Perle  Invalid
    |       |      |
    v       v      v
+------------------+
|    Blaxel        |  Persistent knowledge graph
|                  |  Skill tree state
|                  |  XP tracking
+--------+---------+
         |
    +----+----+
    |         |
    v         v
+--------+ +----------+
| Finny  | | Assess-  |
| Content| | ment     |
| Recom. | | Engine   |
+--------+ +----+-----+
                |
           +----+----+
           |         |
           v         v
    +-----------+ +--------+
    | ElevenLabs| | Written|
    | Voice Quiz| | Quiz   |
    +-----------+ +--------+
           |         |
           v         v
    +------------------+
    | XP Engine        |
    | (RuneScape Curve)|
    +--------+---------+
             |
             v
    +------------------+
    | Credential System|
    | Levels 0-99      |
    +--------+---------+
             |
             v
    +------------------+
    |    Lovable       |
    |  Full-Stack App  |
    +------------------+
```

## Pipeline Summary

**INGEST** --> **VALIDATE** --> **STRUCTURE** --> **TEST** --> **CERTIFY**

1. Content enters from any source
2. White Circle validates every claim before it touches the knowledge graph
3. Verified claims map to skill tree nodes with prerequisites
4. Assessments test mastery at the user's current level
5. XP accumulates on exponential curve
6. Credentials issued, maintained through spaced repetition, decay if abandoned

## Conflict Resolution

```
CONFLICT DETECTED
       |
       v
White Circle AI classifies:
       |
       +---> TYPE 1: ERROR
       |     One source is factually wrong.
       |     --> Correct answer exists
       |     --> Flag the error, teach the truth
       |
       +---> TYPE 2: LEGITIMATE DEBATE
             Multiple valid perspectives exist.
             --> No single "right answer"
             --> Understanding the tension IS the knowledge
             --> Becomes steelman challenge material
```

## Assessment Tiers

| Tier | Levels | Assessment Types |
|------|--------|-----------------|
| Novice | 1-15 | Multiple choice |
| Apprentice | 16-30 | Short answer, explain in own words |
| Journeyman | 31-50 | Case studies, scenario analysis |
| Adept | 51-70 | Comparative analysis, debate identification |
| Expert | 71-85 | Steelman defense, Socratic voice debate |
| Master | 86-92 | Teach-back, framework creation, human review |
| Grandmaster | 93-99 | Novel edge cases, original contribution, expert panel |
