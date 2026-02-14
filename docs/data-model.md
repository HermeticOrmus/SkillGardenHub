# SkillGarden Data Model

## Core Entities

### 1. User

```
User {
  id: UUID
  name: string
  learning_style: enum [visual, auditory, reading, kinesthetic]
  created_at: timestamp
  streak_days: int
  total_xp: bigint
}
```

### 2. Skill

A top-level domain of knowledge.

```
Skill {
  id: UUID
  name: string                    // "AI Finance", "Women in Film"
  description: text
  domain: enum [finance, film, health, games, math, ...]
  icon: string
  created_by: UUID (User)
}
```

### 3. SkillNode

A single concept within a skill tree. Has prerequisites.

```
SkillNode {
  id: UUID
  skill_id: UUID (Skill)
  name: string                    // "Risk Classification"
  description: text
  tier: int [1-6]                 // Novice through Grandmaster
  required_level: int [1-99]      // Min level to attempt
  bloom_level: enum [remember, understand, apply, analyze, evaluate, create]
  node_type: enum [fact, concept, debate]
}
```

### 4. SkillNodePrerequisite

Defines the dependency graph (cut willows before yews).

```
SkillNodePrerequisite {
  node_id: UUID (SkillNode)
  requires_node_id: UUID (SkillNode)
}
```

### 5. UserSkillProgress

Tracks each user's level per skill (the RuneScape curve).

```
UserSkillProgress {
  user_id: UUID (User)
  skill_id: UUID (Skill)
  current_level: int [0-99]
  current_xp: bigint
  peak_level: int [0-99]
  last_activity: timestamp
  decay_rate: float               // XP lost per day of inactivity
}
```

**XP Formula** (RuneScape-inspired exponential):

```
xp_for_level(n) = floor(sum(floor(n + 300 * 2^(n/7)) / 4) for i=1 to n-1)

Level 92 = ~6,517,253 XP = 50% of Level 99
Level 99 = ~13,034,431 XP
```

### 6. Source

Any ingested content (article, panel, podcast, etc).

```
Source {
  id: UUID
  user_id: UUID (User)
  source_type: enum [article, panel, podcast, youtube, textbook, claude_chat, conversation]
  title: string
  raw_content: text
  processed_at: timestamp
  trust_score: float [0-1]        // White Circle overall score
}
```

### 7. Claim

A discrete assertion extracted from a source.

```
Claim {
  id: UUID
  source_id: UUID (Source)
  content: text                   // "90% of startups must comply by 2027"
  claim_type: enum [fact, opinion, statistic, prediction]
  verification_status: enum [verified, uncertain, invalid, outdated]
  trust_score: float [0-1]
  mapped_skill_id: UUID (Skill)
  mapped_node_id: UUID (SkillNode)
  xp_value: int                   // How much XP this claim awards
}
```

### 8. ClaimValidation (White Circle)

The truth gate record for each claim.

```
ClaimValidation {
  id: UUID
  claim_id: UUID (Claim)
  source_credibility: float [0-1]
  factual_accuracy: float [0-1]
  ai_fidelity: float [0-1]       // Did Claude's extraction introduce errors?
  conflict_type: enum [none, error, legitimate_debate]
  validation_method: enum [automated, human_review]
  validated_by: string            // "white_circle" or Perle reviewer ID
  validated_at: timestamp
}
```

### 9. DebateCluster

When White Circle detects legitimate disagreement.

```
DebateCluster {
  id: UUID
  topic: string
  common_ground: text
  key_tension: text
  open_questions: text
  skill_id: UUID (Skill)
  node_id: UUID (SkillNode)
}
```

### 10. Perspective

One side of a debate.

```
Perspective {
  id: UUID
  debate_id: UUID (DebateCluster)
  position: string
  core_argument: text
  evidence_strength: enum [strong, moderate, weak, mixed]
  supporting_claims: UUID[] (Claim)
}
```

### 11. Assessment

A quiz, challenge, or evaluation.

```
Assessment {
  id: UUID
  skill_id: UUID (Skill)
  node_id: UUID (SkillNode)
  assessment_type: enum [multiple_choice, short_answer, scenario, voice_debate, steelman, teach_back, expert_review]
  bloom_level: enum [remember, understand, apply, analyze, evaluate, create]
  difficulty_level: int [1-99]
  question_content: text
  xp_reward: int
  xp_multiplier: float
}
```

### 12. UserAssessmentResult

```
UserAssessmentResult {
  id: UUID
  user_id: UUID (User)
  assessment_id: UUID (Assessment)
  score: float [0-100]
  xp_earned: int
  response_content: text
  response_type: enum [text, voice]
  graded_by: enum [ai, human, both]
  feedback: text
  completed_at: timestamp
}
```

### 13. Credential

The verifiable micro-skill certification.

```
Credential {
  id: UUID
  user_id: UUID (User)
  skill_id: UUID (Skill)
  credential_level: int [0-99]
  tier_name: string               // "Adept", "Expert", etc
  issued_at: timestamp
  last_validated: timestamp
  is_active: boolean              // False if decayed
  verification_url: string
}
```

### 14. SpacedRepetitionSchedule

```
SpacedRepetitionSchedule {
  id: UUID
  user_id: UUID (User)
  claim_id: UUID (Claim)
  next_review: timestamp
  interval_days: int
  ease_factor: float
  repetition_count: int
}
```

## Entity Relationship Diagram

```
User ||--o{ UserSkillProgress : tracks
User ||--o{ Source : ingests
User ||--o{ UserAssessmentResult : completes
User ||--o{ Credential : earns
User ||--o{ SpacedRepetitionSchedule : follows

Skill ||--o{ SkillNode : contains
Skill ||--o{ UserSkillProgress : "leveled in"
Skill ||--o{ Assessment : tests
Skill ||--o{ Credential : certifies

SkillNode ||--o{ SkillNodePrerequisite : requires
SkillNode ||--o{ Claim : "mapped to"
SkillNode ||--o{ DebateCluster : hosts
SkillNode ||--o{ Assessment : evaluates

Source ||--o{ Claim : contains
Claim ||--o{ ClaimValidation : "validated by"

DebateCluster ||--o{ Perspective : presents
Perspective ||--o{ Claim : supports

Assessment ||--o{ UserAssessmentResult : produces
Claim ||--o{ SpacedRepetitionSchedule : schedules
```

## XP and Level Calculations

| Level | Total XP | Tier | Assessment Types |
|-------|----------|------|-----------------|
| 1-15 | 0 - 2,411 | Novice | Multiple choice |
| 16-30 | 2,411 - 13,363 | Apprentice | Short answer, explain in own words |
| 31-50 | 13,363 - 101,333 | Journeyman | Case studies, scenario analysis |
| 51-70 | 101,333 - 737,627 | Adept | Comparative analysis, debate identification |
| 71-85 | 737,627 - 3,258,594 | Expert | Steelman defense, Socratic voice debate |
| 86-92 | 3,258,594 - 6,517,253 | Master | Teach-back, framework creation, human review |
| 93-99 | 6,517,253 - 13,034,431 | Grandmaster | Novel edge cases, original contribution, expert panel |
